# Block 7: ConfigMaps & Secrets (mit Doku-Suchtraining)

In der CKA-Prüfung musst du Konfigurationen und Secrets
blitzschnell bereitstellen und auf 2 Arten in Pods einbinden:

1. Als Environment-Variablen
2. Als gemountete Dateien (Volume)

## Aufgabe 7.1 (ConfigMap & Secret erstellen)

Erstelle ohne manuelles YAML-Tippen:

1. Eine ConfigMap namens app-config mit dem Key-Value-Paar
   APP_COLOR=darkblue und MAX_CONNECTIONS=100.

```bash
k create configmap app-config \
  --from-literal=APP_COLOR=darkblue \
  --from-literal=MAX_CONNECTIONS=100
```

1. Ein Secret namens db-credentials (vom Typ generic) mit
   DB_USER=admin und DB_PASS=Sup3rS3cr3t.

```text
❯ k create secret generic db-credentials \
  --from-literal=DB_USER=admin \
  --from-literal=DB_PASS=Sup3rS3cr3t
secret/db-credentials created

❯ k describe secrets db-credentials
Name:         db-credentials
Namespace:    default
Labels:       <none>
Annotations:  <none>

Type:  Opaque

Data
====
DB_PASS:  12 bytes
DB_USER:  5 bytes
```

## Aufgabe 7.2 (ConfigMap als Env-Variable & Secret als Volume)

Erstelle einen Pod namens secure-web (Image nginx:alpine):

1. Binde den Wert APP_COLOR aus der ConfigMap app-config als
   Umgebungsvariable namens UI_COLOR in den Container ein.

Siehe `pod.yaml`

1. Mounte das gesamte Secret db-credentials als Volume unter
   dem Pfad /etc/secrets.

Siehe `pod.yaml`

---

## Feedback

### Zu 7.1: ⭐ 100% Perfekt

- Die CLI-Generatoren mit `--from-literal` hast du fehlerfrei angewendet.
- Genau so löst man das in Sekunden in der Prüfung.

### Zu 7.2: ⭐ 95% Richtig (Kleines Namens-Detail)

- **Secret-Volume-Mount:** Absolut fehlerfrei! Die Dateien `DB_USER` und
  `DB_PASS` liegen sauber unter `/etc/secrets/`.
- **ConfigMap-Env:** Der Wert wurde korrekt aus `app-config` extrahiert.
  - *Kleines Detail:* In der Aufgabenstellung sollte die Variable im Container
    den Namen **`UI_COLOR`** tragen.
  - In `pod.yaml` stand `env.name: APP_COLOR`.
  - **Unterschied:**
    - `env[].name` = Der Name der Variablen **im Container** (`UI_COLOR`)
    - `configMapKeyRef.key` = Der Key **in der ConfigMap** (`APP_COLOR`)

```yaml
      env:
        - name: UI_COLOR
          valueFrom:
            configMapKeyRef:
              name: app-config
              key: APP_COLOR
```
