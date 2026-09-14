# Linux Shell Redirection & Pipeline Filtering (CKA Cheatsheet)

## Problemstellung

Manche CLI-Werkzeuge (z. B. `openssl`, `ssh`, Compiler oder fehlerhafte
Befehle) geben Hilfetexte, Statusmeldungen oder Fehler nicht auf `stdout`
(Kanal 1), sondern auf `stderr` (Kanal 2) aus.

Wird eine Standard-Pipe (`|`) verwendet, leitet die Shell ausschließlich
`stdout` an den nachfolgenden Befehl (`grep`, `less` etc.) weiter.
`stderr` umgeht die Pipe vollständig und landet ungefiltert im Terminal.

```text
Standard-Pipe (|):
[ Befehl ] --- FD 1 (stdout) --------> | ---> [ grep ]
           --- FD 2 (stderr) -------------------------> Terminal (ungefiltert)
```

---

## File Descriptoren (Kanal-Übersicht)

| FD | Name | Standardziel | Typischer Inhalt |
| :--- | :--- | :--- | :--- |
| **0** | `stdin` | Tastatur / Pipe | Eingabestrom für Prozesse |
| **1** | `stdout` | Terminal | Reguläre Nutzdaten (`kubectl get`, `cat`) |
| **2** | `stderr` | Terminal | Fehler, Diagnostik, Help (`openssl -help`) |

---

## Die Lösung

### 1. Bash-Kurzform: `|&` (Empfohlen für CKA)

In modernen Bash-Versionen (Standard im CKA-Prüfungsterminal) leitet `|&` sowohl
`stdout` als auch `stderr` gemeinsam durch die Pipe.

```bash
# openssl Hilfetext filtern
openssl x509 -help |& grep -i "text"

# Beliebigen Befehl inklusive Fehlerausgabe filtern
kubectl apply -f manifest.yaml |& grep -i "error"
```

### 2. POSIX-Standard: `2>&1 |`

Funktioniert universell in jeder POSIX-kompatiblen Shell (`sh`, `dash`, `bash`,
`zsh`):

```bash
openssl x509 -help 2>&1 | grep -i "text"
```

**Bedeutung der Syntax:**

* `2`: File Descriptor 2 (`stderr`).
* `>`: Umleitung.
* `&1`: Ziel ist File Descriptor 1 (`stdout`). Ohne `&` würde eine Datei namens
  `1` angelegt werden.

---

## Heuristik & Merkhilfe im Terminal

### Das visuelle Symptom

```bash
befehl | grep "filter"
```

Spuckt das Terminal trotz `grep` den **kompletten Text oder Fehler**
ungefiltert aus:

1. `stderr` (Kanal 2) ist aktiv.
2. Pfeil nach oben (`↑`) drücken.
3. Pipe durch `|&` ersetzen (oder `2>&1 |` einfügen).

### Faustregel für den CKA-Alltag

* **Nutzdaten abfragen** (`kubectl get pods`, `cat`, `awk`): Normale Pipe `|`
  reicht völlig aus.
* **Hilfetexte / externe Tools** (`openssl`, `etcdctl`, `ssh`): Bei
  Filterproblemen direkt auf `|&` umsteigen.
* **Fehlersuche / Debugging** (Init-Skripte, Manifest-Fehler): Immer `|&`
  verwenden, um Fehlermeldungen nicht am Filter vorbeilaufen zu lassen.
