# Aufgabe Q09: Kustomize Overlays & HPA Scaling

- **CKA Domäne:** Workloads & Scheduling (15%)
- **Lernberg-Stufe:** Gipfel (Exam Pace & Troubleshooting)
- **Cluster & Host:** `ssh cka5248`
- **Wiederholungs-Grund:** Fehlversuch in Exam (0/7 Punkte, Overlays nicht ausgerollt)

---

## 1. Wissensnetz & Mentales Modell (Birkenbihl)

Kustomize funktioniert wie Transparent-Folien auf einem Tageslichtprojektor:

- Die **Base** (`/course/9/api-service/base/`) ist das Grundbild (Deployment,
  Service, Basiskonfiguration).
- Das **Overlay** (`/course/9/api-service/prod/`) legt eine farbige Folie
  darüber: Es ändert gezielt Werte (z. B. Namespace `prod-zone`, mehr
  Replicas oder bindet Patches wie einen HorizontalPodAutoscaler ein), ohne
  die Originaldateien der Base zu modifizieren.
- Mit `kubectl apply -k <verzeichnis>` rendert `kubectl` die Kombination
  direkt clientseitig und wendet sie atomar auf den Cluster an.

**KaWa KUSTOMIZE:**

- **K**eine Template-Syntax nötig (reines Standard-YAML)
- **U**nbeschädigte Base-Dateien
- **S**trategische Merges via Patches
- **T**arget-Namespaces pro Umgebung steuerbar
- **O**verlays für Staging, Production und Testing
- **M**anifest-Generierung on the fly (`kubectl kustomize ...`)
- **I**nline-Patches oder Patch-Dateien
- **Z**uverlässige GitOps-Grundlage
- **E**inheitlicher CLI-Befehl (`-k`)

---

## 2. Aufgabenstellung (Repetition Q09)

Host für diese Aufgabe: `ssh cka5248`.

Im Verzeichnis `/course/9/api-service/` liegt eine Kustomize-Struktur.

### Aufgabe 1: Base um HPA erweitern

1. Erstelle in `base/` eine Datei `hpa.yaml`, die das Deployment
   `api-deployment` skaliert:
   - `minReplicas`: 2
   - `maxReplicas`: 4
   - Ziel: CPU-Auslastung 75%.
2. Registriere `hpa.yaml` in `base/kustomization.yaml` unter `resources`.

### Aufgabe 2: Prod-Overlay mit Patch konfigurieren

1. Erstelle in `prod/` eine Patch-Datei `hpa-patch.yaml`, die für das
   HPA-Objekt `maxReplicas` auf **6** anhebt.
2. Registriere den Patch in `prod/kustomization.yaml` unter `patchesStrategicMerge`
   (oder `patches`).

### Aufgabe 3: Legacy-ConfigMap löschen & Overlays ausrollen

1. Lösche die veraltete ConfigMap `legacy-scaling-config` aus beiden
   Namespaces (`staging-zone` und `prod-zone`).
2. Wende das Staging-Overlay an: `kubectl apply -k /course/9/api-service/base/`
   im Namespace `staging-zone`.
3. Wende das Prod-Overlay an: `kubectl apply -k /course/9/api-service/prod/`.
4. Verifiziere mit `kubectl get hpa -A`, dass in `prod-zone` das Maximum von
   6 Replicas aktiv ist.

---

## 3. Deine Lösung (Befehle / Manifeste / Notizen)

### Lösung 1

```bash
# Deine Befehle / Notizen
```

---

## 4. Spickzettel & Doku-Hilfen

- **kubernetes.io Suchbegriff:** `kustomization horizontal pod autoscale`
- **Zielseite & Klickpfad:**
  `Tasks -> Manage Kubernetes Objects -> Declarative Management of`
  `Kubernetes Objects Using Kustomize`
- **In-Page Suche (Strg+F):** `patchesStrategicMerge` oder `kustomization.yaml`
- **In-Terminal Fastpath:**
  - `kubectl kustomize /course/9/api-service/prod/` (Syntax vor dem Apply prüfen!)
  - `kubectl explain hpa.spec`

---

## 5. Feedback & Korrekturen

Noch keine Einreichung vorhanden.
Nach deiner Bearbeitung folgt hier das direkte Review.
