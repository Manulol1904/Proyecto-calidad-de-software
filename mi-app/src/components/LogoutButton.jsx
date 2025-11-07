import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthProvider";

export default function LogoutButton({ className = "logout-btn", style = {} }) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return;

    // Confirmar logout
    const confirmed = window.confirm("¿Estás seguro de que deseas cerrar sesión?");
    if (!confirmed) return;

    setIsLoggingOut(true);
    
    try {
      console.log("🚪 Iniciando cierre de sesión...");
      
      // Llamar a logout del contexto (limpia estado y localStorage)
      logout();
      
      // Pequeña espera para asegurar que todo se limpie
      await new Promise(resolve => setTimeout(resolve, 300));
      
      console.log("✅ Sesión cerrada, redirigiendo a login...");
      
      // Navegar a login con replace para evitar volver atrás
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("❌ Error durante logout:", error);
      
      // Aunque haya error, intentar navegar a login
      navigate("/login", { replace: true });
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={isLoggingOut}
      className={className}
      style={{
        ...style,
        opacity: isLoggingOut ? 0.6 : 1,
        cursor: isLoggingOut ? "not-allowed" : "pointer"
      }}
    >
      {isLoggingOut ? "🔄 Cerrando..." : "🚪 Cerrar sesión"}
    </button>
  );
}