#!/bin/bash

# Quant Jump Stock - 통합 정지 스크립트
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/quant-jump-stock-backend"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo ""
echo -e "${BLUE}=========================================="
echo " 🛑 Quant Jump Stock Stop"
echo "==========================================${NC}"
echo ""

# 프론트엔드 dev 프로세스 정리 (pnpm dev)
PID_FILE="$ROOT_DIR/.logs/frontend.pid"
if [ -f "$PID_FILE" ]; then
    FRONTEND_PID=$(cat "$PID_FILE")
    if kill -0 "$FRONTEND_PID" 2>/dev/null; then
        echo -e "${YELLOW}🎨 Stopping frontend dev server (PID: $FRONTEND_PID)...${NC}"
        kill "$FRONTEND_PID" 2>/dev/null || true
        echo -e "${GREEN}✓ Frontend dev server stopped${NC}"
    fi
    rm -f "$PID_FILE"
else
    # PID 파일 없으면 프로세스명으로 탐색
    FRONTEND_PIDS=$(pgrep -f "next dev" 2>/dev/null || true)
    if [ -n "$FRONTEND_PIDS" ]; then
        echo -e "${YELLOW}🎨 Stopping frontend dev server...${NC}"
        kill $FRONTEND_PIDS 2>/dev/null || true
        echo -e "${GREEN}✓ Frontend dev server stopped${NC}"
    fi
fi

# 프론트엔드 Docker 컨테이너 정리
if docker ps -q --filter "name=qjs-frontend" 2>/dev/null | grep -q .; then
    echo -e "${YELLOW}🐳 Stopping frontend container...${NC}"
    docker stop qjs-frontend 2>/dev/null || true
    docker rm qjs-frontend 2>/dev/null || true
    echo -e "${GREEN}✓ Frontend container stopped${NC}"
fi

# Backend stop.sh로 위임
"$BACKEND_DIR/stop.sh" "$@"
