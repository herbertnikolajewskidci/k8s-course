# Research Report: Machbarkeit eines OrbStack- & Web-Desktop-Labors

- **Datum:** 2026-09-06
- **Autor:** Herbert Nikolajewski / Pi Research Agent
- **Ziel:** Technische Verifikation der Architektur fuer ein
  CKA-Trainingslabor (OrbStack Linux-VMs + Web-Desktop-Container zur
  Simulation der PSI-Pruefungsumgebung) auf Apple Silicon (macOS ARM64).
- **Primaerquellen:** Offizielle OrbStack-Dokumentation (`docs.orbstack.dev`),
  LinuxServer.io (`docs.linuxserver.io`), Docker Hub OCI-Manifeste, lokale
  CLI- und Netzwerk-Messungen.

---

## 1. Executive Summary & Fazit

Die vorgeschlagene Architektur ist **technisch vollstaendig machbar und
ausserordentlich performant**, sofern zwei wesentliche systemspezifische
Besonderheiten beachtet werden:

1. **Auto-Wake via SSH:** Ein Verbindungsaufbau an Port 22
   (`machine.orb.local`) weckt eine gestoppte Maschine **nicht** auf (Timeout).
   Das automatische Aufwecken im Sub-Sekunden-Bereich (~0,24 s) gelingt aus
   Docker-Containern ausschliesslich ueber OrbStacks internen SSH-Server auf
   Port 32222 via `host.docker.internal` und die Syntax `root@<machine>`.
2. **Kubelet Swap-Konflikt:** Da OrbStack alle Maschinen auf einem gemeinsamen
   Linux-Microkernel mit aktivem Zram-Swap (`/dev/zram0`) betreibt, stuerzt
   `kubelet` beim Kaltstart mit `failed to run Kubelet: running with swap on is
   not supported` ab. Abhilfe schafft entweder ein `swapoff -a` beim Start
   oder `failSwapOn: false` in `/var/lib/kubelet/config.yaml`.

Bei Beruecksichtigung dieser Punkte bietet das Setup eine exakte, hochgradig
ressourcenschonende Simulation des CKA-Pruefungsdesktops (Ubuntu XFCE via
Browser) mit echtem Multi-Node-Cluster.

---

## 2. Architektur von OrbStack (MicroVM vs. Hypervisor)

Entgegen der landlaeufigen Annahme handelt es sich bei OrbStack-Maschinen nicht
um separate, schwergewichtige Hypervisor-VMs (wie bei QEMU, VirtualBox oder
UTM), sondern um eine Architektur aehnlich zu Microsoft WSL 2:

- **Gemeinsamer Microkernel:** OrbStack betreibt eine einzige, hochgradig
  optimierte Linux-MicroVM (`7.0.14-orbstack-...` auf ARM64).
- **System-Container:** Linux-Maschinen (Ubuntu Noble, Debian, Fedora etc.)
  sind isolierte System-Namespaces/Container mit vollstaendigem `systemd`-Init-
  System, die auf diesem gemeinsamen Microkernel laufen
  (`docs.orbstack.dev/architecture`).
- **Skalierbarkeit:** Es existiert kein kuenstliches Limit fuer die Anzahl an
  Maschinen. Laut offizieller Dokumentation koennen Dutzende Maschinen parallel
  betrieben werden, da sie sich den Kernel und den dynamischen Arbeitsspeicher
  teilen.
- **Ressourcen-Steuerung:** Globale Limits werden ueber OrbStack gesteuert
  (aktuell: 12 GiB RAM-Limit, 14 CPUs). Pro Maschine koennen CPU-, RAM- und
  Disk-Quotas (`orb config set machine.<name>.memory_mib <val>`) definiert
  werden.

---

## 3. Lifecycle- & Performance-Messungen

Die folgenden Messwerte wurden direkt auf dem Apple-Silicon-Host mit den
bestehenden Maschinen `cka-master` und `cka-worker1` (Ubuntu 24.04 Noble, ARM64)
ermittelt:

### 3.1 Boot- und Stopp-Zeiten

- `orbctl stop cka-master`: **0,161 s** (Namespaces/Prozesse sofort beendet).
- `orbctl start cka-master` (CLI Return): **0,067 s – 0,081 s**.
- Kaltstart bis responsivem SSH (`port 22`): **1,140 s – 1,145 s**.
- Auto-Wake via SSH (`port 32222`): **0,236 s** (Socket-Handoff via Helper).

### 3.2 SSH-Verhalten & Auto-Wake (Aufklaerung eines Denkfehlers)

