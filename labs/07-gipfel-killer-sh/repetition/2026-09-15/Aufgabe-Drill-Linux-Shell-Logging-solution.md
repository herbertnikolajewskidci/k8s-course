# Lösung & Notizen: Linux Shell Logging, Timestamps & YAML-Wrapping

## Notizen & Befehle

Aufgabe 1

```bash
cka-admin@cka5248:~$ export HOST_NODE="mein-test-node"
cka-admin@cka5248:~$ echo $(date)
#Wed Sep 16 08:45:07 UTC 2026
cka-admin@cka5248:~$ echo $HOST_NODE $(date)
#mein-test-node Wed Sep 16 08:45:23 UTC 2026
```

Aufgabe 2

```bash

cka-admin@cka5248:~$ echo $HOST_NODE $(date) >> /tmp/test-log.txt
cka-admin@cka5248:~$ echo $HOST_NODE $(date) >> /tmp/test-log.txt
cka-admin@cka5248:~$ cat /tmp/test-log.txt
# mein-test-node Wed Sep 16 08:48:27 UTC 2026
# mein-test-node Wed Sep 16 08:48:33 UTC 2026
```

Aufgabe 3

```bash

cka-admin@cka5248:~$ while true; do echo $HOST_NODE $(date) >> /tmp/test-log.txt; sleep 5; done
cka-admin@cka5248:~$ tail -n 3 /tmp/test-log.txt
# mein-test-node Wed Sep 16 08:56:32 UTC 2026
# mein-test-node Wed Sep 16 08:56:37 UTC 2026
# mein-test-node Wed Sep 16 08:56:42 UTC 2026
```

Aufgabe 4

```yaml
command:
  - sh
  - -c
args:
  - while true; do echo $HOST_NODE $(date) >> /tmp/test-log.txt; sleep 5; done
```

oder

```yaml
command:
  - sh
  - -c
args:
  - |
    while true; do
      echo $HOST_NODE $(date) >> /tmp/test-log.txt
      sleep 5
    done
```
