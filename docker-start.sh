#!/bin/bash
# docker-start.sh - PromptHub Multi-Purpose Management Script
# Usage:
#   ./docker-start.sh            - Start services (default)
#   ./docker-start.sh start      - Start services
#   ./docker-start.sh rebuild    - Rebuild and start
#   ./docker-start.sh diagnose   - Diagnose issues
#   ./docker-start.sh stop       - Stop services

# Global variables
MCP_PORT=9010
WEB_PORT=9011
COMMAND=${1:-start}

# Function definitions
show_help() {
    echo "PromptHub Docker Management Script"
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  start      Start services (default)"
    echo "  rebuild    Rebuild images and start"
    echo "  diagnose   Diagnose deployment issues"
    echo "  stop       Stop services"
    echo "  help       Show this help"
    echo ""
    echo "Examples:"
    echo "  $0           # Start services"
    echo "  $0 rebuild   # Rebuild and start"
    echo "  $0 diagnose  # Diagnose issues"
}

diagnose_deployment() {
    echo "🔍 PromptHub Docker Deployment Diagnosis..."
    echo "=================================="
    
    echo "1. Check Docker container status:"
    if command -v docker-compose &> /dev/null; then
        docker-compose ps
    else
        echo "docker-compose is not installed"
        return 1
    fi
    
    echo ""
    echo "2. Check port occupancy:"
    netstat -tulpn | grep -E "(9010|9011)" || echo "No services found on ports 9010/9011"
    
    echo ""
    echo "3. Check recent logs:"
    echo "--- Container logs (last 30 lines) ---"
    docker-compose logs --tail=30 prompthub || echo "Unable to get logs"
    
    echo ""
    echo "4. Check container internal files:"
    echo "--- Check MCP compiled files ---"
    docker-compose exec prompthub ls -la /app/mcp/dist/src/ 2>/dev/null || echo "Unable to access MCP compiled files"
    
    echo "--- Check Web build files ---"
    docker-compose exec prompthub ls -la /app/web/.next/ 2>/dev/null || echo "Unable to access Web build files"
    
    echo ""
    echo "5. Test service connections:"
    echo -n "MCP service (9010): "
    curl -s -o /dev/null -w "%{http_code}\n" http://localhost:9010 2>/dev/null || echo "Unable to connect"
    echo -n "Web service (9011): "
    curl -s -o /dev/null -w "%{http_code}\n" http://localhost:9011 2>/dev/null || echo "Unable to connect"
    
    echo ""
    echo "=================================="
    echo "Diagnosis completed!"
    echo ""
    echo "Common issue resolution:"
    echo "  - If services are not started: $0 start"
    echo "  - If there are compilation issues: $0 rebuild"
    echo "  - View real-time logs: docker-compose logs -f"
}

