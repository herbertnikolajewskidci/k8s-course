# Aufgabe 3: Node & Kubelet Failure

- **CKA Domäne:** Troubleshooting (30%)
- **Lernberg-Stufe:** Tal → Hang
- **Issue:** #8
- **Entspricht:** Block 3 aus `Aufgaben.md`

---

## 1. Wissensnetz & Mentales Modell (Birkenbihl)

### Das mentale Bild: Der Vor-Ort-Handwerker (Kubelet & Worker Node)

Kubelet ist der Vorarbeiter auf jeder einzelnen Node. Er nimmt Aufträge vom
API-Server entgegen und spricht mit der Container Runtime (`containerd`):

- **Node Status `NotReady`:**
  Der Kubelet-Vorarbeiter meldet sich nicht mehr bei der Zentrale (Heartbeat /
  `NodeLease` im Namespace `kube-node-lease` bleibt aus).
- **Kubelet startet nicht (Service Failed):**
  Häufigste Gründe:
  1. Falsche Konfiguration in `/var/lib/kubelet/config.yaml`
  2. Falscher Kubeconfig-Pfad in `/etc/systemd/system/kubelet.service.d/` oder
     `/etc/kubernetes/kubelet.conf`
  3. Falsche Container-Runtime-Endpunkte (`unix:///run/containerd/containerd.sock`)
  4. Swap ist auf dem Linux-Host aktiv (Kubelet verweigert standardmäßig den
     Dienst, wenn Swap nicht deaktiviert ist: `swapoff -a`)
- **DiskPressure / MemoryPressure / PIDPressure:**
  Die Node erstickt an Festplattenmüll (`/var/lib/docker`, `/var/lib/containerd`
  voll) oder ausgelastetem RAM. Kubelet setzt Taints und beginnt mit Eviction.

### Der 4-Stufen-Diagnosepfad bei Node-Problemen

```text
1. Node-Übersicht:      kubectl get nodes -o wide
2. Node-Bedingungen:    kubectl describe node <node-name> (Conditions & Events)
3. SSH auf die Node:    docker exec -it <node> bash
4. Systemd & Logs:      systemctl status kubelet
                        journalctl -u kubelet -e --no-pager
                        cat /var/lib/kubelet/config.yaml
```

---

## 2. Aufgabenstellung (Block 3)

Arbeitsumgebung: Worker-Nodes deines Clusters (`cka-cluster-worker` bzw.
`cka-cluster-worker2` via `docker exec -it <node> bash`).

---

### Aufgabe 3.1: Worker Node im Status `NotReady`

Ein Worker-Node verliert plötzlich den Kontakt zum Cluster.

1. Identifiziere mit `kubectl get nodes`, welcher Worker-Node den Status
   `NotReady` aufweist.
2. Analysiere mit `kubectl describe node <broken-node>` die Bedingungen
   (`Conditions` wie `Ready=False` oder `KubeletstoppedPostingStatusUpdates`).
3. Verbinde dich auf den betroffenen Worker-Node per `docker exec -it
   <broken-node> bash`.
4. Prüfe den Status des Kubelet-Dienstes (`systemctl status kubelet` oder
   Prozessstatus). Finde heraus, warum der Dienst gestoppt ist oder fehlschlägt.
5. Untersuche das Kubelet-Log mit `journalctl -u kubelet` (oder prüfe
   Konfigurationsdateien unter `/var/lib/kubelet/config.yaml` bzw.
   `/etc/systemd/system/kubelet.service.d/`).
6. Behebe den Fehler, starte Kubelet neu (`systemctl daemon-reload &&
   systemctl restart kubelet`), und stelle sicher, dass `kubectl get nodes` alle
   Nodes wieder als `Ready` anzeigt.

---

### Aufgabe 3.2: Kubelet Kubeconfig & Zertifikats-Mismatch

Nach einer Wartung startet Kubelet auf einem Worker-Node nicht mehr, weil der
Verbindungspfad zur Control-Plane fehlerhaft konfiguriert ist.

1. Untersuche den gestörten Worker-Node.
2. Lies die Kubelet-Startparameter aus
   (`/etc/systemd/system/kubelet.service.d/10-kubeadm.conf` oder
   `/var/lib/kubelet/kubeadm-flags.env`).
3. Prüfe, ob die referenzierte Kubeconfig `/etc/kubernetes/kubelet.conf`
   existiert und auf die richtige API-Server-Adresse zeigt.
4. Korrigiere die Datei und verifiziere, dass Kubelet erfolgreich startet und
   die Node wieder voll einsatzfähig ist.

---

