#!/bin/bash
set -e

cd "$(dirname "$0")"

echo "================================================"
echo "  Lowe's Installation Services Platform"
echo "  Starting up..."
echo "================================================"
echo ""

# Kill any processes on our ports
echo "[1/6] Cleaning up ports 4002 and 4003..."
lsof -ti:4002 | xargs kill -9 2>/dev/null || true
lsof -ti:4003 | xargs kill -9 2>/dev/null || true
sleep 1
echo "  Ports cleared."

# Check PostgreSQL
echo ""
echo "[2/6] Checking PostgreSQL..."
if ! pg_isready -q 2>/dev/null; then
  echo "  PostgreSQL is not running. Attempting to start..."
  brew services start postgresql 2>/dev/null || pg_ctl start -D /usr/local/var/postgres 2>/dev/null || true
  sleep 2
fi
echo "  PostgreSQL is ready."

# Create database if it doesn't exist
echo ""
echo "[3/6] Setting up database..."
psql -U postgres -tc "SELECT 1 FROM pg_database WHERE datname='lowes_install_scheduling'" | grep -q 1 || \
  createdb -U postgres lowes_install_scheduling 2>/dev/null || true
echo "  Database lowes_install_scheduling ready."

# Install dependencies
echo ""
echo "[4/6] Installing dependencies..."
cd backend && npm install --silent 2>/dev/null && cd ..
cd frontend && npm install --silent 2>/dev/null && cd ..
echo "  Dependencies installed."

# Seed database
echo ""
echo "[5/6] Seeding database with Lowe's installation services data..."
cd backend && node seed.js && cd ..
echo "  Database seeded successfully."

# Start servers
echo ""
echo "[6/6] Starting servers with hot reload..."
echo ""
echo "================================================"
echo "  Backend:  http://localhost:4003"
echo "  Frontend: http://localhost:4002"
echo "  Login:    admin@lowes.com / password123"
echo "================================================"
echo ""

# Start backend with nodemon for hot reload
cd backend && npx nodemon server.js &
BACKEND_PID=$!

# Start frontend with React dev server (auto hot reload)
cd frontend && PORT=4002 npm start &
FRONTEND_PID=$!

# Handle shutdown
trap "echo 'Shutting down...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" SIGINT SIGTERM

wait
