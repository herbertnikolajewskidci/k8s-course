# Learning Record 0003: Domain 2 — Services & Networking Mastery

- **Domain Focus:** Services & Networking (20% CKA Exam Weight)
- **Lernberg Stage:** Transitioned from Tal to Hang / Gipfel
- **Status:** Mastered
- **Branch:** `day-02-services-networking` (Domain 2)
- **Issue:** #4

---

## Mastered Concepts & Skills

### 1. Service Types, EndpointSlices & Headless Services

- Configured ClusterIP and NodePort services using imperative generators.
- Configured Headless Services (`clusterIP: None`) for StatefulSet/direct
  Pod DNS resolution.
- Validated EndpointSlices and diagnosed endpoint-to-pod label matching.

### 2. CoreDNS & Name Resolution Architecture

- Resolved cross-namespace services using FQDN format:
  `<service>.<namespace>.svc.cluster.local`.
- Analyzed CoreDNS configuration (`Corefile`), upstream forwarding, and
  stub domains.

### 3. Ingress Routing (Path- & Host-based)

- Configured Ingress resources with `networking.k8s.io/v1`.
- Built path-based routing rules (`/red`, `/blue`) with `pathType: Prefix`.
- Built host-based (Name-based Virtual Hosting) routing rules
  (`red.example.com`, `blue.example.com`).

### 4. NetworkPolicies & Pod Isolation

- Implemented Default-Deny Ingress policies (`podSelector: {}`).
- Configured granular Pod-to-Pod Ingress filtering via `podSelector`.
- Configured Namespace-wide Ingress filtering via `namespaceSelector`.
- Analyzed Egress rule mechanics and identified the critical DNS rule
  requirement (Port 53 UDP/TCP) for CoreDNS resolution (tracked in Issue #5
  for targeted repetition).

### 5. Service Troubleshooting & Speed Drills

- Diagnosed and resolved Service Selector Mismatch without pod restarts.
- Diagnosed and resolved Port vs. `targetPort` misconfigurations
  (`Connection refused`).
- Executed high-speed imperative NodePort creation and node-IP validation.

---

## Exam Simulation Drill Result

- **Score:** 95% (Mastered)
- **Troubleshooting Speed:** Immediate diagnosis of endpoint and port issues.
