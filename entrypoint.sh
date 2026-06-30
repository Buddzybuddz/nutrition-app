#!/bin/sh
# Seules les migrations 1782* sont nouvelles pour cette base de prod.
# Les collections 1775* existent déjà — on ne les rejoue pas.

mkdir -p /pb/pb_migrations_active
for f in /pb/pb_migrations/1782*.js; do
    [ -f "$f" ] && cp "$f" /pb/pb_migrations_active/
done

exec /pb/pocketbase serve \
    --http=0.0.0.0:8080 \
    --migrationsDir=/pb/pb_migrations_active \
    --hooksDir=/pb/pb_hooks
