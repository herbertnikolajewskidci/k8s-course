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
k create ns storage-lab
```

### Lösung 1.1: PersistentVolume (PV)

```yaml
# pv-analytics.yaml
siehe Datei
```

```bash
# Verifizierungsbefehle
k apply -f pv-analytics.yaml
```

### Lösung 1.2: PersistentVolumeClaim (PVC)

```yaml
# pvc-analytics.yaml
siehe Datei
```

```bash
# Verifizierungsbefehle
k apply -f pvc-analytics.yaml
```

### Lösung 1.3: Bindung verifizieren

```bash
# Ausgabe von get pv, pvc
k -n storage-lab get pv,pvc
'''
NAME           CAPACITY  ACCESS  RECLAIM  STATUS  CLAIM
pv/pv-analytic 1Gi       RWO     Retain   Bound   storage-lab/pvc-analytics

NAME            STATUS  VOLUME        CAPACITY  ACCESS  STORAGECLASS
pvc/pvc-analytic Bound  pv-analytics  1Gi       RWO     manual

Antworten: Ja ist beide Bound. Es ist geclaimed von
storage-lab/pvc-analytics und er hat 1Gi obwohl nur 500Mi angegeben
wurden. Warum weiß ich allerdings nicht.
'''
```

### Lösung 1.4: Reclaim & Lifecycle Notizen

```bash
# Befehle & Antworten zur Lifecycle-Frage
k -n storage-lab delete pvc pvc-analytics

k -n storage-lab get pv,pvc
'''
NAME          CAPACITY  ACCESS  RECLAIM  STATUS    CLAIM
pv/pv-analytic 1Gi      RWO     Retain   Released  storage-lab/pvc-analytics
'''

k get pv pv-analytics

'''
NAME          CAPACITY  ACCESS  RECLAIM  STATUS    CLAIM
pv-analytics  1Gi       RWO     Retain   Released  storage-lab/pvc-analytics

Antwort auf die Fragen: Ja ist jetzt status Released. Weil er noch
daten von dem alten pvc drinnen sind. Man müsste das PV auch löschen
und neu erstellen.
'''
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

### 🌟 Ball-im-Tor: Volle Punktzahl (100% / Note 1+)

Exzellente Arbeit! Beide Manifeste (`pv-analytics.yaml` und `pvc-analytics.yaml`)
sind 100% fehlerfrei und entsprechen exakt dem offiziellen Kubernetes-Standard.

1. **Aufgabe 1.1 (PV-Erstellung):**
   - `capacity: 1Gi`, `accessModes: [ReadWriteOnce]`, `reclaimPolicy: Retain`,
     `storageClassName: manual` und `hostPath` perfekt aufgebaut.
   - Kein Namespace deklariert (wichtig für CKA: PVs sind Cluster-Scoped!).
2. **Aufgabe 1.2 (PVC-Erstellung):**
   - `namespace: storage-lab`, `requests.storage: 500Mi` und Matching-Felder
     sauber gesetzt.
3. **Aufgabe 1.3 (Bindung):**
   - Erfolgreicher Status `Bound` auf beiden Seiten.
4. **Aufgabe 1.4 (Reclaim Lifecycle):**
   - Status `Released` nach PVC-Löschung korrekt beobachtet.

---

### 💡 Die beiden CKA-Aha-Momente zu deinen Notizen

#### 1. Warum zeigt der PVC 1Gi an, obwohl 500Mi angefordert wurden?

- **Festplatten-Logik:** Ein statisches PV ist wie eine feste Festplatte.
  Kubernetes teilt statische PVs nicht auf!
- Die Angabe `requests.storage: 500Mi` im PVC bedeutet: **„Gib mir mindestens
  500Mi“**.
- Kubernetes sucht ein freies PV mit `Kapazität >= Anforderung`.
- Da das PV `pv-analytics` 1Gi hat, bekommt der PVC die gesamte 1Gi-Platte
  zugewiesen und zeigt diese reale Kapazität an.

#### 2. Warum bindet sich ein neuer PVC nicht an das `Released`-PV?

- **Datenschutz bei `Retain`:** Deine Intuition war goldrichtig! Kubernetes
  verhindert, dass ein neuer PVC automatisch alte Daten sieht oder
  überschreibt.
- **Technischer Grund (CKA-Geheimtipp):**
  Wenn du `kubectl get pv pv-analytics -o yaml` aufrufst, siehst du das Feld
  `spec.claimRef`. Dort steht noch der alte gelöschte PVC eingetragen.
- **Wie recycelt man ein `Released`-PV?**
  Entweder PV löschen und neu anlegen **ODER** `kubectl edit pv pv-analytics`
  und einfach den Block `spec.claimRef:` komplett entfernen. Sobald
  `claimRef` weg ist, springt das PV sofort wieder auf `Available`!

---

### 📋 CKA-Prüfungs-Takeaways

- **PV = Cluster-Scoped** (kein Namespace).
- **PVC = Namespace-Scoped** (immer an einen Namespace gebunden).
- **Matching-Kriterien:** Ein PV bindet nur an einen PVC, wenn:
  1. `storageClassName` übereinstimmt (oder beide leer sind).
  2. `accessModes` übereinstimmen.
  3. `pv.capacity.storage >= pvc.requests.storage`.
- **Status-Phasen:** `Available` → `Bound` → `Released` → `Failed`.
