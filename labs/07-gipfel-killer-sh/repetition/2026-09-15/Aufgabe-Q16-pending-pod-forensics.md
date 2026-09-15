# Aufgabe Q16: Pending Pod Forensics (Taints & Constraints)

- **CKA Domäne:** Troubleshooting (30%)
- **Lernberg-Stufe:** Gipfel (Exam Pace & Troubleshooting)
- **Cluster & Host:** `ssh cka3200`
- **Wiederholungs-Grund:** Im Simulator-Lauf gelöst (8/8 Punkte nach Verifier-Korrektur)

---

## 1. Wissensnetz & Mentales Modell (Birkenbihl)

Wenn Pods im Zustand `Pending` feststecken, schreit das System nicht ins Leere –
es hinterlässt einen **Polizeibericht** in den Events:

- **Der 1. Blick gehört immer den Events:**
  `kubectl describe pod <name> -n <ns> | tail -n 15`
  Hier steht wörtlich, welcher Filter des Schedulers zugeschlagen hat:
  - `0/1 nodes are available: 1 node(s) had untolerated taint ...`
  - `0/1 nodes are available: 1 node(s) didn't match Pod's node selector ...`
- **Das Schloss-und-Schlüssel-Prinzip:**
  - **NodeSelector:** Das Deployment fordert `hardware-tier: accelerator`.
    Fehlt dem Node dieses exakte Label, weigert sich der Scheduler, die
    Replicas dort zu platzieren.
  - Sobald der Node mit `kubectl label node <node> hardware-tier=accelerator`
    gelabelt wird, startet der Scheduler die Replicas sofort ohne Neustart!

**KaWa FORENSIK:**

- **F**ehlermeldung wortwörtlich dekodieren
- **O**rchestrierungs-Events analysieren (`describe pod`)
- **R**essourcen- und Taint-Abgleich
- **E**ntfernen oder Anpassen unpassender Taints
- **N**odeSelector-Labels auf dem Node prüfen (`kubectl get nodes --show-labels`)
- **S**chlüssel-Werte-Paare exakt tippen
- **I**nspektion des Schedulers
- **K**eine Vermutungen ohne Event-Beweis!

---

## 2. Aufgabenstellung (Repetition Q16)

Host für diese Aufgabe: `ssh cka3200`.

Im Namespace `wp-forensics` verharren die Replicas des Deployments
`analytics-pipeline` im Zustand `Pending`.

### Aufgabe 1: Event-Forensik durchführen

1. Untersuche einen der wartenden Pods:

   ```bash
   kubectl describe pod -l app=analytics-pipeline -n wp-forensics | grep -A 8 Events:
   ```

2. Analysiere die Fehlermeldung:
   Identifiziere den geforderten `nodeSelector` (`hardware-tier=accelerator`).

### Aufgabe 2: Node cka3200 anpassen & Replicas zum Laufen bringen

1. Kontrolliere die vorhandenen Labels auf Node `cka3200`:

   ```bash
   kubectl get node cka3200 --show-labels
   ```

2. Verleihe dem Node das geforderte Label:

   ```bash
   kubectl label node cka3200 hardware-tier=accelerator --overwrite
   ```

3. Beobachte mit `kubectl get pods -n wp-forensics -w`, wie alle Replicas
   sofort in den Zustand `1/1 Running` übergehen.

---

## 3. Spickzettel & Doku-Hilfen

- **kubernetes.io Suchbegriff:** `taints and tolerations node selector`
- **Zielseite & Klickpfad:**
  `Concepts -> Scheduling, Preemption and Eviction -> Taints and Tolerations`
- **In-Page Suche (Strg+F):** `kubectl taint` oder `nodeSelector`
- **In-Terminal Fastpath:**
  - `kubectl get node --show-labels`
  - `kubectl describe node cka3200 | grep Taints`

---

## 4. Feedback & Korrekturen

Noch keine Einreichung vorhanden.
Nach deiner Bearbeitung folgt hier das direkte Review.
