# Aufgabe 4: NetworkPolicies (Default-Deny, Pod-/Namespace-Selector & Egress)

- **CKA Domäne:** Services & Networking (20%)
- **Lernberg-Stufe:** Tal → Hang
- **Issue:** #4
- **Entspricht:** Block 4 aus `Aufgaben.md`

---

## 1. Wissensnetz & Mentales Modell (Birkenbihl)

### NetworkPolicy als Club-Türsteher & Brandschutzwand

Standardmäßig gilt in Kubernetes das Prinzip **Open House**: Jeder Pod darf mit
jedem anderen Pod im gesamten Cluster frei kommunizieren (Default Allow).

Sobald eine **NetworkPolicy** einen Pod über `spec.podSelector` selektiert, wird
dieser Pod **isoliert** (Default Deny für alle nicht explizit erlaubten Regeln).

```text
              ┌─────────────────────────────────────┐
              │           NetworkPolicy             │
              │       (Türsteher / Firewall)        │
              └──────────────────┬──────────────────┘
                                 │
     ┌───────────────────────────┴───────────────────────────┐
     ▼                                                       ▼
 ┌──────────────┐ (Wer darf REIN?)           ┌──────────────┐ (Wohin darf
 │   INGRESS    │                            │    EGRESS    │  ich RAUS?)
 │  from:       │                            │  to:         │
 │  - podSel    │                            │  - ipBlock   │
 │  - nsSel     │                            │  - ports(53!)│
 └──────────────┘                            └──────────────┘
```

### Die 3 goldenen CKA-Regeln für NetworkPolicies

1. **Selektor-Logik (`from:` / `to:`):**
   - **Array-Elemente (ODER-Verknüpfung):**
     Getrennte Bindestriche bedeuten: Traffic aus Namespace A _ODER_ von
     Pod B ist erlaubt.
   - **Gleicher Eintrag (UND-Verknüpfung):**
     Kein extra Bindestrich zwischen `namespaceSelector` und `podSelector`
     bedeutet: Nur Pods mit Label X _INNERHALB_ von Namespace mit Label Y!
2. **Die CKA-Egress-Falle (DNS-Blackhole):**
   - Wenn du eine `Egress`-Policy aktivierst, verliert der Pod sofort den
     Zugriff auf CoreDNS!
   - Jeder ausgehende Domainaufruf (`curl https://example.com`) schlägt fehl,
     sofern Port `53` (UDP und TCP) nicht explizit in `ports` erlaubt wird.
3. **`policyTypes` Deklaration:**
   - Gib immer explizit an, ob `Ingress`, `Egress` oder beides gesteuert wird:
     `policyTypes: ["Ingress"]` bzw. `policyTypes: ["Ingress", "Egress"]`.

---

## 2. Aufgabenstellung (Block 4)

Namespace für diesen Block: `secure-lab`.

### Vorbereitung: Testumgebung aufbauen

Erstelle im Namespace `secure-lab` folgende Ressourcen:

1. Namespace `secure-lab` anlegen.
2. Pod `backend` (Image: `nginx:alpine`, Label: `app=backend`, Port 80).
3. Pod `frontend` (Image: `curlimages/curl`, Label: `app=frontend`,
   Befehl: `sleep 3600`).
4. Pod `untrusted` (Image: `curlimages/curl`, Label: `app=untrusted`,
   Befehl: `sleep 3600`).
5. Service `backend` erstellen (`kubectl expose pod backend -n secure-lab --port=80`),
   damit die DNS-Auflösung via `backend` bzw. `backend.secure-lab` funktioniert.

---

### Aufgabe 4.1: Default-Deny Ingress Policy

1. Erstelle ein NetworkPolicy-Manifest `default-deny-ingress.yaml` im Namespace
   `secure-lab`.
2. Die Policy muss für **alle Pods** im Namespace jeglichen eingehenden
   Datenverkehr (Ingress) blockieren.
3. Wende das Manifest an und verifiziere, dass `frontend` den Service/Pod
   `backend` nicht mehr erreichen kann (`curl --connect-timeout 3 backend`
   oder via Pod-IP).

---

### Aufgabe 4.2: Granulare Freigabe (Pod-to-Pod Ingress)

1. Erstelle eine NetworkPolicy `allow-frontend-to-backend.yaml` im Namespace
   `secure-lab`.
