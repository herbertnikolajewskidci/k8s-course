#!/usr/bin/env python3
"""
CKA Exam Simulator - Automated Multi-Cluster Verification Engine (V3)
Evaluates all 17 authentic Killer.sh scenarios across the 6 KVM VMs on Unraid
concurrently, checks student drill flags, calculates scores, and produces
actionable gap analysis for Birkenbihl lab generation.
"""

import sys
import json
import subprocess
import time
import urllib.request
import urllib.error
from concurrent.futures import ThreadPoolExecutor

# Question Metadata: ID, Title, Weight, Cluster Hostname
QUESTIONS_META = {
    1: {"title": "CoreDNS & FQDN Resolution (Headless & Pods)", "weight": 5, "host": "cka6016"},
    2: {"title": "Kubeconfig Extraction, Contexts & Certs", "weight": 4, "host": "cka2560"},
    3: {"title": "Multi-Container Pod, Downward API & Volumes", "weight": 6, "host": "cka5248"},
    4: {"title": "ReadinessProbe & Service Endpoint Resolution", "weight": 7, "host": "cka3200"},
    5: {"title": "Kubelet PKI & OpenSSL Certificate Audit", "weight": 6, "host": "cka8448"},
    6: {"title": "Kubelet Service Crash & Node Troubleshooting", "weight": 7, "host": "cka1024"},
    7: {"title": "Gateway API & HTTPRoute Routing", "weight": 7, "host": "cka2560"},
    8: {"title": "NetworkPolicy Ingress Isolation", "weight": 7, "host": "cka8448"},
    9: {"title": "Kustomize Overlays & HPA Scaling", "weight": 7, "host": "cka5248"},
    10: {"title": "StorageClass Dynamic Provisioning (WaitForFirstConsumer)", "weight": 6, "host": "cka6016"},
    11: {"title": "PV Recovery & Re-Binding (Retain Policy)", "weight": 6, "host": "cka2560"},
    12: {"title": "Secret Creation, Decryption & SubPath Mounts", "weight": 6, "host": "cka5248"},
    13: {"title": "RBAC Security Triad (SA, Role, RoleBinding)", "weight": 6, "host": "cka3200"},
    14: {"title": "etcd Backup & Snapshot Verification (etcdutl)", "weight": 8, "host": "cka8448"},
    15: {"title": "Node Maintenance (Safe Drain & Uncordon)", "weight": 6, "host": "cka6016"},
    16: {"title": "Pending Pod Forensics (Taints & Constraints)", "weight": 8, "host": "cka3200"},
    17: {"title": "Low-Level Container Forensics with crictl", "weight": 7, "host": "cka6016"}
}

def ssh_exec(host: str, bash_script: str, timeout: int = 15) -> tuple[int, str, str]:
    """Execute a remote bash command via SSH."""
    cmd = [
        "ssh", "-o", "StrictHostKeyChecking=no", "-o", "ConnectTimeout=5",
        host, "bash -s"
    ]
    try:
        proc = subprocess.run(cmd, input=bash_script, text=True, capture_output=True, timeout=timeout)
        return proc.returncode, proc.stdout.strip(), proc.stderr.strip()
    except subprocess.TimeoutExpired:
        return 124, "", "SSH command timed out"
    except Exception as e:
        return 1, "", str(e)

# -------------------------------------------------------------
# Evaluation Checks per Cluster
# -------------------------------------------------------------