rebuild_deployment() {
    echo "🔨 Rebuilding PromptHub Docker images..."
    
    # Check for .env file
    if [ ! -f ".env" ]; then
        echo "❌ Error: .env file not found"
        echo "Please ensure .env file exists in the project root directory"
        return 1
    fi
    
    echo "✓ Found .env file"
    
    # Load .env file
    echo "Loading environment variables..."
    set -a
    source .env
    set +a
    
    # Validate required environment variables
    echo "Validating required environment variables..."
    
    MISSING_VARS=""
    MISSING_COUNT=0
    
    # Check NEXT_PUBLIC_SUPABASE_URL
    if [ -z "${NEXT_PUBLIC_SUPABASE_URL}" ]; then
        MISSING_VARS="$MISSING_VARS NEXT_PUBLIC_SUPABASE_URL"
        MISSING_COUNT=$((MISSING_COUNT + 1))
        echo "  ❌ NEXT_PUBLIC_SUPABASE_URL: Not set"
    else
        value="${NEXT_PUBLIC_SUPABASE_URL}"
        masked="$(echo "$value" | cut -c1-20)..."
        echo "  ✓ NEXT_PUBLIC_SUPABASE_URL: $masked"
    fi
    
    # Check NEXT_PUBLIC_SUPABASE_ANON_KEY
    if [ -z "${NEXT_PUBLIC_SUPABASE_ANON_KEY}" ]; then
        MISSING_VARS="$MISSING_VARS NEXT_PUBLIC_SUPABASE_ANON_KEY"
        MISSING_COUNT=$((MISSING_COUNT + 1))
        echo "  ❌ NEXT_PUBLIC_SUPABASE_ANON_KEY: Not set"
    else
        value="${NEXT_PUBLIC_SUPABASE_ANON_KEY}"
        masked="$(echo "$value" | cut -c1-20)..."
        echo "  ✓ NEXT_PUBLIC_SUPABASE_ANON_KEY: $masked"
    fi
    
    # Check SUPABASE_SERVICE_ROLE_KEY
    if [ -z "${SUPABASE_SERVICE_ROLE_KEY}" ]; then
        MISSING_VARS="$MISSING_VARS SUPABASE_SERVICE_ROLE_KEY"
        MISSING_COUNT=$((MISSING_COUNT + 1))
        echo "  ❌ SUPABASE_SERVICE_ROLE_KEY: Not set"
    else
        value="${SUPABASE_SERVICE_ROLE_KEY}"
        masked="$(echo "$value" | cut -c1-20)..."
        echo "  ✓ SUPABASE_SERVICE_ROLE_KEY: $masked"
    fi
    
    # Check SUPABASE_URL
    if [ -z "${SUPABASE_URL}" ]; then
        MISSING_VARS="$MISSING_VARS SUPABASE_URL"
        MISSING_COUNT=$((MISSING_COUNT + 1))
        echo "  ❌ SUPABASE_URL: Not set"
    else
        value="${SUPABASE_URL}"
        masked="$(echo "$value" | cut -c1-20)..."
        echo "  ✓ SUPABASE_URL: $masked"
    fi
    
    if [ $MISSING_COUNT -ne 0 ]; then
        echo ""
        echo "❌ Error: The following required environment variables are not set:$MISSING_VARS"
        return 1
    fi
    
    # Stop existing containers
    echo ""
    echo "Stopping existing containers..."
    docker-compose down
    
    # Remove existing images (force rebuild)
    echo "Removing existing images..."
    docker rmi $(docker images "prompthub*" -q) 2>/dev/null || echo "No existing images found"
    
    # Clean Docker build cache
    echo "Cleaning Docker build cache..."
    docker builder prune -f
    
    # Rebuild images (explicitly pass build arguments)
    echo ""
    echo "=================================================="
    echo "Starting Docker image build (passing environment variables)..."
    echo "=================================================="
    
    if docker-compose build --no-cache \
        --build-arg NEXT_PUBLIC_SUPABASE_URL="$NEXT_PUBLIC_SUPABASE_URL" \
        --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY="$NEXT_PUBLIC_SUPABASE_ANON_KEY" \
        --build-arg SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_ROLE_KEY" \
        --build-arg SUPABASE_URL="$SUPABASE_URL"; then
        
        echo ""
        echo "✅ Build successful"
        
        # Start services
        echo "Starting services..."
        docker-compose up -d
        
        # Wait for services to start
        echo "Waiting for services to start..."
        sleep 10
        
        # Show status
        echo "Service status:"
        docker-compose ps
        
        echo ""
        echo "=================================================="
        echo "🎉 Rebuild completed!"
        echo "=================================================="
        echo "Frontend: http://localhost:9011"
        echo "Backend API: http://localhost:9010"
        echo ""
        echo "View logs: docker-compose logs -f"
    else
        echo ""
        echo "❌ Build failed"
        echo "Please check the error messages above"
        return 1
    fi
}

stop_deployment() {
    echo "Stopping PromptHub services..."
    docker-compose down
    echo "✅ Services stopped"
}

start_deployment() {
    echo "Starting PromptHub services..."

# Load user's .env file if it exists
if [ -f /app/.env ]; then
  echo "Found user-provided .env file, loading it"
  set -a
  . /app/.env
  set +a
fi

# Set basic environment variables
export MCP_PORT=${MCP_PORT}
export WEB_PORT=${WEB_PORT}
export NODE_ENV=production

# Set sufficient memory for UI libraries
export NODE_OPTIONS="--max-old-space-size=4096"

# Ensure critical environment variables exist, even if user hasn't provided them
# Set storage type, default to supabase
export STORAGE_TYPE=${STORAGE_TYPE:-supabase}
# Note: FORCE_LOCAL_STORAGE has been removed, no longer supported

# Set virtual Supabase parameters to avoid connection errors
# These virtual values will only be used if user hasn't provided these parameters
export SUPABASE_URL=${SUPABASE_URL:-http://localhost:54321}
export SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY:-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24ifQ.625_WdcF3KHqz5amU0x2X5WWHP-OEs_4qj0ssLNHzTs}
export SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY:-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSJ9.vI9obAHOGyVVKa3pD--kJlyxp-Z2zV9UUMAhKpNLAcU}

# Copy environment variables to Web service
export NEXT_PUBLIC_SUPABASE_URL=${SUPABASE_URL}
export NEXT_PUBLIC_SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}

echo "Environment variables setup completed"

# Create data directory
mkdir -p /app/mcp/data

# ====== Start MCP Service ======
echo "Starting MCP service (port: $MCP_PORT)..."

cd /app/mcp

