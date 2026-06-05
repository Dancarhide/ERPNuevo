@echo off
echo Starting Backend...
cd server
start "ERP Backend" npm run dev
cd ..
echo Starting Frontend...
start "ERP Frontend" npm run dev
echo Application started. Check the new windows.
