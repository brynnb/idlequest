package server

import (
	"context"
	"crypto/sha256"
	"crypto/tls"
	b64 "encoding/base64"
	"encoding/binary"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net"
	"net/http"
	"strconv"
	"strings"
	"time"

	"idlequest/internal/cache"
	"idlequest/internal/cert"
	"idlequest/internal/db"
	items "idlequest/internal/db/items"
	db_zone "idlequest/internal/db/zone"
	"idlequest/internal/discord"
	"idlequest/internal/session"
	"idlequest/internal/world"

	"github.com/quic-go/quic-go"
	"github.com/quic-go/quic-go/http3"
	"github.com/quic-go/webtransport-go"
)

// Server hosts a WebTransport-based world server with both datagrams and a single control stream per session.
type Server struct {
	wtServer       *webtransport.Server
	worldHandler   *world.WorldHandler
	sessionManager *session.SessionManager
	sessions       map[int]*webtransport.Session
	udpConn        *net.UDPConn
	gracePeriod    time.Duration
	debugMode      bool
}

// NewServer constructs a new Server.
func NewServer(dsn string, gracePeriod time.Duration, debugMode bool) (*Server, error) {
	sessionManager := session.NewSessionManager()
	session.InitSessionManager(sessionManager)
	worldHandler := world.NewWorldHandler(sessionManager)

	if err := cache.Init(); err != nil {
		return nil, fmt.Errorf("failed to initialize cache: %w", err)
	}

	return &Server{
		worldHandler:   worldHandler,
		sessionManager: sessionManager,
		sessions:       make(map[int]*webtransport.Session),
		gracePeriod:    gracePeriod,
		debugMode:      debugMode,
	}, nil
}

// StartServer configures TLS, QUIC, HTTP, and begins serving WebTransport.
func (s *Server) StartServer() {
	// TLS
	tlsConf, err := cert.LoadTLSConfig()
	if err != nil {
		log.Printf("failed to load TLS config: %v", err)
		return
	}

	// Bind UDP to port 443 for WebTransport (like eqrequiem)
	// This allows the client to connect to https://127.0.0.1/eq without specifying a port
	udpConn, port, err := listenUDP(443)
	if err != nil {
		log.Printf("UDP listen error on port 443: %v", err)
		return
	}
	s.udpConn = udpConn
	log.Printf("WebTransport bound to UDP port: %d", port)

	// QUIC - increased idle timeout for idle game (not real-time 3D MMO)
	quicConf := &quic.Config{
		MaxStreamReceiveWindow:     4 * 1024 * 1024,
		MaxConnectionReceiveWindow: 16 * 1024 * 1024,
		MaxIncomingStreams:         1000,
		MaxIdleTimeout:             5 * time.Minute, // Longer timeout for idle game
	}

	// Create separate mux for WebTransport
	wtMux := http.NewServeMux()
	wtMux.HandleFunc("/eq", s.makeEQHandler())

	// Configure TLS for WebTransport
	wtTLSConfig := tlsConf.Clone()
	wtTLSConfig.NextProtos = []string{"h3"}

	// Log the SHA-256 (base64) of the leaf certificate so devs can pin it via VITE_WT_CERT_HASH
	if len(wtTLSConfig.Certificates) > 0 && len(wtTLSConfig.Certificates[0].Certificate) > 0 {
		leafDER := wtTLSConfig.Certificates[0].Certificate[0]
		sum := sha256.Sum256(leafDER)
		fmt.Printf("WT certificate SHA-256 (base64): %s\n", b64.StdEncoding.EncodeToString(sum[:]))
		fmt.Println("Set VITE_WT_CERT_HASH to the value above for local dev pinning.")
	} else {
		log.Printf("Warning: no certificate loaded in TLS config; WebTransport will fail.")
	}

	// WebTransport server - no Addr needed since we use Serve() with pre-bound UDP socket
	s.wtServer = &webtransport.Server{
		H3: http3.Server{
			TLSConfig:       wtTLSConfig,
			EnableDatagrams: true,
			QUICConfig:      quicConf,
			Handler:         wtMux,
		},
		CheckOrigin: func(r *http.Request) bool {
			log.Printf("CheckOrigin called for: %s", r.Host)
			return true
		},
	}

	// HTTP handler for OAuth, etc.
	go startHTTPServer(tlsConf)

	// Serve WebTransport on the pre-bound UDP socket (like eqrequiem)
	go func() {
		log.Printf("Starting WebTransport server on UDP port 443 (HTTP/3)")
		if err := s.wtServer.Serve(udpConn); err != nil {
			log.Printf("WebTransport server failed: %v", err)
		}
	}()
}

