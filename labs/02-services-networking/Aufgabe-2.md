# Aufgabe 2: CoreDNS, Namensauflösung & Pod-DNS

- **CKA Domäne:** Services & Networking (20%)
- **Lernberg-Stufe:** Tal → Hang
- **Issue:** #4
- **Entspricht:** Block 2 aus `Aufgaben.md`

---

## 1. Wissensnetz & Mentales Modell (Birkenbihl)

### Das Telefonbuch des Clusters (CoreDNS)

CoreDNS läuft als Deployment im Namespace `kube-system` und verwaltet zwei
Arten von Telefonbucheinträgen:

1. **Service-Einträge (A/SRV-Records):**
   - Format: `<service-name>.<namespace>.svc.cluster.local`
   - Löst zur virtuellen `ClusterIP` auf (oder zu Pod-IPs bei Headless).
2. **Pod-Einträge (Direktadressierung via IP):**
   - Format: `<ip-mit-bindestrichen>.<namespace>.pod.cluster.local`
   - Beispiel für Pod-IP `10.244.2.55` in `net-lab`:
     `10-244-2-55.net-lab.pod.cluster.local`

### Wie ein Pod Namen auflöst (`/etc/resolv.conf`)

Jeder Container erbt von Kubelet Suchpfade (_search domains_):

```text
search <namespace>.svc.cluster.local svc.cluster.local cluster.local
nameserver 10.96.0.10
options ndots:5
```

- **Kurzname (`web-backend-svc`):** Linux probiert `<kurzname>.<namespace>...`
  und findet den Service nur, wenn er im **selben** Namespace liegt.
- **Ortsvorwahl (`web-backend-svc.net-lab`):** Funktioniert aus **jedem**
  Namespace, weil der 2. Suchpfad (`svc.cluster.local`) angehängt wird.
- **FQDN:** Funktioniert immer und überall direkt ohne Suchpfade.

---

## 2. Aufgabenstellung (Block 2)

Voraussetzung: Die Ressourcen aus Block 1 im Namespace `net-lab` laufen
weiterhin (`web-backend-svc`).

### Aufgabe 2.1: Cross-Namespace DNS & Namensauflösung testen

1. Erstelle einen neuen Namespace `client-lab`.
2. Starte einen interaktiven Debug-Pod `curl-client` im Namespace `client-lab`
   (Image: `curlimages/curl` oder `busybox:1.28`; Hinweis: Sollte `busybox:1.28`
   lokal auf Apple Silicon / ARM64 fehlschlagen, verwende `busybox:latest`).
3. Führe aus diesem Pod im Namespace `client-lab` folgende DNS- und HTTP-Tests
   auf den Service in `net-lab` durch:
   - Test A: Kurzname `web-backend-svc` (Notiere das Verhalten/Fehlermeldung).
   - Test B: Namespace-qualifizierter Name `web-backend-svc.net-lab`.
   - Test C: Vollständiger FQDN `web-backend-svc.net-lab.svc.cluster.local`.
4. Greife per HTTP (`curl` oder `wget`) über den FQDN auf den Webserver zu.

### Aufgabe 2.2: Pod-DNS (Direkte Pod-IP-Auflösung)

1. Ermittle die Pod-IP eines der laufenden `web-backend`-Pods im Namespace
   `net-lab`.
2. Konstruiere den zugehörigen Pod-DNS-Namen
   (`<ip-mit-bindestrichen>.net-lab.pod.cluster.local`).
3. Löse diesen Pod-DNS-Namen mit `nslookup` aus deinem Test-Pod in
   `client-lab` auf und überprüfe, ob CoreDNS die korrekte Pod-IP liefert.

### Aufgabe 2.3: CoreDNS-Konfiguration & Corefile analysieren

1. Finde die ConfigMap von CoreDNS im Namespace `kube-system`.
2. Sieh dir das `Corefile` in dieser ConfigMap an.
3. Beantworte kurz folgende zwei Fragen in deinen Notizen:
   - Welcher Block ist für die `.cluster.local`-Zonendatei zuständig?
   - Wohin werden externe DNS-Anfragen (z. B. `google.com`) weitergeleitet?

---

## 3. Deine Lösung (Befehle / Manifeste / Notizen)

### Lösung 2.1

```bash
kubectl -n client-lab run -it --rm --restart=Never curl-client \
  --image=busybox:latest sh
```

```text
/ # nslookup web-backend-svc
Server:         10.96.0.10
Address:        10.96.0.10:53
** server can't find web-backend-svc.client-lab.svc.cluster.local: NXDOMAIN

/ # nslookup web-backend-svc.net-lab
Server:         10.96.0.10
Address:        10.96.0.10:53
** server can't find web-backend-svc.net-lab: NXDOMAIN

/ # nslookup web-backend-svc.net-lab.svc.cluster.local
Server:         10.96.0.10
Address:        10.96.0.10:53
Name:   web-backend-svc.net-lab.svc.cluster.local
Address: 10.96.130.34

/ # wget -cqS http://web-backend-svc.net-lab.svc.cluster.local
  HTTP/1.1 200 OK
  Server: nginx/1.31.4
  ...
```

```bash
kubectl -n client-lab run -it --rm --restart=Never curl-client \
  --image=curlimages/curl sh
```

```text
~ $ curl http://web-backend-svc.net-lab.svc.cluster.local
<!DOCTYPE html>
<html>
<head>
<title>Welcome to nginx!</title>
...
</html>
```

### Lösung 2.2

