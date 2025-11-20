import React, { createContext, useContext, useReducer, useEffect, useRef } from "react";
import { useAuth } from "./AuthProvider";
import api from "../Api/apiClient";

const ExpensesContext = createContext();

const initial = { 
  list: [], 
  loading: false, 
  error: null, 
  user: null,
  currentIncome: 0,
  initialized: false
};

function reducer(state, action) {
  switch (action.type) {
    case "LOAD_START":
      return { ...state, loading: true };
    case "LOAD_SUCCESS":
      return { ...state, loading: false, list: action.payload, initialized: true };
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
    case "SET_CURRENT_INCOME":
      return { ...state, currentIncome: action.payload };
    case "RESET":
      console.log("🔄 Reseteando estado de ExpensesProvider");
      return { ...initial, initialized: false };
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
  const { isAuthenticated, loading: authLoading } = useAuth();
  const wsRef = useRef(null);

  // 🔹 Cargar gastos e ingresos
  const loadExpenses = async () => {
    dispatch({ type: "LOAD_START" });
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        dispatch({ type: "LOAD_FAIL", payload: "No token" });
        return;
      }

      const res = await api.get("/expenses", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const expenses = (res.data.expenses || []).map((exp) => ({
        ...exp,
        amount: Math.abs(Number(exp.amount)),
        type: exp.type || "expense",
        is_recurring: exp.is_recurring === true,
        recurrence_day: exp.recurrence_day || null,
        parent_recurring_id: exp.parent_recurring_id || null,
      }));

      dispatch({ type: "LOAD_SUCCESS", payload: expenses });
      console.log("✅ Gastos cargados:", expenses.length);
    } catch (err) {
      console.error("❌ Error al cargar:", err);
      dispatch({
        type: "LOAD_FAIL",
        payload: err.response?.data || err.message,
      });
    }
  };

  // 🔹 Cargar ingreso actual del usuario
  const loadCurrentIncome = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await api.get("/auth/me/current-income", {
        headers: { Authorization: `Bearer ${token}` },
      });

      dispatch({ 
        type: "SET_CURRENT_INCOME", 
        payload: res.data.current_available_income 
      });
      
      console.log("💰 Ingreso actual cargado:", res.data.current_available_income);
    } catch (err) {
      console.error("❌ Error al cargar ingreso actual:", err);
    }
  };

  // 🔹 Agregar gasto o ingreso
  const addExpense = async (expenseData) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token");

      const finalData = {
        ...expenseData,
        amount: Math.abs(Number(expenseData.amount)),
        type: expenseData.type || "expense",
        is_recurring: expenseData.is_recurring === true,
        recurrence_day: expenseData.is_recurring ? expenseData.recurrence_day : null,
      };

      // silentToast: true porque el formulario ya muestra toasts
      const res = await api.post("/expenses/", finalData, {
        headers: { Authorization: `Bearer ${token}` },
        silentToast: true,
      });

      const newExp = {
        ...res.data,
        amount: Math.abs(Number(res.data.amount)),
        type: res.data.type || "expense",
        is_recurring: res.data.is_recurring === true,
        recurrence_day: res.data.recurrence_day || null,
        parent_recurring_id: res.data.parent_recurring_id || null,
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
      await loadCurrentIncome();
      return res.data;
    } catch (err) {
      console.error("❌ Error actualizando usuario:", err);
      throw err;
    }
  };

  // 🔹 Cambiar contraseña del usuario autenticado
  const changePassword = async ({ oldPassword, newPassword }) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token disponible");

      const res = await api.post(
        "/auth/me/change-password", // <-- asegúrate de que este endpoint exista en FastAPI
        { old_password: oldPassword, new_password: newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      return res.data;
    } catch (err) {
      console.error("❌ Error cambiando contraseña:", err);
      throw err;
    }
  };

  // 🔹 Inicializar datos cuando el usuario esté autenticado
  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      dispatch({ type: "RESET" });
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      return;
    }

    if (isAuthenticated && !state.initialized) {
      const token = localStorage.getItem("token");
      if (!token) return;

      api.get("/auth/me", { headers: { Authorization: `Bearer ${token}` } })
        .then((res) => dispatch({ type: "SET_USER", payload: res.data }))
        .catch((err) => console.error("Error cargando usuario:", err));

      loadExpenses();
      loadCurrentIncome();
    }
  }, [isAuthenticated, authLoading, state.initialized]);

  // 🔹 WebSocket
  useEffect(() => {
    if (!isAuthenticated) {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      return;
    }

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    const base = import.meta.env.VITE_API_URL || "http://localhost:8000";
    const wsBase = apiToWs(base);
    const wsUrl = wsBase.replace(/\/$/, "") + "/ws/expenses?token=" + token;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => console.log("✅ WebSocket conectado");
    ws.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data);
        if (msg.type === "new_expense") {
          const exp = msg.payload;
          dispatch({ type: "ADD", payload: {
            ...exp,
            amount: Math.abs(Number(exp.amount)),
            type: exp.type || "expense",
            is_recurring: exp.is_recurring === true,
            recurrence_day: exp.recurrence_day || null,
            parent_recurring_id: exp.parent_recurring_id || null,
          } });
        }
      } catch (e) {
        console.error("❌ WS parse error:", e);
      }
    };
    ws.onerror = (err) => console.error("❌ WebSocket error:", err);
    ws.onclose = () => { wsRef.current = null; };

    return () => {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) ws.close();
    };
  }, [isAuthenticated]);

  const totalIncome = state.list
    .filter((i) => i.type === "income")
    .reduce((sum, i) => sum + Math.abs(Number(i.amount) || 0), 0);

  const totalExpense = state.list
    .filter((i) => i.type === "expense")
    .reduce((sum, i) => sum + Math.abs(Number(i.amount) || 0), 0);

  const balance = state.currentIncome + totalIncome - totalExpense;

  return (
    <ExpensesContext.Provider
      value={{
        ...state,
        loadExpenses,
        addExpense,
        deleteExpense,
        updateUser,
        changePassword,
        loadCurrentIncome,
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
