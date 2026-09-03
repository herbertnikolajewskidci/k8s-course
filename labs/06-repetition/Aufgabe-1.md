# Aufgabe 1: Advanced Scheduling (NodeAffinity, PodAffinity & PodAntiAffinity)

- **CKA Domäne:** Workloads & Scheduling (15%)
- **Lernberg-Stufe:** Hang → Gipfel
- **Issue:** #9
- **Entspricht:** Block 1 aus `Aufgaben.md`

---

## 1. Wissensnetz & Mentales Modell (Birkenbihl)

### Das mentale Bild: Der Hotelgast & die Nachbarschaftsregeln

Kubernetes-Scheduling mit Affinitäten funktioniert wie die Zimmervergabe in
einem großen Hotel:

1. **NodeAffinity (Zimmerausstattung & Lage):**
   - Der Gast (Pod) sagt: „Ich will/muss ein Zimmer mit Balkon (Node-Label
     `tier=compute`).“
   - **Hard Constraint (`requiredDuringScheduling...`):** Wenn kein Zimmer mit
     Balkon frei ist, schlafe ich lieber auf der Straße (`Pending`).
   - **Soft Constraint (`preferredDuringScheduling...`):** Am liebsten mit
     Balkon, aber wenn keins frei ist, nehme ich zur Not auch jedes andere
     Zimmer.
   - **`IgnoredDuringExecution`:** Wenn das Hotel den Balkon abreißt, während
     der Gast schon im Zimmer schläft, wird er nicht rausgeworfen (der Pod läuft
     einfach weiter).

2. **PodAffinity (Die besten Freunde / Co-Location):**
   - Der Pod sagt: „Ich will im selben Gebäude/Stockwerk wohnen wie mein bester
     Freund (z. B. der In-Memory Cache `app=cache`).“
   - Technischer Sinn: Geringe Latenz zwischen zusammengehörigen Microservices.
   - **`topologyKey: kubernetes.io/hostname`:** Definiert die Grenze: „Auf
     exakt derselben Node.“

3. **PodAntiAffinity (Die Streithähne / Brandschutz & Hochverfügbarkeit):**
   - Der Pod sagt: „Wir dürfen niemals im selben Gebäude/Zimmer untergebracht
     sein (Replikate desselben Services).“
   - Technischer Sinn: Fällt Node 1 aus, lebt die Anwendung auf Node 2 nahtlos
     weiter.
   - Wenn mehr Replikate gefordert werden als Nodes existieren, bleibt das
     überzählige Replikat auf `Pending` stehen.

---

## 2. Aufgabenstellung (Block 1)

Namespace für diesen Block: `scheduling-lab`.

Erstelle zu Beginn den Namespace:

```bash
kubectl create namespace scheduling-lab
```

---

### Aufgabe 1.1: NodeAffinity (Hard Constraint)

Es sollen dedizierte Compute-Nodes für rechenintensive Workloads genutzt
werden.

1. Versehe deine Worker-Nodes mit folgenden Labels:
   - Node `cka-cluster-worker`: `tier=compute, env=production`
   - Node `cka-cluster-worker2`: `tier=storage, env=production`
2. Erstelle ein Deployment namens `compute-workload` im Namespace
   `scheduling-lab` mit 3 Replikaten (`image: nginx:alpine`).
3. Konfiguriere `nodeAffinity` mit
   `requiredDuringSchedulingIgnoredDuringExecution` so, dass die Pods
   ausschließlich auf Nodes mit dem Label `tier=compute` gescheduled werden
   dürfen (`matchExpressions` mit Operator `In`).
4. Verifiziere mit `kubectl get pods -n scheduling-lab -o wide`, dass alle 3
   Pods ausnahmslos auf `cka-cluster-worker` laufen.

---

### Aufgabe 1.2: PodAffinity (Co-Location Pattern)

Ein Web-Frontend soll immer auf derselben Node wie der zugehörige Cache laufen,
um Netzwerklatenz zu minimieren.

Starte zunächst den Cache-Pod auf `cka-cluster-worker2`:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: redis-cache
  namespace: scheduling-lab
  labels:
    app: cache
spec:
  nodeName: cka-cluster-worker2
  containers:
    - name: redis
      image: redis:alpine
