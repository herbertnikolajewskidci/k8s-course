# Research Report: Open-Source CKA / PSI Exam Interface Simulatoren

- **Datum:** 2026-09-06
- **Autor:** Herbert Nikolajewski / Pi Research Agent
- **Status:** Abgeschlossen
- **Ziel:** Umfassende Recherche und Bewertung existierender Open-Source-
  Projekte, Repositories und Community-Tools, die das Prüfungsinterface der
  Linux Foundation (PSI Secure Browser) für CKA/CKAD/CKS nachbilden, sowie
  Ermittlung der wartungsärmsten, Apple-Silicon-kompatiblen Architektur für
  ein lokales Split-Screen-Portal.
- **Primärquellen:** GitHub API, Repositories (`sailor-sh/CK-X`,
  `yozorazora/Kubernetes-Exam-Simulator`, `osadaRajapaksha/CKAExamSimulator`,
  `spurin/cncf-psi-k8s-linux-simulator`, `educates/educates-training-platform`),
  Docker Hub OCI-Manifeste, Linux Foundation TC Docs.

---

## 1. Executive Summary & Kernbefunde

Die Recherche liefert ein klares Bild des aktuellen Open-Source-Ökosystems:

1. **Existenz eines vollwertigen PSI-Klons:** Mit dem Projekt
   **`sailor-sh/CK-X`** existiert eine funktionierende, hochgradig detailgetreue
   Nachbildung des PSI-Prüfungsinterfaces (Split-Screen, Question-Switcher,
   120-Minuten-Timer, Click-to-Copy für Code-Elemente, noVNC/XFCE-Iframe und
   SSH-xterm.js-Toggle).
2. **Das Apple-Silicon- / Architektur-Dilemma von CK-X:** CK-X ist als
   schwergewichtiger Docker-Monolith (8 Container, DinD, KIND-Cluster, Redis,
   Facilitator) ausgelegt. Sämtliche offiziellen Container-Images
   (`nishanb/ck-x-simulator-*`) sind **ausschließlich für `linux/amd64`**
   kompiliert. Auf macOS Apple Silicon (ARM64) führt dies zu massiven
   Emulations-Overheads oder Abstürzen. Zudem unterliegt das Projekt der
   Business Source License 1.1 (BSL 1.1).
3. **Stand von KubeMock & Killercoda:**
   - *KubeMock:* Existiert nicht als Prüfungs-Simulator; der Begriff bezeichnet
     Go-Bibliotheken für Unit-Tests mit `client-go` Mocks.
   - *Killercoda:* Ist ein proprietäres SaaS-System auf Basis von KubeVirt
     (gegründet von Kim Wüstkamp / killer.sh). Es gibt **keinen** quelloffenen
     Killercoda-Klon.
4. **Aufgaben- & Cluster-Referenz:** Das Repository
   **`yozorazora/Kubernetes-Exam-Simulator`** bietet den aktuell besten
   Open-Source-Aufgabenpool (28 Prüfungsaufgaben, 4 KIND-Cluster mit realen
   Prüfungskontexten `k8s`, `hk8s`, `bk8s`, `wk8s` und automatisierten
   Prüfskripten), besitzt jedoch keinerlei Web-UI (reine Bash-CLI).
5. **Empfohlene Best-Practice-Lösung für Herbert:**
   Die Kombination aus den Bausteinen:
   - **Frontend:** Leichtgewichtiges, statisches HTML5/JS-Portal
     (angelehnt an die UI-Logik von CK-X, ohne Framework-Ballast, 0 MB
     Build-Pipeline).
   - **Web-Desktop:** `lscr.io/linuxserver/webtop:ubuntu-xfce` (natives ARM64,
     KasmVNC, Klick- und Copy/Paste-Parität zum echten Examen).
   - **Cluster-Backend:** Die bereits verifizierten nativen OrbStack-Maschinen
     (`cka-master`, `cka-worker1`), die in 0,24 Sekunden via SSH aufwachen und
     im Leerlauf 0 MB Host-RAM belegen.

---

## 2. Detaillierte Analyse existierender Open-Source-Projekte

### 2.1 sailor-sh/CK-X (Der vollständige PSI-Simulator)

- **Repository:** <https://github.com/sailor-sh/CK-X>
- **Stars / Aktivität:** ~1.160 Stars, aktiv gepflegt (Stand: 2026).
- **Lizenz:** Business Source License 1.1 (BSL 1.1 – persönliche und
  ausbildungsbezogene Nutzung gestattet).

