# Aufgabe 5: Pending Pod Forensik – Die 4 realen WordPress-Szenarien

- **CKA Domäne:** Troubleshooting (30%) & Workloads & Scheduling (15%)
- **Lernberg-Stufe:** Hang → Gipfel
- **Issue:** #12
- **Prüfungsreferenz:** Herberts CKA-Erstversuch (3. Replica Pending –
  Ressourcen dürfen nicht geändert werden)

---

## 1. Wissensnetz & Mentales Modell (Birkenbihl)

### Die 4 Gesichter eines blockierten 3. Pods

Wenn ein Deployment mit 3 Replicas genau 2 Pods im Zustand `Running` hat und
der 3. Pod auf `Pending` verharrt, während Ressourcenlimits unberührt bleiben
müssen, gibt es im CKA genau vier Ursachenmuster:

```text
               3. Replica bleibt PENDING
                         │
      ┌──────────────────┼──────────────────┬──────────────────┐
      ▼                  ▼                  ▼                  ▼
[Szenario 1]       [Szenario 2]       [Szenario 3]       [Szenario 4]
HostPort-Kollision  Node-Cordon/Taint NodeSelector-Lücke  RWO Multi-Attach
(Port auf Node 1&2 (Node 2 nimmt      (Node 2 fehlt das  (Volume bindet
 bereits belegt)    keine Pods an)     passende Label)    nur an Node 1)
```

### Der goldene Forensik-Dreisatz (In 30 Sekunden zur Ursache)

Egal welches Szenario vorliegt: **Stochere niemals im Nebel.**
Führe immer diesen 3-Schritt aus:

1. **Pod-Name & Node-Verteilung prüfen:**

   ```bash
   kubectl get pods -n <ns> -o wide
   ```

   *Erkenntnis:* Auf welchen Nodes laufen Pod 1 und 2? Welcher Pod ist Pending?

2. **Events des blockierten Pods lesen (ohne grep-Abschneiden!):**

   ```bash
   kubectl describe pod <pending-pod> -n <ns> | tail -n 15
   ```

   oder gezielt:

   ```bash
   kubectl get events -n <ns> --field-selector reason=FailedScheduling
   ```

   *Erkenntnis:* Der Scheduler sagt dir wörtlich, warum die Nodes abgelehnt
   wurden:
   - *"didn't have free ports for the requested pod ports"* → HostPort!
   - *"node(s) were unschedulable / untolerated taint"* → Cordon / Taint!
   - *"didn't match Pod's node affinity/selector"* → Node-Label fehlt!
   - *"didn't match PersistentVolume's node affinity"* → PVC RWO Node-Lock!

3. **Cluster-Knoten oder Storage inspizieren:**

   ```bash
   kubectl get nodes --show-labels
   kubectl get pvc,pv -n <ns>
   ```

---

### Verifizierte Navigationspfade: Doku (Strg+F) & `kubectl explain`

Hier sind die exakten Suchbegriffe, URLs und Browser-Suchstrings (`Strg+F`)
für die offizielle `kubernetes.io/docs`-Dokumentation:

#### 1. Für Szenario 1: HostPort

- **Docs-Suchfeld:** `Container v1 core`
- **Erstes Suchergebnis:** *Reference → Kubernetes API → Workload Resources →
  Pod v1*
- **URL:**
  `https://kubernetes.io/docs/reference/kubernetes-api/workload-resources/pod-v1/`
- **Im Browser (`Strg+F`):** `hostPort`
- **Gefundene Definition:** *Number of port to expose on the host. If specified,
  must be unique on that host.*
- **In-Terminal Shortcut:**

  ```bash
  kubectl explain pod.spec.containers.ports.hostPort
  ```

#### 2. Für Szenario 2: Node Cordon & Uncordon

- **Docs-Suchfeld:** `Safely Drain a Node`
- **Erstes Suchergebnis:** *Tasks → Administer a Cluster → Safely Drain a Node*
- **URL:**
  `https://kubernetes.io/docs/tasks/administer-cluster/safely-drain-node/`
- **Im Browser (`Strg+F`):** `uncordon`
- **Gefundener Befehl:** `kubectl uncordon <node-name>`
- **In-Terminal Shortcut:**

  ```bash
  kubectl uncordon --help
  ```

#### 3. Für Szenario 3: NodeSelector & Labels

- **Docs-Suchfeld:** `Assigning Pods to Nodes`
- **Erstes Suchergebnis:** *Concepts → Scheduling, Preemption and Eviction →
  Assigning Pods to Nodes*
