#!/bin/bash

echo "Starting AlphaInsure AI-Powered Insurance System..."
echo "==============================================="

# Function to check if port is available
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "Port $port is already in use"
        return 1
    fi
    return 0
}

# Check required ports
echo "Checking ports..."
check_port 3000 || { echo "Frontend port 3000 is busy"; exit 1; }
check_port 3001 || { echo "Backend port 3001 is busy"; exit 1; }
check_port 5000 || { echo "AI Engine port 5000 is busy"; exit 1; }

echo ""
echo "[1/3] Starting AI Engine (Python Flask)..."
cd ai-engine
python3 app.py &
AI_PID=$!

echo "[2/3] Starting Backend API (Node.js Express)..."
cd ../backend
npm run dev &
BACKEND_PID=$!

echo "[3/3] Starting Frontend (Next.js)..."
cd ../frontend
npm run dev &
FRONTEND_PID=$!

echo ""
echo "System started successfully!"
echo "========================"
echo ""
echo "Services running on:"
echo "- Frontend: http://localhost:3000"
echo "- Backend API: http://localhost:3001"
echo "- AI Engine: http://localhost:5000"
echo ""
echo "Process IDs:"
echo "- AI Engine: $AI_PID"
echo "- Backend: $BACKEND_PID"
echo "- Frontend: $FRONTEND_PID"
echo ""
echo "Press Ctrl+C to stop all services"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "Stopping all services..."
    kill $AI_PID $BACKEND_PID $FRONTEND_PID 2>/dev/null
    echo "System stopped."
    exit 0
}

# Set trap for cleanup
trap cleanup SIGINT SIGTERM

# Wait for all background processes
wait