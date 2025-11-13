import React, { useState } from "react";
import api from "../../Api/apiClient";
import { useNavigate } from "react-router-dom";
import "../../assets/styles/registro.css";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [income, setIncome] = useState("");
  const [incomeType, setIncomeType] = useState("monthly");
  const nav = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/auth/register", {
        full_name:name,
        email,
        password,
        income: parseFloat(income) || 0,
        income_type: incomeType,
      });
      toast.success("Cuenta creada con éxito. Inicia sesión.");
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

          <label>Tipo de pago</label>
          <select 
            value={incomeType} 
            onChange={(e) => setIncomeType(e.target.value)}
            style={{
              width: "100%",
              padding: "0.8rem",
              marginBottom: "1rem",
              border: "1px solid #cce7de",
              borderRadius: "10px",
              fontSize: "1rem",
              outline: "none"
            }}
          >
            <option value="monthly">💼 Mensual (un pago al mes)</option>
            <option value="biweekly">📅 Quincenal (dos pagos al mes)</option>
          </select>

          <div style={{
            background: "#f0f9ff",
            padding: "10px",
            borderRadius: "8px",
            marginBottom: "1rem",
            fontSize: "0.85rem",
            color: "#0066cc",
            border: "1px solid #b3d9ff"
          }}>
            <strong>💡 ¿Cómo funciona?</strong><br />
            {incomeType === "monthly" ? (
              <>• Tu ingreso completo estará disponible el día 1 de cada mes</>
            ) : (
              <>• Recibirás la mitad de tu ingreso el día 1 y la otra mitad el día 15</>
            )}
          </div>

          <label>Ingresos {incomeType === "monthly" ? "mensuales" : "quincenales"} totales</label>
          <input
            value={income}
            onChange={(e) => setIncome(e.target.value)}
            placeholder={incomeType === "monthly" ? "Ej: 3000000" : "Ej: 3000000 (se dividirá en 2)"}
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