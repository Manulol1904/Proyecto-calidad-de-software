import React, { createContext, useContext, useReducer } from "react";
import api from "../Api/apiClient";
const AuthContext = createContext();

const initialState = { user: null, loading: false, error: null };

function reducer(state, action) {
  switch (action.type) {
    case "LOGIN_START": return { ...state, loading: true, error: null };
    case "LOGIN_SUCCESS":
      localStorage.setItem("token", action.payload.token);
      return { ...state, loading: false, user: action.payload.user };
    case "LOGIN_FAIL": return { ...state, loading: false, error: action.payload };
    case "LOGOUT":
      localStorage.removeItem("token");
      return { ...initialState };
    default: return state;
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const login = async (email, password) => {
    dispatch({ type: "LOGIN_START" });
    try {
      const res = await api.post("/auth/login", { email, password });
      // espera { token: "...", user: {...} }
      dispatch({ type: "LOGIN_SUCCESS", payload: res.data });
      return res.data;
    } catch (err) {
      dispatch({ type: "LOGIN_FAIL", payload: err.response?.data || err.message });
      throw err;
    }
  };

  const logout = () => dispatch({ type: "LOGOUT" });

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
