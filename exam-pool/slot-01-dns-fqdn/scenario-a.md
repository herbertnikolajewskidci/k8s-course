# Slot 01: CoreDNS & Fully Qualified Domain Names (FQDN)

- **CKA Domäne:** Services & Networking (20%)
- **Schwierigkeitsgrad:** Gipfel (Killer.sh Sim B Q1 Parität)
- **Start-Host:** `ssh cka6016` (bzw. `ssh cka-runner`)

---

## 1. Wissensnetz & Mentales Modell (Birkenbihl)

### Die 4 DNS-Namensmuster in Kubernetes

In Kubernetes hängt der DNS-Name fundamental vom **Objekttyp** und vom
**Namespace** ab:

```text
1. Standard Service:
   <service-name>.<namespace>.svc.cluster.local

2. Headless Service (clusterIP: None):
   <service-name>.<namespace>.svc.cluster.local

3. Pod in einem StatefulSet / Headless Service:
   <pod-name>.<service-name>.<namespace>.svc.cluster.local (stabile Identität)

4. Einzelner Pod über seine IP:
   <a-b-c-d>.<namespace>.pod.cluster.local (Bindestriche und .pod!)
```

---

## 2. Doku- & Suchpfade (kubernetes.io/docs)

- **Docs-Suchfeld:** `DNS for Services and Pods`
- **Zielseite:** *Concepts → Services, Load Balancing, and Networking → DNS for
  Services and Pods*
- **URL:** `https://kubernetes.io/docs/concepts/services-networking/dns-pod-service/`
- **Im Browser (`Strg+F`):**
  - `A/AAAA records` → Zeigt die exakte FQDN-Struktur für Services.
  - `Pod's hostname and subdomain` → Zeigt
    `<hostname>.<subdomain>.<namespace>.svc.cluster.local`.
  - `Pods` (Abschnitt *DNS records for Pods*) → Zeigt
    `cod-ip-address.my-namespace.pod.cluster-domain.example`.
- **In-Terminal Fastpath:**

  ```bash
  kubectl get svc -A
  kubectl get endpoints -n <ns>
  ```

---

## 3. Aufgabenstellung

**Host:** `ssh cka6016`

Im Namespace `core-routing` kommuniziert das Deployment `service-router` mit
mehreren internen Cluster-Endpunkten über vollqualifizierte Domain-Namen
(FQDN).

Das Deployment nutzt eine ConfigMap namens `router-endpoints`, um diese
Zieladressen zu laden. Aktuell sind dort fehlerhafte Kurznamen und falsche
Formate hinterlegt, sodass die DNS-Auflösung in den Pod-Logs fehlschlägt.

### Aufgaben-Anforderungen

1. Verbinde dich per SSH auf den Ziel-Host:

   ```bash
   ssh cka6016
   ```

2. Inspiziere die ConfigMap `router-endpoints` im Namespace `core-routing`.
3. Aktualisiere die ConfigMap mit den korrekten FQDN-Werten:
   - `ENDPOINT_CORE`: Der Kubernetes-API-Service `kubernetes` im Namespace
     `default`.
   - `ENDPOINT_STORAGE`: Der Headless Service `storage-vault` im Namespace
     `storage-tier`.
   - `ENDPOINT_PRIMARY_POD`: Der Pod `vault-0` hinter dem Headless Service
     im Namespace `storage-tier` (IP-unabhängig!).
   - `ENDPOINT_MONITOR`: Der Pod `monitor-agent` im Namespace `monitoring`
     (anhand seiner aktuellen Pod-IP im FQDN-Dash-Format).
4. Starte das Deployment `service-router` im Namespace `core-routing` neu
   (`rollout restart`).
5. Überprüfe die Logs eines der neu gestarteten Pods und stelle sicher, dass
   alle 4 Endpunkte erfolgreich aufgelöst werden (kein `FAILED_*` in der
   Ausgabe).

---

## 4. Offizielle Musterlösung

```bash
# 1. Pod-IP des Monitor-Pods ermitteln
kubectl get pod monitor-agent -n monitoring -o wide
# IP z. B.: 10.244.0.5 -> FQDN: 10-244-0-5.monitoring.pod.cluster.local

# 2. ConfigMap editieren
kubectl edit configmap router-endpoints -n core-routing
```

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: router-endpoints
  namespace: core-routing
data:
  ENDPOINT_CORE: kubernetes.default.svc.cluster.local
  ENDPOINT_STORAGE: storage-vault.storage-tier.svc.cluster.local
  ENDPOINT_PRIMARY_POD: vault-0.storage-vault.storage-tier.svc.cluster.local
  ENDPOINT_MONITOR: 10-244-0-5.monitoring.pod.cluster.local
```

```bash
# 3. Rollout Neustart
kubectl rollout restart deployment service-router -n core-routing
kubectl rollout status deployment service-router -n core-routing

# 4. Logs verifizieren
kubectl logs -l app=service-router -n core-routing --tail=20
```
