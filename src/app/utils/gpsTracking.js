/**
 * GPS Tracking Utility for Van Seller Location Management
 * 
 * References:
 * - BRD_v2.md Section 9.2: GPS & Route Tracking requirements
 * - DatabaseInfo_v2.md: van_seller_gps_tracking table schema
 * 
 * Features:
 * - Real-time location tracking
 * - Route history management
 * - Location permission handling
 * - Distance and speed calculations
 * - Territory boundary checking
 */

import { doc, updateDoc, collection, addDoc, serverTimestamp, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "../firebase";

/**
 * Request location permission from browser
 * @returns {Promise<boolean>} Permission granted status
 */
export const requestLocationPermission = async () => {
  if (!navigator.geolocation) {
    console.error("Geolocation is not supported by this browser");
    return false;
  }

  try {
    // Request permission by attempting to get current position
    const permission = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        () => resolve(true),
        (error) => {
          console.error("Location permission denied:", error.message);
          reject(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    });
    return permission;
  } catch (error) {
    return false;
  }
};

/**
 * Get current GPS location
 * @returns {Promise<Object>} Location data {latitude, longitude, accuracy, speed, timestamp}
 */
export const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          speed: position.coords.speed || 0,
          timestamp: new Date()
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  });
};

/**
 * Watch position with continuous tracking
 * @param {Function} callback - Called with each position update
 * @param {Function} errorCallback - Called on error
 * @returns {number} Watch ID for clearing later
 */
export const watchPosition = (callback, errorCallback) => {
  if (!navigator.geolocation) {
    errorCallback(new Error("Geolocation is not supported"));
    return null;
  }

  return navigator.geolocation.watchPosition(
    (position) => {
      callback({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        speed: position.coords.speed || 0,
        timestamp: new Date()
      });
    },
    errorCallback,
    {
      enableHighAccuracy: true,
      timeout: 30000,
      maximumAge: 0
    }
  );
};

/**
 * Clear position watch
 * @param {number} watchId - Watch ID returned from watchPosition
 */
export const clearPositionWatch = (watchId) => {
  if (watchId && navigator.geolocation) {
    navigator.geolocation.clearWatch(watchId);
  }
};

/**
 * Update van seller's current location in Firestore
 * @param {string} companyId - Company ID
 * @param {string} vanSellerId - Van seller document ID
 * @param {Object} locationData - {latitude, longitude, accuracy, speed, timestamp}
 * @returns {Promise<void>}
 */
