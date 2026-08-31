# Aufgabe 4: Storage Troubleshooting Drill

- **CKA Domäne:** Storage (10%) + Troubleshooting (30%)
- **Lernberg-Stufe:** Hang → Gipfel
- **Issue:** #6
- **Entspricht:** Block 4 aus `Aufgaben.md`

---

## 1. Wissensnetz & Mentales Modell (Birkenbihl)

### Die 3 typischen Storage-Blockaden im CKA-Exam

Wenn Storage im Cluster klemmt, liegt es fast immer an einem dieser drei
Mechanismen:

```text
                  1. CLAIM-EBENE          2. POD-EBENE            3. LÖSCHUNG
                 ┌─────────────┐        ┌─────────────┐        ┌──────────────┐
Symptom ───────► │ PVC Pending │ ─────► │ Pod Pending │ ─────► │ PVC Freeze   │
                 │             │        │ MountFailed │        │(Terminating) │
                 └─────────────┘        └─────────────┘        └──────────────┘
Ursache:         Mismatch bei           Tippfehler bei         Storage Object
                 Kapazität, Access-     claimName oder         in Use Protect.
                 Mode o. StorageClass   Knoten-Konflikt        (Pod läuft noch)
```

### Die goldene Diagnose-Kette

1. **PVC im Status `Pending`:**
   - Erster Befehl: `kubectl describe pvc <pvc-name> -n <ns>`
   - Ganz unten unter **Events** steht die exakte Ursache (z.B.
     `no persistent volumes available for this claim and no storage class is set`).
2. **Pod im Status `ContainerCreating` / `Pending`:**
   - Erster Befehl: `kubectl describe pod <pod-name> -n <ns>`
   - Unter **Events** nach `FailedMount` oder `MountVolume.SetUp failed` suchen.
3. **PVC hängt im Status `Terminating`:**
   - Schutzmechanismus: **`kubernetes.io/pvc-protection`** (Finalizer).
   - Kubernetes löscht einen PVC erst physisch, wenn **kein aktiver Pod**
     mehr das Volume mountet!

---

## 2. Aufgabenstellung (Block 4)

Namespace für diesen Block: `storage-troubleshoot-lab`.

### Vorbereitung: Fehlerhafte Testumgebung aufbauen

Kopiere folgenden Block in dein Terminal, um die gestörten Szenarien zu
erstellen:

```bash
kubectl create ns storage-troubleshoot-lab

# 1. PV für Szenario 4.1
kubectl apply -f - <<EOF
apiVersion: v1
kind: PersistentVolume
metadata:
  name: pv-broken-match
spec:
  capacity:
    storage: 2Gi
  accessModes:
    - ReadWriteOnce
  storageClassName: manual-trouble
  hostPath:
    path: /data/trouble1
EOF

# 2. Fehlerhafter PVC (hängt im Status Pending)
kubectl apply -f - <<EOF
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: pvc-broken-match
  namespace: storage-troubleshoot-lab
spec:
  accessModes:
    - ReadWriteMany
  resources:
    requests:
      storage: 5Gi
  storageClassName: manual-trouble
EOF

# 3. Zweiter PVC für Szenario 4.2 & 4.3
kubectl apply -f - <<EOF
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: pvc-app-data
  namespace: storage-troubleshoot-lab
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 500Mi
  storageClassName: standard
EOF

# 4. Fehlerhafter Pod (hängt wegen Volume-Referenz)
kubectl apply -f - <<EOF
apiVersion: v1
kind: Pod
metadata:
  name: stuck-app
  namespace: storage-troubleshoot-lab
spec:
  volumes:
    - name: data-vol
      persistentVolumeClaim:
        claimName: pvc-app-datasss
  containers:
    - name: app
      image: nginx:alpine
      volumeMounts:
        - mountPath: /usr/share/nginx/html
          name: data-vol
EOF
```

---

### Aufgabe 4.1: PVC Pending Drill (Mismatch-Diagnose & Fix)

1. Untersuche den Status des PVCs `pvc-broken-match` im Namespace
   `storage-troubleshoot-lab`.
2. Führe `kubectl describe pvc pvc-broken-match -n storage-troubleshoot-lab`
   aus und lies die Fehlermeldung unter **Events**.
3. Vergleiche die Spezifikationen von `pv-broken-match` und `pvc-broken-match`:
   - Welche zwei Mismatch-Fehler (Kapazität und AccessMode) verhindern die
     Bindung?
4. Passe den PVC `pvc-broken-match` so an, dass er erfolgreich an das PV
   `pv-broken-match` bindet (`Bound`).

---

### Aufgabe 4.2: Pod Stuck in ContainerCreating Drill

1. Überprüfe den Pod `stuck-app` (`kubectl get pods -n storage-troubleshoot-lab`).
2. Führe `kubectl describe pod stuck-app -n storage-troubleshoot-lab` aus und
   identifiziere die `FailedMount`-Ursache unter Events.
3. Behebe den Fehler im Pod-Manifest, sodass der Pod erfolgreich startet und
   in den Status `Running (1/1)` wechselt.

---

### Aufgabe 4.3: Terminating PVC Freeze & Finalizer Drill

1. Lösche den PVC `pvc-app-data`, während der reparierte Pod `stuck-app` noch
   läuft:
   `kubectl delete pvc pvc-app-data -n storage-troubleshoot-lab --wait=false`.
2. Untersuche den Status des PVCs (`kubectl get pvc -n storage-troubleshoot-lab`):
   - Warum bleibt der PVC im Status `Terminating` hängen?
   - Welcher Finalizer schützt den PVC vor Datenverlust?
