from fastapi import APIRouter, HTTPException, Request, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional, Union
from database import db
from litellm import completion, acompletion
import litellm
import asyncio
import json

router = APIRouter(
    prefix="/llm",
    tags=["llm"],
)

litellm._turn_on_debug()


# 메시지 모델
class Message(BaseModel):
    role: str
    content: str


# 채팅 완성 요청 모델
class ChatCompletionRequest(BaseModel):
    model: str
    messages: List[Message]
    stream: bool = True
    temperature: Optional[float] = 0.7
    max_tokens: Optional[int] = 1000
    systemPrompt: Optional[str] = None


# API 키 설정
def set_api_keys():
    """
    데이터베이스에서 API 키를 가져와 환경 변수에 설정합니다.
    """
    import os

    api_keys = db.get_all_api_keys()

    for key_info in api_keys:
        service = key_info["service"]
        api_key = key_info["key"]

        if service == "OPENAI":
            os.environ["OPENAI_API_KEY"] = api_key
        elif service == "ANTHROPIC":
            os.environ["ANTHROPIC_API_KEY"] = api_key
        elif service == "GEMINI":
            os.environ["GEMINI_API_KEY"] = api_key
        elif service == "XAI":
            os.environ["XAI_API_KEY"] = api_key
        elif service == "MISTRAL":
            os.environ["MISTRAL_API_KEY"] = api_key


# 서버 시작 시 API 키 설정
set_api_keys()


# 텍스트 완성 API 엔드포인트 (스트리밍)
@router.post("/chat/completions")
async def chat_completions(request: ChatCompletionRequest):
    """
    채팅 완성 API - 스트리밍 및 비스트리밍 응답 모두 지원
    """
    # API 키 새로 고침
    set_api_keys()

    print(request)

    # 메시지 형식 변환
    messages = [{"role": msg.role, "content": msg.content} for msg in request.messages]

    # 시스템 프롬프트가 있는 경우 메시지 목록 앞에 추가
    if hasattr(request, "systemPrompt") and request.systemPrompt:
        messages.insert(0, {"role": "system", "content": request.systemPrompt})

    print("--------------------------------------")
    print(messages)
    print("--------------------------------------")

    # 스트리밍 모드
    if request.stream:
        return StreamingResponse(
            stream_completion(
                model=request.model,
                messages=messages,
                temperature=request.temperature,
                max_tokens=request.max_tokens,
            ),
            media_type="text/event-stream",
        )

    # # 비스트리밍 모드
    # try:
    #     response = await acompletion(
    #         model=request.model,
    #         messages=messages,
    #         temperature=request.temperature,
    #         max_tokens=request.max_tokens,
    #     )
    #     return response
    # except Exception as e:
    #     raise HTTPException(status_code=500, detail=f"LLM API 오류: {str(e)}")


# 스트리밍 응답 제너레이터
async def stream_completion(
    model: str, messages: List[Dict[str, Any]], temperature: float, max_tokens: int
):
    """
    LiteLLM을 사용하여 스트리밍 응답을 생성합니다.
    """
    try:
        response = completion(
            model=model,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
            stream=True,
        )

        for chunk in response:
            if hasattr(chunk, "choices") and len(chunk.choices) > 0:
                yield f"data: {json.dumps(chunk.model_dump())}\n\n"
            else:
                yield f"data: {json.dumps({})}\n\n"

        yield "data: [DONE]\n\n"
    except Exception as e:
        error_data = {"error": True, "message": str(e)}
        yield f"data: {json.dumps(error_data)}\n\n"
        yield "data: [DONE]\n\n"


# API 키 정보 엔드포인트
@router.get("/keys-status")
async def get_keys_status():
    """
    현재 설정된 API 키의 상태를 반환합니다.
    """
    return set_api_keys()
