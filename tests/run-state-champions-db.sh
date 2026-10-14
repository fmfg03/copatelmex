#!/usr/bin/env bash
# Fresh Unix-socket-only cluster; never connects to an existing database.
set -euo pipefail
project_dir="$(cd "$(dirname "$0")/.." && pwd)"
pg_bin="${PG_BIN:-/usr/lib/postgresql/16/bin}"
test_dir="$(mktemp -d /tmp/champions-pg.XXXXXX)"
mkdir "$test_dir/socket"
if [ "$(id -u)" = 0 ]; then
  chown -R postgres:postgres "$test_dir"
  pg_run=(runuser -u postgres --)
else
  pg_run=()
fi
cleanup() {
  "${pg_run[@]}" "$pg_bin/pg_ctl" -D "$test_dir/data" -m immediate stop >/dev/null 2>&1 || true
}
trap cleanup EXIT
"${pg_run[@]}" "$pg_bin/initdb" -D "$test_dir/data" --auth=trust --no-locale -E UTF8 >/dev/null
"${pg_run[@]}" "$pg_bin/pg_ctl" -D "$test_dir/data" -l "$test_dir/server.log" -o "-k $test_dir/socket -p 55483 -c listen_addresses=''" -w start >/dev/null
"$pg_bin/psql" -h "$test_dir/socket" -p 55483 -U "$(if [ "$(id -u)" = 0 ]; then echo postgres; else id -un; fi)" -v ON_ERROR_STOP=1 \
  -f "$project_dir/tests/state-champions-fixture.sql" \
  -f "$project_dir/supabase/migrations/20261013120000_state_champions.sql" \
  -f "$project_dir/supabase/migrations/20261013130000_state_champions_team_names.sql" \
  -f "$project_dir/tests/state-champions-db.sql"
echo "PASS state champions SQL acceptance (disposable database)"
