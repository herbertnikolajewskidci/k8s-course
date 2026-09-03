# Aufgabe 4: Network, CoreDNS & Service Troubleshooting (Exam-Style)

- **CKA Domäne:** Troubleshooting (30%)
- **Lernberg-Stufe:** Hang → Gipfel (Reales CKA-Prüfungsformat)
- **Issue:** #8
- **Entspricht:** Block 4 aus `Aufgaben.md`

---

## 1. Wissensnetz & Mentales Modell (Birkenbihl)

### Der Paketfluss im Kubernetes-Netzwerk (Die 4 Stationen)

Wenn ein Pod einen anderen Dienst nicht erreicht, liegt der Fehler an genau
einer von 4 Stationen:

```text
[ Pod / App ] ──(1. DNS)──► [ CoreDNS ] ──(2. IP/Port)──► [ Service (CIP) ]
                                                                   │
                                                               (3. EndpointSlice)
                                                                   ▼
                                                            [ 4. Target Pod ]
```

1. **Station 1: DNS-Auflösung (`kube-dns` / CoreDNS)**
   - Symptom: `curl: (6) Could not resolve host: my-service`
   - Häufige Ursachen: CoreDNS Pods laufen nicht, falscher Name/Namespace,
     CoreDNS ConfigMap fehlerhaft, Service `kube-dns` hat falsche IP/Port.

2. **Station 2 & 3: Service-Routing & Endpoints**
   - Symptom: DNS löst auf, aber `curl` läuft in ein Timeout (`No route to host`
     oder Verbindungsabbruch).
   - Häufige Ursachen: `kubectl get ep <service>` ist leer (Selector-Mismatch
     zwischen Service und Pod-Labels) oder `targetPort` zeigt auf den falschen
     Container-Port.

3. **Station 4: Node-Netzwerk & CNI**
   - Symptom: Pods bekommen keine IPs, Pods auf unterschiedlichen Nodes können
     sich nicht anpingen, oder Kubelet meldet CNI-Fehler in den Events.
   - Häufige Ursachen: CNI-Konfigurationsdatei (`/etc/cni/net.d/`) beschädigt,
     `kube-proxy` läuft nicht oder IP-Forwarding deaktiviert.

---

## 2. Aufgabenstellung (Block 4 — Real CKA Exam Style)

---

### Aufgabe 4.1: Cluster-weiter DNS-Ausfall

Im Namespace `net-debug` wurde eine Client-Anwendung bereitgestellt, die mit
einem Backend-Service im selben Namespace kommunizieren soll.

Der Client-Pod meldet DNS-Auflösungsfehler (`nslookup` und `curl` auf
Servicenamen schlagen fehl).

**Ziel:**

1. Finde die Ursache für den DNS-Ausfall im Cluster.
2. Behebe das Problem.
3. Stelle sicher, dass der Client-Pod `dns-client` den Service
   `backend-service.net-debug.svc.cluster.local` erfolgreich per DNS auflösen
   und per HTTP ansprechen kann.

---

### Aufgabe 4.2: Service ohne funktionierende Endpunkte (Selector/Port Mismatch)

Im Namespace `net-debug` ist ein Web-Service namens `app-service` konfiguriert,
der HTTP-Traffic auf Port 80 an ein Deployment weiterleiten soll.

Anfragen an den Service (`curl app-service.net-debug`) laufen ins Leere /
Timeout.

**Ziel:**

1. Analysiere den Service `app-service` und die zugehörigen Pods.
2. Identifiziere und behebe die Fehlkonfiguration.
3. Verifiziere, dass Anfragen an die Service-IP bzw. den Hostnamen
   `app-service.net-debug` zuverlässig beantwortet werden (`HTTP 200`).

---

### Aufgabe 4.3: Node-Netzwerk / CNI Plugin Ausfall

Auf einem der Worker-Nodes können neu geschedulte Pods nicht mehr initialisiert
werden und verharren im Zustand `ContainerCreating` mit Netzwerkfehlern in den
Events.

**Ziel:**

1. Identifiziere den betroffenen Worker-Node und die Ursache des
   Netzwerk-Ausfalls.
