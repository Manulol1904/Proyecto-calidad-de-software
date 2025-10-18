import React, { useState } from "react";
import { useExpenses } from "../../context/ExpensesProvider";

export default function ExpenseForm() {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Alimentación");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [type, setType] = useState("expense");
  const { addExpense } = useExpenses();

  const submit = async (e) => {
    e.preventDefault();
    try {
      await addExpense({
        title,
        amount: Math.abs(Number(amount)), // Siempre positivo
        category,
        description,
        date: new Date(date).toISOString(),
        type, // "income" o "expense"
      });

      setTitle("");
      setAmount("");
      setCategory("Alimentación");
      setDescription("");
      setDate(new Date().toISOString().split("T")[0]);
      setType("expense");

      alert(`✅ ${type === "income" ? "Ingreso" : "Gasto"} agregado`);
    } catch (err) {
      console.error(err);
      alert("❌ Error al agregar registro");
    }
  };

  return (
    <div className="form-container">
      <h3>➕ Nuevo Registro</h3>
      <form className="main-form" onSubmit={submit}>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Título"
          required
        />
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Valor"
          type="number"
          min="0.01"
          step="0.01"
          required
        />
        <label>Tipo:</label>
        <select value={type} onChange={(e) => setType(e.target.value)} required>
          <option value="expense">Gasto</option>
          <option value="income">Ingreso</option>
        </select>
        <label>Categoría:</label>
        <select value={category} onChange={(e) => setCategory(e.target.value)} required>
          <option value="Alimentación">Alimentación</option>
          <option value="Transporte">Transporte</option>
          <option value="Servicios">Servicios</option>
          <option value="Entretenimiento">Entretenimiento</option>
          <option value="Salud">Salud</option>
          <option value="Educación">Educación</option>
          <option value="Otros">Otros</option>
        </select>
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descripción (opcional)"
        />
        <input
          value={date}
          onChange={(e) => setDate(e.target.value)}
          type="date"
          required
        />
        <button type="submit">
          Agregar {type === "income" ? "Ingreso" : "Gasto"}
        </button>
      </form>
    </div>
  );
}