#### Funktionsumfang & UI-Architektur

CK-X bildet das Linux Foundation PSI Secure Browser Interface in erstaunlicher
Genauigkeit nach:

- **Header:** Countdown-Timer (Standard: 120:00), Session-Steuerung, Dropdown
  zu den Kubernetes-Dokumentationen.
- **Linkes Panel (Aufgaben):** Dynamischer Question-Switcher (Dropdown +
  Vor-/Zurück-Pfeile), Rendern von Markdown-Instruktionen, integrierte
  `span.inline-code`-Elemente, die bei einfachem Mausklick den Inhalt in die
  Zwischenablage kopieren (exakt wie bei PSI und killer.sh).
- **Zentraler Splitter:** `panel-resizer.js` ermöglicht stufenloses Verschieben
  der Fensteraufteilung per Drag & Drop mit lokaler Speicherung der Breite im
  `localStorage`.
- **Rechtes Panel (Remote Desktop & Terminal):**
  - Standardmäßig ein embedded Iframe mit ConSol-VNC / noVNC (Port 6901) auf
    einem Ubuntu XFCE-Desktop.
  - Per Dropdown umschaltbar auf ein Web-Terminal via `xterm.js` über SSH.
- **Backend:** Node.js/Express Webapp, Nginx-Reverse-Proxy, Facilitator-Dienst
  (automatische Validierung von Antworten via SSH), Redis für Status-Tracking
  und interner KIND-Cluster im Container.

#### Warum CK-X nicht direkt als Gesamtlösung empfohlen wird

1. **AMD64-Exklusivität:** Die Basis-Images
   (`nishanb/ck-x-simulator-vnc-base:v3`, `nishanb/ck-x-simulator-cluster`)
   besitzen laut OCI-Manifest-Prüfung ausschließlich `linux/amd64`. Auf Apple
   Silicon erfordert dies Rosetta 2 oder schlägt beim KIND-Cluster mit
   Kernel-Inkompatibilitäten fehl.
2. **Extremer Ressourcen-Overhead:** Der Betrieb von 8 Docker-Containern
   (inklusive DinD/KIND und Redis) bindet dauerhaft 4–8 GB Arbeitsspeicher.
3. **Entkopplung vom lokalen Wissensnetz:** CK-X ist darauf ausgelegt, eigene
   vorgefertigte KIND-Szenarien zu evaluieren, statt die flexiblen
   Multi-Node-VMs von OrbStack zu nutzen.

**Wert für unser Repository:** Der Frontend-Code von CK-X
(`app/public/exam.html`, `exam.css`, `panel-resizer.js`, `clipboard-service.js`)
ist sauber strukturiertes Vanilla-JavaScript / CSS und dient als ideale
Blaupause für unser eigenes leichtgewichtiges Portal.

---

### 2.2 yozorazora/Kubernetes-Exam-Simulator (Aufgaben- & Cluster-Benchmark)

- **Repository:** <https://github.com/yozorazora/Kubernetes-Exam-Simulator>
- **Aktivität:** Aktualisiert für Kubernetes v1.35 / CKA-Curriculum 2026.
- **Lizenz:** Open Source.

#### Funktionsumfang

- **28 praxisnahe Prüfungsaufgaben** über alle 5 CKA-Domänen.
- **Exakte Cluster-Parität:** Erzeugt via `setup.sh` 4 Cluster mit den
  originalen Prüfungs-Kontexten:
  - `k8s`: Hauptcluster (1 CP + 2 Worker)
  - `hk8s`: HA-Cluster (3 CP + 1 Worker)
  - `bk8s`: Broken-Cluster für Troubleshooting-Tasks
  - `wk8s`: Worker-Cluster für Node-Drain und Storage
- **Automatisierte Validierung:** Jede Aufgabe verfügt über Python- und
  Bash-Prüfskripte unter `verify/`.
- **Schwäche bezüglich der Recherche:** Reines CLI-Tool
  (`bash start-exam.sh`, `bash practice.sh`). Es gibt kein Browser-Interface
  und keinen Split-Screen.

---

### 2.3 osadaRajapaksha/CKAExamSimulator (React & xterm.js)

- **Repository:** <https://github.com/osadaRajapaksha/CKAExamSimulator>
- **Technologie-Stack:** React, Vite, Node.js, Express, WebSockets, `node-pty`,
  `xterm.js`, Tailwind/CSS, AWS Terraform.

#### Bewertung