def evaluate_cluster_1(host="cka6016") -> dict:
    """Evaluate Q1, Q10, Q15, Q17 on cka6016."""
    script = """
    # Q1
    MONITOR_IP=$(kubectl get pod monitor-agent -n monitoring -o jsonpath='{.status.podIP}' 2>/dev/null || echo "")
    EXPECTED_MONITOR_DNS=$(echo "$MONITOR_IP" | tr '.' '-')".monitoring.pod.cluster.local"
    CM_CORE=$(kubectl get cm router-endpoints -n core-routing -o jsonpath='{.data.ENDPOINT_CORE}' 2>/dev/null || echo "")
    CM_STOR=$(kubectl get cm router-endpoints -n core-routing -o jsonpath='{.data.ENDPOINT_STORAGE}' 2>/dev/null || echo "")
    CM_POD=$(kubectl get cm router-endpoints -n core-routing -o jsonpath='{.data.ENDPOINT_PRIMARY_POD}' 2>/dev/null || echo "")
    CM_MON=$(kubectl get cm router-endpoints -n core-routing -o jsonpath='{.data.ENDPOINT_MONITOR}' 2>/dev/null || echo "")
    ROUTER_LOGS=$(kubectl logs -l app=service-router -n core-routing --tail=25 2>/dev/null || echo "")
    FAIL_COUNT=$(echo "$ROUTER_LOGS" | grep -c "FAIL:" || true)
    ROUTER_RUNNING=$(kubectl get pods -n core-routing -l app=service-router --field-selector=status.phase=Running --no-headers 2>/dev/null | wc -l)
    echo "---Q1---"
    echo "CORE:$CM_CORE|STOR:$CM_STOR|POD:$CM_POD|MON:$CM_MON|EXP_MON:$EXPECTED_MONITOR_DNS|FAILS:$FAIL_COUNT|RUNNING:$ROUTER_RUNNING"

    # Q10
    SC_PROV=$(kubectl get sc delayed-storage -o jsonpath='{.provisioner}' 2>/dev/null || echo "")
    SC_BIND=$(kubectl get sc delayed-storage -o jsonpath='{.volumeBindingMode}' 2>/dev/null || echo "")
    PVC_PHASE=$(kubectl get pvc job-pvc -n project-bern -o jsonpath='{.status.phase}' 2>/dev/null || echo "")
    JOB_SUCC=$(kubectl get job data-job -n project-bern -o jsonpath='{.status.succeeded}' 2>/dev/null || echo "0")
    echo "---Q10---"
    echo "PROV:$SC_PROV|BIND:$SC_BIND|PVC:$PVC_PHASE|SUCC:$JOB_SUCC"

    # Q15
    UNSCHED=$(kubectl get node cka6016 -o jsonpath='{.spec.unschedulable}' 2>/dev/null || echo "false")
    READY=$(kubectl get node cka6016 -o jsonpath='{.status.conditions[?(@.type=="Ready")].status}' 2>/dev/null || echo "")
    DRAIN_PODS=$(kubectl get pods -l app=drain-test --field-selector=status.phase=Running --no-headers 2>/dev/null | wc -l)
    echo "---Q15---"
    echo "UNSCHED:$UNSCHED|READY:$READY|DRAIN_PODS:$DRAIN_PODS"

    # Q17
    Q17_TYPE=$(cat /course/17/runtime-type.txt 2>/dev/null || echo "")
    Q17_LOG_SIZE=$(wc -c < /course/17/container.log 2>/dev/null || echo "0")
    echo "---Q17---"
    echo "TYPE:$Q17_TYPE|LOG_SIZE:$Q17_LOG_SIZE"
    """
    code, stdout, stderr = ssh_exec(host, script)
    results = {}
    if code != 0:
        err = stderr or "SSH connection failed"
        for q in [1, 10, 15, 17]:
            results[q] = {"score": 0, "status": "FAIL", "reason": f"Cluster cka6016 error: {err}"}
        return results

    # Parse Q1
    q1_score, q1_reasons = 0, []
    if "---Q1---" in stdout:
        block = stdout.split("---Q1---")[1].split("---Q10---")[0].strip()
        data = dict(item.split(":", 1) for item in block.split("|") if ":" in item)
        core = data.get("CORE", "")
        stor = data.get("STOR", "")
        pod = data.get("POD", "")
        mon = data.get("MON", "")
        exp_mon = data.get("EXP_MON", "")
        fails = int(data.get("FAILS", "99") or "99")
        running = int(data.get("RUNNING", "0") or "0")

        if core in ("kubernetes.default.svc.cluster.local", "kubernetes.default.svc"):
            q1_score += 1
        else:
            q1_reasons.append(f"ENDPOINT_CORE mismatch ('{core}')")

        if stor in ("storage-vault.storage-tier.svc.cluster.local", "storage-vault.storage-tier.svc"):
            q1_score += 1
        else:
            q1_reasons.append("ENDPOINT_STORAGE missing/invalid FQDN")

        if pod == "vault-0.storage-vault.storage-tier.svc.cluster.local":
            q1_score += 1
        else:
            q1_reasons.append("ENDPOINT_PRIMARY_POD missing headless subdomain")

        if mon and exp_mon and mon == exp_mon:
            q1_score += 1
        else:
            q1_reasons.append(f"ENDPOINT_MONITOR incorrect ({mon} vs expected {exp_mon})")

        if running > 0 and fails == 0 and q1_score == 4:
            q1_score += 1
        elif fails > 0:
            q1_reasons.append(f"service-router logs report {fails} failed resolution attempts")

    results[1] = {
        "score": q1_score,
        "status": "PASS" if q1_score == 5 else ("PARTIAL" if q1_score > 0 else "FAIL"),
        "reason": ", ".join(q1_reasons) if q1_reasons else "All 4 FQDN endpoints resolving cleanly"
    }

    # Parse Q10
    q10_score, q10_reasons = 0, []
    if "---Q10---" in stdout:
        block = stdout.split("---Q10---")[1].split("---Q15---")[0].strip()
        data = dict(item.split(":", 1) for item in block.split("|") if ":" in item)
        prov = data.get("PROV", "")
        bind = data.get("BIND", "")
        pvc = data.get("PVC", "")
        succ = int(data.get("SUCC", "0") or "0")

        if prov == "rancher.io/local-path" and bind == "WaitForFirstConsumer":
            q10_score += 2
        else:
            q10_reasons.append("StorageClass delayed-storage missing or invalid bindingMode")

        if pvc == "Bound":
            q10_score += 2
        else:
            q10_reasons.append(f"PVC job-pvc not Bound (status: {pvc or 'not found'})")

        if succ >= 1:
            q10_score += 2
        else:
            q10_reasons.append("Job data-job has not succeeded yet")

    results[10] = {
        "score": q10_score,
        "status": "PASS" if q10_score == 6 else ("PARTIAL" if q10_score > 0 else "FAIL"),
        "reason": ", ".join(q10_reasons) if q10_reasons else "StorageClass, PVC and Job completed successfully"
    }

    # Parse Q15
    q15_score, q15_reasons = 0, []
    if "---Q15---" in stdout:
        block = stdout.split("---Q15---")[1].split("---Q17---")[0].strip()
        data = dict(item.split(":", 1) for item in block.split("|") if ":" in item)
        unsched = data.get("UNSCHED", "false")
        ready = data.get("READY", "")
        drain_pods = int(data.get("DRAIN_PODS", "0") or "0")

        if ready == "True":
            q15_score += 2
        else:
            q15_reasons.append("Node cka6016 is not in Ready state")

        if unsched != "true":
            q15_score += 2
        else:
            q15_reasons.append("Node cka6016 still SchedulingDisabled (uncordon missing)")

        if drain_pods >= 1:
            q15_score += 2
        else:
            q15_reasons.append("Workload pods not running on node")

    results[15] = {
        "score": q15_score,
        "status": "PASS" if q15_score == 6 else ("PARTIAL" if q15_score > 0 else "FAIL"),
        "reason": ", ".join(q15_reasons) if q15_reasons else "Node safely uncordoned and workloads running"
    }

    # Parse Q17
    q17_score, q17_reasons = 0, []
    if "---Q17---" in stdout:
        block = stdout.split("---Q17---")[1].strip()
        data = dict(item.split(":", 1) for item in block.split("|") if ":" in item)
        rtype = data.get("TYPE", "")
        lsize = int(data.get("LOG_SIZE", "0") or "0")

        if "io.containerd" in rtype or "containerd" in rtype or "runc" in rtype:
            q17_score += 3.5
        else:
            q17_reasons.append(f"/course/17/runtime-type.txt missing or invalid ('{rtype}')")

        if lsize > 20:
            q17_score += 3.5
        else:
            q17_reasons.append("/course/17/container.log is missing or empty")

    results[17] = {
        "score": int(q17_score) if q17_score.is_integer() else q17_score,
        "status": "PASS" if q17_score == 7 else ("PARTIAL" if q17_score > 0 else "FAIL"),
        "reason": ", ".join(q17_reasons) if q17_reasons else "runtime-type and container log verified"
    }

    return results