### Aufgabe 3.3: Node Cordoning, Drain & Eviction Troubleshooting

Ein Worker-Node soll gewartet werden, aber Pods blockieren den Drain-Vorgang.

1. Schütze die Node `cka-cluster-worker` vor neuen Pods (`kubectl cordon`).
2. Versuche die Node mit `kubectl drain cka-cluster-worker --ignore-daemonsets`
   zu leeren.
3. Warum bricht `kubectl drain` ab, wenn Pods mit `emptyDir`-Volumes oder ohne
   Controller (Bare Pods) auf der Node laufen? Welche Flags werden benötigt
   (`--delete-emptydir-data`, `--force`)?
4. Schließe die Wartung ab und mache die Node wieder für neue Workloads
   verfügbar (`kubectl uncordon`).

---

## 3. Lösungen

Deine Befehle, Manifeste und Auswertungen führst du in der separaten Datei:
`labs/05-troubleshooting/Aufgabe-3-solution.md`.

---

## 4. Spickzettel & Doku-Hilfen (Optional / Bei Bedarf)

Falls du während der Bearbeitung nachschlagen möchtest:

- **kubernetes.io Keywords:** `troubleshoot kubelet`, `drain node`,
  `node conditions`
- **In-Terminal Syntax:**
  - `systemctl status kubelet`
  - `journalctl -u kubelet -n 50 --no-pager`
  - `kubectl drain --help`
  - `kubectl cordon <node>` / `kubectl uncordon <node>`
- **Wichtige Pfade:**
  - Kubelet Config: `/var/lib/kubelet/config.yaml`
  - Kubeadm Flags: `/var/lib/kubelet/kubeadm-flags.env`
  - Kubelet Kubeconfig: `/etc/kubernetes/kubelet.conf`

---

## 5. Feedback & Korrekturen

### Status-Überblick

- **Aufgabe 3.1:** Gelöst (Kubelet Config-Decode-Fehler sauber behoben)
- **Aufgabe 3.2:** Gelöst (Systemd Drop-In Kubeconfig-Flag korrigiert)
- **Aufgabe 3.3:** Gelöst (Node Maintenance mit Drain-Flags beherrscht)

---

### Detaillierte Analyse der einzelnen Aufgaben

#### Zu Aufgabe 3.1 (Worker Node NotReady & Kubelet Config)

- **Diagnoseweg:** `kubectl describe node` → `Kubelet stopped
  posting node status` erkannt. `journalctl -u kubelet` lieferte die genaue
  Ursache: `failed to decode: no kind KubeletConfiguration is registered for
  version kubelet.config.k8s.io/v1beta1_broken`.
- **Korrektur:** Datei `/var/lib/kubelet/config.yaml` per `vim` korrigiert und
  Dienst neugestartet.
- **Exam-Takeaway:** `NotReady` bei Nodes ist fast ausnahmslos auf
  Kubelet-Probleme zurückzuführen. Wenn Kubelet nicht läuft, ist der erste Blick
  immer in `journalctl -u kubelet -e`.

#### Zu Aufgabe 3.2 (Kubelet Service Drop-In & Kubeconfig)

- **Diagnoseweg:** `cat /etc/systemd/system/kubelet.service.d/10-kubeadm.conf`
  geprüft und das fehlerhafte Flag `--kubeconfig=...kubelet-broken.conf`
  gefunden.
- **Korrektur:** Mit `sed -i` ersetzt und `systemctl daemon-reload && systemctl
  restart kubelet` ausgeführt. Node wechselte sofort wieder auf `Ready`.
- **Exam-Takeaway:** Nach jeder Änderung an Systemd-Dateien (`.service` oder
  Drop-Ins unter `.service.d/`) ist `systemctl daemon-reload` zwingend
  erforderlich, bevor `restart` greift.

#### Zu Aufgabe 3.3 (Cordon, Drain & Flags)

- **Ausführung:**
  - `kubectl cordon cka-cluster-worker`
  - `kubectl drain cka-cluster-worker --ignore-daemonsets --delete-emptydir-data
    --force`
  - `kubectl uncordon cka-cluster-worker`
- **Exam-Takeaway:**
  1. `--ignore-daemonsets`: DaemonSet-Pods werden nicht evicted, da sie von K8s
     ohnehin wieder gestartet würden.
  2. `--delete-emptydir-data`: Zwingend nötig, wenn Pods `emptyDir` nutzen, da
     die Daten bei der Löschung verloren gehen.
  3. `--force`: Zwingend nötig für eigenständige Pods (ohne Deployment/RS/Job),
     da diese nach dem Löschen nicht neu gescheduled werden.
