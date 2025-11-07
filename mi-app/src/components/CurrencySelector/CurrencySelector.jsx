// mi-app/src/components/CurrencySelector/CurrencySelector.jsx

import React from 'react';
import { useCurrency } from '../../context/CurrencyProvider';
import './CurrencySelector.css';

export default function CurrencySelector() {
  const { 
    selectedCurrency, 
    changeCurrency, 
    availableCurrencies,
    loading,
    lastUpdate,
    updateExchangeRates 
  } = useCurrency();

  const handleChange = (e) => {
    changeCurrency(e.target.value);
  };

  const handleRefresh = () => {
    updateExchangeRates();
  };

  return (
    <div className="currency-selector-container">
      <div className="currency-selector">
        <span className="currency-icon">💱</span>
        <select 
          value={selectedCurrency} 
          onChange={handleChange}
          className="currency-select"
          disabled={loading}
        >
          {Object.entries(availableCurrencies).map(([code, name]) => (
            <option key={code} value={code}>
              {code} - {name}
            </option>
          ))}
        </select>
        
        <button 
          onClick={handleRefresh}
          className="refresh-btn"
          disabled={loading}
          title="Actualizar tasas de cambio"
        >
          {loading ? '⏳' : '🔄'}
        </button>
      </div>
      
      {lastUpdate && (
        <div className="last-update">
          <small>
            📅 Última actualización: {lastUpdate.toLocaleTimeString('es-CO')}
          </small>
        </div>
      )}
    </div>
  );
}