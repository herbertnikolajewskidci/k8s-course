# Aufgabe Q07: Gateway API & HTTPRoute Routing

- **CKA Domäne:** Services & Networking (20%)
- **Lernberg-Stufe:** Gipfel (Exam Pace & Troubleshooting)
- **Cluster & Host:** `ssh cka2560`
- **Wiederholungs-Grund:** Fehlversuch in Exam (0/7 Punkte, HTTPRoute nicht erstellt)

---

## 1. Wissensnetz & Mentales Modell (Birkenbihl)

Die **Gateway API** ist die moderne, modulare Nachfolgerin der klassischen
Ingress-Ressource:

- **GatewayClass:** Die Bauart des Tors (z. B. Envoy, Cilium, Istio) – wird
  vom Cluster-Admin bereitgestellt.
- **Gateway:** Das konkrete Eingangstor (`parentRefs`) – lauscht auf IP & Port.
- **HTTPRoute:** Der Wegweiser des Anwendungsentwicklers. Er dockt an das
  Gateway an (`spec.parentRefs: - name: app-gateway`) und legt fest:
  - Bei Host `api.example.com`
  - Pfad `/v1` → leitet weiter an Service `v1-service:80`
  - Pfad `/v2` → leitet weiter an Service `v2-service:80`
  - Header `x-client-type: mobile` → leitet bevorzugt an `v2-service:80`

**KaWa ROUTE:**

- **R**egelbasiertes Splitting
- **O**rchestrierung über ParentRefs an das Gateway
- **U**rl-Präfix-Matching (`PathPrefix`)
- **T**arget-Backend-Referenzen (`backendRefs`)
- **E**xtension der alten Ingress-Grenzen

---

## 2. Aufgabenstellung (Repetition Q07)

Host für diese Aufgabe: `ssh cka2560`.

Im Namespace `gateway-infra` existiert bereits ein aktives Gateway namens
`app-gateway`.

### Aufgabe 1: HTTPRoute traffic-splitter konfigurieren

Erstelle eine HTTPRoute namens `traffic-splitter` im Namespace
`gateway-infra`:

1. `parentRefs`: Binde die Route an das Gateway `app-gateway`.
2. `hostnames`: Beschränke den Zugriff auf `api.example.com`.
3. Regel 1 (Pfad `/v1`):
   - Leite Anfragen mit Präfix `/v1` an Service `v1-service` auf Port 80.
4. Regel 2 (Pfad `/v2`):
   - Leite Anfragen mit Präfix `/v2` an Service `v2-service` auf Port 80.
5. Regel 3 (Header-Matching):
   - Wenn der Header `x-client-type: mobile` gesetzt ist, leite den Request
     unabhängig vom Pfad an `v2-service` auf Port 80 weiter.

### Aufgabe 2: Verifikation via Curl

Teste die Weiterleitung mit `curl` gegen den Gateway-Endpunkt:

```bash
curl -H "Host: api.example.com" http://<gateway-ip>/v1
curl -H "Host: api.example.com" -H "x-client-type: mobile" http://<gateway-ip>/
```

---

## 3. Spickzettel & Doku-Hilfen

- **kubernetes.io Suchbegriff:** `gateway api httproute`
- **Zielseite & Klickpfad:**
  `https://gateway-api.sigs.k8s.io/guides/http-routing/`
  (oder k8s docs Ingress & Gateway API)
- **In-Page Suche (Strg+F):** `kind: HTTPRoute`
- **In-Terminal Fastpath:**
  - `kubectl explain httproute.spec`
  - `kubectl explain httproute.spec.rules.backendRefs`

---

## 4. Feedback & Korrekturen

Noch keine Einreichung vorhanden.
Nach deiner Bearbeitung folgt hier das direkte Review.
