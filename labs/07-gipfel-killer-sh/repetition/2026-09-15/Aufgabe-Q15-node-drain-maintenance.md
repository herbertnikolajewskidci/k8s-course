# Aufgabe Q15: Node Maintenance (Safe Drain & Uncordon)

- **CKA Domäne:** Cluster Architecture, Installation & Configuration (25%)
- **Lernberg-Stufe:** Gipfel (Exam Pace & Troubleshooting)
- **Cluster & Host:** `ssh cka6016`
- **Wiederholungs-Grund:** Explizit von Herbert als Drill vorgemerkt (4/6 Punkte)

---

## 1. Wissensnetz & Mentales Modell (Birkenbihl)

Die Node-Wartung ist wie eine temporäre Gleissperrung am Bahnhof:

1. **Cordon (Absperrband):** Markiert den Node als `SchedulingDisabled`.
   Bestehende Passagiere (laufende Pods) bleiben sitzen, aber keine neuen
   Passagiere dürfen zusteigen.
2. **Drain (Evakuierung):**
   - Schickt alle Passagiere geordnet vom Bahnsteig.
   - **Pflicht-Schutzschilde:**
     - `--ignore-daemonsets`: Streckenwärter (Flannel, Kube-Proxy) bleiben
       im Bahnhof, da sie an das Gleis gebunden sind.
     - `--delete-emptydir-data`: Passagiere mit Handgepäck (`emptyDir`),
       das beim Aussteigen verloren geht, stimmen dem Verlust zu.
3. **Uncordon (Freigabe):** Nach der Wartung wird das Absperrband entfernt
   (`kubectl uncordon`). Der Bahnhof kehrt sofort in den Zustand `Ready`
   zurück und nimmt wieder neue Workloads auf.

**KaWa DRAIN:**

- **D**aemonSets müssen bewusst ignoriert werden (`--ignore-daemonsets`)
- **R**eady-Zustand wird vorübergehend für Scheduling blockiert
- **A**utomatische Neuplanung auf verbleibenden Nodes
- **I**solierung gegen Neu-Scheduling (`cordon`)
- **N**ach Wartung sofort `uncordon` nicht vergessen!

---

## 2. Aufgabenstellung (Repetition Q15)

Host für diese Aufgabe: `ssh cka6016`.

Node `cka6016` soll für eine Kernel-Wartung vorbereitet und anschließend
wieder freigegeben werden.

### Aufgabe 1: Sicheren Node-Drain ausführen

1. Führe den Drain-Befehl für Node `cka6016` mit den CKA-Standardflags aus:

   ```bash
   kubectl drain cka6016 --ignore-daemonsets --delete-emptydir-data
   ```

2. Prüfe mit `kubectl get nodes`, dass der Node den Status
   `Ready,SchedulingDisabled` meldet.
3. Überprüfe die Eviction der Workloads in `maintenance-drill`:
   `kubectl get pods -n maintenance-drill`

### Aufgabe 2: Node wieder in den Dienst stellen (Uncordon)

1. Markiere den Node wieder als belegbar:

   ```bash
   kubectl uncordon cka6016
   ```

2. Kontrolliere, dass die Einschränkung `SchedulingDisabled` verschwunden
   ist und der Node wieder vollständig `Ready` meldet.
3. Verifiziere, dass die Replicas des Deployments `worker-drain-test`
   sauber im Zustand `2/2 Running` laufen.

---

## 3. Spickzettel & Doku-Hilfen

- **kubernetes.io Suchbegriff:** `safely drain a node`
- **Zielseite & Klickpfad:** `Tasks -> Administer a Cluster -> Safely Drain a Node`
- **In-Page Suche (Strg+F):** `kubectl drain` oder `--delete-emptydir-data`
- **In-Terminal Fastpath:**
  - `kubectl drain --help` (zeigt alle 3 Sicherheits-Flags im Detail)

---

## 4. Feedback & Korrekturen

### Ergebnis-Scorecard & Cluster-Prüfung: 6 / 6 Punkte (100% PASS)

Die Lösung wurde live auf Host `cka6016` verifiziert.
Ergebnis des Prüflaufs:

- **Drain-Ausführung:** `kubectl drain cka6016 --ignore-daemonsets --delete-emptydir-data`
  lief fehlerfrei durch. Alle DaemonSets wurden ignoriert, alle Workloads
  sauber evakuiert.
- **Node-Status während der Wartung:** `cka6016` meldete vorschriftsmäßig
  `Ready,SchedulingDisabled`.
- **Workload-Verhalten:** Die evakuierten Pods des Deployments
  `worker-drain-test` gingen während der Sperre erwartungsgemäß in den
  Status `Pending`.
- **Wiederinbetriebnahme (Uncordon):** `kubectl uncordon cka6016` hob die
  Scheduling-Sperre auf.
- **Endzustand:** `cka6016` meldet `Ready` (ohne SchedulingDisabled), und
  beide Replicas von `worker-drain-test` laufen wieder stabil im Status
  `1/1 Running`.

---

### Detailliertes Review & CKA-Prüfungs-Takeaways

#### 1. Die beiden Pflicht-Flags im Fingergedächtnis

In der CKA-Prüfung verlangt fast jedes Node-Maintenance- oder
Upgrade-Szenario genau diese beiden Flags:

- `--ignore-daemonsets`: Weil System-Dienste wie Netzwerk-Plugins (Flannel,
  Calico) an den physischen Node gebunden sind und niemals evakuiert werden
  können.
- `--delete-emptydir-data`: Weil Pods mit temporären Verzeichnissen
  (`emptyDir`) beim Löschen ihre lokalen Zwischendaten verlieren. Kubernetes
  fordert dieses Flag als explizite Bestätigung, dass dieser Datenverlust
  akzeptiert wird.

#### 2. Der Lifecycle auf Single-Node-Clustern

Dein Log zeigt ein sehr wichtiges Verhalten:

```text
cka-admin@cka6016:~$ k -n maintenance-drill get pods
NAME READY STATUS RESTARTS AGE
worker-drain-test-6bbd6f8595-5tlg6 0/1 Pending 0 5m40s
worker-drain-test-6bbd6f8595-khxkm 0/1 Pending 0 5m46s
```

Wenn ein Node gedraint wird, löscht Kubernetes die alten Pods. Der
Deployment-Controller erstellt sofort neue Pods – diese bleiben aber im
Status `Pending`, solange der Node `SchedulingDisabled` ist. Erst nach dem
`uncordon` weist der Scheduler die Pods wieder zu und sie schalten auf
`Running`.

---

### Doku- & In-Terminal Fastpath (Unter 15 Sekunden)

- **In-Terminal Schnellhilfe:**

  ```bash
  kubectl drain -h | grep -E "(daemonsets|emptydir)"
  ```

  Zeigt sofort die beiden exakten Parameternamen ohne langes Suchen.
