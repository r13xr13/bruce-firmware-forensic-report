# Bruce Firmware Forensic Audit

I did not want to have to make this repository. I do not get satisfaction from pointing out flaws in open source projects. But when I started looking into the Bruce firmware looking for a fix for the RF Reaper board, I found that the device never actually turns off the App Store runs over plain HTTP with no integrity checks and the JavaScript interpreter has no sandbox I realized I had to document what I found.

My name does not matter. What matters is that I stood up for the truth about the Bruce firmware ecosystem and for that I may be seen as a troublemaker. But I cannot stay quiet when I see a device that claims to be off but is actually still on the network collecting data and ready to run arbitrary code from a remote server.

This repository contains my forensic audit of the Bruce firmware ecosystem. It covers the Bruce firmware the bmorcelli launcher and the App Store infrastructure. It examines security flaws supply chain risks and the hidden mechanisms within the GhostStrats theme.

The Bruce firmware source code is included in this repository (in the bruce-firmware directory) so that readers can verify my audit results by examining the actual source code referenced in the reports.

**Source reference:** Bruce firmware src v1.15 from firmware-1.15

If you want to understand the details of the findings the exploitation chain and the evidence collected please read the two reports included here.

FORENSIC_AUDIT.md is the full technical audit with source code analysis network mapping and remediation suggestions.
BRUCE_STORY.md is a concise narrative that walks through how the discoveries were made and what they mean.

Both reports are written in a first person conversational tone and avoid unnecessary jargon. They are intended for anyone interested in the security of IoT firmware supply chain attacks or reverse engineering.

Please note that the reports are the result of independent research and do not represent the views of any organization or individual mentioned within.

## Disclaimer

This work is conducted as public interest research in my capacity as a watchdog auditor and reporter. I am not trying to harm the Bruce developers or the community. These issues have existed for years across multiple firmware versions and affect many deployed devices. The purpose of this audit is to document the facts so that users can make informed decisions about their devices and so that the security community has a clear record of the architecture. Responsible disclosure was not pursued because the issues are long standing widely deployed and the maintainers have had ample opportunity to address them.

For questions or comments feel free to open an issue or contact me directly.

-- Heavy Butter (r13xr13)

---

<div align="center">

**Audit** by [HEAVYBUTTER](https://github.com/r13xr13)

</div>
