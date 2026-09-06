#!/bin/bash
set -e

URL="$1"
if [ -z "$URL" ]; then
    echo "Usage: $0 <url>" >&2
    exit 1
fi

export DISPLAY=:1
export HOME=/config
export XDG_RUNTIME_DIR=/config/.XDG

# Retrieve DBUS_SESSION_BUS_ADDRESS from active xfce session if not set
if [ -z "$DBUS_SESSION_BUS_ADDRESS" ]; then
    SESSION_PID=$(pgrep -u abc -x xfce4-session 2>/dev/null | head -n1)
    if [ -n "$SESSION_PID" ] && [ -r "/proc/$SESSION_PID/environ" ]; then
        DBUS_VAR=$(tr '\0' '\n' < "/proc/$SESSION_PID/environ" | grep ^DBUS_SESSION_BUS_ADDRESS= || true)
        if [ -n "$DBUS_VAR" ]; then
            export "$DBUS_VAR"
        fi
    fi
    # Secondary fallback to active dbus socket in /tmp
    if [ -z "$DBUS_SESSION_BUS_ADDRESS" ]; then
        DBUS_SOCK=$(find /tmp -maxdepth 1 -name "dbus-*" -user abc 2>/dev/null | head -n1)
        if [ -n "$DBUS_SOCK" ]; then
            export DBUS_SESSION_BUS_ADDRESS="unix:path=$DBUS_SOCK"
        fi
    fi
fi

# Dispatch to running Firefox or launch a new instance cleanly
if pgrep -u abc -x firefox >/dev/null 2>&1; then
    exec firefox --new-tab "$URL"
else
    nohup /usr/bin/firefox "$URL" >/dev/null 2>&1 &
    exit 0
fi
