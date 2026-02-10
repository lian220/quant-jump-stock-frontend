#!/bin/bash

# Quant Jump Stock - 통합 시작 스크립트
set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/quant-jump-stock-backend"
FRONTEND_DIR="$ROOT_DIR/quant-jump-stock-frontend"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

# Default options
ENV_MODE="local"
SKIP_INFRA=false
SKIP_BUILD=false
FORCE_REBUILD=false
FRONTEND_MODE=""  # 비어있으면 프론트 실행 안 함

usage() {
    echo "Usage: $0 [local|prod] [options]"
    echo ""
    echo "Environments:"
    echo "  local              Local environment (default)"
    echo "  prod               Production DB"
    echo ""
    echo "Options:"
    echo "  --frontend-dev     프론트엔드 hot reload (pnpm dev, port 3000)"
    echo "  --frontend-docker  프론트엔드 Docker 실행 (port 3000)"
    echo "  --skip-infra       인프라 시작 스킵"
    echo "  --skip-build       백엔드 빌드 스킵"
    echo "  --rebuild          컨테이너 강제 리빌드"
    echo "  --help             도움말"
    echo ""
    echo "Examples:"
    echo "  $0                              # 백엔드만 (local)"
    echo "  $0 local --frontend-dev         # 백엔드 + 프론트 hot reload"
    echo "  $0 prod --frontend-docker       # prod 백엔드 + 프론트 Docker"
    echo "  $0 prod --skip-build --skip-infra  # 빌드/인프라 스킵"
    exit 0
}

# Parse arguments
BACKEND_ARGS=()
while [[ $# -gt 0 ]]; do
    case $1 in
        local)
            ENV_MODE="local"
            BACKEND_ARGS+=("local")
            shift
            ;;
        prod)
            ENV_MODE="prod"
            BACKEND_ARGS+=("prod")
            shift
            ;;
        --frontend-dev)
            FRONTEND_MODE="dev"
            shift
            ;;
        --frontend-docker)
            FRONTEND_MODE="docker"
            shift
            ;;
        --skip-infra)
            BACKEND_ARGS+=("--skip-infra")
            shift
            ;;
        --skip-build)
            BACKEND_ARGS+=("--skip-build")
            shift
            ;;
        --rebuild)
            BACKEND_ARGS+=("--rebuild")
            FORCE_REBUILD=true
            shift
            ;;
        --help|-h)
            usage
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            usage
            ;;
    esac
done

ENV_MODE_UPPER=$(echo "$ENV_MODE" | tr '[:lower:]' '[:upper:]')

echo ""
echo -e "${BLUE}=========================================="
echo " 🚀 Quant Jump Stock Start"
echo "==========================================${NC}"
echo -e "${CYAN}Environment : ${ENV_MODE_UPPER}${NC}"
echo -e "${CYAN}Frontend    : ${FRONTEND_MODE:-skip}${NC}"
echo ""

# ── 1. Backend 시작 ──
echo -e "${YELLOW}━━━ Backend ━━━${NC}"
"$BACKEND_DIR/start.sh" "${BACKEND_ARGS[@]}"

# ── 2. Frontend 시작 ──
if [ -n "$FRONTEND_MODE" ]; then
    echo ""
    echo -e "${YELLOW}━━━ Frontend ━━━${NC}"

    if [ "$FRONTEND_MODE" = "dev" ]; then
        echo -e "${YELLOW}🎨 Starting frontend (hot reload)...${NC}"
        cd "$FRONTEND_DIR"
        pnpm install --frozen-lockfile 2>/dev/null || pnpm install
        echo -e "${GREEN}✓ Dependencies ready${NC}"
        echo -e "${CYAN}Starting pnpm dev on port 3000 (background)...${NC}"

        # 로그 디렉토리 생성
        FRONTEND_LOG="$ROOT_DIR/.logs/frontend-dev.log"
        mkdir -p "$ROOT_DIR/.logs"

        # .next 캐시 정리 (깨진 캐시 방지)
        rm -rf "$FRONTEND_DIR/.next"

        # 백그라운드 실행 + 로그 파일로 출력 리다이렉트
        pnpm dev > "$FRONTEND_LOG" 2>&1 &
        FRONTEND_PID=$!
        echo "$FRONTEND_PID" > "$ROOT_DIR/.logs/frontend.pid"

        # 서버 준비 대기 (최대 30초)
        echo -e "${YELLOW}⏳ Waiting for frontend dev server...${NC}"
        for i in {1..30}; do
            if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null | grep -q "200\|304"; then
                echo -e "${GREEN}✓ Frontend dev server started (PID: $FRONTEND_PID)${NC}"
                break
            fi
            if [ $i -eq 30 ]; then
                echo -e "${YELLOW}⚠ Frontend not responding yet (check: tail -f $FRONTEND_LOG)${NC}"
            fi
            sleep 1
        done

    elif [ "$FRONTEND_MODE" = "docker" ]; then
        echo -e "${YELLOW}🐳 Starting frontend (Docker)...${NC}"
        cd "$BACKEND_DIR"
        if [ "$FORCE_REBUILD" = true ]; then
            docker compose --env-file ".env.${ENV_MODE}" up -d --build quant-jump-stock-frontend 2>/dev/null || \
                (cd "$FRONTEND_DIR" && docker build -t qjs-frontend . && docker run -d --name qjs-frontend -p 3000:3000 qjs-frontend)
        else
            docker compose --env-file ".env.${ENV_MODE}" up -d quant-jump-stock-frontend 2>/dev/null || \
                (cd "$FRONTEND_DIR" && docker build -t qjs-frontend . && docker run -d --name qjs-frontend -p 3000:3000 qjs-frontend)
        fi
        echo -e "${GREEN}✓ Frontend container started${NC}"
    fi
fi

# ── Summary ──
echo ""
echo -e "${GREEN}=========================================="
echo "✅ Quant Jump Stock Started! (${ENV_MODE_UPPER})"
echo "==========================================${NC}"
echo ""
echo "📊 Endpoints:"
echo "   • Core API:    http://localhost:10010"
echo "   • Data Engine: http://localhost:10020"
echo "   • Kafka UI:    http://localhost:8089"
echo "   • Swagger UI:  http://localhost:10010/swagger-ui.html"
if [ -n "$FRONTEND_MODE" ]; then
echo "   • Frontend:    http://localhost:3000"
fi
echo ""
if [ "$FRONTEND_MODE" = "dev" ]; then
echo "📝 Frontend log: tail -f .logs/frontend-dev.log"
fi
echo "🛑 Stop: ./stop.sh | ./stop.sh --all"
echo ""
