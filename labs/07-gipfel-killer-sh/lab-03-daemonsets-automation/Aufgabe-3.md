# Aufgabe 3: DaemonSets, Node-Coverage & Log-Redirection (Killer.sh Q11 & Q17)

- **CKA Domäne:** Workloads & Scheduling (15%) / Troubleshooting (30%)
- **Lernberg-Stufe:** Hang → Gipfel (Speed- & Routine-Drill)
- **Issue:** #11
- **Fokus:** DaemonSets aus Deployments schnitzen, Control-Plane-Tolerations und
  schnelle Log-Redirection

---

## 1. Wissensnetz & Mentales Modell (Birkenbihl)

- **DaemonSet = Der Hausmeister auf jeder Etage:**
  - Im Gegensatz zum Deployment gibt es **keine `replicas:`**. Der
    DaemonSet-Controller platziert automatisch genau einen Pod auf jedem
    passenden Node.
  - **Prüfungsfalle:** Auf Master-/Control-Plane-Nodes liegt standardmäßig ein
    Taint (`node-role.kubernetes.io/control-plane:NoSchedule`). Ein normales
    DaemonSet läuft dort **nicht**, es sei denn, es hat die passende Toleration
    im Gepäck!

- **Deployment-zu-DaemonSet-Rezept (In unter 30 Sekunden):**
  1. `kubectl create deploy my-ds --image=... --dry-run=client -o yaml > ds.yaml`
  2. Im YAML zwei Dinge löschen: `replicas:` und `strategy:`.
  3. `kind: Deployment` ändern zu `kind: DaemonSet`.

---

## 2. Aufgabenstellung

Arbeitsverzeichnis für diese Aufgabe:
`labs/07-gipfel-killer-sh/lab-03-daemonsets-automation/`

### Teilaufgabe 3.1: DaemonSet & Toleration (Killer.sh Q11)

> **💡 Reflex-Empfehlung:**
>
> - **Wo suchen?** Reines Terminal! Geh dafür NICHT in den Browser.
> - **Taint des Control-Plane-Nodes inspizieren:**
>   `kubectl describe node <cp-node> | grep -i taints`
> - **Toleration Syntax nachschlagen:**
>   `kubectl explain daemonset.spec.template.spec.tolerations`
> - **Universal-Toleration Merksatz:**
>   `operator: Exists` toleriert jeden Value für den Key (kein `value:` nötig!).

Erstelle im Arbeitsverzeichnis die Datei `node-exporter-ds.yaml`:

1. Das DaemonSet soll `node-exporter` heißen im Namespace `monitoring`.
2. Pod-Spezifikation:
   - Container-Name: `exporter`
   - Image: `busybox:latest` (oder ARM64-kompatibel)
   - Command:
     `["sh", "-c", "while true; do echo CPU: 12%; sleep 10; done"]`
   - Resource-Requests: `cpu: 10m`, `memory: 20Mi`

3. Scheduling-Anforderung:
   - Das DaemonSet **muss auf ausnahmslos allen Nodes** im Cluster laufen,
     explizit auch auf Control-Plane-Nodes!
   - Füge dafür die passende Toleration für den Standard-Control-Plane-Taint
     (`node-role.kubernetes.io/control-plane:NoSchedule`) hinzu.

---

### Teilaufgabe 3.2: Multi-Container Logs & Redirection (Killer.sh Q17 Pattern)

In Prüfungen wird oft verlangt, Logs eines fehlerhaften Pods oder Containers
mit bestimmten Zeitstempeln oder Fehlermustern in eine Zieldatei zu leiten.

> **💡 Reflex-Empfehlung:**
>
> - **Multi-Container Syntax:** `kubectl logs <pod> -c <container>`
> - **Filterung & Formatierung:** `grep -E "ERROR|WARN"` oder `--since=1h`
> - **Redirection:** Ausgabe sauber via `>` in die Zieldatei schreiben.

Erstelle ein kurzes Bash-Script oder dokumentiere die Befehlskette für folgende
Situation:

1. Ein Pod hat zwei Container: `app` und `sidecar-logger`.
2. Extrahiere die letzten `20` Zeilen des Containers `sidecar-logger` des Pods
   `web-server-xyz` im Namespace `production`.
3. Filtere nur Zeilen heraus, die das Wort `ERROR` oder `FAILED` enthalten.
4. Speichere das Ergebnis in `/var/log/k8s-errors.txt`.

---

## 3. Spickzettel & Doku-Hilfen (Prüfungs-Shortcuts)

### DaemonSet Minimal-Gerüst mit Control-Plane Toleration

```yaml
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: my-daemonset
  namespace: monitoring
spec:
  selector:
    matchLabels:
      app: my-daemonset
  template:
    metadata:
      labels:
        app: my-daemonset
    spec:
      tolerations:
        - key: node-role.kubernetes.io/control-plane
          operator: Exists
          effect: NoSchedule
      containers:
        - name: app
          image: busybox:latest
```

### Log-Redirection Einzeiler

```bash
kubectl logs <pod> -c <container> --tail=20 -n <ns> | grep -E "ERROR|FAILED" > /var/log/k8s-errors.txt
```

---

## 4. Feedback & Korrekturen

Noch keine Einreichung vorhanden.
Löse die Aufgaben im Verzeichnis `labs/07-gipfel-killer-sh/lab-03-daemonsets-automation/`.
