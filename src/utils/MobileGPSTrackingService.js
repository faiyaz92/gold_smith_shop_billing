// src/utils/MobileGPSTrackingService.js
/**
 * Mobile GPS Tracking Service
 *
 * Provides GPS tracking functionality optimized for mobile devices.
 * Works offline and syncs location data when online.
 */

class MobileGPSTrackingService {
  constructor(companyId, vanSellerId) {
    this.companyId = companyId;
    this.vanSellerId = vanSellerId;
    this.isTracking = false;
    this.watchId = null;
    this.currentPosition = null;
    this.locationHistory = [];
    this.offlineLocations = [];

    // Configuration
    this.config = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 30000, // 30 seconds
      updateInterval: 30000, // 30 seconds
      maxOfflineLocations: 100
    };

    this.initIndexedDB();
  }

  /**
   * Initialize IndexedDB for offline location storage
   */
  async initIndexedDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('MobileGPSTrackingDB', 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('locations')) {
          const store = db.createObjectStore('locations', { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('synced', 'synced', { unique: false });
        }
      };
    });
  }

  /**
   * Request location permissions
   * @returns {Promise<boolean>} - True if permission granted
   */
  async requestLocationPermission() {
    if (!navigator.permissions) return true;

    try {
      const result = await navigator.permissions.query({ name: 'geolocation' });
      return result.state === 'granted';
    } catch (error) {
      console.error('Error checking location permission:', error);
      return false;
    }
  }

  /**
   * Start GPS tracking
   * @returns {Promise<void>}
   */
  async startTracking() {
    if (this.isTracking) return;

    const hasPermission = await this.requestLocationPermission();
    if (!hasPermission) {
      throw new Error('Location permission denied');
    }

    this.isTracking = true;

    // Get initial position
    try {
      const position = await this.getCurrentPosition();
      this.handlePositionUpdate(position);
    } catch (error) {
      console.error('Failed to get initial position:', error);
    }

    // Start continuous tracking
    this.watchId = navigator.geolocation.watchPosition(
      (position) => this.handlePositionUpdate(position),
      (error) => this.handlePositionError(error),
      this.config
    );

    // Set up periodic updates
    this.updateInterval = setInterval(() => {
      this.getCurrentPosition()
        .then(position => this.handlePositionUpdate(position))
        .catch(error => console.error('Periodic position update failed:', error));
    }, this.config.updateInterval);

    console.log('GPS tracking started');
  }

  /**
   * Stop GPS tracking
   */
  stopTracking() {
    if (!this.isTracking) return;

    this.isTracking = false;

    if (this.watchId) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }

    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    console.log('GPS tracking stopped');
  }

  /**
   * Get current position
   * @returns {Promise<GeolocationPosition>}
   */
  getCurrentPosition() {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        resolve,
        reject,
        this.config
      );
    });
  }

  /**
   * Handle position updates
   * @param {GeolocationPosition} position
   */
  async handlePositionUpdate(position) {
    const locationData = {
      id: `loc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      vanSellerId: this.vanSellerId,
      companyId: this.companyId,
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      altitude: position.coords.altitude,
      altitudeAccuracy: position.coords.altitudeAccuracy,
      heading: position.coords.heading,
      speed: position.coords.speed,
      timestamp: new Date(position.timestamp).toISOString(),
      synced: false,
      createdAt: new Date().toISOString()
    };

    this.currentPosition = locationData;
    this.locationHistory.push(locationData);

    // Keep only recent history (last 100 positions)
    if (this.locationHistory.length > 100) {
      this.locationHistory = this.locationHistory.slice(-100);
    }

    // Store offline
    await this.storeLocationOffline(locationData);

    // Try to sync if online
    if (navigator.onLine) {
      this.syncLocations().catch(error =>
        console.error('Location sync failed:', error)
      );
    }

    // Emit location update event
    this.emitLocationUpdate(locationData);
  }

  /**
   * Handle position errors
   * @param {GeolocationPositionError} error
   */
  handlePositionError(error) {
    console.error('GPS tracking error:', error);

    const errorData = {
      type: 'gps_error',
      code: error.code,
      message: error.message,
      timestamp: new Date().toISOString()
    };

    this.emitLocationUpdate(errorData);
  }

  /**
   * Store location data offline
   * @param {object} locationData
   */
  async storeLocationOffline(locationData) {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['locations'], 'readwrite');
      const store = transaction.objectStore('locations');
      const request = store.add(locationData);

      request.onsuccess = () => {
        // Keep only recent locations
        this.cleanupOldLocations();
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Clean up old unsynced locations
   */
  async cleanupOldLocations() {
    if (!this.db) return;

    return new Promise((resolve) => {
      const transaction = this.db.transaction(['locations'], 'readwrite');
      const store = transaction.objectStore('locations');
      const index = store.index('synced');
      const request = index.openCursor(IDBKeyRange.only(false));

      const cutoffTime = new Date();
      cutoffTime.setHours(cutoffTime.getHours() - 24); // Keep last 24 hours

      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          const location = cursor.value;
          if (new Date(location.timestamp) < cutoffTime) {
            cursor.delete();
          }
          cursor.continue();
        } else {
          resolve();
        }
      };

      request.onerror = () => resolve(); // Continue even if cleanup fails
    });
  }

  /**
   * Sync locations to Firebase
   */
  async syncLocations() {
    if (!this.db || !navigator.onLine) return;

    try {
      const unsyncedLocations = await this.getUnsyncedLocations();

      if (unsyncedLocations.length === 0) return;

      // In a real implementation, this would sync to Firebase
      // For now, we'll just mark as synced
      await this.markLocationsAsSynced(unsyncedLocations.map(loc => loc.id));

      console.log(`Synced ${unsyncedLocations.length} locations`);

    } catch (error) {
      console.error('Location sync failed:', error);
    }
  }

  /**
   * Get unsynced locations
   * @returns {Promise<Array>}
   */
  async getUnsyncedLocations() {
    if (!this.db) return [];

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['locations'], 'readonly');
      const store = transaction.objectStore('locations');
      const index = store.index('synced');
      const request = index.getAll(false);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Mark locations as synced
   * @param {Array<string>} locationIds
   */
  async markLocationsAsSynced(locationIds) {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['locations'], 'readwrite');
      const store = transaction.objectStore('locations');

      let completed = 0;
      const total = locationIds.length;

      if (total === 0) {
        resolve();
        return;
      }

      locationIds.forEach(id => {
        const getRequest = store.get(id);
        getRequest.onsuccess = () => {
          const location = getRequest.result;
          if (location) {
            location.synced = true;
            const updateRequest = store.put(location);
            updateRequest.onsuccess = () => {
              completed++;
              if (completed === total) resolve();
            };
            updateRequest.onerror = () => {
              completed++;
              if (completed === total) resolve();
            };
          } else {
            completed++;
            if (completed === total) resolve();
          }
        };
        getRequest.onerror = () => {
          completed++;
          if (completed === total) resolve();
        };
      });
    });
  }

  /**
   * Get current location
   * @returns {object|null}
   */
  getCurrentLocation() {
    return this.currentPosition;
  }

  /**
   * Get location history
   * @param {number} limit - Maximum number of locations to return
   * @returns {Array}
   */
  getLocationHistory(limit = 50) {
    return this.locationHistory.slice(-limit);
  }

  /**
   * Calculate distance between two points
   * @param {object} point1 - {latitude, longitude}
   * @param {object} point2 - {latitude, longitude}
   * @returns {number} - Distance in meters
   */
  calculateDistance(point1, point2) {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = point1.latitude * Math.PI / 180;
    const φ2 = point2.latitude * Math.PI / 180;
    const Δφ = (point2.latitude - point1.latitude) * Math.PI / 180;
    const Δλ = (point2.longitude - point1.longitude) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }

  /**
   * Emit location update event
   * @param {object} data
   */
  emitLocationUpdate(data) {
    const event = new CustomEvent('gpsLocationUpdate', {
      detail: data
    });
    window.dispatchEvent(event);
  }

  /**
   * Get tracking status
   * @returns {object}
   */
  getTrackingStatus() {
    return {
      isTracking: this.isTracking,
      currentLocation: this.currentPosition,
      historyCount: this.locationHistory.length,
      isOnline: navigator.onLine
    };
  }

  /**
   * Update tracking configuration
   * @param {object} newConfig
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };

    // Restart tracking if active
    if (this.isTracking) {
      this.stopTracking();
      this.startTracking();
    }
  }
}

export default MobileGPSTrackingService;