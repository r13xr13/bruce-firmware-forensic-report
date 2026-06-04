# CVE/CWE Mapping for Bruce Firmware Vulnerabilities

## Overview
This document maps each identified attack vector in the Bruce firmware ecosystem to its corresponding CWE (Common Weakness Enumeration) identifiers and tracks CVE assignment status.

## Attack Vectors and CWE Mapping

### AV-001: HTTP App Store Delivery (No TLS, No Integrity)
**Location:** `src/core/settings.cpp:1688` - `http.begin("http://ghp.iceis.co.uk/service/appstore/")`
**Public Repo:** emericklaw/App-Store - `App Store.js` lines 18-19

| CWE ID | Name | Description | Impact | CVE Status |
|--------|------|-------------|--------|------------|
| CWE-319 | Cleartext Transmission of Sensitive Information | App Store downloads scripts/themes via HTTP with no encryption. All code, metadata, and installed version data transmitted in plaintext. | MITM attackers can intercept, modify, or inject malicious code. Credentials, device info, and executed code exposed. | No existing CVE - Request assignment |
| CWE-345 | Insufficient Verification of Data Authenticity | No code signing, no checksum verification, no signature validation on downloaded scripts. App Store accepts any JSON and executes downloaded code. | Supply chain compromise - attacker controlling ghp.iceis.co.uk can push malicious updates to all Bruce devices. No integrity checks on 59+ apps from 10+ sources. | No existing CVE - Request assignment |
| CWE-494 | Download of Code Without Integrity Check | App Store downloads and executes JavaScript/MJS code from HTTP endpoints. No cryptographic signatures, no hash verification, no trusted root of trust. | Remote code execution on all Bruce devices. Attacker can push arbitrary code via compromised App Store server or MITM. | No existing CVE - Request assignment |

### AV-002: Fake Sleep / Radios Always On (ALL Hardware)
**Location:** `src/core/powerSave.cpp` - `sleepModeOn()`, `src/core/mykeyboard.cpp` - `goToDeepSleep()`
**Affects:** ALL boards running Bruce firmware or bmorcelli launcher - not just Reaper

| CWE ID | Name | Description | Impact | CVE Status |
|--------|------|-------------|--------|------------|
| CWE-276 | Incorrect Default Permissions | Device enters 'fake sleep' where display turns off but WiFi/BLE/CC1101/NRF24 radios remain active. No user indication device is still transmitting/receiving. | Device appears off but continues network communication, BLE advertising, RF listening. Enables covert tracking, data exfiltration, remote command reception. | No existing CVE - Request assignment |
| CWE-921 | Storage of Sensitive Information in Mechanism without Access Control | During fake sleep, device continues to process WiFi/BLE/RF traffic with no authentication. Network credentials, captured data remain accessible via active radios. | Persistent attack surface during user-perceived 'off' state. Credentials in bruce.conf accessible via active WiFi/BLE. | No existing CVE - Request assignment |

### AV-003: MJS Interpreter Sandbox Bypass (require = Global Lookup)
**Location:** `src/modules/bjs_interpreter/globals_js.cpp:298-309` - `native_require()`

| CWE ID | Name | Description | Impact | CVE Status |
|--------|------|-------------|--------|------------|
| CWE-269 | Improper Privilege Management | MJS interpreter's require() performs global namespace lookup instead of sandboxed module resolution. Scripts can access any global variable/function including native ESP32 APIs. | Sandbox escape - untrusted App Store scripts can access filesystem, network, GPIO, Bluetooth, RF hardware directly. Full device compromise via malicious script. | No existing CVE - Request assignment |
| CWE-284 | Improper Access Control | No module sandboxing - require() returns references to native modules (storage, wifi, display, keyboard, etc.) allowing unrestricted hardware access. | Any installed script gains full hardware control. No principle of least privilege. | No existing CVE - Request assignment |
| CWE-94 | Improper Control of Generation of Code (Code Injection) | App Store downloads and executes arbitrary JavaScript. MJS interpreter evaluates code with full privileges. No code signing or execution policy. | Arbitrary code execution via App Store. Malicious app/theme = full device control. | No existing CVE - Request assignment |

### AV-004: Built-in Reverse Shell (BruceShell AP + TCP/23 + Web UI)
**Location:** `src/modules/reverseShell/reverseShell.cpp`

| CWE ID | Name | Description | Impact | CVE Status |
|--------|------|-------------|--------|------------|
| CWE-287 | Improper Authentication | Open WiFi AP "BruceShell" (channel 1, no password) with TCP server on port 23 and web UI for command execution. No authentication required. | Anyone within WiFi range gets full shell access to device. Persistent backdoor enabled by default. | No existing CVE - Request assignment |
| CWE-306 | Missing Authentication for Critical Function | Reverse shell provides unauthenticated command execution interface. | Unrestricted device control, persistence, lateral movement. | No existing CVE - Request assignment |
| CWE-798 | Use of Hard-coded Credentials | Default AP name "BruceShell", default web UI accessible without credentials. | Predictable attack surface across all deployed devices. | No existing CVE - Request assignment |

### AV-005: Plaintext Credential Storage (/bruce.conf)
**Location:** `src/core/settings.cpp`, `src/modules/bjs_interpreter/storage_js.cpp`

