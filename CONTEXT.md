# CONTEXT.md — Kubernetes Wissensnetz & Glossary

Mental models, Birkenbihl analogies, and precise Kubernetes vocabulary.

## Control Plane Architecture

- **kube-apiserver**: Der zentrale "Empfangschef" und Gatekeeper. Die
  einzige Komponente, die direkt mit `etcd` spricht. Validiert und
  konfiguriert Daten für Pods, Services, ReplicationController.
- **etcd**: Das unbestechliche "Grundbuch" / Key-Value-Store. Speichert den
  vollständigen Soll- und Ist-Zustand des Clusters.
- **kube-scheduler**: Der "Disponent" / "Zuweiser". Entscheidet anhand von
  Ressourcen, Taints/Tolerations und NodeAffinity über die Pod-Platzierung.
- **kube-controller-manager**: Der "Regelkreis-Wächter". Vergleicht
  kontinuierlich Ist-Zustand mit Soll-Zustand.
- **cloud-controller-manager**: Schnittstelle zu Cloud-Providern.

## Worker Node Architecture

- **kubelet**: Der "Vorarbeiter" auf jedem Node. Spricht mit der Container
  Runtime (via CRI) und meldet Node-/Pod-Status an den `kube-apiserver`.
- **kube-proxy**: Der "Weichensteller" / Netzwerk-Router auf dem Node. Pflegt
  IPTables/IPVS-Regeln für Services.
- **Container Runtime (CRI)**: Ausführendes Organ (z.B. `containerd`).

## Networking & Primitives

- **Pod**: Kleinste deploybare Einheit in Kubernetes.
- **Service**: Stabiler Netzwerk-Endpunkt vor dynamischen Pods.
- **NetworkPolicy**: Firewall-Regelwerk auf Pod-Ebene.
- **Gateway API / Ingress**: Traffic-Routing von außen in den Cluster.

## Storage

- **PV (PersistentVolume)**: Tatsächlicher Speicher (von Admin/CSI bereitgestellt).
- **PVC (PersistentVolumeClaim)**: "Bestellschein" eines Nutzers für Speicher.
- **StorageClass**: Automatische Bereitstellung von PVs auf Anfrage.
