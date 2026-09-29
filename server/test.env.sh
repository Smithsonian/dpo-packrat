# Bash-sourceable test environment for running the server test suite locally.
#
# WHY: the test runner needs PACKRAT_DATABASE_URL set. env.DEV.bat is cmd-only
# (not sourceable by bash) and carries the full prod secret set; this file is a
# minimal, bash-friendly alternative holding only what the tests need.
#
# SETUP (once):
#   cp server/test.env.sh.template server/test.env.sh
#   # then edit test.env.sh and replace <DEV_DB_PASSWORD> with the dev DB root
#   # password (the packrat-db container credential — dev-only, low-sensitivity).
# test.env.sh is gitignored and must never be committed.
#
# USAGE (single command — shell state does not persist between calls):
#   cd server && source test.env.sh && yarn test --testPathPattern="tests/utils"
#
# NOTES:
# - setEnvVars.ts rewrites the DB name to Packrat_test automatically, and the
#   test guardrail refuses any non-*_test schema or non-local host, so this can
#   never touch the dev/prod databases.
# - Real prod secrets (LDAP / Slack / EDAN keys) are intentionally NOT here.
#   Live-network suites (EdanCollection, email) are excluded from hermetic runs
#   via --testPathPattern rather than by supplying credentials.
# - Pure-logic categories (e.g. tests/utils/sceneScale) do not connect to the DB
#   and pass the guardrail with any valid-looking Packrat_test URL.

# Dev database. host+port must match the packrat-db container publish (3388).
# The DB name is irrelevant (rewritten to Packrat_test); host must be local.
export PACKRAT_DATABASE_URL='mysql://root:SI@localhost:3388/Packrat'

# Dummy EDAN key (NOT a secret). collections/impl/index.ts throws at module-load
# without it, and globalTeardown (teardown.ts) loads that chain outside the
# setEnvVars context. This placeholder satisfies the check; real-EDAN suites are
# excluded from hermetic runs, so no genuine key is needed.
export PACKRAT_EDAN_AUTH_KEY='testing1234'
