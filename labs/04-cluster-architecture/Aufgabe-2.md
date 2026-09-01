# Aufgabe 2: kubeadm Cluster Upgrade

- **CKA Domäne:** Cluster Architecture, Installation & Configuration (25%)
- **Lernberg-Stufe:** Tal → Hang
- **Issue:** #7
- **Entspricht:** Block 2 aus `Aufgaben.md`

---

## 1. Wissensnetz & Mentales Modell (Birkenbihl)

### Das mentale Upgrade-Netz: Die 3 Phasen & Reihenfolge

Ein Kubernetes-Cluster-Upgrade via `kubeadm` folgt immer einer strikten,
unverhandelbaren Schrittfolge. Wer die Reihenfolge bricht, riskiert
Cluster-Stillstand oder Versions-Inkompatibilitäten.

```text
               ┌──────────────────────────────────────────────┐
               │    PHASE 1: Control-Plane Komponenten        │
               │  (kubeadm upgrade plan -> upgrade apply)     │
               └──────────────────────┬───────────────────────┘
                                      │
                                      ▼
               ┌──────────────────────────────────────────────┐
               │    PHASE 2: Control-Plane Node Kubelet       │
               │ (drain -> apt kubelet/kubectl -> uncordon)   │
               └──────────────────────┬───────────────────────┘
                                      │
                                      ▼
               ┌──────────────────────────────────────────────┐
               │    PHASE 3: Worker Node(s)                   │
               │ (drain -> kubeadm upgrade node -> kubelet)   │
               └──────────────────────────────────────────────┘
```

1. **Versions-Sprünge (Minor-Version-Regel):**
   - Kubernetes unterstützt Upgrades nur von `v1.X` auf `v1.X+1` (z. B.
     `v1.31` → `v1.32`).
   - Niemals Minor-Versionen überspringen (z. B. `v1.30` direkt auf `v1.32` ist
     nicht unterstützt).
2. **Paket-Management Dreiklang:**
   - Vor der Installation: Pakete entsperren (`apt-mark unhold <paket>`).
   - Installation der Zielversion (`apt-get install -y <paket>=<version>-*`).
   - Nach der Installation: Pakete sofort wieder sperren (`apt-mark hold <paket>`).
3. **Control-Plane vs. Worker Befehle:**
   - **Auf Control-Plane:** Erst `kubeadm upgrade plan`, dann
     `sudo kubeadm upgrade apply v1.x.y`.
   - **Auf Worker Node:** `sudo kubeadm upgrade node` (kein `plan`/`apply`!).
4. **Node Maintenance (Workload-Schutz):**
   - **`kubectl drain <node> --ignore-daemonsets --force`**: Evakuiert Pods
     und markiert die Node als `SchedulingDisabled` (Cordoning).
   - **`kubectl uncordon <node>`**: Schaltet die Node nach erfolgreichem Kubelet-
     Neustart wieder für das Scheduling frei.

---

## 2. Aufgabenstellung (Block 2)

> **Live-Testumgebung auf echten Ubuntu 24.04 VMs (via OrbStack):**
> Du hast jetzt zwei echte Ubuntu-VMs mit systemd und aktiven
> `pkgs.k8s.io`-Paketquellen:
>
> - **Control-Plane:** VM `cka-master` (Version `v1.31.0`)
> - **Worker Node:** VM `cka-worker1` (Version `v1.31.0`)
>
> Du kannst dich direkt per Shell/SSH auf den Maschinen einloggen:
>
> - `ssh cka-master@orb` (oder einfach `orb -m cka-master`)
> - `ssh cka-worker1@orb` (oder einfach `orb -m cka-worker1`)
>
> **Ziel dieser Übung:**
> Führe ein echtes, unterbrechungsfreies Cluster-Upgrade von **`v1.31.0` auf
> `v1.31.1`** schrittweise und live durch!

---

### Aufgabe 2.1: Vorbereitung & Versions-Check auf `cka-master`

Logge dich auf `cka-master` ein (`orb -m cka-master` oder per SSH).

1. Aktualisiere die Paketlisten (`sudo apt-get update`) und zeige alle
   verfügbaren `kubeadm`-Versionen mit `apt-cache madison kubeadm` an.
