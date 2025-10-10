import React, { useState } from "react";
import { useExpenses } from "../../context/ExpensesProvider";

export default function ExpenseForm() {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("expense"); // expense | income
  const { addExpense } = useExpenses();

  const submit = async (e) => {
    e.preventDefault();
    try {
      await addExpense({ description, amount: Number(amount), type, date: new Date().toISOString() });
      setDescription(""); setAmount("");
    } catch (err) {
      console.error(err);
      alert("Error al agregar gasto");
    }
  };

  return (
    <form onSubmit={submit}>
      <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Descripción" required />
      <input value={amount} onChange={e => setAmount(e.target.value)} placeholder="Valor" type="number" required />
      <select value={type} onChange={e => setType(e.target.value)}>
        <option value="expense">Gasto</option>
        <option value="income">Ingreso</option>
      </select>
      <button type="submit">Agregar</button>
    </form>
  );
}
