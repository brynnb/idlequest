# EQ: GoServer

EQ: GoServer is an emulated EverQuest server in Go.

## Requirements

- Go version 1.24 https://go.dev/doc/install
- MySQL
  - Windows: https://dev.mysql.com/doc/mysql-installation-excerpt/5.7/en/windows-installation.html
  - Linux: https://dev.mysql.com/doc/mysql-installation-excerpt/5.7/en/linux-installation.html
  - Mac: https://dev.mysql.com/doc/mysql-installation-excerpt/5.7/en/macos-installation.html
- NodeJS + npm https://nodejs.org/en/download
- Local port 443 available (This could be worked around but we're not there yet)

## Nice to have

- VSCode https://code.visualstudio.com/download
- Make (Windows users can just use CLI commands instead but Make makes things easy)

# Setting up Local Development

In order to start the server, you must first install MySQL and seed the database from the latest template db `eqgo`

### MySQL

You can either run a standalone MySQL/MariaDB instance, or reuse the **MariaDB container from the `akk-stack` Docker project**.

#### Option A: Standalone MySQL (original flow)

- Download the dump file: https://eqgoserver.blob.core.windows.net/dev/eqgo.sql.zip
- Extract it anywhere
- CD to the directory the `dumpfile.sql` lives in and run
  - `mysql -u [username] -p[password] -e "CREATE DATABASE IF NOT EXISTS eqgo"`
  - `mysql -u[username] -p[password] eqgo < dumpfile.sql`
- Verify the database is populated and running

#### Option B: Reuse `akk-stack` MariaDB (Docker)

If you already run the EverQuest `akk-stack` project, you can point EQ: GoServer at its MariaDB container instead of maintaining a separate MySQL install.

- Start the `akk-stack` Docker stack so that the `mariadb` service is running and exposes:
  - Host: `127.0.0.1`
  - Port: `3306`
  - User: `eqemu`
  - Password: value from `MYSQL_PASSWORD` env (for example `FQGEIPZD8ebDfUMpucR7UFGBVWpcqmz` in a default dev setup)
  - Database: `peq`
- Update `internal/config/eqgo_config.json` in this repo to match:
  - `"db_host": "127.0.0.1"`
  - `"db_port": 3306`
  - `"db_user": "eqemu"`
  - `"db_pass": "<your akk-stack MYSQL_PASSWORD>"`
  - `"db_name": "peq"`
- The Go server will then connect directly to the `akk-stack` MariaDB instead of a standalone MySQL instance.

### Config

- Under the directory `server/internal/config` there's a template called `eqgo_config_template.json`, copy that and rename it `eqgo_config.json`
- Fill out all the necessary credentials to connect to your MySQL DB
- Go to `server/internal/config` and generate `key.pem` with
  - `openssl genpkey -algorithm RSA -out key.pem -pkeyopt rsa_keygen_bits:2048`
- To avoid error when using `make` or `go run`, create a [Discord application](https://discord.com/developers/docs/quick-start/getting-started#step-1-creating-an-app), get your bot token, and paste it into `discord.txt` inside `server/internal/config`

### Data Migrations

After setting up the database, run migrations to add additional tables:

```bash
# Create eqstr_us table (localized strings for spell descriptions, etc.)
mysql -u root eqgo < migrations/002_create_eqstr_us_table.sql

# Import eqstr_us data from client text file
cd migrations && ./import_eqstr_us.sh

# Create char_create_data table (deity/city/race/class/stat descriptions for character creation)
mysql -u root eqgo < migrations/003_create_char_create_data_table.sql
mysql -u root eqgo < migrations/004_add_alt_name_to_char_create_data.sql

# Import character creation data from eqstr_us.txt
cd migrations && ./import_char_create_data.sh
```

**Note:** All import scripts use shared database configuration from `db_config.sh`. You can override defaults with environment variables:

```bash
DB_USER=myuser DB_PASS=mypass DB_NAME=mydb ./import_char_create_data.sh
```

### Ready to launch

- For the rest of the commands you should be cd into `server` in the root directory
- If you have Make, you can run `make s` to run the server, see the Makefile for the rest of the commands
- If you _don't_ have Make (on Windows) then you can run `go run ./cmd/server` to start the server
- If you want to debug in VSCode, there are launch options to start normally and with local quests. Local quests allow you to hot swap quests out every time you save.

You are now ready to connect and should be able to visit the local webpack development server and connect to your local backend

https://eqgoserver.blob.core.windows.net/dev/eqgo.sql.zip

## WebTransport local development

IdleQuest uses WebTransport over HTTP/3 between the React client (Vite) and this Go server. The local setup involves a short-lived dynamic certificate, a hash server on port 7100, a Vite `/api/hash` proxy, and a pinned connection to `https://127.0.0.1/eq`.

For a detailed, step-by-step explanation of this flow and how it mirrors the `eqrequiem` reference project, see:

- `docs/webtransport-local-dev.md` in the repo root.
