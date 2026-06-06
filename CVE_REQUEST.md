# CVE Request Preparation

This document contains pre-filled submission data for requesting CVE IDs from
[MITRE's CNA of Last Resort (CNA-LR)](https://mitre.github.io/mitre-cve-roles/cve-id-request/)
for each vulnerability discovered in the Bruce firmware ecosystem.

## How to Submit

1. Go to <https://mitre.github.io/mitre-cve-roles/cve-id-request/>
2. Click "Login with Google" (lower-left corner)
3. Click "Reserve One CAN" button
4. Fill in the details from the template below for each CVE
5. Click "Submit Request"
6. Wait for acceptance email (typically 1-7 days)
7. Update the CVE ID in [CVE_MAPPING.md](./CVE_MAPPING.md)

> You do NOT need to be the maintainer of the affected project to request a CVE.
> MITRE's CNA-LR handles vulnerabilities in products where the vendor is not their
> own CNA. Both BruceDevices/firmware and emericklaw/App-Store are eligible.

---

## CVE-2026-XXXX-1: App Store RCE Chain

### Request
| Field | Value |
|-------|-------|
| **Vendor or project** | BruceDevices |
| **Product** | Bruce firmware |
| **Version** | All versions up to v1.15 (including bmorcelli launcher and all forks) |
| **Problem type** | CWE-319 (Cleartext Transmission), CWE-345 (Insufficient Verification), CWE-494 (Download Without Integrity Check), CWE-269 (Improper Privilege Management), CWE-94 (Code Injection) |

### Description
The Bruce firmware App Store downloads and executes JavaScript/MJS code over
plain HTTP with no TLS encryption, no code signing, no checksum verification,
and no signature validation. An attacker with network access (MITM position)
can intercept, modify, or inject arbitrary JavaScript code that is executed
on all Bruce devices. Once delivered, the MJS (Micro JavaScript) interpreter's
`require()` function performs a global namespace lookup instead of sandboxed
module resolution, allowing untrusted scripts to access native ESP32 APIs
(filesystem, network, GPIO, Bluetooth, RF hardware) with no restrictions.
Together these vulnerabilities form a complete remote code execution chain:
MITM or compromised App Store server delivers malicious script -> sandbox
bypass -> full device compromise.

### Impact
Remote code execution on all ESP32 devices running Bruce firmware or the
bmorcelli launcher. An attacker can read WiFi credentials, API keys, captured
credit card data (RFID scans), WPA handshakes, and persist via the reverse
shell or by writing to the device filesystem.

### Reference
<https://github.com/r13xr13/bruce-firmware-forensic-report/blob/main/TRACEABILITY_MATRIX.md>

Source files:
- <https://github.com/r13xr13/bruce-firmware-forensic-report/blob/main/bruce-firmware/core/settings.cpp#L1712>
  (HTTP fetch URL, no TLS)
- <https://github.com/r13xr13/bruce-firmware-forensic-report/blob/main/bruce-firmware/modules/bjs_interpreter/globals_js.cpp#L298-L309>
  (require() as global namespace lookup, sandbox bypass)

### CVSS 3.1
**Score: 9.8 (Critical)**
Vector: AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H

---

## CVE-2026-XXXX-2: Fake Sleep / Radios Always On

### Request
| Field | Value |
|-------|-------|
| **Vendor or project** | BruceDevices |
| **Product** | Bruce firmware |
| **Version** | All versions (affects ALL boards) |
| **Problem type** | CWE-276 (Incorrect Default Permissions), CWE-921 (Storage Without Access Control) |

### Description
Bruce firmware enters a "fake sleep" state where the display turns off but
WiFi, BLE, CC1101, and NRF24 radios remain active. There is no user indication
the device is still transmitting or receiving. The device continues network
communication, BLE advertising, RF listening, and data collection while
appearing to be powered off. This affects ALL boards running Bruce firmware
or the bmorcelli launcher -- not just specific hardware variants.

### Impact
Device appears off but remains a persistent network/RF presence. Enables
covert tracking, data exfiltration, and remote command reception during the
user-perceived "off" state. Credentials in bruce.conf remain accessible via
active WiFi/BLE interfaces.

### Reference
<https://github.com/r13xr13/bruce-firmware-forensic-report/blob/main/TRACEABILITY_MATRIX.md>

Source files:
- <https://github.com/r13xr13/bruce-firmware-forensic-report/blob/main/bruce-firmware/core/powerSave.cpp>
  (sleepModeOn() implementation)
- <https://github.com/r13xr13/bruce-firmware-forensic-report/blob/main/bruce-firmware/core/mykeyboard.cpp#L1367-L1369>
  (goToDeepSleep() -- deep sleep pin undefined by default)

### CVSS 3.1
**Score: 7.6 (High)**
Vector: AV:A/AC:L/PR:N/UI:N/S:U/C:H/I:L/A:N

---

## CVE-2026-XXXX-3: Built-in Reverse Shell (BruceShell AP)

### Request
| Field | Value |
|-------|-------|
| **Vendor or project** | BruceDevices |
| **Product** | Bruce firmware |
| **Version** | All versions |
| **Problem type** | CWE-287 (Improper Authentication), CWE-306 (Missing Authentication), CWE-798 (Hard-coded Credentials) |

### Description
Bruce firmware includes a built-in reverse shell module that creates an open
WiFi access point named "BruceShell" (channel 1, no password) with a TCP
server on port 23 and a web UI for command execution. No authentication is
required at any layer -- the WiFi AP has no password, the TCP server has no
handshake, and the web interface provides unauthenticated command execution.
The backdoor is enabled by default, predictable across all deployed devices.

### Impact
Anyone within WiFi range can connect to the "BruceShell" AP and obtain
unrestricted shell access to the device. Enables persistent remote access,
data exfiltration, and potential lateral movement into networks that trust
the device.

### Reference
<https://github.com/r13xr13/bruce-firmware-forensic-report/blob/main/TRACEABILITY_MATRIX.md>

Source file:
- <https://github.com/r13xr13/bruce-firmware-forensic-report/blob/main/bruce-firmware/modules/reverseShell/reverseShell.cpp>
  (full reverse shell implementation)

### CVSS 3.1
**Score: 8.8 (High)**
Vector: AV:A/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H

---

## CVE-2026-XXXX-4: Plaintext Credential Storage

### Request
| Field | Value |
|-------|-------|
| **Vendor or project** | BruceDevices |
| **Product** | Bruce firmware |
| **Version** | All versions |
| **Problem type** | CWE-256 (Plaintext Storage of a Password), CWE-312 (Cleartext Storage of Sensitive Information) |

### Description
Bruce firmware stores WiFi passwords, API keys, device configuration, and
other secrets in cleartext in the `/bruce.conf` file on the device filesystem.
Any JavaScript script with access to the storage module (which is all scripts,
since there is no permission system) can read all credentials without
restriction. The storage module exposes full filesystem read/write/delete
capabilities with no access control.

### Impact
Any App Store script or malicious code that reaches the device can exfiltrate
WiFi network credentials, API keys, and device configuration. Network
pivoting, credential reuse attacks, and persistent access are possible.

### Reference
<https://github.com/r13xr13/bruce-firmware-forensic-report/blob/main/TRACEABILITY_MATRIX.md>

Source files:
- <https://github.com/r13xr13/bruce-firmware-forensic-report/blob/main/bruce-firmware/core/config.h#L62>
  (configuration file definition)
- <https://github.com/r13xr13/bruce-firmware-forensic-report/blob/main/bruce-firmware/core/settings.cpp>
  (settings read/write routines)
- <https://github.com/r13xr13/bruce-firmware-forensic-report/blob/main/bruce-firmware/modules/bjs_interpreter/storage_js.cpp>
  (MJS storage module -- full filesystem access)

### CVSS 3.1
**Score: 8.1 (High)**
Vector: AV:L/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:N

---

## CVE-2026-XXXX-5: Supply Chain Compromise

### Request
| Field | Value |
|-------|-------|
| **Vendor or project** | BruceDevices |
| **Product** | Bruce App Store |
| **Version** | All versions (v0.1.x through v2) |
| **Problem type** | CWE-829 (Inclusion from Untrusted Control Sphere), CWE-494 (Download Without Integrity Check) |

### Description
The Bruce App Store aggregates 59 applications from 10+ GitHub repositories
without cryptographic verification, code signing, checksums, or reproducible
build validation. The App Store server fetches code from upstream repos and
serves it to devices over HTTP with no integrity checks. Any compromised
upstream repository, account takeover, or supply chain attack against any of
the 10+ source repos results in arbitrary code execution on all downstream
Bruce devices. The current catalog includes apps maintained by the hardware
vendor (BruceDevices/firmware), the App Store author (emericklaw), and
multiple community contributors with varying security postures and review
processes.

### Impact
Single upstream compromise delivers malicious JavaScript to the entire fleet
of deployed Bruce devices. No mechanism exists for users to verify the
authenticity or integrity of downloaded code. Server-side substitution
(adding/modifying/removing apps) is undetectable by devices.

### Reference
<https://github.com/r13xr13/bruce-firmware-forensic-report/blob/main/FORENSIC_AUDIT.md>
(see App Store catalog analysis)

### CVSS 3.1
**Score: 9.6 (Critical)**
Vector: AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H

---

## CVE-2026-XXXX-6: GhostStrats Steganography

### Request
| Field | Value |
|-------|-------|
| **Vendor or project** | BruceDevices |
| **Product** | Bruce App Store (GhostStrats theme) |
| **Version** | N/A (theme images in App Store catalog) |
| **Problem type** | CWE-506 (Embedded Malicious Code), CWE-656 (Reliance on Security Through Obscurity) |

### Description
Fourteen PNG theme image files distributed through the Bruce App Store as
the "GhostStrats" theme show statistically significant LSB matching
steganography (p=0.49-0.52, indicating non-random data embedding). The images
contain encrypted payload content. One filename,
`key_phase2_VnhtlHnpvkc.png`, maps directly to the MJS JavaScript interpreter
icon, suggesting the payload is phase-keyed to a specific device module.
Additional filenames encode messages in multiple formats: Base64
("safety is an illusion"), hexadecimal, leetspeak, and ROT-23
("I Love Bruce"). The steganographic payloads are delivered through the
untrusted App Store channel and executed in the unsandboxed MJS environment.

### Impact
Covert communication channel delivering encrypted payloads hidden in theme
images. Payload activation appears to depend on an external key (phase 2).
The combination of steganographic delivery + sandbox bypass MJS interpreter
creates an undetectable remote code execution mechanism.

### Reference
<https://github.com/r13xr13/bruce-firmware-forensic-report/blob/main/FORENSIC_AUDIT.md>
(see GhostStrats steganography section)

Evidence files:
- <https://github.com/r13xr13/bruce-firmware-forensic-report/tree/main/evidence/poc>
  (PoC sandbox bypass demo)

### CVSS 3.1
**Score: 7.5 (High)**
Vector: AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:N/A:N

---

## CVE-2026-XXXX-7: Server Divergence (Unpublished v2)

### Request
| Field | Value |
|-------|-------|
| **Vendor or project** | emericklaw (emericklaw/App-Store) |
| **Product** | Bruce App Store server |
| **Version** | v2 (unpublished) vs v0.1.1 (public, frozen since Nov 2025) |
| **Problem type** | CWE-829 (Inclusion from Untrusted Control Sphere), CWE-922 (Insecure Storage of Sensitive Information) |

### Description
The Bruce App Store server at ghp.iceis.co.uk runs unpublished v2 code that
diverges significantly from the public emericklaw/App-Store repository (tagged
v0.1.1, frozen since November 2025). The live server delivers minified/
obfuscated JavaScript (10.8 KB, 2 lines) with features not present in the
public repo: active board detection via `require("device")` + `q.getBoard()`,
commit-hash-based download tracking in metadata, server-side caching via
`/BruceAppStore/cache/` with invalidation, and self-identification as
"BruceDevices/App-Store" -- a GitHub organization that does not exist. The
public repository has 10 commits and has not been updated since November 2025.
Auditors, users, and security researchers reviewing the public code are
evaluating a different application than what devices actually execute.

### Impact
Trust confusion: users and security researchers audit public v0.1.1 source
but devices execute unpublished v2. No code review or accountability for
server-side changes. The maintainer misrepresents the server as belonging to
the official BruceDevices GitHub organization when the actual source is in a
personal account (emericklaw).

### Reference
<https://github.com/r13xr13/bruce-firmware-forensic-report/blob/main/evidence/EVIDENCE_SUMMARY.md>

Evidence files:
- <https://github.com/r13xr13/bruce-firmware-forensic-report/blob/main/evidence/live-probes/appstore-v2-minified.js>
  (minified v2 server response)
- <https://github.com/r13xr13/bruce-firmware-forensic-report/blob/main/evidence/live-probes/response-headers.txt>
  (server headers)

### CVSS 3.1
**Score: 9.1 (Critical)**
Vector: AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:N

---

## Summary

| CVE Request | Attack Vectors | Severity | File |
|---|---|---|---|
| CVE-2026-XXXX-1 | AV-001 + AV-003 (RCE chain) | Critical (9.8) | settings.cpp L1712, globals_js.cpp L298-309 |
| CVE-2026-XXXX-2 | AV-002 (Fake sleep) | High (7.6) | powerSave.cpp, mykeyboard.cpp L1367-1369 |
| CVE-2026-XXXX-3 | AV-004 (Reverse shell) | High (8.8) | reverseShell.cpp |
| CVE-2026-XXXX-4 | AV-005 (Plaintext creds) | High (8.1) | config.h L62, settings.cpp, storage_js.cpp |
| CVE-2026-XXXX-5 | AV-006 (Supply chain) | Critical (9.6) | App Store catalog (59 apps) |
| CVE-2026-XXXX-6 | AV-007 (GhostStrats) | High (7.5) | Theme PNG files |
| CVE-2026-XXXX-7 | AV-008 (Server divergence) | Critical (9.1) | Live v2 vs public v0.1.1 |

---

*Prepared from the forensic audit at
<https://github.com/r13xr13/bruce-firmware-forensic-report>*
