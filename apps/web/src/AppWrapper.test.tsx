// @vitest-environment jsdom

/**
 * Stage 8.3 — AppWrapper Test Suite
 *
 * Verifies the state-machine routing of `AppWrapper`:
 *
 *   loading    → LoadingSpinner
 *   onboarding → OnboardingView (wrapped in QueryClientProvider)
 *   ready      → App (wrapped in QueryClientProvider)
 *   error      → ErrorView
 *
 * Also verifies the OnboardingView → window.location.reload() trigger
 * and the App → triggerOnboarding reconfiguration wiring.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { AppWrapper } from "./AppWrapper";
import type { VaultConfig, VaultStatusResponse } from "./types/vault";

// ──────────────────────────────────────────────────────────────────────────
// Module mocks
// ──────────────────────────────────────────────────────────────────────────

const mockUseVaultInitState: {
  state: "loading" | "onboarding" | "ready" | "error";
  vaultConfig: VaultConfig | null;
  vaultStatus: VaultStatusResponse | null;
  error: string | null;
  retry: () => Promise<void>;
  triggerOnboarding: () => void;
} = {
  state: "loading",
  vaultConfig: null,
  vaultStatus: null,
  error: null,
  retry: vi.fn(async () => {}),
  triggerOnboarding: vi.fn(),
};

vi.mock("./hooks/useVaultInit", () => ({
  useVaultInit: () => mockUseVaultInitState,
}));

vi.mock("./components/OnboardingView", () => ({
  OnboardingView: ({ onComplete }: { onComplete: (userId: string) => void }) => (
    <div data-testid="onboarding-mock">
      <span>OnboardingView</span>
      <button onClick={() => onComplete("test-user")}>Complete</button>
    </div>
  ),
}));

vi.mock("./App", () => ({
  default: (props: { vaultConfig: VaultConfig | null; onReconfigureVault: () => void }) => (
    <div data-testid="app-mock">
      <span>App</span>
      <span data-testid="app-vault-id">{props.vaultConfig?.id ?? "none"}</span>
      <button onClick={props.onReconfigureVault}>Reconfigure</button>
    </div>
  ),
}));

// ──────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────

function makeConfig(): VaultConfig {
  return {
    id: "ready-config",
    label: "Ready Vault",
    rootHandle: {} as FileSystemDirectoryHandle,
    rootPath: "/ready",
    spacesRoot: "/ready/spaces",
    createdAt: new Date().toISOString(),
    schemaVersion: 1,
  };
}

beforeEach(() => {
  mockUseVaultInitState.state = "loading";
  mockUseVaultInitState.vaultConfig = null;
  mockUseVaultInitState.vaultStatus = null;
  mockUseVaultInitState.error = null;
  mockUseVaultInitState.retry = vi.fn(async () => {});
  mockUseVaultInitState.triggerOnboarding = vi.fn();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ──────────────────────────────────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────────────────────────────────

describe("AppWrapper — loading state", () => {
  it("renders the LoadingSpinner when state is 'loading'", () => {
    mockUseVaultInitState.state = "loading";

    render(<AppWrapper />);

    expect(screen.getByText(/Initializing AIOS/i)).toBeDefined();
    expect(screen.queryByTestId("onboarding-mock")).toBeNull();
    expect(screen.queryByTestId("app-mock")).toBeNull();
    expect(screen.queryByText(/Initialization Error/i)).toBeNull();
  });
});

describe("AppWrapper — onboarding state", () => {
  it("renders OnboardingView when state is 'onboarding'", () => {
    mockUseVaultInitState.state = "onboarding";

    render(<AppWrapper />);

    expect(screen.getByTestId("onboarding-mock")).toBeDefined();
    expect(screen.queryByTestId("app-mock")).toBeNull();
    expect(screen.queryByText(/Initializing AIOS/i)).toBeNull();
  });

  it("invokes window.location.reload() when OnboardingView completes", () => {
    mockUseVaultInitState.state = "onboarding";

    // jsdom does not expose `reload` on `Location.prototype` and the instance
    // property is non-configurable. Stub it on a fresh location-like object
    // and override `window.location` so `AppWrapper`'s `window.location.reload()`
    // call lands on our spy.
    const reloadSpy = vi.fn();
    const originalLocation = window.location;
    const stubbedLocation = Object.assign({}, originalLocation, { reload: reloadSpy });
    Object.defineProperty(window, "location", {
      configurable: true,
      writable: true,
      value: stubbedLocation,
    });

    try {
      render(<AppWrapper />);
      fireEvent.click(screen.getByText("Complete"));

      expect(reloadSpy).toHaveBeenCalledTimes(1);
    } finally {
      reloadSpy.mockRestore();
    }
  });
});

describe("AppWrapper — ready state", () => {
  it("renders the App when state is 'ready' and passes vaultConfig + onReconfigureVault", () => {
    const cfg = makeConfig();
    mockUseVaultInitState.state = "ready";
    mockUseVaultInitState.vaultConfig = cfg;

    render(<AppWrapper />);

    expect(screen.getByTestId("app-mock")).toBeDefined();
    expect(screen.getByTestId("app-vault-id").textContent).toBe("ready-config");
    expect(screen.queryByTestId("onboarding-mock")).toBeNull();
  });

  it("forwards onReconfigureVault to App which calls triggerOnboarding", () => {
    mockUseVaultInitState.state = "ready";
    mockUseVaultInitState.vaultConfig = makeConfig();

    render(<AppWrapper />);
    fireEvent.click(screen.getByText("Reconfigure"));

    expect(mockUseVaultInitState.triggerOnboarding).toHaveBeenCalledTimes(1);
  });

  it("renders App with vaultConfig=null when state is 'ready' but config is null (defensive)", () => {
    mockUseVaultInitState.state = "ready";
    mockUseVaultInitState.vaultConfig = null;

    render(<AppWrapper />);

    expect(screen.getByTestId("app-mock")).toBeDefined();
    expect(screen.getByTestId("app-vault-id").textContent).toBe("none");
  });
});

describe("AppWrapper — error state", () => {
  it("renders the ErrorView when state is 'error'", () => {
    mockUseVaultInitState.state = "error";
    mockUseVaultInitState.error = "Network unreachable";

    render(<AppWrapper />);

    expect(screen.getByText(/Initialization Error/i)).toBeDefined();
    expect(screen.getByText("Network unreachable")).toBeDefined();
    expect(screen.queryByTestId("onboarding-mock")).toBeNull();
    expect(screen.queryByTestId("app-mock")).toBeNull();
  });

  it("ErrorView's Retry button invokes useVaultInit's retry()", () => {
    const retryMock = vi.fn(async () => {});
    mockUseVaultInitState.state = "error";
    mockUseVaultInitState.error = "Boom";
    mockUseVaultInitState.retry = retryMock;

    render(<AppWrapper />);
    fireEvent.click(screen.getByText("Retry"));

    expect(retryMock).toHaveBeenCalledTimes(1);
  });

  it("ErrorView falls back to 'Unknown error' when error is null", () => {
    mockUseVaultInitState.state = "error";
    mockUseVaultInitState.error = null;

    render(<AppWrapper />);

    expect(screen.getByText("Unknown error")).toBeDefined();
  });
});

describe("AppWrapper — state transitions", () => {
  it("transitions from loading → onboarding when state changes", async () => {
    mockUseVaultInitState.state = "loading";
    const { rerender } = render(<AppWrapper />);
    expect(screen.getByText(/Initializing AIOS/i)).toBeDefined();

    mockUseVaultInitState.state = "onboarding";
    rerender(<AppWrapper />);

    await waitFor(() => {
      expect(screen.getByTestId("onboarding-mock")).toBeDefined();
    });
    expect(screen.queryByText(/Initializing AIOS/i)).toBeNull();
  });

  it("transitions from onboarding → ready when vault becomes available", async () => {
    mockUseVaultInitState.state = "onboarding";
    const { rerender } = render(<AppWrapper />);
    expect(screen.getByTestId("onboarding-mock")).toBeDefined();

    mockUseVaultInitState.state = "ready";
    mockUseVaultInitState.vaultConfig = makeConfig();
    rerender(<AppWrapper />);

    await waitFor(() => {
      expect(screen.getByTestId("app-mock")).toBeDefined();
    });
    expect(screen.queryByTestId("onboarding-mock")).toBeNull();
  });

  it("transitions from ready → onboarding when triggerOnboarding is invoked", async () => {
    mockUseVaultInitState.state = "ready";
    mockUseVaultInitState.vaultConfig = makeConfig();
    const { rerender } = render(<AppWrapper />);
    expect(screen.getByTestId("app-mock")).toBeDefined();

    // Simulate the App's onReconfigureVault call
    fireEvent.click(screen.getByText("Reconfigure"));
    expect(mockUseVaultInitState.triggerOnboarding).toHaveBeenCalled();

    // Simulate the hook's response to triggerOnboarding
    mockUseVaultInitState.state = "onboarding";
    mockUseVaultInitState.vaultConfig = null;
    rerender(<AppWrapper />);

    await waitFor(() => {
      expect(screen.getByTestId("onboarding-mock")).toBeDefined();
    });
    expect(screen.queryByTestId("app-mock")).toBeNull();
  });

  it("transitions from loading → error → loading on retry", async () => {
    const retryMock = vi.fn(async () => {});
    mockUseVaultInitState.state = "loading";
    mockUseVaultInitState.retry = retryMock;

    const { rerender } = render(<AppWrapper />);
    expect(screen.getByText(/Initializing AIOS/i)).toBeDefined();

    mockUseVaultInitState.state = "error";
    mockUseVaultInitState.error = "x";
    rerender(<AppWrapper />);

    await waitFor(() => {
      expect(screen.getByText(/Initialization Error/i)).toBeDefined();
    });

    fireEvent.click(screen.getByText("Retry"));
    expect(retryMock).toHaveBeenCalledTimes(1);

    mockUseVaultInitState.state = "loading";
    mockUseVaultInitState.error = null;
    rerender(<AppWrapper />);

    await waitFor(() => {
      expect(screen.getByText(/Initializing AIOS/i)).toBeDefined();
    });
  });
});
