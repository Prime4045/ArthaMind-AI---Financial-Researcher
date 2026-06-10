@echo off
cd /d "e:\Projects\Financial Research Automation"
git add -A
git commit -m "chore: clean project structure - remove duplicate and cache files"
git push origin main
echo Done!
