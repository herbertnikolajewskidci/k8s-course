# Aufgabe 3: Ingress Controller & Routing (Path- & Host-based)

- **CKA Domäne:** Services & Networking (20%)
- **Lernberg-Stufe:** Tal → Hang
- **Issue:** #4
- **Entspricht:** Block 3 aus `Aufgaben.md`

---

## 1. Wissensnetz & Mentales Modell (Birkenbihl)

### Ingress als Concierge / Empfangschef am Gebäude

Ein Service arbeitet auf Layer 4 (TCP/UDP, IP-Ports).
Ein **Ingress** ist der intelligente Layer-7-Empfang (HTTP/HTTPS Reverse
Proxy), der eingehende Web-Anfragen anhand von **Hostnamen** und **URL-Pfaden**
an die richtigen internen Services weiterleitet:

```text
               ┌──────────────────────────────┐
               │    Ingress Controller        │
               │ (Empfang / Layer-7 Router)   │
               └──────────────┬───────────────┘
                              │
         ┌────────────────────┴────────────────────┐
         │ (Pfad: /red)                            │ (Pfad: /blue)
         ▼                                         ▼
  ┌──────────────┐                          ┌──────────────┐
  │   red-svc    │                          │   blue-svc   │
  │ (ClusterIP)  │                          │ (ClusterIP)  │
  └──────────────┘                          └──────────────┘
```

### Die zwei Routing-Muster im CKA

1. **Path-based Routing (URL-Pfade):**
   - `example.com/red` → `red-svc:80`
   - `example.com/blue` → `blue-svc:80`
2. **Host-based Routing (Virtuelle Hosts / FQDNs):**
   - `red.example.com/` → `red-svc:80`
   - `blue.example.com/` → `blue-svc:80`

### Wichtige Syntax-Bausteine (`networking.k8s.io/v1`)

- **`pathType`**: Fast immer `Prefix` (beginnt mit Pfad) oder `Exact` (exakter
  Pfad-Treffer).
- **`backend.service.name`** und **`backend.service.port.number`** verweisen
  auf den Ziel-Service.

---

## 2. Aufgabenstellung (Block 3)

Namespace für diesen Block: `ingress-lab`.

### Aufgabe 3.1: Path-based Ingress Routing

1. Erstelle den Namespace `ingress-lab`.
2. Erstelle zwei Deployments im Namespace `ingress-lab`:
   - `service-red` (Image: `httpd:alpine`, 2 Replicas, Container-Port: 80).
   - `service-blue` (Image: `nginx:alpine`, 2 Replicas, Container-Port: 80).
3. Exponiere beide Deployments als ClusterIP-Services `red-svc` und `blue-svc`
   auf Port `80` (TargetPort: `80`).
4. Erstelle eine Ingress-Ressource namens `color-ingress` im Namespace
   `ingress-lab`:
   - Pfad `/red` (pathType: `Prefix`) leitet an `red-svc:80` weiter.
   - Pfad `/blue` (pathType: `Prefix`) leitet an `blue-svc:80` weiter.
5. Speichere das Manifest als `color-ingress.yaml` und wende es an.

### Aufgabe 3.2: Host-based Ingress (Virtual Hosting)

1. Erstelle eine Ingress-Ressource `host-ingress` im Namespace `ingress-lab`:
   - Host `red.example.com` mit Pfad `/` (pathType: `Prefix`) leitet an
     `red-svc:80` weiter.
   - Host `blue.example.com` mit Pfad `/` (pathType: `Prefix`) leitet an
     `blue-svc:80` weiter.
2. Speichere das Manifest als `host-ingress.yaml` und wende es an.

### Aufgabe 3.3: Ingress-Validierung & Deskriptor-Prüfung

1. Inspiziere beide Ingress-Objekte mit `kubectl describe ingress` im
   Namespace `ingress-lab`.
2. Überprüfe in der Ausgabe, ob alle Rules, Pfade, Backends und Ports korrekt
   verknüpft sind.

---

## 3. Deine Lösung (Befehle / Manifeste / Notizen)

### Lösung 3.1

```bash
k -n ingress-lab create deploy service-red --image=httpd:alpine \
  --replicas=2 --port=80
k -n ingress-lab create deploy service-blue --image=nginx:alpine \
  --replicas=2 --port=80

k -n ingress-lab expose deploy service-red --name=red-svc \
  --port=80 --target-port=80
k -n ingress-lab expose deploy service-blue --name=blue-svc \
  --port=80 --target-port=80

k -n ingress-lab create ingress color-ingress \
  --rule="/red*=red-svc:80" \
  --rule="/blue*=blue-svc:80" \
  $do > color-ingress.yaml

k apply -f color-ingress.yaml
```

