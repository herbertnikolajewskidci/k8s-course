# Aufgabe 3: Pods mit Volumes & PVCs (Persistenz & Read-Only)

- **CKA Domäne:** Storage (10%)
- **Lernberg-Stufe:** Tal → Hang
- **Issue:** #6
- **Entspricht:** Block 3 aus `Aufgaben.md`

---

## 1. Wissensnetz & Mentales Modell (Birkenbihl)

### Das 2-Stufen-Prinzip beim Volume-Mounting

Ein Pod verbindet sich in zwei getrennten Schritten mit Speicher:

```text
                  ┌─────────────────────────────────────┐
                  │         POD SPEZIFIKATION           │
                  │                                     │
                  │ 1. spec.volumes:                    │
                  │    - name: app-data                 │
                  │      persistentVolumeClaim:         │
                  │        claimName: my-pvc            │
                  │                                     │
                  │ 2. spec.containers[*].volumeMounts: │
                  │    - name: app-data                 │
                  │      mountPath: /var/data           │
                  │      readOnly: true/false           │
                  └─────────────────────────────────────┘
```

### Die 3 Kern-Muster im CKA-Exam

1. **Stufe 1 (`spec.volumes`):**
   - Definiert die **Quelle** des Speichers auf Pod-Ebene (PVC, `emptyDir`,
     `configMap`, `secret`, `hostPath`).
2. **Stufe 2 (`spec.containers[*].volumeMounts`):**
   - Definiert das **Einhängeziel (MountPath)** innerhalb des jeweiligen
     Containers und setzt Zugriffsrechte (`readOnly: true`).
3. **Persistenz-Garantie:**
   - Wenn ein Pod abstürzt oder gelöscht wird, geht der flüchtige Container-
     Speicher verloren.
   - Alle Daten auf dem gemounteten PVC bleiben auf dem `PersistentVolume`
     erhalten und stehen dem nächsten Pod sofort wieder zur Verfügung.

---

## 2. Aufgabenstellung (Block 3)

Namespace für diesen Block: `storage-lab`.

### Vorbereitung: PVC bereitstellen

Erstelle im Namespace `storage-lab` einen PVC `pvc-shared` (Größe: `200Mi`,
AccessMode: `ReadWriteOnce`, StorageClass: `sc-fast`).

---

### Aufgabe 3.1: Daten schreiben auf Persistent Storage

1. Erstelle ein Pod-Manifest `writer-pod.yaml` im Namespace `storage-lab`:
   - Name: `writer-pod`.
   - Image: `busybox:latest`.
   - Volume: Nutzt den PVC `pvc-shared`.
   - MountPath: `/data/shared`.
   - Container-Befehl: Schreibt in einer Endlosschleife jede Sekunde einen
     Timestamp in die Datei `/data/shared/status.log`
     (`sh -c "while true; do date >> /data/shared/status.log; sleep 1; done"`).
2. Starte den Pod und prüfe nach ca. 5 Sekunden, ob die Datei gefüllt wird:
   `kubectl exec -n storage-lab writer-pod -- cat /data/shared/status.log`.

---

### Aufgabe 3.2: Persistenz nach Pod-Löschung nachweisen

1. Lösche den Pod `writer-pod` (`kubectl delete pod writer-pod -n storage-lab`).
2. Erstelle ein neues Pod-Manifest `reader-pod.yaml`:
   - Name: `reader-pod`.
   - Image: `busybox:latest`.
   - Volume: Nutzt denselben PVC `pvc-shared`.
   - MountPath: `/data/shared`.
   - Befehl: `sleep 3600`.
3. Starte `reader-pod` und verifiziere, dass die zuvor erstellte Datei
   `/data/shared/status.log` vollständig vorhanden und lesbar ist.

---

### Aufgabe 3.3: Read-Only Volume-Mount konfigurieren (CKA-Klassiker)

1. Erstelle ein Pod-Manifest `secure-reader.yaml` im Namespace `storage-lab`:
   - Name: `secure-reader`.
   - Image: `busybox:latest`.
   - Volume: Nutzt den PVC `pvc-shared`.
   - MountPath: `/data/readonly`.
   - **Bedingung:** Das Volume muss im Container als **Read-Only** gemountet
     sein (`readOnly: true`).
   - Befehl: `sleep 3600`.
2. Starte den Pod und teste:
   - Lesen der Datei `/data/readonly/status.log` (muss klappen).
   - Versuch, eine neue Datei zu schreiben:
     `kubectl exec -n storage-lab secure-reader -- touch /data/readonly/test.txt`
     (muss mit der Fehlermeldung `Read-only file system` scheitern!).

---

## 3. Deine Lösung (Befehle / Manifeste / Notizen)

### Vorbereitung: PVC `pvc-shared`

```yaml
# pvc-shared.yaml
```

```bash
# Verifizierungsbefehle
```

### Lösung 3.1: Writer-Pod

```yaml
# writer-pod.yaml
```

```bash
# Verifizierungsbefehle
```

### Lösung 3.2: Persistenz-Nachweis mit Reader-Pod

```yaml
# reader-pod.yaml
```

```bash
# Verifizierungsbefehle & Log-Ausgabe
```

### Lösung 3.3: Read-Only Mount & Sicherheits-Test

```yaml
# secure-reader.yaml
```

```bash
# Test-Befehle (Lesen OK, Schreiben scheitert)
```

---

## 4. Spickzettel & Doku-Hilfen (Optional / Bei Bedarf)

Falls du während der Bearbeitung nachschlagen möchtest:

- **kubernetes.io Keywords:** `configure pod volume persistentvolumeclaim`,
  `volume mounts read only`
- **In-Terminal Syntax:**
  - `kubectl explain pod.spec.volumes.persistentVolumeClaim`
  - `kubectl explain pod.spec.containers.volumeMounts`
  - `kubectl explain pod.spec.containers.volumeMounts.readOnly`
- **CLI-Tipp für Pod-Gerüste:**
  `kubectl run writer-pod --image=busybox:latest --dry-run=client -o yaml > writer-pod.yaml`

---

## 5. Feedback & Korrekturen

Noch keine Einreichung vorhanden.
Nach deiner Bearbeitung folgt hier das direkte Review.