2. Entsperre das `kubeadm`-Paket, installiere die Version `1.31.1-1.1` und sperre
   es sofort wieder via `apt-mark`.
3. Verifiziere die installierte Version mit `kubeadm version`.

---

### Aufgabe 2.2: Control-Plane Upgrade durchführen

Bleibe auf `cka-master`.

1. Führe den Vorab-Check mit `sudo kubeadm upgrade plan` durch. Welche Version
   wird für die Control-Plane vorgeschlagen?
2. Führe das Upgrade der Control-Plane-Komponenten auf Version `v1.31.1` mit
   `sudo kubeadm upgrade apply v1.31.1 -y` aus.
3. Warum zeigt `kubectl get nodes` für `cka-master` jetzt immer noch Version
   `v1.31.0` an, obwohl die Control-Plane-Komponenten bereits auf `v1.31.1` sind?

---

### Aufgabe 2.3: Kubelet & Kubectl auf `cka-master` upgraden

1. Entsperre `kubelet` und `kubectl`, installiere Version `1.31.1-1.1` und sperre
   beide Pakete wieder.
2. Lade den systemd-Daemon neu und starte den Kubelet-Dienst neu (`systemctl`).
3. Prüfe mit `kubectl get nodes -o wide`, ob `cka-master` nun sauber mit Version
   `v1.31.1` im Zustand `Ready` gemeldet wird.

---

### Aufgabe 2.4: Worker Node Upgrade-Workflow (`cka-worker1`)

Jetzt soll der Worker Node ohne Downtime für Workloads aktualisiert werden.

1. **Vom Master (`cka-master`) aus:**
   - Bereite `cka-worker1` mit
     `kubectl drain cka-worker1 --ignore-daemonsets --force` auf die Wartung vor.
   - Prüfe mit `kubectl get nodes`, welcher Status für den Worker angezeigt wird.
2. **Auf dem Worker (`cka-worker1`):** (Wechsle zu `orb -m cka-worker1` / SSH)
   - Entsperre `kubeadm`, installiere Version `1.31.1-1.1` und sperre es wieder.
   - Führe das Node-Upgrade mit `sudo kubeadm upgrade node` aus.
   - Entsperre `kubelet` & `kubectl`, installiere Version `1.31.1-1.1` und sperre
     beide wieder.
   - Starte den Kubelet-Dienst neu (`systemctl daemon-reload &&
systemctl restart kubelet`).
3. **Wieder vom Master (`cka-master`) aus:**
   - Schalte die Node wieder frei mit `kubectl uncordon cka-worker1`.
   - Prüfe den Gesamtstatus des Clusters (`kubectl get nodes -o wide`). Alle
     Nodes sollten nun auf `v1.31.1` und `Ready` sein!

Du wechselst per SSH auf den Worker Node `node01`. Das Upgrade soll ohne
Downtime für bestehende Deployments erfolgen.

1. Welchen Befehl setzt du **vom Control-Plane-Knoten** aus ab, um `node01`
   sicher für Wartungsarbeiten vorzubereiten (Drain)? Welche Flags sind nötig,
   falls DaemonSets oder lokale Pods laufen?
2. Welche Befehle führst du jetzt **auf `node01`** aus für:
   - Paket-Upgrade von `kubeadm`
   - Upgrade der Node-Konfiguration via `kubeadm` (Welcher Befehl genau?)
   - Paket-Upgrade von `kubelet` und `kubectl`
   - Neustart des Kubelet-Dienstes
3. Welchen Befehl führst du abschließend **auf dem Control-Plane-Knoten** aus,
   damit `node01` wieder neue Pods empfangen kann?

---

## 3. Deine Lösung (Befehle / Manifeste / Notizen)

### Lösung 2.1

```bash
# Deine Befehle / Notizen
orb -m cka-master
sudo apt-get update

apt-cache madison kubeadm

sudo apt-mark unhold kubeadm
# Canceled hold on kubeadm.

sudo apt-get install kubeadm=1.31.1-1.1

sudo apt-mark hold kubeadm
# kubeadm set on hold.
```

### Lösung 2.2

