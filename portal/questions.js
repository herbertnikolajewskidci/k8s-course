// CKA Official Simulation Exam - Authentic 17 Question Pool (V2)
// Full Killer.sh Parity, Zero Spoilers, Real Multi-Layering, and PSI Exam Ergonomics.
// All tasks use explicit SSH host instructions, Click-to-Copy, and live verified docs.

window.QUESTIONS = [
  {
    id: 1,
    weight: 5,
    title: "CoreDNS & FQDN Resolution for Headless Services & Pods",
    host: "ssh cka6016",
    docs: [
      {
        title: "DNS for Services and Pods",
        url: "https://kubernetes.io/docs/concepts/services-networking/dns-pod-service/"
      },
      {
        title: "A/AAAA Records & Pod DNS",
        url: "https://kubernetes.io/docs/concepts/services-networking/dns-pod-service/#pods"
      }
    ],
    body: `
      <p>Connect to the designated environment before starting the task:</p>
      <div class="context-box">
        <span class="context-label">Host:</span>
        <code>ssh cka6016</code>
      </div>

      <p>In namespace <code>core-routing</code>, the deployment <code>service-router</code> acts as an internal gateway communicating with multiple cluster endpoints using strictly qualified Domain Name (FQDN) values.</p>

      <p>The deployment relies on a ConfigMap named <code>router-endpoints</code> to resolve target addresses. Currently, entries are misconfigured or incomplete, preventing the application from communicating with dependent services.</p>

      <h4>Task Requirements:</h4>
      <ul>
        <li>SSH into the assigned host: <code>ssh cka6016</code>.</li>
        <li>Inspect the ConfigMap <code>router-endpoints</code> in namespace <code>core-routing</code>.</li>
        <li>Update the ConfigMap with the correct FQDN values:
          <ul>
            <li><code>ENDPOINT_CORE</code>: The service <code>kubernetes</code> in namespace <code>default</code>.</li>
            <li><code>ENDPOINT_STORAGE</code>: The headless service <code>storage-vault</code> in namespace <code>storage-tier</code>.</li>
            <li><code>ENDPOINT_PRIMARY_POD</code>: The Pod named <code>vault-0</code> backing the headless service in namespace <code>storage-tier</code> (IP-independent).</li>
            <li><code>ENDPOINT_MONITOR</code>: The Pod <code>monitor-agent</code> in namespace <code>monitoring</code> (resolve its active Pod IP via DNS).</li>
          </ul>
        </li>
        <li>Ensure the deployment <code>service-router</code> picks up the configuration changes.</li>
        <li>Verify that all replicas transition to <code>Running</code> and their logs confirm successful resolution of all 4 endpoints.</li>
      </ul>

      <h4>Verification:</h4>
      <pre><code>kubectl logs -l app=service-router -n core-routing --tail=20</code></pre>
    `
  },
  {
    id: 2,
    weight: 4,
    title: "Kubeconfig Extraction, Contexts & Client Certificates",
    host: "ssh cka9412",
    docs: [
      {
        title: "Organizing Cluster Access Using kubeconfig",
        url: "https://kubernetes.io/docs/concepts/configuration/organize-cluster-access-kubeconfig/"
      }
    ],
    body: `
      <p>Connect to the designated environment before starting the task:</p>
      <div class="context-box">
        <span class="context-label">Host:</span>
        <code>ssh cka9412</code>
      </div>

      <p>A cluster audit requires extracting specific credentials and cluster definitions from an archived configuration file located at <code>/course/2/kubeconfig</code>.</p>

      <h4>Task Requirements:</h4>
      <ul>
        <li>SSH into the assigned host: <code>ssh cka9412</code>.</li>
        <li>Extract the names of all contexts defined in <code>/course/2/kubeconfig</code> and save them into <code>/course/2/contexts</code> (one context name per line).</li>
        <li>Extract the name of the current active context into <code>/course/2/current-context</code>.</li>
        <li>Extract the raw client certificate data for user <code>account-0042</code>, decode the base64 content, and write the decoded certificate string into <code>/course/2/cert</code>.</li>
      </ul>

      <h4>Verification:</h4>
      <pre><code>cat /course/2/contexts && cat /course/2/current-context && head -n 5 /course/2/cert</code></pre>
    `
  },
  {
    id: 3,
    weight: 6,
    title: "Multi-Container Pod, Downward API & Shared Volumes",
    host: "ssh cka5248",
    docs: [
      {
        title: "Pods with Multiple Containers",
        url: "https://kubernetes.io/docs/concepts/workloads/pods/#how-pods-manage-multiple-containers"
      },
      {
        title: "Expose Pod Information via Downward API",
        url: "https://kubernetes.io/docs/tasks/inject-data-application/downward-api-volume-expose-pod-information/"
      }
    ],
    body: `
      <p>Connect to the designated environment before starting the task:</p>
      <div class="context-box">
        <span class="context-label">Host:</span>
        <code>ssh cka5248</code>
      </div>

      <p>Deploy a multi-tier telemetry Pod named <code>collector</code> in namespace <code>project-tiger</code>.</p>

      <h4>Task Requirements:</h4>
      <ul>
        <li>The Pod must contain two containers sharing an <code>emptyDir</code> volume mounted at <code>/var/log/app</code>:
          <ul>
            <li>Container 1: Named <code>producer</code>, using image <code>busybox:latest</code>. It must continuously append the current timestamp and node name into <code>/var/log/app/events.log</code> every 5 seconds.</li>
            <li>Container 2: Named <code>consumer</code>, using image <code>busybox:latest</code>. It must stream output from <code>/var/log/app/events.log</code> using <code>tail -f</code>.</li>
          </ul>
        </li>
        <li>Inject the name of the node on which the Pod is scheduled into the <code>producer</code> container as an environment variable named <code>HOST_NODE</code> using the Kubernetes <strong>Downward API</strong>.</li>
        <li>Ensure both containers start cleanly and logs of the <code>consumer</code> container show active events.</li>
      </ul>

      <h4>Verification:</h4>
      <pre><code>kubectl logs collector -n project-tiger -c consumer</code></pre>
    `
  },
  {
    id: 4,
    weight: 7,
    title: "Cross-Pod HTTP ReadinessProbe & Service Endpoint Resolution",
    host: "ssh cka3200",
    docs: [
      {
        title: "Configure Liveness, Readiness and Startup Probes",
        url: "https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/"
      }
    ],
    body: `
      <p>Connect to the designated environment before starting the task:</p>
      <div class="context-box">
        <span class="context-label">Host:</span>
        <code>ssh cka3200</code>
      </div>

      <p>In namespace <code>project-alpha</code>, a ClusterIP Service named <code>backend-service</code> is configured on port <code>80</code>, but currently has no active endpoints.</p>

      <h4>Task Requirements:</h4>
      <ul>
        <li>Create a monitoring Pod named <code>probe-checker</code> in namespace <code>project-alpha</code> using image <code>busybox:latest</code> running an idle process (e.g. <code>sleep 3600</code>).</li>
        <li>Configure an <code>exec</code> based <code>readinessProbe</code> on <code>probe-checker</code> that periodically tests HTTP reachability of <code>backend-service</code> on port 80 using <code>wget</code>.</li>
        <li>Confirm that <code>probe-checker</code> initially stays in status <code>0/1 Ready</code> (Not Ready) because the backend service is not yet answering.</li>
        <li>Create a backend Pod named <code>backend-pod</code> in namespace <code>project-alpha</code> with image <code>nginx:1-alpine</code>. Ensure it has the matching labels required by <code>backend-service</code> so traffic is routed to it.</li>
        <li>Verify that <code>backend-service</code> gains an endpoint and <code>probe-checker</code> automatically transitions to <code>1/1 Ready</code>.</li>
      </ul>

      <h4>Verification:</h4>
      <pre><code>kubectl get pods -n project-alpha && kubectl describe svc backend-service -n project-alpha</code></pre>
    `
  },
  {
    id: 5,
    weight: 6,
    title: "Kubelet PKI & OpenSSL Certificate Audit",
    host: "ssh cka5248",
    docs: [
      {
        title: "Certificates and PKI Architecture",
        url: "https://kubernetes.io/docs/setup/best-practices/certificates/"
      }
    ],
    body: `
      <p>Connect to the designated environment before starting the task:</p>
      <div class="context-box">
        <span class="context-label">Host:</span>
        <code>ssh cka5248</code> (Worker: <code>ssh cka5248-node1</code>)
      </div>

      <p>Security compliance requires auditing active Kubelet certificates on worker node <code>cka5248-node1</code> located under <code>/var/lib/kubelet/pki/</code>.</p>

      <h4>Task Requirements:</h4>
      <ul>
        <li>SSH into the worker node: <code>ssh cka5248-node1</code>.</li>
        <li>Inspect the active certificate files in <code>/var/lib/kubelet/pki/</code>.</li>
        <li>Identify:
          <ul>
            <li>The active Kubelet <strong>Client Certificate</strong> (used for outgoing connections to kube-apiserver).</li>
            <li>The active Kubelet <strong>Server Certificate</strong> (used for incoming serving requests).</li>
          </ul>
        </li>
        <li>Using <code>openssl x509</code>, extract the <strong>Issuer</strong> and <strong>Extended Key Usage</strong> for both certificates.</li>
        <li>Save the structured findings into <code>/course/5/certificate-info.txt</code> on the control-plane host.</li>
      </ul>

      <h4>Verification:</h4>
      <pre><code>cat /course/5/certificate-info.txt</code></pre>
    `
  },
  {
    id: 6,
    weight: 7,
    title: "Kubelet Service Crash & Node Troubleshooting",
    host: "ssh cka1024",
    docs: [
      {
        title: "Troubleshooting Kubelet and Nodes",
        url: "https://kubernetes.io/docs/tasks/administer-cluster/kubelet-cgroup-driver/"
      }
    ],
    body: `
      <p>Connect to the designated environment before starting the task:</p>
      <div class="context-box">
        <span class="context-label">Host:</span>
        <code>ssh cka1024</code>
      </div>

      <p>Worker node <code>cka1024</code> is reporting status <code>NotReady</code> in the cluster because its Kubelet service fails to run.</p>

      <h4>Task Requirements:</h4>
      <ul>
        <li>SSH into the affected node: <code>ssh cka1024</code>.</li>
        <li>Investigate why the Kubelet service fails to start.</li>
        <li>Resolve the underlying configuration failure and ensure Kubelet is active and running.</li>
        <li>Ensure system configuration changes persist across service restarts.</li>
        <li>Exit back to the student environment and verify from the control-plane that node <code>cka1024</code> returns to <code>Ready</code>.</li>
      </ul>

      <h4>Verification:</h4>
      <pre><code>systemctl is-active kubelet # on node, then exit and run: kubectl get nodes</code></pre>
    `
  },
  {
    id: 7,
    weight: 7,
    title: "Gateway API & HTTPRoute Host, Path & Header Routing",
    host: "ssh cka7968",
    docs: [
      {
        title: "Gateway API Specification",
        url: "https://gateway-api.sigs.k8s.io/"
      },
      {
        title: "HTTPRoute Resource Reference",
        url: "https://gateway-api.sigs.k8s.io/api-types/httproute/"
      }
    ],
    body: `
      <p>Connect to the designated environment before starting the task:</p>
      <div class="context-box">
        <span class="context-label">Host:</span>
        <code>ssh cka7968</code>
      </div>

      <p>In namespace <code>gateway-infra</code>, services <code>web-v1-svc</code> and <code>web-v2-svc</code> are running on port <code>8080</code>. Gateway <code>app-gateway</code> is deployed.</p>

      <h4>Task Requirements:</h4>
      <ul>
        <li>Create an <code>HTTPRoute</code> named <code>traffic-splitter</code> in namespace <code>gateway-infra</code>.</li>
        <li>Attach the route to the existing Gateway named <code>app-gateway</code> in namespace <code>gateway-infra</code>.</li>
        <li>Configure host matching for hostname <code>api.example.com</code>:
          <ul>
            <li>Path prefix <code>/v1</code> must forward to service <code>web-v1-svc</code> on port <code>8080</code>.</li>
            <li>Path prefix <code>/v2</code> must forward to service <code>web-v2-svc</code> on port <code>8080</code>.</li>
            <li>Path prefix <code>/mobile</code> with request header <code>User-Agent: mobile</code> (Exact match) must forward to service <code>web-v2-svc</code> on port <code>8080</code>.</li>
            <li>Path prefix <code>/mobile</code> without that header (fallback) must forward to service <code>web-v1-svc</code> on port <code>8080</code>.</li>
          </ul>
        </li>
        <li>Verify that the manifest applies without errors.</li>
      </ul>

      <h4>Verification:</h4>
      <pre><code>kubectl get httproute traffic-splitter -n gateway-infra -o yaml</code></pre>
    `
  },
  {
    id: 8,
    weight: 7,
    title: "NetworkPolicy Ingress Isolation (Default Deny & Granular Allow)",
    host: "ssh cka2560",
    docs: [
      {
        title: "Network Policies",
        url: "https://kubernetes.io/docs/concepts/services-networking/network-policies/"
      }
    ],
    body: `
      <p>Connect to the designated environment before starting the task:</p>
      <div class="context-box">
        <span class="context-label">Host:</span>
        <code>ssh cka2560</code>
      </div>

      <p>Secure the backend workloads in namespace <code>secure-zone</code> using Kubernetes NetworkPolicies.</p>

      <h4>Task Requirements:</h4>
      <ul>
        <li>Create a NetworkPolicy named <code>backend-policy</code> in namespace <code>secure-zone</code> protecting pods labeled <code>role=backend</code>:
          <ul>
            <li>Deny all ingress traffic by default.</li>
            <li>Allow ingress TCP traffic on port <code>80</code> <strong>only</strong> from Pods labeled <code>role=frontend</code> within the same namespace (<code>secure-zone</code>).</li>
            <li>Ensure all other incoming traffic (including traffic originating from namespace <code>external-zone</code>) is blocked.</li>
          </ul>
        </li>
        <li>Test and confirm network connectivity:
          <ul>
            <li><code>kubectl exec -n secure-zone allowed-client -- curl -s -m 2 http://secure-backend:80</code> (Must succeed).</li>
            <li><code>kubectl exec -n external-zone blocked-client -- curl -s -m 2 http://secure-backend.secure-zone:80</code> (Must time out / fail).</li>
          </ul>
        </li>
      </ul>

      <h4>Verification:</h4>
      <pre><code>kubectl get netpol -n secure-zone backend-policy</code></pre>
    `
  },
  {
    id: 9,
    weight: 7,
    title: "Kustomize Deployment with Overlays & HorizontalPodAutoscaler",
    host: "ssh cka5774",
    docs: [
      {
        title: "Declarative Management with Kustomize",
        url: "https://kubernetes.io/docs/tasks/manage-kubernetes-objects/kustomization/"
      },
      {
        title: "Horizontal Pod Autoscaling",
        url: "https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/"
      }
    ],
    body: `
      <p>Connect to the designated environment before starting the task:</p>
      <div class="context-box">
        <span class="context-label">Host:</span>
        <code>ssh cka5774</code>
      </div>

      <p>In directory <code>/course/9/api-service/</code>, an application is managed using Kustomize with <code>base</code>, <code>staging</code>, and <code>prod</code> overlays.</p>

      <h4>Task Requirements:</h4>
      <ul>
        <li>In <code>/course/9/api-service/base/</code>, configure a HorizontalPodAutoscaler named <code>api-hpa</code> targeting Deployment <code>api-service</code>:
          <ul>
            <li>Minimum replicas: <code>2</code>, Maximum replicas: <code>4</code>.</li>
            <li>Target average CPU utilization: <code>50%</code>.</li>
            <li>Register the HPA manifest in <code>base/kustomization.yaml</code>.</li>
          </ul>
        </li>
        <li>In <code>/course/9/api-service/prod/</code>, add a patch for <code>api-hpa</code> that increases <code>maxReplicas</code> to <code>6</code>. Ensure the patch is included in <code>prod/kustomization.yaml</code>.</li>
        <li>Deploy the <code>staging</code> overlay into namespace <code>staging-zone</code> using <code>kubectl apply -k</code>.</li>
        <li>Deploy the <code>prod</code> overlay into namespace <code>prod-zone</code> using <code>kubectl apply -k</code>.</li>
        <li>Manually delete the legacy ConfigMap <code>legacy-scaling-config</code> in both namespaces (<code>staging-zone</code> and <code>prod-zone</code>) if present.</li>
      </ul>

      <h4>Verification:</h4>
      <pre><code>kubectl get hpa -n staging-zone && kubectl get hpa -n prod-zone</code></pre>
    `
  },
  {
    id: 10,
    weight: 6,
    title: "StorageClass Dynamic Provisioning with WaitForFirstConsumer",
    host: "ssh cka8448",
    docs: [
      {
        title: "Storage Classes",
        url: "https://kubernetes.io/docs/concepts/storage/storage-classes/"
      }
    ],
    body: `
      <p>Connect to the designated environment before starting the task:</p>
      <div class="context-box">
        <span class="context-label">Host:</span>
        <code>ssh cka8448</code>
      </div>

      <p>Configure dynamic volume provisioning for batch jobs in namespace <code>project-bern</code>.</p>

      <h4>Task Requirements:</h4>
      <ul>
        <li>Create a StorageClass named <code>delayed-storage</code>:
          <ul>
            <li>Provisioner: <code>rancher.io/local-path</code>.</li>
            <li><code>volumeBindingMode</code>: <code>WaitForFirstConsumer</code>.</li>
            <li><code>reclaimPolicy</code>: <code>Delete</code>.</li>
          </ul>
        </li>
        <li>Create a PersistentVolumeClaim named <code>job-pvc</code> in namespace <code>project-bern</code> requesting <code>100Mi</code> using StorageClass <code>delayed-storage</code>.</li>
        <li>Confirm that <code>job-pvc</code> remains in status <code>Pending</code>.</li>
        <li>Update the Job manifest at <code>/course/10/data-job.yaml</code> to mount PVC <code>job-pvc</code> at <code>/mnt/job-data</code> and apply the Job.</li>
        <li>Verify that the volume is dynamically provisioned, the claim transitions to <code>Bound</code>, and the Job executes successfully.</li>
      </ul>

      <h4>Verification:</h4>
      <pre><code>kubectl get sc delayed-storage && kubectl get pvc job-pvc -n project-bern && kubectl get job data-job -n project-bern</code></pre>
    `
  },
  {
    id: 11,
    weight: 6,
    title: "PersistentVolume Recovery & Re-Binding with Retain Policy",
    host: "ssh cka6016",
    docs: [
      {
        title: "Reclaiming Persistent Volumes",
        url: "https://kubernetes.io/docs/concepts/storage/persistent-volumes/#reclaiming"
      }
    ],
    body: `
      <p>Connect to the designated environment before starting the task:</p>
      <div class="context-box">
        <span class="context-label">Host:</span>
        <code>ssh cka6016</code>
      </div>

      <p>In namespace <code>storage-recovery</code>, a database volume <code>pv-retained-data</code> has its reclaim policy set to <code>Retain</code>. The original PVC was deleted, leaving the PV in <code>Released</code> state with critical data intact.</p>

      <h4>Task Requirements:</h4>
      <ul>
        <li>Inspect <code>pv-retained-data</code> and observe its <code>Released</code> status.</li>
        <li>Make the PersistentVolume available again so that a new claim can bind to it.</li>
        <li>Create a new PersistentVolumeClaim named <code>recovered-pvc</code> in namespace <code>storage-recovery</code> requesting <code>500Mi</code> with accessMode <code>ReadWriteOnce</code> and storageClassName <code>manual</code>.</li>
        <li>Ensure the PVC transitions to <code>Bound</code> status against the existing <code>pv-retained-data</code> volume without losing existing disk data.</li>
      </ul>

      <h4>Verification:</h4>
      <pre><code>kubectl get pv pv-retained-data && kubectl get pvc recovered-pvc -n storage-recovery</code></pre>
    `
  },
  {
    id: 12,
    weight: 6,
    title: "Secret Creation, Decryption & Volume SubPath Mounts",
    host: "ssh cka2560",
    docs: [
      {
        title: "Managing Secrets using kubectl",
        url: "https://kubernetes.io/docs/tasks/configmap-secret/managing-secret-using-kubectl/"
      },
      {
        title: "Using Secrets as Files from a Pod",
        url: "https://kubernetes.io/docs/concepts/configuration/secret/#using-secrets-as-files-from-a-pod"
      }
    ],
    body: `
      <p>Connect to the designated environment before starting the task:</p>
      <div class="context-box">
        <span class="context-label">Host:</span>
        <code>ssh cka2560</code>
      </div>

      <p>Provision credentials securely for web workloads in namespace <code>secret-mgmt</code>.</p>

      <h4>Task Requirements:</h4>
      <ul>
        <li>Create a generic Secret named <code>db-credentials</code> in namespace <code>secret-mgmt</code> with keys:
          <ul>
            <li><code>DB_USER</code>: <code>app_admin</code></li>
            <li><code>DB_PASS</code>: <code>SuperSecret789!</code></li>
          </ul>
        </li>
        <li>Create a Pod named <code>db-client</code> in namespace <code>secret-mgmt</code> with image <code>nginx:1-alpine</code>:
          <ul>
            <li>Mount key <code>DB_PASS</code> directly as an individual file at <code>/etc/secrets/password.txt</code> without overwriting or hiding any pre-existing files in <code>/etc/secrets/</code>.</li>
            <li>Expose key <code>DB_USER</code> as an environment variable named <code>DATABASE_USER</code>.</li>
          </ul>
        </li>
      </ul>

      <h4>Verification:</h4>
      <pre><code>kubectl exec db-client -n secret-mgmt -- cat /etc/secrets/password.txt</code></pre>
    `
  },
  {
    id: 13,
    weight: 6,
    title: "RBAC Security: ServiceAccount, Role & RoleBinding Triad",
    host: "ssh cka7968",
    docs: [
      {
        title: "Using RBAC Authorization",
        url: "https://kubernetes.io/docs/reference/access-authn-authz/rbac/"
      }
    ],
    body: `
      <p>Connect to the designated environment before starting the task:</p>
      <div class="context-box">
        <span class="context-label">Host:</span>
        <code>ssh cka7968</code>
      </div>

      <p>Grant targeted deployment management permissions in namespace <code>dev-rbac</code>.</p>

      <h4>Task Requirements:</h4>
      <ul>
        <li>Create a ServiceAccount named <code>deploy-bot</code> in namespace <code>dev-rbac</code>.</li>
        <li>Create a Role named <code>deployment-manager</code> in namespace <code>dev-rbac</code> granting permissions to <code>get</code>, <code>list</code>, <code>create</code>, <code>update</code>, and <code>patch</code> on <code>deployments</code> in API group <code>apps</code>.</li>
        <li>Bind the ServiceAccount <code>deploy-bot</code> to Role <code>deployment-manager</code> using a RoleBinding named <code>deploy-bot-binding</code>.</li>
        <li>Verify authorization using <code>kubectl auth can-i</code>:
          <ul>
            <li><code>kubectl auth can-i create deployments --as=system:serviceaccount:dev-rbac:deploy-bot -n dev-rbac</code> (Must return <code>yes</code>).</li>
            <li><code>kubectl auth can-i delete deployments --as=system:serviceaccount:dev-rbac:deploy-bot -n dev-rbac</code> (Must return <code>no</code>).</li>
          </ul>
        </li>
      </ul>

      <h4>Verification:</h4>
      <pre><code>kubectl auth can-i list deployments --as=system:serviceaccount:dev-rbac:deploy-bot -n dev-rbac</code></pre>
    `
  },
  {
    id: 14,
    weight: 8,
    title: "etcd Backup & Snapshot Verification with etcdutl",
    host: "ssh cka3200",
    docs: [
      {
        title: "Operating etcd clusters for Kubernetes",
        url: "https://kubernetes.io/docs/tasks/administer-cluster/configure-upgrade-etcd/"
      }
    ],
    body: `
      <p>Connect to the designated environment before starting the task:</p>
      <div class="context-box">
        <span class="context-label">Host:</span>
        <code>ssh cka3200</code>
      </div>

      <p>Create a point-in-time snapshot backup of the cluster's internal etcd datastore.</p>

      <h4>Task Requirements:</h4>
      <ul>
        <li>SSH into control-plane node: <code>ssh cka3200</code>.</li>
        <li>Inspect <code>/etc/kubernetes/manifests/etcd.yaml</code> to identify TLS client credentials and endpoint configuration.</li>
        <li>Create a snapshot using <code>etcdctl snapshot save</code> to destination <code>/course/14/backup/etcd-snapshot.db</code>.</li>
        <li>Verify the snapshot status and save the formatted status output into <code>/course/14/backup/status.txt</code>.</li>
        <li>Simulate a restore command into alternate data directory <code>/var/lib/etcd-restore/</code> using <code>etcdutl snapshot restore</code>.</li>
      </ul>

      <h4>Verification:</h4>
      <pre><code>ETCDCTL_API=3 etcdctl snapshot status /course/14/backup/etcd-snapshot.db --write-out=table</code></pre>
    `
  },
  {
    id: 15,
    weight: 6,
    title: "Node Maintenance: Safe Drain, Cordon & Workload Eviction",
    host: "ssh cka9412",
    docs: [
      {
        title: "Safely Drain a Node",
        url: "https://kubernetes.io/docs/tasks/administer-cluster/safely-drain-node/"
      }
    ],
    body: `
      <p>Connect to the designated environment before starting the task:</p>
      <div class="context-box">
        <span class="context-label">Host:</span>
        <code>ssh cka9412</code>
      </div>

      <p>Prepare worker node <code>cka-worker1</code> for scheduled operating system kernel patching.</p>

      <h4>Task Requirements:</h4>
      <ul>
        <li>Safely drain node <code>cka-worker1</code> so all workloads are evicted onto remaining nodes.</li>
        <li>Ensure DaemonSet-managed pods do not block the operation and local pod data is handled appropriately.</li>
        <li>Verify that the node status reports <code>SchedulingDisabled</code>.</li>
        <li>Once maintenance is complete, mark the node schedulable again.</li>
        <li>Confirm the node returns to <code>Ready</code> state without scheduling restrictions.</li>
      </ul>

      <h4>Verification:</h4>
      <pre><code>kubectl get nodes</code></pre>
    `
  },
  {
    id: 16,
    weight: 8,
    title: "Pending Pod Forensics: NodeSelector, Taints & Constraints Analysis",
    host: "ssh cka5248",
    docs: [
      {
        title: "Assigning Pods to Nodes",
        url: "https://kubernetes.io/docs/concepts/scheduling-eviction/assign-pod-node/"
      },
      {
        title: "Taints and Tolerations",
        url: "https://kubernetes.io/docs/concepts/scheduling-eviction/taint-and-toleration/"
      }
    ],
    body: `
      <p>Connect to the designated environment before starting the task:</p>
      <div class="context-box">
        <span class="context-label">Host:</span>
        <code>ssh cka5248</code>
      </div>

      <p>In namespace <code>wp-forensics</code>, deployment <code>analytics-pipeline</code> has replicas stuck in <code>Pending</code> state.</p>

      <h4>Task Requirements:</h4>
      <ul>
        <li>Investigate the scheduling constraints and event conditions of the pending Pods.</li>
        <li>Do <strong>NOT</strong> modify resource requests or container limits in the deployment manifest!</li>
        <li>Determine whether the scheduling failure is caused by node selectors, taints, or volume node affinities.</li>
        <li>Resolve the root cause at the cluster node level so that all replicas start and transition to <code>Running</code>.</li>
      </ul>

      <h4>Verification:</h4>
      <pre><code>kubectl get pods -n wp-forensics -o wide</code></pre>
    `
  },
  {
    id: 17,
    weight: 7,
    title: "Low-Level Container Forensics & Runtime Inspection with crictl",
    host: "ssh cka2556",
    docs: [
      {
        title: "Debugging Kubernetes nodes with crictl",
        url: "https://kubernetes.io/docs/tasks/debug/debug-cluster/crictl/"
      }
    ],
    body: `
      <p>Connect to the designated environment before starting the task:</p>
      <div class="context-box">
        <span class="context-label">Host:</span>
        <code>ssh cka2556</code> (Worker: <code>ssh cka2556-node1</code>)
      </div>

      <p>In namespace <code>project-tiger</code>, Pod <code>tiger-telemetry</code> is running on a cluster node.</p>

      <h4>Task Requirements:</h4>
      <ul>
        <li>Identify which node is currently hosting Pod <code>tiger-telemetry</code>.</li>
        <li>SSH into that node (e.g. <code>ssh cka2556-node1</code>).</li>
        <li>Using the container runtime CLI <code>crictl</code>:
          <ul>
            <li>Find the container ID of the application container.</li>
            <li>Inspect the container and write its <code>runtimeType</code> (from <code>crictl inspect</code>) into <code>/course/17/runtime-type.txt</code> on the control-plane host.</li>
            <li>Extract the container's logs using <code>crictl logs</code> and save them into <code>/course/17/container.log</code> on the control-plane host.</li>
          </ul>
        </li>
      </ul>

      <h4>Verification:</h4>
      <pre><code>cat /course/17/runtime-type.txt && head -n 10 /course/17/container.log</code></pre>
    `
  }
];
