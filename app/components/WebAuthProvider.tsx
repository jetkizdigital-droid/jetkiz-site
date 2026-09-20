"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_JETKIZ_API_BASE_URL || "https://api.jetkiz.asia"
).replace(/\/$/, "");

type WebUser = {
  id?: string;
  phone?: string;
  firstName?: string | null;
  lastName?: string | null;
  name?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  [key: string]: unknown;
};

type AuthContextValue = {
  user: WebUser | null;
  loading: boolean;
  openLogin: () => void;
  closeLogin: () => void;
  refreshUser: () => Promise<WebUser | null>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function baseHeaders() {
  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    "X-App": "website",
    "X-Platform": "web",
    "X-App-Version": "web-1",
    "X-Locale": "ru",
    "X-Timezone": "Asia/Almaty",
  };
}

function normalizePhone(value: string): string | null {
  const digits = value.replace(/\D/g, "");
  let national = digits;

  if (national.length === 11 && (national.startsWith("7") || national.startsWith("8"))) {
    national = national.slice(1);
  }

  if (national.length !== 10) return null;
  return `+7${national}`;
}

async function readJson(response: Response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

function serverMessage(payload: unknown, fallback: string) {
  if (payload && typeof payload === "object") {
    const value = payload as Record<string, unknown>;
    const message = value.message;
    if (typeof message === "string" && message.trim()) return message.trim();
    if (Array.isArray(message) && message.length) return String(message[0]);
  }
  return fallback;
}

function unwrapUser(payload: unknown): WebUser | null {
  if (!payload || typeof payload !== "object") return null;
  const root = payload as Record<string, unknown>;
  const candidate =
    (root.user && typeof root.user === "object" ? root.user : null) ||
    (root.data && typeof root.data === "object" ? root.data : null) ||
    root;
  return candidate as WebUser;
}

export function WebAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<WebUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [loginOpen, setLoginOpen] = useState(false);

  const refreshUser = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        method: "GET",
        headers: baseHeaders(),
        credentials: "include",
        cache: "no-store",
      });

      if (!response.ok) {
        setUser(null);
        return null;
      }

      const nextUser = unwrapUser(await readJson(response));
      setUser(nextUser);
      return nextUser;
    } catch {
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  const logout = useCallback(async () => {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        headers: baseHeaders(),
        credentials: "include",
      });
    } finally {
      setUser(null);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      openLogin: () => setLoginOpen(true),
      closeLogin: () => setLoginOpen(false),
      refreshUser,
      logout,
    }),
    [user, loading, refreshUser, logout],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
      {loginOpen && (
        <LoginDialog
          onClose={() => setLoginOpen(false)}
          onAuthenticated={async () => {
            await refreshUser();
            setLoginOpen(false);
          }}
        />
      )}
    </AuthContext.Provider>
  );
}

export function useWebAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useWebAuth must be used inside WebAuthProvider");
  }
  return value;
}

function LoginDialog({
  onClose,
  onAuthenticated,
}: {
  onClose: () => void;
  onAuthenticated: () => Promise<void>;
}) {
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState("+7 ");
  const [normalizedPhone, setNormalizedPhone] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [resendSeconds, setResendSeconds] = useState(0);

  useEffect(() => {
    if (resendSeconds <= 0) return;
    const timer = window.setInterval(() => {
      setResendSeconds((value) => Math.max(0, value - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [resendSeconds]);

  const requestCode = async (event?: FormEvent) => {
    event?.preventDefault();
    const normalized = normalizePhone(phone);
    if (!normalized) {
      setError("Введите корректный номер Казахстана.");
      return;
    }

    setBusy(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE_URL}/auth/request-code`, {
        method: "POST",
        headers: baseHeaders(),
        credentials: "include",
        body: JSON.stringify({ phone: normalized, deliveryChannel: "SMS" }),
      });
      const payload = await readJson(response);
      if (!response.ok) {
        throw new Error(serverMessage(payload, "Не удалось отправить код."));
      }

      const root =
        payload && typeof payload === "object"
          ? (payload as Record<string, unknown>)
          : {};
      const cooldown = Number(
        root.resendCooldownSeconds ??
          root.resendCooldown ??
          root.cooldownSeconds ??
          60,
      );

      setNormalizedPhone(normalized);
      setResendSeconds(Number.isFinite(cooldown) && cooldown > 0 ? cooldown : 60);
      setStep("code");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Не удалось отправить код.");
    } finally {
      setBusy(false);
    }
  };

  const verifyCode = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = code.replace(/\D/g, "");
    if (trimmed.length !== 6) {
      setError("Введите 6 цифр из SMS.");
      return;
    }

    setBusy(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify-code`, {
        method: "POST",
        headers: baseHeaders(),
        credentials: "include",
        body: JSON.stringify({ phone: normalizedPhone, code: trimmed }),
      });
      const payload = await readJson(response);
      if (!response.ok) {
        throw new Error(serverMessage(payload, "Неверный или просроченный код."));
      }
      await onAuthenticated();
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Не удалось войти в аккаунт.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-modal" role="dialog" aria-modal="true" aria-label="Вход в JETKIZ">
      <button className="auth-modal__backdrop" onClick={onClose} aria-label="Закрыть" />
      <section className="auth-modal__card">
        <button className="auth-modal__close" onClick={onClose} aria-label="Закрыть">×</button>
        <img className="auth-modal__logo" src="/jetkiz-logo.svg" alt="JETKIZ" />
        {step === "phone" ? (
          <form onSubmit={requestCode}>
            <h2>Войти в JETKIZ</h2>
            <p>Введите номер телефона. Код подтверждения придёт по SMS.</p>
            <label>
              Телефон
              <input
                autoFocus
                inputMode="tel"
                autoComplete="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="+7 700 000 00 00"
              />
            </label>
            {error && <div className="auth-error" role="alert">{error}</div>}
            <button className="auth-primary" disabled={busy} type="submit">
              {busy ? "Отправляем…" : "Получить код"}
            </button>
          </form>
        ) : (
          <form onSubmit={verifyCode}>
            <h2>Введите код</h2>
            <p>Мы отправили SMS на {normalizedPhone}.</p>
            <label>
              Код из SMS
              <input
                autoFocus
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
              />
            </label>
            {error && <div className="auth-error" role="alert">{error}</div>}
            <button className="auth-primary" disabled={busy} type="submit">
              {busy ? "Проверяем…" : "Войти"}
            </button>
            <button
              className="auth-secondary"
              disabled={busy || resendSeconds > 0}
              type="button"
              onClick={() => void requestCode()}
            >
              {resendSeconds > 0 ? `Новый код через ${resendSeconds} сек.` : "Отправить код ещё раз"}
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
