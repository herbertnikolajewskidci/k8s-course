# Aufgabe Q01: CoreDNS & FQDN Resolution (Headless & Pods)

- **CKA Domäne:** Services & Networking (20%)
- **Lernberg-Stufe:** Gipfel (Exam Pace & Troubleshooting)
- **Cluster & Host:** `ssh cka6016`
- **Wiederholungs-Grund:** Fehlversuch in Exam (2/5 Punkte, FQDN-Mismatches)

---

## 1. Wissensnetz & Mentales Modell (Birkenbihl)

Stell dir das Kubernetes-DNS wie ein hierarchisches Postleitzahlensystem vor:

- Ein normaler Service ist die **Zentralstelle** eines Bezirks:
  `<service>.<namespace>.svc.cluster.local`.
- Ein StatefulSet oder Headless Service vergibt **Hausnummern**:
  `<pod-name>.<service>.<namespace>.svc.cluster.local`.
- Direkte Pod-Adressierung (ohne Headless Service) verlangt das
  **IP-Dash-Format**:
  `<ip-mit-bindestrichen>.<namespace>.pod.cluster.local` (Beachte: `.pod.`,
  nicht `.svc.`!).
- Der Standarddienst der Kubernetes API ist immer
  `kubernetes.default.svc.cluster.local` (nicht `.cluster.local` direkt ohne
  `.svc`).

**KaWa FQDN:**

- **F**ertige Adresse (vollständig qualifiziert vom Host bis zur TLD)
- **Q**uerverbindung über Namespaces hinweg
- **D**ash-Format statt Punkte für direkte Pod-IPs
- **N**amensraum-Präzision (`<svc>.<ns>.svc.cluster.local`)

---

## 2. Aufgabenstellung (Repetition Q01)

Host für diese Aufgabe: `ssh cka6016`.

In Namespace `core-routing` scheitert der Service-Router Deployment
an unvollständigen oder fehlerhaften DNS-Einträgen in der ConfigMap
`router-endpoints`.

### Aufgabe 1: DNS-Endpunkte korrigieren

Passe die ConfigMap `router-endpoints` in Namespace `core-routing` an:

1. `ENDPOINT_CORE`: Soll die offizielle Kubernetes API über ihren
   vollständigen FQDN referenzieren (`kubernetes.default.svc.cluster.local`).
2. `ENDPOINT_STORAGE`: Soll auf den Headless Service `storage-vault` im
   Namespace `storage-tier` zeigen.
3. `ENDPOINT_PRIMARY_POD`: Soll auf den spezifischen ersten Pod
   `vault-0` dieses Headless Service zeigen.
4. `ENDPOINT_MONITOR`: Ermittle die IP des Pods `monitor-agent` im
   Namespace `monitoring` und trage sie im standardisierten
   Kubernetes-Pod-DNS-Format ein (`<ip-mit-bindestrichen>.monitoring.pod...`).

### Aufgabe 2: Router neu starten & verifizieren

1. Führe einen Rollout-Restart des Deployments `service-router` in
   `core-routing` durch.
2. Prüfe die Logs der Router-Pods, bis keine `FAIL:`-Einträge mehr
   auftreten und alle 4 Endpunkte mit `OK:` bestätigt werden.

---

## 3. Spickzettel & Doku-Hilfen

- **kubernetes.io Suchbegriff:** `dns pod service`
- **Zielseite & Klickpfad:**
  `Concepts -> Services, Networking -> DNS for Services and Pods`
- **In-Page Suche (Strg+F):** `pod-template-hash` oder `pod.cluster.local`
- **In-Terminal Fastpath:**
  - `kubectl get pod monitor-agent -n monitoring -o jsonpath='{.status.podIP}'`
  - `echo $POD_IP | tr '.' '-'`

---

## 4. Feedback & Korrekturen

Noch keine Einreichung vorhanden.
Nach deiner Bearbeitung folgt hier das direkte Review.