- **URL:**
  `https://kubernetes.io/docs/concepts/scheduling-eviction/assign-pod-node/`
- **Im Browser (`Strg+F`):** `nodeSelector`
- **Gefundene Definition & Befehl:**
  `kubectl label nodes <node-name> <key>=<value>`
- **In-Terminal Shortcut:**

  ```bash
  kubectl explain pod.spec.nodeSelector
  ```

#### 4. Für Szenario 4: Access Modes & PV Node Affinity

- **Docs-Suchfeld:** `Persistent Volumes Access Modes`
- **Erstes Suchergebnis:** *Concepts → Storage → Persistent Volumes*
- **URL:** `https://kubernetes.io/docs/concepts/storage/persistent-volumes/`
- **Im Browser (`Strg+F`):** `Access Modes`
- **Gefundene Tabelle:**
  - `ReadWriteOnce` (RWO): *the volume can be mounted as read-write by a single
    node.*
  - `ReadWriteMany` (RWX): *the volume can be mounted as read-write by many
    nodes.*
- **Im Browser (`Strg+F`):** `Node Affinity`
- **Gefundene Erklärung:** *A PV can specify node affinity to define constraints
  that limit what nodes this volume can be accessed from.*
- **In-Terminal Shortcuts:**

  ```bash
  kubectl explain pv.spec.accessModes
  kubectl explain pv.spec.nodeAffinity
  ```

---

## 2. Aufgabenstellung (Die 4 Prüfungs-Szenarien)

Wir trainieren die vier Szenarien nacheinander in separaten Namespaces.
Deine Lösungen und Befehle trägst du in `Aufgabe-5-solution.md` ein.

---

### Szenario 1: Der HostPort-Konflikt (Namespace: `wp-scenario-1`)

Im Namespace `wp-scenario-1` existiert das Deployment `wordpress-hp` mit
3 Replicas.

1. Identifiziere den blockierten Pod und lies die exakte Fehlermeldung aus den
   Scheduler-Events.
2. Ermittle, warum der 3. Pod keinen Platz findet, ohne die Ressourcenlimits
   zu ändern.
3. Repariere das Deployment so, dass der Port-Konflikt auf Node-Ebene gelöst
   wird und alle 3 Pods den Status `Running` einnehmen.
4. Verifiziere das Ergebnis mit `kubectl get pods -n wp-scenario-1 -o wide`.

---

### Szenario 2: Der "Unschedulable / Cordoned" Node (Namespace: `wp-scenario-2`)

Im Namespace `wp-scenario-2` existiert das Deployment `wordpress-cordon` mit
3 Replicas.

1. Lies die Events des blockierten Pods aus.
2. Überprüfe die Nodes des Clusters. Welcher Node verhindert das Scheduling?
3. Behebe das Problem auf Cluster-Ebene (ohne das Deployment zu editieren!).
4. Verifiziere, dass die 3. Replica startet und alle 3 Pods laufen.

---

### Szenario 3: Die NodeSelector-Lücke (Namespace: `wp-scenario-3`)

Im Namespace `wp-scenario-3` existiert das Deployment `wordpress-selector` mit
3 Replicas.

1. Lies die Events des blockierten Pods aus.
2. Finde heraus, welches Label das Deployment in `nodeSelector` fordert.
3. Untersuche die Nodes im Cluster und identifiziere den fehlenden Node.
4. Repariere den Zustand auf Node-Ebene, sodass alle 3 Replicas laufen.

---

### Szenario 4: Der PVC ReadWriteOnce (RWO) Node-Lock (Namespace: `wp-scenario-4`)

**Wichtiger Hinweis zum Aufgabentyp:**
Dieses Szenario ist **keine** klassische Reparaturaufgabe durch Umlegen eines
einzelnen Schalters im Deployment! In der CKA-Prüfung und in realen Clustern
tritt genau dieses Dilemma auf: Ein RWO-Volume lässt sich physisch nicht
zeitgleich auf zwei Nodes mounten. Hier geht es um **reine Ursachendiagnose und
Architektur-Bewertung**.

Im Namespace `wp-scenario-4` existiert das Deployment `wordpress-rwo` mit
einem gemounteten PersistentVolumeClaim `wp-pvc` (AccessMode: `ReadWriteOnce`).

1. Untersuche die Events des blockierten Pods und die Node-Zuordnung der
   Replicas.
