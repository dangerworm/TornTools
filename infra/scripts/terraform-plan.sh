#!/usr/bin/env bash
# Run terraform plan with automatic state-lock retry.
# Writes tfplan on success and sets GITHUB_OUTPUT:
#   has_changes=true|false
set -euo pipefail

echo "📐 Running terraform plan..."

set +e
terraform plan -no-color -out=tfplan 2>&1 | tee plan_output.txt
exit_code=$?
set -e

if grep -q "Error acquiring the state lock" plan_output.txt; then
  echo "🔒 State lock detected. Attempting to force unlock..."

  LOCK_ID=$(grep -A1 "Lock Info:" plan_output.txt | grep "ID:" | awk '{print $2}')
  if [ -z "$LOCK_ID" ]; then
    echo "❌ Could not determine lock ID. Aborting unlock."
    cat plan_output.txt
    exit 1
  fi

  echo "🔓 Lock ID: $LOCK_ID. Unlocking..."
  terraform force-unlock -force "$LOCK_ID"

  echo "🔁 Retrying terraform plan..."
  set +e
  terraform plan -no-color -out=tfplan 2>&1 | tee plan_output.txt
  exit_code=$?
  set -e
fi

if [ "$exit_code" -ne 0 ]; then
  echo "❌ Terraform plan failed:"
  cat plan_output.txt
  exit $exit_code
fi

if grep -q 'No changes. Your infrastructure matches the configuration.' plan_output.txt; then
  echo "has_changes=false" >> "$GITHUB_OUTPUT"
  echo "✅ No changes detected in infrastructure."
else
  echo "has_changes=true" >> "$GITHUB_OUTPUT"
  echo "🚧 Changes detected — proceeding with apply."
fi
