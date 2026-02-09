# Database Migrations

This directory contains SQL migration files for the RaiderGO database.

## Quick Start

### One-time setup

1. **Login to Supabase CLI:**
   ```bash
   supabase login
   ```
   This will open a browser to authenticate.

2. **Link your project:**
   ```bash
   npm run db:migrate
   ```
   The first time you run this, it will automatically link to your Supabase project.

### Running Migrations

Simply run:
```bash
npm run db:migrate
```

This will execute all migration files in the correct order:
1. `step1_create_tables.sql` - Core tables
2. `step2_indexes_triggers.sql` - Database indexes and triggers
3. `step3_rls_policies.sql` - Row Level Security policies
4. `create_user_profiles.sql` - User profiles table
5. `admin_center_schema.sql` - Admin center tables
6. `fix_courses_table.sql` - Courses table setup
7. `courses_rls_policies.sql` - Course access policies
8. `insert_simple_fake_data.sql` - Sample data for testing

## Migration Files

### Schema Migrations
- **step1_create_tables.sql** - Creates subscription_plans, user_subscriptions, purchases, analytics_events
- **step2_indexes_triggers.sql** - Adds indexes for performance and triggers for auto-updates
- **step3_rls_policies.sql** - Sets up security policies
- **create_user_profiles.sql** - User profile management
- **admin_center_schema.sql** - Admin dashboard tables
- **fix_courses_table.sql** - Courses table with all required fields
- **courses_rls_policies.sql** - Course access control

### Data Migrations  
- **insert_simple_fake_data.sql** - Sample revenue data and purchases for testing

## Manual Migration

If you prefer to run migrations manually:

```bash
supabase db execute --file database/migrations/step1_create_tables.sql --linked
```

## Troubleshooting

**Error: "Not logged in to Supabase CLI"**
```bash
supabase login
```

**Error: "Project not linked"**
The migration script will automatically link on first run, or you can manually link:
```bash
supabase link --project-ref YOUR_PROJECT_REF
```

**Error: "Permission denied: ./scripts/migrate.sh"**
```bash
chmod +x scripts/migrate.sh
```