2. Lies das Wort **`PersistentVolume's node affinity`** im Event und grenze
   es präzise gegen `Pod's node affinity/selector` ab.
3. Begründe anhand von `kubectl get pvc,pv -n wp-scenario-4`, warum der 3. Pod
   auf einem zweiten Worker-Node nicht starten kann.
4. Nenne die 3 standardisierten Kubernetes-Architekturmuster, mit denen dieser
   Konflikt für skalierte Web-Workloads gelöst wird.

---

## 3. Deine Lösung (Befehle / Notizen)

Trage deine Befehle und Notizen bitte in die separate Datei
`Aufgabe-5-solution.md` ein.

---

## 4. Spickzettel & Doku-Hilfen (Optional / Bei Bedarf)

- **Events ungekürzt filtern:**
  - `kubectl get events -n <ns> --field-selector reason=FailedScheduling`
  - `kubectl describe pod <pod-name> -n <ns> | tail -n 15`
- **Node-Status & Labels prüfen:**
  - `kubectl get nodes`
  - `kubectl get nodes --show-labels`
- **PV / PVC Status & Access Modes prüfen:**
  - `kubectl get pvc,pv -n <ns>`
- **Node entsperren / labeln:**
  - `kubectl uncordon <node-name>`
  - `kubectl label node <node-name> <key>=<value>`

---

## 5. Feedback & Korrekturen

### Gesamtüberblick deiner Bearbeitung

Du hast die forensische Analyse für alle 4 Szenarien erfolgreich durchgeführt:

- **Szenario 1 (HostPort):** Ursache im Event isoliert (`didn't have free ports
  for the requested pod ports`), `hostPort` im YAML entfernt, Rollout
  neugestartet -> Alle 3 Pods laufen.
- **Szenario 2 (Cordon):** Node-Status `SchedulingDisabled` via `kubectl get
  nodes` erkannt, `kubectl uncordon cka-cluster-worker2` ausgeführt -> Alle 3
  Pods laufen.
- **Szenario 3 (NodeSelector):** `nodeSelector: tier: backend` isoliert, Nodes
  mit `kubectl get nodes --show-labels` verglichen, `kubectl label nodes
  cka-cluster-worker2 tier=backend` gesetzt -> Alle 3 Pods laufen.
- **Szenario 4 (RWO Node-Lock):** Den entscheidenden Unterschied zwischen
  `Pod's node affinity` und `PersistentVolume's node affinity` herausgearbeitet,
  den PVC-Status `RWO` via `kubectl get pvc,pv` identifiziert und die 3
  Architekturalternativen festgehalten.

---

### Der Schlüssel-Unterschied: Pod's vs. PersistentVolume's

In Prüfungsstress verwechselt man die beiden Fehlermeldungen leicht, weil beide
`node affinity` enthalten:

1. **`didn't match Pod's node affinity/selector`**
   - **Subjekt:** `Pod's`
   - **Ursache:** Deployment/Pod (`nodeSelector`, `affinity`) oder Node-Label.
   - **Erster Befehl:** `kubectl get nodes --show-labels`

2. **`didn't match PersistentVolume's node affinity`**
   - **Subjekt:** `PersistentVolume's`
   - **Ursache:** Storage-Volume (`nodeAffinity` im PV).
   - **Erster Befehl:** `kubectl get pvc,pv -n <ns>`

---

### Die 3 Architektur-Lösungen für RWO-Multi-Node Konflikte

Wenn ein Workload mit mehreren Replicas über mehrere Nodes hinweg skalieren
soll:

1. **Lösung 1: Dateisystem auf `ReadWriteMany` (RWX) umstellen**
   - StorageClass mit NFS, CephFS, AWS EFS oder Azure Files nutzen.
   - Alle Pods auf beliebigen Nodes können parallel dieselbe Disk lesen und
     beschreiben.
2. **Lösung 2: `StatefulSet` statt `Deployment` verwenden**
   - Ein StatefulSet mit `volumeClaimTemplates` erzeugt für jeden Pod ein
     eigenes PV/PVC (`data-0`, `data-1`, `data-2`).
   - Jeder Pod bindet seine eigene Disk an seinem jeweiligen Node.
3. **Lösung 3: Cloud-Native / Stateless Architektur**
   - Uploads und persistente Daten wandern direkt in einen Objektspeicher
     (S3, MinIO).
   - Die Web-Pods benötigen gar kein Persistent Volume mehr und starten
     völlig frei auf jedem verfügbaren Node.
