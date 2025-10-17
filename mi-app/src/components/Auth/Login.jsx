import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthProvider";
import "../../assets/styles/login.css";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, loading, error } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="login-title">Bienvenido de nuevo 👋</h1>
        <p className="login-subtitle">Inicia sesión para acceder a tu panel personal</p>

        <form className="login-form" onSubmit={handleSubmit}>
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

          <div className="login-links">
            <Link to="/forgot-password" className="forgot-link">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          <button type="submit" disabled={loading} className="login-btn">
            {loading ? "Cargando..." : "Entrar"}
          </button>
        </form>

        {error && (
          <div className="login-error">
            {error.message || "Error al iniciar sesión"}
          </div>
        )}

        <div className="register-section">
          <p>¿No tienes cuenta?</p>
          <button
            onClick={() => navigate("/register")}
            className="register-btn"
          >
            Crear cuenta
          </button>
        </div>
      </div>
    </div>
  );
}
