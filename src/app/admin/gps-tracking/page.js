"use client";

import { useState, useEffect, useRef } from "react";
import { useVanSeller } from "../../context/VanSellerContext";
import {
  getCurrentLocation,
  watchPosition,
  clearPositionWatch,
  updateVanSellerLocation,
  addGPSTrackingEntry,
  getRouteHistory,
  calculateDistance,
  calculateRouteDistance,
  isInsideTerritory,
  findNearestVanSeller,
  calculateETA,
  formatCoordinates,
  getAccuracyStatus,
  requestLocationPermission
} from "../../utils/gpsTracking";
import { useFirestorePaths } from "../../utils/firestorePaths";

/**
 * GPS Tracking & Route Optimization Dashboard
 * 
 * References:
 * - BRD_v2.md Section 9.2: GPS tracking requirements
 * - DatabaseInfo_v2.md: gpsTracking collection structure
 * 
 * Features:
 * - Real-time location tracking
 * - Route history visualization
 * - Territory coverage monitoring
 * - Distance and speed tracking
 * - Location broadcasting
 */

export default function GPSTrackingPage() {
  const { vanSellers, territories, getTerritoryById } = useVanSeller();
  const { companyId } = useFirestorePaths();
  
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [trackingEnabled, setTrackingEnabled] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [routeHistory, setRouteHistory] = useState([]);
  const [routeDistance, setRouteDistance] = useState(0);
  const [locationPermission, setLocationPermission] = useState(false);
  const [trackingInterval, setTrackingInterval] = useState(30); // seconds
  const [activeTab, setActiveTab] = useState("live"); // live, history, coverage
  
  const watchIdRef = useRef(null);
  const intervalIdRef = useRef(null);

  // Request location permission on mount
  useEffect(() => {
    const checkPermission = async () => {
      const granted = await requestLocationPermission();
      setLocationPermission(granted);
      if (granted) {
        loadCurrentLocation();
      }
    };
    checkPermission();
  }, []);

  // Load current location
  const loadCurrentLocation = async () => {
    try {
      const location = await getCurrentLocation();
      setCurrentLocation(location);
    } catch (error) {
      console.error("Error getting current location:", error);
    }
  };

  // Start tracking for selected seller
  const startTracking = () => {
    if (!selectedSeller || !locationPermission) {
      alert("Please select a van seller and grant location permission");
      return;
    }

    setTrackingEnabled(true);

    // Watch position continuously
    watchIdRef.current = watchPosition(
      (location) => {
        setCurrentLocation(location);
      },
      (error) => {
        console.error("Position watch error:", error);
        alert("Error tracking location: " + error.message);
        stopTracking();
      }
    );

    // Update Firebase at regular intervals
    intervalIdRef.current = setInterval(async () => {
      if (currentLocation) {
        try {
          // Update van seller's current location
          await updateVanSellerLocation(companyId, selectedSeller.id, currentLocation);
          
          // Add to GPS tracking history
          await addGPSTrackingEntry(companyId, selectedSeller.vanSellerId, currentLocation);
          
          console.log("Location updated successfully");
        } catch (error) {
          console.error("Error updating location:", error);
        }
      }
    }, trackingInterval * 1000);
  };

  // Stop tracking
  const stopTracking = () => {
    setTrackingEnabled(false);
    
    if (watchIdRef.current) {
      clearPositionWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    
    if (intervalIdRef.current) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }
  };

  // Load route history for selected seller
  const loadRouteHistory = async () => {
    if (!selectedSeller) return;

    const endDate = new Date();
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0); // Start of day

    try {
      const history = await getRouteHistory(companyId, selectedSeller.vanSellerId, startDate, endDate);
      setRouteHistory(history);
      
      if (history.length > 0) {
        const distance = calculateRouteDistance(history);
        setRouteDistance(distance);
      }
    } catch (error) {
      console.error("Error loading route history:", error);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, []);

  // Load route history when seller changes or tab changes
  useEffect(() => {
    if (selectedSeller && activeTab === "history") {
      loadRouteHistory();
    }
  }, [selectedSeller, activeTab]);

  // Calculate territory coverage
  const getTerritoryStatus = (seller) => {
    if (!seller.currentLocation || !seller.territoryId) return "unknown";
    
    const territory = getTerritoryById(seller.territoryId);
    if (!territory) return "unknown";
    
    const inside = isInsideTerritory(
      seller.currentLocation.latitude,
      seller.currentLocation.longitude,
      territory
    );
    
    return inside ? "inside" : "outside";
  };

  // Find sellers outside their territory
  const sellersOutsideTerritory = vanSellers.filter(seller => {
    return seller.status === "active" && getTerritoryStatus(seller) === "outside";
  });

  // Calculate statistics
  const activeSellersCount = vanSellers.filter(s => s.status === "active").length;
  const trackingSellersCount = vanSellers.filter(s => s.status === "active" && s.currentLocation).length;
  const averageSpeed = routeHistory.length > 0 
    ? routeHistory.reduce((sum, entry) => sum + (entry.speed || 0), 0) / routeHistory.length 
    : 0;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">GPS Tracking & Route Optimization</h1>

      {/* Permission Alert */}
      {!locationPermission && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Location permission is required for GPS tracking. Please enable location access in your browser settings.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Active Sellers</p>
              <p className="text-2xl font-bold text-gray-900">{activeSellersCount}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Tracking</p>
              <p className="text-2xl font-bold text-gray-900">{trackingSellersCount}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Today&apos;s Distance</p>
              <p className="text-2xl font-bold text-gray-900">{routeDistance.toFixed(2)} km</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Avg Speed</p>
              <p className="text-2xl font-bold text-gray-900">{averageSpeed.toFixed(1)} km/h</p>
            </div>
            <div className="bg-orange-100 p-3 rounded-full">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Out of Territory Alert */}
      {sellersOutsideTerritory.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                <strong>{sellersOutsideTerritory.length} seller(s)</strong> are currently outside their assigned territory: {sellersOutsideTerritory.map(s => s.name).join(", ")}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("live")}
            className={`${
              activeTab === "live"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Live Tracking
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`${
              activeTab === "history"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Route History
          </button>
          <button
            onClick={() => setActiveTab("coverage")}
            className={`${
              activeTab === "coverage"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Territory Coverage
          </button>
        </nav>
      </div>

      {/* Live Tracking Tab */}
      {activeTab === "live" && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Real-Time Location Tracking</h2>

          {/* Van Seller Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Van Seller
            </label>
            <select
              value={selectedSeller?.id || ""}
              onChange={(e) => {
                const seller = vanSellers.find(s => s.id === e.target.value);
                setSelectedSeller(seller);
                if (trackingEnabled) {
                  stopTracking();
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Select Van Seller --</option>
              {vanSellers.filter(s => s.status === "active").map((seller) => (
                <option key={seller.id} value={seller.id}>
                  {seller.name} ({seller.vanSellerId}) - {getTerritoryById(seller.territoryId)?.name || "No Territory"}
                </option>
              ))}
            </select>
          </div>

          {/* Tracking Interval */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Update Interval (seconds)
            </label>
            <input
              type="number"
              value={trackingInterval}
              onChange={(e) => setTrackingInterval(parseInt(e.target.value) || 30)}
              min="10"
              max="300"
              className="w-48 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={trackingEnabled}
            />
          </div>

          {/* Tracking Controls */}
          <div className="mb-6">
            {!trackingEnabled ? (
              <button
                onClick={startTracking}
                disabled={!selectedSeller || !locationPermission}
                className={`px-6 py-2 rounded-md font-semibold ${
                  !selectedSeller || !locationPermission
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-green-600 text-white hover:bg-green-700"
                }`}
              >
                Start Tracking
              </button>
            ) : (
              <button
                onClick={stopTracking}
                className="px-6 py-2 bg-red-600 text-white rounded-md font-semibold hover:bg-red-700"
              >
                Stop Tracking
              </button>
            )}
          </div>

          {/* Current Location Display */}
          {currentLocation && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-3">Current Location:</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Coordinates</p>
                  <p className="font-medium">{formatCoordinates(currentLocation.latitude, currentLocation.longitude)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Accuracy</p>
                  <p className="font-medium">
                    {currentLocation.accuracy.toFixed(2)} m ({getAccuracyStatus(currentLocation.accuracy)})
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Speed</p>
                  <p className="font-medium">{currentLocation.speed ? `${currentLocation.speed.toFixed(2)} km/h` : "0 km/h"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Last Updated</p>
                  <p className="font-medium">{new Date(currentLocation.timestamp).toLocaleTimeString()}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Route History Tab */}
      {activeTab === "history" && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Route History</h2>

          {!selectedSeller ? (
            <p className="text-gray-500">Please select a van seller to view route history</p>
          ) : (
            <>
              <div className="mb-4 flex justify-between items-center">
                <p className="text-sm text-gray-600">Showing today&apos;s route history</p>
                <button
                  onClick={loadRouteHistory}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Refresh
                </button>
              </div>

              {routeHistory.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No route history found for today</p>
              ) : (
                <>
                  <div className="mb-4 bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-700">
                      Total Distance: <strong>{routeDistance.toFixed(2)} km</strong> | 
                      Total Points: <strong>{routeHistory.length}</strong>
                    </p>
                  </div>

                  <div className="overflow-auto max-h-96">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Coordinates</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Speed</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Accuracy</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {routeHistory.map((entry, index) => (
                          <tr key={entry.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {entry.timestamp?.toDate ? entry.timestamp.toDate().toLocaleTimeString() : "N/A"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">
                              {formatCoordinates(entry.latitude, entry.longitude)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {entry.speed ? `${entry.speed.toFixed(2)} km/h` : "0 km/h"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                getAccuracyStatus(entry.accuracy) === "excellent" ? "bg-green-100 text-green-800" :
                                getAccuracyStatus(entry.accuracy) === "good" ? "bg-blue-100 text-blue-800" :
                                getAccuracyStatus(entry.accuracy) === "fair" ? "bg-yellow-100 text-yellow-800" :
                                "bg-red-100 text-red-800"
                              }`}>
                                {entry.accuracy.toFixed(2)} m
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}

      {/* Territory Coverage Tab */}
      {activeTab === "coverage" && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Territory Coverage</h2>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Van Seller</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Territory</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Update</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {vanSellers.filter(s => s.status === "active").map((seller) => {
                  const territory = getTerritoryById(seller.territoryId);
                  const territoryStatus = getTerritoryStatus(seller);
                  
                  return (
                    <tr key={seller.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{seller.name}</div>
                        <div className="text-sm text-gray-500">{seller.vanSellerId}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {territory?.name || "No Territory"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">
                        {seller.currentLocation ? (
                          formatCoordinates(seller.currentLocation.latitude, seller.currentLocation.longitude)
                        ) : (
                          "No location data"
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          territoryStatus === "inside" ? "bg-green-100 text-green-800" :
                          territoryStatus === "outside" ? "bg-red-100 text-red-800" :
                          "bg-gray-100 text-gray-800"
                        }`}>
                          {territoryStatus === "inside" ? "Inside Territory" :
                           territoryStatus === "outside" ? "Outside Territory" :
                           "Unknown"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {seller.currentLocation?.timestamp?.toDate 
                          ? seller.currentLocation.timestamp.toDate().toLocaleString()
                          : "N/A"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