### Lösung 3.2

```bash
k -n ingress-lab create ingress host-ingress \
  --rule="red.example.com/*=red-svc:80" \
  --rule="blue.example.com/*=blue-svc:80" \
  $do > host-ingress.yaml

k apply -f host-ingress.yaml
```

### Lösung 3.3

```bash
k -n ingress-lab describe ingress color-ingress
```

```text
Name:             color-ingress
Namespace:        ingress-lab
Rules:
  Host        Path  Backends
  ----        ----  --------
  *
              /red    red-svc:80 (10.244.2.112:80,10.244.1.118:80)
              /blue   blue-svc:80 (10.244.1.117:80,10.244.2.111:80)
```

```bash
k -n ingress-lab describe ingress host-ingress
```

```text
Name:             host-ingress
Namespace:        ingress-lab
Rules:
  Host              Path  Backends
  ----              ----  --------
  red.example.com
                    /   red-svc:80 (10.244.2.112:80,10.244.1.118:80)
  blue.example.com
                    /   blue-svc:80 (10.244.1.117:80,10.244.2.111:80)
```

---

## 4. Spickzettel & Doku-Hilfen (Optional / Bei Bedarf)

Falls du während der Bearbeitung nachschlagen möchtest:

- **kubernetes.io Keywords:** `ingress`, `ingress rules`
- **In-Terminal Syntax:**
  - `kubectl explain ingress.spec`
  - `kubectl explain ingress.spec.rules`
  - `kubectl explain ingress.spec.rules.http.paths`
  - `kubectl explain ingress.spec.rules.http.paths.backend`
- **CLI-Hilfe:**
  - `kubectl create ingress --help`

---

## 5. Feedback & Korrekturen

### Stärken & Volltreffer

- **Aufgabe 3.1 & 3.2 (Speed-Mastery):** Die Verwendung von
  `k create ingress` mit der Rule-Syntax:
  - `--rule="/red*=red-svc:80"`
  - `--rule="red.example.com/*=red-svc:80"`
  ist absolute Spitzenklasse für die CKA-Prüfung! Das spart gegenüber
  manuellem YAML-Tippen enorm viel Zeit und erzeugt automatisch den korrekten
  `pathType: Prefix`.
- **Aufgabe 3.3 (Deskriptor-Validierung):** `kubectl describe ingress` hat
  eindeutig gezeigt, dass beide Ingress-Ressourcen die jeweiligen Backends
  und Pod-Endpunkte (`10.244.X.X:80`) fehlerfrei aufgelöst haben.

---

### CKA-Aha-Momente & Prüfungs-Kniffe

#### 1. Wie steuert die CLI `pathType: Prefix` vs. `Exact`?

Die Wildcard `*` in der Rule-Syntax steuert direkt den `pathType`:

- `--rule="/red*=red-svc:80"` → `pathType: Prefix`
- `--rule="/red=red-svc:80"` (ohne Stern) → `pathType: Exact`

#### 2. Die `ingressClassName`-Option (Prüfungsfalle)

Wird in einer Prüfungsaufgabe explizit verlangt, dass der Ingress eine
bestimmte IngressClass nutzen soll (z. B. `ingressClassName: nginx`), kannst
du das direkt imperativ mitgeben:

```bash
kubectl create ingress color-ingress --class=nginx \
  --rule="/red*=red-svc:80"
```

#### 3. Der Rewrite-Target-Klassiker (`nginx.ingress.kubernetes.io/rewrite-target`)

Wenn ein Container seine Startseite unter `/` erwartet (wie `nginx` oder
`httpd`), der Ingress die Anfrage aber unter `/red` entgegennimmt, leitet der
Ingress-Controller standardmäßig den Pfad `/red` 1:1 an den Pod weiter.
Der Pod antwortet dann mit `404 Not Found`, weil er keine Datei unter `/red`
hat.

**Die CKA-Lösung:**

```bash
kubectl -n ingress-lab annotate ingress color-ingress \
  nginx.ingress.kubernetes.io/rewrite-target=/
```

Damit schneidet der Ingress den Präfix `/red` vor der Weiterleitung an den
Pod ab und liefert die Root-Seite `/`.
