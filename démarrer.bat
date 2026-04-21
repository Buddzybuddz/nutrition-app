@echo off
echo Lancement du serveur local NutriDash...
echo Une page web va s'ouvrir dans votre navigateur.
echo Laissez cette fenetre ouverte pour que l'application fonctionne !
echo.
start http://localhost:8000
python -m http.server 8000