```bash
kubectl -n net-lab get pods -l app=web-backend \
    -o go-template='{{range .items}}{{.status.podIP}}{{"\n"}}{{end}}'

# Ausgabe:
# 10.244.2.99
# 10.244.2.103
# 10.244.2.102

for ep in 99 103 102; do
  kubectl -n client-lab run -it --rm --restart=Never curl-client \
    --image=busybox:latest -- \
    nslookup 10-244-2-$ep.net-lab.pod.cluster.local
done
```

```text
Server:         10.96.0.10
Address:        10.96.0.10:53

Name:   10-244-2-99.net-lab.pod.cluster.local
Address: 10.244.2.99

Name:   10-244-2-103.net-lab.pod.cluster.local
Address: 10.244.2.103

Name:   10-244-2-102.net-lab.pod.cluster.local
Address: 10.244.2.102
```

### Lösung 2.3

```bash
k -n kube-system get configmaps coredns -o yaml | grep -i -A 23 CoreFile
```

```yaml
  Corefile: |
    .:53 {
        errors
        health {
           lameduck 5s
        }
        ready
        kubernetes cluster.local in-addr.arpa ip6.arpa {
           pods insecure
           fallthrough in-addr.arpa ip6.arpa
           ttl 30
        }
        prometheus :9153
        forward . /etc/resolv.conf {
           max_concurrent 1000
        }
        cache 30 {
           disable success cluster.local
           disable denial cluster.local
        }
        loop
        reload
        loadbalance
    }
```

- **Welcher Block ist für die `.cluster.local`-Zonendatei zuständig?**

```text
kubernetes cluster.local in-addr.arpa ip6.arpa {
   pods insecure
   fallthrough in-addr.arpa ip6.arpa
   ttl 30
}
```

- **Wohin werden externe DNS-Anfragen (z. B. `google.com`) weitergeleitet?**

```text
forward . /etc/resolv.conf {
   max_concurrent 1000
}
```

---

## 4. Spickzettel & Doku-Hilfen (Optional / Bei Bedarf)

Falls du während der Bearbeitung nachschlagen möchtest:

- **kubernetes.io Keywords:** `dns pod service`, `custom dns coredns`
- **In-Terminal Syntax:**
  - `kubectl explain cm`
  - `kubectl explain pod.spec.dnsPolicy`
  - `kubectl explain pod.spec.dnsConfig`
- **CLI-Hilfe:**
  - `kubectl get cm -n kube-system`
  - `kubectl describe cm <cm-name> -n kube-system`

---

## 5. Feedback & Korrekturen

### Stärken & Volltreffer

- **Aufgabe 2.1:** Absolut fehlerfrei! Du hast sowohl `busybox` (mit `wget`) als
  auch `curlimages/curl` meisterhaft eingesetzt und den kompletten FQDN-Pfad
  verifiziert.
- **Aufgabe 2.2:** Sehr stark! Die Pod-IP-Extraktion via `go-template` und die
  automatisierte `for`-Schleife über alle drei Pod-IPs mit der Bindestrich-
  Notation (`10-244-2-X.net-lab.pod.cluster.local`) war absolute Spitzenklasse.
- **Aufgabe 2.3:** Beide CoreDNS-Fragen absolut präzise beantwortet:
  1. Das Plugin **`kubernetes cluster.local`** beantwortet alle internen
     Cluster-Anfragen (Services, Pods, Endpoints).
  2. Die Direktive **`forward . /etc/resolv.conf`** leitet alle externen
     Anfragen an die Upstream-DNS-Server des Host-Knotens weiter.

---

### Analyse & CKA-Aha-Momente

#### 1. Warum schlug `nslookup web-backend-svc.net-lab` in Busybox fehl?

In deinem Test lieferte `web-backend-svc.net-lab` ein `NXDOMAIN`.
**Hintergrund:**
In Standard-Linux-Systemen (`glibc` / `curl`-Image) hängt der Resolver bei
zwei Namensbestandteilen (`web-backend-svc.net-lab`) automatisch die Search-
Domain `svc.cluster.local` an, wenn `ndots:5` gesetzt ist.
Neuere `busybox`-Implementierungen von `nslookup` interpretieren Punkte
manchmal strikt und überspringen Suchpfade.
**Prüfungs-Takeaway:** Wenn ein Kurz- oder Teilname im Debugging fehlschlägt,
teste **immer sofort den vollen FQDN**
(`web-backend-svc.net-lab.svc.cluster.local`). Der FQDN ist immun gegen
Resolver-Eigenheiten!

#### 2. Das `pods insecure`-Plugin im Corefile

In Zeile `pods insecure` im Corefile steckt die Magie für Aufgabe 2.2:

- `insecure`: Erlaubt die Auflösung von `10-244-X-Y.<ns>.pod.cluster.local`
  zu jeder Pod-IP im Cluster, ohne dass der Pod einen eigenen Hostname definiert.
- `disabled`: Würde Pod-DNS komplett abschalten.
- `verified`: Löst Pod-DNS nur auf, wenn ein Service im selben Namespace
  auf denselben Pod zeigt (Sicherheits-Feature gegen IP-Spoofing).

---

### CKA Speed-Tipp für Pod-IPs

Statt `go-template` kannst du in der Prüfung noch schneller `-o wide` nutzen:

```bash
k -n net-lab get pods -o wide
```

Damit siehst du Pod-Name, Status, Node und Pod-IP direkt nebeneinander in
einer kompakten Tabelle.
