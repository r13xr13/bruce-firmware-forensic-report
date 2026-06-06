# Bruce Firmware Forensic Audit

Forensic audit documenting **8 attack vectors** in the Bruce firmware ecosystem --
the App Store delivery over plain HTTP, the fake-sleep circuit that leaves radios
on, the unsandboxed JavaScript interpreter, the built-in reverse shell, plaintext
credential storage, GhostStrats steganographic themes, server-side divergence
between public source and live code, and potential C2 infrastructure.

**What this is:** A source-verified, evidence-backed security audit. Every claim
that can be checked against source code IS checked -- the
[TRACEABILITY_MATRIX.md](TRACEABILITY_MATRIX.md) maps each finding to its exact
file and line number so you can verify the audit yourself.

**Who this is for:**
- **Users** -- [BRUCE_STORY.md](BRUCE_STORY.md) explains what's happening in plain language
- **Researchers** -- [FORENSIC_AUDIT.md](FORENSIC_AUDIT.md) has all the technical detail and source refs
- **Developers** -- the full source tree is included under [bruce-firmware/](bruce-firmware/)
  so patches can be proposed alongside the evidence

---

## Ecosystem Attack Surface

```
                    PLAIN HTTP (no TLS, no integrity)
                +--------------------------------------+
                |                                      |
                v                                      |
+-----------------------------+     +------------------------------+
|    ESP32 Running Bruce FW   |     |  App Store Server            |
|                             |     |  ghp.iceis.co.uk             |
|  [AV-001] HTTP fetch -------+---->+  /service/appstore/          |
|  [AV-003] MJS interp eval   |     |                              |
|  [AV-002] Fake sleep radios |     |  Public: v0.1.1 (754 lines)  |
|  [AV-004] Reverse shell AP  |     |  Live:   v2   (2 lines, min) |
|  [AV-005] Cleartext creds   |     |  [AV-007] Server divergence  |
|                             |     |  [AV-008] C2 infra?          |
+-----------------------------+     +------------------------------+
        |                                       ^
        |  [AV-006] GhostStrats theme           |
        |  (steganographic payload in PNG)      |
        |                                       |
        +------ MJS require() sandbox ----------+
               bypass: any script gets
               full filesystem + network + RF
```

---

## Repository Contents

| File / Directory | Purpose |
|---|---|
| [`FORENSIC_AUDIT.md`](./FORENSIC_AUDIT.md) | Full technical audit -- source analysis, network mapping, remediation |
| [`BRUCE_STORY.md`](./BRUCE_STORY.md) | Narrative walkthrough in plain language |
| [`CVE_MAPPING.md`](./CVE_MAPPING.md) | CWE/CVE mapping and assignment status |
| [`TRACEABILITY_MATRIX.md`](./TRACEABILITY_MATRIX.md) | **Every claim mapped to exact source file:line -- verify the audit yourself** |
| [bruce-firmware/](./bruce-firmware/) | Bruce firmware source tree (v1.15) |
| [external/App-Store/](./external/App-Store/) | Archived public App Store repo (emericklaw/App-Store v0.1.1) |
| [external/Bruce-3762afa/](./external/Bruce-3762afa/) | Archived Bruce fork (commit 3762afa5) |
| [evidence/](./evidence/) | Live probe captures, PoC demos, analysis |

---

## Quick Start

### For users: Start here
**[BRUCE_STORY.md](BRUCE_STORY.md)** -- a plain-language walkthrough of the discoveries
and what they mean for device owners.

### For researchers: Dive into the evidence
**[FORENSIC_AUDIT.md](FORENSIC_AUDIT.md)** -- full technical analysis with source
code excerpts. Use the
**[TRACEABILITY_MATRIX.md](TRACEABILITY_MATRIX.md)** to jump directly from any
claim to the exact file and line number that backs it up.

### For developers: Read the source
Key source files referenced by attack vector:

