#!/bin/bash

# Start the backend server
echo "Starting backend server..."
cd backend
npm run dev &
BACKEND_PID=$!

# Wait for backend to start
sleep 5

# Start the frontend server
echo "Starting frontend server..."
cd techfolks/frontend
npm run dev &
FRONTEND_PID=$!

echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"

echo ""
echo "Application is starting..."
echo "Backend: http://localhost:3000"
echo "Frontend: http://localhost:3002"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID