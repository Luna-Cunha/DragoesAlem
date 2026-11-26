import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { ReferenceDrawer } from './components/ReferenceDrawer';
import { DiceTray } from './components/DiceTray';
import { SetupPage } from './pages/SetupPage';
import { CharactersVaultPage } from './pages/CharactersVaultPage';
import { CharacterBuilderPage } from './pages/CharacterBuilderPage';
import { CharacterSheetPage } from './pages/CharacterSheetPage';

function AppRoutes() {
  const { compendium, booting } = useApp();

  if (booting) {
    return (
      <div className="min-h-screen bg-[#0c1016] text-slate-200 flex items-center justify-center gap-3 text-sm font-semibold">
        <Loader2 className="w-5 h-5 animate-spin text-[#e40712]" />
        Loading local compendium &amp; characters...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/setup" element={<SetupPage />} />
          <Route
            path="/characters"
            element={compendium ? <CharactersVaultPage /> : <Navigate to="/setup" replace />}
          />
          <Route
            path="/characters/builder"
            element={compendium ? <CharacterBuilderPage /> : <Navigate to="/setup" replace />}
          />
          <Route
            path="/characters/builder/:id"
            element={compendium ? <CharacterBuilderPage /> : <Navigate to="/setup" replace />}
          />
          <Route
            path="/characters/:id"
            element={compendium ? <CharacterSheetPage /> : <Navigate to="/setup" replace />}
          />
          <Route
            path="/"
            element={<Navigate to={compendium ? '/characters' : '/setup'} replace />}
          />
          <Route
            path="*"
            element={<Navigate to={compendium ? '/characters' : '/setup'} replace />}
          />
        </Routes>
      </main>
      <ReferenceDrawer />
      <DiceTray />
    </div>
  );
}

export function App() {
  return (
    <AppProvider>
      <HashRouter>
        <AppRoutes />
      </HashRouter>
    </AppProvider>
  );
}

export default App;
