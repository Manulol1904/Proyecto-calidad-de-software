import React, { useState, useEffect } from "react";
import { useSearchParams, Navigate } from "react-router-dom";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = decodeURIComponent(searchParams.get("token")); // decodifica correctamente
  console.log("Token actual: –", token);
 // token de la URL

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [debugToken, setDebugToken] = useState("");


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validación: token presente
    if (!token) {
      setError("Token inválido o ausente");
      return;
    }

    // Validación: contraseñas coincidan
    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    // Validación: longitud mínima
    if (newPassword.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    try {
      const res = await fetch("http://localhost:8000/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, new_password: newPassword }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Error al actualizar la contraseña");
      }

      setSuccess(true);
    } catch (err) {
      setError(err.message);
    }
  };

  // Si no hay token, redirige a forgot-password
  if (!token) {
    return <Navigate to="/forgot-password" replace />;
  }

  if (success) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        ✅ Tu contraseña ha sido actualizada. <br />
        <a href="/login">Inicia sesión</a>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>Restablecer contraseña 🔐</h1>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            placeholder="Nueva contraseña"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Confirma tu contraseña"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <button type="submit">Actualizar contraseña</button>
        </form>
        {error && <p style={{ color: "red" }}>{error}</p>}
      </div>
    </div>
  );
}
