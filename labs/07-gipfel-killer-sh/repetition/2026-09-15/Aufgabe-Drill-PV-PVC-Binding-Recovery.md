# Drill: PV/PVC Binding-Mechanik, Retain-Recovery & Troubleshooting

- **CKA Domäne:** Storage (10%)
- **Lernberg-Stufe:** Tal → Hang (Hands-on Drill)
- **Issue:** #12
- **Entspricht:** Killer.sh Subtask Drill (PV/PVC Lifecycle & Binding-Logik)

---

## 1. Wissensnetz & Mentales Modell (Birkenbihl)

Viele Prüflinge empfinden Storage als abstrakt – dabei folgt Kubernetes hier
einem simplen **Schrank-und-Bestellschein-Prinzip**:

### 1. Der Schrank im Lager (Das PersistentVolume / PV)

- Ein PV ist ein **physisches Möbelstück** im Cluster-Lager.
- Es gehört dem Administrator, ist **cluster-weit** (hat keinen Namespace!) und
  besitzt unveränderliche Eigenschaften:
  - **Größe / Kapazität:** z. B. `500Mi`
  - **Schlosstyp (AccessMode):** z. B. `ReadWriteOnce` (RWO, nur ein Node
    darf gleichzeitig schreiben).
  - **Hersteller-Etikett (`storageClassName`):** z. B. `manual` oder `standard`.

### 2. Der Bestellschein des Kunden (Der PersistentVolumeClaim / PVC)

- Ein PVC ist der **Bestellschein eines Pods** in einem konkreten Zimmer
  (Namespace `storage-recovery`).
- Der Kunde kreuzt auf dem Zettel an:
  *„Ich brauche ein Fach mit mindestens X MiB, Schlosstyp Y und Hersteller Z.“*

### 3. Die 3 goldenen Matching-Regeln (Warum bindet ein PVC oder nicht?)

Der Kubernetes PV-Controller durchsucht das Lager. Ein PV wird **NUR DANN**
zugewiesen (`Bound`), wenn alle 3 Bedingungen gleichzeitig erfüllt sind:

1. **Kapazität (`PV.capacity >= PVC.request`):**  
   Das PV muss **mindestens so groß oder größer** sein als bestellt!  
   *(Falle: Ein 500Mi-PV kann niemals eine 1Gi-Bestellung erfüllen! Ein
   10-Liter-Rucksack passt nicht für 20 Liter Gepäck).*
2. **AccessModes:**  
   Das PV muss den vom PVC gewünschten Zugriffsmodus unterstützen.
3. **StorageClass:**  
   Beide müssen das **exakt selbe Etikett** tragen:
   - Steht im PV `storageClassName: manual`, MUSS der PVC auch
     `storageClassName: manual` fordern!
   - Steht im PVC `storageClassName: ""` (leer), sucht Kubernetes nur nach
     PVs, die überhaupt keine StorageClass besitzen.

### 4. Der Lebenszyklus bei `ReclaimPolicy: Retain`

- **Available:** Schrank ist leer und wartet auf Kunden.
- **Bound:** Ein Kunde (PVC) hat das Fach gemietet.
- **Released (Die Falle):** Der Kunde kündigt (PVC wird gelöscht). Weil die
  Policy `Retain` lautet, werden die Festplattendaten nicht gelöscht!
  Aber das PV bleibt im Zustand `Released` gesperrt, weil im Feld
  `pv.spec.claimRef` immer noch der Name des alten, gelöschten Kunden
  eingraviert ist. Kein neuer Kunde darf an dieses Fach!
- **Die Befreiung:** Erst wenn der Admin `spec.claimRef` entfernt (null setzt),
  springt das PV zurück auf `Available` und bindet sofort an den neuen PVC!

**KaWa BINDING:**

- **B**estellung via Claim (PVC)
- **I**dentische StorageClass zwingend erforderlich
- **N**amensraum-Bindung (PVC ist namespaced, PV ist cluster-wide)
- **D**imensionierung (PV-Größe muss Bestellung abdecken)
- **I**nterne `claimRef` blockiert im Status Released
- **N**ullsetzen von `claimRef` befreit das Volume
- **G**arantierter Datenerhalt mit Retain

