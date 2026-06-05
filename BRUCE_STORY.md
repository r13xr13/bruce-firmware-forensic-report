# Bruce Firmware: What I Found and How I Got There
**Affects:** Every board running Bruce firmware or the bmorcelli launcher

I was working on a fix for a hardware variant that runs Bruce firmware. I went into the source code and started noticing things about the wider Bruce firmware ecosystem that I was not expecting. One thing led to another, and I ended up mapping out a supply chain attack chain, finding a steganographic signaling system, profiling the developers in the ecosystem, and tracing a contributor's infrastructure back ten years through public certificate logs.

These findings are about the Bruce firmware project as a whole. The device I was working on was just the door I walked through.

Here's what I found and the road I took to find it.


## Where I Started

The first thing I noticed was in the source code. settings.cpp, line 1688:

```
http.begin("http://ghp.iceis.co.uk/service/appstore/");
```

Plain HTTP. No TLS. No certificate validation. The distribution channel for JavaScript code that runs on a device designed for RF attacks -- a device that can store WiFi passwords, captured portal creds, WPA handshakes, even credit card numbers from RFID scans -- rides over cleartext HTTP on port 80.

That was the thread I pulled. And the whole thing unraveled.

Three big findings came out of reading the source code:

**First, the App Store runs over plain HTTP with no integrity checks.** Anyone on the same WiFi, your ISP, a compromised DNS, any hop between the device and the server -- they could swap what code the device downloads. No hash verification. No signature check. No way to tell the real App Store from a malicious one.

**Second, the device never actually turns off.** The screen turns off. The CPU drops from 240 to 80 MHz. But the WiFi stays connected, BLE keeps advertising, Sub-GHz keeps listening, NRF24 stays powered, IR and RFID stay active. The device stays on the network. It keeps scanning and collecting. It just looks dead. There is no code path that truly powers the device down through the menu. Deep Sleep is broken on every board that does not define DEEPSLEEP_WAKEUP_PIN -- which is most of them. This affects all boards running Bruce firmware.

**Third, the JavaScript interpreter has no sandbox.** The require() function -- which lets scripts access storage, wifi, subghz, ble, gpio, badusb -- is a single line that does a global property lookup. No whitelist. No permissions. No capability checks. Any script downloaded from the App Store could read every file on the device, write new files, hit any network host, transmit on any RF frequency.

These three things together create a real problem. A device that never truly sleeps. That can exfiltrate stored data over the network. That receives unverified code from a remote server. For whoever controls that server, or whoever can sit between the device and that server, it's an effective persistent access tool.

## Then I Looked at What the Server Serves

I fetched the URL to see what it returned. The server sent back minified JavaScript. I deobfuscated it and found something interesting: the public GitHub repository for the App Store (emericklaw/App-Store) has 10 commits, last updated November 2025, frozen at version 0.1.1. The server runs something different -- let's call it v2. It has board detection, app filtering by hardware, local caching to the device's filesystem, and commit-hash-based downloads from GitHub. Features that were never published in the public repo.

The server code identifies itself as "BruceDevices/App-Store" -- but no such repository exists on GitHub. The real repo lives under a personal account. The server calls itself something that sounds official but has no public source to audit.

Behind the scenes, the server is an Express.js proxy that fetches files from GitHub repos using commit hashes. Whoever controls that backend controls which commit hashes get served. Which means they control what code reaches every device that connects.

I catalogued the whole ecosystem from the public data: 59 apps across 8 categories, pulled from 10+ GitHub sources. Every one of those repos is a potential supply chain entry point.

The App Store can even update itself. It appears in its own catalog under Tools. When the server's metadata changes, every device will download and overwrite its own App Store on the next sync. No confirmation. No changelog.

## The GhostStrats Rabbit Hole

Somewhere in the Themes category, I noticed GhostStrats. Created by Matt Emerick-Law on February 12, 2026. The very first commit to the official theme repository. I downloaded the files from the public GitHub repo and started looking at the filenames.

The filenames were not random. They encode messages. Five different encoding systems, all saying the same thing: "safety is an illusion." Binary on the GPS icon. Base64 on the BLE icon. Hex on the WiFi icon. Leetspeak on the RF icon. Leetspeak again on the files icon. And "I Love Bruce" in ROT-23 on the config icon.

That's deliberate. Someone encoded these messages in five different ways across different icons. This is not a coincidence.

But five of the filenames resist decoding entirely. The most interesting one is mapped to the JavaScript interpreter icon: key_phase2_VnhtlHnpvkc.png. The prefix "key_phase2" is clear. The suffix uses a cipher I haven't cracked. The icon it maps to is the JS interpreter -- the component with no sandbox and full device access.

I ran statistical analysis on the 14 PNG files from the public repo and found LSB matching steganography in all 14 files. The edge/non-edge pixel LSB difference is 0.49 to 0.52 across every file. Natural images show near-zero difference. That's a textbook LSB matching signature.

The extracted data is encrypted. I tried over 100 key variations -- XOR, AES-ECB, AES-CBC, Vigenere, ROT variants, hash derivatives, you name it. Every attempt produces output with an ASCII ratio around 0.36. That's consistent with properly encrypted data.

The 1MB WAV file and 1.1MB GIF file from the public repo were clean. The WAV's echo pattern turned out to be normal stereo audio characteristics. The GIF was made with ezgif.com -- standard tool, no hidden data.

