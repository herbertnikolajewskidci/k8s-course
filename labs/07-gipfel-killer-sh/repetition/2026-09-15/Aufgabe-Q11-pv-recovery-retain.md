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
   - Gleiche Kapazität (`1Gi`)
   - Gleicher AccessMode (`ReadWriteOnce`)
   - `storageClassName: ""` (oder passend zum PV, um dynamisches Provisioning
     zu unterbinden).
2. Verifiziere, dass sowohl das PV `pv-retained-data` als auch der neue PVC
   `recovered-pvc` in den Zustand `Bound` wechseln.

---

## 3. Deine Lösung (Befehle / Manifeste / Notizen)

### Lösung 1

```bash
# Deine Befehle / Notizen
```

---

## 4. Spickzettel & Doku-Hilfen

- **kubernetes.io Suchbegriff:** `persistent volume reclaim policy retain`
- **Zielseite & Klickpfad:** `Concepts -> Storage -> Persistent Volumes -> Reclaiming`
- **In-Page Suche (Strg+F):** `Retain` oder `claimRef`
- **In-Terminal Fastpath:**
  - `kubectl patch pv <pv-name> --type json -p '[{"op": "remove", "path": "/spec/claimRef"}]'`

---

## 5. Feedback & Korrekturen

Noch keine Einreichung vorhanden.
Nach deiner Bearbeitung folgt hier das direkte Review.
