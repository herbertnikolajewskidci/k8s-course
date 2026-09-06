# Aufgabe 2: Gateway API & HTTPRoute (Killer.sh Q13 Reflex-Training)

- **CKA Domäne:** Services & Networking (20%)
- **Lernberg-Stufe:** Hang → Gipfel (Prüfungs-Reflex)
- **Issue:** #11
- **Fokus:** Gateway API Ressourcenstruktur, Pfad- und Header-Routing in
  unter 5 Minuten

---

## 1. Wissensnetz & Mentales Modell (Birkenbihl)

Die Gateway API ist der moderne Nachfolger von Ingress und teilt
Zuständigkeiten sauber auf drei Ebenen auf:

1. **GatewayClass:** Die Schiene (Cluster-Admin / Infra-Provider, z. B. Traefik,
   Envoy).
2. **Gateway:** Der Bahnhof / Eintrittspunkt (Cluster-Operator). Öffnet Ports
   (z. B. 80, 443) und Listener.
3. **HTTPRoute:** Der Fahrplan (App-Entwickler). Definiert Regeln: Welcher Host,
   Pfad oder HTTP-Header fährt zu welchem Kubernetes Service Backend.

### Die Routing-Hierarchie im Kopf

```text
Request: GET /mobile (User-Agent: Mobile)
   ↓
[ Gateway: my-gateway (Port 80 HTTP) ]
   ↓
[ HTTPRoute: my-route ]
   ├── Match 1: path: /mobile    → Backend: mobile-svc:80
   └── Match 2: path: /desktop   → Backend: desktop-svc:80
```

---

## 2. Aufgabenstellung

Arbeitsverzeichnis für diese Aufgabe:
`labs/07-gipfel-killer-sh/lab-02-gateway-api/`

### Teilaufgabe 2.1: Gateway API Doku-Reflex & HTTPRoute Gerüst

> **💡 Reflex-Empfehlung:**
>
> - **Wo suchen?** Browser `kubernetes.io/docs/`
> - **Exakter Suchbegriff:** `gateway api httproute` (Erster Treffer:
>   *Concepts -> Gateway API*)
> - **In-Page-Shortcut:** `Ctrl+F` nach `kind: HTTPRoute`
> - **Terminal-Check:** Falls Gateway API CRDs im Cluster installiert sind:
>   `kubectl explain httproute.spec.rules`

Erstelle im Arbeitsverzeichnis die Datei `httproute-paths.yaml` für folgende
Anforderung:

1. Target-Gateway:
   - Name: `internal-gateway`
2. Hostname:
   - `portal.example.com`
3. Pfad-Routing (`rules:`):
   - Pfad-Präfix `/mobile` soll weitergeleitet werden an den Service
     `mobile-service` auf Port `8080`.
   - Pfad-Präfix `/desktop` soll weitergeleitet werden an den Service
     `desktop-service` auf Port `8080`.

---

### Teilaufgabe 2.2: Advanced Matching (Header-Routing - Killer.sh Q13 Spezialfall)

In Killer.sh Q13 wird oft nicht nur nach Pfad, sondern auch nach **HTTP-Headern**
oder Methoden geroutet (z. B. Versions-Header oder User-Agent).

> **💡 Reflex-Empfehlung:**
>
> - **Syntax-Merkhilfe:** Unter `matches:` gibt es zwei gleichberechtigte
>   Geschwister: `path:` und `headers:`.
> - Header-Match ist eine Liste:
>   `- name: "version"`, `value: "v2"`, (optional `type: Exact`).

Erweitere oder erstelle eine zweite Datei `httproute-headers.yaml`:

1. Target-Gateway: `internal-gateway`
2. Hostname: `portal.example.com`
3. Eine Routing-Regel, die greift, wenn:
   - Der Request-Header `env` exakt den Wert `canary` hat.
   - Leite diesen Traffic an den Service `canary-service` auf Port `8080`.
4. Eine Fallback-Regel (ohne Header-Match), die den restlichen Traffic an
   `stable-service` auf Port `8080` sendet.

---

## 3. Spickzettel & Doku-Hilfen (Prüfungs-Shortcuts)

### HTTPRoute Vollvorlage (Exakt wie in der Doku)

```yaml
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: example-httproute
  namespace: default
spec:
  parentRefs:
    - name: internal-gateway
  hostnames:
    - "portal.example.com"
  rules:
    - matches:
        - path:
            type: PathPrefix
            value: /mobile
      backendRefs:
        - name: mobile-service
          port: 8080
    - matches:
        - headers:
            - name: env
              value: canary
      backendRefs:
        - name: canary-service
          port: 8080
```

---

## 4. Feedback & Korrekturen

### Review zu Aufgabe 2.1 (`httproute-paths.yaml`)

- **Umsetzung:** Grundgerüst (`apiVersion: gateway.networking.k8s.io/v1`,
  `parentRefs: internal-gateway`, `hostnames: portal.example.com`) fehlerfrei
  erstellt.
- **Korrektur:** In deiner Datei wurden Pfad- und Header-Routing vermischt.
  Pfad `/desktop` und Service `desktop-service:8080` fehlten, und der Service für
  `/mobile` hieß `mobile-svc` statt `mobile-service`.
- **Zielmanifest:**

  ```yaml
  apiVersion: gateway.networking.k8s.io/v1
  kind: HTTPRoute
  metadata:
    name: httproute-paths
  spec:
    parentRefs:
      - name: internal-gateway
    hostnames:
      - "portal.example.com"
    rules:
      - matches:
          - path:
              type: PathPrefix
              value: /mobile
        backendRefs:
          - name: mobile-service
            port: 8080
      - matches:
          - path:
              type: PathPrefix
              value: /desktop
        backendRefs:
          - name: desktop-service
            port: 8080
  ```

### Review zu Aufgabe 2.2 (`httproute-headers.yaml`)

- **Umsetzung:** Datei enthielt das Standard-Template aus der Doku (`/login`,
  `www.example.com`).
- **Korrektur:** Gefordert war gezieltes Routing basierend auf einem HTTP-Header
  sowie ein nachgelagerter Fallback ohne Matcher.
- **CKA-Reflex:**
  1. Header-Matching gehört als Unterliste unter `matches.headers` (Felder:
     `name` und `value`).
  2. Fallback-Routing: Ein Regel-Eintrag unter `rules` **ohne** `matches:`
     fungiert automatisch als Standard-Catch-All für allen restlichen Traffic.
- **Zielmanifest:**

  ```yaml
  apiVersion: gateway.networking.k8s.io/v1
  kind: HTTPRoute
  metadata:
    name: httproute-headers
  spec:
    parentRefs:
      - name: internal-gateway
    hostnames:
      - "portal.example.com"
    rules:
      - matches:
          - headers:
              - name: env
                value: canary
        backendRefs:
          - name: canary-service
            port: 8080
      - backendRefs:
          - name: stable-service
            port: 8080
  ```
