# Aufgabe Q11: PV Recovery & Re-Binding (Retain Policy)

- **CKA Domäne:** Storage (10%)
- **Lernberg-Stufe:** Gipfel (Exam Pace & Troubleshooting)
- **Cluster & Host:** `ssh cka2560`
- **Wiederholungs-Grund:** Fehlversuch in Exam (0/6 Punkte,
  PV im Status Released festgefahren)

---

## 1. Wissensnetz & Mentales Modell (Birkenbihl)

Ein PersistentVolume mit `persistentVolumeReclaimPolicy: Retain` ist wie
ein Bankschließfach:

- Wenn der Mieter kündigt (der alte PVC `old-pvc` wird gelöscht), werden die
  Daten **nicht** gelöscht.
- Das Schließfach wechselt in den Sicherheitszustand `Released`.
- **Die Falle:** Ein anderer Kunde (`recovered-pvc`) kann das Schließfach
  trotzdem **nicht** mieten! Warum? Weil das PV im internen Feld
  `spec.claimRef` immer noch den Namen und die UID des alten gelöschten PVCs
  eingraviert hat.
- **Die Lösung (Die Befreiung):** Erst wenn du als Cluster-Administrator
  die alte Gravur entfernst (durch Editieren oder Patchen von `spec.claimRef: null`),
  kehrt das PV in den Zustand `Available` zurück und bindet sofort an den
  wartenden neuen PVC!

**KaWa RETAIN:**

- **R**ückhalt der Daten bei PVC-Löschung
- **E**hemaliger PVC bleibt im `claimRef` blockierend hinterlegt
- **T**rennung von Volume und Claim
- **A**vailable wird erst durch Löschen von `spec.claimRef` erreicht
- **I**ntaktes Dateisystem bleibt auf der Festplatte erhalten
- **N**eu-Bindung an `recovered-pvc` gelingt sofort

---

## 2. Aufgabenstellung (Repetition Q11)

Host für diese Aufgabe: `ssh cka2560`.

Im Cluster existiert ein PersistentVolume namens `pv-retained-data` mit
wertvollen Altdaten. Nach der Löschung des alten Claims verharrt das PV im
Status `Released`.

### Aufgabe 1: PersistentVolume aus Released-Zustand befreien

1. Untersuche das PersistentVolume `pv-retained-data`:
   `kubectl get pv pv-retained-data -o yaml`
2. Entferne die Blockade im Feld `spec.claimRef`, sodass das PV wieder den
   Status `Available` annimmt:

   ```bash
   kubectl patch pv pv-retained-data -p '{"spec":{"claimRef": null}}'
   ```

### Aufgabe 2: Neuen PVC erstellen & Re-Binding verifizieren

1. Erstelle im Namespace `storage-recovery` einen neuen PVC namens
   `recovered-pvc`:
   - Gleiche Kapazität (`500Mi`)
   - Gleicher AccessMode (`ReadWriteOnce`)
   - Gleiche StorageClass (`storageClassName: manual`).
2. Verifiziere, dass sowohl das PV `pv-retained-data` als auch der neue PVC
   `recovered-pvc` in den Zustand `Bound` wechseln.

---

## 3. Spickzettel & Doku-Hilfen

- **kubernetes.io Suchbegriff:** `persistent volume reclaim policy retain`
- **Zielseite & Klickpfad:** `Concepts -> Storage -> Persistent Volumes -> Reclaiming`
- **In-Page Suche (Strg+F):** `Retain` oder `claimRef`
- **In-Terminal Fastpath:**
  - `kubectl patch pv <pv-name> --type json -p '[{"op": "remove", "path": "/spec/claimRef"}]'`

---

## 4. Feedback & Korrekturen

### Ergebnis-Scorecard & Cluster-Prüfung: 6 / 6 Punkte (100% PASS)

Die Lösung wurde live auf Cluster `cka2560` verifiziert.
Ergebnis des automatisierten Prüflaufs:

- **PV-Status:** `pv-retained-data` steht im Zustand **`Bound`** und bindet an
  `storage-recovery/recovered-pvc`.
- **PVC-Status:** `recovered-pvc` steht im Zustand **`Bound`** mit Kapazität
  `500Mi`, AccessMode `ReadWriteOnce` und StorageClass `manual`.
- **Datenerhalt:** Die Altdaten unter `/mnt/data/retained-pv` blieben
  vollständig erhalten.
- **Evaluator:** `verify-all-17.py` bewertet Q11 mit vollen **6 von 6 Punkten**.

---

### Detailliertes Review & CKA-Prüfungs-Takeaways

#### 1. Die Befreiung über YAML (`claimRef: null`)

Dein Ansatz, das PV in eine Datei zu exportieren, `claimRef: null` zu setzen
und mit `kubectl apply -f` wieder einzuspielen, war **100 % valide und
erfolgreich**. Kubernetes hat die Bindung zum alten gelöschten Claim sofort
aufgehoben und das PV in den Zustand `Available` überführt.

*Merke dir für die Prüfung:*

- Entweder via YAML: `claimRef: null`
- Oder im Schnelldurchlauf via `kubectl edit pv <pv-name>`: Den Block
  `claimRef:` in Vim mit `dd` löschen und `:wq` speichern.
- Beide Wege führen zum exakt selben Ergebnis im API-Server.

#### 2. Das 3-Pfeiler-Binding (Warum der PVC erst wartete)

Ein PVC bindet nur dann an ein vorhandenes PV, wenn alle drei Kriterien
gleichzeitig matchen:

1. **Kapazität:** `PVC.storage <= PV.capacity` (500Mi <= 500Mi).
2. **AccessModes:** Mindestens ein AccessMode muss übereinstimmen (`RWO`).
3. **StorageClass:** Beide müssen dieselbe Klasse tragen (`manual`).

Sobald du `recovered-pvc.yaml` von den fehlerhaften Vorgabewerten (`1Gi`, `""`)
auf `500Mi` und `manual` korrigiert hast, band der Controller das Volume in
unter einer Sekunde.

---

### Doku- & In-Terminal Fastpath (Unter 20 Sekunden)

- **kubernetes.io Docs-Suchfeld:** `persistent volume reclaim policy retain`
- **Zielseite:** `Concepts → Storage → Persistent Volumes → Reclaiming`
- **In-Page Suche (`Strg+F`):** `Retain` oder `claimRef`
- **In-Terminal Fastpath (Vim-Edit):**

  ```bash
  kubectl edit pv pv-retained-data
  ```

  (Zeile `claimRef:` mit Unterfeldern löschen und speichern).
