# Aufgabe 1: Statische PV & PVC Bindung (Storage-Grundlagen)

- **CKA Domäne:** Storage (10%)
- **Lernberg-Stufe:** Tal → Hang
- **Issue:** #6
- **Entspricht:** Block 1 aus `Aufgaben.md`

---

## 1. Wissensnetz & Mentales Modell (Birkenbihl)

### PV und PVC als Festplatte und Mietvertrag

In Kubernetes trennt das Storage-System strikt zwischen **Infrastruktur**
(Admin-Perspektive) und **Workload-Bedarf** (Entwickler-Perspektive):

```text
  CLUSTER-WEIT (Ohne Namespace)             IM NAMESPACE (z.B. storage-lab)
 ┌──────────────────────────────┐          ┌──────────────────────────────┐
 │     PersistentVolume (PV)    │          │  PersistentVolumeClaim (PVC) │
 │  - Kapazität: 1Gi            │ ◄─────── │  - Anforderung: 500Mi        │
 │  - AccessMode: ReadWriteOnce │  BINDUNG │  - AccessMode: ReadWriteOnce │
 │  - hostPath: /data/analytics │ (Match)  │  - storageClassName: manual  │
 └──────────────────────────────┘          └──────────────────────────────┘
```

### Die 3 goldenen Prüfungs-Fakten zu Storage

1. **PV ist Cluster-Scoped, PVC ist Namespace-Scoped:**
   - Ein `PersistentVolume` gehört zu **keinem** Namespace (`kubectl get pv`).
   - Ein `PersistentVolumeClaim` gehört immer in einen **konkreten Namespace**
     (`kubectl get pvc -n <ns>`).
2. **AccessModes decodiert (Merkhilfe!):**
   - **`ReadWriteOnce` (RWO):** Kann von **einem einzigen Node** lesend und
     schreibend gemountet werden.
   - **`ReadOnlyMany` (ROX):** Kann von **vielen Nodes gleichzeitig** nur lesend
     gemountet werden.
   - **`ReadWriteMany` (RWX):** Kann von **vielen Nodes gleichzeitig** lesend
     und schreibend gemountet werden (erfordert NFS / Netzwerk-Storage!).
3. **Reclaim Policy (Was passiert beim Löschen des PVCs?):**
   - **`Retain`:** PV bleibt nach PVC-Löschung erhalten (Status `Released`),
     Daten bleiben sicher auf der Platte.
   - **`Delete`:** PV und die physischen Backend-Daten werden automatisch
     gelöscht.

---

## 2. Aufgabenstellung (Block 1)

Namespace für diesen Block: `storage-lab`.

### Vorbereitung

1. Erstelle den Namespace `storage-lab`.

---

### Aufgabe 1.1: PersistentVolume (PV) erstellen

Erstelle ein Manifest `pv-analytics.yaml` mit folgenden Spezifikationen:

1. Name: `pv-analytics` (Cluster-weit, kein Namespace!).
2. Kapazität: `1Gi`.
3. AccessMode: `ReadWriteOnce`.
4. Reclaim Policy: `Retain`.
5. StorageClass: `manual`.
6. Host-Pfad: `/data/analytics` auf dem Host-Knoten.
7. Wende das Manifest an und überprüfe den Status (`Available`).

---

### Aufgabe 1.2: PersistentVolumeClaim (PVC) erstellen

Erstelle ein Manifest `pvc-analytics.yaml` im Namespace `storage-lab`:

1. Name: `pvc-analytics`.
2. Namespace: `storage-lab`.
3. AccessMode: `ReadWriteOnce`.
4. Storage-Anforderung: `500Mi` (unter `resources.requests.storage`).
5. StorageClass: `manual`.
6. Wende das Manifest an.

---

### Aufgabe 1.3: Bindung & Matching verifizieren

1. Prüfe den Status von PV und PVC (`kubectl get pv,pvc -n storage-lab`).
2. Verifiziere:
   - Ist der Status beider Ressourcen `Bound`?
   - Welches PV ist an `pvc-analytics` gebunden?
   - Wie viel Kapazität hat das gebundene PV tatsächlich zugewiesen?

---

### Aufgabe 1.4: Reclaim-Policy & Phasen-Lifecycle testen

1. Lösche den PVC `pvc-analytics` im Namespace `storage-lab`.
2. Beobachte den Status des PVs `pv-analytics` (`kubectl get pv pv-analytics`).
3. Notiere:
   - Welchen Status hat das PV nach dem Löschen des Claims? (`Released`?)
   - Warum bindet sich ein neu erstellter identischer PVC nicht automatisch
     wieder an dieses `Released`-PV?

---

## 3. Deine Lösung (Befehle / Manifeste / Notizen)

### Vorbereitung: Setup-Befehle

```bash
# Setup-Befehle
```

### Lösung 1.1: PersistentVolume (PV)

```yaml
# pv-analytics.yaml
```

```bash
# Verifizierungsbefehle
```

### Lösung 1.2: PersistentVolumeClaim (PVC)

```yaml
# pvc-analytics.yaml
```

```bash
# Verifizierungsbefehle
```

### Lösung 1.3: Bindung verifizieren

```bash
# Ausgabe von get pv, pvc
```

### Lösung 1.4: Reclaim & Lifecycle Notizen

```bash
# Befehle & Antworten zur Lifecycle-Frage
```

---

## 4. Spickzettel & Doku-Hilfen (Optional / Bei Bedarf)

Falls du während der Bearbeitung nachschlagen möchtest:

- **kubernetes.io Keywords:** `persistent volumes`, `configure persistentvolumeclaim`
- **In-Terminal Syntax:**
  - `kubectl explain pv.spec`
  - `kubectl explain pv.spec.hostPath`
  - `kubectl explain pvc.spec`
- **Erinnerung (No-CLI-Spickzettel):** PV und PVC haben keinen `kubectl create`
  Generator! Doku öffnen oder `kubectl explain` nutzen.

---

## 5. Feedback & Korrekturen

Noch keine Einreichung vorhanden.
Nach deiner Bearbeitung folgt hier das direkte Review.