def evaluate_cluster_2(host="cka2560") -> dict:
    """Evaluate Q2, Q7, Q11 on cka2560."""
    script = """
    # Q2
    CTX_LINES=$(wc -l < /course/2/contexts 2>/dev/null || echo 0)
    CUR_CTX=$(cat /course/2/current-context 2>/dev/null || echo "")
    CERT_HEADER=$(grep -c "BEGIN CERTIFICATE" /course/2/cert 2>/dev/null || echo 0)
    echo "---Q2---"
    echo "CTX_LINES:$CTX_LINES|CUR_CTX:$CUR_CTX|CERT_HEADER:$CERT_HEADER"

    # Q7
    HR_NAME=$(kubectl get httproute traffic-splitter -n gateway-infra -o jsonpath='{.metadata.name}' 2>/dev/null || echo "")
    HR_GW=$(kubectl get httproute traffic-splitter -n gateway-infra -o jsonpath='{.spec.parentRefs[0].name}' 2>/dev/null || echo "")
    HR_HOST=$(kubectl get httproute traffic-splitter -n gateway-infra -o jsonpath='{.spec.hostnames[0]}' 2>/dev/null || echo "")
    HR_RULES=$(kubectl get httproute traffic-splitter -n gateway-infra -o jsonpath='{range .spec.rules[*]}{.matches[*].path.value}:{.backendRefs[*].name};{end}' 2>/dev/null || echo "")
    echo "---Q7---"
    echo "NAME:$HR_NAME|GW:$HR_GW|HOST:$HR_HOST|RULES:$HR_RULES"

    # Q11
    PV_PHASE=$(kubectl get pv pv-retained-data -o jsonpath='{.status.phase}' 2>/dev/null || echo "")
    PVC_PHASE=$(kubectl get pvc recovered-pvc -n storage-recovery -o jsonpath='{.status.phase}' 2>/dev/null || echo "")
    PVC_CLAIM=$(kubectl get pv pv-retained-data -o jsonpath='{.spec.claimRef.name}' 2>/dev/null || echo "")
    echo "---Q11---"
    echo "PV:$PV_PHASE|PVC:$PVC_PHASE|CLAIM:$PVC_CLAIM"
    """
    code, stdout, stderr = ssh_exec(host, script)
    results = {}
    if code != 0:
        err = stderr or "SSH connection failed"
        for q in [2, 7, 11]:
            results[q] = {"score": 0, "status": "FAIL", "reason": f"Cluster cka2560 error: {err}"}
        return results

    # Parse Q2
    q2_score, q2_reasons = 0, []
    if "---Q2---" in stdout:
        block = stdout.split("---Q2---")[1].split("---Q7---")[0].strip()
        data = dict(item.split(":", 1) for item in block.split("|") if ":" in item)
        ctx_lines = int(data.get("CTX_LINES", "0") or "0")
        cur_ctx = data.get("CUR_CTX", "")
        cert_head = int(data.get("CERT_HEADER", "0") or "0")

        if ctx_lines >= 3:
            q2_score += 1.5
        else:
            q2_reasons.append("/course/2/contexts incomplete (expected 3 contexts)")

        if cur_ctx == "prod-context":
            q2_score += 1
        else:
            q2_reasons.append(f"/course/2/current-context incorrect ('{cur_ctx}')")

        if cert_head >= 1:
            q2_score += 1.5
        else:
            q2_reasons.append("/course/2/cert does not contain valid PEM certificate")

    results[2] = {
        "score": int(q2_score) if q2_score.is_integer() else q2_score,
        "status": "PASS" if q2_score == 4 else ("PARTIAL" if q2_score > 0 else "FAIL"),
        "reason": ", ".join(q2_reasons) if q2_reasons else "All contexts and client cert extracted properly"
    }

    # Parse Q7
    q7_score, q7_reasons = 0, []
    if "---Q7---" in stdout:
        block = stdout.split("---Q7---")[1].split("---Q11---")[0].strip()
        data = dict(item.split(":", 1) for item in block.split("|") if ":" in item)
        name = data.get("NAME", "")
        gw = data.get("GW", "")
        hname = data.get("HOST", "")
        rules = data.get("RULES", "")

        if name == "traffic-splitter" and gw == "app-gateway":
            q7_score += 2
        else:
            q7_reasons.append("HTTPRoute traffic-splitter not found or not bound to app-gateway")

        if hname == "api.example.com":
            q7_score += 1
        else:
            q7_reasons.append(f"Host mismatch in HTTPRoute ('{hname}' vs api.example.com)")

        if "/v1:web-v1-svc" in rules and "/v2:web-v2-svc" in rules:
            q7_score += 2
        else:
            q7_reasons.append("Path routing for /v1 or /v2 missing")

        if "/mobile:web-v2-svc" in rules and "/mobile:web-v1-svc" in rules:
            q7_score += 2
        else:
            q7_reasons.append("Header-based /mobile routing or fallback missing")

    results[7] = {
        "score": q7_score,
        "status": "PASS" if q7_score == 7 else ("PARTIAL" if q7_score > 0 else "FAIL"),
        "reason": ", ".join(q7_reasons) if q7_reasons else "HTTPRoute with host, path and header matches applied"
    }

    # Parse Q11
    q11_score, q11_reasons = 0, []
    if "---Q11---" in stdout:
        block = stdout.split("---Q11---")[1].strip()
        data = dict(item.split(":", 1) for item in block.split("|") if ":" in item)
        pv = data.get("PV", "")
        pvc = data.get("PVC", "")
        claim = data.get("CLAIM", "")

        if pv == "Bound":
            q11_score += 2
        else:
            q11_reasons.append(f"PV pv-retained-data phase is {pv} (expected Bound)")

        if pvc == "Bound":
            q11_score += 2
        else:
            q11_reasons.append(f"PVC recovered-pvc phase is {pvc} (expected Bound)")

        if claim == "recovered-pvc":
            q11_score += 2
        else:
            q11_reasons.append(f"PV claimRef is {claim} (expected recovered-pvc)")

    results[11] = {
        "score": q11_score,
        "status": "PASS" if q11_score == 6 else ("PARTIAL" if q11_score > 0 else "FAIL"),
        "reason": ", ".join(q11_reasons) if q11_reasons else "PV recovered and bound to recovered-pvc without data loss"
    }

    return results

