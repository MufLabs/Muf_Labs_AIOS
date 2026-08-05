import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useVaultInit } from "./hooks/useVaultInit";
import { OnboardingView } from "./components/OnboardingView";
import App from "./App";
import "./styles/app.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Loading spinner component
function LoadingSpinner() {
  return (
    <div className="onboarding-shell">
      <div className="onboarding-card">
        <div className="onboarding-spinner large" />
        <h2>Initializing AIOS…</h2>
        <p className="onboarding-lead">Loading your vault configuration</p>
      </div>
    </div>
  );
}

// Error view component
function ErrorView({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="onboarding-shell">
      <div className="onboarding-card">
        <div className="onboarding-logo">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        </div>
        <h1>Initialization Error</h1>
        <p className="onboarding-error">{error}</p>
        <div className="onboarding-actions">
          <button className="onboarding-btn primary" onClick={onRetry}>
            Retry
          </button>
        </div>
      </div>
    </div>
  );
}

function AppWrapper() {
  const { state, vaultConfig, error, retry, triggerOnboarding } = useVaultInit();

  if (state === "loading") {
    return <LoadingSpinner />;
  }

  if (state === "onboarding") {
    return (
      <QueryClientProvider client={queryClient}>
        <OnboardingView onComplete={(userId) => {
          // Onboarding complete - trigger re-initialization
          // The vault config should already be saved by OnboardingView
          // We'll reload the page to pick up the new config
          window.location.reload();
        }} />
      </QueryClientProvider>
    );
  }

  if (state === "error") {
    return <ErrorView error={error ?? "Unknown error"} onRetry={retry} />;
  }

  // state === "ready"
  return (
    <QueryClientProvider client={queryClient}>
      <App vaultConfig={vaultConfig} onReconfigureVault={triggerOnboarding} />
    </QueryClientProvider>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppWrapper />
  </React.StrictMode>
);