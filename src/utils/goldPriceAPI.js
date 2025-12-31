// ✅ TASK 2.2: Gold Price API Integration (Primary: goldprice.org, Secondary: kitco.com)
// Purpose: Auto-fetch gold price from external APIs with fallback chain
// Reference: BRD_GoldSmith_v2.md Section 1.2, DatabaseInfo_GoldSmith_v2.md Section 10
// Update frequency: Every 1 hour, Alert on >2% price change

import { db } from '@/app/firebase';
import { collection, addDoc, query, orderBy, limit, getDocs, serverTimestamp } from 'firebase/firestore';

const OUNCE_TO_GRAM = 31.15;
const UPDATE_INTERVAL = 60 * 60 * 1000; // 1 hour in milliseconds
const ALERT_THRESHOLD = 0.02; // 2% price change

/**
 * Fetch gold price from GoldAPI.io (Primary - Free tier: 1000 requests/month)
 * API Documentation: https://www.goldapi.io/
 * Sign up for FREE API key at: https://www.goldapi.io/dashboard
 */
async function fetchFromGoldAPI() {
  try {
    // Get API key from environment variable
    // To use: Create .env.local file and add: NEXT_PUBLIC_GOLD_API_KEY=your_key_here
    const apiKey = process.env.NEXT_PUBLIC_GOLD_API_KEY || 'goldapi-demo-key';
    
    const response = await fetch('https://www.goldapi.io/api/XAU/USD', {
      method: 'GET',
      headers: {
        'x-access-token': apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`GoldAPI error: ${response.status}`);
    }

    const data = await response.json();
    
    // GoldAPI returns price per troy ounce
    const pricePerOunce = parseFloat(data.price);
    const pricePerGram = pricePerOunce / OUNCE_TO_GRAM;

    return {
      success: true,
      pricePerOunce: parseFloat(pricePerOunce.toFixed(2)),
      pricePerGram: parseFloat(pricePerGram.toFixed(2)),
      source: 'goldapi.io',
      timestamp: new Date(),
    };
  } catch (error) {
    console.error('Error fetching from GoldAPI:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Fetch gold price from MetalpriceAPI.com (Secondary - Free tier: 100 requests/month)
 * API Documentation: https://metalpriceapi.com/
 * Sign up for FREE API key at: https://metalpriceapi.com/
 */
async function fetchFromMetalPriceAPI() {
  try {
    // Get API key from environment variable
    const apiKey = process.env.NEXT_PUBLIC_METAL_PRICE_API_KEY || 'demo-key';
    
    const response = await fetch(`https://api.metalpriceapi.com/v1/latest?api_key=${apiKey}&base=USD&currencies=XAU`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`MetalpriceAPI error: ${response.status}`);
    }

    const data = await response.json();
    
    // MetalpriceAPI returns inverse rate (USD per XAU), need to convert
    // XAU rate = how many USD for 1 troy ounce of gold
    const pricePerOunce = parseFloat(1 / data.rates.XAU);
    const pricePerGram = pricePerOunce / OUNCE_TO_GRAM;

    return {
      success: true,
      pricePerOunce: parseFloat(pricePerOunce.toFixed(2)),
      pricePerGram: parseFloat(pricePerGram.toFixed(2)),
      source: 'metalpriceapi.com',
      timestamp: new Date(),
    };
  } catch (error) {
    console.error('Error fetching from MetalpriceAPI:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Fetch gold price with fallback chain: goldapi.io → metalpriceapi.com → coingecko.com → manual entry
 */
export async function fetchGoldPrice() {
  // Try primary API (GoldAPI.io - 1000 free requests/month)
  let result = await fetchFromGoldAPI();
  
  if (result.success) {
    return result;
  }
  
  // Fallback to secondary API (MetalpriceAPI - 100 free requests/month)
  console.warn('Primary API failed, trying secondary API (MetalpriceAPI)...');
  result = await fetchFromMetalPriceAPI();
  
  if (result.success) {
    return result;
  }
  
  // Fallback to third API (CoinGecko - FREE, no key required)
  console.warn('Secondary API failed, trying third API (CoinGecko)...');
  result = await fetchFromCoinGecko();
  
  if (result.success) {
    return result;
  }
  
  // All APIs failed
  console.error('All gold price APIs failed');
  return { success: false, error: 'All APIs failed' };
}

/**
 * Fetch from CoinGecko API (FREE, no key required)
 * PAX Gold (PAXG) is 1:1 backed by physical gold
 */
async function fetchFromCoinGecko() {
  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=pax-gold&vs_currencies=usd',
      {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      }
    );

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data = await response.json();
    
    // PAX Gold (PAXG) is 1:1 backed by physical gold (1 PAXG = 1 troy ounce)
    const pricePerOunce = parseFloat(data['pax-gold'].usd);
    const pricePerGram = pricePerOunce / OUNCE_TO_GRAM;

    return {
      success: true,
      pricePerOunce: parseFloat(pricePerOunce.toFixed(2)),
      pricePerGram: parseFloat(pricePerGram.toFixed(2)),
      source: 'coingecko.com (PAXG)',
      timestamp: new Date(),
    };
  } catch (error) {
    console.error('Error fetching from CoinGecko:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get the latest gold price from Firestore
 */
export async function getLatestGoldPrice() {
  try {
    const q = query(
      collection(db, 'goldPriceHistory'),
      orderBy('timestamp', 'desc'),
      limit(1)
    );
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      const data = snapshot.docs[0].data();
      return {
        pricePerOunce: data.pricePerOunce,
        pricePerGram: data.pricePerGram,
        source: data.source,
        timestamp: data.timestamp?.toDate(),
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching latest price:', error);
    return null;
  }
}

/**
 * Save gold price to Firestore and check for significant changes
 */
export async function saveGoldPrice(priceData) {
  try {
    // Get previous price for comparison
    const previousPrice = await getLatestGoldPrice();
    
    // Save new price
    const docRef = await addDoc(collection(db, 'goldPriceHistory'), {
      pricePerOunce: priceData.pricePerOunce,
      pricePerGram: priceData.pricePerGram,
      source: priceData.source,
      timestamp: serverTimestamp(),
      updatedBy: 'System (API)',
    });
    
    // Check for significant price change (>2%)
    let alert = null;
    if (previousPrice) {
      const changePercent = Math.abs(
        (priceData.pricePerOunce - previousPrice.pricePerOunce) / previousPrice.pricePerOunce
      );
      
      if (changePercent > ALERT_THRESHOLD) {
        alert = {
          message: `⚠️ Significant gold price change: ${(changePercent * 100).toFixed(2)}%`,
          changePercent: changePercent * 100,
          oldPrice: previousPrice.pricePerOunce,
          newPrice: priceData.pricePerOunce,
          direction: priceData.pricePerOunce > previousPrice.pricePerOunce ? 'up' : 'down',
        };
        
        // Log alert to console (can be extended to show notification)
        console.warn('GOLD PRICE ALERT:', alert);
      }
    }
    
    return {
      success: true,
      docId: docRef.id,
      alert,
    };
  } catch (error) {
    console.error('Error saving gold price:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Auto-update gold price (call this every hour)
 */
export async function autoUpdateGoldPrice() {
  console.log('[Gold Price API] Starting auto-update...');
  
  // Fetch from APIs
  const priceData = await fetchGoldPrice();
  
  if (!priceData.success) {
    console.error('[Gold Price API] Auto-update failed:', priceData.error);
    return {
      success: false,
      error: priceData.error,
    };
  }
  
  // Save to Firestore
  const saveResult = await saveGoldPrice(priceData);
  
  if (saveResult.success) {
    console.log(`[Gold Price API] Updated successfully: $${priceData.pricePerOunce}/oz ($${priceData.pricePerGram}/g) from ${priceData.source}`);
    
    // If there's a significant change alert
    if (saveResult.alert) {
      console.warn(`[Gold Price API] ALERT: ${saveResult.alert.message}`);
      // TODO: Show notification to user (can integrate with toast or notification system)
    }
  }
  
  return saveResult;
}

/**
 * Initialize auto-update interval (call this once on app startup)
 */
export function initGoldPriceAutoUpdate() {
  // Initial update
  autoUpdateGoldPrice();
  
  // Set interval for hourly updates
  const intervalId = setInterval(() => {
    autoUpdateGoldPrice();
  }, UPDATE_INTERVAL);
  
  console.log('[Gold Price API] Auto-update initialized (every 1 hour)');
  
  // Return cleanup function
  return () => {
    clearInterval(intervalId);
    console.log('[Gold Price API] Auto-update stopped');
  };
}

/**
 * Manual refresh gold price (for "Refresh" button)
 */
export async function manualRefreshGoldPrice() {
  console.log('[Gold Price API] Manual refresh triggered...');
  return await autoUpdateGoldPrice();
}

/**
 * Calculate price change percentage
 */
export function calculatePriceChange(currentPrice, previousPrice) {
  if (!previousPrice) return 0;
  return ((currentPrice - previousPrice) / previousPrice) * 100;
}

/**
 * Format price with change indicator
 */
export function formatPriceWithChange(currentPrice, changePercent) {
  const direction = changePercent > 0 ? '▲' : changePercent < 0 ? '▼' : '─';
  const color = changePercent > 0 ? 'green' : changePercent < 0 ? 'red' : 'gray';
  
  return {
    price: `$${currentPrice.toFixed(2)}`,
    change: `${direction} ${Math.abs(changePercent).toFixed(2)}%`,
    color,
  };
}
