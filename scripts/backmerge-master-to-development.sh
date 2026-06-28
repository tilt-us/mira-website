#!/usr/bin/env bash
# Merges master back into development.
# Run this whenever an accidental push/merge to master happens.

set -e

CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)

echo "Fetching latest changes from origin..."
git fetch origin

echo "Switching to development..."
git checkout development
git pull origin development

echo "Merging master into development..."
git merge origin/master --no-ff -m "chore: backmerge master into development"

echo "Pushing development..."
git push origin development

echo "Done. Switching back to $CURRENT_BRANCH..."
git checkout "$CURRENT_BRANCH"
