from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List, Optional
from pydantic import BaseModel
from database import db

router = APIRouter(
    prefix="/db",
    tags=["database"],
)


# API 키 모델
class ApiKeyModel(BaseModel):
    service: str
    key: str


class ApiKeyResponse(BaseModel):
    id: int
    service: str
    key: str


# 대화 모델
class Message(BaseModel):
    role: str
    content: str


class ConversationModel(BaseModel):
    model: str
    messages: List[Dict[str, Any]]
    systemPrompt: Optional[str] = None  # 시스템 프롬프트 필드 추가


class ConversationResponse(BaseModel):
    id: int
    model: str
    messages: List[Dict[str, Any]]
    systemPrompt: Optional[str] = None
    created_at: int


# API 키 관련 엔드포인트
@router.post("/api-keys", response_model=Dict[str, int])
async def create_api_key(api_key: ApiKeyModel):
    """API 키를 저장합니다."""
    doc_id = db.save_api_key(api_key.service, api_key.key)
    return {"id": doc_id}


@router.get("/api-keys/{service}", response_model=Optional[ApiKeyResponse])
async def get_api_key(service: str):
    """특정 서비스의 API 키를 가져옵니다."""
    key = db.get_api_key(service)
    if not key:
        raise HTTPException(status_code=404, detail="API 키를 찾을 수 없습니다")
    return {"id": 0, "service": service, "key": key}  # ID는 TinyDB 내부 값으로 제공됨


@router.get("/api-keys", response_model=List[ApiKeyResponse])
async def get_all_api_keys():
    """저장된 모든 API 키를 가져옵니다."""
    keys = db.get_all_api_keys()
    return [
        {"id": key.doc_id, "service": key["service"], "key": key["key"]} for key in keys
    ]


@router.delete("/api-keys/{service}", response_model=Dict[str, int])
async def delete_api_key(service: str):
    """특정 서비스의 API 키를 삭제합니다."""
    result = db.delete_api_key(service)
    # TinyDB는 삭제된 문서의 ID 목록을 반환하므로 길이를 사용하여 삭제된 문서 수를 반환
    count = len(result) if isinstance(result, list) else result
    if count == 0:
        raise HTTPException(status_code=404, detail="API 키를 찾을 수 없습니다")
    return {"deleted": count}


# 대화 관련 엔드포인트
@router.post("/conversations", response_model=Dict[str, int])
async def create_conversation(conversation: ConversationModel):
    """대화 내용을 저장합니다."""
    doc_id = db.save_conversation(
        conversation.model, conversation.messages, conversation.systemPrompt
    )
    return {"id": doc_id}


@router.get("/conversations/{conversation_id}", response_model=Optional[Dict[str, Any]])
async def get_conversation(conversation_id: int):
    """특정 대화를 가져옵니다."""
    conversation = db.get_conversation(conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="대화를 찾을 수 없습니다")
    return conversation


@router.get("/conversations", response_model=List[Dict[str, Any]])
async def get_all_conversations():
    """모든 대화 내용을 가져옵니다."""
    conversations = db.get_all_conversations()
    return [{"id": conv.doc_id, **conv} for conv in conversations]


@router.put("/conversations/{conversation_id}")
async def update_conversation(conversation_id: int, conversation: ConversationModel):
    """대화 내용을 업데이트합니다."""
    existing = db.get_conversation(conversation_id)
    if not existing:
        raise HTTPException(status_code=404, detail="대화를 찾을 수 없습니다")
    db.update_conversation(
        conversation_id, conversation.messages, conversation.systemPrompt
    )
    return {"message": "대화가 업데이트되었습니다"}


@router.delete("/conversations/{conversation_id}")
async def delete_conversation(conversation_id: int):
    """대화를 삭제합니다."""
    existing = db.get_conversation(conversation_id)
    if not existing:
        raise HTTPException(status_code=404, detail="대화를 찾을 수 없습니다")
    db.delete_conversation(conversation_id)
    return {"message": "대화가 삭제되었습니다"}
