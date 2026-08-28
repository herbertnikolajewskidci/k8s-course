# Aufgabe 1: Service-Typen, EndpointSlices & CoreDNS-Auflösung

- **CKA Domäne:** Services & Networking (20%)
- **Lernberg-Stufe:** Tal → Hang
- **Issue:** #4
- **Entspricht:** Block 1 aus `Aufgaben.md`

---

## 1. Wissensnetz & Mentales Modell (Birkenbihl)

### Service als Telefonzentrale & Vermittlungsstelle

Pods sind flüchtig (*ephemeral*) und erhalten bei jedem Neustart eine neue IP.
Ein **Service** ist ein stabiler Abstraktions-Layer (feste IP & DNS-Name),
der den Datenverkehr über Label-Selektoren dynamisch an die passenden Pods
weiterleitet.

- **ClusterIP** (Standard): Nur cluster-intern erreichbar (interne
  Durchwahl).
- **NodePort**: Öffnet einen statischen Port (Standard: 30000–32767) auf
  *jedem* Cluster-Knoten.
- **Headless Service** (`clusterIP: None`): Keine ClusterIP, DNS liefert
  direkt die IPs der Pods (A/AAAA-Records). Ideal für StatefulSets.

### CoreDNS FQDN Struktur

```text
<service-name>.<namespace>.svc.cluster.local
```

Für Pods (z. B. für IP `10.244.1.5` im Namespace `net-lab`):

```text
10-244-1-5.net-lab.pod.cluster.local
```

---

## 2. Aufgabenstellung (Block 1)

Namespace für diesen Block: `net-lab`.

### Aufgabe 1.1: ClusterIP Service & Speed-Generator

1. Erstelle ein Deployment `web-backend` mit Image `nginx:alpine` und 3
   Replicas im Namespace `net-lab`.
2. Exponiere das Deployment als Service `web-backend-svc` auf Port `80`
   (TargetPort `80`, Typ ClusterIP).
3. Speichere das erzeugte Service-YAML in `web-backend-svc.yaml`.

### Aufgabe 1.2: NodePort Service

1. Erstelle im Namespace `net-lab` einen NodePort-Service `app-nodeport-svc`
   für das Deployment `web-backend`.
2. Port: `8080`, TargetPort: `80`, NodePort: `30080`.
3. Teste den Zugriff über `curl` auf die Node-IP mit Port `30080`.

### Aufgabe 1.3: Headless Service

1. Erstelle im Namespace `net-lab` einen Headless Service namens `db-headless`
   (`clusterIP: None`, Port: `6379`) für Pods mit dem Label `app=db`.
2. Erstelle zwei Pods `db-0` und `db-1` (Image `redis:alpine`, Label `app=db`).
3. Untersuche die DNS-Antwort bei Abfrage von
   `db-headless.net-lab.svc.cluster.local`.

### Aufgabe 1.4: EndpointSlices & Selektor-Prüfung

1. Zeige alle `endpoints` und `endpointslices` für `web-backend-svc` an.
2. Ändere temporär das Pod-Label eines Replicas und beobachte, wie sich die
   Endpoints anpassen.

---

## 3. Deine Lösung (Befehle / Manifeste / Notizen)

### Lösung 1.1

```bash
k create deployment web-backend -n net-lab --image=nginx:alpine --replicas=3
k -n net-lab expose deployment web-backend --port=80 --target-port=80 \
    --name=web-backend-svc $do > web-backend-svc.yaml
k apply -f web-backend-svc.yaml
```

### Lösung 1.2

```bash
k -n net-lab create svc nodeport web-backend --tcp=8080:80 --node-port=30080 \
    $do > app-nodeport-svc.yaml
```

Ersetze in `app-nodeport-svc.yaml` der Wert für `metadata.name` auf
`app-nodeport-svc`

```bash
k apply -f app-nodeport-svc.yaml
k get nodes -o wide
```

```text
Output:
NAME                        STATUS   ROLES           AGE     VERSION
cka-cluster-control-plane   Ready    control-plane   2d15h   v1.36.1
...
```

```bash
curl http://192.168.147.4:30080
```

### Lösung 1.3

```bash
k -n net-lab create svc clusterip db-headless --clusterip="None" --tcp=6379 \
  $do > db-headless.yaml
```

Ersetze in `db-headless.yaml` der Wert für `spec.selector.selector.app` auf
`db`

```bash
k run db-0 --image=redis:alpine -l=app=db
k run db-1 --image=redis:alpine -l=app=db
```

### Lösung 1.4

```bash
k -n net-lab get endpoints
```