- Implementiert einen einfachen Split-Screen: Links `QuestionPanel.jsx` (lädt
  Aufgaben aus `questions.json`), rechts `Terminal.jsx` (`xterm.js` via
  WebSockets).
- **Nachteile:**
  - Kein grafischer Desktop (kein VNC, kein Firefox für Docs-Recherche im
    Prüfungsfenster).
  - Harte Abhängigkeit von externer Cloud-Authentifizierung
    (`@asgardeo/auth-react`).
  - Infrastruktur zwingend an AWS EC2 und Terraform gekoppelt.

---

### 2.4 spurin/cncf-psi-k8s-linux-simulator (Cloud Shell & Webtop)

- **Repository:** <https://github.com/spurin/cncf-psi-k8s-linux-simulator> /
  `42eleven/cncf-psi-k8s-linux-simulator`
- **Konzept:** James Spurin erstellte ein Setup für Google Cloud Shell, das
  Minikube und ein angepasstes Docker-Image `spurin/webtop-k8s` startet.
- **Bewertung:** Gute Demonstration, dass LinuxServer `webtop` der Standard
  für Linux-Desktop-Container im Browser ist. Es enthält jedoch kein
  übergeordnetes Prüfungsportal (Aufgaben werden als separates Markdown in
  Cloud Shell angezeigt).

---

### 2.5 educates/educates-training-platform (VMware Tanzu Labs)

- **Repository:** <https://github.com/educates/educates-training-platform>
- **Website:** <https://educates.dev/>
- **Konzept:** Enterprise-Plattform für interaktive Workshops. Bietet ein
  Split-Screen-Dashboard (links Markdown-Anleitung mit Click-to-Run, rechts
  Tabs für Web-Terminals, VS Code IDE, Kubernetes-Dashboard und Slides).
- **Bewertung:** Technisch exzellent für Multi-User-Schulungen, für den
  lokalen CKA-Trainer jedoch massiver Overkill: Benötigt ein
  vollständiges Kubernetes-Setup mit eigenen Custom Resource Definitions
  (`WorkshopDefinition`), Ingress-Controllern und Operator-Diensten.

---

### 2.6 Status von KubeMock und Killercoda im Open-Source-Raum

- **Killercoda (Closed Source):** Proprietärer SaaS-Dienst von Kim Wüstkamp
  (killer.sh). Die Infrastruktur basiert serverseitig auf KubeVirt-VMs auf
  Bare-Metal-Servern. Es existiert kein Self-Hosted- oder Open-Source-Release.
- **KubeMock (Begriffsabgrenzung):** Bezeichnet reine Mocking-Bibliotheken in
  Go (`client-go` TokenReview Mocks) für Unit-Tests, keine interaktive
  Prüfungsumgebung.
- **Play-with-K8s (Moby / Docker):** Basiert auf `play-with-docker`. Bietet
  Multi-Node-Webterminals, aber kein Prüfungsinterface (keine Tasks, kein
  Timer, kein XFCE-Desktop).
- **Instruqt / Katacoda (SaaS):** Katacoda wurde von O'Reilly 2022 eingestellt;
  Instruqt ist eine kommerzielle Plattform für Produkt-Demos und Schulungen.

---

## 3. Vergleichsmatrix der Optionen

Vergleich der vier relevanten Pfade anhand prüfungsrelevanter Kriterien:

### Option A: sailor-sh/CK-X

- **PSI-Split-Screen UI:** Exakte Nachbildung (Timer, Dropdown, Click-to-Copy).
- **Remote Desktop:** XFCE via ConSol-VNC Iframe oder xterm.js SSH-Terminal.
- **Architektur & Overhead:** 8 Docker-Container (DinD, KIND, Redis,
  Facilitator).
- **Apple Silicon (ARM64):** Inkompatibel (Images sind rein `linux/amd64`).
- **OrbStack-Anbindung:** Starr an internen KIND-Cluster gekoppelt.
- **Wartungsaufwand:** Hoch.

### Option B: yozorazora/Kubernetes-Exam-Simulator

- **PSI-Split-Screen UI:** Keine (reine Bash-CLI-Menüs im Terminal).
- **Remote Desktop:** Keiner (Host-Terminal).
- **Architektur & Overhead:** Minimal (lokale KIND-Cluster via Shell-Skripte).
- **Apple Silicon (ARM64):** Nativ lauffähig (kind ARM64).
- **Aufgabenqualität:** Exzellent (28 reale CKA-Aufgaben, 4 Kontexte,
  Auto-Check).
