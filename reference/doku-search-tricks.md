# CKA Doku-Suchtipps & Erlaubte Hilfsmittel

## 1. Zugelassene Hilfsmittel in der CKA-Prüfung

In der Prüfung darfst du **genau 1 Browser-Tab** (im sicheren PSI Secure
Browser) mit folgenden Domains öffnen:

- `https://kubernetes.io/docs/` (Offizielle Dokumentation)
- `https://kubernetes.io/blog/` (Offizieller Blog)
- `https://github.com/kubernetes/` (Offizielles K8s GitHub)
- *(Kein Google, kein StackOverflow, keine Foren!)*

Im Terminal hast du Zugriff auf:

- `kubectl explain <ressource>.<feld>`
- `kubectl <command> --help`
- `man`-Pages und Linux-Hilfen

---

## 2. Wie du Spezialfälle wie `change-cause` in der Doku findest

### Der Fall `kubernetes.io/change-cause`

Wenn du in `kubectl rollout history` die Spalte `CHANGE-CAUSE` siehst:

1. **Suchbegriff auf `kubernetes.io/docs`:**
   Tippe oben rechts in die Suche: `change-cause` oder `rollout history`.
2. **Treffer 1:** Seite **Deployments**
   (Abschnitt: *Checking Rollout History of a Deployment*).
3. **Dort steht wörtlich:**
   > `CHANGE-CAUSE` is copied from the Deployment annotation
   > `kubernetes.io/change-cause` to its revisions upon creation.
4. **Treffer 2:** Seite **Well-Known Labels, Annotations and Taints**
   (Enthält eine komplette Liste aller offiziellen K8s-Annotations!).

---

## 3. Die 10 wichtigsten Doku-Suchbegriffe für die CKA

| Wenn du das suchst... | Gib in die Suche ein | Zielseite |
| :--- | :--- | :--- |
| **Rollout-Grund** | `change-cause` | *Deployments* |
| **InitContainer** | `init container` | *Configure Pod with Init Containers* |
| **NodeAffinity** | `nodeaffinity` | *Assigning Pods to Nodes* |
| **Tolerations** | `taints and tolerations` | *Taints and Tolerations* |
| **ConfigMap als Env** | `configmap env` | *Configure Pod with ConfigMap* |
| **Secret gemountet** | `secret volume` | *Secrets* |
| **PV / PVC** | `persistent volume` | *Configure Pod PersistentVolume* |
| **NetworkPolicy** | `network policy` | *Network Policies* |
| **Ingress** | `ingress` | *Ingress* |
| **HPA** | `autoscale` | *Horizontal Pod Autoscaling* |

---

## 4. Birkenbihl-Gedächtnisanker für `change-cause`

- **Die Formel:** `kubernetes.io/` + `<was geändert wurde>`
- **Was wurde geändert?** Der Grund für die Änderung = `change-cause`
- **Der Befehl:**
  `kubectl annotate <objekt> kubernetes.io/change-cause="Mein Grund"`
