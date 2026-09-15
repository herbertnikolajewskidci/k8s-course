#!/usr/bin/env bash
# CKA Exam Simulator - Verification Suite Wrapper
# Executes the multi-cluster verification engine and outputs the score & gap analysis.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
python3 "${SCRIPT_DIR}/verify-all-17.py" "$@"