| CWE ID | Name | Description | Impact | CVE Status |
|--------|------|-------------|--------|------------|
| CWE-256 | Plaintext Storage of a Password | /bruce.conf contains WiFi passwords, API keys, and other secrets in cleartext. | Any script with storage module access (all scripts) can read all credentials. | No existing CVE - Request assignment |
| CWE-312 | Cleartext Storage of Sensitive Information | Stored secrets have no encryption, no access controls, no integrity protection. | Credential theft, network pivoting, persistence via modified configs. | No existing CVE - Request assignment |

### AV-006: Supply Chain Compromise (59 Apps, 10+ Sources, No Signatures)
**Location:** App Store catalog at `ghp.iceis.co.uk/service/appstore/`

| CWE ID | Name | Description | Impact | CVE Status |
|--------|------|-------------|--------|------------|
| CWE-829 | Inclusion of Functionality from Untrusted Control Sphere | App Store pulls 59 apps from 10+ GitHub sources without verification. Any compromised repo = all devices pwned. | Single compromised upstream repo compromises entire fleet. No supply chain security controls. | No existing CVE - Request assignment |
| CWE-494 | Download of Code Without Integrity Check | Apps downloaded and executed without signatures, checksums, or reproducible build verification. | Supply chain attack vector with massive blast radius. | No existing CVE - Request assignment |

### AV-007: GhostStrats Steganography (Encrypted Payload in Theme Images)
**Location:** Themes/GhostStrats/*.png (14 files)

| CWE ID | Name | Description | Impact | CVE Status |
|--------|------|-------------|--------|------------|
| CWE-506 | Embedded Malicious Code | 14 PNG files show LSB matching steganography (p=0.49-0.52). Encrypted payload. Filename `key_phase2_VnhtlHnpvkc.png` maps to JS interpreter icon. | Covert signaling channel. Encrypted payload likely keyed to future App Store update. | No existing CVE - Request assignment |
| CWE-656 | Reliance on Security Through Obscurity | Steganographic payload hidden in theme images delivered via App Store. No user visibility, no audit trail. | Undetectable persistent mechanism. Activation dependent on external key delivery. | No existing CVE - Request assignment |

### AV-008: Server Divergence (Unpublished v2 vs Public v0.1.1)
**Location:** `ghp.iceis.co.uk` (live) vs `github.com/emericklaw/App-Store` (public)

| CWE ID | Name | Description | Impact | CVE Status |
|--------|------|-------------|--------|------------|
| CWE-829 | Inclusion of Functionality from Untrusted Control Sphere | Server runs unpublished v2 with board detection, commit-hash downloads, self-labeling as `BruceDevices/App-Store` (no such repo exists). Public repo frozen at v0.1.1 since Nov 2025. | Users audit public code but run different code. Maintainer has no visibility into production server behavior. | No existing CVE - Request assignment |
| CWE-922 | Insecure Storage of Sensitive Information | Server self-identifies as official BruceDevices org but source is personal account. No code review process for server changes. | Trust confusion - devices trust "official" source that doesn't exist publicly. | No existing CVE - Request assignment |

## CVE Request Recommendations

Based on the analysis, the following CVE assignments should be requested:

| CVE Request | Attack Vectors Covered | Priority |
|-------------|------------------------|----------|
| CVE-2026-XXXX | AV-001: HTTP App Store delivery (CWE-319, CWE-345, CWE-494) | Critical |
| CVE-2026-XXXX | AV-002: Fake sleep on ALL hardware (CWE-276, CWE-921) | Critical |
| CVE-2026-XXXX | AV-003: MJS sandbox bypass (CWE-269, CWE-284, CWE-94) | Critical |
| CVE-2026-XXXX | AV-004: Built-in reverse shell (CWE-287, CWE-306, CWE-798) | High |
| CVE-2026-XXXX | AV-005: Plaintext credential storage (CWE-256, CWE-312) | High |
| CVE-2026-XXXX | AV-006: Supply chain compromise (CWE-829, CWE-494) | Critical |
| CVE-2026-XXXX | AV-007: GhostStrats steganography (CWE-506, CWE-656) | Medium |
| CVE-2026-XXXX | AV-008: Server divergence (CWE-829, CWE-922) | High |

## Evidence References

All evidence is documented in:
- `FORENSIC_AUDIT.md` - Full technical audit with source code references
- `BRUCE_STORY.md` - Narrative walkthrough of discovery process
- `external/App-Store/` - Archived emericklaw/App-Store public repo (v0.1.1)
- `external/Bruce-3762afa/` - Archived emericklaw/Bruce@3762afa5cfda7a68e9ff7223a4dbfa9077927e29

## Notes

1. **Deep Sleep is broken on ALL hardware running Bruce firmware or the bmorcelli launcher** - not just the Reaper board. The `DEEPSLEEP_WAKEUP_PIN` is undefined (-1) by default across the codebase. Any board without explicit pin definition in its board configuration is affected.

2. The App Store server at `ghp.iceis.co.uk` runs unpublished code (v2) that diverges significantly from the public `emericklaw/App-Store` repo (v0.1.1, frozen Nov 2025). The server identifies as `BruceDevices/App-Store` but no such public repository exists.

3. All 8 attack vectors combine to create a complete exploit chain: MITM App Store HTTP -> malicious script -> sandbox bypass -> full hardware access -> fake sleep persistence -> credential exfiltration -> reverse shell persistence.
