# Aufgabe Q16: Pending Pod Forensics (Taints & Constraints)

- **CKA Domäne:** Troubleshooting (30%)
- **Lernberg-Stufe:** Gipfel (Exam Pace & Troubleshooting)
- **Cluster & Host:** `ssh cka3200`
- **Wiederholungs-Grund:** Teilweise bestanden (4/8 Punkte, Node-Label fehlte)

---

## 1. Wissensnetz & Mentales Modell (Birkenbihl)

Wenn ein Pod im Zustand `Pending` feststeckt, schreit er nicht ins Leere –
er hinterlässt einen **Polizeibericht** in seinen Events:

- **Der 1. Blick gehört immer den Events:**
  `kubectl describe pod <name> | tail -n 15`
  Hier steht wörtlich, welcher Filter des Schedulers zugeschlagen hat:
  - `0/1 nodes are available: 1 node(s) had untolerated taint ...`
  - `0/1 nodes are available: 1 node(s) didn't match Pod's node selector ...`
- **Das Schloss-und-Schlüssel-Prinzip:**
  - **Tolerations:** Der Node hat eine Dorne (`Taint`). Nur ein Pod mit der
    passenden Schutzkappe (`Toleration`) darf dort geplant werden.
  - **NodeSelector / Affinity:** Der Pod verlangt eine bestimmte Eigenschaft
    vom Node (z. B. `hardware-tier=compute-optimized`). Fehlt dem Node dieses
    Label, weigert sich der Scheduler, den Pod dort abzusetzen.

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

Im Namespace `scheduling-trouble` verharrt der Pod `critical-processor`
hartnäckig im Zustand `Pending`.

### Aufgabe 1: Event-Forensik durchführen

1. Untersuche den Pod:

   ```bash
   kubectl describe pod critical-processor -n scheduling-trouble
   ```

2. Analysiere die letzten Zeilen (`Events`):
   Identifiziere die beiden Hürden (Taint-Konflikt und NodeSelector-Mangel).

### Aufgabe 2: Node cka3200 anpassen & Pod zum Laufen bringen

1. Beseitige den störenden Taint auf Node `cka3200`:

   ```bash
   kubectl taint nodes cka3200 maintenance=true:NoSchedule-
   ```

2. Verleihe dem Node das geforderte Label:

   ```bash
   kubectl label node cka3200 hardware-tier=compute-optimized --overwrite
   ```

3. Beobachte, wie der Pod `critical-processor` ohne Neustart innerhalb von
   Sekunden in den Zustand `1/1 Running` übergeht.

---

## 3. Deine Lösung (Befehle / Manifeste / Notizen)

### Lösung 1

```bash
# Deine Befehle / Notizen
```

---

## 4. Spickzettel & Doku-Hilfen

- **kubernetes.io Suchbegriff:** `taints and tolerations node selector`
- **Zielseite & Klickpfad:**
  `Concepts -> Scheduling, Preemption and Eviction -> Taints and Tolerations`
- **In-Page Suche (Strg+F):** `kubectl taint` oder `nodeSelector`
- **In-Terminal Fastpath:**
  - `kubectl get node --show-labels`
  - `kubectl describe node cka3200 | grep Taints`

---

## 5. Feedback & Korrekturen

Noch keine Einreichung vorhanden.
Nach deiner Bearbeitung folgt hier das direkte Review.
