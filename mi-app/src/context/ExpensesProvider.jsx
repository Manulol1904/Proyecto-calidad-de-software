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
      return { ...state, list: state.list.filter((i) => i.id !== action.payload) };
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

  const loadExpenses = async () => {
    dispatch({ type: "LOAD_START" });
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await api.get("/expenses", {
        headers: { Authorization: `Bearer ${token}` },
      });
      dispatch({ type: "LOAD_SUCCESS", payload: res.data.expenses || [] });
    } catch (err) {
      dispatch({ type: "LOAD_FAIL", payload: err.response?.data || err.message });
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    // Cargar usuario
    api
      .get("/auth/me", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => dispatch({ type: "SET_USER", payload: res.data }))
      .catch((err) => console.error("Error cargando usuario:", err));

    // Cargar gastos
    loadExpenses();

    // Conectar WebSocket
    const base = import.meta.env.VITE_API_URL || "http://localhost:8000";
    const wsBase = apiToWs(base);
    const wsUrl = wsBase.replace(/\/$/, "") + "/ws/expenses?token=" + token;
    const ws = new WebSocket(wsUrl);

    ws.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data);
        if (msg.type === "new_expense") {
          dispatch({ type: "ADD", payload: msg.payload });
        }
      } catch (e) {
        console.error("WS parse error", e);
      }
    };

    return () => ws.close();
  }, []);

  return (
    <ExpensesContext.Provider value={{ ...state, loadExpenses }}>
      {children}
    </ExpensesContext.Provider>
  );
}

export const useExpenses = () => useContext(ExpensesContext);
