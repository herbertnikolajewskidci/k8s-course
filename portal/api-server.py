#!/usr/bin/env python3
"""
CKA Exam Simulator - Doc Opener Microservice
Listens on port 8092 and dispatches documentation URLs to Firefox in cka-psi-webtop.
"""
import datetime
import http.server
import json
import logging
import os
import re
import socketserver
import subprocess
import urllib.parse

PORT = 8092
CONTAINER_NAME = "cka-psi-webtop"
DATA_DIR = os.path.dirname(os.path.abspath(__file__))
FLAGS_FILE = os.path.join(DATA_DIR, "drill-flags.json")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)

def get_drill_flags() -> dict:
    """Read drill flags from JSON file or return default empty state."""
    if os.path.exists(FLAGS_FILE):
        try:
            with open(FLAGS_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            logging.error("Failed to read drill-flags.json: %s", str(e))
    return {"drillFlags": [], "updatedAt": None}

def save_drill_flags(flags: list) -> dict:
    """Save drill flags list to JSON file atomically."""
    cleaned_flags = sorted(list(set(int(x) for x in flags if str(x).isdigit() and int(x) > 0)))
    data = {
        "drillFlags": cleaned_flags,
        "updatedAt": datetime.datetime.now(datetime.timezone.utc).isoformat()
    }
    tmp_file = f"{FLAGS_FILE}.tmp"
    try:
        with open(tmp_file, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
        os.replace(tmp_file, FLAGS_FILE)
        logging.info("Updated drill flags: %s", cleaned_flags)
        return data
    except Exception as e:
        logging.error("Failed to save drill-flags.json: %s", str(e))
        if os.path.exists(tmp_file):
            os.remove(tmp_file)
        raise

def open_url_in_firefox(url: str) -> tuple[bool, str]:
    """Execute the open-doc.sh helper inside the cka-psi-webtop container."""
    if not url or not re.match(r"^https?://[a-zA-Z0-9\-\.]+", url):
        return False, f"Invalid URL scheme or format: {url}"

    cmd = [
        "docker", "exec", "-u", "abc", CONTAINER_NAME,
        "/config/open-doc.sh", url
    ]
    try:
        proc = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
        if proc.returncode == 0:
            logging.info("Successfully dispatched URL to Firefox: %s", url)
            return True, "URL opened successfully in remote desktop Firefox"
        else:
            err_msg = proc.stderr.strip() or proc.stdout.strip() or "Process exited with error"
            logging.error("Execution error (exit %d): %s", proc.returncode, err_msg)
            return False, f"Execution failed: {err_msg}"
    except subprocess.TimeoutExpired:
        logging.error("Execution timed out after 10 seconds for URL: %s", url)
        return False, "Execution timed out"
    except Exception as e:
        logging.error("Exception when executing docker command: %s", str(e))
        return False, str(e)

class ThreadingHTTPServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True

class DocHandler(http.server.BaseHTTPRequestHandler):
    def _send_cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")

    def do_OPTIONS(self):
        self.send_response(204)
        self._send_cors_headers()
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path.rstrip("/")

        if path in ("", "/health", "/api/health"):
            self.send_response(200)
            self._send_cors_headers()
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"status": "ok", "service": "exam-portal-api"}).encode())
            return

        if path in ("/drill-flags", "/api/drill-flags"):
            data = get_drill_flags()
            self.send_response(200)
            self._send_cors_headers()
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps(data).encode())
            return

        if path in ("/open-doc", "/api/open-doc"):
            params = urllib.parse.parse_qs(parsed.query)
            url = params.get("url", [None])[0]
            if not url:
                self.send_response(400)
                self._send_cors_headers()
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"error": "Missing 'url' parameter"}).encode())
                return

            success, msg = open_url_in_firefox(url)
            status_code = 200 if success else 500
            self.send_response(status_code)
            self._send_cors_headers()
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"success": success, "message": msg, "url": url}).encode())
            return

        self.send_response(404)
        self._send_cors_headers()
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps({"error": "Not Found"}).encode())

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path.rstrip("/")

        if path in ("/drill-flags", "/api/drill-flags"):
            content_length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_length).decode("utf-8") if content_length > 0 else "{}"
            try:
                payload = json.loads(body)
            except Exception:
                payload = {}

            current = get_drill_flags()
            current_flags = set(current.get("drillFlags", []))

            if "drillFlags" in payload and isinstance(payload["drillFlags"], list):
                updated = save_drill_flags(payload["drillFlags"])
            elif "toggleQuestion" in payload:
                q_id = int(payload["toggleQuestion"])
                if q_id in current_flags:
                    current_flags.remove(q_id)
                else:
                    current_flags.add(q_id)
                updated = save_drill_flags(list(current_flags))
            elif "addQuestion" in payload:
                current_flags.add(int(payload["addQuestion"]))
                updated = save_drill_flags(list(current_flags))
            elif "removeQuestion" in payload:
                current_flags.discard(int(payload["removeQuestion"]))
                updated = save_drill_flags(list(current_flags))
            else:
                self.send_response(400)
                self._send_cors_headers()
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"error": "Invalid payload. Provide 'drillFlags' or 'toggleQuestion'"}).encode())
                return

            self.send_response(200)
            self._send_cors_headers()
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"success": True, **updated}).encode())
            return

        if path in ("/drill-flags/reset", "/api/drill-flags/reset"):
            updated = save_drill_flags([])
            self.send_response(200)
            self._send_cors_headers()
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"success": True, **updated}).encode())
            return

        if path in ("/open-doc", "/api/open-doc"):
            content_length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_length).decode("utf-8") if content_length > 0 else ""
            url = None
            try:
                data = json.loads(body)
                url = data.get("url")
            except Exception:
                pass

            if not url:
                params = urllib.parse.parse_qs(parsed.query)
                url = params.get("url", [None])[0]

            if not url:
                self.send_response(400)
                self._send_cors_headers()
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"error": "Missing 'url' parameter"}).encode())
                return

            success, msg = open_url_in_firefox(url)
            status_code = 200 if success else 500
            self.send_response(status_code)
            self._send_cors_headers()
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"success": success, "message": msg, "url": url}).encode())
            return

        self.send_response(404)
        self._send_cors_headers()
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps({"error": "Not Found"}).encode())

    def log_message(self, format, *args):
        logging.info("%s - [%s] %s" % (self.client_address[0], self.log_date_time_string(), format % args))

if __name__ == "__main__":
    server = ThreadingHTTPServer(("0.0.0.0", PORT), DocHandler)
    logging.info("Doc Opener microservice listening on port %d...", PORT)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
