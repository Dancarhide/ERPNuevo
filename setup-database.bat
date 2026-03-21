@echo off
echo Setting up database for ERP...
cd server
npm run db:create
npm run db:reset
npm run db:init
echo Database setup complete.
pause
