# Aufgabe Q13: RBAC Security Triad (SA, Role, RoleBinding)

- **CKA Domäne:** Cluster Architecture, Installation & Configuration (25%)
- **Lernberg-Stufe:** Gipfel (Exam Pace & Troubleshooting)
- **Cluster & Host:** `ssh cka3200`
- **Wiederholungs-Grund:** Im Simulator-Lauf gelöst (6/6 Punkte nach Verifier-Korrektur)

---

## 1. Wissensnetz & Mentales Modell (Birkenbihl)

Die **RBAC-Triade** ist wie ein dreiteiliger Ausweis-Mechanismus:

1. **Das Subjekt (Wer bist du?):** Ein `ServiceAccount` (`deploy-bot`). Das
   ist der Personalausweis für automatisierte Prozesse.
2. **Die Berechtigungskarte (Was darf man tun?):** Eine `Role`
   (`deployment-manager`). Hier steht abstrakt aufgelistet: `verbs: [get, list,
   create, update, patch]` auf `resources: [deployments]` in `apiGroups: [apps]`.
   Die Rolle weiß noch nicht, wer sie benutzen wird.
3. **Der Clip (Wer darf die Karte tragen?):** Das `RoleBinding`
   (`deploy-bot-binding`). Es klippt die `Role` an den `ServiceAccount` im
   Namespace fest.

- **Die Falle:** Wenn ein Teil der Triade fehlt (z. B. der ServiceAccount
  nicht explizit angelegt wurde), schlägt das System zwar beim Erstellen des
  Bindings nicht fehl, aber die Authentifizierung des Prozesses schlägt
  anschließend gnadenlos fehl.

**KaWa TRIADE:**

- **T**arget-Subjekt (`ServiceAccount`)
- **R**ole definiert die Aktionen (`verbs`)
- **I**mmer an API-Groups denken (`apps` für Deployments!)
- **A**pply-Rechte durch RoleBinding
- **D**elegierte Rechte bleiben auf den Namespace beschränkt
- **E**xakte Namen der Triade abgleichen

---

## 2. Aufgabenstellung (Repetition Q13)

Host für diese Aufgabe: `ssh cka3200`.

Im Namespace `dev-rbac` soll eine zielgerichtete Berechtigung für
Deployment-Verwaltung eingerichtet werden.

### Aufgabe 1: ServiceAccount deploy-bot anlegen

Erstelle im Namespace `dev-rbac` einen ServiceAccount namens `deploy-bot`:

```bash
kubectl create sa deploy-bot -n dev-rbac
```

### Aufgabe 2: Role deployment-manager erstellen

Erstelle eine Role namens `deployment-manager` im Namespace `dev-rbac`:

- Ressourcen: `deployments` (API-Group: `apps`)
- Verben: `get`, `list`, `create`, `update`, `patch`

### Aufgabe 3: RoleBinding deploy-bot-binding binden

1. Verbinde den ServiceAccount `deploy-bot` mit der Role `deployment-manager`
   über ein RoleBinding namens `deploy-bot-binding` im Namespace `dev-rbac`.
2. Verifiziere die Rechte mit dem Kubernetes-Autorisierungs-Befehl:

   ```bash
   kubectl auth can-i create deployments \
     --as=system:serviceaccount:dev-rbac:deploy-bot -n dev-rbac
   kubectl auth can-i delete deployments \
     --as=system:serviceaccount:dev-rbac:deploy-bot -n dev-rbac
   ```

   (Erstes muss `yes`, zweites muss `no` ausgeben).

---

## 3. Deine Lösung (Befehle / Manifeste / Notizen)

### Lösung 1

```bash
# Deine Befehle / Notizen
```

---

## 4. Spickzettel & Doku-Hilfen

- **kubernetes.io Suchbegriff:** `using rbac authorization`
- **Zielseite & Klickpfad:**
  `Reference -> Accessing the API -> Using RBAC Authorization`
- **In-Page Suche (Strg+F):** `RoleBinding` oder `kubectl create role`
- **In-Terminal Fastpath:**
  - `kubectl create role deployment-manager -n dev-rbac \`
    `--verb=get,list,create,update,patch --resource=deployments.apps`
  - `kubectl create rolebinding deploy-bot-binding -n dev-rbac \`
    `--role=deployment-manager --serviceaccount=dev-rbac:deploy-bot`

---

## 5. Feedback & Korrekturen

Noch keine Einreichung vorhanden.
Nach deiner Bearbeitung folgt hier das direkte Review.
