// mi-app/src/hooks/useConvertedAmounts.js

import { useState, useEffect } from 'react';
import { useCurrency } from '../context/CurrencyProvider';

/**
 * Hook para convertir automáticamente montos desde COP
 * @param {Array} expenses - Array de gastos/ingresos
 * @returns {Object} Montos convertidos y funciones útiles
 */
export function useConvertedAmounts(expenses = []) {
  const { convertFromCOP, formatAmount, selectedCurrency, loading } = useCurrency();
  const [convertedExpenses, setConvertedExpenses] = useState([]);
  const [totals, setTotals] = useState({
    income: 0,
    expense: 0,
    balance: 0
  });
  const [converting, setConverting] = useState(false);

  useEffect(() => {
    convertExpenses();
  }, [expenses, selectedCurrency]);

  const convertExpenses = async () => {
    if (expenses.length === 0) {
      setConvertedExpenses([]);
      setTotals({ income: 0, expense: 0, balance: 0 });
      return;
    }

    setConverting(true);
    try {
      const converted = await Promise.all(
        expenses.map(async (exp) => {
          const originalAmount = Math.abs(Number(exp.amount) || 0);
          const convertedAmount = await convertFromCOP(originalAmount);
          
          return {
            ...exp,
            originalAmount,
            convertedAmount,
            formattedAmount: formatAmount(convertedAmount)
          };
        })
      );

      setConvertedExpenses(converted);

      // Calcular totales convertidos
      const totalIncome = converted
        .filter(e => e.type === 'income')
        .reduce((sum, e) => sum + e.convertedAmount, 0);

      const totalExpense = converted
        .filter(e => e.type === 'expense')
        .reduce((sum, e) => sum + e.convertedAmount, 0);

      setTotals({
        income: totalIncome,
        expense: totalExpense,
        balance: totalIncome - totalExpense
      });

    } catch (error) {
      console.error('❌ Error convirtiendo montos:', error);
    } finally {
      setConverting(false);
    }
  };

  return {
    convertedExpenses,
    totals,
    converting: converting || loading,
    formatAmount,
    selectedCurrency
  };
}

/**
 * Hook simple para convertir un solo monto
 * @param {number} amount - Monto a convertir
 * @returns {Object} Monto convertido y formateado
 */
export function useConvertedAmount(amount = 0) {
  const { convertFromCOP, formatAmount, selectedCurrency } = useCurrency();
  const [converted, setConverted] = useState({
    value: 0,
    formatted: formatAmount(0)
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    convertAmount();
  }, [amount, selectedCurrency]);

  const convertAmount = async () => {
    setLoading(true);
    try {
      const value = await convertFromCOP(Math.abs(Number(amount) || 0));
      setConverted({
        value,
        formatted: formatAmount(value)
      });
    } catch (error) {
      console.error('Error convirtiendo:', error);
      setConverted({
        value: amount,
        formatted: formatAmount(amount)
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    ...converted,
    loading
  };
}