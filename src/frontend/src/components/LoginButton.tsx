import { Loader2, LogIn, LogOut, User } from "lucide-react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export function LoginButton({ compact = false }: { compact?: boolean }) {
  const { identity, login, clear, isLoggingIn, isInitializing } =
    useInternetIdentity();

  const isAnonymous = !identity || identity.getPrincipal().isAnonymous();

  if (isInitializing) {
    return (
      <Loader2
        size={16}
        className="animate-spin"
        style={{ color: "var(--cyan)" }}
      />
    );
  }

  if (!isAnonymous) {
    const principal = identity!.getPrincipal().toString();
    const shortPrincipal = `${principal.slice(0, 5)}...${principal.slice(-3)}`;
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        {!compact && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 10px",
              borderRadius: "8px",
              background: "rgba(32,230,230,0.1)",
              border: "1px solid rgba(32,230,230,0.25)",
            }}
          >
            <User size={12} style={{ color: "var(--cyan)" }} />
            <span
              style={{
                fontSize: "11px",
                color: "var(--cyan)",
                fontFamily: "monospace",
              }}
            >
              {shortPrincipal}
            </span>
          </div>
        )}
        <button
          type="button"
          data-ocid="auth.logout.button"
          onClick={clear}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "6px 10px",
            borderRadius: "8px",
            background: "transparent",
            border: "1px solid rgba(239,68,68,0.3)",
            color: "rgba(239,68,68,0.7)",
            cursor: "pointer",
            fontSize: "12px",
            transition: "all 0.2s",
            minHeight: "36px",
          }}
          title="Log out"
        >
          <LogOut size={13} />
          {!compact && "Logout"}
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      data-ocid="auth.login.button"
      onClick={login}
      disabled={isLoggingIn}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "6px",
        padding: "6px 12px",
        borderRadius: "8px",
        background: "rgba(32,230,230,0.12)",
        border: "1.5px solid rgba(32,230,230,0.4)",
        color: "var(--cyan)",
        cursor: "pointer",
        fontSize: "12px",
        fontWeight: 700,
        transition: "all 0.2s",
        boxShadow: "0 0 12px rgba(32,230,230,0.15)",
        opacity: isLoggingIn ? 0.7 : 1,
        minHeight: "36px",
      }}
    >
      {isLoggingIn ? (
        <Loader2 size={13} className="animate-spin" />
      ) : (
        <LogIn size={13} />
      )}
      {isLoggingIn ? "Logging in..." : "Login"}
    </button>
  );
}
