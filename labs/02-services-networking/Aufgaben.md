# Tag 2: Services & Networking — Aufgabenkatalog

- **CKA Domäne:** Services & Networking (20% Prüfungsanteil)
- **Issue:** #4
- **Branch:** `day-02-services-networking`

---

## Übersicht der Themenblöcke

1. **Block 1: Service-Typen & Endpoints** (ClusterIP, NodePort, Headless,
   EndpointSlices)
2. **Block 2: CoreDNS & Namensauflösung** (FQDNs, Namespaces, Pod-DNS)
3. **Block 3: Ingress Controller & Routing** (Path-based, Name-based Virtual
   Hosting)
4. **Block 4: NetworkPolicies & Isolation** (Default-Deny, Ingress/Egress,
   Namespace-Selector)
5. **Block 5: Troubleshooting & Speed Drills** (Selector-Mismatch, Port-Fixes,
   DNS-Debug)

---

## Block 1: Service-Typen & EndpointSlices

### Aufgabe 1.1: ClusterIP Service & Speed-Generator

Erstelle im Namespace `net-lab`:

1. Ein Deployment `web-backend` mit Image `nginx:alpine` und 3 Replicas.
2. Exponiere das Deployment imperativ als Service `web-backend-svc` auf Port
   `80` (TargetPort `80`, ClusterIP).
3. Speichere das erzeugte Service-YAML in `web-backend-svc.yaml`.

### Aufgabe 1.2: NodePort Service

Erstelle im Namespace `net-lab`:

1. Einen NodePort-Service `app-nodeport-svc` für das Deployment `web-backend`.
2. Port: `8080`, TargetPort: `80`, NodePort: `30080`.
3. Teste den Zugriff über `curl` auf die Node-IP mit Port `30080`.

### Aufgabe 1.3: Headless Service

Erstelle im Namespace `net-lab`:

1. Einen Headless Service namens `db-headless` (`clusterIP: None`) für Pods mit
   dem Label `app=db`.
2. Erstelle zwei Pods `db-0` und `db-1` (Image `redis:alpine`, Label `app=db`).
3. Untersuche die DNS-Antwort bei Abfrage von `db-headless.net-lab.svc.cluster.local`.

### Aufgabe 1.4: EndpointSlices & Selektor-Prüfung

1. Zeige alle `endpoints` und `endpointslices` für `web-backend-svc` an.
2. Ändere temporär das Pod-Label eines Replicas und beobachte, wie sich die
   Endpoints anpassen.

---

## Block 2: CoreDNS & Namensauflösung

### Aufgabe 2.1: Cross-Namespace DNS & FQDN

1. Erstelle einen Namespace `client-lab`.
2. Starte einen Test-Pod `curl-client` (Image `curlimages/curl`,
   Befehl `sleep 3600`) in `client-lab`.
3. Führe aus dem Pod `curl-client` Abfragen aus auf:
   - Den kurzen Dienstnamen: `web-backend-svc` (sollte scheitern).
   - Den Namespace-qualifizierten Namen: `web-backend-svc.net-lab`.
   - Den vollständigen FQDN: `web-backend-svc.net-lab.svc.cluster.local`.

### Aufgabe 2.2: CoreDNS Konfiguration analysieren

1. Finde das Deployment und die ConfigMap von CoreDNS im Namespace `kube-system`.
2. Untersuche die Corefile-Konfiguration (`kubectl describe cm coredns -n kube-system`).
3. Notiere die Bedeutung der Einträge `kubernetes cluster.local` und `forward`.

---

## Block 3: Ingress-Routing

### Aufgabe 3.1: Path-based Ingress Routing

Erstelle im Namespace `ingress-lab`:

1. Zwei Deployments:
   - `service-red` (Image: `httpd:alpine`, Replicas: 2, Port: 80)
   - `service-blue` (Image: `nginx:alpine`, Replicas: 2, Port: 80)
2. Exponiere beide als ClusterIP Services `red-svc` und `blue-svc` auf Port `80`.
3. Erstelle eine Ingress-Ressource `color-ingress` mit folgenden Pfaden:
   - `/red` → `red-svc:80`
   - `/blue` → `blue-svc:80`

### Aufgabe 3.2: Host-based (Name-based Virtual Hosting) Ingress

Erweitere oder erstelle ein Ingress-Manifest `host-ingress.yaml`:

- Host `red.example.com` → `red-svc:80`
- Host `blue.example.com` → `blue-svc:80`

---

## Block 4: NetworkPolicies

### Aufgabe 4.1: Default-Deny Ingress Policy

1. Erstelle einen Namespace `secure-lab`.
2. Erstelle eine NetworkPolicy `default-deny-ingress`, die jeglichen
   eingehenden Datenverkehr für alle Pods im Namespace `secure-lab` blockiert.

### Aufgabe 4.2: Granulare Freigabe (Pod-to-Pod)

Im Namespace `secure-lab`:

1. Pod `backend` (Label: `app=backend`, Port 80).
2. Pod `frontend` (Label: `app=frontend`).
3. Pod `untrusted` (Label: `app=untrusted`).
4. Erstelle eine NetworkPolicy `allow-frontend-to-backend`, die ausschließlich
   Traffic vom Pod mit Label `app=frontend` auf Port `80` von `backend` erlaubt.
5. Verifiziere:
   - Zugriff von `frontend` auf `backend:80` ist erfolgreich.
   - Zugriff von `untrusted` auf `backend:80` schlägt fehl / läuft ins Timeout.

### Aufgabe 4.3: Namespace-übergreifende NetworkPolicy

1. Erlaube Datenverkehr auf `backend` im Namespace `secure-lab` nur von Pods
   im Namespace mit dem Label `environment=trusted`.

### Aufgabe 4.4: Egress Policy mit DNS-Ausnahme

1. Erstelle eine Egress-Policy für Pods mit Label `app=crawler`, die:
   - Ausgehenden Datenverkehr nur zu Port 443 (HTTPS) ins Internet erlaubt.
   - **Wichtig (CKA-Falle!):** Port 53 (UDP/TCP) zu CoreDNS explizit freigibt,
     damit DNS-Auflösung weiterhin funktioniert.

---

## Block 5: Troubleshooting & Speed Drills

### Aufgabe 5.1: Service Selector Mismatch Drill

Ein Service liefert keine Endpoints (`No endpoints available`).
Diagnostiziere und behebe die Diskrepanz zwischen Service `spec.selector`
und Pod `metadata.labels`.

### Aufgabe 5.2: Port vs. TargetPort Verwechslung

Ein Service antwortet mit `Connection refused`. Finde den Fehler in der
Port-Weiterleitung und korrigiere `port` vs. `targetPort`.