```text
Output:
NAME               ENDPOINTS                                        AGE
app-nodeport-svc   10.244.2.102:80,10.244.2.103:80,10.244.2.99:80   57m
db-headless        <none>                                           23m
web-backend-svc    10.244.2.102:80,10.244.2.103:80,10.244.2.99:80   104m
```

```bash
k -n net-lab get endpointslices
```

```text
Output:
NAME                     ADDRESSTYPE   PORTS     ENDPOINTS
app-nodeport-svc-vqrfp   IPv4          80        10.244.2.103,10.244.2.99...
db-headless-nb9dg        IPv4          <unset>   <unset>
web-backend-svc-6fhnz    IPv4          80        10.244.2.99,10.244.2.102...
```

---

## 4. Spickzettel & Doku-Hilfen (Optional / Bei Bedarf)

Falls du während der Bearbeitung nachschlagen möchtest:

- **kubernetes.io Keywords:** `service`, `dns pod service`, `endpointslices`
- **In-Terminal Syntax:**
  - `kubectl explain svc.spec`
  - `kubectl explain svc.spec.ports`
  - `kubectl explain svc.spec.type`
- **CLI-Hilfe:** `kubectl create service --help` oder `kubectl expose --help`

---

## 5. Feedback & Korrekturen

### Stärken & Volltreffer

- **Aufgabe 1.1:** Perfekt gelöst! Saubere Kombination aus
  `k create deployment`, `k expose` mit `$do` und anschließendem `k apply`.
- **Aufgabe 1.2:** Starker Workflow mit `k create svc nodeport` unter Angabe
  von `--tcp=8080:80` und `--node-port=30080`. Die Node-IP-Ermittlung via
  `k get nodes -o wide` und der `curl`-Test waren absolut präzise.
- **Aufgabe 1.3:** Korrektes Verständnis von Headless Services mit
  `--clusterip="None"`.

---

### Analyse & Aha-Momente (Korrekturen)

#### 1. Die Namespace-Falle bei `db-0` und `db-1` (Aufgabe 1.3)

Beim Erstellen der beiden Redis-Pods fehlte das `-n net-lab`:

```bash
# Befehl aus deiner Lösung (landete im Namespace 'default'):
k run db-0 --image=redis:alpine -l=app=db
k run db-1 --image=redis:alpine -l=app=db
```

**Warum waren die Endpoints `<none>` / `<unset>`?**
Ein Service sucht mit seinem Label-Selektor (`app=db`) **ausschließlich im
eigenen Namespace**. Da `db-headless` in `net-lab` lag, aber die Pods in
`default`, konnte der Endpoint-Controller keine Ziel-IPs zuordnen.

**Korrektur:**

```bash
k run db-0 -n net-lab --image=redis:alpine -l=app=db
k run db-1 -n net-lab --image=redis:alpine -l=app=db
```

#### 2. Der DNS-Effekt: Headless vs. ClusterIP (Wissensnetz)

Sobald die Pods in `net-lab` laufen, zeigt sich der fundamentale Unterschied
im DNS:

- **Normaler ClusterIP-Service (`web-backend-svc`):**
  CoreDNS antwortet mit genau **einer** virtuellen IP (z. B. `10.96.130.34`).
  Das Load-Balancing übernimmt iptables/IPVS auf Node-Ebene.
- **Headless-Service (`db-headless`):**
  CoreDNS antwortet mit **mehreren A-Records** (direkt die IP von `db-0` und
  `db-1`). Der Client entscheidet selbst, welchen Pod er anspricht (wichtig
  für Master/Replica-Datenbanken & StatefulSets).

Test-Befehl für die Prüfung:

```bash
k run dns-test -n net-lab --image=busybox:1.28 --rm -it --restart=Never -- \
  nslookup db-headless
```

#### 3. Selektor-Dynamik in Aufgabe 1.4

Wenn du das Label eines Pods änderst, der zu einem Deployment gehört:

```bash
k label pod web-backend-xxxx -n net-lab app=debug --overwrite
```

Passieren zwei Dinge gleichzeitig:

1. Der Pod verliert sofort seinen Eintrag in den `endpointslices` des
   Services.
2. Das ReplicaSet stellt fest: *„Ich brauche 3 Pods mit `app=web-backend`,
   habe aber nur noch 2!“* und startet sofort einen neuen 4. Pod.

---

### CKA Exam Speed-Tipps

1. **Namespace-Präfix:** Setze `-n <ns>` immer direkt hinter `kubectl`
   (z. B. `k -n net-lab run ...`), damit es bei schnellen Befehlen nie vergessen
   geht.
2. **Endpoint-Validierung:** Bei Service-Problemen immer sofort
   `k get endpointslices -n <ns>` oder `k get ep -n <ns>` prüfen. Wenn dort
   `<none>` steht, stimmen Service-Selektor oder Pod-Labels/Namespace nicht.
