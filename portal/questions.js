// CKA Official Simulation Exam - Authentic 17 Question Pool (V1)
// 1:1 Parity to Killer.sh Subtasks, Multi-Layering, and PSI Exam Ergonomics.
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

      <p>The deployment relies on a ConfigMap named <code>router-endpoints</code> to resolve target addresses. Currently, entries are misconfigured or incomplete, preventing the application from running properly.</p>

      <h4>Task Requirements:</h4>
      <ul>
        <li>SSH into the assigned host: <code>ssh cka6016</code>.</li>
        <li>Inspect the ConfigMap <code>router-endpoints</code> in namespace <code>core-routing</code>.</li>
        <li>Update the ConfigMap with the correct FQDN values:
          <ul>
            <li><code>ENDPOINT_CORE</code>: The service <code>kubernetes</code> in namespace <code>default</code>.</li>
            <li><code>ENDPOINT_STORAGE</code>: The headless service <code>storage-vault</code> in namespace <code>storage-tier</code>.</li>
            <li><code>ENDPOINT_PRIMARY_POD</code>: The Pod named <code>vault-0</code> backing the headless service in namespace <code>storage-tier</code> (IP-independent).</li>
            <li><code>ENDPOINT_MONITOR</code>: The Pod <code>monitor-agent</code> in namespace <code>monitoring</code> (using its actual pod IP in FQDN-dash format).</li>
          </ul>
        </li>
        <li>Restart the deployment <code>service-router</code> in namespace <code>core-routing</code> (<code>kubectl rollout restart</code>).</li>
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
        <li>Extract the raw client certificate data for user <code>account-0042</code>, decode the base64 content, and write the decoded string directly into <code>/course/2/cert</code>.</li>
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
        <li>Inject the node name hosting the Pod into the <code>producer</code> container as an environment variable named <code>HOST_NODE</code> using the Kubernetes <strong>Downward API</strong> (<code>spec.nodeName</code>).</li>
        <li>Ensure both containers start cleanly and logs of the <code>consumer</code> container show active events.</li>
      </ul>

      <h4>Verification:</h4>
      <pre><code>kubectl logs collector -n project-tiger -c consumer</code></pre>
    `
  },
  {
    id: 4,
    weight: 7,
    title: "Cross-Pod HTTP ReadinessProbe with wget",
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

      <p>In namespace <code>project-alpha</code>, an existing backend service <code>backend-service</code> is running. Deploy a monitoring client Pod named <code>probe-checker</code> in the same namespace.</p>

      <h4>Task Requirements:</h4>
      <ul>
        <li>Create Pod <code>probe-checker</code> in namespace <code>project-alpha</code> using image <code>busybox:latest</code>.</li>
        <li>The container command should keep the pod running: <code>sh -c "sleep 3600"</code>.</li>
        <li>Configure an <code>exec</code> based <code>readinessProbe</code> that verifies HTTP availability of the backend service:
          <ul>
            <li>Command: <code>sh -c "wget -qO- http://backend-service:80"</code>.</li>
            <li><code>initialDelaySeconds</code>: <code>5</code>.</li>
            <li><code>periodSeconds</code>: <code>5</code>.</li>
          </ul>
        </li>
        <li>Ensure the Pod becomes <code>1/1 Ready</code> once the backend responds successfully.</li>
      </ul>

      <h4>Verification:</h4>
      <pre><code>kubectl get pod probe-checker -n project-alpha</code></pre>
    `
  },
  {
    id: 5,
    weight: 4,
    title: "Kubelet PKI & OpenSSL Certificate Expiration Inspection",
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
        <code>ssh cka5248</code>
      </div>

      <p>Security compliance requires auditing the active client certificate utilized by the local Kubelet service.</p>

      <h4>Task Requirements:</h4>
      <ul>
        <li>Inspect the active Kubelet client certificate located under <code>/var/lib/kubelet/pki/</code>.</li>
        <li>Determine which file is the active client certificate (follow symlinks if present).</li>
        <li>Using <code>openssl x509</code>:
          <ul>
            <li>Write the certificate <strong>Issuer</strong> into <code>/course/5/issuer.txt</code>.</li>
            <li>Write the certificate <strong>Not After</strong> (expiration date) into <code>/course/5/expiration.txt</code>.</li>
            <li>Write the <strong>Subject</strong> Common Name (CN) into <code>/course/5/subject.txt</code>.</li>
          </ul>
        </li>
      </ul>

      <h4>Verification:</h4>
      <pre><code>cat /course/5/issuer.txt && cat /course/5/expiration.txt && cat /course/5/subject.txt</code></pre>
    `
  },
  {
    id: 6,
    weight: 7,
    title: "Kubelet Systemd Drop-In Unit & Service Crash Troubleshooting",
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

      <p>A recent operational update corrupted the Kubelet service configuration on this worker node, causing Kubelet to enter a failure loop (status 203/EXEC) and leaving the node in <code>NotReady</code> state on the cluster.</p>

      <h4>Task Requirements:</h4>
      <ul>
        <li>SSH into the affected node: <code>ssh cka1024</code>.</li>
        <li>Investigate Kubelet service failures using <code>systemctl status kubelet</code> and <code>journalctl -u kubelet</code>.</li>
        <li>Inspect drop-in configuration units under <code>/usr/lib/systemd/system/kubelet.service.d/</code>.</li>
        <li>Resolve the misconfiguration (fix the broken binary path in <code>10-kubeadm.conf</code>).</li>
        <li>Reload systemd unit definitions (<code>sudo systemctl daemon-reload</code>) and restart Kubelet (<code>sudo systemctl restart kubelet</code>).</li>
        <li>Verify that Kubelet returns to <code>active (running)</code> state via <code>systemctl is-active kubelet</code>.</li>
        <li>Exit back to the student shell (<code>exit</code>) and verify from the main environment that the node transitions back to <code>Ready</code>.</li>
      </ul>

      <h4>Verification (on the node, then on student-node):</h4>
      <pre><code>systemctl is-active kubelet # on cka1024, then exit and run: kubectl get nodes</code></pre>
    `
  },
  {
    id: 7,
    weight: 6,
    title: "Gateway API & HTTPRoute Host- and Path-Based Routing",
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

      <p>In namespace <code>gateway-infra</code>, services <code>web-v1-svc</code> and <code>web-v2-svc</code> are running. Configure an <code>HTTPRoute</code> named <code>traffic-splitter</code>.</p>

      <h4>Task Requirements:</h4>
      <ul>
        <li>Create an <code>HTTPRoute</code> named <code>traffic-splitter</code> in namespace <code>gateway-infra</code>.</li>
        <li>Attach the route to the existing Gateway named <code>app-gateway</code> in the same namespace.</li>
        <li>Configure host matching for <code>api.example.com</code>:
          <ul>
            <li>Path prefix <code>/v1</code> must forward to service <code>web-v1-svc</code> on port <code>8080</code>.</li>
            <li>Path prefix <code>/v2</code> must forward to service <code>web-v2-svc</code> on port <code>8080</code>.</li>
          </ul>
        </li>
        <li>Verify the manifest syntax with <code>kubectl apply --dry-run=client</code> before committing.</li>
      </ul>

      <h4>Verification:</h4>
      <pre><code>kubectl get httproute traffic-splitter -n gateway-infra -o yaml</code></pre>
    `
  },
  {
    id: 8,
    weight: 7,
    title: "NetworkPolicy Ingress & Egress Isolation (Default Deny & Granular Allow)",
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
            <li>Allow ingress TCP traffic on port <code>80</code> <strong>only</strong> from Pods labeled <code>role=frontend</code> within the same namespace.</li>
            <li>Explicitly deny traffic originating from namespace <code>external-zone</code>.</li>
          </ul>
        </li>
        <li>Test connectivity:
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
    weight: 5,
    title: "Manual Pod Scheduling & Static Node Assignment (Bypass Scheduler)",
    host: "ssh cka3200",
    docs: [
      {
        title: "Assign Pods to Nodes manually",
        url: "https://kubernetes.io/docs/concepts/scheduling-eviction/assign-pod-node/#nodename"
      }
    ],
    body: `
      <p>Connect to the designated environment before starting the task:</p>
      <div class="context-box">
        <span class="context-label">Host:</span>
        <code>ssh cka3200</code>
      </div>

      <p>During a maintenance drill, the default scheduler may be non-operational. Deploy a Pod named <code>emergency-web</code> in namespace <code>manual-schedule</code>.</p>

      <h4>Task Requirements:</h4>
      <ul>
        <li>Create Pod <code>emergency-web</code> in namespace <code>manual-schedule</code> with image <code>nginx:1-alpine</code>.</li>
        <li>Bypass the Kubernetes scheduler entirely by manually binding the Pod directly to node <code>cka-exam-runner</code> using the <code>spec.nodeName</code> field.</li>
        <li>Verify that the Pod transitions immediately to <code>Running</code> without receiving events from <code>default-scheduler</code>.</li>
      </ul>

      <h4>Verification:</h4>
      <pre><code>kubectl get pod emergency-web -n manual-schedule -o wide</code></pre>
    `
  },
  {
    id: 10,
    weight: 5,
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
            <li>Provisioner: <code>rancher.io/local-path</code> (or standard cluster default).</li>
            <li><code>volumeBindingMode</code>: <code>WaitForFirstConsumer</code>.</li>
            <li><code>reclaimPolicy</code>: <code>Delete</code>.</li>
          </ul>
        </li>
        <li>Create a PersistentVolumeClaim named <code>job-pvc</code> in namespace <code>project-bern</code> requesting <code>100Mi</code> using StorageClass <code>delayed-storage</code>.</li>
        <li>Verify that the PVC remains in <code>Pending</code> state until a consumer Pod is created.</li>
      </ul>

      <h4>Verification:</h4>
      <pre><code>kubectl get sc delayed-storage && kubectl get pvc job-pvc -n project-bern</code></pre>
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

      <p>In namespace <code>storage-recovery</code>, a database volume <code>pv-retained-data</code> has its reclaim policy set to <code>Retain</code>. The original PVC was accidentally deleted, leaving the PV in <code>Released</code> state with data intact.</p>

      <h4>Task Requirements:</h4>
      <ul>
        <li>Inspect <code>pv-retained-data</code> and observe its <code>Released</code> status.</li>
        <li>Make the PersistentVolume available again for binding by removing its stale <code>claimRef</code> binding.</li>
        <li>Create a new PersistentVolumeClaim named <code>recovered-pvc</code> in namespace <code>storage-recovery</code> requesting <code>500Mi</code> with accessMode <code>ReadWriteOnce</code> and storageClassName <code>manual</code>.</li>
        <li>Ensure the PVC transitions to <code>Bound</code> status against the existing <code>pv-retained-data</code> volume without losing existing disk data.</li>
      </ul>

      <h4>Verification:</h4>
      <pre><code>kubectl get pv pv-retained-data && kubectl get pvc recovered-pvc -n storage-recovery</code></pre>
    `
  },
  {
    id: 12,
    weight: 5,
    title: "Secret Creation, Decryption & Volume SubPath Mounts",
    host: "ssh cka2560",
    docs: [
      {
        title: "Managing Secrets using kubectl",
        url: "https://kubernetes.io/docs/tasks/configmap-secret/managing-secret-using-kubectl/"
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
            <li>Mount key <code>DB_PASS</code> as an individual file at <code>/etc/secrets/password.txt</code> using <code>volumeMounts.subPath</code> so that existing directory files are not overwritten.</li>
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
        <li>Create a snapshot using <code>etcdctl snapshot save</code> or <code>etcdutl</code> to destination <code>/course/14/backup/etcd-snapshot.db</code>.</li>
        <li>Verify the snapshot status and save the formatted status output into <code>/course/14/backup/status.txt</code>.</li>
        <li>Simulate a restore command into alternate data directory <code>/var/lib/etcd-restore/</code> using <code>etcdutl snapshot restore</code>.</li>
      </ul>

      <h4>Verification:</h4>
      <pre><code>ETCDCTL_API=3 etcdctl snapshot status /course/14/backup/etcd-snapshot.db --write-out=table</code></pre>
    `
  },
  {
    id: 15,
    weight: 5,
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

      <p>Prepare the designated worker node for scheduled OS kernel patching.</p>

      <h4>Task Requirements:</h4>
      <ul>
        <li>Safely drain node <code>cka-exam-runner</code> while ignoring DaemonSets and forcing eviction of Pods with local storage (<code>--ignore-daemonsets --delete-emptydir-data --force</code>).</li>
        <li>Verify that the node status reports <code>SchedulingDisabled</code>.</li>
        <li>Once maintenance is complete, mark the node active and schedulable again using <code>kubectl uncordon</code>.</li>
        <li>Confirm the node transitions back to <code>Ready</code> without scheduling restrictions.</li>
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
        <li>Inspect the events of the pending Pods: <code>kubectl describe pod -n wp-forensics | tail -n 15</code>.</li>
        <li>Do <strong>NOT</strong> modify resource requests or container limits in the deployment!</li>
        <li>Identify whether the scheduling failure is caused by <code>Pod's node affinity/selector</code>, <code>PersistentVolume's node affinity</code>, or untolerated taints.</li>
        <li>Resolve the root cause at the cluster node level so that all replicas start and transition to <code>Running</code>.</li>
      </ul>

      <h4>Verification:</h4>
      <pre><code>kubectl get pods -n wp-forensics -o wide</code></pre>
    `
  },
  {
    id: 17,
    weight: 4,
    title: "PriorityClass Creation & Workload Preemption Verification",
    host: "ssh cka8448",
    docs: [
      {
        title: "Pod Priority and Preemption",
        url: "https://kubernetes.io/docs/concepts/scheduling-eviction/pod-priority-preemption/"
      }
    ],
    body: `
      <p>Connect to the designated environment before starting the task:</p>
      <div class="context-box">
        <span class="context-label">Host:</span>
        <code>ssh cka8448</code>
      </div>

      <p>Establish workload priority policies in namespace <code>priority-zone</code>.</p>

      <h4>Task Requirements:</h4>
      <ul>
        <li>Create a non-preempting PriorityClass named <code>batch-priority</code> with value <code>500000</code> and <code>preemptionPolicy: Never</code>.</li>
        <li>Create a high-priority PriorityClass named <code>critical-workload</code> with value <code>1000000</code> and <code>preemptionPolicy: PreemptLowerPriority</code>.</li>
        <li>Create a Pod named <code>critical-app</code> in namespace <code>priority-zone</code> with image <code>nginx:1-alpine</code> referencing <code>priorityClassName: critical-workload</code>.</li>
        <li>Verify the assigned priority value on the scheduled Pod.</li>
      </ul>

      <h4>Verification:</h4>
      <pre><code>kubectl get pod critical-app -n priority-zone -o jsonpath='{.spec.priority}'</code></pre>
    `
  }
];
