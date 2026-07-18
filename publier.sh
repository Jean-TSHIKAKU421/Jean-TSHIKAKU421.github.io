#!/bin/bash
clear
date_heure=$(date +"%Y-%m-%d %H:%M:%S")
git add .
sleep 1
clear
echo "Ajout des fichiers terminé avec succès."
sleep 1
clear
git commit -m "Publication du site le $date_heure"
echo "Commit effectué avec succès."
sleep 1
clear
git push
sleep 1
clear
echo "Mise à jour du site effectuée avec succès le $date_heure"
sleep 2
clear