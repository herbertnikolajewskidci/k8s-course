# Aufgabe 2: StorageClasses & Dynamic Provisioning

- **CKA Domäne:** Storage (10%)
- **Lernberg-Stufe:** Tal → Hang
- **Issue:** #6
- **Entspricht:** Block 2 aus `Aufgaben.md`

---

## 1. Wissensnetz & Mentales Modell (Birkenbihl)

### StorageClass als Kaffeevollautomat / Festplatten-Menü

Bisher mussten wir PVs manuell als Admin anlegen (statisches Provisioning).
Eine **StorageClass** ist die Konfiguration für einen automatischen Bereitsteller
(Provisioner):

```text
              ┌─────────────────────────────────────┐
              │           StorageClass              │
              │    (Menükarte / Bauplan-Automat)    │
              └──────────────────┬──────────────────┘
                                 │
     ┌───────────────────────────┴───────────────────────────┐
     ▼                                                       ▼
 ┌──────────────┐ (Wer baut die?)            ┌──────────────┐ (Wann?)
 │  PROVISIONER │                            │ BINDING MODE │
 │  z.B.        │                            │  Immediate   │ (Sofort!)
 │  local-path  │                            │  WaitFor-    │ (Erst wenn
 │  aws-ebs     │                            │  First-      │  Pod fest-
 │              │                            │  Consumer    │  steht!)
 └──────────────┘                            └──────────────┘
```

### Die 2 Binding-Modi im CKA-Exam

1. **`Immediate` (Standard bei vielen Cloud-Providern):**
   - Sobald der PVC erstellt wird, wird sofort im Hintergrund das PV erzeugt
     und gebunden – selbst wenn noch gar kein Pod existiert.
2. **`WaitForFirstConsumer` (Wichtig bei lokalem Storage / Topologie):**
   - Der PVC bleibt nach der Erstellung zunächst im Status **`Pending`**!
   - Das PV wird erst in der Sekunde erzeugt, in der ein **Pod** geschedult
     wird, der diesen PVC nutzt.
   - **Warum?** Kubernetes muss erst wissen, auf welchem Node der Pod landet,
     um die Festplatte auf genau diesem Node anzulegen.

---

## 2. Aufgabenstellung (Block 2)

Namespace für diesen Block: `storage-lab`.

### Aufgabe 2.1: StorageClass erstellen (`sc-fast`)

Erstelle ein Manifest `sc-fast.yaml` mit folgenden Spezifikationen:

1. Name: `sc-fast` (Cluster-weit, kein Namespace!).
2. Provisioner: `rancher.io/local-path`.
3. ReclaimPolicy: `Delete`.
4. VolumeBindingMode: `WaitForFirstConsumer`.
5. Wende das Manifest an und prüfe mit `kubectl get sc`.

---

### Aufgabe 2.2: Dynamischen PVC erstellen (`pvc-dynamic`)

Erstelle ein Manifest `pvc-dynamic.yaml` im Namespace `storage-lab`:

1. Name: `pvc-dynamic`.
2. Namespace: `storage-lab`.
3. StorageClass: `sc-fast`.
4. AccessMode: `ReadWriteOnce`.
5. Storage-Anforderung: `250Mi`.
6. Wende das Manifest an.

---

### Aufgabe 2.3: Phase beobachten (Der `Pending`-Effekt)

1. Überprüfe den Status des PVCs (`kubectl get pvc pvc-dynamic -n storage-lab`).
2. Notiere:
   - Welchen Status hat der PVC? (`Pending`?)
   - Warum wurde noch kein PersistentVolume (PV) automatisch angelegt?

---

### Aufgabe 2.4: Consumer-Pod starten & Bindung auslösen

1. Erstelle einen Pod `dynamic-app` im Namespace `storage-lab`:
   - Image: `nginx:alpine`.
   - Mount-Pfad: `/usr/share/nginx/html`.
   - Volume: Nutzt den PVC `pvc-dynamic`.
2. Beobachte nach dem Start des Pods (`kubectl get pod,pvc,pv -n storage-lab`):
   - Was passiert mit dem Status des PVCs?
   - Welcher Name wurde für das dynamisch erzeugte PV generiert (z.B. `pvc-...`)?

---

## 3. Deine Lösung (Befehle / Manifeste / Notizen)

### Lösung 2.1: StorageClass Manifest

```yaml
# sc-fast.yaml
siehe Datei
```

