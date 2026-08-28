# Database setup

This project uses Supabase for database and authentication.

## Running Migrations

Since we do not use a traditional migration runner (like Knex or Prisma), you need to apply the migrations manually using one of the following methods:

### Option 1: Supabase SQL Editor (Web UI)
1. Go to your Supabase project dashboard.
2. Navigate to the **SQL Editor** section on the left sidebar.
3. Click **New Query**.
4. Copy the contents of `backend/src/config/migrations/001_create_notes_table.sql` and paste it into the editor.
5. Click **Run**.

### Option 2: Supabase CLI
If you have the [Supabase CLI](https://supabase.com/docs/guides/cli) installed and linked to your project:
1. Copy the migration file to your `supabase/migrations` folder if you initialized Supabase locally.
2. Run `supabase db push` to push the changes to your remote database.

Alternatively, you can run a specific script directly against your database using standard Postgres CLI tools (e.g. `psql`) utilizing your Supabase database connection string.
