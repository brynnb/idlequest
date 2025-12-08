# WebTransport Local Development Setup (IdleQuest + Go Server)

This document explains how the IdleQuest client talks to the Go world server via **WebTransport** in local development. It is heavily based on the `eqrequiem` reference project and captures all the moving parts that took days to get working.

---

## Goals

- Use **WebTransport over HTTP/3** between the React client (Vite on port 5173) and the Go server.
- Avoid Chrome TLS / cert errors while still using **certificate pinning** (`serverCertificateHashes`).
- Mirror the working setup from **eqrequiem** so that future changes can cross-reference that codebase.

---

## High-Level Architecture

Local dev consists of three cooperating pieces:

- **Go world server** (`server-go`)

  - Runs WebTransport on **UDP port 443** at path `/eq`.
  - Runs HTTPS on **TCP port 443** for `/online`, `/playercount`, etc.
  - Runs a small **HTTP hash server on port 7100** (`/hash`) that returns the SHA‑256 hash of the current TLS certificate.

- **Vite dev server** (React client, port 5173)

  - Serves the IdleQuest frontend.
  - Adds a middleware that proxies **`/api/hash` → `http://127.0.0.1:7100/hash`**.
  - This lets the browser fetch the cert hash from the **same origin** as the app, avoiding CORS/TLS headaches.

- **Web client** (`src/utils/webTransportClient.ts`)
  - In local dev (`VITE_LOCAL_DEV === "true"`):
    - Fetches the cert hash from `/api/hash`.
    - Uses `serverCertificateHashes` with that hash.
    - Connects WebTransport to `https://127.0.0.1/eq`.

---

## Certificates: Why mkcert Was Not Enough

Initially we tried using **mkcert** to generate a `localhost` certificate and pinning it via `serverCertificateHashes`. Chrome still rejected the WebTransport handshake with errors like:

- `ERR_CERT_COMMON_NAME_INVALID`
- `QUIC_TLS_CERTIFICATE_UNKNOWN`
- `CERTIFICATE_VERIFY_FAILED`

Even after trusting the mkcert root CA, Chrome remained unhappy. The key issue is a WebTransport constraint:

> WebTransport with `serverCertificateHashes` only works when the certificate has a **short validity period** (14 days or less).

mkcert generates certs valid for **years**, so Chrome refuses to use them with certificate pinning.

### Final approach

For **local dev** we now:

- Generate a **short‑lived, self‑signed certificate** in code (10‑day validity).
- Start a hash server on port **7100** that exposes the SHA‑256 hash of that certificate at `/hash`.
- Use that hash in the client’s `serverCertificateHashes`.

This is exactly how eqrequiem works.

Key code (server-go, `internal/cert/cert.go`):

- `GenerateCertAndStartServer()`

  - Generates an ECDSA self‑signed certificate valid for `start .. start+10 days`.
  - Computes `sha256(cert.Leaf.Raw)`.
  - Calls `runHTTPServer(7100, hash)` which:
    - Starts a plain HTTP server on port 7100.
    - Serves the hash as base64 at `/hash`.

- `LoadTLSConfig()`
  - Reads `eqgo_config.json` via `config.Get()` and checks `Local`.
  - If `Local == true` (default):
    - Logs: `Local mode: generating dynamic short-lived certificate for WebTransport`.
    - Calls `GenerateCertAndStartServer()`.
    - Uses the generated cert for all TLS (WebTransport + HTTPS).
  - In non‑local mode, it falls back to embedded `key.pem` (for future production use).

---

## Go Server: WebTransport on UDP 443

File: `server-go/internal/server/server.go`

### Binding UDP 443 and serving WebTransport

- `StartServer()` now:
  - Loads TLS via `cert.LoadTLSConfig()` (dynamic cert in local mode).
  - Binds UDP on **port 443** using `listenUDP(443)` and stores the `UDPConn` on the server struct.
  - Configures `quic.Config` for WebTransport.
  - Creates a `wtMux` and registers `"/eq"` → `s.makeEQHandler()`.
  - Builds `s.wtServer = &webtransport.Server{ H3: http3.Server{ TLSConfig: wtTLSConfig, EnableDatagrams: true, QUICConfig: quicConf, Handler: wtMux }, CheckOrigin: ... }`.
  - Starts the regular HTTPS server via `startHTTPServer(tlsConf)`.
  - Starts WebTransport with `s.wtServer.Serve(udpConn)`.

