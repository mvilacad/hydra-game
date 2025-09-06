import { BrowserRouter as Router, Routes, Route, useSearchParams } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import "@fontsource/inter";
import "./index.css";

// Import views
import { MobileGameView } from "./views/mobile";
import { HubGameView } from "./views/hub";

// Create query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
  },
});

// Main App Router
function AppRouter() {
  const [searchParams] = useSearchParams();
  const view = searchParams.get('view');

  // Auto-detect if this should be mobile or hub based on screen size and URL
  useEffect(() => {
    if (!view) {
      const isMobile = window.innerWidth < 768;
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set('view', isMobile ? 'mobile' : 'hub');
      window.history.replaceState({}, '', newUrl.toString());
    }
  }, [view]);

  // Render based on view parameter
  if (view === 'mobile') {
    return <MobileGameView />;
  } else if (view === 'hub') {
    return <HubGameView />;
  }

  // Default to mobile for small screens, hub for large
  return window.innerWidth < 768 ? <MobileGameView /> : <HubGameView />;
}

// Main App component
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-gray-900 text-white overflow-hidden">
          <Routes>
            <Route path="/*" element={<AppRouter />} />
          </Routes>
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
