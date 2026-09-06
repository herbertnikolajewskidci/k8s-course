// CKA Dummy Questions 1-17
// Realistic exam tasks covering all 5 CKA domains with authentic weights, contexts, code snippets,
// and official documentation recommendation links.

window.QUESTIONS = [
  {
    id: 1,
    weight: 4,
    title: "Pod Scheduling with NodeAffinity",
    context: "kubectl config use-context k8s",
    nodeSsh: null,
    docs: [
      {
        title: "Assigning Pods to Nodes",
        url: "https://kubernetes.io/docs/concepts/scheduling-eviction/assign-pod-node/"
      },
      {
        title: "Node Affinity Syntax",
        url: "https://kubernetes.io/docs/concepts/scheduling-eviction/assign-pod-node/#node-affinity"
      }
    ],
    body: `
      <p>Set the current context before starting the task:</p>
      <div class="context-box">
        <span class="context-label">Context:</span>
        <code>kubectl config use-context k8s</code>
      </div>

      <p>A deployment team requires a new Pod scheduled strictly on nodes labeled for frontend workloads.</p>

      <h4>Task Requirements:</h4>
      <ul>
        <li>Create a Pod named <code>frontend-app</code> in namespace <code>production</code>.</li>
        <li>Use container image <code>nginx:alpine</code> with container name <code>app</code>.</li>
        <li>Configure a <code>nodeAffinity</code> rule using <code>requiredDuringSchedulingIgnoredDuringExecution</code> that schedules the Pod only onto nodes possessing the label <code>workload=frontend</code>.</li>
        <li>Verify that the Pod successfully schedules and transitions to the <code>Running</code> state.</li>
      </ul>

      <h4>Verification:</h4>
      <pre><code>kubectl get pod frontend-app -n production -o wide</code></pre>
    `
  },
  {
    id: 2,
    weight: 4,
    title: "Scale Deployment & Record Revision",
    context: "kubectl config use-context k8s",
    nodeSsh: null,
    docs: [
      {
        title: "Deployments",
        url: "https://kubernetes.io/docs/concepts/workloads/controllers/deployment/"
      },
      {
        title: "Scaling a Deployment",
        url: "https://kubernetes.io/docs/concepts/workloads/controllers/deployment/#scaling-a-deployment"
      },
      {
        title: "Rollout History",
        url: "https://kubernetes.io/docs/concepts/workloads/controllers/deployment/#checking-rollout-history-of-a-deployment"
      }
    ],
    body: `
      <p>Set the current context before starting the task:</p>
      <div class="context-box">
        <span class="context-label">Context:</span>
        <code>kubectl config use-context k8s</code>
      </div>

      <p>A load spike is expected on the payment gateway service in the finance namespace.</p>

      <h4>Task Requirements:</h4>
      <ul>
        <li>Locate the Deployment <code>payment-api</code> in namespace <code>finance</code>.</li>
        <li>Scale the Deployment up to <code>5</code> replicas.</li>
        <li>Update the container image of <code>payment-api</code> to <code>nginx:1.25-alpine</code>.</li>
        <li>Ensure the rollout succeeds and inspect the rollout history using:</li>
      </ul>

      <pre><code>kubectl rollout history deployment payment-api -n finance</code></pre>
    `
  },
  {
    id: 3,
    weight: 7,
    title: "Multi-Container Pod with Logging Sidecar",
    context: "kubectl config use-context infra-prod",
    nodeSsh: null,
    docs: [
      {
        title: "Communicate Between Containers in a Pod",
        url: "https://kubernetes.io/docs/tasks/access-application-cluster/communicate-between-containers-same-pod-shared-volume/"
      },
      {
        title: "Logging Architecture",
        url: "https://kubernetes.io/docs/concepts/cluster-administration/logging/"
      }
    ],
    body: `
      <p>Set the current context before starting the task:</p>
      <div class="context-box">
        <span class="context-label">Context:</span>
        <code>kubectl config use-context infra-prod</code>
      </div>

      <p>An application generates log files on a local volume. A secondary sidecar container must read and stream these logs to standard output.</p>

      <h4>Task Requirements:</h4>
      <ul>
        <li>Create a Pod named <code>order-processor</code> in namespace <code>ecommerce</code>.</li>
        <li>Main container named <code>app</code> using image <code>busybox:latest</code>:
          <pre><code>sh -c "while true; do echo $(date) - Processing order >> /var/log/app.log; sleep 5; done"</code></pre>
        </li>
        <li>Sidecar container named <code>log-shipper</code> using image <code>busybox:latest</code>:
          <pre><code>sh -c "tail -n+1 -F /var/log/app.log"</code></pre>
        </li>
        <li>Mount a shared <code>emptyDir</code> volume at <code>/var/log</code> in both containers.</li>
        <li>Confirm you can view the live log stream using:
          <code>kubectl logs order-processor -c log-shipper -n ecommerce</code>
        </li>
      </ul>
    `
  },
  {
    id: 4,
    weight: 7,
    title: "Ingress Routing with Path-Based Rules",
    context: "kubectl config use-context k8s",
    nodeSsh: null,
    docs: [
      {
        title: "Ingress",
        url: "https://kubernetes.io/docs/concepts/services-networking/ingress/"
      },
      {
        title: "Ingress Path Types",
        url: "https://kubernetes.io/docs/concepts/services-networking/ingress/#path-types"
      }
    ],
    body: `
      <p>Set the current context before starting the task:</p>
      <div class="context-box">
        <span class="context-label">Context:</span>
        <code>kubectl config use-context k8s</code>
      </div>

      <p>Configure HTTP ingress routing to direct web traffic to the appropriate cluster services.</p>

      <h4>Task Requirements:</h4>
      <ul>
        <li>Create an Ingress resource named <code>app-router</code> in namespace <code>web</code>.</li>
        <li>Specify the <code>ingressClassName: nginx</code>.</li>
        <li>Route incoming requests for path <code>/api</code> (Prefix match) to Service <code>api-svc</code> on port <code>8080</code>.</li>
        <li>Route incoming requests for path <code>/web</code> (Prefix match) to Service <code>web-svc</code> on port <code>80</code>.</li>
      </ul>

      <h4>Verification:</h4>
      <pre><code>kubectl describe ingress app-router -n web</code></pre>
    `
  },
  {
    id: 5,
    weight: 9,
    title: "NetworkPolicy Restricting Database Access",
    context: "kubectl config use-context security",
    nodeSsh: null,
    docs: [
      {
        title: "Network Policies",
        url: "https://kubernetes.io/docs/concepts/services-networking/network-policies/"
      },
      {
        title: "Declare Network Policy",
        url: "https://kubernetes.io/docs/tasks/administer-cluster/declare-network-policy/"
      }
    ],
    body: `
      <p>Set the current context before starting the task:</p>
      <div class="context-box">
        <span class="context-label">Context:</span>
        <code>kubectl config use-context security</code>
      </div>

      <p>A zero-trust policy must be enforced around sensitive relational databases in the cluster.</p>

      <h4>Task Requirements:</h4>
      <ul>
        <li>In namespace <code>db-tier</code>, create a NetworkPolicy named <code>allow-db-access</code>.</li>
        <li>Apply the policy to Pods with label <code>role=db</code>.</li>
        <li>Allow Ingress only on TCP port <code>5432</code>.</li>
        <li>Allow traffic ONLY from Pods labeled <code>access=granted</code> residing in namespace <code>backend-tier</code>.</li>
        <li>Ensure all other incoming traffic to Pods with <code>role=db</code> is denied.</li>
      </ul>

      <h4>Test Command:</h4>
      <pre><code>kubectl run test-db --rm -it --image=curlimages/curl -- nc -zv db-service.db-tier 5432</code></pre>
    `
  },
  {
    id: 6,
    weight: 8,
    title: "PersistentVolume & PVC with Retain Reclaim Policy",
    context: "kubectl config use-context k8s",
    nodeSsh: null,
    docs: [
      {
        title: "Persistent Volumes",
        url: "https://kubernetes.io/docs/concepts/storage/persistent-volumes/"
      },
      {
        title: "Configure Persistent Volume Storage",
        url: "https://kubernetes.io/docs/tasks/configure-pod-container/configure-persistent-volume-storage/"
      }
    ],
    body: `
      <p>Set the current context before starting the task:</p>
      <div class="context-box">
        <span class="context-label">Context:</span>
        <code>kubectl config use-context k8s</code>
      </div>

      <p>Persistent storage needs to be configured with safe retention semantics.</p>

      <h4>Task Requirements:</h4>
      <ul>
        <li>Create a PersistentVolume named <code>pv-data-01</code>:
          <ul>
            <li>Capacity: <code>5Gi</code></li>
            <li>AccessModes: <code>ReadWriteOnce</code></li>
            <li>ReclaimPolicy: <code>Retain</code></li>
            <li>HostPath: <code>/mnt/data</code></li>
          </ul>
        </li>
        <li>Create a PersistentVolumeClaim named <code>pvc-data-01</code> in namespace <code>storage-test</code>:
          <ul>
            <li>AccessModes: <code>ReadWriteOnce</code></li>
            <li>Request: <code>2Gi</code></li>
          </ul>
        </li>
        <li>Verify that the claim successfully binds to <code>pv-data-01</code>:</li>
      </ul>

      <pre><code>kubectl get pvc pvc-data-01 -n storage-test</code></pre>
    `
  },
  {
    id: 7,
    weight: 6,
    title: "StorageClass with WaitForFirstConsumer",
    context: "kubectl config use-context storage-ops",
    nodeSsh: null,
    docs: [
      {
        title: "Storage Classes",
        url: "https://kubernetes.io/docs/concepts/storage/storage-classes/"
      },
      {
        title: "Volume Binding Mode",
        url: "https://kubernetes.io/docs/concepts/storage/storage-classes/#volume-binding-mode"
      }
    ],
    body: `
      <p>Set the current context before starting the task:</p>
      <div class="context-box">
        <span class="context-label">Context:</span>
        <code>kubectl config use-context storage-ops</code>
      </div>

      <p>Local persistent storage must only bind when a consuming Pod is scheduled to prevent cross-node topology conflicts.</p>

      <h4>Task Requirements:</h4>
      <ul>
        <li>Define a StorageClass named <code>local-storage-delayed</code>.</li>
        <li>Set provisioner to <code>kubernetes.io/no-provisioner</code>.</li>
        <li>Set <code>volumeBindingMode: WaitForFirstConsumer</code>.</li>
        <li>Set <code>reclaimPolicy: Delete</code>.</li>
      </ul>

      <h4>Verification:</h4>
      <pre><code>kubectl get sc local-storage-delayed</code></pre>
    `
  },
  {
    id: 8,
    weight: 6,
    title: "RBAC Role & RoleBinding for ServiceAccount",
    context: "kubectl config use-context k8s",
    nodeSsh: null,
    docs: [
      {
        title: "Using RBAC Authorization",
        url: "https://kubernetes.io/docs/reference/access-authn-authz/rbac/"
      },
      {
        title: "Managing Service Accounts",
        url: "https://kubernetes.io/docs/tasks/configure-pod-container/configure-service-account/"
      }
    ],
    body: `
      <p>Set the current context before starting the task:</p>
      <div class="context-box">
        <span class="context-label">Context:</span>
        <code>kubectl config use-context k8s</code>
      </div>

      <p>A CI/CD runner requires limited read access to Pod resources within a specific namespace.</p>

      <h4>Task Requirements:</h4>
      <ul>
        <li>In namespace <code>developer-space</code>, create a ServiceAccount named <code>build-bot</code>.</li>
        <li>Create a Role named <code>pod-reader</code> in namespace <code>developer-space</code> allowing <code>get</code>, <code>list</code>, and <code>watch</code> on <code>pods</code>.</li>
        <li>Create a RoleBinding named <code>build-bot-reader</code> in namespace <code>developer-space</code> binding the Role to ServiceAccount <code>build-bot</code>.</li>
        <li>Test permissions using <code>auth can-i</code>:</li>
      </ul>

      <pre><code>kubectl auth can-i list pods -n developer-space --as=system:serviceaccount:developer-space:build-bot</code></pre>
    `
  },
  {
    id: 9,
    weight: 5,
    title: "Node Maintenance: Safe Evacuation & Drain",
    context: "kubectl config use-context cluster-admin",
    nodeSsh: null,
    docs: [
      {
        title: "Safely Drain a Node",
        url: "https://kubernetes.io/docs/tasks/administer-cluster/safely-drain-node/"
      },
      {
        title: "Manual Node Administration",
        url: "https://kubernetes.io/docs/concepts/architecture/nodes/#manual-node-administration"
      }
    ],
    body: `
      <p>Set the current context before starting the task:</p>
      <div class="context-box">
        <span class="context-label">Context:</span>
        <code>kubectl config use-context cluster-admin</code>
      </div>

      <p>Worker node <code>k8s-worker-1</code> requires scheduled hardware maintenance.</p>

      <h4>Task Requirements:</h4>
      <ul>
        <li>Drain node <code>k8s-worker-1</code> safely.</li>
        <li>Ignore DaemonSets during the eviction process.</li>
        <li>Force deletion of Pods utilizing local storage (emptyDir).</li>
        <li>Verify node status displays <code>SchedulingDisabled</code>.</li>
        <li>Simulate post-maintenance recovery by uncordoning <code>k8s-worker-1</code> so new Pods can be scheduled.</li>
      </ul>

      <h4>Commands:</h4>
      <pre><code>kubectl drain k8s-worker-1 --ignore-daemonsets --delete-emptydir-data --force
kubectl get nodes
kubectl uncordon k8s-worker-1</code></pre>
    `
  },
  {
    id: 10,
    weight: 8,
    title: "Control Plane Upgrade with Kubeadm",
    context: "kubectl config use-context cluster-admin",
    nodeSsh: "ssh k8s-control-plane",
    docs: [
      {
        title: "Upgrading kubeadm clusters",
        url: "https://kubernetes.io/docs/tasks/administer-cluster/kubeadm/kubeadm-upgrade/"
      },
      {
        title: "Upgrading control plane nodes",
        url: "https://kubernetes.io/docs/tasks/administer-cluster/kubeadm/kubeadm-upgrade/#upgrading-control-plane-nodes"
      }
    ],
    body: `
      <p>Set the current context and connect to the control plane node:</p>
      <div class="context-box">
        <span class="context-label">Context:</span>
        <code>kubectl config use-context cluster-admin</code><br>
        <span class="context-label">SSH:</span>
        <code>ssh k8s-control-plane</code>
      </div>

      <p>Upgrade the control plane node from version <code>v1.31.0</code> to <code>v1.31.1</code>.</p>

      <h4>Task Requirements:</h4>
      <ul>
        <li>Elevate to root permissions: <code>sudo -i</code></li>
        <li>Drain the control plane node before upgrading.</li>
        <li>Upgrade <code>kubeadm</code> package to version <code>1.31.1-1.1</code>.</li>
        <li>Execute <code>kubeadm upgrade plan</code> and apply the upgrade via <code>kubeadm upgrade apply v1.31.1</code>.</li>
        <li>Upgrade <code>kubelet</code> and <code>kubectl</code>, reload systemd, and restart kubelet.</li>
        <li>Uncordon the node and verify it reports <code>v1.31.1</code>.</li>
      </ul>
    `
  },
  {
    id: 11,
    weight: 10,
    title: "etcd Backup and Restore using etcdutl",
    context: "kubectl config use-context etcd-backup",
    nodeSsh: "ssh k8s-control-plane",
    docs: [
      {
        title: "Operating etcd clusters for Kubernetes",
        url: "https://kubernetes.io/docs/tasks/administer-cluster/configure-upgrade-etcd/"
      },
      {
        title: "Restoring an etcd cluster",
        url: "https://kubernetes.io/docs/tasks/administer-cluster/configure-upgrade-etcd/#restoring-an-etcd-cluster"
      }
    ],
    body: `
      <p>Set the current context and connect to the control plane node:</p>
      <div class="context-box">
        <span class="context-label">Context:</span>
        <code>kubectl config use-context etcd-backup</code><br>
        <span class="context-label">SSH:</span>
        <code>ssh k8s-control-plane</code>
      </div>

      <p>Perform an emergency backup of etcd and restore it into an isolated data directory.</p>

      <h4>Task Requirements:</h4>
      <ul>
        <li>Switch to root: <code>sudo -i</code></li>
        <li>Take a snapshot of etcd using certificates at <code>/etc/kubernetes/pki/etcd/</code> and save it to <code>/opt/backup/etcd-snapshot.db</code>.</li>
        <li>Verify the snapshot status with <code>etcdutl snapshot status /opt/backup/etcd-snapshot.db</code>.</li>
        <li>Restore the snapshot into a new directory <code>/var/lib/etcd-restored</code> using <code>etcdutl snapshot restore</code>.</li>
        <li>Update the etcd static pod manifest <code>/etc/kubernetes/manifests/etcd.yaml</code> hostPath to point to <code>/var/lib/etcd-restored</code>.</li>
      </ul>

      <h4>Standard Restore Command:</h4>
      <pre><code>etcdutl snapshot restore /opt/backup/etcd-snapshot.db --data-dir=/var/lib/etcd-restored</code></pre>
    `
  },
  {
    id: 12,
    weight: 5,
    title: "Static Pod Deployment on Worker Node",
    context: "kubectl config use-context k8s",
    nodeSsh: "ssh k8s-worker-2",
    docs: [
      {
        title: "Create static Pods",
        url: "https://kubernetes.io/docs/tasks/configure-pod-container/static-pod/"
      }
    ],
    body: `
      <p>Set the current context and access the target worker node:</p>
      <div class="context-box">
        <span class="context-label">Context:</span>
        <code>kubectl config use-context k8s</code><br>
        <span class="context-label">SSH:</span>
        <code>ssh k8s-worker-2</code>
      </div>

      <p>Deploy a standalone monitoring service managed directly by kubelet without API server dependencies.</p>

      <h4>Task Requirements:</h4>
      <ul>
        <li>Log into <code>k8s-worker-2</code> and become root (<code>sudo -i</code>).</li>
        <li>Identify the static pod manifest path configured in <code>/var/lib/kubelet/config.yaml</code> (e.g. <code>staticPodPath: /etc/kubernetes/manifests</code>).</li>
        <li>Create a Static Pod named <code>static-monitor</code> using image <code>nginx:alpine</code>.</li>
        <li>Ensure the Pod automatically launches and is visible from the control plane:
          <code>kubectl get pods -A | grep static-monitor-k8s-worker-2</code>
        </li>
      </ul>
    `
  },
  {
    id: 13,
    weight: 7,
    title: "Troubleshoot Failing Worker Node Kubelet",
    context: "kubectl config use-context troubleshoot",
    nodeSsh: "ssh k8s-worker-3",
    docs: [
      {
        title: "Troubleshooting Clusters",
        url: "https://kubernetes.io/docs/tasks/debug/debug-cluster/"
      },
      {
        title: "Kubelet Configuration",
        url: "https://kubernetes.io/docs/reference/config-api/kubelet-config.v1beta1/"
      }
    ],
    body: `
      <p>Set the current context and inspect node health:</p>
      <div class="context-box">
        <span class="context-label">Context:</span>
        <code>kubectl config use-context troubleshoot</code><br>
        <span class="context-label">SSH:</span>
        <code>ssh k8s-worker-3</code>
      </div>

      <p>Node <code>k8s-worker-3</code> is reporting status <code>NotReady</code>. Workloads cannot be scheduled.</p>

      <h4>Task Requirements:</h4>
      <ul>
        <li>Inspect node state with <code>kubectl get nodes</code> and <code>kubectl describe node k8s-worker-3</code>.</li>
        <li>SSH to <code>k8s-worker-3</code> and examine service logs:
          <pre><code>systemctl status kubelet
journalctl -u kubelet -e --no-pager</code></pre>
        </li>
        <li>Identify the configuration syntax error in <code>/var/lib/kubelet/config.yaml</code>.</li>
        <li>Correct the file, reload systemd (<code>systemctl daemon-reload</code>), and restart kubelet (<code>systemctl restart kubelet</code>).</li>
        <li>Verify the node transitions back to <code>Ready</code>.</li>
      </ul>
    `
  },
  {
    id: 14,
    weight: 5,
    title: "CoreDNS Custom Upstream Resolution",
    context: "kubectl config use-context k8s",
    nodeSsh: null,
    docs: [
      {
        title: "Customizing DNS Service",
        url: "https://kubernetes.io/docs/tasks/administer-cluster/dns-custom-nameservers/"
      }
    ],
    body: `
      <p>Set the current context before starting the task:</p>
      <div class="context-box">
        <span class="context-label">Context:</span>
        <code>kubectl config use-context k8s</code>
      </div>

      <p>Cluster services require DNS resolution for internal corporate domains.</p>

      <h4>Task Requirements:</h4>
      <ul>
        <li>Edit the <code>coredns</code> ConfigMap in namespace <code>kube-system</code>.</li>
        <li>Add a custom server block for the domain <code>corp.internal</code>:
          <pre><code>corp.internal:53 {
    errors
    cache 30
    forward . 10.96.0.10:5353
}</code></pre>
        </li>
        <li>Save the ConfigMap and restart CoreDNS pods cleanly:
          <code>kubectl rollout restart deployment coredns -n kube-system</code>
        </li>
      </ul>
    `
  },
  {
    id: 15,
    weight: 5,
    title: "Helm Chart Deployment & Rollback",
    context: "kubectl config use-context helm-cluster",
    nodeSsh: null,
    docs: [
      {
        title: "Helm Documentation",
        url: "https://helm.sh/docs/"
      },
      {
        title: "Helm Quickstart Guide",
        url: "https://helm.sh/docs/intro/quickstart/"
      }
    ],
    body: `
      <p>Set the current context before starting the task:</p>
      <div class="context-box">
        <span class="context-label">Context:</span>
        <code>kubectl config use-context helm-cluster</code>
      </div>

      <p>Manage application release lifecycles using Helm 3.</p>

      <h4>Task Requirements:</h4>
      <ul>
        <li>Deploy a release named <code>web-shop</code> in namespace <code>store</code> using chart <code>bitnami/nginx</code> with values <code>--set replicaCount=3</code>.</li>
        <li>Upgrade the release to <code>replicaCount=5</code> using <code>helm upgrade</code>.</li>
        <li>Review revision history with <code>helm history web-shop -n store</code>.</li>
        <li>Roll back the release to revision 1 using <code>helm rollback web-shop 1 -n store</code>.</li>
      </ul>
    `
  },
  {
    id: 16,
    weight: 4,
    title: "Kustomize Overlay Customization",
    context: "kubectl config use-context kustomize-env",
    nodeSsh: null,
    docs: [
      {
        title: "Declarative Management with Kustomize",
        url: "https://kubernetes.io/docs/tasks/manage-kubernetes-objects/kustomization/"
      }
    ],
    body: `
      <p>Set the current context before starting the task:</p>
      <div class="context-box">
        <span class="context-label">Context:</span>
        <code>kubectl config use-context kustomize-env</code>
      </div>

      <p>Prepare staging environment overlays without modifying base resource manifests.</p>

      <h4>Task Requirements:</h4>
      <ul>
        <li>Navigate to directory <code>/opt/app-deploy/overlays/staging</code>.</li>
        <li>Configure <code>kustomization.yaml</code> to prepend <code>staging-</code> to all resource names.</li>
        <li>Inject a common label <code>environment: staging</code> into all manifests.</li>
        <li>Build and test the rendered output without applying:
          <pre><code>kubectl kustomize /opt/app-deploy/overlays/staging</code></pre>
        </li>
      </ul>
    `
  },
  {
    id: 17,
    weight: 6,
    title: "Gateway API HTTPRoute Traffic Splitting",
    context: "kubectl config use-context gateway-ops",
    nodeSsh: null,
    docs: [
      {
        title: "Gateway API Specification",
        url: "https://gateway-api.sigs.k8s.io/"
      },
      {
        title: "Kubernetes Gateway API Concepts",
        url: "https://kubernetes.io/docs/concepts/services-networking/gateway/"
      }
    ],
    body: `
      <p>Set the current context before starting the task:</p>
      <div class="context-box">
        <span class="context-label">Context:</span>
        <code>kubectl config use-context gateway-ops</code>
      </div>

      <p>Modern Kubernetes clusters replace Ingress with Gateway API for advanced L7 routing.</p>

      <h4>Task Requirements:</h4>
      <ul>
        <li>In namespace <code>gateway-infra</code>, create an <code>HTTPRoute</code> named <code>shop-route</code>.</li>
        <li>Attach the route to the parent Gateway <code>main-gateway</code>.</li>
        <li>Match requests with HTTP header <code>version: v2</code> and route them to Service <code>shop-v2</code> on port <code>80</code>.</li>
        <li>Route all remaining default HTTP traffic to Service <code>shop-v1</code> on port <code>80</code>.</li>
      </ul>

      <h4>Verification:</h4>
      <pre><code>kubectl describe httproute shop-route -n gateway-infra</code></pre>
    `
  }
];