# Ensure all context environment variables are set
echo "Initializing MCP service environment variables..."
export NODE_ENV=production
# Use STORAGE_TYPE environment variable set earlier
# 🔧 Fix: Completely remove system-level API key settings, rely on database validation
# MCP server will now validate all user API keys through Supabase
echo "ℹ️  MCP server will validate user API keys through Supabase database"
echo "📡 Supabase configuration: ${SUPABASE_URL}"

# Ensure no system-level API keys are set, force database validation
unset API_KEY
unset SERVER_KEY

# Start MCP service
echo "Starting MCP service..."

# Check if compiled files exist (compiled startup mode)
if [ ! -f "/app/mcp/dist/src/index.js" ]; then
  echo "❌ Error: MCP compiled file does not exist (dist/src/index.js)"
  echo "   Please ensure MCP service was compiled correctly during Docker build"
  echo "   Check MCP compilation step in Dockerfile"
  exit 1
fi

echo "Starting MCP service using compiled files"
cd /app/mcp
nohup node dist/src/index.js > /app/logs/mcp.log 2>&1 &
MCP_PID=$!

echo "MCP process ID: $MCP_PID"
echo "$MCP_PID" > /app/logs/mcp.pid || echo "Unable to write MCP PID file"

# Wait for MCP service to start
echo "Waiting for MCP service to start..."
WAIT_COUNT=0
MAX_WAIT=30
while [ $WAIT_COUNT -lt $MAX_WAIT ]; do
  if curl -s http://localhost:$MCP_PORT/api/health > /dev/null 2>&1; then
    echo "✅ MCP service started successfully (port $MCP_PORT)"
    break
  fi
  WAIT_COUNT=$((WAIT_COUNT + 1))
  if [ $WAIT_COUNT -eq $MAX_WAIT ]; then
    echo "❌ MCP service startup timeout"
    echo "Showing MCP logs:"
    tail -n 50 /app/logs/mcp.log 2>/dev/null || echo "Unable to read log file"
    echo "Checking process status:"
    ps aux | grep -E "(node|tsx)" || echo "No related processes found"
    exit 1
  fi
  sleep 2
done

# ====== Start Web Service ======
echo "Starting Web service (port: $WEB_PORT)..."

cd /app/web

# Check if build files exist
if [ ! -d "/app/web/.next" ]; then
  echo "❌ Web application build files do not exist"
  echo "Please ensure Web application was built correctly during Docker image build"
  exit 1
fi

# Start Next.js Web service
echo "Starting Next.js Web service..."
cd /app/web
nohup npx next start -p $WEB_PORT > /app/logs/web.log 2>&1 &
WEB_PID=$!
echo "Web process ID: $WEB_PID"
echo "$WEB_PID" > /app/logs/web.pid || echo "Unable to write Web PID file"

# Wait for Web service to start
echo "Waiting for Web service to start..."
WAIT_COUNT=0
MAX_WAIT=30
while [ $WAIT_COUNT -lt $MAX_WAIT ]; do
  if curl -s http://localhost:$WEB_PORT > /dev/null 2>&1; then
    echo "✅ Web service started successfully (port $WEB_PORT)"
    break
  fi
  WAIT_COUNT=$((WAIT_COUNT + 1))
  if [ $WAIT_COUNT -eq $MAX_WAIT ]; then
    echo "❌ Web service startup timeout"
    echo "Showing Web logs:"
    tail -n 50 /app/logs/web.log 2>/dev/null || echo "Unable to read log file"
    echo "Checking process status:"
    ps aux | grep -E "(node|next)" || echo "No related processes found"
    exit 1
  fi
  sleep 2
done

# Show success message
echo "===================================="
echo "All services started successfully!"
echo "MCP service: http://localhost:$MCP_PORT"
echo "Web service: http://localhost:$WEB_PORT"
echo "===================================="

    # Keep container running
    echo "Services started successfully, monitoring logs..."
    tail -f /app/logs/mcp.log /app/logs/web.log

    echo "One or more services stopped, exiting container..."
    exit 1
}

# Detect runtime environment
if [ -f /.dockerenv ]; then
    # Running inside Docker container - start services directly
    start_deployment
else
    # Running outside Docker - execute user command
    case "$COMMAND" in
        "start")
            echo "Starting services from outside Docker..."
            docker-compose up -d
            echo "✅ Services started"
            echo "Frontend: http://localhost:9011"
            echo "Backend API: http://localhost:9010"
            echo ""
            echo "View logs: docker-compose logs -f"
            ;;
        "rebuild")
            rebuild_deployment
            ;;
        "diagnose")
            diagnose_deployment
            ;;
        "stop")
            stop_deployment
            ;;
        "help"|"-h"|"--help")
            show_help
            ;;
        *)
            echo "Unknown command: $COMMAND"
            echo "Use '$0 help' to view available commands"
            exit 1
            ;;
    esac
fi
