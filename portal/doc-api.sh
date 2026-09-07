#!/bin/bash
# Doc Opener Microservice Lifecycle Manager

PIDFILE="/var/run/cka-doc-api.pid"
LOGFILE="/var/log/cka-doc-api.log"
SCRIPT="/mnt/user/appdata/cka-psi-portal/api-server.py"

case "$1" in
  start)
    if [ -f "$PIDFILE" ] && kill -0 "$(cat "$PIDFILE")" 2>/dev/null; then
      echo "Doc API is already running with PID $(cat "$PIDFILE")"
      exit 0
    fi
    echo "Starting Doc API server on port 8092..."
    nohup python3 "$SCRIPT" </dev/null >> "$LOGFILE" 2>&1 &
    echo $! > "$PIDFILE"
    echo "Started Doc API server with PID $(cat "$PIDFILE")"
    ;;
  stop)
    if [ -f "$PIDFILE" ]; then
      PID=$(cat "$PIDFILE")
      echo "Stopping Doc API server (PID $PID)..."
      kill "$PID" 2>/dev/null || true
      rm -f "$PIDFILE"
    fi
    pkill -f "python.*api-server.py" 2>/dev/null || true
    echo "Stopped Doc API server."
    ;;
  restart)
    $0 stop
    sleep 1
    $0 start
    ;;
  status)
    if [ -f "$PIDFILE" ] && kill -0 "$(cat "$PIDFILE")" 2>/dev/null; then
      echo "Doc API is running with PID $(cat "$PIDFILE")"
      exit 0
    else
      echo "Doc API is stopped"
      exit 1
    fi
    ;;
  *)
    echo "Usage: $0 {start|stop|restart|status}"
    exit 1
    ;;
esac