// makeEQHandler upgrades HTTP to WebTransport and manages session lifecycles.
func (s *Server) makeEQHandler() http.HandlerFunc {
	var nextID int
	return func(rw http.ResponseWriter, r *http.Request) {
		log.Printf("Received /eq request from %s", r.RemoteAddr)
		log.Printf("Request method: %s, URL: %s", r.Method, r.URL.String())
		sess, err := s.wtServer.Upgrade(rw, r)
		if err != nil {
			log.Printf("Upgrade error: %v", err)
			return
		}

		clientIP, _, _ := net.SplitHostPort(r.RemoteAddr)
		params := r.URL.Query()

		// Try reconnect
		var sessObj *session.Session
		if sidStr := params.Get("sid"); sidStr != "0" {
			if sid, e := strconv.Atoi(sidStr); e == nil {
				if existing, e2 := s.sessionManager.GetValidSession(sid, clientIP); e2 == nil {
					log.Printf("Reconnecting session %d from %s", sid, clientIP)
					sessObj = existing
					existing.Messenger = s
					existing.SendData(nil, 0)
				}
			}
		}

		// New session
		if sessObj == nil {
			nextID++
			sid := nextID
			s.sessions[sid] = sess

			// Open a single control stream (bidi)
			ctrl, e := sess.OpenStream()
			if e != nil {
				log.Printf("Failed to open control stream: %v", e)
				sess.CloseWithError(400, "ctrl stream failed")
				return
			}

			log.Printf("Accepted new session %d", sid)
			sessObj = s.sessionManager.CreateSession(s, sid, clientIP, ctrl)

			// Start control stream reader
			go s.handleControlStream(sessObj, ctrl, sid, clientIP)
		}

		// Start datagram reader
		go s.handleDatagrams(sessObj, sess)
	}
}

// handleDatagrams reads incoming datagrams forever.
func (s *Server) handleDatagrams(sessObj *session.Session, sess *webtransport.Session) {
	ctx := context.Background()
	for {
		data, err := sess.ReceiveDatagram(ctx)
		if err != nil {
			log.Printf("datagram recv closed (sess %d): %v", sessObj.SessionID, err)
			s.handleSessionClose(sessObj.SessionID)
			return
		}
		s.worldHandler.HandlePacket(sessObj, data)
	}
}

// handleControlStream parses length-prefixed frames on the single bidi stream.
func (s *Server) handleControlStream(
	sessObj *session.Session,
	ctrl io.ReadWriteCloser,
	sid int,
	clientIP string,
) {
	defer ctrl.Close()
	for {
		// read length prefix
		var lenBuf [4]byte
		if _, err := io.ReadFull(ctrl, lenBuf[:]); err != nil {
			log.Printf("ctrl read len error (sess %d): %v", sid, err)
			s.handleSessionClose(sid)
			return
		}
		n := binary.LittleEndian.Uint32(lenBuf[:])

		// read payload
		payload := make([]byte, n)
		if _, err := io.ReadFull(ctrl, payload); err != nil {
			log.Printf("ctrl read payload error (sess %d): %v", sid, err)
			s.handleSessionClose(sid)
			return
		}

		// Handle Cap'n Proto control stream messages
		s.worldHandler.HandlePacket(sessObj, payload)
		log.Printf("sess %d control (Cap'n Proto) → %d bytes", sid, len(payload))
	}
}

// SendStream writes data to a session's control stream.
func (s *Server) SendStream(sessionID int, data []byte) error {
	sessObj, ok := s.sessionManager.GetSession(sessionID)
	if !ok {
		return fmt.Errorf("session %d not found", sessionID)
	}
	_, err := sessObj.ControlStream.Write(data)
	return err
}

// SendDatagram fires a datagram packet to a client.
func (s *Server) SendDatagram(sessionID int, data []byte) error {
	sess, ok := s.sessions[sessionID]
	if !ok {
		return fmt.Errorf("session %d not found", sessionID)
	}
	if err := sess.SendDatagram(data); err != nil {
		log.Printf("failed to send datagram: %v", err)
		return err
	}
	return nil
}

// handleSessionClose schedules removal after gracePeriod.
func (s *Server) handleSessionClose(sessionID int) {
	s.worldHandler.RemoveSession(sessionID)
	log.Printf("Cleaned up session %d", sessionID)
}

// StopServer tears down all listeners and connections.
func (s *Server) StopServer() {
	if s.wtServer != nil {
		s.wtServer.Close()
	}
	if s.udpConn != nil {
		s.udpConn.Close()
	}
	s.worldHandler.Shutdown()
	if db.GlobalWorldDB != nil {
		db.GlobalWorldDB.DB.Close()
	}
}

// listenUDP binds to the given port.
func listenUDP(port int) (*net.UDPConn, int, error) {
	addr := fmt.Sprintf(":%d", port)
	udpAddr, err := net.ResolveUDPAddr("udp", addr)
	if err != nil {
		return nil, 0, err
	}
	conn, err := net.ListenUDP("udp", udpAddr)
	if err != nil {
		return nil, 0, err
	}
	conn.SetReadBuffer(4 * 1024 * 1024)
	conn.SetWriteBuffer(4 * 1024 * 1024)
	return conn, conn.LocalAddr().(*net.UDPAddr).Port, nil
}