| Attach Vector | Key Source Files |
|---|---|
| AV-001: HTTP App Store | [bruce-firmware/core/settings.cpp:1712](bruce-firmware/core/settings.cpp#L1712) |
| AV-002: Fake Sleep | [bruce-firmware/core/powerSave.cpp](bruce-firmware/core/powerSave.cpp), [mykeyboard.cpp:1367-1369](bruce-firmware/core/mykeyboard.cpp#L1367-L1369) |
| AV-003: MJS Sandbox Bypass | [bruce-firmware/modules/bjs_interpreter/globals_js.cpp:298-309](bruce-firmware/modules/bjs_interpreter/globals_js.cpp#L298-L309) |
| AV-004: Reverse Shell | [bruce-firmware/modules/reverseShell/reverseShell.cpp:37,46-50](bruce-firmware/modules/reverseShell/reverseShell.cpp#L37) |
| AV-005: Plaintext Creds | [bruce-firmware/core/config.h:62](bruce-firmware/core/config.h#L62), [settings.cpp](bruce-firmware/core/settings.cpp) |
| AV-006: GhostStrats | [external/App-Store/](external/App-Store/) -- theme images in App Store catalog |
| AV-007: Server Divergence | [evidence/live-probes/](evidence/live-probes/) -- v2 vs v0.1.1 comparison |
| AV-008: C2 Infrastructure | [FORENSIC_AUDIT.md](FORENSIC_AUDIT.md) -- infra mapping |

### For everyone: Check the evidence
- [evidence/live-probes/](evidence/live-probes/) -- raw HTTP responses, headers, DNS from live server
- [evidence/poc/](evidence/poc/) -- working PoC demos (MITM, malicious payload, sandbox bypass)
- [evidence/EVIDENCE_SUMMARY.md](evidence/EVIDENCE_SUMMARY.md) -- analysis of live probe findings

---

## Verification Status

Each claim in this audit is marked with one of:

- **[V]  CONFIRMED** -- verified against source code (click the TRACEABILITY_MATRIX link to jump to the exact line)
- **[X]  UNVERIFIED** -- cannot be confirmed from source alone
- **[P]  PARTIAL** -- requires network probe or binary analysis beyond source review

| Attack Vector | Claims | Source-Verified |
|---|---|---|
| AV-001: HTTP App Store | 3 | [V] 3/3 |
| AV-002: Fake Sleep | 2 | [V] 2/2 |
| AV-003: MJS Sandbox Bypass | 3 | [V] 3/3 |
| AV-004: Reverse Shell | 4 | [V] 4/4 |
| AV-005: Plaintext Credentials | 3 | [V] 3/3 |
| AV-006: GhostStrats Steganography | 2 | [X] 0/2 (binary analysis needed) |
| AV-007: Server-Side Divergence | 2 | [X] 0/2 (confirmed via live probe) |
| AV-008: Exfil / C2 | 1 | [X] 0/1 (requires ongoing monitoring) |
| **Total** | **20** | **[V] 15 confirmed from source** |

---

## Background

While working on a fix for a hardware variant running Bruce firmware, I found that
the device never actually turns off, the App Store runs over plain HTTP with no
integrity checks, and the JavaScript interpreter has no sandbox. I realized I had
to document what I found.

This repository contains my forensic audit of the Bruce firmware ecosystem.
It covers the Bruce firmware, the bmorcelli launcher, and the App Store
infrastructure -- examining security flaws, supply chain risks, and the hidden
mechanisms within the GhostStrats theme.

The Bruce firmware source code is included in the
[bruce-firmware/](bruce-firmware/) directory so that readers can verify my audit
results against the actual source code.

---

## Disclaimer

This work is conducted as public interest research in my capacity as a watchdog
auditor and reporter. I am not trying to harm the Bruce developers or the
community. These issues have existed for years across multiple firmware versions
and affect many deployed devices. The purpose of this audit is to document the
facts so that users can make informed decisions about their devices and so that
the security community has a clear record of the architecture. Responsible
disclosure was not pursued because the issues are long-standing, widely deployed,
and the maintainers have had ample opportunity to address them.

---

**Source reference:** Bruce firmware src v1.15 from firmware-1.15

For questions or comments, feel free to open an issue or contact me directly.

-- Heavy Butter (r13xr13)

---

<div align="center">

**Audit** by [HEAVYBUTTER](https://github.com/r13xr13)

</div>