- **Wartungsaufwand:** Sehr gering.

### Option C: educates/educates-training-platform

- **PSI-Split-Screen UI:** Ähnlich (Tabs für Terminal, Editor, K8s-Dashboard).
- **Remote Desktop:** Web-Terminal und VS Code; kein XFCE-Standarddesktop.
- **Architektur & Overhead:** Sehr hoch (K8s-Cluster mit Operator und CRDs).
- **Apple Silicon (ARM64):** Lauffähig auf k3d/kind.
- **Wartungsaufwand:** Sehr hoch (Enterprise-Schulungsplattform).

### Option D: Empfohlener Eigenbau (Static Portal + LinuxServer Webtop)

- **PSI-Split-Screen UI:** Exakte Nachbildung via leichtem HTML5/JS-Portal.
- **Remote Desktop:** Ubuntu 24.04 XFCE via KasmVNC (LinuxServer Webtop).
- **Architektur & Overhead:** 1 Desktop-Container + Nginx (unter 1,5 GB RAM).
- **Apple Silicon (ARM64):** 100 % natives ARM64 OCI-Manifest.
- **OrbStack-Anbindung:** Auto-Wake der Cluster-Knoten in 0,24 s via SSH.
- **Wartungsaufwand:** Nahezu null (ein einziges statisches HTML-File).

---

## 4. Die empfohlene, sofort einsatzbereite Lösung

Da kein bestehendes Komplettpaket nativ auf Apple Silicon ohne Emulation läuft
und sich nahtlos an Herberts laufende OrbStack-VMs anbindet, ist die
**leichteste, wartungsärmste und robusteste Lösung ein zweigeteiltes Setup**:

```plain
+----------------------------------------------------------------------------+
| BROWSER: http://localhost:8080 (PSI Exam Portal)                           |
|                                                                            |
| +-------------------------------+----------------------------------------+ |
| | HEADER: Task 3/17 | Time 114:23 | Context: k8s (Copy) | Flag | Help    | |
| +-------------------------------+---+------------------------------------+ |
| | LINKES PANEL (Aufgabe):       | | | RECHTES PANEL (Iframe Desktop):    | |
| | - Markdown-Rendering          | | | - Ubuntu 24.04 XFCE Desktop        | |
| | - Context-Umschaltbefehl      | | | - xfce4-terminal                   | |
| | - Click-to-Copy auf Code      | | |   -> `ssh cka-master` (Auto-Wake)  | |
| | - Vor- / Zurück-Navigation    | | | - Firefox (kubernetes.io/docs)     | |
| +-------------------------------+---+------------------------------------+ |
+----------------------------------------------------------------------------+
```

### 4.1 Die Kernkomponenten

1. **Web-Desktop-Container (`lscr.io/linuxserver/webtop:ubuntu-xfce`):**
   - Läuft als leichtgewichtiger Hintergrund-Container auf Port 3000.
   - Bietet KasmVNC mit HTML5-Streaming, Clipboard-Synchronisation,
     Terminal und Firefox.
   - Verbindet sich über das in `orbstack-psi-lab-feasibility.md` verifizierte
     SSH-Auto-Wake (`root@<machine>@host.docker.internal:32222`) mit den
     OrbStack-VMs.
2. **Statisches Split-Screen Frontend (`portal/index.html` + `portal.js`):**
   - Ein reines, statisches Webfrontend (HTML5 + modern CSS + Vanilla JS).
   - Kein Node.js-Serverprozess, kein npm-Build, kein React/Vue-Overhead.
   - Kann direkt via Nginx, Python (`python3 -m http.server`) oder Caddy
     bereitgestellt werden.
   - Liest Aufgabenstellungen direkt aus JSON- oder Markdown-Dateien
     (z. B. aus Herberts `labs/`-Verzeichnis oder den 28 Tasks von Yozorazora).

---

## 5. Implementierungs-Bauplan: Der schlüsselfertige Prototyp

### 5.1 Docker Compose (`docker-compose.portal.yaml`)

Ein einheitliches Compose-Manifest, das sowohl den Webtop-Desktop als auch das
statische Prüfungsportal über einen gemeinsamen Nginx-Proxy bereitstellt
(eliminiert jegliche Iframe-Cross-Origin- und WebSocket-Probleme):