export const updateVanSellerLocation = async (companyId, vanSellerId, locationData) => {
  try {
    const vanSellerRef = doc(db, `Easy2Solutions/companyDirectory/tenantCompanies/${companyId}/vanSellers`, vanSellerId);
    
    await updateDoc(vanSellerRef, {
      currentLocation: {
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        accuracy: locationData.accuracy,
        timestamp: serverTimestamp()
      },
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Error updating van seller location:", error);
    throw error;
  }
};

/**
 * Add GPS tracking history entry
 * @param {string} companyId - Company ID
 * @param {string} vanSellerId - Van seller ID (VS001, VS002...)
 * @param {Object} locationData - {latitude, longitude, accuracy, speed}
 * @returns {Promise<string>} Document ID of created tracking entry
 */
export const addGPSTrackingEntry = async (companyId, vanSellerId, locationData) => {
  try {
    const trackingRef = collection(db, `Easy2Solutions/companyDirectory/tenantCompanies/${companyId}/gpsTracking`);
    
    const docRef = await addDoc(trackingRef, {
      vanSellerId: vanSellerId,
      latitude: locationData.latitude,
      longitude: locationData.longitude,
      accuracy: locationData.accuracy || 0,
      speed: locationData.speed || 0,
      timestamp: serverTimestamp(),
      createdAt: serverTimestamp()
    });
    
    return docRef.id;
  } catch (error) {
    console.error("Error adding GPS tracking entry:", error);
    throw error;
  }
};

/**
 * Get route history for a van seller
 * @param {string} companyId - Company ID
 * @param {string} vanSellerId - Van seller ID
 * @param {Date} startDate - Start date for history
 * @param {Date} endDate - End date for history
 * @param {number} maxEntries - Maximum number of entries to fetch
 * @returns {Promise<Array>} Array of GPS tracking entries
 */
export const getRouteHistory = async (companyId, vanSellerId, startDate, endDate, maxEntries = 1000) => {
  try {
    const trackingRef = collection(db, `Easy2Solutions/companyDirectory/tenantCompanies/${companyId}/gpsTracking`);
    
    const q = query(
      trackingRef,
      where("vanSellerId", "==", vanSellerId),
      where("timestamp", ">=", startDate),
      where("timestamp", "<=", endDate),
      orderBy("timestamp", "desc"),
      limit(maxEntries)
    );
    
    const querySnapshot = await getDocs(q);
    const history = [];
    
    querySnapshot.forEach((doc) => {
      history.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return history;
  } catch (error) {
    console.error("Error fetching route history:", error);
    throw error;
  }
};

/**
 * Calculate distance between two GPS coordinates (Haversine formula)
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lon1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lon2 - Longitude of point 2
 * @returns {number} Distance in kilometers
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
};

/**
 * Convert degrees to radians
 * @param {number} degrees - Angle in degrees
 * @returns {number} Angle in radians
 */
const toRadians = (degrees) => {
  return degrees * (Math.PI / 180);
};

/**
 * Calculate route distance from tracking history
 * @param {Array} routeHistory - Array of GPS tracking entries
 * @returns {number} Total distance in kilometers
 */
export const calculateRouteDistance = (routeHistory) => {
  if (!routeHistory || routeHistory.length < 2) {
    return 0;
  }
  
  let totalDistance = 0;
  
  for (let i = 0; i < routeHistory.length - 1; i++) {
    const point1 = routeHistory[i];
    const point2 = routeHistory[i + 1];
    
    const distance = calculateDistance(
      point1.latitude,
      point1.longitude,
      point2.latitude,
      point2.longitude
    );
    
    totalDistance += distance;
  }
  
  return totalDistance;
};

/**
 * Check if point is inside territory polygon
 * @param {number} lat - Point latitude
 * @param {number} lon - Point longitude
 * @param {Object} territory - Territory object with areaCoordinates
 * @returns {boolean} True if point is inside territory
 */
export const isInsideTerritory = (lat, lon, territory) => {
  if (!territory || !territory.areaCoordinates || !territory.areaCoordinates.coordinates) {
    return false;
  }
  
  // Get polygon coordinates (first element of coordinates array)
  const polygon = territory.areaCoordinates.coordinates[0];
  
  // Ray casting algorithm for point-in-polygon test
  let inside = false;
  
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1];
    const xj = polygon[j][0], yj = polygon[j][1];
    
    const intersect = ((yi > lat) !== (yj > lat))
      && (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi);
    
    if (intersect) inside = !inside;
  }
  
  return inside;
};

/**
 * Find nearest van seller to a location
 * @param {number} lat - Target latitude
 * @param {number} lon - Target longitude
 * @param {Array} vanSellers - Array of van sellers with currentLocation
 * @returns {Object|null} Nearest van seller with distance
 */
export const findNearestVanSeller = (lat, lon, vanSellers) => {
  if (!vanSellers || vanSellers.length === 0) {
    return null;
  }
  
  let nearest = null;
  let minDistance = Infinity;
  
  vanSellers.forEach((seller) => {
    if (seller.currentLocation && seller.currentLocation.latitude && seller.currentLocation.longitude) {
      const distance = calculateDistance(
        lat,
        lon,
        seller.currentLocation.latitude,
        seller.currentLocation.longitude
      );
      
      if (distance < minDistance) {
        minDistance = distance;
        nearest = {
          ...seller,
          distanceKm: distance
        };
      }
    }
  });
  
  return nearest;
};

/**
 * Calculate estimated time of arrival
 * @param {number} distanceKm - Distance in kilometers
 * @param {number} averageSpeedKmh - Average speed in km/h (default: 40)
 * @returns {number} ETA in minutes
 */
export const calculateETA = (distanceKm, averageSpeedKmh = 40) => {
  const timeHours = distanceKm / averageSpeedKmh;
  const timeMinutes = timeHours * 60;
  return Math.round(timeMinutes);
};

/**
 * Format coordinates for display
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {string} Formatted coordinates
 */
export const formatCoordinates = (lat, lon) => {
  return `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
};

/**
 * Get location accuracy status
 * @param {number} accuracy - Accuracy in meters
 * @returns {string} Status (excellent/good/fair/poor)
 */
export const getAccuracyStatus = (accuracy) => {
  if (accuracy <= 10) return "excellent";
  if (accuracy <= 20) return "good";
  if (accuracy <= 50) return "fair";
  return "poor";
};
