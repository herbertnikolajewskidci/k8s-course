# Aufgabe Q08: NetworkPolicy Ingress Isolation

- **CKA Domäne:** Services & Networking (20%)
- **Lernberg-Stufe:** Gipfel (Exam Pace & Troubleshooting)
- **Cluster & Host:** `ssh cka8448`
- **Wiederholungs-Grund:** Fehlversuch in Exam (0/7 Punkte, Backend ungeschützt)

---

## 1. Wissensnetz & Mentales Modell (Birkenbihl)

Kubernetes-Netzwerke sind ab Werk ein **offener Marktplatz**:
Jeder Pod darf mit jedem anderen Pod über alle Namespaces hinweg ungehindert
sprechen.
Sobald du jedoch eine `NetworkPolicy` erstellst, die einen Pod über
`podSelector` auswählt, schlägt das Sicherheitsgitter zu:

- **Default Deny für ausgewählte Pods:** Alle Ingress-Verbindungen zu
  diesem Pod sind ab sofort blockiert, **außer** denjenigen, die explizit
  in der `ingress`-Liste aufgeführt sind!
- **Kombinierte Filter (ODER vs. UND):**
  - Getrennte Bindestriche (`- namespaceSelector: ...` und `- podSelector: ...`)
    bedeuten **ODER** (Traffic aus dem Namespace ODER von Pods mit Label).
  - Ein Block ohne neuen Bindestrich unter `from:` bedeutet **UND** (Pods
    mit diesem Label NUR DANN, wenn sie sich in diesem Namespace befinden).

**KaWa ISOLATION:**

- **I**ngress-Regeln definieren eingehenden Traffic
- **S**elektor bestimmt die Ziel-Pods (`podSelector`)
- **O**ffenheit wird standardmäßig geschlossen
- **L**abel-Matching auf Pod- und Namespace-Ebene
- **A**bsicherung sensibler Datenbank-Tiers
- **T**CP-Port-Einschränkung (`ports: - port: ...`)
- **I**nter-Namespace-Schutz
- **O**hne CNI mit Policy-Support (z. B. Calico/Cilium) wirkungslos
- **N**ull-Trust-Prinzip

---

## 2. Aufgabenstellung (Repetition Q08)

Host für diese Aufgabe: `ssh cka8448`.

Im Namespace `secure-zone` läuft der sensible Service `secure-backend` auf
Port 80. Dieser muss gegen unberechtigten Zugriff isoliert werden.

### Aufgabe 1: NetworkPolicy backend-policy erstellen

Erstelle eine NetworkPolicy namens `backend-policy` im Namespace
`secure-zone`:

1. `podSelector`: Wähle die Backend-Pods mit dem Label `role: backend`.
2. `policyTypes`: Setze explizit `[Ingress]`.
3. Erlaube Ingress auf TCP Port 80 **nur** von Pods mit dem Label
   `role: frontend` aus demselben Namespace `secure-zone`.
4. Schließe jeglichen Traffic aus anderen Namespaces (z. B. `external-zone`)
   aus.

### Aufgabe 2: Zugriffskontrolle verifizieren

1. Teste den erlaubten Zugriff aus dem Frontend-Pod:

   ```bash
   kubectl exec -n secure-zone allowed-client -- curl -s -m 2 http://secure-backend:80
   ```

   Muss sofort eine Antwort liefern (HTTP 200 / Nginx-HTML).
2. Teste die Blockade aus der externen Zone:

   ```bash
   kubectl exec -n external-zone blocked-client -- curl -s -m 2 http://secure-backend.secure-zone:80
   ```

   Muss nach 2 Sekunden im Timeout scheitern (Exit-Code != 0).

---

## 3. Spickzettel & Doku-Hilfen

- **kubernetes.io Suchbegriff:** `network policies`
- **Zielseite & Klickpfad:** `Concepts -> Services, Networking -> Network Policies`
- **In-Page Suche (Strg+F):** `kind: NetworkPolicy` oder `podSelector`
- **In-Terminal Fastpath:**
  - `kubectl explain networkpolicy.spec.ingress.from`

---

## 4. Feedback & Korrekturen

Noch keine Einreichung vorhanden.
Nach deiner Bearbeitung folgt hier das direkte Review.
