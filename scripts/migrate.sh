#!/bin/bash

# Database Migration Script
# This script runs all SQL migrations in order using the Supabase CLI

set -e

echo "🚀 Starting database migrations..."
echo ""

# Load environment variables from .env file
if [ -f ".env" ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

SUPABASE_URL="${VITE_SUPABASE_URL}"
PROJECT_REF=$(echo "$SUPABASE_URL" | sed -E 's|https://([^.]+)\.supabase\.co.*|\1|')

echo "📍 Project: $PROJECT_REF"
echo ""

# Check if supabase CLI is logged in
if ! supabase projects list &> /dev/null; then
    echo "⚠️  Not logged in to Supabase CLI"
    echo "Please run: supabase login"
    exit 1
fi

# Link to project if not already linked
if [ ! -f ".supabase/config.toml" ]; then
    echo "🔗 Linking to Supabase project..."
    supabase link --project-ref "$PROJECT_REF" || {
        echo "❌ Failed to link project. Please check your project ref."
        exit 1
    }
fi

# Run migrations in order
MIGRATIONS=(
    "step1_create_tables.sql"
    "step2_indexes_triggers.sql"
    "step3_rls_policies.sql"
    "create_user_profiles.sql"
    "admin_center_schema.sql"
    "fix_courses_table.sql"  
    "courses_rls_policies.sql"
    "insert_simple_fake_data.sql"
    "insert_2025_sales_data.sql"
)

SUCCESS_COUNT=0
FAIL_COUNT=0
SKIP_COUNT=0

for migration in "${MIGRATIONS[@]}"; do
    filepath="database/migrations/$migration"
    
    if [ ! -f "$filepath" ]; then
        echo "⏭️  Skipping $migration (not found)"
        ((SKIP_COUNT++))
        continue
    fi
    
    echo "📄 Running $migration..."
    
    # Execute SQL file using psql through supabase
    if supabase db execute < "$filepath"; then
        echo "✅ $migration executed successfully"
        ((SUCCESS_COUNT++))
    else
        echo "❌ Failed to execute $migration"
        ((FAIL_COUNT++))
        break
    fi
    
    echo ""
    sleep 0.5
done

echo "=================================================="
echo "📊 Migration Summary:"
echo "✅ Successful: $SUCCESS_COUNT"
echo "❌ Failed: $FAIL_COUNT"
echo "⏭️  Skipped: $SKIP_COUNT"
echo "=================================================="

if [ $FAIL_COUNT -gt 0 ]; then
    exit 1
fi

echo ""
echo "🎉 All migrations completed successfully!"