def evaluate_cluster_3(host="cka5248") -> dict:
    """Evaluate Q3, Q9, Q12 on cka5248."""
    script = """
    # Q3
    POD_COLLECTOR=$(kubectl get pod collector -n project-tiger -o jsonpath='{.status.phase}' 2>/dev/null || echo "")
    PRODUCER_RUNNING=$(kubectl get pod collector -n project-tiger -o jsonpath='{.status.containerStatuses[?(@.name=="producer")].ready}' 2>/dev/null || echo "")
    CONSUMER_RUNNING=$(kubectl get pod collector -n project-tiger -o jsonpath='{.status.containerStatuses[?(@.name=="consumer")].ready}' 2>/dev/null || echo "")
    DOWNWARD_NODE=$(kubectl exec collector -n project-tiger -c producer -- printenv HOST_NODE 2>/dev/null || echo "")
    LOG_LINES=$(kubectl logs collector -n project-tiger -c consumer --tail=10 2>/dev/null | wc -l)
    echo "---Q3---"
    echo "PHASE:$POD_COLLECTOR|PROD:$PRODUCER_RUNNING|CONS:$CONSUMER_RUNNING|NODE:$DOWNWARD_NODE|LOGS:$LOG_LINES"

    # Q9
    HPA_STAGE=$(kubectl get hpa -n staging-zone -o jsonpath='{.items[*].metadata.name}' 2>/dev/null || echo "")
    HPA_PROD=$(kubectl get hpa -n prod-zone -o jsonpath='{.items[*].metadata.name}' 2>/dev/null || echo "")
    PROD_MAX=$(kubectl get hpa api-hpa -n prod-zone -o jsonpath='{.spec.maxReplicas}' 2>/dev/null || echo "0")
    CM_STAGE=$(kubectl get cm legacy-scaling-config -n staging-zone 2>/dev/null && echo "EXISTS" || echo "DELETED")
    CM_PROD=$(kubectl get cm legacy-scaling-config -n prod-zone 2>/dev/null && echo "EXISTS" || echo "DELETED")
    echo "---Q9---"
    echo "STAGE:$HPA_STAGE|PROD:$HPA_PROD|MAX:$PROD_MAX|CM_S:$CM_STAGE|CM_P:$CM_PROD"

    # Q12
    SEC_USER=$(kubectl get secret db-credentials -n secret-mgmt -o jsonpath='{.data.DB_USER}' 2>/dev/null | base64 -d 2>/dev/null || echo "")
    SEC_PASS=$(kubectl get secret db-credentials -n secret-mgmt -o jsonpath='{.data.DB_PASS}' 2>/dev/null | base64 -d 2>/dev/null || echo "")
    POD_SEC=$(kubectl get pod db-client -n secret-mgmt -o jsonpath='{.status.phase}' 2>/dev/null || echo "")
    MOUNT_PASS=$(kubectl exec db-client -n secret-mgmt -- cat /etc/secrets/password.txt 2>/dev/null || echo "")
    ENV_USER=$(kubectl exec db-client -n secret-mgmt -- printenv DATABASE_USER 2>/dev/null || echo "")
    echo "---Q12---"
    echo "USER:$SEC_USER|PASS:$SEC_PASS|PHASE:$POD_SEC|M_PASS:$MOUNT_PASS|E_USER:$ENV_USER"
    """
    code, stdout, stderr = ssh_exec(host, script)
    results = {}
    if code != 0:
        err = stderr or "SSH connection failed"
        for q in [3, 9, 12]:
            results[q] = {"score": 0, "status": "FAIL", "reason": f"Cluster cka5248 error: {err}"}
        return results

    # Parse Q3
    q3_score, q3_reasons = 0, []
    if "---Q3---" in stdout:
        block = stdout.split("---Q3---")[1].split("---Q9---")[0].strip()
        data = dict(item.split(":", 1) for item in block.split("|") if ":" in item)
        phase = data.get("PHASE", "")
        prod = data.get("PROD", "")
        cons = data.get("CONS", "")
        node = data.get("NODE", "")
        logs = int(data.get("LOGS", "0") or "0")

        if phase == "Running" and prod == "true" and cons == "true":
            q3_score += 2
        else:
            q3_reasons.append("collector Pod not running with 2/2 containers")

        if node in ("cka5248", "cka5248-node1"):
            q3_score += 2
        else:
            q3_reasons.append(f"HOST_NODE downward API env var missing or empty ('{node}')")

        if logs >= 2:
            q3_score += 2
        else:
            q3_reasons.append("Consumer container not streaming event logs from shared volume")

    results[3] = {
        "score": q3_score,
        "status": "PASS" if q3_score == 6 else ("PARTIAL" if q3_score > 0 else "FAIL"),
        "reason": ", ".join(q3_reasons) if q3_reasons else "Multi-container Pod with Downward API and shared emptyDir working"
    }

    # Parse Q9
    q9_score, q9_reasons = 0, []
    if "---Q9---" in stdout:
        block = stdout.split("---Q9---")[1].split("---Q12---")[0].strip()
        data = dict(item.split(":", 1) for item in block.split("|") if ":" in item)
        stage_hpa = data.get("STAGE", "")
        prod_hpa = data.get("PROD", "")
        prod_max = int(data.get("MAX", "0") or "0")
        cm_s = data.get("CM_S", "")
        cm_p = data.get("CM_P", "")

        if "api-hpa" in stage_hpa:
            q9_score += 2
        else:
            q9_reasons.append("api-hpa not deployed to staging-zone")

        if "api-hpa" in prod_hpa and prod_max == 6:
            q9_score += 3
        else:
            q9_reasons.append(f"api-hpa in prod-zone missing or maxReplicas != 6 (got {prod_max})")

        if cm_s == "DELETED" and cm_p == "DELETED":
            q9_score += 2
        else:
            q9_reasons.append("Legacy ConfigMap legacy-scaling-config still present")

    results[9] = {
        "score": q9_score,
        "status": "PASS" if q9_score == 7 else ("PARTIAL" if q9_score > 0 else "FAIL"),
        "reason": ", ".join(q9_reasons) if q9_reasons else "Kustomize overlays deployed with prod HPA patch and legacy CM purged"
    }

    # Parse Q12
    q12_score, q12_reasons = 0, []
    if "---Q12---" in stdout:
        block = stdout.split("---Q12---")[1].strip()
        data = dict(item.split(":", 1) for item in block.split("|") if ":" in item)
        sec_u = data.get("USER", "")
        sec_p = data.get("PASS", "")
        phase = data.get("PHASE", "")
        m_pass = data.get("M_PASS", "")
        e_user = data.get("E_USER", "")

        if sec_u == "app_admin" and sec_p == "SuperSecret789!":
            q12_score += 2
        else:
            q12_reasons.append("Secret db-credentials missing or incorrect credentials")

        if phase == "Running":
            q12_score += 1
        else:
            q12_reasons.append("Pod db-client not Running")

        if m_pass == "SuperSecret789!":
            q12_score += 1.5
        else:
            q12_reasons.append("/etc/secrets/password.txt does not contain password via subPath")

        if e_user == "app_admin":
            q12_score += 1.5
        else:
            q12_reasons.append("DATABASE_USER environment variable missing/incorrect")

    results[12] = {
        "score": int(q12_score) if q12_score.is_integer() else q12_score,
        "status": "PASS" if q12_score == 6 else ("PARTIAL" if q12_score > 0 else "FAIL"),
        "reason": ", ".join(q12_reasons) if q12_reasons else "Secret created, password mounted via subPath, env var configured"
    }

    return results

