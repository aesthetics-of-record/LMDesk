// API 키 관련 타입
export interface ApiKey {
  service: string;
  key: string;
}

export interface ApiKeyResponse {
  id: number;
  service: string;
  key: string;
}

// 대화 관련 타입
export interface Message {
  role: string;
  content: string;
}

export interface Conversation {
  model: string;
  messages: Message[];
  systemPrompt?: string;
}

export interface ConversationResponse {
  id: number;
  model: string;
  messages: Message[];
  systemPrompt?: string;
  created_at: number;
}

// LLM 관련 타입 및 함수
export interface LLMMessage {
  role: string;
  content: string;
}

export interface LLMModelInfo {
  id: string;
  name: string;
  litellm_model: string;
  group?: string;
}

export interface LLMChatCompletionRequest {
  model: string;
  messages: LLMMessage[];
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
  systemPrompt?: string;
}

// API URL 가져오기
const getApiUrl = async (): Promise<string> => {
  const data = await window.pyloid.BaseAPI.getData();
  return data.api_url;
};

// API 키 관련 함수
export const saveApiKey = async (
  service: string,
  key: string
): Promise<number> => {
  const apiUrl = await getApiUrl();
  const response = await fetch(`${apiUrl}/db/api-keys`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ service, key }),
  });

  if (!response.ok) {
    throw new Error(`API 키 저장 실패: ${response.statusText}`);
  }

  const data = await response.json();
  return data.id;
};

export const getApiKey = async (
  service: string
): Promise<string | null> => {
  const apiUrl = await getApiUrl();
  try {
    const response = await fetch(`${apiUrl}/db/api-keys/${service}`);

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`API 키 조회 실패: ${response.statusText}`);
    }

    const data = await response.json();
    return data.key;
  } catch (error) {
    console.error('API 키 조회 중 오류 발생:', error);
    return null;
  }
};

export const getAllApiKeys = async (): Promise<ApiKeyResponse[]> => {
  const apiUrl = await getApiUrl();
  const response = await fetch(`${apiUrl}/db/api-keys`);

  if (!response.ok) {
    throw new Error(`API 키 목록 조회 실패: ${response.statusText}`);
  }

  return await response.json();
};

export const deleteApiKey = async (service: string): Promise<number> => {
  const apiUrl = await getApiUrl();
  const response = await fetch(`${apiUrl}/db/api-keys/${service}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error(`API 키 삭제 실패: ${response.statusText}`);
  }

  const data = await response.json();
  return data.deleted;
};

// 대화 관련 함수
export const saveConversation = async (
  model: string,
  messages: Message[],
  systemPrompt?: string
): Promise<number> => {
  const apiUrl = await getApiUrl();
  const response = await fetch(`${apiUrl}/db/conversations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model, messages, systemPrompt }),
  });

  if (!response.ok) {
    throw new Error(`대화 저장 실패: ${response.statusText}`);
  }

  const data = await response.json();
  return data.id;
};

export const getConversation = async (
  id: number
): Promise<ConversationResponse | null> => {
  const apiUrl = await getApiUrl();
  try {
    const response = await fetch(`${apiUrl}/db/conversations/${id}`);

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`대화 조회 실패: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('대화 조회 중 오류 발생:', error);
    return null;
  }
};

export const getAllConversations = async (): Promise<
  ConversationResponse[]
> => {
  const apiUrl = await getApiUrl();
  const response = await fetch(`${apiUrl}/db/conversations`);

  if (!response.ok) {
    throw new Error(`대화 목록 조회 실패: ${response.statusText}`);
  }

  return await response.json();
};

export const updateConversation = async (
  id: number,
  messages: Message[],
  systemPrompt?: string
): Promise<void> => {
  const apiUrl = await getApiUrl();
  const conversation = await getConversation(id);

  if (!conversation) {
    throw new Error(`대화를 찾을 수 없습니다.`);
  }

  const response = await fetch(`${apiUrl}/db/conversations/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: conversation.model,
      messages,
      systemPrompt,
    }),
  });

  if (!response.ok) {
    throw new Error(`대화 업데이트 실패: ${response.statusText}`);
  }
};

export const deleteConversation = async (id: number): Promise<void> => {
  const apiUrl = await getApiUrl();
  const response = await fetch(`${apiUrl}/db/conversations/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error(`대화 삭제 실패: ${response.statusText}`);
  }
};

// API 키 상태 확인
export const getLLMKeysStatus = async (): Promise<
  Record<string, string>
> => {
  const apiUrl = await getApiUrl();
  const response = await fetch(`${apiUrl}/llm/keys-status`);

  if (!response.ok) {
    throw new Error(`API 키 상태 조회 실패: ${response.statusText}`);
  }

  return await response.json();
};

// 비스트리밍 LLM 채팅 완성
export const chatCompletion = async (
  request: LLMChatCompletionRequest
): Promise<any> => {
  const apiUrl = await getApiUrl();
  const response = await fetch(`${apiUrl}/llm/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...request,
      stream: false,
    }),
  });

  if (!response.ok) {
    throw new Error(`LLM 호출 실패: ${response.statusText}`);
  }

  return await response.json();
};

// 스트리밍 LLM 채팅 완성 (EventSource 반환)
export const chatCompletionStream = async (
  request: LLMChatCompletionRequest
): Promise<EventSource> => {
  const apiUrl = await getApiUrl();
  const url = `${apiUrl}/llm/chat/completions`;

  // POST 요청으로 스트리밍 응답 받기
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...request,
      stream: true,
    }),
  });

  if (!response.ok) {
    throw new Error(`LLM 스트리밍 호출 실패: ${response.statusText}`);
  }

  // Response를 읽을 수 있는 EventSource로 변환
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('응답을 스트리밍할 수 없습니다.');
  }

  const decoder = new TextDecoder();

  // 커스텀 EventSource 구현
  const eventSource = new EventTarget() as EventSource;
  (eventSource as any).onmessage = null;
  (eventSource as any).onerror = null;
  (eventSource as any).close = () => {
    reader.cancel();
  };

  // 비동기로 스트림 처리
  (async () => {
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk
          .split('\n\n')
          .filter((line) => line.trim().startsWith('data:'));

        for (const line of lines) {
          const data = line.replace('data:', '').trim();

          // MessageEvent 생성 및 발생
          const event = new MessageEvent('message', { data });
          if (eventSource.onmessage) {
            eventSource.onmessage(event);
          }
          eventSource.dispatchEvent(event);

          // 스트림 종료 확인
          if (data === '[DONE]') {
            reader.cancel();
            break;
          }
        }
      }
    } catch (error) {
      console.error('스트림 처리 중 오류 발생:', error);
      if (eventSource.onerror) {
        eventSource.onerror(new Event('error'));
      }
      reader.cancel();
    }
  })();

  return eventSource as EventSource;
};
