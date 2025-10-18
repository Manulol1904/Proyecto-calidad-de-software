import React, { createContext, useContext, useReducer, useEffect } from "react";
import api from "../Api/apiClient";

const ExpensesContext = createContext();

const initial = { list: [], loading: false, error: null, user: null };

function reducer(state, action) {
  switch (action.type) {
    case "LOAD_START":
      return { ...state, loading: true };
    case "LOAD_SUCCESS":
      return { ...state, loading: false, list: action.payload };
    case "LOAD_FAIL":
      return { ...state, loading: false, error: action.payload };
    case "ADD":
      return { ...state, list: [action.payload, ...state.list] };
    case "UPDATE":
      return {
        ...state,
        list: state.list.map((i) =>
          i.id === action.payload.id ? action.payload : i
        ),
      };
    case "DELETE":
      return {
        ...state,
        list: state.list.filter((i) => i.id !== action.payload),
      };
    case "SET_USER":
      return { ...state, user: action.payload };
    default:
      return state;
  }
}

function apiToWs(apiUrl) {
  if (apiUrl.startsWith("https://")) return apiUrl.replace(/^https:/, "wss:");
  if (apiUrl.startsWith("http://")) return apiUrl.replace(/^http:/, "ws:");
  return apiUrl;
}

export function ExpensesProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initial);

  // 🔹 Cargar gastos e ingresos
  const loadExpenses = async () => {
    dispatch({ type: "LOAD_START" });
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await api.get("/expenses", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const expenses = (res.data.expenses || []).map((exp) => ({
        ...exp,
        amount: Number(exp.amount),
        type: exp.type || (exp.amount >= 0 ? "income" : "expense"),
      }));

      dispatch({ type: "LOAD_SUCCESS", payload: expenses });
    } catch (err) {
      console.error("❌ Error al cargar:", err);
      dispatch({
        type: "LOAD_FAIL",
        payload: err.response?.data || err.message,
      });
    }
  };

  // 🔹 Agregar gasto o ingreso
  const addExpense = async (expenseData) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token");

      const finalData = {
        ...expenseData,
        type: expenseData.type || "expense",
        amount:
          expenseData.type === "expense"
            ? -Math.abs(Number(expenseData.amount))
            : Math.abs(Number(expenseData.amount)),
      };

      const res = await api.post("/expenses", finalData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const newExp = {
        ...res.data,
        amount: Number(res.data.amount),
        type: res.data.type || (res.data.amount >= 0 ? "income" : "expense"),
      };

      dispatch({ type: "ADD", payload: newExp });
      return newExp;
    } catch (err) {
      console.error("❌ Error al agregar:", err);
      throw err;
    }
  };

  // 🔹 Eliminar gasto/ingreso
  const deleteExpense = async (id) => {
    try {
      const token = localStorage.getItem("token");
      await api.delete(`/expenses/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      dispatch({ type: "DELETE", payload: id });
    } catch (err) {
      console.error("❌ Error al eliminar:", err);
      throw err;
    }
  };

  // 🔹 Actualizar usuario
  const updateUser = async (userData) => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.put("/auth/me", userData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      dispatch({ type: "SET_USER", payload: res.data });
      return res.data;
    } catch (err) {
      console.error("❌ Error actualizando usuario:", err);
      throw err;
    }
  };

  // 🔹 Cargar usuario y WS
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    api
      .get("/auth/me", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => dispatch({ type: "SET_USER", payload: res.data }))
      .catch((err) => console.error("Error cargando usuario:", err));

    loadExpenses();

    const base = import.meta.env.VITE_API_URL || "http://localhost:8000";
    const wsBase = apiToWs(base);
    const wsUrl = wsBase.replace(/\/$/, "") + "/ws/expenses?token=" + token;
    const ws = new WebSocket(wsUrl);

    ws.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data);
        if (msg.type === "new_expense") {
          const exp = msg.payload;
          const normalized = {
            ...exp,
            amount: Number(exp.amount),
            type: exp.type || (exp.amount >= 0 ? "income" : "expense"),
          };
          dispatch({ type: "ADD", payload: normalized });
        }
      } catch (e) {
        console.error("❌ WS parse error:", e);
      }
    };

    return () => ws.close();
  }, []);

  // 🔹 Totales
  const totalIncome = state.list
    .filter((i) => i.type === "income")
    .reduce((sum, i) => sum + i.amount, 0);

  const totalExpense = state.list
    .filter((i) => i.type === "expense")
    .reduce((sum, i) => sum + Math.abs(i.amount), 0);

  const balance = totalIncome - totalExpense;

  return (
    <ExpensesContext.Provider
      value={{
        ...state,
        loadExpenses,
        addExpense,
        deleteExpense,
        updateUser,
        totalIncome,
        totalExpense,
        balance,
      }}
    >
      {children}
    </ExpensesContext.Provider>
  );
}

export const useExpenses = () => useContext(ExpensesContext);