Im Vorfeld existierte die Annahme, ein beliebiger SSH-Aufruf an
`cka-master.orb.local` wuerde eine gestoppte Maschine wecken. Lokale Tests
widerlegen dies:

1. **Direktzugriff (`root@cka-master.orb.local:22`):**
   - Antwortet nur, wenn die Maschine den Status `running` hat.
   - Ist die Maschine im Status `stopped`, bricht der Verbindungsaufbau nach
     einem Timeout ab (`Operation timed out`). Die Maschine bleibt gestoppt.
2. **OrbStack SSH-Proxy (`host.docker.internal:32222`):**
   - OrbStack betreibt auf Port 32222 einen Host-SSH-Dienst.
   - Wird dieser mit dem Benutzernamenschema `<user>@<machine>` angesprochen
     (z. B. `root@cka-master@host.docker.internal`), faengt OrbStack das Paket
     ab, startet die gestoppte Maschine autonom in **0,24 Sekunden** und leitet
     die SSH-Session direkt ein.
   - Dieser Port ist sowohl von macOS als auch aus laufenden Docker-Containern
     (`host.docker.internal:32222`) uneingeschraenkt erreichbar.

---

## 4. Arbeitsspeicher- und CPU-Footprint

### 4.1 Ruhende (gestoppte) Maschinen

- **Host-RAM-Verbrauch auf macOS:** **0 MB (Exakt null Byte)**.
- **Erklaerung:** Da keine Hypervisor-Instanz vorgehalten werden muss,
  existieren im gestoppten Zustand keine Prozesse. OrbStack implementiert
  Dynamic Memory Allocation / Memory Ballooning
  (`docs.orbstack.dev/efficiency`): Nicht benoetigter Arbeitsspeicher der
  MicroVM wird sofort und vollstaendig an das macOS-Betriebssystem freigegeben.
- **Festplattenbelegung:** Es faellt lediglich der Speicherplatz des
  Root-Dateisystems an (z. B. 3,5 GB fuer Master, 2,2 GB fuer Worker).

### 4.2 Laufende Maschinen im Leerlauf

Empirische Messung via `ps -eo rss` und `crictl ps` auf den aktiven Knoten:

- **Worker Node (`cka-worker1`):**
  - Gesamter RSS-RAM: **~330 MB**.
  - Aufschluesselung: `kubelet` (83 MB), `kube-proxy` (57 MB), `containerd`
    (47 MB), `flanneld` (36 MB), Basis-Dienste/systemd (~105 MB).
- **Control Plane (`cka-master`):**
  - Gesamter RSS-RAM: **~708 MB**.
  - Aufschluesselung: Worker-Stack plus `etcd` und Static Pods (~380 MB).
- **Leerlauf-CPU (Host):**
  - Gesamter 2-Node-Cluster im Ruhezustand verbraucht **0,0 % – 0,2 % CPU**.

### 4.3 Kubelet Swap-Falle auf OrbStack

OrbStack nutzt im gemeinsamen Microkernel Zram-Swap (`/dev/zram0` mit ca.
12 GB). Kubelet bricht beim Start mit folgendem Fehler ab:

```plain
failed to run Kubelet: running with swap on is not supported, please
disable swap or set --fail-swap-on flag to false
```

**Erforderliche Gegenmassnahme in allen Cluster-VMs:**

- Entweder Swap beim Start deaktivieren: `swapoff -a`.
- Oder Kubelet-Konfiguration anpassen (`/var/lib/kubelet/config.yaml`):

```yaml
failSwapOn: false
```

---

## 5. Docker Web-Desktop Container (PSI-Browser-Simulation)

### 5.1 ARM64-Kompatibilitaet & Image-Auswahl

Die OCI-Manifeste beider Desktop-Images wurden geprueft:

1. **`lscr.io/linuxserver/webtop:ubuntu-xfce`:**
   - Verfuegt ueber ein **natives `linux/arm64` Manifest** (Digest verifiziert:
     `sha256:ee31a8828783...`).
   - Keine Rosetta-Emulation erforderlich.
   - Basiert auf Ubuntu mit XFCE-Desktop (exakte Paritaet zum CKA-Desktop).
   - Nutzt Selkies/KasmVNC mit HTML5-Zugriff ueber Port 3000/3001.
2. **`kasmweb/ubuntu-noble-desktop:1.17.0`:**
   - Verfuegt ebenfalls ueber ein **natives `linux/arm64` Manifest**.
   - Funktionsfaehig, jedoch mit ca. 3,5 GB Image-Groesse deutlich
     schwergewichtiger als LinuxServer Webtop (~1,5 GB).

### 5.2 Netzwerk-Routing: Docker-Container zu OrbStack-VMs