```bash
# Deine Befehle / Notizen
herbertnikolajewski@cka-master:~$ sudo kubeadm upgrade plan
# [preflight] Running pre-flight checks.
# [upgrade/config] Reading configuration from the cluster...
# [upgrade] Running cluster health checks
# [upgrade/versions] Cluster version: 1.31.0
# [upgrade/versions] kubeadm version: v1.31.1
# [upgrade/versions] Target version: v1.31.14

sudo kubeadm upgrade apply v1.31.1 -y
# [upgrade/successful] SUCCESS! Your cluster was upgraded to "v1.31.1".
# [upgrade/kubelet] Now that your control plane is upgraded...

k get nodes
# NAME          STATUS   ROLES           AGE   VERSION
# cka-master    Ready    control-plane   37m   v1.31.0
# cka-worker1   Ready    <none>          36m   v1.31.0

# Weil Kubelet und kubectl noch aktualisiert werden müssen,
# zeigt es noch die alte Version an.
```

### Lösung 2.3

```bash
# Deine Befehle / Notizen

sudo apt-mark unhold kubelet
sudo apt-mark unhold kubectl

sudo apt-get install kubelet=1.31.1-1.1 -y
sudo apt-get install kubectl=1.31.1-1.1 -y

sudo apt-mark hold kubelet
sudo apt-mark hold kubectl

sudo systemctl restart kubelet

k get nodes -o wide
# NAME         STATUS   ROLES           AGE   VERSION   CONTAINER-RUNTIME
# cka-master   Ready    control-plane   48m   v1.31.1   containerd://2.2.1
# cka-worker1  Ready    <none>          48m   v1.31.0   containerd://2.2.1
```

### Lösung 2.4

```bash
# Deine Befehle / Notizen

k drain cka-worker1 --ignore-daemonsets --force
# node/cka-worker1 cordoned
# Warning: ignoring DaemonSet-managed Pods...
# evicting pod kube-system/coredns-...
# node/cka-worker1 drained

k get nodes
# NAME          STATUS                     ROLES           AGE   VERSION
# cka-master    Ready                      control-plane   60m   v1.31.1
# cka-worker1   Ready,SchedulingDisabled   <none>          59m   v1.31.0

herbertnikolajewski@cka-worker1:~$ sudo apt-mark unhold kubeadm
# Canceled hold on kubeadm.

sudo apt-get install kubeadm=1.31.1-1.1 -y

sudo apt-mark hold kubeadm

sudo kubeadm upgrade node
# [upgrade] Reading configuration from the cluster...
# [upgrade] The configuration for this node was successfully updated!

sudo apt-mark unhold kubelet
sudo apt-mark unhold kubectl

sudo apt-get install kubectl=1.31.1-1.1 -y
sudo apt-get install kubelet=1.31.1-1.1 -y

sudo apt-mark hold kubelet
sudo apt-mark hold kubectl

sudo systemctl restart kubelet

kubectl uncordon cka-worker1
# node/cka-worker1 uncordoned

herbertnikolajewski@cka-master:~$ k get nodes -o wide
# NAME         STATUS   ROLES           AGE    VERSION   CONTAINER-RUNTIME
# cka-master   Ready    control-plane   102m   v1.31.1   containerd://2.2.1
# cka-worker1  Ready    <none>          101m   v1.31.1   containerd://2.2.1

# node01:
# auf dem control-plane:
# k drain node01 --ignore-daemonsets --force
# auf dem worker node01:
# sudo apt-get update
# sudo apt-mark unhold kubeadm
# sudo apt-get install kubeadm=1.31.1-1.1 -y
# sudo apt-mark hold kubeadm
# sudo kubeadm upgrade node
# sudo apt-mark unhold kubectl kubelet
# sudo apt-get install kubectl=1.31.1-1.1 kubelet=1.31.1-1.1 -y
# sudo apt-mark hold kubectl kubelet
# sudo systemctl restart kubelet
# auf dem control-plane wieder:
# k uncordon node01
# k get nodes -o wide
```

---

## 4. Spickzettel & Doku-Hilfen (Optional / Bei Bedarf)

Falls du während der Bearbeitung nachschlagen möchtest:

- **kubernetes.io Keywords:** `upgrading kubeadm clusters`, `kubeadm upgrade`
- **In-Terminal Syntax:**
  - `kubeadm upgrade --help`
  - `kubeadm upgrade plan --help`
  - `kubeadm upgrade apply --help`
  - `kubeadm upgrade node --help`
  - `kubectl drain --help`
  - `kubectl uncordon --help`
- **Linux Tools:**
  - `apt-cache madison kubeadm`
  - `apt-mark unhold / hold`
  - `systemctl daemon-reload && systemctl restart kubelet`

---

## 5. Feedback & Korrekturen

### Review zu Block 2: kubeadm Cluster Upgrade

Fantastische Leistung! Du hast das komplette Upgrade von `v1.31.0` auf
`v1.31.1` live auf echten Ubuntu 24.04 Linux-VMs mit `apt`, `systemctl`,
`kubeadm` und `kubectl` erfolgreich durchgespielt und beide Nodes sauber in den
Zielzustand (`Ready`, `v1.31.1`) gebracht.

---

### Detaillierte Analyse & Feinheiten

#### 1. Aufgabe 2.1 (Vorbereitung & Paketmanagement Master)

- **Umsetzung:** `apt update`, `apt-cache madison kubeadm`, `apt-mark unhold`,
  gezielte Installation von `1.31.1-1.1` und sofortiges `apt-mark hold`.
- **Bewertung:** 100 % fehlerfrei und prüfungskonform.

#### 2. Aufgabe 2.2 (Control-Plane Upgrade via Kubeadm)

- **Umsetzung:** `kubeadm upgrade plan` sauber analysiert und danach mit
  `kubeadm upgrade apply v1.31.1 -y` angewendet.
- **Verständnisfrage:** Perfekt beantwortet! `kubectl get nodes` liest die
  Version aus der Registrierung des Kubelet-Agenten. Da das Kubelet auf dem
  Master zu diesem Zeitpunkt noch auf `v1.31.0` lief, blieb die Anzeige bis zu
  Schritt 2.3 auf dem alten Stand.

#### 3. Aufgabe 2.3 (Master Kubelet & Kubectl Update)

- **Umsetzung:** `kubelet` und `kubectl` entsperrt, auf `1.31.1-1.1` aktualisiert,
  gesperrt und per `systemctl restart kubelet` neu geladen.
- **Ergebnis:** `cka-master` wechselte sofort auf `v1.31.1` im Zustand `Ready`.
- **Tipp für systemd:** Nach dem Ändern von Service-Binaries empfiehlt sich
  immer ein kurzes `sudo systemctl daemon-reload` vor dem Restart.

#### 4. Aufgabe 2.4 (Worker Node Upgrade-Workflow)

- **Umsetzung:**
  1. Auf Master: `kubectl drain cka-worker1 --ignore-daemonsets --force` (Status
     wechselte vorschriftsmäßig auf `Ready,SchedulingDisabled`).
  2. Auf Worker: Kubeadm aktualisiert, `sudo kubeadm upgrade node` ausgeführt,
     Kubelet aktualisiert und neu gestartet.
  3. Auf Master: `kubectl uncordon cka-worker1`.
- **Ergebnis:** Beide Nodes sind `Ready` auf `v1.31.1`.
- **Kleine Notiz zu `node01`:**
  Der Befehl `kubectl uncordon <node>` wird wie der `drain`-Befehl immer **vom
  Master / Control-Plane-Knoten** aus ausgeführt (nicht auf dem Worker selbst,
  da dem Worker das Kubeconfig-Zertifikat fehlt).

---

### CKA-Takeaway & Prüfungs-Checkliste

1. **Master zuerst:**
   `apt kubeadm` → `kubeadm upgrade plan` → `kubeadm upgrade apply v1.x.y` →
   `apt kubelet kubectl` → `systemctl restart kubelet`.
2. **Worker danach:**
   `kubectl drain <worker>` (vom Master!) → SSH auf Worker →
   `apt kubeadm` → `kubeadm upgrade node` → `apt kubelet kubectl` →
   `systemctl restart kubelet` → `kubectl uncordon <worker>` (vom Master!).

**Ergebnis:** Block 2 mit Bravour gemeistert! 🎯