def evaluate_cluster_4(host="cka3200") -> dict:
    """Evaluate Q4, Q13, Q16 on cka3200."""
    script = """
    # Q4
    EP_COUNT=$(kubectl get endpoints backend-service -n project-alpha -o jsonpath='{.subsets[*].addresses[*].ip}' 2>/dev/null | wc -w)
    PROBE_STATUS=$(kubectl get pod probe-checker -n project-alpha -o jsonpath='{.status.containerStatuses[0].ready}' 2>/dev/null || echo "false")
    PROBE_EXEC=$(kubectl get pod probe-checker -n project-alpha -o jsonpath='{.spec.containers[0].readinessProbe.exec.command}' 2>/dev/null || echo "")
    BACKEND_RUNNING=$(kubectl get pod backend-pod -n project-alpha -o jsonpath='{.status.phase}' 2>/dev/null || echo "")
    echo "---Q4---"
    echo "EP:$EP_COUNT|READY:$PROBE_STATUS|EXEC:$PROBE_EXEC|BACKEND:$BACKEND_RUNNING"

    # Q13
    SA_EXISTS=$(kubectl get sa deploy-bot -n dev-rbac 2>/dev/null && echo "YES" || echo "NO")
    CAN_CREATE=$(kubectl auth can-i create deployments --as=system:serviceaccount:dev-rbac:deploy-bot -n dev-rbac 2>/dev/null || echo "no")
    CAN_DELETE=$(kubectl auth can-i delete deployments --as=system:serviceaccount:dev-rbac:deploy-bot -n dev-rbac 2>/dev/null || echo "no")
    CAN_LIST=$(kubectl auth can-i list deployments --as=system:serviceaccount:dev-rbac:deploy-bot -n dev-rbac 2>/dev/null || echo "no")
    echo "---Q13---"
    echo "SA:$SA_EXISTS|CREATE:$CAN_CREATE|DELETE:$CAN_DELETE|LIST:$CAN_LIST"

    # Q16
    RUNNING_REPS=$(kubectl get pods -n wp-forensics -l app=analytics-pipeline --field-selector=status.phase=Running --no-headers 2>/dev/null | wc -l)
    PENDING_REPS=$(kubectl get pods -n wp-forensics -l app=analytics-pipeline --field-selector=status.phase=Pending --no-headers 2>/dev/null | wc -l)
    NODE_LABEL=$(kubectl get node cka3200 -o jsonpath='{.metadata.labels.hardware-tier}' 2>/dev/null || echo "")
    echo "---Q16---"
    echo "RUNNING:$RUNNING_REPS|PENDING:$PENDING_REPS|LABEL:$NODE_LABEL"
    """
    code, stdout, stderr = ssh_exec(host, script)
    results = {}
    if code != 0:
        err = stderr or "SSH connection failed"
        for q in [4, 13, 16]:
            results[q] = {"score": 0, "status": "FAIL", "reason": f"Cluster cka3200 error: {err}"}
        return results

    # Parse Q4
    q4_score, q4_reasons = 0, []
    if "---Q4---" in stdout:
        block = stdout.split("---Q4---")[1].split("---Q13---")[0].strip()
        data = dict(item.split(":", 1) for item in block.split("|") if ":" in item)
        ep = int(data.get("EP", "0") or "0")
        ready = data.get("READY", "false")
        pexec = data.get("EXEC", "")
        backend = data.get("BACKEND", "")

        if ep >= 1:
            q4_score += 2
        else:
            q4_reasons.append("backend-service has no active endpoints")

        if backend == "Running":
            q4_score += 1
        else:
            q4_reasons.append("backend-pod not running with matching labels")

        if "wget" in pexec:
            q4_score += 2
        else:
            q4_reasons.append("probe-checker readinessProbe does not use exec with wget")

        if ready == "true":
            q4_score += 2
        else:
            q4_reasons.append("probe-checker is not 1/1 Ready")

    results[4] = {
        "score": q4_score,
        "status": "PASS" if q4_score == 7 else ("PARTIAL" if q4_score > 0 else "FAIL"),
        "reason": ", ".join(q4_reasons) if q4_reasons else "Service endpoints matched, probe-checker transitioned to 1/1 Ready"
    }

    # Parse Q13
    q13_score, q13_reasons = 0, []
    if "---Q13---" in stdout:
        block = stdout.split("---Q13---")[1].split("---Q16---")[0].strip()
        data = dict(item.split(":", 1) for item in block.split("|") if ":" in item)
        sa = data.get("SA", "")
        can_create = data.get("CREATE", "")
        can_delete = data.get("DELETE", "")
        can_list = data.get("LIST", "")

        if sa == "YES":
            q13_score += 1
        else:
            q13_reasons.append("ServiceAccount deploy-bot does not exist")

        if "yes" in can_list:
            q13_score += 1.5
        else:
            q13_reasons.append("deploy-bot cannot list deployments")

        if "yes" in can_create:
            q13_score += 2
        else:
            q13_reasons.append("deploy-bot cannot create deployments")

        if "no" in can_delete:
            q13_score += 1.5
        else:
            q13_reasons.append("deploy-bot has unwanted delete permissions")

    results[13] = {
        "score": int(q13_score) if q13_score.is_integer() else q13_score,
        "status": "PASS" if q13_score == 6 else ("PARTIAL" if q13_score > 0 else "FAIL"),
        "reason": ", ".join(q13_reasons) if q13_reasons else "RBAC triad configured with exact required verbs"
    }

    # Parse Q16
    q16_score, q16_reasons = 0, []
    if "---Q16---" in stdout:
        block = stdout.split("---Q16---")[1].strip()
        data = dict(item.split(":", 1) for item in block.split("|") if ":" in item)
        running = int(data.get("RUNNING", "0") or "0")
        pending = int(data.get("PENDING", "0") or "0")
        label = data.get("LABEL", "")

        if label == "compute-optimized":
            q16_score += 4
        else:
            q16_reasons.append(f"Node cka3200 missing hardware-tier=compute-optimized label ('{label}')")

        if running >= 2 and pending == 0:
            q16_score += 4
        else:
            q16_reasons.append(f"analytics-pipeline replicas still pending ({pending} pending, {running} running)")

    results[16] = {
        "score": q16_score,
        "status": "PASS" if q16_score == 8 else ("PARTIAL" if q16_score > 0 else "FAIL"),
        "reason": ", ".join(q16_reasons) if q16_reasons else "Node labeled properly, all replicas running"
    }

    return results

