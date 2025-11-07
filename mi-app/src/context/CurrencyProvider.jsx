import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthProvider';
import { 
  convertCurrency, 
  formatCurrency, 
  CURRENCIES,
  getExchangeRate 
} from '../services/currencyService';

const CurrencyContext = createContext();

export function CurrencyProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [exchangeRates, setExchangeRates] = useState({});
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  // Cargar la moneda guardada al iniciar
  useEffect(() => {
    const saved = localStorage.getItem('selected_currency');
    if (saved && CURRENCIES[saved]) {
      setSelectedCurrency(saved);
    }
  }, []);

  // Resetear al cerrar sesión
  useEffect(() => {
    if (!isAuthenticated) {
      console.log("💱 Reseteando configuración de moneda");
      setSelectedCurrency('USD');
      setExchangeRates({});
      setLastUpdate(null);
      // No limpiar localStorage aquí porque AuthProvider ya lo hace
    }
  }, [isAuthenticated]);

  // Actualizar tasas de cambio cuando cambia la moneda
  useEffect(() => {
    if (isAuthenticated) {
      updateExchangeRates();
    }
  }, [selectedCurrency, isAuthenticated]);

  const updateExchangeRates = async () => {
    setLoading(true);
    try {
      const rate = await getExchangeRate('COP', selectedCurrency);
      setExchangeRates({ COP: rate });
      setLastUpdate(new Date());
      console.log(`✅ Tasa COP → ${selectedCurrency}: ${rate}`);
    } catch (error) {
      console.error('❌ Error actualizando tasas:', error);
    } finally {
      setLoading(false);
    }
  };

  const changeCurrency = (currencyCode) => {
    if (CURRENCIES[currencyCode]) {
      setSelectedCurrency(currencyCode);
      localStorage.setItem('selected_currency', currencyCode);
      console.log(`💱 Moneda cambiada a: ${currencyCode}`);
    }
  };

  const convertFromCOP = async (amount) => {
    try {
      return await convertCurrency(amount, 'COP', selectedCurrency);
    } catch (error) {
      console.error('Error en conversión:', error);
      return amount;
    }
  };

  const formatAmount = (amount) => {
    return formatCurrency(amount, selectedCurrency);
  };

  const value = {
    selectedCurrency,
    exchangeRates,
    loading,
    lastUpdate,
    changeCurrency,
    convertFromCOP,
    formatAmount,
    updateExchangeRates,
    availableCurrencies: CURRENCIES
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency debe usarse dentro de CurrencyProvider');
  }
  return context;
};