2. Ziel: Nur Pods mit dem Label `app=frontend` dürfen auf Port `80` (TCP) des
   Pods `app=backend` zugreifen.
3. Wende das Manifest an und teste:
   - Zugriff von `frontend` auf `backend:80` (muss funktionieren / HTTP 200).
   - Zugriff von `untrusted` auf `backend:80` (muss ins Timeout laufen).

---

### Aufgabe 4.3: Namespace-übergreifende Freigabe (Namespace-Selector)

1. Erstelle einen zweiten Namespace `external-lab` und versehe ihn mit dem
   Label `environment=trusted`.
2. Starte darin einen Test-Pod `ext-client` (Image: `curlimages/curl`,
   Label: `client=external`, Befehl: `sleep 3600`).
3. Erweitere oder erstelle eine NetworkPolicy `allow-trusted-ns.yaml` in
   `secure-lab`, sodass:
   - Ausschließlich Pods aus Namespaces mit dem Label `environment=trusted`
     auf Port `80` des Pods `backend` im Namespace `secure-lab` zugreifen
     dürfen.
4. Verifiziere den Zugriff von `ext-client` auf `backend.secure-lab:80`.

---

### Aufgabe 4.4: Egress Policy mit DNS-Ausnahme (CKA-Klassiker)

1. Erstelle im Namespace `secure-lab` einen Pod `crawler` (Image:
   `curlimages/curl`, Label: `app=crawler`, Befehl: `sleep 3600`).
2. Erstelle ein NetworkPolicy-Manifest `crawler-egress.yaml` für Pods mit dem
   Label `app=crawler`:
   - Ausgehender Verkehr (`Egress`) darf nur ins Internet / extern auf Port
     `443` (TCP) und Port `80` (TCP) gehen.
   - **Egress-DNS:** Ausgehender Datenverkehr auf Port `53` (UDP und TCP) muss
     erlaubt sein, damit CoreDNS funktioniert.
   - Jeglicher anderer ausgehender Datenverkehr (z.B. interner Zugriff auf
     andere Ports) muss blockiert sein.
3. Wende das Manifest an und verifiziere:
   - `curl -I https://kubernetes.io` aus `crawler` funktioniert.
   - `curl --connect-timeout 3 http://backend:80` aus `crawler` wird blockiert.

---

## 3. Deine Lösung (Befehle / Manifeste / Notizen)

### Vorbereitung: Setup-Befehle

```bash
# Deine Befehle für die Test-Pods
k -n secure-lab run backend --image=nginx:alpine \
    -l=app=backend --port=80

k -n secure-lab run frontend --image=curlimages/curl \
    -l=app=frontend --command -- sleep 3600

k -n secure-lab run untrusted --image=curlimages/curl \
    -l=app=untrusted --command -- sleep 3600

k -n secure-lab expose pod backend --port=80

```

### Lösung 4.1: Default-Deny Ingress

```yaml
# default-deny-ingress.yaml
siehe Datei
```

```bash
# Verifizierungsbefehle
 k -n secure-lab exec -it pod/frontend -- curl --connect-timeout 3 backend
```

### Lösung 4.2: Pod-to-Pod Ingress

```yaml
# allow-frontend-to-backend.yaml
siehe Datei
```

```bash
# Verifizierungsbefehle
k -n secure-lab exec -it pod/frontend -- curl --connect-timeout 3 backend
k -n secure-lab exec -it pod/untrusted -- curl --connect-timeout 3 backend
```

### Lösung 4.3: Namespace-übergreifende Freigabe

```yaml
# allow-trusted-ns.yaml
siehe Datei
```

```bash
# Verifizierungsbefehle
k -n external-lab exec -it pod/ext-client \
    -- curl --connect-timeout 3  backend.secure-lab:80
```

### Lösung 4.4: Egress Policy mit DNS-Ausnahme

```yaml
# crawler-egress.yaml
siehe Datei
```

```bash
# Verifizierungsbefehle
```

---

## 4. Spickzettel & Doku-Hilfen (Optional / Bei Bedarf)

Falls du während der Bearbeitung nachschlagen möchtest:

- **kubernetes.io Keywords:** `network policies`, `declare network policy`,
  `default deny all ingress`
