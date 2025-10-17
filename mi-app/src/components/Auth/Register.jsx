import React, { useState } from "react";
import api from "../../Api/apiClient";
import { useNavigate } from "react-router-dom";
import "../../assets/styles/registro.css";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [income, setIncome] = useState("");
  const nav = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/auth/register", {
        name,
        email,
        password,
        income: parseFloat(income) || 0,
      });
      alert("Cuenta creada con éxito. Inicia sesión.");
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
        <p className="register-subtitle">
          Regístrate para gestionar tus gastos y finanzas personales.
        </p>

        <form className="register-form" onSubmit={submit}>
          <label>Nombre completo</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tu nombre completo"
            type="text"
            required
          />

          <label>Correo electrónico</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Correo electrónico"
            type="email"
            required
          />

          <label>Contraseña</label>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Contraseña"
            type="password"
            required
            maxLength={72}
          />

          <label>Ingresos mensuales (opcional)</label>
          <input
            value={income}
            onChange={(e) => setIncome(e.target.value)}
            placeholder="Ej: 2500000"
            type="number"
            min="0"
            step="1000"
          />

          <button type="submit">Registrarse</button>
        </form>

        <button className="redirect-login" onClick={() => nav("/login")}>
          ¿Ya tienes una cuenta? Inicia sesión aquí
        </button>
      </div>
    </div>
  );
}
