"use client";

import { useEffect } from "react";

type PaymentReturnClientProps = {
  result: "success" | "failure";
};

export function PaymentReturnClient({ result }: PaymentReturnClientProps) {
  const appUrl = `jetkiz://payment/return?result=${result}`;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      window.location.href = appUrl;
    }, 150);

    return () => window.clearTimeout(timer);
  }, [appUrl]);

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#f7faf5",
        padding: 24,
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: 420,
          background: "white",
          border: "1px solid #e6ebe3",
          borderRadius: 24,
          padding: 28,
          textAlign: "center",
        }}
      >
        <h1 style={{ margin: 0, fontSize: 26, lineHeight: 1.15 }}>
          Возвращаемся в JETKIZ
        </h1>
        <p style={{ margin: "12px 0 22px", color: "#647062", lineHeight: 1.5 }}>
          Если приложение не открылось автоматически, нажмите кнопку ниже.
        </p>
        <a
          href={appUrl}
          style={{
            display: "block",
            width: "100%",
            boxSizing: "border-box",
            borderRadius: 14,
            padding: "15px 18px",
            background: "#489f2a",
            color: "white",
            fontWeight: 800,
            textDecoration: "none",
          }}
        >
          Открыть JETKIZ
        </a>
      </section>
    </main>
  );
}