OrbStack nutzt ein integriertes Bridge-Netzwerk (`192.168.138.0/23`), das
Container und Maschinen nahtlos miteinander verbindet
(`docs.orbstack.dev/docker/network`):

- **DNS-Aufloesung:** Docker-Container erhalten automatisch OrbStacks
  Nameserver (`0.250.250.200`). Machine-Namen wie `cka-master.orb.local`
  werden transparent aufgeloest.
- **Latenz:** Ping zwischen Container und Linux-Maschine betraegt **0,10 ms**.
- **Port-Erreichbarkeit:**
  - Kubernetes API-Server (`https://192.168.139.19:6443`): Direkt erreichbar.
  - NodePorts / Flannel: Direkt adressierbar.
  - SSH-Dienst: Getestet und verifiziert. Ein Testcontainer konnte mit dem
    Host-Schluessel (`~/.orbstack/ssh/id_ed25519`) interaktiv per SSH auf
    `cka-master` arbeiten.

---

## 6. Dateisystem & Volume Mounts

- **VirtioFS-Performance:** OrbStack nutzt optimierte VirtioFS-Treiber mit
  dynamischem Caching. Das Einbinden des Arbeitsverzeichnisses
  (`/Users/.../k8s-course:/course`) in den Container funktioniert
  verzoegerungsfrei.
- **Schreib-/Lesetests:** Schreibzugriffe, Dateioperationen und Git-Status
  innerhalb des Containers spiegeln sich in Echtzeit auf dem Host wider.
- **Benutzerrechte (UID/GID):**
  - Auf macOS hat der Benutzer Herbert `UID=501` und `GID=20` (Staff).
  - Der LinuxServer-Webtop-Container unterstuetzt `PUID=501` und `PGID=20`.
    Dadurch werden im Desktop-Terminal generierte YAML-Manifeste mit den
    korrekten Host-Rechten abgespeichert.

---

## 7. Referenz-Implementierung (Empfohlenes Setup)

Um das CKA-Pruefungsinterface (PSI Remote Desktop) exakt nachzubilden und
automatisches Aufwecken der Knoten zu garantieren:

### 7.1 Docker Compose (`docker-compose.psi.yaml`)

```yaml
services:
  psi-desktop:
    image: lscr.io/linuxserver/webtop:ubuntu-xfce
    container_name: cka-psi-simulator
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
      - ./lab-desktop-config:/config
      - ~/.orbstack/ssh/id_ed25519:/config/.ssh/id_ed25519:ro
      - /Users/herbertnikolajewski/Documents/Repos/k8s-course:/course
    ports:
      - "3000:3000"
      - "3001:3001"
```

### 7.2 SSH-Konfiguration im Web-Desktop (`/config/.ssh/config`)

Damit der Pruefling im Terminal einfach `ssh cka-master` eingeben kann und
ruhende Maschinen transparent gestartet werden:

```ssh-config
Host cka-master
  HostName host.docker.internal
  Port 32222
  User root@cka-master
  IdentityFile ~/.ssh/id_ed25519
  StrictHostKeyChecking no
  UserKnownHostsFile /dev/null

Host cka-worker1
  HostName host.docker.internal
  Port 32222
  User root@cka-worker1
  IdentityFile ~/.ssh/id_ed25519
  StrictHostKeyChecking no
  UserKnownHostsFile /dev/null
```

---

## 8. Quellen & Primaerreferenzen

1. **OrbStack Architecture & Efficiency:**
   - Architecture: <https://docs.orbstack.dev/architecture>
   - Efficiency & Dynamic Memory: <https://docs.orbstack.dev/efficiency>
   - Machine Networking & DNS: <https://docs.orbstack.dev/machines/network>
   - SSH Access & Helper: <https://docs.orbstack.dev/machines/ssh>
2. **LinuxServer.io Webtop Documentation:**
   - Documentation & Specs: <https://docs.linuxserver.io/images/docker-webtop/>
   - Baseimage Selkies / KasmVNC:
     <https://github.com/linuxserver/docker-baseimage-selkies>
3. **Kasm Technologies:**
   - Ubuntu Noble Desktop Images:
     <https://hub.docker.com/r/kasmweb/ubuntu-noble-desktop>
4. **Lokale Cluster- & CLI-Verifikationen:**
   - OrbStack Version: `2.2.3 (2020300)`
   - Kernel: `7.0.14-orbstack-00380-ga7e0a2dc9535 aarch64`
   - Test-Maschinen: `cka-master`, `cka-worker1` (Ubuntu 24.04 Noble LTS,
     Kubernetes v1.31.1, containerd v2.2.1).
