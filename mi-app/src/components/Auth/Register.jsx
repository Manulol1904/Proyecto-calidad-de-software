import React, { useState } from "react";
import api from "../../Api/apiClient";
import { useNavigate } from "react-router-dom";
import "../../assets/styles/registro.css";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const nav = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/auth/register", { email, password });
      nav("/login");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || err.message);
    }
  };

  return (
    <div className="register-container">
      <div className="register-card">
        <h2>Crear cuenta</h2>
        <form className="register-form" onSubmit={submit}>
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
          <button type="submit">Registrarse</button>
        </form>
      </div>
    </div>
  );
}
