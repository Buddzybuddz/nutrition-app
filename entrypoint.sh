#!/bin/sh
# Marque les migrations déjà appliquées manuellement via l'admin PocketBase
# avant que le serveur démarre, pour éviter le crash "collection already exists".

OLD_MIGRATIONS="
1775760224_created_user_data.js
1775762200_updated_users.js
1775762485_updated_users.js
1775763772_created_profiles.js
1775805747_updated_profiles.js
1775805851_created_daily_stats.js
1775806018_created_meals.js
1775806274_created_activities_log.js
1775806336_created_weigh_ins.js
1775806426_created_goal_history.js
1775806645_updated_profiles.js
1775823266_updated_profiles.js
1775824016_updated_goal_history.js
1776454573_updated_profiles.js
"

for DB in /pb/pb_data/data.db /pb/pb_data/auxiliary.db; do
    if [ -f "$DB" ]; then
        sqlite3 "$DB" "CREATE TABLE IF NOT EXISTS _migrations (file TEXT PRIMARY KEY NOT NULL, applied INTEGER NOT NULL);" 2>/dev/null || true
        for m in $OLD_MIGRATIONS; do
            [ -z "$m" ] && continue
            sqlite3 "$DB" "INSERT OR IGNORE INTO _migrations (file, applied) VALUES ('$m', unixepoch());" 2>/dev/null || true
        done
    fi
done

exec /pb/pocketbase serve --http=0.0.0.0:8080
