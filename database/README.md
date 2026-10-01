# Supabase Setup

The app connects to Supabase's PostgreSQL database using the `pg` driver. Registration and login require the authentication and citizen-profile tables created by the initial migration.

1. In Supabase, open **Project Settings → Database** and copy the connection string. Use the direct connection when the development machine supports IPv6; otherwise choose the Session pooler connection string.
2. Set `DATABASE_URL` in the ignored `.env.local` file. URL-encode reserved characters in the password (for example, `@` as `%40`) and add `?sslmode=require` to the connection string. Do not commit `.env.local` or share its contents.
3. Keep `AUTH_SECRET` in `.env.local` set to a randomly generated secret of at least 32 characters.
4. In the Supabase **SQL Editor**, run `database/migrations/001_auth.sql` if it has not already been applied, then run `database/migrations/002_grievances.sql`.
5. Start the app with `npm run dev`, register a citizen account if needed, and create a grievance through `/citizen/submit`.

Registration and login require the authentication migration; grievance endpoints require both migrations. Grievance attachments currently persist metadata only: image data remains available to the existing client-side preview/vision flow, but no image binary or data URL is stored in PostgreSQL until object storage is configured. No database credentials belong in source control. Officer/admin provisioning and persistence for remaining non-grievance demo workflows are separate implementation phases.