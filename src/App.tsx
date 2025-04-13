import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { TitleBar } from './components/TitleBar';
import Home from './pages/home';
import Settings from './pages/settings';

function App() {
  return (
    <BrowserRouter>
      <div className="flex flex-col h-screen">
        <TitleBar />
        <main className="flex-grow overflow-auto">
          <Routes>
            <Route
              path="/"
              element={<Home />}
            />
            <Route
              path="/settings"
              element={<Settings />}
            />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