In logs you should see:

```text
WebTransport bound to UDP port: 443
Starting WebTransport server on UDP port 443 (HTTP/3)
Starting HTTPS server on TCP port 443
Starting HTTPS Alt-Svc server on TCP port 8443
```

### HTTP/HTTPS endpoints

`startHTTPServer(tlsConf *tls.Config)`:

- Uses `http.NewServeMux()` for HTTPS (port 443).
- Registers:
  - `/register`, `/code` (Discord auth), etc.
  - REST dev helpers: `/api/items/`, `/api/zones/byZoneId/`.
  - `/online` → basic health check.
  - `/playercount` → active session count.
- Listens on TCP `:443` using `tls.NewListener` with `tlsConf`.
- Also starts a secondary **HTTPS Alt‑Svc** server on TCP `:8443` that just sets:

  ```http
  Alt-Svc: h3=":8443"; ma=86400
  ```

  This advertises HTTP/3 support on UDP 8443 if needed.

### WebTransport handler

`makeEQHandler()`:

- Handles `/eq` requests.
- Logs:

  ```text
  Received /eq request from 127.0.0.1:xxxxx
  Request method: CONNECT, URL: https://127.0.0.1/eq
  CheckOrigin called for: 127.0.0.1
  Accepted new session N
  ```

- Calls `s.wtServer.Upgrade(rw, r)` to upgrade to a WebTransport session.
- Tracks sessions, opens control streams, handles datagrams, etc.

When WebTransport is working you’ll see logs like the above followed by session cleanup after inactivity:

```text
ctrl read len error (sess 1): timeout: no recent network activity
Cleaned up session 1
```

---

## Vite Dev Server: `/api/hash` Proxy

File: `vite.config.ts`

To match eqrequiem, the IdleQuest Vite dev server:

- Imports `defineConfig` from `vitest/config` (to allow the `test` property).
- Registers a custom plugin `hashProxyPlugin()` that:
  - Hooks `configureServer` and installs middleware.
  - If `req.url` starts with `/api/hash`:
    - Performs `fetch("http://127.0.0.1:7100/hash")`.
    - Streams the text response back to the client.
    - Sets `Content-Type: text/plain`.

This means the browser only ever calls:

```ts
const hashResponse = await fetch("/api/hash");
```

from `http://localhost:5173`, and Vite takes care of talking to the Go hash server over **HTTP** (no TLS involved).

This avoids CORS and TLS trust problems entirely for the hash fetch.

---

## Client: `webTransportClient.ts`

File: `src/utils/webTransportClient.ts`

### Env flags

At the top:

- `IS_LOCAL_DEV = import.meta.env.VITE_LOCAL_DEV === "true";`
- `WT_SERVER_URL = import.meta.env.VITE_WT_SERVER_URL || (IS_LOCAL_DEV ? "https://127.0.0.1/eq" : "https://localhost:8443/eq");`
- Optional legacy env: `VITE_WT_CERT_HASH` as a fallback for non‑local deployments.

`.env` for local dev contains:

```env
VITE_USE_WEBTRANSPORT=true
VITE_LOCAL_DEV=true
# VITE_WT_SERVER_URL=https://127.0.0.1/eq
# VITE_WT_CERT_HASH=
```

### Hash fetching + pinning

In `WebTransportClient.connect()`:

- If already connected, returns early.
- Builds an `opts` object for the WebTransport constructor.
- In **local dev** (`IS_LOCAL_DEV`):

  ```ts
  const hashResponse = await fetch("/api/hash");
  const hashB64 = await hashResponse.text();
  const hash = b64ToBytes(hashB64); // Uint8Array, length 32
  opts.serverCertificateHashes = [{ algorithm: "sha-256", value: hash.buffer }];
  serverUrl = "https://127.0.0.1/eq";
  ```

- Logs: `WebTransport: fetched cert hash from /api/hash, using serverCertificateHashes`.
- In **non‑local** mode, if `VITE_WT_CERT_HASH` is set and decodes to 32 bytes, it uses that as the pinned hash instead.

### Connecting

Finally:

```ts
this.transport = new WebTransport(serverUrl, opts);
this.transport.closed.then(...);
await this.transport.ready;
this.controlStream = await this.transport.createBidirectionalStream();
this.isConnected = true;
...
console.log("WebTransport connected to Go server");
```

In Chrome’s console, a successful sequence looks like:

```text
WebTransport: fetched cert hash from /api/hash, using serverCertificateHashes
WebTransport: connecting https://127.0.0.1/eq
WebTransport connected to Go server
```

If you see `Opening handshake failed` or `CERTIFICATE_UNKNOWN`, it usually means:

- Wrong certificate hash.
- Certificate validity > 14 days (mkcert, old cert, etc.).
- Not actually talking to the dynamic hash server.

---

## Step-by-Step: How to Run This Locally

1. **Ensure DB is running**

   - Start `akk-stack` MariaDB or your configured MySQL.
   - Confirm `server-go/internal/config/eqgo_config.json` points to the right DB and has `"local": true`.

2. **Start the Go server**

   From repo root:

   ```bash
   npm run server:go
   ```

   You should see logs similar to:

   ```text
   Connected to database successfully
   Local mode: generating dynamic short-lived certificate for WebTransport
   Starting hash server on port 7100
   WebTransport bound to UDP port: 443
   WT certificate SHA-256 (base64): <some base64 hash>
   Starting WebTransport server on UDP port 443 (HTTP/3)
   Starting HTTPS server on TCP port 443
   Starting HTTPS Alt-Svc server on TCP port 8443
   ```

3. **Start Vite dev server**

   From repo root:

   ```bash
   npm run dev
   ```

   (Or whatever command you normally use to run the client.)

4. **Open the client in Chrome**

   - Navigate to `http://localhost:5173`.
   - Open DevTools → Console, filter by `WebTransport`.

5. **Verify logs**

   In the browser console you should see:

   - `WebTransport: fetched cert hash from /api/hash, using serverCertificateHashes`
   - `WebTransport: connecting https://127.0.0.1/eq`
   - `WebTransport connected to Go server`

   In the Go server logs you should see:

   ```text
   Received /eq request from 127.0.0.1:xxxxx
   Request method: CONNECT, URL: https://127.0.0.1/eq
   CheckOrigin called for: 127.0.0.1
   Accepted new session 1
   ```

6. **Ignore expected noise in dev**

   - React StrictMode may cause **double connection attempts**, so you might see one success and one failure (`No connection` when trying to create a stream on an already-closed transport). This is mostly harmless.
   - `getZoneNPCs not yet migrated to WebTransport` just means some data paths still use REST fallbacks.

---

## Common Failure Modes & Fixes

- **`QUIC_TLS_CERTIFICATE_UNKNOWN` or `CERTIFICATE_VERIFY_FAILED`**

  - Ensure the server is using the **dynamic** short‑lived cert (look for `Local mode: generating dynamic short-lived certificate for WebTransport` in logs).
  - Make sure the client fetches from `/api/hash` (Vite proxy), not `https://127.0.0.1/api/hash`.

- **`Opening handshake failed` immediately**

  - Usually incorrect `serverUrl` / port mismatch.
  - Confirm the client is connecting to `https://127.0.0.1/eq` and the server bound UDP port 443.

- **No `/eq` logs in Go server**

  - WebTransport handshake is failing before reaching the handler (likely cert or port issue).
  - Check Chrome console for more detailed QUIC/TLS error codes.

- **`/api/hash` returns 502 from Vite**
  - Go hash server on port 7100 is not running or not reachable.
  - Verify Go server logs include `Starting hash server on port 7100`.

---

## How This Mirrors eqrequiem

Key similarities with the `eqrequiem` reference client/server:

- Both generate **short‑lived ECDSA certificates** in code.
- Both run a separate hash server on **port 7100** that serves `sha256(cert.Leaf.Raw)` at `/hash`.
- Both have the JS client fetch a hash via `/api/hash` on the **Vite dev server**, which proxies to the Go hash server.
- Both connect WebTransport to `https://127.0.0.1/eq` with `serverCertificateHashes` configured using that hash.

The primary difference is structural: IdleQuest’s Go server began with mkcert / embedded cert support and a different WebTransport bootstrap, so this document captures the additional steps needed to align with eqrequiem’s proven setup.
