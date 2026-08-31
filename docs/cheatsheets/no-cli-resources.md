# CKA-Spickzettel: Ressourcen ohne kubectl-Generator

Für die folgenden Kubernetes-Ressourcen gibt es **keinen** direkten imperativen
CLI-Generator (`kubectl create ...`).

Wenn eine dieser Ressourcen in einer Übung oder Prüfungsaufgabe verlangt wird:
**Keine Zeit mit CLI-Versuchen verlieren → Sofort Doku-Suchbegriff eingeben!**

---

## 1. Networking & Sicherheit

| Ressource | Doku-Suchbegriff (`kubernetes.io/docs`) |
| :--- | :--- |
| **NetworkPolicy** | `network policies` |
| **CertificateSigningRequest (CSR)** | `certificatesigningrequest` |

---

## 2. Storage & Volumes

| Ressource | Doku-Suchbegriff (`kubernetes.io/docs`) |
| :--- | :--- |
| **PersistentVolume (PV)** | `persistent volumes` |
| **PersistentVolumeClaim (PVC)** | `persistent volume claims` |
| **StorageClass** | `storage classes` |

---

## 3. Workloads & Pod-Policies

| Ressource | Doku-Suchbegriff (`kubernetes.io/docs`) |
| :--- | :--- |
| **DaemonSet** | `daemonset` *(oder `kubectl create deploy` anpassen)* |
| **StatefulSet** | `statefulset` |
| **LimitRange** | `limit range` *(Hinweis: Quota geht via CLI!)* |

---

## 4. Cluster-Architektur & Troubleshooting

| Thema / Aufgabe | Doku-Suchbegriff (`kubernetes.io/docs`) |
| :--- | :--- |
| **etcd Snapshot Backup & Restore** | `etcd snapshot` |
| **kubeadm Upgrade** | `kubeadm upgrade` |
| **Kubelet Konfiguration** | `kubelet configuration` |

---

## 5. Schnelle Orientierungshilfe (Mentaler Filter)

- **Hat CLI-Generator (`kubectl create` / `kubectl run`):**
  Pod (`run`), Deployment, Service, ConfigMap, Secret, Job, CronJob, Ingress,
  ServiceAccount, Role, ClusterRole, RoleBinding, ClusterRoleBinding, Quota,
  PodDisruptionBudget, PriorityClass.
- **Muss direkt aus der Doku kopiert werden:**
  **NetworkPolicy, PV, PVC, StorageClass, LimitRange, DaemonSet, StatefulSet,
  CSR.**
