import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import HomePage from './pages/HomePage';
import JogosPage from './pages/JogosPage';
import JogoPage from './pages/JogoPage';
import AdminPage from './pages/AdminPage';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 1000 * 60 * 5 } },
});

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
      <Footer />
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <Toaster theme="dark" position="top-right" />
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Layout><HomePage /></Layout>} />
        <Route path="/jogos" element={<Layout><JogosPage /></Layout>} />
        <Route path="/jogo/:slug" element={<Layout><JogoPage /></Layout>} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="*" element={
          <Layout>
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-center">
                <div className="text-7xl mb-4">🎮</div>
                <h1 className="font-display text-5xl font-black mb-4">404</h1>
                <p className="text-muted-foreground mb-6">Página não encontrada</p>
                <a href="/" className="px-6 py-3 rounded-xl btn-neon text-white font-bold inline-block">Ir para o Início</a>
              </div>
            </div>
          </Layout>
        } />
      </Routes>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
