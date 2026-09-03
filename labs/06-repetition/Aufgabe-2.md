# Aufgabe 2: Complex NetworkPolicies (Egress, DNS Port 53 & CIDR)

- **CKA Domäne:** Services & Networking (20%)
- **Lernberg-Stufe:** Hang → Gipfel
- **Issue:** #9
- **Entspricht:** Block 2 aus `Aufgaben.md`

---

## 1. Wissensnetz & Mentales Modell (Birkenbihl)

### Das mentale Bild: Die Festung mit Ausreisesperre (Egress Lockdown)

Während Ingress regelt, wer in die Festung rein darf, regelt Egress, wohin
die Festungsbewohner (Pods) funken dürfen:

1. **Default-Deny beim ersten Egress-Eintrag:**
   - Sobald eine NetworkPolicy `policyTypes: [Egress]` für einen Pod definiert,
     wird **jede ausgehende Verbindung sofort gekappt**, bis eine explizite
     Regel sie erlaubt.

2. **Die DNS-Falle (Port 53 UDP/TCP):**
   - Ein Pod tippt: `curl http://backend-service`.
   - Der Pod muss **vor** dem HTTP-Verbindungsaufbau den Hostnamen auflösen!
   - Er sendet DNS-Pakete an den Cluster-DNS (`10.96.0.10:53`).
   - Wenn Egress gesperrt ist und Port 53 fehlt, stirbt der Befehl sofort an
     `Could not resolve host` (Exit Code 6).
   - **Prüfungs-Reflex:** Jede restriktive Egress-Policy benötigt zwingend
     eine Freigabe für **Port 53 auf UDP und TCP**.

3. **Der Syntax-Knackpunkt: ODER vs. UND:**

```yaml
# ODER (Zwei separate Listenelemente mit Bindestrich "-"):
# Erlaubt zu JEDEM Pod in env=prod ODER zu JEDEM Pod mit role=db im eigenen NS
- to:
    - namespaceSelector:
        matchLabels:
          env: prod
    - podSelector:
        matchLabels:
          role: db

# UND (Ein einziges Listenelement OHNE zweiten Bindestrich):
# Erlaubt NUR zu Pods mit role=db, die ZUGLEICH im Namespace env=prod liegen
- to:
    - namespaceSelector:
        matchLabels:
          env: prod
      podSelector:
        matchLabels:
          role: db
```

---

## 2. Aufgabenstellung (Block 2)

Namespace für diesen Block: `netpol-lab`.

Erstelle zu Beginn den Namespace:

```bash
kubectl create namespace netpol-lab
```

---

### Aufgabe 2.1: Egress Default-Deny & Isolation

Erzeuge zunächst den Client-Pod im Namespace `netpol-lab`:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: client-app
  namespace: netpol-lab
  labels:
    app: client
spec:
  containers:
    - name: curl
      image: curlimages/curl
      command: ["sleep", "3600"]
```

Führe anschließend folgende Schritte aus:

1. Starte einen internen Backend-Service im selben Namespace:
   `kubectl run internal-db --image=nginx:alpine -n netpol-lab --labels=app=db`
   `kubectl expose pod internal-db -n netpol-lab --port=80`
2. Erstelle eine NetworkPolicy namens `default-deny-egress` im Namespace
   `netpol-lab`, die für alle Pods mit dem Label `app=client` sämtlichen
   ausgehenden Datenverkehr verbietet (`policyTypes: [Egress]`, leere
   Egress-Liste).
3. Teste mit `kubectl exec client-app -n netpol-lab -- curl -m 3 http://internal-db`.
   Verifiziere, dass der Befehl mit einem DNS-Auflösungsfehler (`Could not
resolve host`) abbricht.

---

### Aufgabe 2.2: Gezielte DNS-Freigabe (Port 53 UDP/TCP)

1. Passe die NetworkPolicy `default-deny-egress` an (oder ersetze sie durch
   `client-egress-policy`), sodass der Pod `client-app` DNS-Anfragen stellen
   darf.
2. Die Regel muss Egress zu allen Zielen auf Port **53 (UDP und TCP)**
   gestatten.
