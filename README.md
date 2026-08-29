# Shanti Sangha

React/Vite public website with a cPanel-compatible PHP + MySQL backend foundation.

## Architecture

- **React + Vite** — public website and Admin Dashboard UI
- **PHP + PDO** — backend API for cPanel hosting
- **MySQL/MariaDB** — application database
- **`/uploads/`** — images and videos stored on the same hosting account

## Backend setup (cPanel)

1. Create a MySQL database and database user from cPanel.
2. Import `database/schema.sql` using phpMyAdmin.
3. Copy `api/config.example.php` to `api/config.php`.
4. Add the cPanel database name, user, password, and production URL.
5. Keep `api/config.php` out of GitHub; it is already ignored by `.gitignore`.
6. The future API modules will live under `api/` and use the shared PDO connection.

## Upload storage

The `uploads/` directory is reserved for production media. Gallery images and videos will be uploaded there through the PHP API, while MySQL stores only their file paths and metadata.

## Admin management — Step 9

The Settings module supports multiple administrators. Each admin has a name, email, phone number, profile image, role and active status. Super Admins can create, edit, activate/deactivate and delete other admin accounts. Admins can update their own profile and password.

Run `database/step9_admin_management.sql` once after the Step 8 migration. Profile images are stored under `uploads/admins/`.

## Important

The current milestone adds the admin authentication foundation. The PHP API uses secure password hashing and an HttpOnly session cookie; the one-time create-admin utility must be deleted from the production server after the first admin is created. CRUD modules will be added module-by-module so each part can be tested independently.


## V12 — MySQL Dashboard Connection

Step 3 adds `api/dashboard.php`, a session-protected PHP endpoint that reads live counts from MySQL. The Admin Dashboard fetches these values after login.

### cPanel setup
1. Create a MySQL database and database user in cPanel.
2. Open phpMyAdmin and import `database/schema.sql`.
3. Copy `api/config.example.php` to `api/config.php`.
4. Put the cPanel database name, username and password in `api/config.php`.
5. Set a long random `setup_token`.
6. Use `api/create-admin.php` once to create the first admin, then delete that file from the server.
7. Keep `api/config.php` out of GitHub.

The Vite development server cannot execute PHP by itself. The live MySQL API will work when the project is served through PHP on cPanel (or another PHP-capable local server).


## STEP 12 — Donation + Activity YouTube Videos

1. Import `database/step12_donation_and_videos.sql` into the same `shanti_sangha` database after the previous migrations.
2. The homepage now has a **সহযোগিতা করুন / Donation** section directly after **রক্ত সেবা**.
3. Super Admin → **অনুদান** can edit:
   - bKash, Nagad and Bank account information
   - section title/description/instructions
   - every public donation form field (add/remove, label, type, required, enabled, select options)
   - donation submission status
4. Visitors click a payment method or the Donation Form button to open a popup and submit their donation/payment reference details.
5. Super Admin → **কার্যক্রম** can add multiple YouTube videos to each activity.
6. On the public activity detail page, a video thumbnail opens a YouTube player popup and starts playback.