def evaluate_cluster_5(host="cka8448") -> dict:
    """Evaluate Q5, Q8, Q14 on cka8448."""
    script = """
    # Q5
    CERT_FILE_LEN=$(wc -l < /course/5/certificate-info.txt 2>/dev/null || echo 0)
    CERT_CLIENT=$(grep -Ei "client|kubelet-client" /course/5/certificate-info.txt 2>/dev/null | wc -l)
    CERT_SERVER=$(grep -Ei "server|cka8448" /course/5/certificate-info.txt 2>/dev/null | wc -l)
    echo "---Q5---"
    echo "LEN:$CERT_FILE_LEN|CLIENT:$CERT_CLIENT|SERVER:$CERT_SERVER"

    # Q8
    NETPOL_EXISTS=$(kubectl get netpol backend-policy -n secure-zone -o jsonpath='{.metadata.name}' 2>/dev/null || echo "")
    ALLOW_CHECK=$(kubectl exec -n secure-zone allowed-client -- curl -s -m 2 http://secure-backend:80 2>/dev/null && echo "OK" || echo "FAIL")
    BLOCK_CHECK=$(kubectl exec -n external-zone blocked-client -- curl -s -m 2 http://secure-backend.secure-zone:80 2>/dev/null && echo "LEAK" || echo "BLOCKED")
    echo "---Q8---"
    echo "NETPOL:$NETPOL_EXISTS|ALLOW:$ALLOW_CHECK|BLOCK:$BLOCK_CHECK"

    # Q14
    SNAP_SIZE=$(wc -c < /course/14/backup/etcd-snapshot.db 2>/dev/null || echo 0)
    STAT_EXISTS=$(test -s /course/14/backup/status.txt && echo "YES" || echo "NO")
    STAT_HASH=$(grep -i "hash" /course/14/backup/status.txt 2>/dev/null | wc -l)
    echo "---Q14---"
    echo "SIZE:$SNAP_SIZE|STAT:$STAT_EXISTS|HASH:$STAT_HASH"
    """
    code, stdout, stderr = ssh_exec(host, script)
    results = {}
    if code != 0:
        err = stderr or "SSH connection failed"
        for q in [5, 8, 14]:
            results[q] = {"score": 0, "status": "FAIL", "reason": f"Cluster cka8448 error: {err}"}
        return results

    # Parse Q5
    q5_score, q5_reasons = 0, []
    if "---Q5---" in stdout:
        block = stdout.split("---Q5---")[1].split("---Q8---")[0].strip()
        data = dict(item.split(":", 1) for item in block.split("|") if ":" in item)
        flen = int(data.get("LEN", "0") or "0")
        client = int(data.get("CLIENT", "0") or "0")
        server = int(data.get("SERVER", "0") or "0")

        if flen >= 3:
            q5_score += 2
        else:
            q5_reasons.append("/course/5/certificate-info.txt missing or empty")

        if client >= 1:
            q5_score += 2
        else:
            q5_reasons.append("Client certificate audit missing")

        if server >= 1:
            q5_score += 2
        else:
            q5_reasons.append("Server certificate audit missing")

    results[5] = {
        "score": q5_score,
        "status": "PASS" if q5_score == 6 else ("PARTIAL" if q5_score > 0 else "FAIL"),
        "reason": ", ".join(q5_reasons) if q5_reasons else "Kubelet client and server certificates audited"
    }

    # Parse Q8
    q8_score, q8_reasons = 0, []
    if "---Q8---" in stdout:
        block = stdout.split("---Q8---")[1].split("---Q14---")[0].strip()
        data = dict(item.split(":", 1) for item in block.split("|") if ":" in item)
        netpol = data.get("NETPOL", "")
        allow = data.get("ALLOW", "")
        block_t = data.get("BLOCK", "")

        if netpol == "backend-policy":
            q8_score += 2.5
        else:
            q8_reasons.append("NetworkPolicy backend-policy not found in secure-zone")

        if allow == "OK":
            q8_score += 2.5
        else:
            q8_reasons.append("allowed-client cannot reach secure-backend")

        if block_t == "BLOCKED":
            q8_score += 2
        else:
            q8_reasons.append("blocked-client from external-zone is not isolated")

    results[8] = {
        "score": int(q8_score) if q8_score.is_integer() else q8_score,
        "status": "PASS" if q8_score == 7 else ("PARTIAL" if q8_score > 0 else "FAIL"),
        "reason": ", ".join(q8_reasons) if q8_reasons else "NetworkPolicy ingress isolated and tested successfully"
    }

    # Parse Q14
    q14_score, q14_reasons = 0, []
    if "---Q14---" in stdout:
        block = stdout.split("---Q14---")[1].strip()
        data = dict(item.split(":", 1) for item in block.split("|") if ":" in item)
        size = int(data.get("SIZE", "0") or "0")
        stat = data.get("STAT", "")
        hash_count = int(data.get("HASH", "0") or "0")

        if size > 1000000: # > 1MB
            q14_score += 4
        else:
            q14_reasons.append(f"etcd-snapshot.db missing or size too small ({size} bytes)")

        if stat == "YES":
            q14_score += 2
        else:
            q14_reasons.append("/course/14/backup/status.txt missing")

        if hash_count >= 1:
            q14_score += 2
        else:
            q14_reasons.append("status.txt missing snapshot status/hash output")

    results[14] = {
        "score": q14_score,
        "status": "PASS" if q14_score == 8 else ("PARTIAL" if q14_score > 0 else "FAIL"),
        "reason": ", ".join(q14_reasons) if q14_reasons else "etcd snapshot saved and verified"
    }

    return results

