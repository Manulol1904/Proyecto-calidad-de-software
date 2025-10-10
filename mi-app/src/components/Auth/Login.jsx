import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthProvider";
import "../../assets/styles/login.css";
export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, loading, error } = useAuth();
  const nav = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      nav("/");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Iniciar sesión</h2>
        <form className="login-form" onSubmit={submit}>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Correo electrónico"
            type="email"
            required
          />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Contraseña"
            type="password"
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? "Cargando..." : "Entrar"}
          </button>
        </form>

        {error && (
          <div className="login-error">
            {error.message || "Error al iniciar sesión"}
          </div>
        )}
      </div>
      <button
        onClick={() => navigate("/register")}
        style={{
          marginTop: "1rem",
          backgroundColor: "transparent",
          border: "none",
          color: "#52c49d",
          fontSize: "1rem",
          cursor: "pointer",
          textDecoration: "underline"
        }}
      >
        ¿Ya tienes cuenta? Inicia sesión aquí
      </button>

    </div>
  );
}