3. Beende oder lösche den Pod `stuck-app`.
4. Beobachte, wie der PVC `pvc-app-data` unmittelbar danach automatisch und
   sauber aus dem Cluster verschwindet.

---

## 3. Deine Lösung (Befehle / Manifeste / Notizen)

### Vorbereitung ausgeführt?

```bash
# Setup-Befehle
Einfach C&P
```

### Lösung 4.1: PVC Mismatch behoben

```bash
# Diagnose-Notizen & angepasster PVC
'''
Beim PVC waren Capacity und AccessModes unpassend:
Im fehlerhaften PVC war ReadWriteMany und 5Gi definiert,
während das PV nur ReadWriteOnce und 2Gi bereitstellt.
'''

cat pvc-working-match.yaml

'''
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: pvc-broken-match
  namespace: storage-troubleshoot-lab
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 2Gi
  storageClassName: manual-trouble
'''
k -n storage-troubleshoot-lab delete pvc pvc-broken-match

k apply -f pvc-working-match.yaml

k -n storage-troubleshoot-lab get pvc pvc-broken-match
'''
NAME              STATUS  VOLUME           CAPACITY  ACCESS  STORAGECLASS
pvc-broken-match  Bound   pv-broken-match  2Gi       RWO     manual-trouble
'''
```

### Lösung 4.2: Pod Mount-Fehler behoben

```bash
# Diagnose & Pod-Reparatur
'''
Fehlerursache: Tippfehler im Pod-Manifest (claimName: pvc-app-datasss
statt pvc-app-data). Pod exportiert, claimName korrigiert und neu
angewendet -> Pod läuft erfolgreich im Status Running.
'''
```

### Lösung 4.3: Terminating PVC & Finalizer Beobachtung

```bash
# Notizen zu Terminating, Finalizer und sauberer Löschung
kubernetes.io/pvc-protection
'''
Beobachtung: Der PVC blieb im Status Terminating hängen. Im describe
sieht man den Finalizer 'kubernetes.io/pvc-protection'. Solange ein Pod
das Volume aktiv nutzt, verhindert Kubernetes die physische Löschung,
um Datenverlust zu vermeiden.
Sobald der Pod beendet wird, entfernt Kubernetes den Finalizer und der
PVC wird automatisch gelöscht.
'''
```

---

## 4. Spickzettel & Doku-Hilfen (Optional / Bei Bedarf)

Falls du während der Bearbeitung nachschlagen möchtest:

- **Schnell-Diagnose:**
  - `kubectl describe pvc <pvc> -n <ns>`
  - `kubectl describe pod <pod> -n <ns>`
  - `kubectl get events -n <ns> --sort-by='.metadata.creationTimestamp'`
- **In-Terminal Syntax:**
  - `kubectl explain pvc.spec`
  - `kubectl explain pod.spec.volumes.persistentVolumeClaim`

---

## 5. Feedback & Korrekturen

### 🌟 Ball-im-Tor: Volle Punktzahl (100% / Note 1+)

Grandioser Abschluss von Domäne 3! Du hast alle drei Troubleshooting-Muster
präzise diagnostiziert, verstanden und sauber gelöst.

1. **Aufgabe 4.1 (PVC Mismatch Drill):**
   - **Diagnose:** Zielsicher beide Diskrepanzen (`ReadWriteMany` vs.
     `ReadWriteOnce` und `5Gi` vs. `2Gi`) identifiziert.
   - **Reparatur:** Sauberes Manifest `pvc-working-match.yaml` erstellt und
     die Bindung zum PV erfolgreich hergestellt.
2. **Aufgabe 4.2 (Pod Stuck in ContainerCreating Drill):**
   - **Diagnose:** Den Typo im Volume-Referenznamen (`pvc-app-datasss`)
     identifiziert.
   - **Reparatur:** Pod neu konfiguriert und auf `Running` gebracht.
3. **Aufgabe 4.3 (Terminating Freeze & Finalizer):**
   - **Mentales Modell:** Den Schutzmechanismus `kubernetes.io/pvc-protection`
     präzise und treffend formuliert.
   - **Lifecycle-Verhalten:** Live nachvollzogen, wie Kubernetes den Finalizer
     erst nach dem Stoppen des Pods auflöst.

---

### 💡 CKA-Prüfungs-Takeaways zu Storage-Troubleshooting

1. **`kubectl describe pvc` ist immer der 1. Schritt bei `Pending` PVCs:**
   Die Fehlermeldung unter `Events` sagt dir direkt, ob Kapazität, AccessMode
   oder StorageClass nicht passen.
2. **`FailedMount` im Pod:**
   Immer die Schreibweise von `spec.volumes[*].persistentVolumeClaim.claimName`
   mit den vorhandenen PVCs im selben Namespace abgleichen.
3. **`Terminating` bei PVC oder PV:**
   Keine Panik – das Objekt wartet nur darauf, dass der Consumer-Pod bzw.
   der Claim gelöscht wird.

---

### 🏆 Domäne 3: Storage (10%) — Vollständig gemeistert

Damit hast du alle 4 Kernblöcke von Domäne 3 erfolgreich abgeschlossen:

- **Block 1:** Statische PV & PVC Bindung (Kapazitäten & AccessModes)
- **Block 2:** StorageClasses & Dynamic Provisioning (WaitForFirstConsumer)
- **Block 3:** Pods mit Volumes, Persistenz-Nachweis & Read-Only Mounts
- **Block 4:** Storage Troubleshooting Drill (Mismatch, MountFailed & Finalizer)