```

Führe anschließend folgende Schritte aus:

1. Erstelle ein Deployment namens `web-frontend` mit 2 Replikaten
   (`image: nginx:alpine`) im Namespace `scheduling-lab`.
2. Konfiguriere `podAffinity` mit
   `requiredDuringSchedulingIgnoredDuringExecution` so, dass die Frontend-Pods
   nur auf Nodes platziert werden, auf denen bereits ein Pod mit dem Label
   `app=cache` läuft (`topologyKey: kubernetes.io/hostname`).
3. Verifiziere mit `kubectl get pods -n scheduling-lab -o wide`, dass beide
   Frontend-Pods auf `cka-cluster-worker2` platziert wurden.

---

### Aufgabe 1.3: PodAntiAffinity (HA Node Spreading)

Replikate eines API-Gateways dürfen aus Hochverfügbarkeitsgründen niemals auf
derselben Node laufen.

1. Erstelle ein Deployment namens `ha-api` im Namespace `scheduling-lab` mit
   2 Replikaten (`image: nginx:alpine`), Label `app=ha-api`.
2. Konfiguriere `podAntiAffinity` mit
   `requiredDuringSchedulingIgnoredDuringExecution` so, dass kein Node mehr als
   einen Pod mit dem Label `app=ha-api` beherbergen darf (`topologyKey:
   kubernetes.io/hostname`).
3. Verifiziere mit `kubectl get pods -n scheduling-lab -o wide`, dass genau ein
   Pod auf `cka-cluster-worker` und genau ein Pod auf `cka-cluster-worker2`
   platziert wurde.
4. Skaliere das Deployment nun auf 3 Replikate:
   `kubectl scale deployment ha-api -n scheduling-lab --replicas=3`
5. Beobachte den Status des 3. Pods. Warum verbleibt er im Status `Pending`?
   Welche Meldung liefert `kubectl describe pod`?

---

## 3. Lösungen

Deine Befehle, Manifeste und Auswertungen führst du in der separaten Datei:
`labs/06-repetition/Aufgabe-1-solution.md`.

---

## 4. Spickzettel & Doku-Hilfen (Optional / Bei Bedarf)

Falls du während der Bearbeitung nachschlagen möchtest:

- **kubernetes.io Keywords:** `assigning pods to nodes`, `node affinity`,
  `pod anti-affinity`
- **In-Terminal Syntax:**
  - `kubectl explain deployment.spec.template.spec.affinity.nodeAffinity`
  - `kubectl explain deployment.spec.template.spec.affinity.podAffinity`
  - `kubectl explain deployment.spec.template.spec.affinity.podAntiAffinity`
- **CLI-Hilfe:**
  - `kubectl label node <node> key=value`
  - `kubectl get nodes --show-labels`
  - `kubectl get pods -n <ns> -o wide`

---

## 5. Feedback & Korrekturen

### Status-Überblick

- **Aufgabe 1.1:** Gelöst (NodeAffinity Hard Constraint auf `tier=compute`)
- **Aufgabe 1.2:** Gelöst (PodAffinity Co-Location mit Cache-Pod auf Worker 2)
- **Aufgabe 1.3:** Gelöst (PodAntiAffinity Node-Spreading & Pending-Beweis)

---

### Live-Cluster Analyse & Verifikation

#### Zu Aufgabe 1.1 (NodeAffinity Hard Constraint)

- **Cluster-Zustand:**
  - `cka-cluster-worker`: `tier=compute, env=production`
  - `cka-cluster-worker2`: `tier=storage, env=production`
  - Deployment `compute-workload`: 3/3 Replikate laufen ausnahmslos auf
    `cka-cluster-worker`.
- **Konfiguration:** `nodeAffinity` mit
  `requiredDuringSchedulingIgnoredDuringExecution`, `nodeSelectorTerms` und
  `matchExpressions` (`key: tier`, `operator: In`, `values: [compute]`)
  perfekt umgesetzt.
- **Exam-Takeaway:** `nodeSelectorTerms` ist eine Liste. Mehrere Terme werden
  als ODER ausgewertet, mehrere `matchExpressions` innerhalb eines Terms als
  UND.

#### Zu Aufgabe 1.2 (PodAffinity Co-Location)

- **Cluster-Zustand:**
  - Pod `redis-cache` läuft auf `cka-cluster-worker2` mit Label `app=cache`.
  - Deployment `web-frontend`: Beide Replikate laufen exklusiv auf
    `cka-cluster-worker2`.
- **Konfiguration:** `podAffinity` mit
  `requiredDuringSchedulingIgnoredDuringExecution`, `labelSelector` auf
  `app=cache` und `topologyKey: kubernetes.io/hostname` fehlerfrei konfiguriert.
- **Exam-Takeaway:** `topologyKey: kubernetes.io/hostname` sorgt für Co-Location
  auf Node-Ebene. In Multi-AZ-Cloud-Clustern wird alternativ oft
  `topologyKey: topology.kubernetes.io/zone` verwendet.

#### Zu Aufgabe 1.3 (PodAntiAffinity HA Spreading)

- **Cluster-Zustand:**
  - Deployment `ha-api` mit 3 Replikaten:
    - Pod 1: `cka-cluster-worker` (1/1 Running)
    - Pod 2: `cka-cluster-worker2` (1/1 Running)
    - Pod 3: `<none>` (0/1 Pending)
- **Scheduler-Beweis:**
  `kubectl describe pod` liefert:
  `0/3 nodes are available: 1 node(s) had untolerated taint(s),`
  `2 node(s) didn't match pod anti-affinity rules.`
- **Exam-Takeaway:** Das ist das Standard-Szenario für Anti-Affinity in der
  CKA-Prüfung. Wenn `required...` gesetzt ist und mehr Replikate gefordert
  werden als qualifizierte Nodes existieren, bleibt der überzählige Pod
  garantiert `Pending`.