// startHTTPServer serves HTTPS for other endpoints.
func startHTTPServer(tlsConf *tls.Config) {
	mux := http.NewServeMux()
	mux.Handle("/code", corsMiddleware(http.HandlerFunc(discord.DiscordAuthHandler)))
	mux.HandleFunc("/register", registerHandler)

	// Lightweight REST API for local dev fallback (avoids WebTransport/TLS friction)
	mux.Handle("/api/items/", corsMiddleware(http.HandlerFunc(restGetItemByID)))
	mux.Handle("/api/zones/byZoneId/", corsMiddleware(http.HandlerFunc(restGetZoneByZoneID)))

	// /api/hash returns the SHA-256 (base64) of the server certificate for WebTransport pinning
	// This mirrors eqrequiem's hash server approach
	mux.Handle("/api/hash", corsMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if len(tlsConf.Certificates) == 0 || len(tlsConf.Certificates[0].Certificate) == 0 {
			http.Error(w, "No certificate loaded", http.StatusInternalServerError)
			return
		}
		leafDER := tlsConf.Certificates[0].Certificate[0]
		sum := sha256.Sum256(leafDER)
		w.Header().Set("Content-Type", "text/plain")
		w.Write([]byte(b64.StdEncoding.EncodeToString(sum[:])))
	})))

	mux.Handle("/online", corsMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		log.Printf("Received /online request from %s", r.RemoteAddr)
		w.Header().Set("Content-Type", "text/plain")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("Server is online"))
	})))

	mux.Handle("/playercount", corsMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		log.Printf("Received /playercount request from %s", r.RemoteAddr)
		count := session.GetActiveSessionCount()

		type response struct {
			Count int `json:"count"`
		}

		res := response{Count: count}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)

		if err := json.NewEncoder(w).Encode(res); err != nil {
			log.Printf("Error encoding JSON: %v", err)
			http.Error(w, `{"error": "Internal server error"}`, http.StatusInternalServerError)
			return
		}
	})))

	listener, err := net.Listen("tcp", ":443")
	if err != nil {
		log.Printf("HTTPS listen error: %v", err)
		return
	}
	tlsListener := tls.NewListener(listener, tlsConf)
	log.Printf("Starting HTTPS server on TCP port 443")
	go http.Serve(tlsListener, mux)

	// Also start a lightweight HTTPS server on TCP 8443 to advertise Alt-Svc for HTTP/3 on :8443.
	altSvcMux := http.NewServeMux()
	altSvcMux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		// Advertise that this origin supports HTTP/3 on UDP :8443 so that
		// browsers can discover and connect to WebTransport on that port.
		w.Header().Set("Alt-Svc", "h3=\":8443\"; ma=86400")
		w.WriteHeader(http.StatusNoContent)
	})

	altListener, err := net.Listen("tcp", ":8443")
	if err != nil {
		log.Printf("HTTPS Alt-Svc listen error on 8443: %v", err)
		return
	}
	altTLSListener := tls.NewListener(altListener, tlsConf)
	log.Printf("Starting HTTPS Alt-Svc server on TCP port 8443")
	http.Serve(altTLSListener, altSvcMux)
}

// registerHandler is used by internal services.
func registerHandler(w http.ResponseWriter, r *http.Request) {
	if !strings.HasPrefix(r.RemoteAddr, "127.0.0.1:") {
		http.Error(w, "Forbidden", http.StatusForbidden)
		return
	}
	w.Write([]byte("OK"))
}

// restGetItemByID serves GET /api/items/{id}
func restGetItemByID(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}
	path := strings.TrimPrefix(r.URL.Path, "/api/items/")
	if path == "" {
		http.Error(w, "Missing item id", http.StatusBadRequest)
		return
	}
	id, err := strconv.Atoi(path)
	if err != nil || id <= 0 {
		http.Error(w, "Invalid item id", http.StatusBadRequest)
		return
	}
	itm, err := items.GetItemTemplateByID(int32(id))
	if err != nil {
		http.Error(w, "Item not found", http.StatusNotFound)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(itm); err != nil {
		http.Error(w, "Failed to encode JSON", http.StatusInternalServerError)
		return
	}
}

// restGetZoneByZoneID serves GET /api/zones/byZoneId/{zoneidnumber}
func restGetZoneByZoneID(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}
	path := strings.TrimPrefix(r.URL.Path, "/api/zones/byZoneId/")
	if path == "" {
		http.Error(w, "Missing zoneidnumber", http.StatusBadRequest)
		return
	}
	zid, err := strconv.Atoi(path)
	if err != nil {
		http.Error(w, "Invalid zoneidnumber", http.StatusBadRequest)
		return
	}
	ctx := context.Background()
	zone, err := db_zone.GetZoneById(ctx, zid)
	if err != nil {
		http.Error(w, "Zone not found", http.StatusNotFound)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(zone); err != nil {
		http.Error(w, "Failed to encode JSON", http.StatusInternalServerError)
		return
	}
}

// corsMiddleware enables CORS for HTTP endpoints.
func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		w.Header().Set("Access-Control-Max-Age", "86400")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}