def evaluate_cluster_6(host="cka1024") -> dict:
    """Evaluate Q6 on cka1024."""
    script = """
    KUBELET_STATUS=$(systemctl is-active kubelet 2>/dev/null || echo "inactive")
    DROPIN_CORRECT=$(grep -q 'ExecStart=/usr/bin/kubelet' /usr/lib/systemd/system/kubelet.service.d/10-kubeadm.conf 2>/dev/null && echo "YES" || echo "NO")
    NODE_READY=$(kubectl get node cka1024 -o jsonpath='{.status.conditions[?(@.type=="Ready")].status}' 2>/dev/null || echo "")
    echo "KUBELET:$KUBELET_STATUS|DROPIN:$DROPIN_CORRECT|READY:$NODE_READY"
    """
    code, stdout, stderr = ssh_exec(host, script)
    results = {}
    if code != 0:
        err = stderr or "SSH connection failed"
        results[6] = {"score": 0, "status": "FAIL", "reason": f"Cluster cka1024 error: {err}"}
        return results

    q6_score, q6_reasons = 0, []
    data = dict(item.split(":", 1) for item in stdout.split("|") if ":" in item)
    kstat = data.get("KUBELET", "")
    dropin = data.get("DROPIN", "")
    ready = data.get("READY", "")

    if kstat == "active":
        q6_score += 3
    else:
        q6_reasons.append(f"Kubelet service is {kstat} (expected active)")

    if dropin == "YES":
        q6_score += 2
    else:
        q6_reasons.append("10-kubeadm.conf still contains corrupted ExecStart path")

    if ready == "True":
        q6_score += 2
    else:
        q6_reasons.append(f"Node cka1024 status is not Ready ('{ready}')")

    results[6] = {
        "score": q6_score,
        "status": "PASS" if q6_score == 7 else ("PARTIAL" if q6_score > 0 else "FAIL"),
        "reason": ", ".join(q6_reasons) if q6_reasons else "Kubelet service restored, dropin fixed, node Ready"
    }

    return results

# -------------------------------------------------------------
# Drill Flags Loader
# -------------------------------------------------------------

