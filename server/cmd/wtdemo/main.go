package main

import (
    "crypto/tls"
    "encoding/json"
    "fmt"
    "html/template"
    "io"
    "log"
    "net/http"
    "time"

    "github.com/quic-go/quic-go/http3"
    "github.com/quic-go/webtransport-go"
)

const (
    certPath = "cert.pem"
    keyPath  = "key.pem"
)

var indexTmpl = template.Must(template.New("index").Parse(indexHTML))

func main() {
    tlsConf := mustTLSConfig()

    mux := http.NewServeMux()
    var wtServer webtransport.Server
    mux.HandleFunc("/connect", func(w http.ResponseWriter, r *http.Request) {
        session, err := wtServer.Upgrade(w, r)
        if err != nil {
            log.Printf("upgrade error: %v", err)
            return
        }
        log.Printf("session opened from %s", r.RemoteAddr)
        go handleSession(session)
    })

    wtServer = webtransport.Server{
        H3: http3.Server{
            Addr:      ":8443",
            TLSConfig: tlsConf,
            Handler:   mux,
        },
        CheckOrigin: func(r *http.Request) bool {
            return true
        },
    }

    // launch WebTransport in background
    go func() {
        log.Println("WebTransport (h3) listening on dev.brynnbateman.com:8443")
        if err := wtServer.ListenAndServe(); err != nil {
            log.Fatalf("WT server error: %v", err)
        }
    }()

    // HTTP/1.1+TLS front end on :443 to serve the page and advertise h3
    httpMux := http.NewServeMux()
    addAltSvc := func(w http.ResponseWriter) {
        w.Header().Set("Alt-Svc", "h3=\":8443\"; ma=86400")
    }

    httpMux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
        addAltSvc(w)
        w.Header().Set("Content-Type", "text/html; charset=utf-8")
        _ = indexTmpl.Execute(w, nil)
    })

    httpServer := &http.Server{
        Addr:      ":443",
        Handler:   httpMux,
        TLSConfig: tlsConf,
    }

    log.Println("HTTPS front-end listening on https://dev.brynnbateman.com (Alt-Svc → :8443)")
    log.Println("Open https://dev.brynnbateman.com/ in Chrome and click Open Session")

    if err := httpServer.ListenAndServeTLS(certPath, keyPath); err != nil {
        log.Fatalf("HTTPS server error: %v", err)
    }
}

func mustTLSConfig() *tls.Config {
    cert, err := tls.LoadX509KeyPair(certPath, keyPath)
    if err != nil {
        log.Fatalf("failed to load TLS files: %v", err)
    }
    return &tls.Config{
        Certificates: []tls.Certificate{cert},
        NextProtos:   []string{"h3"},
    }
}

type message struct {
    Text string `json:"text"`
}

func handleSession(sess *webtransport.Session) {
    defer func() {
        _ = sess.CloseWithError(0, "bye")
        log.Printf("session closed")
    }()

    for {
        stream, err := sess.AcceptStream(sess.Context())
        if err != nil {
            if err == io.EOF {
                return
            }
            log.Printf("accept stream error: %v", err)
            return
        }

        go func(s webtransport.Stream) {
            defer s.Close()

            buf := make([]byte, 4096)
            n, err := s.Read(buf)
            if err != nil && err != io.EOF {
                log.Printf("stream read error: %v", err)
                return
            }

            ts := time.Now().Format("15:04:05")
            payload := message{Text: fmt.Sprintf("[%s] %s", ts, string(buf[:n]))}
            encoded, _ := json.Marshal(payload)

            if _, err := s.Write(encoded); err != nil {
                log.Printf("stream write error: %v", err)
            }

            log.Printf("echoed message: %s", payload.Text)
        }(stream)
    }
}

const indexHTML = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>WebTransport Dev Echo</title>
    <style>
      body { font-family: system-ui, sans-serif; margin: 2rem; }
      #log { border: 1px solid #ccc; padding: 1rem; height: 260px; overflow: auto; white-space: pre-wrap; }
      button { padding: 0.6rem 1.2rem; margin-right: 0.5rem; }
      input { padding: 0.6rem; width: 240px; }
    </style>
  </head>
  <body>
    <h1>WebTransport Dev Echo</h1>
    <div id="status">Idle</div>
    <div id="log"></div>
    <div>
      <input id="text" placeholder="Type a message" />
      <button id="open">Open Session</button>
      <button id="send" disabled>Send</button>
    </div>

    <script>
      const logEl = document.getElementById('log');
      const statusEl = document.getElementById('status');
      const txt = document.getElementById('text');
      const btnOpen = document.getElementById('open');
      const btnSend = document.getElementById('send');

      let transport;
      let streamWriter;
      let reader;

      function log(line) {
        const atBottom = logEl.scrollTop + logEl.clientHeight >= logEl.scrollHeight - 5;
        logEl.textContent += line + '\n';
        if (atBottom) logEl.scrollTop = logEl.scrollHeight;
      }

      async function openSession() {
        try {
          statusEl.textContent = 'Opening…';
          const url = new URL('connect', window.location.href);
          url.port = '8443';
          transport = new WebTransport(url.toString());
          await transport.ready;
          statusEl.textContent = 'Connected';
          log('[client] session ready');

          const stream = await transport.createBidirectionalStream();
          streamWriter = stream.writable.getWriter();
          reader = stream.readable.getReader();
          readLoop();

          btnSend.disabled = false;
        } catch (err) {
          statusEl.textContent = 'Failed';
          log('[client] open failed: ' + err);
        }
      }

      async function readLoop() {
        try {
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            const text = new TextDecoder().decode(value);
            log('[server] ' + text);
          }
        } catch (err) {
          log('[client] read error: ' + err);
        }
      }

      btnOpen.onclick = () => {
        if (!transport || transport.closed) {
          openSession();
        }
      };

      btnSend.onclick = async () => {
        if (!streamWriter) return;
        const msg = txt.value.trim();
        if (!msg) return;
        txt.value = '';
        log('[client] ' + msg);
        await streamWriter.write(new TextEncoder().encode(msg));
      };

      txt.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') btnSend.click();
      });
    </script>
  </body>
</html>`
