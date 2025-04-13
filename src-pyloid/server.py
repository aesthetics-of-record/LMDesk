from fastapi import FastAPI
from threading import Thread
import uvicorn
from typing import Optional, Dict, Any
import json
from api.window import router as window_router
from api.db_api import router as db_router
from api.llm_api import router as llm_router
from fastapi.middleware.cors import CORSMiddleware

# FastAPI 애플리케이션 인스턴스 생성
app = FastAPI(title="Pyloid API")
app.include_router(window_router)
app.include_router(db_router)
app.include_router(llm_router)

# CORS 미들웨어 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "*"
    ],  # 모든 오리진 허용 (프로덕션에서는 특정 도메인으로 제한하는 것이 좋습니다)
    allow_credentials=True,
    allow_methods=["*"],  # 모든 HTTP 메소드 허용
    allow_headers=["*"],  # 모든 헤더 허용
)


@app.get("/")
async def root():
    """기본 루트 엔드포인트"""
    return {"message": "Pyloid FastAPI 서버가 실행 중입니다"}


#################################################################################################
def start_api_server(
    host: str = "127.0.0.1", port: int = 8000, log_level: str = "info"
) -> str:
    """
    별도의 스레드에서 FastAPI 서버를 시작합니다.

    Args:
        host: API 서버 호스트
        port: API 서버 포트
        log_level: 로깅 레벨

    Returns:
        str: API 서버 URL
    """
    server_config = {"host": host, "port": port, "log_level": log_level}

    def run_server():
        uvicorn.run(
            app,
            host=host,
            port=port,
            log_level=log_level,
        )

    # 별도의 스레드에서 API 서버 시작
    api_thread = Thread(target=run_server, daemon=True)
    api_thread.start()

    return f"http://{host}:{port}"
