import { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Plus, Trash2, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  saveConversation,
  updateConversation,
  getAllConversations,
  getConversation,
  deleteConversation,
  Message,
  ConversationResponse,
  chatCompletionStream,
  LLMMessage,
} from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';

export default function Home() {
  const [input, setInput] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [conversations, setConversations] = useState<
    ConversationResponse[]
  >([]);
  const [isLoadingConversations, setIsLoadingConversations] =
    useState<boolean>(false);
  const [selectedModel, setSelectedModel] =
    useState<string>('openai-gpt4o');
  const [streamingText, setStreamingText] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [systemPrompt, setSystemPrompt] = useState<string>('');
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);

  // 대화 목록과 모델 목록 불러오기
  const loadData = async () => {
    try {
      setIsLoadingConversations(true);
      const [convos] = await Promise.all([getAllConversations()]);
      setConversations(convos);
    } catch (error) {
      console.error('데이터 불러오기 오류:', error);
    } finally {
      setIsLoadingConversations(false);
    }
  };

  // 컴포넌트 마운트 시 데이터 불러오기
  useEffect(() => {
    loadData();
  }, []);

  // 스크롤을 항상 최신 메시지로 이동
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText]);

  // 새 대화 시작
  const handleNewConversation = () => {
    setMessages([]);
    setConversationId(null);
    setInput('');
    setStreamingText('');
  };

  // 대화 불러오기
  const handleLoadConversation = async (id: number) => {
    // ID가 유효하지 않으면 함수 실행 중단
    if (id === undefined || id === null || isNaN(id)) {
      console.error('유효하지 않은 대화 ID:', id);
      return;
    }

    try {
      setIsLoading(true);
      const conversation = await getConversation(id);
      if (conversation) {
        setMessages(conversation.messages);
        setConversationId(id);
        setStreamingText('');
        // 저장된 시스템 프롬프트 불러오기
        setSystemPrompt(conversation.systemPrompt || '');
      }
    } catch (error) {
      console.error('대화 불러오기 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 대화 삭제
  const handleDeleteConversation = async (id: number) => {
    try {
      await deleteConversation(id);
      // 현재 대화가 삭제된 경우 새 대화 시작
      if (id === conversationId) {
        handleNewConversation();
      }
      // 대화 목록 다시 불러오기
      loadData();
    } catch (error) {
      console.error('대화 삭제 오류:', error);
    }
  };

  // 메시지 전송 처리
  const handleSendMessage = async () => {
    if (!input.trim() || !selectedModel) return;

    const updatedMessages = [...messages, { role: 'user', content: input }];

    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);
    setStreamingText('');

    try {
      // 대화,가 처음 시작되면 저장, 아니면 업데이트
      if (conversationId === null) {
        const id = await saveConversation(
          selectedModel,
          updatedMessages,
          systemPrompt
        );
        setConversationId(id);
        loadData();
      } else {
        await updateConversation(
          conversationId,
          updatedMessages,
          systemPrompt
        );
      }

      // LLM API 호출
      const llmMessages: LLMMessage[] = updatedMessages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      // 스트리밍 응답 처리
      const eventSource = await chatCompletionStream({
        model: selectedModel,
        messages: llmMessages,
        max_tokens: 10000,
        stream: true,
        systemPrompt: systemPrompt,
      });

      let fullResponse = '';

      eventSource.onmessage = (event) => {
        if (event.data === '[DONE]') {
          eventSource.close();

          // 최종 응답 메시지 추가
          const aiMessage: Message = {
            role: 'assistant',
            content: fullResponse,
          };

          const newMessages = [...updatedMessages, aiMessage];
          setMessages(newMessages);
          setStreamingText('');
          setIsLoading(false);

          // 대화 업데이트
          if (conversationId !== null) {
            updateConversation(conversationId, newMessages, systemPrompt);
          }
          return;
        }

        try {
          const data = JSON.parse(event.data);
          if (data.choices && data.choices.length > 0) {
            const content = data.choices[0].delta?.content || '';
            if (content) {
              fullResponse += content;
              setStreamingText(fullResponse);
            }
          }
        } catch (error) {
          console.error('스트리밍 데이터 파싱 오류:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('스트리밍 오류:', error);
        eventSource.close();
        setIsLoading(false);

        // 오류 메시지 표시
        const errorMessage: Message = {
          role: 'assistant',
          content: '죄송합니다. 응답을 생성하는 중 오류가 발생했습니다.',
        };

        const newMessages = [...updatedMessages, errorMessage];
        setMessages(newMessages);
        setStreamingText('');

        // 대화 업데이트
        if (conversationId !== null) {
          updateConversation(conversationId, newMessages, systemPrompt);
        }
      };
    } catch (error) {
      console.error('메시지 처리 오류:', error);
      setIsLoading(false);

      // 오류 메시지 표시
      const errorMessage: Message = {
        role: 'assistant',
        content: '죄송합니다. 요청을 처리하는 중 오류가 발생했습니다.',
      };

      const newMessages = [...updatedMessages, errorMessage];
      setMessages(newMessages);

      // 대화 업데이트
      if (conversationId !== null) {
        updateConversation(conversationId, newMessages, systemPrompt);
      }
    }
  };

  // 엔터키로 메시지 전송
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex h-[calc(100vh-3rem)] overflow-hidden">
      {/* 사이드바 - 대화 목록 */}
      <div className="w-64 border-r flex flex-col overflow-hidden">
        <div className="p-4 border-b shrink-0">
          <Button
            className="w-full"
            onClick={handleNewConversation}
          >
            <Plus className="mr-2 h-4 w-4" /> 새 대화
          </Button>
        </div>
        <ScrollArea className="flex-1 overflow-auto">
          <div className="p-4 space-y-2">
            {isLoadingConversations ? (
              <div className="text-center py-4 text-sm text-muted-foreground">
                불러오는 중...
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-center py-4 text-sm text-muted-foreground">
                저장된 대화가 없습니다
              </div>
            ) : (
              conversations.map((convo) => (
                <div
                  key={convo.id}
                  className={`p-2 rounded-md text-sm cursor-pointer flex justify-between items-center group hover:bg-muted ${
                    conversationId === convo.id ? 'bg-muted' : ''
                  }`}
                  onClick={() => handleLoadConversation(convo.id)}
                >
                  <div className="truncate flex-1 flex items-center">
                    {convo.messages[0]?.content.substring(0, 6) + '...' ||
                      '새 대화'}
                    {convo.systemPrompt && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        <Settings className="h-3 w-3" />
                      </span>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteConversation(convo.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* 메인 채팅 영역 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Card className="flex-1 flex flex-col m-4 border-none shadow-none overflow-hidden">
          <ScrollArea className="flex-1 p-4 overflow-auto">
            <div className="space-y-4">
              {messages.length === 0 ? (
                <div className="flex h-full items-center justify-center text-center p-8">
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">
                      대화를 시작해보세요
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      메시지를 입력하여 AI와 대화를 시작할 수 있습니다.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {systemPrompt && (
                    <div className="flex justify-center mb-4">
                      <div className="bg-muted px-3 py-1 rounded-full text-xs text-muted-foreground flex items-center gap-1">
                        <Settings className="h-3 w-3" />
                        <span>시스템 프롬프트 설정됨</span>
                      </div>
                    </div>
                  )}
                  {messages
                    .filter((message) => message.role !== 'system')
                    .map((message, index) => (
                      <div
                        key={index}
                        className={`flex ${
                          message.role === 'user'
                            ? 'justify-end'
                            : 'justify-start'
                        }`}
                      >
                        <div
                          className={`flex items-start gap-2 max-w-[80%] ${
                            message.role === 'user'
                              ? 'flex-row-reverse'
                              : ''
                          }`}
                        >
                          <div
                            className={`flex h-8 w-8 rounded-full items-center justify-center ${
                              message.role === 'user'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted'
                            }`}
                          >
                            {message.role === 'user' ? (
                              <User className="h-5 w-5" />
                            ) : (
                              <Bot className="h-5 w-5" />
                            )}
                          </div>
                          <div
                            className={`rounded-lg px-3 py-2 text-sm ${
                              message.role === 'user'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted'
                            }`}
                          >
                            {message.content}
                          </div>
                        </div>
                      </div>
                    ))}
                  {/* 스트리밍 메시지 표시 */}
                  {streamingText && (
                    <div className="flex justify-start">
                      <div className="flex items-start gap-2 max-w-[80%]">
                        <div className="flex h-8 w-8 rounded-full items-center justify-center bg-muted">
                          <Bot className="h-5 w-5" />
                        </div>
                        <div className="bg-muted rounded-lg px-3 py-2 text-sm">
                          {streamingText}
                        </div>
                      </div>
                    </div>
                  )}
                  {/* 로딩 표시 */}
                  {isLoading && !streamingText && (
                    <div className="flex justify-start">
                      <div className="flex items-start gap-2 max-w-[80%]">
                        <div className="flex h-8 w-8 rounded-full items-center justify-center bg-muted">
                          <Bot className="h-5 w-5" />
                        </div>
                        <div className="bg-muted rounded-lg px-3 py-2 text-sm">
                          <div className="flex space-x-1">
                            <div className="animate-bounce">·</div>
                            <div className="animate-bounce animation-delay-200">
                              ·
                            </div>
                            <div className="animate-bounce animation-delay-400">
                              ·
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>
          </ScrollArea>
          <div className="p-4 border-t shrink-0">
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <Select
                  value={selectedModel}
                  onValueChange={setSelectedModel}
                  disabled={isLoading}
                >
                  <SelectTrigger className="w-[220px]">
                    <SelectValue placeholder="모델 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>OpenAI</SelectLabel>
                      <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                      <SelectItem value="gpt-4o-mini">
                        gpt-4o-mini
                      </SelectItem>
                      <SelectItem value="gpt-4.5-preview">
                        gpt-4.5-preview
                      </SelectItem>
                      {/* <SelectItem value="o1-preview">o1-preview</SelectItem>
                      <SelectItem value="o1-mini">o1-mini</SelectItem>

                      <SelectItem value="o3-mini">o3-mini</SelectItem> */}
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel>Anthropic</SelectLabel>
                      <SelectItem value="claude-3-7-sonnet-20250219">
                        claude-3-7-sonnet-20250219
                      </SelectItem>
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel>Gemini</SelectLabel>
                      {/* <SelectItem value="claude-3-7-sonnet-20250219">
                        claude-3-7-sonnet-20250219
                      </SelectItem> */}
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel>XAI</SelectLabel>
                      <SelectItem value="xai/grok-3-latest">
                        xai/grok-3-latest
                      </SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <div className="flex">
                  <Dialog
                    open={isDialogOpen}
                    onOpenChange={setIsDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        className={systemPrompt ? 'bg-primary/20' : ''}
                        title="시스템 프롬프트 설정"
                      >
                        <Settings
                          className={`h-4 w-4 ${
                            systemPrompt ? 'text-primary' : ''
                          }`}
                        />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>시스템 프롬프트 설정</DialogTitle>
                        <DialogDescription>
                          AI에게 기본적인 지시사항을 설정할 수 있습니다.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <Textarea
                          placeholder="시스템 프롬프트를 입력하세요..."
                          value={systemPrompt}
                          onChange={(e) => setSystemPrompt(e.target.value)}
                          className="min-h-[100px]"
                        />
                      </div>
                      <DialogFooter>
                        <Button onClick={() => setIsDialogOpen(false)}>
                          저장
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
              <div className="flex gap-2">
                <Textarea
                  placeholder="메시지를 입력하세요..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="min-h-10 resize-none"
                  rows={1}
                  disabled={isLoading}
                />
                <Button
                  size="icon"
                  onClick={handleSendMessage}
                  disabled={isLoading || !input.trim() || !selectedModel}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
