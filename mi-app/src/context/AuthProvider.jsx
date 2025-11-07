import React, { createContext, useContext, useReducer, useEffect } from "react";
import api from "../Api/apiClient";

const AuthContext = createContext();

const initialState = {
  user: null,
  loading: true,
  error: null,
  isAuthenticated: false,
};

function reducer(state, action) {
  switch (action.type) {
    case "LOGIN_START":
      return { ...state, loading: true, error: null };
    case "LOGIN_SUCCESS":
      localStorage.setItem("token", action.payload.token);
      return { 
        ...state, 
        loading: false, 
        user: action.payload.user,
        isAuthenticated: true,
        error: null
      };
    case "LOGIN_FAIL":
      return { 
        ...state, 
        loading: false, 
        error: action.payload, 
        isAuthenticated: false,
        user: null
      };
    case "LOGOUT":
      localStorage.removeItem("token");
      return { 
        user: null,
        loading: false,
        error: null,
        isAuthenticated: false
      };
    case "SET_USER":
      return { 
        ...state, 
        user: action.payload, 
        loading: false,
        isAuthenticated: true,
        error: null
      };
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    default:
      return state;
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Verificar token al cargar la app
  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem("token");
      
      if (!token) {
        dispatch({ type: "SET_LOADING", payload: false });
        return;
      }

      try {
        const res = await api.get("/auth/me", {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        dispatch({ 
          type: "SET_USER", 
          payload: res.data 
        });
        
        console.log("✅ Usuario autenticado automáticamente");
      } catch (err) {
        console.error("❌ Token inválido:", err);
        localStorage.removeItem("token");
        dispatch({ type: "LOGOUT" });
      }
    };

    verifyToken();
  }, []);

  const login = async (email, password) => {
    dispatch({ type: "LOGIN_START" });
    try {
      const res = await api.post("/auth/login", { email, password });
      
      const token = res.data.access_token;
      localStorage.setItem("token", token);
      
      dispatch({
        type: "LOGIN_SUCCESS",
        payload: {
          token: token,
          user: res.data.user,
        },
      });
      
      console.log("✅ Login exitoso");
      return res.data;
    } catch (err) {
      console.error("❌ Error en login:", err);
      dispatch({
        type: "LOGIN_FAIL",
        payload: err.response?.data || err.message,
      });
      throw err;
    }
  };

  const logout = () => {
    console.log("🚪 Cerrando sesión...");
    
    // Limpiar token
    localStorage.removeItem("token");
    
    // Limpiar cualquier otro dato en localStorage relacionado con la sesión
    localStorage.removeItem("currency_rates");
    localStorage.removeItem("selected_currency");
    
    // Dispatch logout
    dispatch({ type: "LOGOUT" });
    
    console.log("✅ Sesión cerrada exitosamente");
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);