What this looks like: GhostStrats is set up as a staged mechanism. The steganography is real. The payload is encrypted in the files. The key hasn't been deployed yet. Phase 2 -- suggested by the filename -- likely arrives as an App Store script update. The same person controls the App Store server and created this theme.

I checked the App Store script again recently. Its hash hasn't changed. The trigger hasn't been pulled. But the mechanism exists and it's waiting.

## Following the Developer Trail

Matt Emerick-Law kept coming up. I started with the App Store code, which runs on his personal domain. But the more I looked at public records, the more I found.

He's not just the App Store guy. His public GitHub commits show he's contributed to the core Bruce firmware repository. He's worked on the JavaScript interpreter itself -- the component that executes App Store code with no sandbox. Power management UI. The theming system. BLE scanning. The App Store update mechanisms. He wrote code that loads and executes themes. He controls the server that distributes themes. He created the GhostStrats theme.

One person controls the code delivery channel, the execution environment, the theme with the encrypted payload, and the update mechanism. That's an architectural concentration of power regardless of intent.

His public commit signature shows his email. LinkedIn shows his professional background. Printables shows his 3D printing hobby -- Voron 2.4, Klipper with Mainsail, 62+ LEDs on his printer. He attends EMF Camp. He's into Meshtastic and ESP32 stuff.

No credentials leaked from any of his 78 public repos. The guy is careful with operational security, even if his code deployment security tells a different story.

## The Infrastructure Trail

The domain iceis.co.uk is the nerve center. Registered around 2010. I pulled the certificate transparency logs -- public records of every SSL certificate issued for the domain -- and found 66 historical subdomains dating back to 2015.

The public record tells a story:

2015: VMware vSphere. Someone running virtual machines.

2016: TurnKey Linux virtual appliances. Webmin on port 12321. Adminer on port 12322. Web Shell on port 12320. Confirmed via Wayback Machine snapshots. This was a learning phase -- TurnKey LAMP appliances are what you install when you're learning self-hosting.

Then the jump to Docker. Public DNS records show Portainer, Traefik, Grafana, Zabbix, n8n, a private Docker registry, Pi-hole. Someone who grew their skills and infrastructure over a decade.

The DNS records show the current setup runs through Cloudflare, with an origin server at an IONOS UK address. The backoffice wildcard DNS setup points every *.backoffice subdomain to the same origin -- suggesting Home Assistant, Node-RED, MQTT, Zigbee2MQTT, and ESPHome all run on the same server as the App Store infrastructure.

There's an n8n instance at n8n.iceis.co.uk. The public `/rest/settings` endpoint shows version 2.10.4 running in development mode, SMTP not configured, community nodes enabled.

There's a Linode address that turned out to be an SMTP2GO tracking domain for transactional email -- a side quest that ended in "not what I thought."

There's an AWS API Gateway subdomain, locked down, unknown purpose.

And there's a developer named 9dl who contributed the Reverse Shell module to Bruce firmware. German, alias "Fourier," runs a small pentest hardware store at zerotrace.pw. His public GitHub shows 32 repos, all red-team tools. He also created Bruce-C2 -- a companion tool, now archived. Zero social graph connection to any BruceDevices maintainer in public GitHub data. No mutual follows. No shared orgs. His contributions are additive and auditable. Moderate risk, watchlist level -- not an active threat.



## So What Does This All Mean?

Let me be clear about what the public record shows and what it doesn't.

**The public record shows:**
- The App Store distributes code over plain HTTP with no integrity checks
- The JavaScript interpreter has no sandbox
- Sleep mode keeps all radios active while the display is off
- Deep Sleep is broken on all hardware
- GhostStrats contains LSB matching steganography in all 14 PNG files
- The extracted data is encrypted and can't be decrypted with keys I tried
- The key_phase2 filename maps to the JS interpreter icon
- One person controls the App Store server and has direct commits to the JS interpreter
- The server runs unversioned code that diverges from the public repository
- The App Store can silently update itself
- 57 of 59 apps in the ecosystem are clean -- GhostStrats is the only anomaly
- n8n runs in dev mode with a publicly accessible settings endpoint

**The public record does not show:**
- Whether any of this was done with malicious intent
- Whether the GhostStrats steganography contains executable payloads (it's encrypted)
- Whether any active exploitation has occurred
- Whether 9dl's Bruce-C2 has been used against real users

The question of intent is the hardest one. The combination of flaws is coherent: an insecure delivery channel, an execution environment with no restrictions, a misleading power management system, and a theme with deliberate encoding -- all associated with the same person in some way. But coherence is not proof. The GhostStrats messages could be signaling or someone being clever with filenames. The vulnerabilities could be designed for exploitation or just hobby-project corner-cutting that happens to align in a dangerous way.

I don't know which it is. The technical capability is undeniably present in the code and architecture. The exploit chain is architecturally complete except for one missing piece: the decryption key for the steganography hasn't shown up in any public data. As of June 4, 2026, no trigger has appeared.

## The Bottom Line

The Bruce firmware v1.15 ecosystem has encrypted steganography in a theme, an insecure code delivery channel, a code execution environment with no security controls, a misleading power management system, a contributor who controls the entire code distribution pipeline, and a developer who authored a companion C2 tool.

The architectural attack chain is complete -- except for one missing piece. The decryption key for the GhostStrats steganography hasn't appeared in the public App Store code.

The code and architecture show what could be possible. Whether it was designed that way intentionally, and whether it ever gets used, are questions the public record alone can't answer.
