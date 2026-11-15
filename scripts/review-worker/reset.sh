#!/usr/bin/env bash
# Restores the reviewer fixture to its original files. Run by
# elix-review-reset.timer daily at 09:00 UTC.
set -euo pipefail

systemctl stop elix-review.service
trap 'systemctl start elix-review.service' EXIT
runuser -u elix-review -- env HOME=/var/lib/elix-review \
  node /var/lib/elix-review/elix/scripts/prepare-app-review-workspace.mjs --reset
