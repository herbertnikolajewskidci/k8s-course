# CKA Exam Simulator — Scorecard & Session-Protokoll

- **Datum:** 2026-09-15
- **Branch:** `gipfel-killer-sh-drills`
- **Infrastruktur:** 6 KVM-Cluster / 7 VMs auf Unraid (`192.168.131.223`)
- **Gesamtergebnis:** **50 / 109 Punkte (45.9 %)** — *Nicht bestanden*
  (Bestehensgrenze: >= 66.0 %)
- **Aktive Drill-Flags (🎯):** Q3, Q12, Q15

---

## 1. Gesamtübersicht der 17 Prüfungsfragen

<!-- markdownlint-disable MD013 -->
| ID | Thema / Aufgabenfeld | Cluster | Max | Score | Status | 🎯 Drill? | Notizen & Befund |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| **Q1** | CoreDNS & FQDN Resolution | `cka6016` | 5 | 3 | ⚠️ PARTIAL | – | `ENDPOINT_MONITOR` via IP-Dash korrekt; `.svc` in `ENDPOINT_CORE` fehlte |
| **Q2** | Kubeconfig Contexts & Certs | `cka2560` | 4 | **4** | ✅ PASS | – | Kubeconfig-Kontexte, Current-Context & Client-Zertifikat vollständig |
| **Q3** | Multi-Container & Downward API | `cka5248` | 6 | 0 | ❌ FAIL | 🎯 **JA** | Downward API (`spec.nodeName`) und Shared-Volume nicht angelegt |
| **Q4** | ReadinessProbe & Endpoints | `cka3200` | 7 | 0 | ❌ FAIL | – | Label-Mismatch Backend/Service; Probe mit `wget` nicht konfiguriert |
| **Q5** | Kubelet PKI & OpenSSL Audit | `cka8448` | 6 | **6** | ✅ PASS | – | Client- und Server-Zertifikate in `/var/lib/kubelet/pki/` auditiert |
| **Q6** | Kubelet Service Crash Troubleshooting | `cka1024` | 7 | **7** | ✅ PASS | – | Systemd-Dropin repariert, Kubelet läuft, Node `cka1024` Ready |
| **Q7** | Gateway API & HTTPRoute Routing | `cka2560` | 7 | 0 | ❌ FAIL | – | HTTPRoute `traffic-splitter` mit Pfad- und Header-Rules nicht erstellt |
| **Q8** | NetworkPolicy Ingress Isolation | `cka8448` | 7 | 0 | ❌ FAIL | – | NetworkPolicy `backend-policy` für `secure-backend` nicht angelegt |
| **Q9** | Kustomize Overlays & HPA Scaling | `cka5248` | 7 | 0 | ❌ FAIL | – | HPA-Base/Overlay nicht ausgerollt, Legacy-ConfigMap nicht gelöscht |
| **Q10** | StorageClass WaitForFirstConsumer | `cka6016` | 6 | 0 | ❌ FAIL | – | StorageClass mit `WaitForFirstConsumer` & PVC/Job nicht gebunden |
| **Q11** | PV Recovery & Re-Binding (Retain) | `cka2560` | 6 | 0 | ❌ FAIL | – | PV aus `Released`-Zustand via `spec.claimRef` nicht befreit |
| **Q12** | Secret Creation & SubPath Mounts | `cka5248` | 6 | **6** | ✅ PASS | 🎯 **JA** | Secret erstellt, `password.txt` via `subPath` & Env-Var perfekt gemountet |
| **Q13** | RBAC Triad (SA, Role, RoleBinding) | `cka3200` | 6 | 5 | ⚠️ PARTIAL | – | Role & RoleBinding fehlerfrei; ServiceAccount `deploy-bot` fehlte |
| **Q14** | etcd Backup & etcdutl | `cka8448` | 8 | 0 | ❌ FAIL | – | Snapshot mit Zertifikaten aus `etcd.yaml` & Status mit `etcdutl` ausstehend |
| **Q15** | Node Maintenance (Drain & Uncordon) | `cka6016` | 6 | 4 | ⚠️ PARTIAL | 🎯 **JA** | Drain & Uncordon ausgeführt; Workload-Eviction litt unter Bare-Pod-Konflikt |
| **Q16** | Pending Pod Forensics (NodeSelector) | `cka3200` | 8 | **8** | ✅ PASS | – | NodeSelector `hardware-tier=accelerator` erkannt, Node gelabelt, 2/2 Running |
| **Q17** | Container Forensics with crictl | `cka6016` | 7 | **7** | ✅ PASS | – | Container-ID ermittelt, `runtimeType` & Logs via `sudo crictl` extrahiert |
<!-- markdownlint-enable MD013 -->

