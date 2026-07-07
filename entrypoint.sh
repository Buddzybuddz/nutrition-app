#!/bin/sh
# Les migrations 1775*/1776* créent des collections qui existent déjà dans
# cette base de prod (bootstrap initial) — on ne les rejoue pas. Toutes les
# migrations plus récentes (peu importe leur préfixe) doivent être copiées :
# un filtre par préfixe figé (ex. "1782*") exclut silencieusement toute
# nouvelle migration créée après ce préfixe.

mkdir -p /pb/pb_migrations_active
for f in /pb/pb_migrations/*.js; do
    base=$(basename "$f")
    case "$base" in
        1775*|1776*) continue ;;
    esac
    cp "$f" /pb/pb_migrations_active/
done

exec /pb/pocketbase serve \
    --http=0.0.0.0:8080 \
    --migrationsDir=/pb/pb_migrations_active \
    --hooksDir=/pb/pb_hooks