2. Stelle die Netzwerk-Konnektivität der Node wieder her.
3. Stelle sicher, dass neu erstellte Pods auf dieser Node eine gültige Pod-IP
   erhalten und den Status `Running` erreichen.

---

## 3. Lösungen

Deine Befehle, Notizen und Analysen führst du in der separaten Datei:
`labs/05-troubleshooting/Aufgabe-4-solution.md`.

---

## 4. Spickzettel & Doku-Hilfen (Optional / Bei Bedarf)

Falls du während der Bearbeitung nachschlagen möchtest:

- **kubernetes.io Keywords:** `troubleshoot dns`, `debug service`,
  `network plugins`
- **In-Terminal Syntax:**
  - `kubectl get ep <service>` / `kubectl get endpointslices`
  - `kubectl get pods -n kube-system -l k8s-app=kube-dns`
  - `kubectl logs -n kube-system -l k8s-app=kube-dns`
  - `kubectl describe svc kube-dns -n kube-system`
  - CNI-Pfade auf Nodes: `/etc/cni/net.d/`, `/opt/cni/bin/`

---

## 5. Feedback & Korrekturen

### Status-Überblick

- **Aufgabe 4.1:** Gelöst (CoreDNS Service Selector Mismatch behoben)
- **Aufgabe 4.2:** Gelöst (Service Selector Mismatch identifiziert und korrigiert)
- **Aufgabe 4.3:** Gelöst (CNI Conflist wiederhergestellt, Node wieder Ready)

---

### Detaillierte Analyse der einzelnen Aufgaben

#### Zu Aufgabe 4.1 (CoreDNS Service Selector)

- **Diagnoseweg:** `kubectl describe svc kube-dns -n kube-system` zeigte
  den fehlerhaften Selector `k8s-app=kube-dns-invalid`.
- **Korrektur:** Service editiert und auf `k8s-app=kube-dns` gesetzt. Die
  Endpoints wurden sofort mit den CoreDNS-Pod-IPs verknüpft. DNS-Auflösung
  im Namespace `net-debug` funktionierte unmittelbar danach wieder.
- **Exam-Takeaway:** Wenn CoreDNS-Pods laufen, aber kein Pod im Cluster
  DNS-Namen auflösen kann, liegt das Problem fast immer am Service
  `kube-dns` im Namespace `kube-system` (falscher Selector, falsche Ports
  oder fehlende Endpoints).

#### Zu Aufgabe 4.2 (Service Selector Mismatch)

- **Diagnoseweg:** `kubectl describe svc app-service` zeigte leere Endpoints
  (`Endpoints: <none>`). Pod-Labels via `kubectl get pods -l app=web-app`
  geprüft und den Tippfehler `app=webapp` im Service identifiziert.
- **Korrektur:** Service-Selector auf `app=web-app` korrigiert. Endpoints
  wurden sofort generiert und HTTP 200 via `curl` bestätigt.
- **Exam-Takeaway:** `curl (7) Failed to connect` bei funktionierender
  DNS-Auflösung bedeutet: Der Service-Name löst auf die ClusterIP auf, aber
  der Service hat keine funktionierenden Endpunkte. Erster Befehl ist immer
  `kubectl get ep <service>` bzw. `kubectl describe svc <service>`.

#### Zu Aufgabe 4.3 (CNI Plugin Ausfall)

- **Diagnoseweg:** `kubectl get nodes` zeigte `cka-cluster-worker2` im Status
  `NotReady`. Auf der Node das Verzeichnis `/etc/cni/net.d/` geprüft.
- **Korrektur:** Datei `10-kindnet.conflist.disabled` wieder in
  `10-kindnet.conflist` umbenannt und Kubelet neu gestartet.
- **Verifikation:** Node ging auf `Ready`. Der neu erstellte Test-Pod
  `cni-verify` erhielt sofort die Pod-IP `10.244.1.101` und ging in den
  Status `1/1 Running` über.
- **Exam-Takeaway:** Wenn eine Node `NotReady` meldet und `kubectl describe
  node` den Grund `NetworkPluginNotReady` / `cni plugin not initialized`
  angibt, liegt die Ursache direkt im Verzeichnis `/etc/cni/net.d/` (fehlende
  oder falsch benannte Konfigurationsdatei) oder in `/opt/cni/bin/` (fehlende
  CNI-Binaries).
