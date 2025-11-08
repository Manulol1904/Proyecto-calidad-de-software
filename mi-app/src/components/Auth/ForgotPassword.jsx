import React, { useState } from "react";
import "../../assets/styles/login.css";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch("http://localhost:8000/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Error al enviar el enlace");
      }

      setSent(true);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="login-title">Recuperar contraseña 🔐</h1>
        <p className="login-subtitle">
          Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.
        </p>

        {!sent ? (
          <form className="login-form" onSubmit={handleSubmit}>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Correo electrónico"
              type="email"
              required
            />
            <button type="submit" className="login-btn">
              Enviar enlace
            </button>

            {error && <p className="error-message">⚠️ {error}</p>}
          </form>
        ) : (
          <div className="success-message">
            ✅ Se ha enviado un enlace a <strong>{email}</strong>. Revisa tu bandeja de entrada.
          </div>
        )}
      </div>
    </div>
  );
}
