# Vertiefung & Repetition: Scheduling & NetworkPolicies

Übersicht der beiden Vertiefungs-Module zur Vorbereitung auf die Gipfel-Stufe.

- **Issue:** #9
- **Branch:** `repetition-affinity-netpol`
- **Lernberg:** Hang → Gipfel

---

## Modul-Übersicht

### Block 1: Advanced Scheduling (Affinity & Anti-Affinity)

- **Datei:** `Aufgabe-1.md`
- **Lösungsdatei:** `Aufgabe-1-solution.md`
- **Fokus:**
  - `NodeAffinity`: Hard Constraint (`requiredDuringScheduling...`) vs. Soft
    Constraint (`preferredDuringScheduling...`) mit `matchExpressions`
  - `PodAffinity`: Co-Location von Services (z. B. Web-App direkt bei Cache-Pod)
  - `PodAntiAffinity`: High-Availability & Spreading (Verhindern, dass Replikate
    eines Deployments auf derselben Node landen)
  - `topologyKey`: Verständnis von `kubernetes.io/hostname` vs. Zonen
  - Schnelle YAML-Konstruktion via `kubectl explain pod.spec.affinity`

### Block 2: Complex NetworkPolicies (Egress, DNS & CIDR)

- **Datei:** `Aufgabe-2.md`
- **Lösungsdatei:** `Aufgabe-2-solution.md`
- **Fokus:**
  - Egress-Grundlagen & Default-Deny (`policyTypes: [Egress]`)
  - DNS-Freigabe: Port 53 (UDP/TCP) auf CoreDNS im Namespace `kube-system`
  - CIDR-Filterung: `ipBlock` mit `cidr` und `except`
  - Kombinationslogik: ODER-Regeln (mehrere Listen-Elemente) vs. UND-Regeln
    (Kombination aus `namespaceSelector` und `podSelector` im selben Block)
