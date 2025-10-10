import React, { createContext, useContext, useReducer, useEffect } from "react";
import api from "../Api/apiClient";
const ExpensesContext = createContext();
const initial = { list: [], loading: false, error: null };

function reducer(state, action) {
  switch (action.type) {
    case "LOAD_START": return { ...state, loading: true };
    case "LOAD_SUCCESS": return { ...state, loading: false, list: action.payload };
    case "LOAD_FAIL": return { ...state, loading: false, error: action.payload };
    case "ADD": return { ...state, list: [action.payload, ...state.list] };
    case "UPDATE": return { ...state, list: state.list.map(i => i.id === action.payload.id ? action.payload : i) };
    case "DELETE": return { ...state, list: state.list.filter(i => i.id !== action.payload) };
    default: return state;
  }
}

// helper para convertir http(s) -> ws(s)
function apiToWs(apiUrl) {
  if (apiUrl.startsWith("https://")) return apiUrl.replace(/^https:/, "wss:");
  if (apiUrl.startsWith("http://")) return apiUrl.replace(/^http:/, "ws:");
  return apiUrl;
}

export function ExpensesProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initial);

  const loadExpenses = async () => {
    dispatch({ type: "LOAD_START" });
    try {
      const res = await api.get("/expenses");
      dispatch({ type: "LOAD_SUCCESS", payload: res.data });
    } catch (err) {
      dispatch({ type: "LOAD_FAIL", payload: err.response?.data || err.message });
    }
  };

  const addExpense = async (data) => {
    const res = await api.post("/expenses", data);
    dispatch({ type: "ADD", payload: res.data });
    return res.data;
  };

  const updateExpense = async (id, data) => {
    const res = await api.put(`/expenses/${id}`, data);
    dispatch({ type: "UPDATE", payload: res.data });
    return res.data;
  };

  const deleteExpense = async (id) => {
    await api.delete(`/expenses/${id}`);
    dispatch({ type: "DELETE", payload: id });
  };

  useEffect(() => {
    loadExpenses();
    // Conectar WebSocket para recibir nuevos gastos en tiempo real
    const base = import.meta.env.VITE_API_URL || "http://localhost:8000";
    const wsBase = apiToWs(base);
    const wsUrl = wsBase.replace(/\/$/, "") + "/ws/expenses";
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => console.log("WS conectado:", wsUrl);
    ws.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data);
        if (msg.type === "new_expense") {
          dispatch({ type: "ADD", payload: msg.payload });
        }
      } catch (e) {
        console.error("WS message parse error", e);
      }
    };
    ws.onerror = (e) => console.error("WS error", e);
    ws.onclose = () => console.log("WS cerrado");

    return () => ws.close();
  }, []);

  return (
    <ExpensesContext.Provider value={{ ...state, loadExpenses, addExpense, updateExpense, deleteExpense }}>
      {children}
    </ExpensesContext.Provider>
  );
}

export const useExpenses = () => useContext(ExpensesContext);
