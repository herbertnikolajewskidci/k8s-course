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

```

### Lösung 2.2

```bash
# Deine Befehle / Notizen
```

### Lösung 2.3

```bash
# Deine Befehle / Notizen
```

### Lösung 2.4

```bash
# Deine Befehle / Notizen
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

Noch keine Einreichung vorhanden.
Nach deiner Bearbeitung folgt hier das direkte Review.
