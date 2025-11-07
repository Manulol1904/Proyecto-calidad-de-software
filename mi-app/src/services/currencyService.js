// mi-app/src/services/currencyService.js

const BASE_URL = 'https://api.exchangerate-api.com/v4/latest';
const CACHE_KEY = 'currency_rates';
const CACHE_DURATION = 3600000; // 1 hora en milisegundos

/**
 * Obtiene las tasas de cambio y las guarda en caché
 * @param {string} baseCurrency - Moneda base (por defecto USD)
 * @returns {Promise<Object>} Objeto con las tasas de cambio
 */
export async function getCurrencyRates(baseCurrency = 'USD') {
  try {
    // Verificar caché primero
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      const now = Date.now();
      
      // Si el caché tiene menos de 1 hora, usarlo
      if (now - timestamp < CACHE_DURATION) {
        console.log('✅ Usando tasas de cambio desde caché');
        return data;
      }
    }

    // Si no hay caché válido, hacer petición a la API
    console.log('🌐 Obteniendo tasas de cambio desde API...');
    const response = await fetch(`${BASE_URL}/${baseCurrency}`);
    
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Guardar en caché
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
    
    console.log('✅ Tasas de cambio actualizadas:', data.rates);
    return data;
    
  } catch (error) {
    console.error('❌ Error al obtener tasas de cambio:', error);
    
    // Si hay error, intentar usar caché antiguo
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      console.log('⚠️ Usando caché antiguo debido a error de red');
      const { data } = JSON.parse(cached);
      return data;
    }
    
    // Si no hay caché, lanzar error
    throw new Error('No se pudieron obtener las tasas de cambio y no hay caché disponible');
  }
}

/**
 * Convierte un monto de una moneda a otra
 * @param {number} amount - Monto a convertir
 * @param {string} fromCurrency - Moneda de origen (ej: 'COP')
 * @param {string} toCurrency - Moneda de destino (ej: 'USD')
 * @returns {Promise<number>} Monto convertido
 */
export async function convertCurrency(amount, fromCurrency = 'COP', toCurrency = 'USD') {
  try {
    const rates = await getCurrencyRates(fromCurrency);
    
    if (!rates.rates[toCurrency]) {
      throw new Error(`Moneda ${toCurrency} no encontrada`);
    }
    
    const convertedAmount = amount * rates.rates[toCurrency];
    console.log(`💱 Conversión: ${amount} ${fromCurrency} = ${convertedAmount.toFixed(2)} ${toCurrency}`);
    
    return convertedAmount;
  } catch (error) {
    console.error('❌ Error en conversión:', error);
    throw error;
  }
}

/**
 * Obtiene la tasa de cambio entre dos monedas
 * @param {string} fromCurrency - Moneda de origen
 * @param {string} toCurrency - Moneda de destino
 * @returns {Promise<number>} Tasa de cambio
 */
export async function getExchangeRate(fromCurrency = 'COP', toCurrency = 'USD') {
  try {
    const rates = await getCurrencyRates(fromCurrency);
    return rates.rates[toCurrency];
  } catch (error) {
    console.error('❌ Error obteniendo tasa:', error);
    throw error;
  }
}

/**
 * Formatea un monto en la moneda especificada
 * @param {number} amount - Monto a formatear
 * @param {string} currency - Código de moneda (ISO 4217)
 * @param {string} locale - Locale para formateo (por defecto 'es-CO')
 * @returns {string} Monto formateado
 */
export function formatCurrency(amount, currency = 'USD', locale = 'es-CO') {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

/**
 * Obtiene lista de monedas disponibles con sus nombres
 * @returns {Object} Objeto con códigos de moneda y nombres
 */
export const CURRENCIES = {
  USD: 'Dólar estadounidense',
  COP: 'Peso colombiano',
  EUR: 'Euro',
  GBP: 'Libra esterlina',
  JPY: 'Yen japonés',
  CAD: 'Dólar canadiense',
  AUD: 'Dólar australiano',
  MXN: 'Peso mexicano',
  BRL: 'Real brasileño',
  ARS: 'Peso argentino',
  CLP: 'Peso chileno',
  PEN: 'Sol peruano'
};

/**
 * Limpia el caché de tasas de cambio
 */
export function clearCurrencyCache() {
  localStorage.removeItem(CACHE_KEY);
  console.log('🗑️ Caché de tasas de cambio limpiado');
}

export default {
  getCurrencyRates,
  convertCurrency,
  getExchangeRate,
  formatCurrency,
  clearCurrencyCache,
  CURRENCIES
};