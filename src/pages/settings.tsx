import { useState, useEffect } from 'react';
import {
  saveApiKey,
  getAllApiKeys,
  deleteApiKey,
  ApiKeyResponse,
} from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Trash2, Save, Plus, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// 지원하는 LLM 서비스 목록
const LLM_SERVICES = [
  { id: 'OPENAI', name: 'OPENAI' },
  { id: 'ANTHROPIC', name: 'ANTHROPIC' },
  { id: 'GEMINI', name: 'GEMINI' },
  { id: 'XAI', name: 'XAI' },
  { id: 'MISTRAL', name: 'MISTRAL' },
];

export default function Settings() {
  const [apiKeys, setApiKeys] = useState<ApiKeyResponse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [newService, setNewService] = useState<string>('');
  const [newKey, setNewKey] = useState<string>('');
  const [isAddingKey, setIsAddingKey] = useState<boolean>(false);
  const [editingKey, setEditingKey] = useState<{
    id: number;
    service: string;
    key: string;
  } | null>(null);

  // API 키 목록 불러오기
  const loadApiKeys = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const keys = await getAllApiKeys();
      setApiKeys(keys);
    } catch (err) {
      console.error('API 키 목록 불러오기 오류:', err);
      setError('API 키 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 컴포넌트 마운트 시 API 키 목록 불러오기
  useEffect(() => {
    loadApiKeys();
  }, []);

  // API 키 저장
  const handleSaveApiKey = async (service: string, key: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await saveApiKey(service, key);
      await loadApiKeys();
      setNewService('');
      setNewKey('');
      setIsAddingKey(false);
      setEditingKey(null);
    } catch (err) {
      console.error('API 키 저장 오류:', err);
      setError('API 키를 저장하는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // API 키 삭제
  const handleDeleteApiKey = async (service: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await deleteApiKey(service);
      await loadApiKeys();
    } catch (err) {
      console.error('API 키 삭제 오류:', err);
      setError('API 키를 삭제하는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 키 마스킹 함수
  const maskApiKey = (key: string) => {
    if (!key) return '';
    if (key.length <= 8) return '********';
    return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
  };

  // 등록되지 않은 서비스 목록 필터링
  const getAvailableServices = () => {
    const registeredServices = apiKeys.map((key) => key.service);
    return LLM_SERVICES.filter(
      (service) => !registeredServices.includes(service.id)
    );
  };

  // 서비스 이름 표시 (ID -> 이름)
  const getServiceDisplayName = (serviceId: string) => {
    const service = LLM_SERVICES.find((s) => s.id === serviceId);
    return service ? service.name : serviceId;
  };

  return (
    <div className="h-[calc(100vh-2rem)] flex flex-col overflow-hidden">
      <div className="flex-shrink-0 px-6 pt-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">설정</h1>
            <p className="text-muted-foreground">
              API 키 및 기타 설정을 관리하세요.
            </p>
          </div>
        </div>

        <Separator className="my-6" />
      </div>

      <div className="flex-1 px-6 pb-6 overflow-y-auto">
        <div className="grid gap-6 min-w-[600px]">
          <Card className="max-h-full">
            <CardHeader>
              <CardTitle>API 키 관리</CardTitle>
              <CardDescription>
                LLM 서비스에 연결하기 위한 API 키를 관리합니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert
                  variant="destructive"
                  className="mb-4"
                >
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="rounded-md border mb-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>서비스</TableHead>
                      <TableHead>API 키</TableHead>
                      <TableHead className="w-[100px]">작업</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {apiKeys.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={3}
                          className="text-center text-muted-foreground"
                        >
                          {isLoading
                            ? '불러오는 중...'
                            : '저장된 API 키가 없습니다.'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      apiKeys.map((apiKey) => (
                        <TableRow key={apiKey.service}>
                          <TableCell>
                            {editingKey?.service === apiKey.service ? (
                              <Select
                                disabled={true} // 기존 키의 서비스 ID는 수정 불가
                                value={editingKey.service}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="서비스 선택" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value={editingKey.service}>
                                    {getServiceDisplayName(
                                      editingKey.service
                                    )}
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              getServiceDisplayName(apiKey.service)
                            )}
                          </TableCell>
                          <TableCell>
                            {editingKey?.service === apiKey.service ? (
                              <Input
                                value={editingKey.key}
                                onChange={(e) =>
                                  setEditingKey({
                                    ...editingKey,
                                    key: e.target.value,
                                  })
                                }
                                placeholder="API 키 입력"
                                className="w-full"
                                type="password"
                                disabled={isLoading}
                              />
                            ) : (
                              maskApiKey(apiKey.key)
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              {editingKey?.service === apiKey.service ? (
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() =>
                                    handleSaveApiKey(
                                      editingKey.service,
                                      editingKey.key
                                    )
                                  }
                                  disabled={
                                    isLoading ||
                                    !editingKey.service ||
                                    !editingKey.key
                                  }
                                >
                                  <Save className="h-4 w-4" />
                                </Button>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => setEditingKey(apiKey)}
                                  disabled={isLoading}
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="h-4 w-4"
                                  >
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                  </svg>
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() =>
                                  handleDeleteApiKey(apiKey.service)
                                }
                                disabled={isLoading}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {isAddingKey ? (
                <div className="p-4 border rounded-md">
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="service">서비스</Label>
                      <Select
                        value={newService}
                        onValueChange={setNewService}
                        disabled={
                          isLoading || getAvailableServices().length === 0
                        }
                      >
                        <SelectTrigger id="service">
                          <SelectValue placeholder="서비스 선택" />
                        </SelectTrigger>
                        <SelectContent>
                          {getAvailableServices().map((service) => (
                            <SelectItem
                              key={service.id}
                              value={service.id}
                            >
                              {service.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {getAvailableServices().length === 0 && (
                        <p className="text-xs text-muted-foreground">
                          모든 서비스의 API 키가 이미 등록되어 있습니다.
                        </p>
                      )}
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="key">API 키</Label>
                      <Input
                        id="key"
                        value={newKey}
                        onChange={(e) => setNewKey(e.target.value)}
                        placeholder="API 키를 입력하세요"
                        type="password"
                        disabled={isLoading}
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => setIsAddingKey(false)}
                        disabled={isLoading}
                      >
                        취소
                      </Button>
                      <Button
                        onClick={() => handleSaveApiKey(newService, newKey)}
                        disabled={isLoading || !newService || !newKey}
                      >
                        저장
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <Button
                  onClick={() => setIsAddingKey(true)}
                  disabled={
                    isLoading || getAvailableServices().length === 0
                  }
                >
                  <Plus className="h-4 w-4 mr-2" /> API 키 추가
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