def fetch_drill_flags() -> list[int]:
    """Retrieve Herbert's drill flags from Portal API or fallback to local files."""
    urls = [
        "http://192.168.131.223:8090/api/drill-flags",
        "http://127.0.0.1:8092/api/drill-flags"
    ]
    for url in urls:
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "CKA-Evaluator"})
            with urllib.request.urlopen(req, timeout=3) as resp:
                if resp.status == 200:
                    data = json.loads(resp.read().decode("utf-8"))
                    flags = data.get("drillFlags", [])
                    if isinstance(flags, list):
                        return [int(x) for x in flags if str(x).isdigit()]
        except Exception:
            continue

    # Fallback to local file if present
    local_paths = ["portal/drill-flags.json", "/mnt/user/appdata/cka-psi-portal/drill-flags.json"]
    for lp in local_paths:
        try:
            with open(lp, "r", encoding="utf-8") as f:
                data = json.load(f)
                return [int(x) for x in data.get("drillFlags", []) if str(x).isdigit()]
        except Exception:
            continue

    return []

# -------------------------------------------------------------
# Main Orchestration
# -------------------------------------------------------------

def main():
    start_time = time.time()
    print("======================================================================")
    print("=== [CKA Exam Simulator] Verifying All 17 Questions Across 6 VMs  ===")
    print("======================================================================")
    print("--> Querying active student drill flags...")
    drill_flags = fetch_drill_flags()
    if drill_flags:
        print(f"    🎯 Herbert marked questions for drill: {drill_flags}")
    else:
        print("    ℹ️  No active drill flags currently set by student.")

    print("--> Running parallel cluster evaluations...")

    eval_funcs = [
        evaluate_cluster_1,
        evaluate_cluster_2,
        evaluate_cluster_3,
        evaluate_cluster_4,
        evaluate_cluster_5,
        evaluate_cluster_6
    ]

    all_results = {}
    with ThreadPoolExecutor(max_workers=6) as executor:
        futures = [executor.submit(fn) for fn in eval_funcs]
        for f in futures:
            res = f.result()
            all_results.update(res)

    elapsed = time.time() - start_time

    # Calculate Totals
    total_score = 0
    max_score = sum(q["weight"] for q in QUESTIONS_META.values())
    failed_or_partial = []
    agenda_set = set(drill_flags)

    print("\n---------------------------------------------------------------------------------------------------------")
    print(f"{'ID':<4} | {'Title':<45} | {'Cluster':<8} | {'Weight':<6} | {'Score':<6} | {'Status':<9} | {'Drill?':<6}")
    print("---------------------------------------------------------------------------------------------------------")

    json_questions = []

    for qid in sorted(QUESTIONS_META.keys()):
        meta = QUESTIONS_META[qid]
        res = all_results.get(qid, {"score": 0, "status": "FAIL", "reason": "Not evaluated"})
        score = res.get("score", 0)
        weight = meta["weight"]
        total_score += score

        is_drilled = qid in drill_flags
        status = res.get("status", "FAIL")

        if score < weight:
            failed_or_partial.append(qid)
            agenda_set.add(qid)

        status_display = f"\033[92m[PASS]\033[0m" if status == "PASS" else (
            f"\033[93m[PART]\033[0m" if status == "PARTIAL" else f"\033[91m[FAIL]\033[0m"
        )
        drill_display = "\033[96m🎯 JA\033[0m" if is_drilled else "  -  "

        print(f"Q{qid:<2} | {meta['title'][:45]:<45} | {meta['host']:<8} | {weight:>4}% | {score:>4}% | {status_display:<18} | {drill_display}")
        if status != "PASS":
            print(f"     ↳ \033[90mReason: {res.get('reason', 'N/A')}\033[0m")

        json_questions.append({
            "id": qid,
            "title": meta["title"],
            "cluster": meta["host"],
            "weight": weight,
            "score": score,
            "status": status,
            "isDrillFlagged": is_drilled,
            "reason": res.get("reason", "")
        })

    print("---------------------------------------------------------------------------------------------------------")

    percentage = round((total_score / max_score) * 100, 1)
    passed = percentage >= 66.0

    print(f"\nTotal Exam Score: {total_score} / {max_score} points ({percentage}%)")
    if passed:
        print(f"Result: \033[92mPASSED\033[0m (Threshold: >= 66.0%) — Completed in {elapsed:.2f}s")
    else:
        print(f"Result: \033[91mFAILED\033[0m (Threshold: >= 66.0%) — Completed in {elapsed:.2f}s")

    print("\n======================================================================")
    print("=== Gezielte Wiederholungs-Agenda (Drill-Flags & Fehlversuche)     ===")
    print("======================================================================")
    agenda_list = sorted(list(agenda_set))

    if agenda_list:
        print("Folgende Aufgaben müssen vertieft bzw. wiederholt werden:")
        for qid in agenda_list:
            meta = QUESTIONS_META[qid]
            reasons = []
            if qid in drill_flags:
                reasons.append("🎯 Von Herbert explizit gemerkt")
            if qid in failed_or_partial:
                q_score = all_results.get(qid, {}).get("score", 0)
                reasons.append(f"⚠️ Nicht/teilweise bestanden ({q_score}/{meta['weight']} Pkt)")
            print(f" • Q{qid}: {meta['title']} [{', '.join(reasons)}]")
    else:
        print("🎉 Ausgezeichnet: Alle 17 Aufgaben fehlerfrei bestanden und keine Drill-Markierungen!")

    # Save results to structured JSON
    report_data = {
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "totalScore": total_score,
        "maxScore": max_score,
        "percentage": percentage,
        "passed": passed,
        "threshold": 66.0,
        "durationSeconds": round(elapsed, 2),
        "drillFlaggedQuestions": drill_flags,
        "failedOrPartialQuestions": failed_or_partial,
        "agendaForPractice": agenda_list,
        "questions": json_questions
    }

    out_file = "/tmp/exam-verification-results.json"
    try:
        with open(out_file, "w", encoding="utf-8") as f:
            json.dump(report_data, f, indent=2)
        print(f"\n[Report saved to {out_file}]")
    except Exception as e:
        print(f"Failed to write report JSON: {e}")

if __name__ == "__main__":
    main()
