# Aufgabe Q14: etcd Backup & Snapshot Verification (etcdutl)

- **CKA Domäne:** Cluster Architecture, Installation & Configuration (25%)
- **Lernberg-Stufe:** Gipfel (Exam Pace & Troubleshooting)
- **Cluster & Host:** `ssh cka8448`
- **Wiederholungs-Grund:** Fehlversuch in Exam (0/8 Punkte, Snapshot nicht erstellt)

---

## 1. Wissensnetz & Mentales Modell (Birkenbihl)

Der etcd-Speicher ist das **Gehirn des gesamten Clusters**:

- Geht etcd verloren, ist der Cluster tot, selbst wenn alle Nodes laufen.
- **Aktueller Prüfungsstandard (etcdctl vs. etcdutl):**
  - Für den **Snapshot (Backup)** spricht man mit dem laufenden etcd-Server
    über TLS-Zertifikate. Dafür nutzt man `etcdctl snapshot save` mit den
    4 Pflicht-Parametern (`--cacert`, `--cert`, `--key`, `--endpoints`).
  - Für die **Inspektion & Wiederherstellung (Restore)** greift man direkt auf
    die Rohdaten-Datei auf der Festplatte zu, ohne dass der etcd-Server laufen
    muss. Hierfür schreibt der moderne Kubernetes-Standard zwingend
    `etcdutl snapshot status` und `etcdutl snapshot restore` vor!
- **Die 4 goldenen etcd-Zertifikatspfade:** Du musst sie nicht auswendig
  wissen! Lies sie einfach in unter 10 Sekunden aus dem Manifest des Static
  Pods ab: `/etc/kubernetes/manifests/etcd.yaml`.

**KaWa ETCDUTL:**

- **E**ndpoints (`https://127.0.0.1:2379`)
- **T**LS-Handshake mit Server-Zertifikaten
- **C**A-Zertifikat (`ca.crt`)
- **D**atenbank-Snapshot (`.db`)
- **U**nabhängige Werkzeuge (`etcdutl` für Offline-Dateien)
- **T**abellarische Statusausgabe (`--write-out=table`)
- **L**okales Manifest als Fundgrube für Pfade

---

## 2. Aufgabenstellung (Repetition Q14)

Host für diese Aufgabe: `ssh cka8448`.

Sichere den Zustand des Clusters atomar in einem etcd-Snapshot und
verifiziere die Integrität der Sicherung.

### Aufgabe 1: Zertifikatspfade aus dem Static Pod Manifest ermitteln

1. Öffne `/etc/kubernetes/manifests/etcd.yaml` und identifiziere:
   - `--listen-client-urls` (Endpoint)
   - `--trusted-ca-file`
   - `--cert-file`
   - `--key-file`

### Aufgabe 2: Snapshot mit etcdctl erstellen

1. Erstelle das Zielverzeichnis: `mkdir -p /course/14/backup/`.
2. Führe den Snapshot-Befehl aus und speichere die Datenbank nach
   `/course/14/backup/etcd-snapshot.db`:

   ```bash
   ETCDCTL_API=3 etcdctl snapshot save /course/14/backup/etcd-snapshot.db \
     --endpoints=https://127.0.0.1:2379 \
     --cacert=/etc/kubernetes/pki/etcd/ca.crt \
     --cert=/etc/kubernetes/pki/etcd/server.crt \
     --key=/etc/kubernetes/pki/etcd/server.key
   ```

### Aufgabe 3: Snapshot mit etcdutl prüfen & dokumentieren

1. Überprüfe die Integrität der Sicherungsdatei mit dem modernen CLI
   `etcdutl`:

   ```bash
   etcdutl snapshot status /course/14/backup/etcd-snapshot.db \
     --write-out=table > /course/14/backup/status.txt
   ```

2. Prüfe die Datei `/course/14/backup/status.txt`: Sie muss Hash, Revisionsnummer
   und Größe der Datenbank enthalten.

---

## 3. Deine Lösung (Befehle / Manifeste / Notizen)

### Lösung 1

```bash
# Deine Befehle / Notizen
```

---

## 4. Spickzettel & Doku-Hilfen

- **kubernetes.io Suchbegriff:** `backing up an etcd cluster`
- **Zielseite & Klickpfad:**
  `Tasks -> Administer a Cluster -> Operating etcd clusters for Kubernetes`
  `-> Backing up an etcd cluster`
- **In-Page Suche (Strg+F):** `snapshot save` oder `etcdutl`
- **In-Terminal Fastpath:**
  - `grep -E 'cert-file|key-file|trusted-ca-file' /etc/kubernetes/manifests/etcd.yaml`

---

## 5. Feedback & Korrekturen

Noch keine Einreichung vorhanden.
Nach deiner Bearbeitung folgt hier das direkte Review.
