import { useEffect, useState } from "react";
import { tbitRegistrationClient } from "../api/tbit/tbitRegistrationClient";
import type { SetupStatus } from "../api/tbit/tbitRegistrationClient";
import { tbitVaultClient } from "../api/tbit/tbitVaultClient";
import { useVaultPicker } from "../hooks/useVaultPicker";
import type { VaultConfig } from "../types/vault";
import "../styles/onboarding.css";

type Step = "welcome" | "vault" | "profile" | "creating" | "done" | "error";

interface VaultStepState {
  config: VaultConfig | null;
  isLoading: boolean;
  error: string | null;
}

export function OnboardingView({ onComplete }: { onComplete: (userId: string) => void }) {
  const [step, setStep] = useState<Step>("welcome");
  const [checking, setChecking] = useState(true);
  const [userId, setUserId] = useState("");
  const [spaceLabel, setSpaceLabel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ containerId: string; label: string } | null>(null);
  const [vaultState, setVaultState] = useState<VaultStepState>({
    config: null,
    isLoading: false,
    error: null,
  });

  const { isSupported, pickVaultFolder, restorePermission, loadVaultConfig } = useVaultPicker();

  // On mount, check server-side setup status. If already initialized, skip wizard.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const status: SetupStatus = await tbitRegistrationClient.getSetupStatus();
        if (cancelled) return;
        if (status.initialized) {
          // Vault is already configured on server. Check if we have a local vault config.
          const vaultConfig = await loadVaultConfig();
          if (vaultConfig) {
            // Restore permission and verify vault is accessible
            const hasPermission = await restorePermission(vaultConfig);
            if (hasPermission) {
              // Try to get user ID from server-side config
              const config = await tbitVaultClient.getVaultConfig();
              // We need a userId to complete onboarding - if we have vault config,
              // the user should already be known to the server
              // For now, we'll just let the user complete onboarding
              // The actual userId comes from the initial bootstrap
            }
          }
        }
        setChecking(false);
      } catch {
        // If status endpoint is unreachable, fall back to client-side hint.
        if (!cancelled) setChecking(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [onComplete, loadVaultConfig, restorePermission]);

  const startSetup = () => setStep("vault");

  const handleVaultPick = async () => {
    setVaultState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const config = await pickVaultFolder();
      if (config) {
        setVaultState((prev) => ({ ...prev, config, isLoading: false }));
        setStep("profile");
      } else {
        // User cancelled
        setVaultState((prev) => ({ ...prev, isLoading: false }));
      }
    } catch (e) {
      setVaultState((prev) => ({
        ...prev,
        isLoading: false,
        error: e instanceof Error ? e.message : "Failed to pick folder",
      }));
    }
  };

  const finishProfile = () => {
    if (!userId.trim()) {
      setError("Please enter a user id (e.g. your email or username).");
      return;
    }
    if (!vaultState.config) {
      setError("Vault configuration missing. Please select a vault folder first.");
      return;
    }
    setError(null);
    setStep("creating");
    void runBootstrap(userId.trim(), spaceLabel.trim() || undefined);
  };

  async function runBootstrap(id: string, label?: string) {
    try {
      // Use the new vault-aware bootstrap method
      const res = await tbitRegistrationClient.bootstrapWithVault(
        vaultState.config!,
        id,
        label,
        true
      );
      setResult({ containerId: res.containerId, label: res.label });
      setStep("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setStep("error");
    }
  }

  const finish = () => {
    if (result) onComplete(userId.trim());
  };

  if (checking) {
    return (
      <div className="onboarding-shell">
        <div className="onboarding-card">
          <div className="onboarding-spinner" />
          <h2>Checking T-Bit setup…</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="onboarding-shell">
      <div className="onboarding-card">
        <div className="onboarding-logo">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        </div>

        {step === "welcome" && (
          <>
            <h1>Welcome to AIOS</h1>
            <p className="onboarding-lead">
              This is your first run. We'll create your private T-Bit memory space, generate an
              encryption key, and prepare your secure vault — no configuration required.
            </p>
            <ul className="onboarding-checklist">
              <li><span className="dot ok" /> Personal space manifest</li>
              <li><span className="dot ok" /> AES-256-GCM encryption key</li>
              <li><span className="dot ok" /> Encrypted memory container</li>
            </ul>
            <button className="onboarding-btn primary" onClick={startSetup}>
              Get started
            </button>
          </>
        )}

        {step === "vault" && (
          <>
            <h1>Choose Your Vault Location</h1>
            <p className="onboarding-lead">
              Select a folder where AIOS will store your encrypted memory vault.
              This location persists across sessions and devices.
            </p>

            {isSupported ? (
              <>
                <div className="onboarding-vault-picker">
                  <button
                    className="onboarding-btn primary"
                    onClick={handleVaultPick}
                    disabled={vaultState.isLoading}
                  >
                    {vaultState.isLoading ? (
                      <>
                        <span className="onboarding-spinner small" /> Choosing…
                      </>
                    ) : (
                      "Choose Vault Folder"
                    )}
                  </button>
                  {vaultState.config && (
                    <div className="onboarding-vault-selected">
                      <span className="vault-icon">📁</span>
                      <span>{vaultState.config.rootPath || vaultState.config.label}</span>
                      <button
                        className="onboarding-btn secondary small"
                        onClick={() => setVaultState((prev) => ({ ...prev, config: null }))}
                      >
                        Change
                      </button>
                    </div>
                  )}
                  {vaultState.error && <p className="onboarding-error">{vaultState.error}</p>}
                </div>
                <p className="onboarding-hint">
                  Your browser will ask for permission to access this folder.
                  This permission is stored securely and re-requested on each visit if needed.
                </p>
              </>
            ) : (
              <>
                <div className="onboarding-vault-unsupported">
                  <div className="unsupported-icon">🔒</div>
                  <h2>Native Vault Access Not Supported</h2>
                  <p className="onboarding-notice">
                    Your current browser does not support the File System Access API,
                    which is required for secure, native folder selection.
                  </p>
                  <div className="unsupported-actions">
                    <p className="unsupported-recommendation">
                      <strong>Recommended:</strong> Use Google Chrome or Microsoft Edge
                      for full AIOS vault functionality.
                    </p>
                    <p className="unsupported-recommendation">
                      <strong>Alternative:</strong> Use the AIOS Desktop application
                      (when available) for native filesystem access on Windows, macOS, or Linux.
                    </p>
                  </div>
                  <div className="onboarding-actions">
                    <button className="onboarding-btn" onClick={() => setStep("welcome")}>
                      Back
                    </button>
                  </div>
                </div>
              </>
            )}

            <div className="onboarding-actions">
              <button className="onboarding-btn" onClick={() => setStep("welcome")}>
                Back
              </button>
            </div>
          </>
        )}

        {step === "profile" && (
          <>
            <h1>Create your space</h1>
            <p className="onboarding-lead">Choose a user id and an optional label for your T-Bit space.</p>
            <label className="onboarding-field">
              <span>User id</span>
              <input
                type="text"
                value={userId}
                autoFocus
                placeholder="e.g. jane@example.com"
                onChange={(e) => setUserId(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") finishProfile();
                }}
              />
            </label>
            <label className="onboarding-field">
              <span>Space label (optional)</span>
              <input
                type="text"
                value={spaceLabel}
                placeholder="AIOS Space"
                onChange={(e) => setSpaceLabel(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") finishProfile();
                }}
              />
            </label>
            {error && <p className="onboarding-error">{error}</p>}
            <div className="onboarding-actions">
              <button className="onboarding-btn" onClick={() => setStep("vault")}>
                Back
              </button>
              <button className="onboarding-btn primary" onClick={finishProfile}>
                Create space
              </button>
            </div>
          </>
        )}

        {step === "creating" && (
          <>
            <h1>Setting up your vault…</h1>
            <p className="onboarding-lead">Generating encryption key and creating your T-Bit space.</p>
            <div className="onboarding-spinner large" />
          </>
        )}

        {step === "done" && result && (
          <>
            <h1>Your space is ready 🎉</h1>
            <p className="onboarding-lead">Your secure T-Bit container has been created.</p>
            <dl className="onboarding-result">
              <dt>Space label</dt>
              <dd>{result.label}</dd>
              <dt>Container id</dt>
              <dd><code>{result.containerId}</code></dd>
            </dl>
            <button className="onboarding-btn primary" onClick={finish}>
              Enter AIOS
            </button>
          </>
        )}

        {step === "error" && (
          <>
            <h1>Setup failed</h1>
            <p className="onboarding-error">{error ?? "Unknown error"}</p>
            <div className="onboarding-actions">
              <button className="onboarding-btn" onClick={() => setStep("vault")}>
                Try again
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default OnboardingView;