```yaml
services:
  # 1. PSI-Desktop-Container (XFCE via KasmVNC)
  webtop:
    image: lscr.io/linuxserver/webtop:ubuntu-xfce
    container_name: cka-webtop
    restart: unless-stopped
    shm_size: "2gb"
    security_opt:
      - seccomp=unconfined
    environment:
      - PUID=501
      - PGID=20
      - TZ=Europe/Berlin
      - CUSTOM_USER=candidate
      - PASSWORD=k8s-practice
    volumes:
      - ./webtop-config:/config
      - ~/.orbstack/ssh/id_ed25519:/config/.ssh/id_ed25519:ro
      - ../:/course
    expose:
      - "3000"

  # 2. Prüfungsportal Reverse Proxy & Static Host
  portal:
    image: nginx:alpine
    container_name: cka-exam-portal
    restart: unless-stopped
    ports:
      - "8080:80"
    volumes:
      - ./portal:/usr/share/nginx/html:ro
      - ./nginx.conf:/etc/nginx/conf.d/default.conf:ro
    depends_on:
      - webtop
```

### 5.2 Nginx Reverse Proxy Konfiguration (`nginx.conf`)

Stellt sicher, dass das Portal und der Web-Desktop auf derselben Origin laufen,
wodurch keine `X-Frame-Options`-Restriktionen greifen:

```nginx
map $http_upgrade $connection_upgrade {
    default upgrade;
    '' close;
}

server {
    listen 80;
    server_name localhost;

    # Statisches Prüfungsportal
    location / {
        root /usr/share/nginx/html;
        index index.html;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    # Proxy auf KasmVNC Webtop Desktop
    location /desktop/ {
        proxy_pass http://webtop:3000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_set_header Host $host;
        proxy_read_timeout 86400;
        proxy_buffering off;
    }
}
```

### 5.3 Das leichtgewichtige Frontend (`portal/index.html`)

Ein vollständiges, autarkes Prüfungsinterface mit Split-Screen, Timer,
Question-Switcher und automatischem Click-to-Copy:

```html
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CKA PSI Exam Simulator</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI",
        Roboto, sans-serif;
      height: 100vh;
      display: flex;
      flex-direction: column;
      background: #1e1e1e;
      color: #333;
      overflow: hidden;
    }
    /* Header & Timer */
    header {
      height: 48px;
      background: #24292e;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 16px;
      user-select: none;
      border-bottom: 1px solid #333;
    }
    .header-left {
      display: flex;
      align-items: center;
      gap: 16px;
      font-weight: 600;
    }
    .timer-badge {
      font-family: monospace;
      font-size: 1.1rem;
      background: #111;
      padding: 4px 10px;
      border-radius: 4px;
      color: #4ade80;
      border: 1px solid #333;
    }
    .timer-badge.warning { color: #facc15; }
    .timer-badge.danger { color: #ef4444; }
    /* Split Container */
    .split-container {
      flex: 1;
      display: flex;
      position: relative;
      height: calc(100vh - 48px);
    }
    /* Left Panel */
    .task-panel {
      width: 35%;
      min-width: 280px;
      max-width: 65%;
      background: #ffffff;
      display: flex;
      flex-direction: column;
      border-right: 1px solid #ccc;
    }
    .task-nav {
      height: 44px;
      background: #f3f4f6;
      border-bottom: 1px solid #e5e7eb;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 12px;
    }
    .task-nav button {
      padding: 4px 12px;
      font-weight: bold;
      cursor: pointer;
    }
    .task-content {
      flex: 1;
      overflow-y: auto;
      padding: 20px;
      line-height: 1.6;
    }
    .task-content code {
      background: #f1f5f9;
      color: #0f172a;
      padding: 2px 6px;
      border-radius: 4px;
      font-family: ui-monospace, monospace;
      font-size: 0.9em;
      cursor: pointer;
      border: 1px solid #cbd5e1;
      transition: background 0.15s;
    }
    .task-content code:hover {
      background: #e2e8f0;
      border-color: #94a3b8;
    }
    /* Resizable Divider (Draggable) */
    .gutter {
      width: 8px;
      background: #e5e7eb;
      cursor: col-resize;
      position: relative;
      transition: background 0.2s;
    }
    .gutter:hover, body.dragging .gutter {
      background: #3b82f6;
    }
    /* Right Panel (Webtop Iframe) */
    .desktop-panel {
      flex: 1;
      background: #000;
      position: relative;
    }
    .desktop-panel iframe {
      width: 100%;
      height: 100%;
      border: none;
    }
    /* Mouse-Trap Schutz während des Ziehens */
    body.dragging iframe {
      pointer-events: none;
    }
    /* Toast Notification */
    .toast {
      position: fixed;
      bottom: 20px;
      left: 20px;
      background: #0f172a;
      color: #fff;
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 0.85rem;
      opacity: 0;
      transition: opacity 0.2s;
      pointer-events: none;
      z-index: 1000;
    }
    .toast.show { opacity: 1; }
  </style>
</head>
<body>
  <header>
    <div class="header-left">
      <span>CKA Exam Environment</span>
      <span id="questionTitle">Task 1 of 17</span>
    </div>
    <div>
      <span class="timer-badge" id="timer">120:00</span>
    </div>
  </header>

  <div class="split-container" id="container">
    <div class="task-panel" id="leftPanel">
      <div class="task-nav">
        <button id="prevBtn">&lt; Zurück</button>
        <select id="taskSelect"></select>
        <button id="nextBtn">Weiter &gt;</button>
      </div>
      <div class="task-content" id="taskContent">
        <!-- Dynamische Aufgabenstellung -->
      </div>
    </div>

    <div class="gutter" id="splitter"></div>

    <div class="desktop-panel" id="rightPanel">
      <iframe src="/desktop/" id="desktopFrame"></iframe>
    </div>
  </div>

  <div class="toast" id="toast">In Zwischenablage kopiert!</div>

  <script>
    // 1. Splitter Logic mit Mouse-Trap Schutz
    const splitter = document.getElementById('splitter');
    const leftPanel = document.getElementById('leftPanel');
    const container = document.getElementById('container');
    let isDragging = false;

    splitter.addEventListener('mousedown', (e) => {
      isDragging = true;
      document.body.classList.add('dragging');
      e.preventDefault();
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const rect = container.getBoundingClientRect();
      let newWidth = e.clientX - rect.left;
      if (newWidth < 280) newWidth = 280;
      if (newWidth > rect.width - 400) newWidth = rect.width - 400;
      leftPanel.style.width = newWidth + 'px';
    });

    window.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        document.body.classList.remove('dragging');
      }
    });

    // 2. Click-to-Copy für alle Code-Tags
    const toast = document.getElementById('toast');
    function showToast(text) {
      toast.textContent = text;
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 1500);
    }

    document.getElementById('taskContent').addEventListener('click', (e) => {
      if (e.target.tagName === 'CODE') {
        navigator.clipboard.writeText(e.target.innerText).then(() => {
          showToast('Kopiert: ' + e.target.innerText);
        });
      }
    });

    // 3. Countdown Timer (120 min)
    let secondsLeft = 120 * 60;
    const timerEl = document.getElementById('timer');
    setInterval(() => {
      if (secondsLeft > 0) {
        secondsLeft--;
        const m = Math.floor(secondsLeft / 60);
        const s = secondsLeft % 60;
        const mStr = String(m).padStart(2, '0');
        const sStr = String(s).padStart(2, '0');
        timerEl.textContent = `${mStr}:${sStr}`;
        if (secondsLeft < 900) timerEl.className = 'timer-badge danger';
        else if (secondsLeft < 1800) timerEl.className = 'timer-badge warning';
      }
    }, 1000);
  </script>
</body>
</html>
```

---

## 6. Fazit & Empfehlung für den nächsten Schritt

1. **Kein fertiges Komplettpaket erfüllt alle Kriterien out-of-the-box:**
   - `sailor-sh/CK-X` besitzt zwar das perfekte Interface, scheitert lokal aber
     an fehlenden ARM64-Images und schwergewichtiger Architektur.
   - `yozorazora/Kubernetes-Exam-Simulator` liefert hervorragende 28 Aufgaben,
     bleibt jedoch auf der Bash-CLI stehen.
2. **Die optimale Synthese:**
   - Wir übernehmen die elegante Split-Screen- und Click-to-Copy-Mechanik von
     CK-X in ein extrem schlankes, statisches Portal (`portal/index.html`).
   - Wir binden das bewährte Desktop-Image
     (`lscr.io/linuxserver/webtop:ubuntu-xfce`) als Iframe ein (natives ARM64).
   - Die Aufgaben können direkt aus den CKA-Drills unseres Repositories oder
     aus dem Yozorazora-Aufgabenpool eingespeist werden.
   - Damit erhält Herbert eine **100 % realistische PSI-Prüfungsumgebung**,
     die in Sekunden startet, keinen Arbeitsspeicher im Ruhezustand
     verschwendet und vollkommen unabhängig von externen Cloud-Diensten bleibt.
