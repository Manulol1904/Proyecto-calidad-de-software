import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthProvider";
import "../../assets/styles/login.css";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, loading, error } = useAuth();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoggingIn(true);
    
    try {
      // Hacer login y esperar respuesta
      await login(email, password);
      
      // Pequeña espera para asegurar que el token se guarde
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log("✅ Login exitoso, navegando al dashboard...");
      
      // Navegar al dashboard
      navigate("/", { replace: true });
    } catch (err) {
      console.error("❌ Error en login:", err);
      setIsLoggingIn(false);
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
            disabled={isLoggingIn}
          />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Contraseña"
            type="password"
            required
            disabled={isLoggingIn}
          />

          <div className="login-links">
            <Link to="/forgot-password" className="forgot-link">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          <button 
            type="submit" 
            disabled={loading || isLoggingIn} 
            className="login-btn"
          >
            {isLoggingIn ? "Iniciando sesión..." : "Entrar"}
          </button>
        </form>

        {error && (
          <div className="login-error">
            {error.message || error.detail || "Error al iniciar sesión"}
          </div>
        )}

        <div className="register-section">
          <p>¿No tienes cuenta?</p>
          <button
            onClick={() => navigate("/register")}
            className="register-btn"
            disabled={isLoggingIn}
          >
            Crear cuenta
          </button>
        </div>
      </div>
    </div>
  );
}