3. Teste erneut mit `kubectl exec client-app -n netpol-lab -- nslookup internal-db`.
   Verifiziere: Der Name `internal-db` wird nun erfolgreich zu einer IP
   aufgelöst!
4. Teste `kubectl exec client-app -n netpol-lab -- curl -m 3 http://internal-db`.
   Warum schlägt `curl` nun mit einem Timeout (`Operation timed out`) statt
   mit `Could not resolve host` fehl?

---

### Aufgabe 2.3: Kombinierte Freigabe (Interne DB + CIDR-Filter)

Erweitere die NetworkPolicy für `app=client` um folgende zwei zusätzliche
Egress-Regeln:

1. **Interne Datenbank:**
   - Erlaube ausgehenden HTTP-Traffic auf Port 80 zu Pods im Namespace
     `netpol-lab`, die das Label `app=db` tragen.
2. **Externer Web-Traffic via CIDR:**
   - Erlaube ausgehenden HTTPS-Traffic auf Port 443 ins öffentliche Internet
     mittels `ipBlock: cidr: 0.0.0.0/0`.
   - Schließe dabei private interne IP-Bereiche (`10.0.0.0/8` und
     `192.168.0.0/16`) über die `except`-Klausel aus.
3. **Verifikation:**
   - `kubectl exec client-app -n netpol-lab -- curl -I http://internal-db`
     muss `HTTP 200 OK` liefern.
   - `kubectl exec client-app -n netpol-lab -- curl -I https://kubernetes.io`
     muss den HTTP-Header zurückgeben.

---

## 3. Lösungen

Deine Befehle, Manifeste und Auswertungen führst du in der separaten Datei:
`labs/06-repetition/Aufgabe-2-solution.md`.

---

## 4. Spickzettel & Doku-Hilfen (Optional / Bei Bedarf)

Falls du während der Bearbeitung nachschlagen möchtest:

- **kubernetes.io Keywords:** `network policies`, `egress`, `ipBlock`
- **In-Terminal Syntax:**
  - `kubectl explain networkpolicy.spec.egress`
  - `kubectl explain networkpolicy.spec.egress.to.ipBlock`
  - `kubectl explain networkpolicy.spec.egress.ports`

---

## 5. Feedback & Korrekturen

### Status-Überblick

- **Aufgabe 2.1:** Gelöst (Default-Deny Egress Policy isoliert Pod)
- **Aufgabe 2.2:** Gelöst (DNS-Port 53 Freigabe ohne `to:`-Block verstanden)
- **Aufgabe 2.3:** Gelöst (Kombinierte Policy mit interner DB & externem CIDR)

---

### Live-Cluster Analyse & Verifikation

- **Cluster-Zustand:**
  - NetworkPolicy `client-egress-policy` im Namespace `netpol-lab` aktiv.
- **Verifizierte Verbindungen aus `client-app`:**
  1. DNS-Auflösung via CoreDNS: `internal-db` löst auf `10.96.238.38` auf.
  2. Interne DB: `curl -I http://internal-db` → `HTTP/1.1 200 OK`.
  3. Externes Internet: `curl -I https://kubernetes.io` → `HTTP/2 200`.
  4. Blockierter Traffic: `curl -I http://10.96.0.1:443` → Timeout (geblockt).

---

### Exam-Takeaways & Lernpunkte

1. **DNS-Regel:**
   - Ports ohne `to:`-Feld bedeuten: Gültig für alle Ziele (intern und extern).
   - DNS (Port 53 UDP/TCP) niemals in denselben `to:`-Block mit IP- oder
     Pod-Filtern packen.
2. **ODER vs. UND:**
   - Mehrere Listeneinträge (`- ports: ...`, `- ports: ...`) sind ODER-Regeln.
   - Mehrere Bedingungen innerhalb eines Eintrags sind UND-Bedingungen.
3. **`ipBlock`:**
   - Nur für externen IP-Traffic (Internet, On-Premises).
   - Niemals für ClusterIPs oder Pod-IPs verwenden.