### Live verifizierter Doku-Navigationsanker

- **kubernetes.io Docs-Suchfeld:** `persistent volume reclaim policy retain`
- **Zielseite:** `Concepts → Storage → Persistent Volumes → Reclaiming`
- **In-Page Suche (`Strg+F` / `Cmd+F`):** `Retain` oder `claimRef`
- **In-Terminal Fastpath:**
  - `kubectl describe pvc <pvc-name>` (Der Event-Log ganz unten erklärt sofort
    haargenau, warum kein PV passt!)

---

## 2. Aufgabenstellung (Step-by-Step Binding-Drill auf `cka2560`)

Host für diesen Drill: `ssh cka2560`.

*(Hinweis: Trage deine Lösungen, Befehle und Notizen bitte in die separate Datei
`Aufgabe-Drill-PV-PVC-Binding-Recovery-solution.md` ein.)*

### Aufgabe 1: Die Diagnose am wartenden PVC durchführen

1. Untersuche den aktuellen Zustand des ungebundenen PVCs:

   ```bash
   kubectl describe pvc recovered-pvc -n storage-recovery
   ```

2. Lies den Event-Log ganz unten. Warum meldet Kubernetes `FailedBinding`?
   Notiere die exakte Meldung.

### Aufgabe 2: Den Schrank (PV) vs. den Bestellschein (PVC) abgleichen

1. Hole die genauen Eigenschaften des PersistentVolumes:

   ```bash
   kubectl get pv pv-retained-data -o yaml | grep -E "(storage:|storageClassName|ReadWrite)"
   ```

2. Vergleiche die Eigenschaften von PV und deinem PVC:
   - Welche Kapazität hat das PV? (500Mi oder 1Gi?)
   - Welchen `storageClassName` hat das PV? (`manual` oder `""`?)
   - Warum konnte Kubernetes die beiden bisher nicht verbinden?

### Aufgabe 3: Den PVC korrigieren und die Bindung herstellen

1. Lösche den bisherigen, fehlerhaften PVC:

   ```bash
   kubectl delete pvc recovered-pvc -n storage-recovery
   ```

2. Erstelle eine saubere Manifest-Datei `/tmp/recovered-pvc.yaml` mit den
   exakt passenden Werten:
   - `metadata.name`: `recovered-pvc`
   - `metadata.namespace`: `storage-recovery`
   - `spec.accessModes`: `[ReadWriteOnce]`
   - `spec.storageClassName`: `manual`
   - `spec.resources.requests.storage`: `500Mi`
   - *(Optionaler Turbo-Trick: `spec.volumeName: pv-retained-data` bindet den
     PVC direkt und kompromisslos an dieses eine PV).*
3. Wende die Datei an: `kubectl apply -f /tmp/recovered-pvc.yaml`.

### Aufgabe 4: Das erfolgreiche Re-Binding verifizieren

1. Prüfe den Status von PV und PVC:

   ```bash
   kubectl get pv pv-retained-data && kubectl get pvc recovered-pvc -n storage-recovery
   ```

2. Bestätige, dass beide Ressourcen nun den Status `Bound` aufweisen.

---

## 3. Spickzettel & Doku-Hilfen

- **Der PV-Befreiungstrick (von Released auf Available):**

  ```bash
  kubectl patch pv <pv-name> -p '{"spec":{"claimRef": null}}'
  ```

- **Die 3 Match-Pfeiler für PVC:**
  1. `resources.requests.storage` <= `pv.spec.capacity.storage`
  2. `accessModes` muss im PV vorhanden sein
  3. `storageClassName` muss buchstabengetreu übereinstimmen
- **Direktbindung erzwingen:**
  Im PVC unter `spec:` das Feld `volumeName: <pv-name>` setzen.

---

## 4. Feedback & Korrekturen

Noch keine Einreichung vorhanden.
Nach deiner Bearbeitung folgt hier das direkte Review.
