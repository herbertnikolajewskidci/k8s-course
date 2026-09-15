# Aufgabe Q10: StorageClass Dynamic Provisioning (WaitForFirstConsumer)

- **CKA Domäne:** Storage (10%)
- **Lernberg-Stufe:** Gipfel (Exam Pace & Troubleshooting)
- **Cluster & Host:** `ssh cka6016`
- **Wiederholungs-Grund:** Fehlversuch in Exam (0/6 Punkte, PVC nicht gebunden)

---

## 1. Wissensnetz & Mentales Modell (Birkenbihl)

Stell dir eine Bestellung bei einem Maßschneider vor:

- **`volumeBindingMode: Immediate` (Standard):** Der Schneider fertigt den
  Anzug (das PersistentVolume), sobald der Zettel (PVC) im Laden liegt – ohne
  zu wissen, wer ihn tragen wird oder in welcher Stadt der Kunde überhaupt wohnt.
  In Multi-Zone-Clustern führt das oft zur Katastrophe: Das PV wird in Zone A
  erstellt, der Pod kann aber nur in Zone B laufen.
- **`volumeBindingMode: WaitForFirstConsumer`:** Der Schneider wartet mit
  der Fertigung, bis der Kunde (der Pod) den Laden betritt. Erst wenn der
  Kubernetes-Scheduler entschieden hat, auf welchem Node der Pod geplant
  wird, wird das Volume genau auf diesem Node bereitgestellt.
- **Folge:** Der PVC verharrt bewusst im Zustand `Pending`, bis ein Pod ihn
  referenziert. Erst der Pod-Start triggert das automatische Binden (`Bound`).

**KaWa STORAGE:**

- **S**torageClass als Schablone für dynamisches Provisioning
- **T**opologie-Bewusstsein durch verzögertes Binden
- **O**hne Pod bleibt der PVC auf `Pending`
- **R**eclaimPolicy bestimmt das Schicksal gelöschter Daten
- **A**utomatische Volume-Zuweisung durch CSI-Treiber
- **G**emeinsamer Mount im Container-Dateisystem
- **E**ndgültige Bindung beim ersten Konsumenten

---

## 2. Aufgabenstellung (Repetition Q10)

Host für diese Aufgabe: `ssh cka6016`.

Im Namespace `project-bern` soll ein Batch-Job `data-job` ausgeführt
werden, der Speicher dynamisch über eine StorageClass anfordert.

### Aufgabe 1: StorageClass delayed-storage erstellen

Erstelle eine StorageClass namens `delayed-storage`:

1. `provisioner`: Nutze den lokalen CSI-Provisioner
   `rancher.io/local-path`.
2. `volumeBindingMode`: Setze zwingend `WaitForFirstConsumer`.
3. `reclaimPolicy`: `Delete`.

### Aufgabe 2: PVC & Job ausrollen

1. Erstelle im Namespace `project-bern` einen PersistentVolumeClaim namens
   `job-pvc`:
   - Speicher: `100Mi`
   - AccessMode: `ReadWriteOnce`
   - StorageClassName: `delayed-storage`
2. Beobachte mit `kubectl get pvc -n project-bern`, dass der PVC zunächst
   auf `Pending` bleibt (erwartetes Verhalten!).
3. Passe das Job-Manifest `/course/10/data-job.yaml` an, sodass es den
   `job-pvc` unter `/mnt/job-data` einbindet.
4. Starte den Job (`kubectl apply -f /course/10/data-job.yaml`).
5. Verifiziere, dass der PVC jetzt `Bound` wird und der Job erfolgreich
   abschließt (`COMPLETIONS 1/1`).

---

## 3. Deine Lösung (Befehle / Manifeste / Notizen)

### Lösung 1

```bash
# Deine Befehle / Notizen
```

---

## 4. Spickzettel & Doku-Hilfen

- **kubernetes.io Suchbegriff:** `storage classes waitforfirstconsumer`
- **Zielseite & Klickpfad:** `Concepts -> Storage -> Storage Classes`
- **In-Page Suche (Strg+F):** `volumeBindingMode` oder `WaitForFirstConsumer`
- **In-Terminal Fastpath:**
  - `kubectl explain storageclass.volumeBindingMode`
  - `kubectl explain pvc.spec`

---

## 5. Feedback & Korrekturen

Noch keine Einreichung vorhanden.
Nach deiner Bearbeitung folgt hier das direkte Review.
