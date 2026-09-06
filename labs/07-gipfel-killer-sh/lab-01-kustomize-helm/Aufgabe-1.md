# Aufgabe 1: Kustomize Overlays & Helm Deployments (Killer.sh Q5 & Q2 Reflex-Training)

- **CKA Domäne:** Workloads & Scheduling / Cluster Architecture
- **Lernberg-Stufe:** Hang → Gipfel (Speed- & Reflex-Drill)
- **Issue:** #11
- **Fokus:** Schnellster Doku- & Terminal-Weg zur fehlerfreien Lösung unter Zeitdruck

---

## 1. Wissensnetz & Mentales Modell (Birkenbihl)

- **Kustomize = Der Overheadprojektor mit Folien (Overlays):**
  - Die `base` ist die Grundfolie (Deployment, Service). Sie wird **nie** direkt
    für Umgebungen verändert.
  - Das `overlay` (z. B. `prod`) ist eine transparente Folie darüber. Sie legt
    nur Differenzen fest (andere Replicas, Namenspräfix, geänderter Namespace).
  - `kubectl kustomize <dir>` legt beide Folien übereinander und projiziert das
    fertige YAML an die Wand – ohne etwas im Cluster anzufassen.

- **Helm = Der Paketmanager (wie brew/apt) für Kubernetes:**
  - `repo add` registriert die Paketquelle.
  - `search` findet das Paket.
  - `show values` inspiziert die Optionen direkt im Terminal (kein Browser
    nötig!).
  - `install --set` überschreibt Zielwerte direkt beim Ausrollen.

---

## 2. Aufgabenstellung

Arbeitsverzeichnis für diese Aufgabe:
`labs/07-gipfel-killer-sh/lab-01-kustomize-helm/`

### Teilaufgabe 1.1: Kustomize Base & Overlay (Killer.sh Q5 Pattern)

> **💡 Reflex-Empfehlung:**
>
> - **Wo suchen?** Browser `kubernetes.io/docs/`
> - **Exakter Suchbegriff:** `kustomize declarative management`
> - **In-Page-Shortcut:** `Ctrl+F` nach `kustomization.yaml` oder `patches:`
> - **Terminal-Check:** Vor jedem `apply` immer prüfen mit:
>   `kubectl kustomize <pfad>`

Erstelle folgende Verzeichnisstruktur und Manifeste:

1. Verzeichnis `kustomize/base/`:
   - Ein Deployment `web-app` (Image: `nginx:alpine`, Replicas: 1).
   - Eine `kustomization.yaml`, die dieses Deployment als Ressource einbindet.
2. Verzeichnis `kustomize/overlays/production/`:
   - Eine `kustomization.yaml`, die auf `../../base` referenziert.
   - Setze den Namespace für alle Ressourcen im Overlay auf `production`.
   - Füge allen Ressourcen das Namenspräfix `prod-` hinzu.
   - Füge das Label `env: production` zu allen Ressourcen hinzu.
   - Erhöhe per Patch (Datei oder Inline) die Replicas des Deployments auf `4`.
3. Validiere die generierte Ausgabe mit `kubectl kustomize`.

---

### Teilaufgabe 1.2: Helm Repo, Search & Values Override (Killer.sh Q2 Pattern)

> **💡 Reflex-Empfehlung:**
>
> - **Wo suchen?** Reines Terminal! Geh dafür NICHT in den Browser.
> - **CLI-Hilfe:** `helm repo --help`, `helm install --help`
> - **Werte finden:** `helm show values <chart> | grep -i <suchbegriff>`
> - **Prüfungs-Reflex:** `--namespace <ns> --create-namespace` immer direkt
>   mitgeben, wenn der Namespace neu sein soll.

1. Füge das offizielle Traefik-Helm-Repository hinzu:
   - Name: `traefik`
   - URL: `https://traefik.github.io/charts`
2. Aktualisiere die lokalen Helm-Repositories.
3. Suche nach dem Chart `traefik` und zeige dessen Standard-Values an.
4. Finde über das Terminal heraus, wie das Value-Feld für die Replicas heißt
   (Tipp: `helm show values ... | grep ...`).
5. Generiere das YAML für ein Release namens `traefik-ingress` im Namespace
   `gateway-infra` (ohne echten Cluster-Install via `--dry-run --debug` oder
   speichere das gerenderte Template via `helm template` mit 2 Replicas).

---

## 3. Spickzettel & Doku-Hilfen (Prüfungs-Shortcuts)

### Kustomize-Syntax im Überblick

```yaml
# kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

resources:
  - ../../base

namespace: production
namePrefix: prod-
commonLabels:
  env: production

patches:
  - target:
      kind: Deployment
      name: web-app
    patch: |-
      - op: replace
        path: /spec/replicas
        value: 4
```

*Alternative zu JSON-Patch (Strategic Merge Patch):*

```yaml
patches:
  - patch: |-
      apiVersion: apps/v1
      kind: Deployment
      metadata:
        name: web-app
      spec:
        replicas: 4
```

### Helm-Befehlskette

```bash
helm repo add <name> <url>
helm repo update
helm search repo <query>
helm show values <repo/chart> | grep -i -C 2 <feld>
helm template <release-name> <repo/chart> --namespace <ns> --set key=value
```

---

## 4. Feedback & Korrekturen

### Review zu Aufgabe 1.1 (Kustomize)

- **Umsetzung:** Verzeichnisstruktur `base/` und `overlays/production/`
  erfolgreich aufgebaut. `kubectl kustomize` rendert das Deployment mit 4
  Replicas, Namespace `production`, Label `env: production` und Namenspräfix
  `prod-`.
- **Prüfungs-Erkenntnis (Pain-Point gelöst):** Eine separate Patch-Datei mit
  JSON 6902 Syntax (`- op: replace`) ist in der Prüfung zu fehleranfällig und
  aufwendig.
- **CKA-Reflex:** In der offiziellen Doku
  (`kubernetes.io/docs/tasks/manage-kubernetes-objects/kustomization/`) direkt
  nach `increase_replicas` suchen und den einfachen Strategic Merge Patch
  (`patches: [{path: ...}]` mit regulärem K8s-YAML) kopieren.

### Review zu Aufgabe 1.2 (Helm)

- **Umsetzung:** Helm-Befehlskette (`repo add`, `repo update`, `search repo`,
  `show values`) erfolgreich durchlaufen.
- **Prüfungs-Erkenntnis (Hierarchie-Problem bei YAML-Grep):** `grep -C 2`
  schneidet übergeordnete YAML-Schlüssel ab.
- **CKA-Reflex:** Entweder `grep -B 8` verwenden, um die Eltern-Keys (hier
  `deployment:`) zu sehen, oder die Werte mit `helm show values <chart> | less`
  bzw. `helm show values <chart> > values.yaml` direkt in Neovim öffnen und
  anpassen. Rendering via `helm template` oder `helm install --dry-run`.
