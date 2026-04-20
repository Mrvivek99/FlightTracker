@echo off
echo Starting Backend Server...
start cmd /k "cd server && npm run dev"

echo Starting Frontend Client...
start cmd /k "cd client && npm run dev"

echo Both servers are starting up in new windows!
echo - Frontend: http://localhost:3000
echo - Backend: http://localhost:5000
