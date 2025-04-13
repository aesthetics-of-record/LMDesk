import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Minus,
  Square,
  X,
  Settings,
  Home,
  ChevronDown,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// 백엔드 API 호출 함수 (오류 처리 등 추가 가능)
const callWindowApi = async (action: string) => {
  const windowId = await window.pyloid.BaseAPI.getWindowId();
  const data = await window.pyloid.BaseAPI.getData();
  const url = data.api_url;

  try {
    const response = await fetch(`${url}/window/${action}/${windowId}`);
    if (!response.ok) {
      console.error(`Failed to ${action} window:`, response.statusText);
    }
  } catch (error) {
    console.error(`Error calling window API (${action}):`, error);
  }
};

export function TitleBar() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // 메뉴 외부 클릭 시 닫기
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleMinimize = () => {
    callWindowApi('minimize');
  };

  const handleMaximize = () => {
    callWindowApi('toggle-maximize');
  };

  const handleHide = () => {
    callWindowApi('hide');
  };

  const goToHome = () => {
    navigate('/');
    setMenuOpen(false);
  };

  const goToSettings = () => {
    navigate('/settings');
    setMenuOpen(false);
  };

  return (
    <div
      data-pyloid-drag-region
      className="h-8 select-none flex justify-between items-center bg-background border-b sticky top-0 z-50"
    >
      {/* 앱 메뉴 */}
      <div
        className="flex items-center h-full relative"
        ref={menuRef}
      >
        <Button
          variant="ghost"
          className="px-2 h-8 rounded-none flex items-center"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span className="text-xs font-medium mr-1">LMDesk</span>
          <ChevronDown className="h-3 w-3" />
        </Button>

        {/* 사용자 정의 메뉴 */}
        {menuOpen && (
          <div className="absolute top-8 left-0 bg-popover border rounded-md shadow-md p-1 w-[150px] z-[100]">
            <button
              className="flex items-center w-full rounded px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
              onClick={goToHome}
            >
              <Home className="mr-2 h-4 w-4" />
              <span>홈</span>
            </button>
            <button
              className="flex items-center w-full rounded px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
              onClick={goToSettings}
            >
              <Settings className="mr-2 h-4 w-4" />
              <span>설정</span>
            </button>
          </div>
        )}
      </div>

      {/* 중앙 여백 영역 */}
      <div
        className="flex-1"
        data-pyloid-drag-region
      ></div>

      {/* 창 제어 버튼 */}
      <div className="flex items-center h-full">
        <Button
          variant="ghost"
          size="icon"
          className="h-full w-10 rounded-none flex items-center justify-center"
          onClick={handleMinimize}
          aria-label="Minimize"
        >
          <Minus className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-full w-10 rounded-none flex items-center justify-center"
          onClick={handleMaximize}
          aria-label="Maximize"
        >
          <Square className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-full w-10 rounded-none flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground focus-visible:bg-destructive focus-visible:text-destructive-foreground"
          onClick={handleHide}
          aria-label="Hide"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
