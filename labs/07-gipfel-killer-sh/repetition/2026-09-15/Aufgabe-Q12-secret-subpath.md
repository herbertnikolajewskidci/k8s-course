# Aufgabe Q12: Secret Creation, Decryption & SubPath Mounts

- **CKA Domäne:** Workloads & Scheduling (15%)
- **Lernberg-Stufe:** Gipfel (Exam Pace & Troubleshooting)
- **Cluster & Host:** `ssh cka5248`
- **Wiederholungs-Grund:** Explizit von Herbert als Drill vorgemerkt (Vertiefung)

---

## 1. Wissensnetz & Mentales Modell (Birkenbihl)

Stell dir einen Aktenschrank im Container vor:

- Wenn du ein Secret als gewöhnliches Volume einhängst (`mountPath: /etc/secrets`),
  wird der gesamte Ordner `/etc/secrets` durch das Secret überblendet.
  Alle bereits im Image vorhandenen Dateien in diesem Verzeichnis werden
  unsichtbar (maskiert).
- **Das Skalpell (`subPath`):** Mit `subPath` nimmst du eine einzelne Datei
  aus dem Secret-Volume (den Schlüssel `DB_PASS`) und klebst ihn punktgenau
  an eine Zieladresse im Dateisystem (`mountPath: /etc/secrets/password.txt`).
  Das übergeordnete Verzeichnis bleibt intakt und vorhandene Dateien werden
  weder überschrieben noch versteckt.
- **Dualer Bezug:** Gleichzeitig kann ein anderer Schlüssel desselben Secrets
  (`DB_USER`) über `valueFrom.secretKeyRef` als saubere Umgebungsvariable
  `DATABASE_USER` injiziert werden.

**KaWa SUBPATH:**

- **S**chlüsselgenaue Dateiprojektion
- **U**nversehrte Nachbardateien im Zielordner
- **B**estimmter Pfad im Volume
- **P**räzise Einzeldatei-Einhängung (`mountPath: .../datei.txt`)
- **A**bsicherung sensibler Zugangsdaten
- **T**rennung von Env-Var und File-Mount
- **H**ohe Sicherheit gegen Dateioverlays

---

## 2. Aufgabenstellung (Repetition Q12)

Host für diese Aufgabe: `ssh cka5248`.

Im Namespace `secret-mgmt` sollen Zugangsdaten für Web-Workloads
bereitgestellt werden.

### Aufgabe 1: Secret db-credentials erstellen

Erstelle im Namespace `secret-mgmt` ein generisches Secret namens
`db-credentials`:

- Schlüssel `DB_USER`: Wert `app_admin`
- Schlüssel `DB_PASS`: Wert `SuperSecret789!`

### Aufgabe 2: Pod db-client mit subPath-Mount & Env-Var ausrollen

Erstelle einen Pod namens `db-client` im Namespace `secret-mgmt`:

1. Image: `nginx:1-alpine`.
2. Hänge den Schlüssel `DB_PASS` über `subPath` als Einzeldokument an
   `/etc/secrets/password.txt` ein, ohne das restliche Verzeichnis
   `/etc/secrets/` zu überschreiben.
3. Mappe den Schlüssel `DB_USER` als Umgebungsvariable `DATABASE_USER`.
4. Verifiziere das Ergebnis im laufenden Container:

   ```bash
   kubectl exec db-client -n secret-mgmt -- cat /etc/secrets/password.txt
   kubectl exec db-client -n secret-mgmt -- printenv DATABASE_USER
   ```

---

## 3. Spickzettel & Doku-Hilfen

- **kubernetes.io Suchbegriff:** `using secrets as files from a pod subpath`
- **Zielseite & Klickpfad:**
  `Concepts -> Configuration -> Secrets -> Using Secrets as Files from a Pod`
- **In-Page Suche (Strg+F):** `subPath`
- **In-Terminal Fastpath:**
  - `kubectl create secret generic db-credentials -n secret-mgmt \`
    `--from-literal=DB_USER=app_admin --from-literal=DB_PASS='SuperSecret789!'`
  - `kubectl explain pod.spec.containers.volumeMounts.subPath`

---

## 4. Feedback & Korrekturen

Noch keine Einreichung vorhanden.
Nach deiner Bearbeitung folgt hier das direkte Review.