---

## 2. Zusammenfassende Leistungs-Statistik

- **Vollständig bestanden (PASS):** 6 von 17 Aufgaben (Q2, Q5, Q6, Q12, Q16, Q17)
  → **38 Punkte**
- **Teilweise gelöst (PARTIAL):** 3 von 17 Aufgaben (Q1, Q13, Q15)
  → **12 Punkte**
- **Nicht bearbeitet / fehlgeschlagen (FAIL):** 8 von 17 Aufgaben (Q3, Q4, Q7,
  Q8, Q9, Q10, Q11, Q14) → **0 Punkte**
- **Erreichte Gesamtpunktzahl:** **50 / 109 Punkte**

---

## 3. Drill-Vormerkungen von Herbert (🎯)

1. **Q03 (Multi-Container & Downward API):** 0 / 6 Punkte  
   *Fokus:* Shared `emptyDir`-Volume zwischen Producer & Consumer + Node-Name
   via Downward API injizieren.
2. **Q12 (Secret Creation & SubPath Mounts):** 6 / 6 Punkte  
   *Fokus:* Trotz voller Punktzahl zur Festigung des `subPath`-Mechanismus
   vorgemerkt.
3. **Q15 (Node Maintenance Safe Drain):** 4 / 6 Punkte  
   *Fokus:* Sicheres Node-Drainen mit `--ignore-daemonsets` und
   `--delete-emptydir-data` ohne `--force`.

---

## 4. Bereitgestellte Birkenbihl-Arbeitsblätter

Die gezielten Arbeitsblätter zur Nachbereitung dieser Session liegen im selben
Verzeichnis:

- [Aufgabe Q01: CoreDNS & FQDN](./Aufgabe-Q01-coredns-fqdn.md)
- [Aufgabe Q03: Multi-Container & Downward API](./Aufgabe-Q03-downward-api.md) 🎯
- [Aufgabe Q04: ReadinessProbe & Endpoints](./Aufgabe-Q04-readiness-probe.md)
- [Aufgabe Q07: Gateway API & HTTPRoute](./Aufgabe-Q07-gateway-api-httproute.md)
- [Aufgabe Q08: NetworkPolicy Ingress](./Aufgabe-Q08-networkpolicy-ingress.md)
- [Aufgabe Q09: Kustomize Overlays & HPA](./Aufgabe-Q09-kustomize-hpa.md)
- [Aufgabe Q10: StorageClass WaitConsumer](./Aufgabe-Q10-storageclass-waitforfirstconsumer.md)
- [Aufgabe Q11: PV Recovery Retain Policy](./Aufgabe-Q11-pv-recovery-retain.md)
- [Aufgabe Q12: Secret SubPath Mounts](./Aufgabe-Q12-secret-subpath.md) 🎯
- [Aufgabe Q13: RBAC Triade](./Aufgabe-Q13-rbac-sa-role-rolebinding.md)
- [Aufgabe Q14: etcd Backup & etcdutl](./Aufgabe-Q14-etcd-backup-etcdutl.md)
- [Aufgabe Q15: Node Drain](./Aufgabe-Q15-node-drain-maintenance.md) 🎯
- [Aufgabe Q16: Pending Pod Forensics](./Aufgabe-Q16-pending-pod-forensics.md)
