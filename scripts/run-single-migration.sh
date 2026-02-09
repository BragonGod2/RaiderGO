#!/bin/bash

# Quick script to run a single SQL file
# Usage: ./scripts/run-single-migration.sh filename.sql

set -e

if [ -z "$1" ]; then
    echo "Usage: ./scripts/run-single-migration.sh filename.sql"
    exit 1
fi

MIGRATION_FILE="$1"

# Load environment variables from .env file
if [ -f ".env" ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

SUPABASE_URL="${VITE_SUPABASE_URL}"
PROJECT_REF=$(echo "$SUPABASE_URL" | sed -E 's|https://([^.]+)\.supabase\.co.*|\1|')

echo "🚀 Running migration: $MIGRATION_FILE"
echo "📍 Project: $PROJECT_REF"
echo ""

# Check if linked
if [ ! -f ".supabase/config.toml" ]; then
    echo "🔗 Linking to Supabase project..."
    supabase link --project-ref "$PROJECT_REF"
fi

# Run the migration
if [ -f "database/migrations/$MIGRATION_FILE" ]; then
    filepath="database/migrations/$MIGRATION_FILE"
elif [ -f "$MIGRATION_FILE" ]; then
    filepath="$MIGRATION_FILE"
else
    echo "❌ File not found: $MIGRATION_FILE"
    exit 1
fi

echo "📄 Executing $filepath..."
echo ""

cat "$filepath" | supabase db execute

echo ""
echo "✅ Migration completed!"
