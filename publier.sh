#!/bin/bash
clear
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'
date_heure=$(date +"%Y-%m-%d %H:%M:%S")
echo -e "${BLUE}🚀 Déploiement - $date_heure${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "\n${YELLOW}📸 Optimisation des images...${NC}"
npm run optimize-images
sleep 1
clear
echo -e "${GREEN}✅ Optimisation terminée.${NC}"
sleep 1
clear
echo -e "${BLUE}📦 Ajout des fichiers...${NC}"
git add .
sleep 1
clear
echo -e "${GREEN}✅ Fichiers ajoutés.${NC}"
sleep 1
clear
git commit -m "Publication du site le $date_heure"
echo -e "${GREEN}✅ Commit effectué.${NC}"
sleep 1
clear
git push
sleep 1
clear
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Site mis à jour le $date_heure${NC}"
echo -e "${GREEN}🌐 https://jean-tshikaku421.github.io${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
sleep 2
clear