- **In-Terminal Syntax:**
  - `kubectl explain networkpolicy.spec`
  - `kubectl explain networkpolicy.spec.ingress.from`
  - `kubectl explain networkpolicy.spec.egress.to`
  - `kubectl explain networkpolicy.spec.ingress.ports`
- **CLI-Hilfe:** `kubectl get netpol -A`

---

## 5. Feedback & Korrekturen

### 🌟 Ball-im-Tor: Was war hervorragend?

1. **Setup & Vorbereitung:**
   Die Pods wurden absolut lehrbuchmäßig mit `k run`, Labels (`-l`) und
   `--command -- sleep 3600` erstellt. Auch das Exposing als Service hast du
   nach dem Aha-Moment sofort perfekt umgesetzt.
2. **Aufgabe 4.1 (Default-Deny Ingress):**
   Das Prinzip `podSelector: {}` in Kombination mit `policyTypes: ["Ingress"]`
   ohne `ingress:`-Sektion ist die 100% offizielle Kubernetes-Lösung für
   Default-Deny.
3. **Aufgabe 4.2 (Pod-to-Pod Ingress):**
   Exzellent gelöst! Selektion über `podSelector.matchLabels.app: backend` und
   Freigabe nur für `podSelector.matchLabels.app: frontend` auf Port `80/TCP`.
   Der Gegen-Test mit `untrusted` (Timeout) belegt die Funktion einwandfrei.
4. **Aufgabe 4.3 (Namespace-übergreifend):**
   Die Verwendung von `namespaceSelector.matchLabels.environment: trusted`
   wurde fehlerfrei umgesetzt und über den externen Client erfolgreich
   verifiziert.

---

### 🔍 Fehleranalyse & Aha-Momente für Aufgabe 4.4 (Egress & DNS)

In deiner `crawler-egress.yaml` gab es zwei kleine Stolperfallen:

1. **Subnetz-Größe (`cidr: 0.0.0.0/24` vs. `0.0.0.0/0`):**
   - `/24` bedeutet nur `0.0.0.0` bis `0.0.0.255` (also praktisch keine
     echten Internet- oder Cluster-IPs).
   - Das gesamte Internet / externe Adressen werden als `0.0.0.0/0` notiert.
2. **CoreDNS-Erreichbarkeit:**
   - Der CoreDNS-Service liegt im internen ClusterIP-Netz (z.B. `10.96.0.10`).
   - Wenn Port 53 auf `0.0.0.0/24` beschränkt wird, erreicht der Pod CoreDNS
     nicht und schlägt bei der Namensauflösung fehl.
3. **Die goldene CKA-Regel für Egress-DNS:**
   - Bei DNS-Regeln lässt man `to:` oft einfach komplett weg und gibt nur die
     Ports an (`ports: [{protocol: UDP, port: 53}, {protocol: TCP, port: 53}]`).
   - Das bedeutet: DNS-Anfragen auf Port 53 sind an **jedes** Ziel (intern wie
     extern) erlaubt.

---

### 💡 Musterlösung für Aufgabe 4.4 (`crawler-egress.yaml`)

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: crawler-egress
  namespace: secure-lab
spec:
  podSelector:
    matchLabels:
      app: crawler
  policyTypes:
    - Egress
  egress:
    # 1. DNS-Auflösung global erlauben (ohne IP-Einschränkung)
    - ports:
        - protocol: UDP
          port: 53
        - protocol: TCP
          port: 53
    # 2. Ausgehender Web-Traffic (HTTP/HTTPS) ins Internet
    - to:
        - ipBlock:
            cidr: 0.0.0.0/0
      ports:
        - protocol: TCP
          port: 80
        - protocol: TCP
          port: 443
```

---

### 📋 CKA-Prüfungs-Takeaways

- **Keine CLI-Generatoren für NetworkPolicies:** Immer Doku-Suchbegriff
  `network policies` nutzen und Manifest anpassen.
- **Default-Deny Ingress:** `podSelector: {}` + `policyTypes: [Ingress]`.
- **Egress benötigt IMMER Port 53 (UDP+TCP),** sobald Domainnamen aufgelöst
  werden sollen.
- **Nachbereitung:** Issue **#5** wurde für eine spätere gezielte
  Wiederholungseinheit angelegt.
