# Live Probe Evidence — Bruce App Store Server

> **Date:** 2026-06-05
> **Target:** `http://ghp.iceis.co.uk/service/appstore/`
> **Method:** HTTP/HTTPS probes from external network

---

## 1. Server Divergence (AV-007)

| Metric | Public Repo (`external/App-Store/`) | Live Server (`ghp.iceis.co.uk`) |
|--------|--------------------------------------|----------------------------------|
| Tagged version | v0.1.1 | v2 (unversioned, self-identifies as v1.0.1) |
| Size | 24,595 bytes (754 lines) | 10,821 bytes (2 lines, minified) |
| Format | Readable source code | Minified/obfuscated |
| Board detection | [X]  Not present | [V]  `require("device"); q.getBoard()` |
| Commit-hash downloads | [X]  Not present | [V]  Metadata includes `commit` fields |
| Local caching | [X]  Basic | [V]  `/BruceAppStore/cache/` with `lastUpdated.json` |
| Self-attribution | `emericklaw/App-Store` | `BruceDevices/App-Store` (WARNING) (no such repo exists) |
| Minified | No | Yes |

**Verdict: [V]  SERVER DIVERGENCE CONFIRMED** — The live server runs code that has never been published to the public GitHub repository.

---

## 2. Infrastructure

| Property | Value | Source |
|----------|-------|--------|
| IPv4 addresses | `104.21.57.101`, `172.67.162.240` | `dig ghp.iceis.co.uk` |
| CDN | Cloudflare | `Server: cloudflare` header |
| Backend | Express.js | `X-Powered-By: Express` header |
| HTTPS available | [V]  HTTP/2 200 on port 443 | `https://ghp.iceis.co.uk/service/appstore/` |
| Firmware uses HTTPS | [X]  No — uses `http://` | `bruce-firmware/core/settings.cpp:1712` |
| Cache status | `DYNAMIC` (Cloudflare) | `cf-cache-status: DYNAMIC` header |
| ETag | `W/"2a45-lzBrCZej81kCmpLl7AIiSBEYE4E"` | Response header |

---

## 3. App Store Catalog (as of 2026-06-05)

- **8 categories:** Audio, Games, Infrared, RF, Themes, Tools, Utilities, WiFi
- **59 total apps** across 10+ GitHub repos
- **Upstream fetch failures** confirmed: WiFi Brute Force returns errors
- **Self-updating App Store**: App Store appears in its own catalog (Tools, v1.0.1)

---

## 4. Captured Files

| File | Source | Size |
|------|--------|------|
| `appstore-v2-minified.js` | `GET /service/appstore/` | 10,821 bytes |
| `categories.json` | `GET /service/main/releases/categories.json` | 948 bytes |
| `category-tools.json` | `GET /service/main/releases/category-tools.min.json` | — |
| `category-wifi.json` | `GET /service/main/releases/category-wifi.min.json` | — |
| `category-themes.json` | `GET /service/main/releases/category-themes.min.json` | — |
| `response-headers.txt` | `HEAD /service/appstore/` | 20 lines |
| `dns-resolution.txt` | `dig ghp.iceis.co.uk` | 2 IPs |

---

## 5. Verification Status

```
AV-001: HTTP App Store  ─── [V]  Source-confirmed + live probe
AV-002: Fake Sleep      ─── [V]  Source-confirmed
AV-003: Sandbox Bypass  ─── [V]  Source-confirmed
AV-004: Reverse Shell   ─── [V]  Source-confirmed
AV-005: Plaintext Creds ─── [V]  Source-confirmed
AV-006: GhostStrats     ─── [P]  Requires binary analysis
AV-007: Server Divergence ─ [P]  Via live probe (evidence captured)
AV-008: C2 Infra        ─── [P]  Requires further research
```

*Generated from live HTTP probes on 2026-06-05*