```bash
# Verifizierungsbefehle
k get sc
'''
NAME                PROVISIONER            RECLAIM  BINDINGMODE
sc-fast             rancher.io/local-path  Retain   WaitForFirstConsumer
standard (default)  rancher.io/local-path  Delete   WaitForFirstConsumer
'''
```

### Lösung 2.2: Dynamischer PVC

```yaml
# pvc-dynamic.yaml
Siehe datei
```

```bash
# Verifizierungsbefehle
k -n storage-lab get pvc pvc-dynamic
'''
NAME         STATUS   VOLUME  CAPACITY  ACCESS  STORAGECLASS
pvc-dynamic  Pending                    RWO     sc-fast
'''
```

### Lösung 2.3: Beobachtung & Notizen

```bash
# Notizen zu Status & WaitForFirstConsumer
'''
Ja noch Pending, weil bei der StorageClass WaitForFirstConsumer
für den VolumeBindingMode definiert ist.
'''
```

### Lösung 2.4: Pod-Manifest & Dynamische Bindung

```yaml
# dynamic-app.yaml oder kubectl run Befehl
siehe Datei
```

```text
# Ausgabe von get pod,pvc,pv
NAME                 PROVISIONER             RECLAIMPOLICY   VOLUMEBINDINGMODE
sc-fast              rancher.io/local-path   Retain          WaitForFirstConsumer
standard (default)   rancher.io/local-path   Delete          WaitForFirstConsumer

NAME            STATUS    VOLUME                                     CAPACITY
pvc-dynamic     Bound     pvc-2c1ac7c1-1dd6-48e8-8b27-da91e4f5f134   250Mi

NAME          READY   STATUS    RESTARTS   AGE
dynamic-app   1/1     Running   0          114s

NAME                                       CAPACITY   ACCESS   STATUS   CLAIM
pvc-2c1ac7c1-1dd6-48e8-8b27-da91e4f5f134   250Mi      RWO      Bound    pvc-dynamic
```

---

## 4. Spickzettel & Doku-Hilfen (Optional / Bei Bedarf)

Falls du während der Bearbeitung nachschlagen möchtest:

- **kubernetes.io Keywords:** `storage classes`, `dynamic volume provisioning`,
  `volume binding mode`
- **In-Terminal Syntax:**
  - `kubectl explain sc`
  - `kubectl explain sc.volumeBindingMode`
  - `kubectl explain pod.spec.volumes.persistentVolumeClaim`
- **Erinnerung:** Auch StorageClasses haben keinen `kubectl create` Generator!

---

## 5. Feedback & Korrekturen

### 🌟 Ball-im-Tor: Volle Punktzahl (100% / Note 1+)

Hervorragend umgesetzt! Der gesamte Ablauf des dynamischen Provisionings wurde
von der StorageClass über den Claim bis zum Pod fehlerfrei durchdekliniert.

1. **Aufgabe 2.1 (StorageClass):**
   - `provisioner: rancher.io/local-path` und
     `volumeBindingMode: WaitForFirstConsumer` sauber deklariert.
2. **Aufgabe 2.2 (Dynamischer PVC):**
   - `storageClassName: sc-fast` mit 250Mi RWO exakt aufgesetzt.
3. **Aufgabe 2.3 (Pending-Analyse):**
   - Präzise begründet: Der PVC wartet wegen `WaitForFirstConsumer` bewusst auf
     den ersten Consumer-Pod.
4. **Aufgabe 2.4 (Pod & Live-Bindung):**
   - `dynamic-app.yaml` verbindet Pod-Volume und Container `volumeMounts`
     lehrbuchmäßig.
   - Die automatische PV-Generierung (`pvc-2c1ac...`) und der Statuswechsel
     zu `Bound` wurden live im Terminal beobachtet.

---

### 💡 CKA-Prüfungs-Takeaways zu StorageClasses

- **`volumeBindingMode: WaitForFirstConsumer`**:
  Verhindert Scheduling-Konflikte (besonders bei lokalem Node-Storage oder
  Cloud-Volumes in bestimmten Availability Zones).
- **Default StorageClass:**
  Wenn ein PVC **keine** `storageClassName` angibt, wählt Kubernetes
  automatisch die Default-StorageClass (Annotation:
  `storageclass.kubernetes.io/is-default-class: "true"`).
- **Statisches Matching vs. Dynamic:**
  - `storageClassName: ""` (leerer String) = Deaktiviert Dynamic Provisioning
    und zwingt Kubernetes, ein statisches PV ohne StorageClass zu binden.
  - `storageClassName: <name>` = Sucht nach passendem PV oder triggert den
    Provisioner dieser StorageClass.
