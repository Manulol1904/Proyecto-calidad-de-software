import React from "react";
import { useExpenses } from "../../context/ExpensesProvider";

export default function ExpenseTable() {
  const { list, deleteExpense } = useExpenses();

  return (
    <table>
      <thead>
        <tr><th>Descripción</th><th>Valor</th><th>Tipo</th><th>Fecha</th><th>Acciones</th></tr>
      </thead>
      <tbody>
        {list.map(exp => (
          <tr key={exp.id}>
            <td>{exp.description}</td>
            <td>{exp.amount}</td>
            <td>{exp.type}</td>
            <td>{new Date(exp.date).toLocaleString()}</td>
            <td>
              <button onClick={() => deleteExpense(exp.id)}>Eliminar</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
