# Bruce Firmware Forensic Audit

While working on a fix for a hardware variant running Bruce firmware, I found that the device never actually turns off, the App Store runs over plain HTTP with no integrity checks, and the JavaScript interpreter has no sandbox. I realized I had to document what I found.

My name does not matter. What matters is that I stood up for the truth about the Bruce firmware ecosystem — and for that I may be seen as a troublemaker. But I cannot stay quiet when I see a device that claims to be off but is actually still on the network, collecting data and ready to run arbitrary code from a remote server.

This repository contains my forensic audit of the Bruce firmware ecosystem. It covers the Bruce firmware, the bmorcelli launcher, and the App Store infrastructure. It examines security flaws, supply chain risks, and the hidden mechanisms within the GhostStrats theme.

The Bruce firmware source code is included in this repository (in the `bruce-firmware/` directory) so that readers can verify my audit results by examining the actual source code referenced in the reports.

---

## Repository Contents

| File / Directory | Purpose |
|---|---|
| [`FORENSIC_AUDIT.md`](./FORENSIC_AUDIT.md) | Full technical audit — source code analysis, network mapping, remediation |
| [`BRUCE_STORY.md`](./BRUCE_STORY.md) | Concise narrative walkthrough of the discoveries |
| [`CVE_MAPPING.md`](./CVE_MAPPING.md) | CVE identifiers & assignment status |
| **[`TRACEABILITY_MATRIX.md`](./TRACEABILITY_MATRIX.md)** | **<-> Every audit claim → exact source file:line — verify the audit yourself** |
| [`bruce-firmware/`](./bruce-firmware/) | Bruce firmware source tree (v1.15 from firmware-1.15) |
| [`external/App-Store/`](./external/App-Store/) | Archived public App Store source (emericklaw/App-Store v0.1.1) |
| [`external/Bruce-3762afa/`](./external/Bruce-3762afa/) | Archived Bruce fork commit 3762afa5 |

---

## How to Use This Repo

### 1. Start with the reports
- **`FORENSIC_AUDIT.md`** — all the technical detail
- **`BRUCE_STORY.md`** — the narrative overview

### 2. Verify each claim using the traceability matrix
**`TRACEABILITY_MATRIX.md`** maps every audit finding to the exact source file and line number. Each entry has a verification status:

- [V]  **CONFIRMED** — claim matches source code
- [P]  **NOT VERIFIABLE FROM SOURCE** — requires network probe or binary analysis

### 3. Read the source directly
Source is under `bruce-firmware/`. Key files by attack vector:

| Attack Vector | Key Source Files |
|---|---|
| AV-001: HTTP App Store | `bruce-firmware/core/settings.cpp` **(line 1712)** |
| AV-002: Fake Sleep | `bruce-firmware/core/powerSave.cpp`, `mykeyboard.cpp` **(line 1367–1369)** |
| AV-003: MJS Sandbox Bypass | `bruce-firmware/modules/bjs_interpreter/globals_js.cpp`, `wifi_js.cpp` |
| AV-004: Reverse Shell | `bruce-firmware/modules/reverseShell/reverseShell.cpp` **(line 37, 46–50)** |
| AV-005: Plaintext Credentials | `bruce-firmware/core/config.h` **(line 62)**, `settings.cpp` |

### 4. Check the external evidence archives
- `external/App-Store/` — the public App Store repo (for comparing against live server behavior)
- `external/Bruce-3762afa/` — a fork for divergence analysis

---

## Quick Status

| Attack Vector | Claims | Source-Verified |
|---|---|---|
| AV-001: HTTP App Store | 3 | [V]  3/3 |
| AV-002: Fake Sleep | 2 | [V]  2/2 |
| AV-003: MJS Sandbox Bypass | 3 | [V]  3/3 |
| AV-004: Reverse Shell | 4 | [V]  4/4 |
| AV-005: Plaintext Credentials | 3 | [V]  3/3 |
| AV-006: GhostStrats Steganography | 2 | [X]  0/2 (binary analysis needed) |
| AV-007: Server-Side Divergence | 2 | [X]  0/2 (live probe needed) |
| AV-008: Exfil / C2 | 1 | [X]  0/1 (live probe needed) |
| **Total** | **20** | **[V]  15 confirmed from source** |

---

## Disclaimer

This work is conducted as public interest research in my capacity as a watchdog auditor and reporter. I am not trying to harm the Bruce developers or the community. These issues have existed for years across multiple firmware versions and affect many deployed devices. The purpose of this audit is to document the facts so that users can make informed decisions about their devices and so that the security community has a clear record of the architecture. Responsible disclosure was not pursued because the issues are long-standing, widely deployed, and the maintainers have had ample opportunity to address them.

---

**Source reference:** Bruce firmware src v1.15 from firmware-1.15

For questions or comments, feel free to open an issue or contact me directly.

-- Heavy Butter (r13xr13)

---

<div align="center">

**Audit** by [HEAVYBUTTER](https://github.com/r13xr13)

</div>
