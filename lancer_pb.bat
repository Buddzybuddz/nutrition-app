@echo off
echo Démarrage du serveur PocketBase...
echo L'interface d'administration sera disponible sur : http://127.0.0.1:8091/_/
cd pb
pocketbase.exe serve --http 127.0.0.1:8091
pause
