import os
import json
from pathlib import Path
from tinydb import TinyDB, Query
from typing import Dict, Any, Optional, List


class Database:
    def __init__(self):
        # 크로스 플랫폼 지원을 위한 앱 데이터 디렉토리 경로
        # Windows: ~/AppData/Roaming/LMDesk
        # macOS: ~/Library/Application Support/LMDesk
        # Linux: ~/.local/share/LMDesk
        if os.name == "nt":  # Windows
            app_dir = Path.home() / "AppData" / "Roaming" / "LMDesk"
        elif os.name == "posix":  # macOS 또는 Linux
            if os.path.exists(Path.home() / "Library" / "Application Support"):  # macOS
                app_dir = Path.home() / "Library" / "Application Support" / "LMDesk"
            else:  # Linux
                app_dir = Path.home() / ".local" / "share" / "LMDesk"
        else:
            # 기타 플랫폼의 경우 홈 디렉토리에 .lmdesk 폴더 사용
            app_dir = Path.home() / ".lmdesk"

        # 디렉토리가 없으면 생성
        app_dir.mkdir(parents=True, exist_ok=True)

        # 데이터베이스 파일 경로
        self.db_path = app_dir / "database.json"
        self.db = TinyDB(self.db_path)

        # 테이블 초기화
        self.api_keys = self.db.table("api_keys")
        self.conversations = self.db.table("conversations")

    def save_api_key(self, service: str, key: str) -> int:
        """API 키를 저장합니다."""
        User = Query()
        existing = self.api_keys.get(User.service == service)

        if existing:
            self.api_keys.update({"key": key}, User.service == service)
            return existing.doc_id
        else:
            return self.api_keys.insert({"service": service, "key": key})

    def get_api_key(self, service: str) -> Optional[str]:
        """서비스에 해당하는 API 키를 가져옵니다."""
        User = Query()
        result = self.api_keys.get(User.service == service)
        return result["key"] if result else None

    def get_all_api_keys(self) -> List[Dict[str, Any]]:
        """모든 API 키를 가져옵니다."""
        return self.api_keys.all()

    def delete_api_key(self, service: str) -> int:
        """API 키를 삭제합니다."""
        User = Query()
        return self.api_keys.remove(User.service == service)

    def save_conversation(
        self,
        model: str,
        messages: List[Dict[str, Any]],
        systemPrompt: Optional[str] = None,
    ) -> int:
        """대화 내용을 저장합니다."""
        timestamp = {"created_at": self._get_timestamp()}
        return self.conversations.insert(
            {
                "model": model,
                "messages": messages,
                "systemPrompt": systemPrompt,
                **timestamp,
            }
        )

    def get_conversation(self, conversation_id: int) -> Optional[Dict[str, Any]]:
        """대화 ID로 대화 내용을 가져옵니다."""
        return self.conversations.get(doc_id=conversation_id)

    def get_all_conversations(self) -> List[Dict[str, Any]]:
        """모든 대화 내용을 가져옵니다."""
        return self.conversations.all()

    def update_conversation(
        self,
        conversation_id: int,
        messages: List[Dict[str, Any]],
        systemPrompt: Optional[str] = None,
    ) -> None:
        """대화 내용을 업데이트합니다."""
        self.conversations.update(
            {"messages": messages, "systemPrompt": systemPrompt},
            doc_ids=[conversation_id],
        )

    def delete_conversation(self, conversation_id: int) -> None:
        """대화를 삭제합니다."""
        self.conversations.remove(doc_ids=[conversation_id])

    def _get_timestamp(self) -> int:
        """현재 타임스탬프를 반환합니다."""
        import time

        return int(time.time())


# 싱글톤 인스턴스 생성
db = Database()
