// Integrated location service system
class LocationService {
  constructor() {
    this.userLocation = null;
    this.watchId = null;
    this.locationOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 30000 // 30 second cache
    };
  }

  // Get current position
  async getCurrentPosition() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject({
          error: 'GEOLOCATION_NOT_SUPPORTED',
          message: 'This browser does not support location services.'
        });
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: Date.now()
          };
          
          this.userLocation = location;
          resolve(location);
        },
        (error) => {
          let errorMessage = '';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied. Please allow location permission in your browser settings.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Current location cannot be found.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out.';
              break;
            default:
              errorMessage = 'An unknown error occurred.';
              break;
          }
          
          reject({
            error: 'GEOLOCATION_ERROR',
            code: error.code,
            message: errorMessage
          });
        },
        this.locationOptions
      );
    });
  }

  // Start real-time location tracking
  startWatchingLocation(callback) {
    if (!navigator.geolocation) {
      callback({
        error: 'GEOLOCATION_NOT_SUPPORTED',
        message: 'This browser does not support location services.'
      });
      return;
    }

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: Date.now()
        };
        
        // Update only when location has changed significantly (10m or more)
        if (this.hasLocationChanged(location, 10)) {
          this.userLocation = location;
          callback({ success: true, location });
        }
      },
      (error) => {
        callback({
          error: 'GEOLOCATION_ERROR',
          code: error.code,
          message: 'An error occurred during location tracking.'
        });
      },
      this.locationOptions
    );

    return this.watchId;
  }

  // Stop location tracking
  stopWatchingLocation() {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  // Detect location changes
  hasLocationChanged(newLocation, minDistanceMeters = 10) {
    if (!this.userLocation) return true;
    
    const distance = LocationService.calculateDistance(
      this.userLocation.latitude,
      this.userLocation.longitude,
      newLocation.latitude,
      newLocation.longitude
    ) * 1000; // Convert km to meters
    
    return distance >= minDistanceMeters;
  }

  // Calculate distance between two points (Haversine formula)
  static calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth radius (km)
    const dLat = LocationService.toRadians(lat2 - lat1);
    const dLon = LocationService.toRadians(lon2 - lon1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(LocationService.toRadians(lat1)) * Math.cos(LocationService.toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in km
    
    return distance;
  }

  // Convert degrees to radians
  static toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  // Check if location is within radius
  static isWithinRadius(userLat, userLon, targetLat, targetLon, radiusKm = 1) {
    const distance = this.calculateDistance(userLat, userLon, targetLat, targetLon);
    return distance <= radiusKm;
  }

  // Generate geohash (for chat room grouping)
  static generateGeohash(lat, lon, precision = 7) {
    const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz';
    let idx = 0;
    let bit = 0;
    let evenBit = true;
    let geohash = '';
    
    let latMin = -90, latMax = 90;
    let lonMin = -180, lonMax = 180;
    
    while (geohash.length < precision) {
      if (evenBit) {
        // longitude
        const mid = (lonMin + lonMax) / 2;
        if (lon >= mid) {
          idx = (idx << 1) + 1;
          lonMin = mid;
        } else {
          idx = idx << 1;
          lonMax = mid;
        }
      } else {
        // latitude
        const mid = (latMin + latMax) / 2;
        if (lat >= mid) {
          idx = (idx << 1) + 1;
          latMin = mid;
        } else {
          idx = idx << 1;
          latMax = mid;
        }
      }
      
      evenBit = !evenBit;
      
      if (++bit === 5) {
        geohash += BASE32[idx];
        bit = 0;
        idx = 0;
      }
    }
    
    return geohash;
  }

  // Generate chat room ID (grid system)
  static getChatRoomId(latitude, longitude) {
    const gridSize = 0.009; // Approximately 1km
    const latGrid = Math.floor(latitude / gridSize);
    const lonGrid = Math.floor(longitude / gridSize);
    
    return `room_${latGrid}_${lonGrid}`;
  }

  // Get geohash of current location
  getCurrentGeohash(precision = 7) {
    if (!this.userLocation) return null;
    
    return LocationService.generateGeohash(
      this.userLocation.latitude,
      this.userLocation.longitude,
      precision
    );
  }

  // Anonymize location information
  static anonymizeLocation(lat, lon, radiusMeters = 100) {
    const latOffset = (Math.random() - 0.5) * (radiusMeters / 111000);
    const lonOffset = (Math.random() - 0.5) * (radiusMeters / (111000 * Math.cos(lat * Math.PI / 180)));
    
    return {
      latitude: lat + latOffset,
      longitude: lon + lonOffset
    };
  }

  // Check location status
  getLocationStatus() {
    return {
      hasLocation: this.userLocation !== null,
      isWatching: this.watchId !== null,
      location: this.userLocation,
      geohash: this.getCurrentGeohash(),
      lastUpdate: this.userLocation?.timestamp
    };
  }

  // Check location permission status
  async checkLocationPermission() {
    if (!navigator.permissions) {
      return { state: 'unknown' };
    }

    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      return {
        state: permission.state,
        permission: permission
      };
    } catch (error) {
      return { state: 'unknown', error: error.message };
    }
  }
}

// Location-based chat room management
class LocationChatManager {
  constructor(locationService) {
    this.locationService = locationService;
    this.currentChatRoom = null;
    this.nearbyUsers = new Map();
  }

  // Generate chat room ID based on current location
  getCurrentChatRoomId() {
    const geohash = this.locationService.getCurrentGeohash(6);
    if (!geohash) return null;
    
    return `chat_${geohash}`;
  }

  // Update nearby users list
  updateNearbyUsers(userList) {
    const currentLocation = this.locationService.userLocation;
    if (!currentLocation) return [];

    const nearbyUsers = userList.filter(user => {
      if (!user.location) return false;
      
      return LocationService.isWithinRadius(
        currentLocation.latitude,
        currentLocation.longitude,
        user.location.latitude,
        user.location.longitude,
        1 // 1km radius
      );
    });

    this.nearbyUsers.clear();
    nearbyUsers.forEach(user => {
      this.nearbyUsers.set(user.id, user);
    });

    return nearbyUsers;
  }

  // Check if can join chat room
  canJoinChatRoom() {
    return this.locationService.userLocation !== null;
  }

  // Current chat room information
  getCurrentChatRoomInfo() {
    const chatRoomId = this.getCurrentChatRoomId();
    const nearbyUserCount = this.nearbyUsers.size;
    
    return {
      chatRoomId,
      nearbyUserCount,
      hasLocation: this.canJoinChatRoom(),
      geohash: this.locationService.getCurrentGeohash()
    };
  }
}

// Create instance
const locationService = new LocationService();

// Utility functions for compatibility
export const getCurrentPosition = () => {
  return locationService.getCurrentPosition();
};

export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  return LocationService.calculateDistance(lat1, lon1, lat2, lon2);
};

export const isWithinRadius = (userLat, userLon, targetLat, targetLon, radiusKm = 1) => {
  return LocationService.isWithinRadius(userLat, userLon, targetLat, targetLon, radiusKm);
};

export const getChatRoomId = (latitude, longitude) => {
  return LocationService.getChatRoomId(latitude, longitude);
};

export { LocationService, LocationChatManager };
export default locationService;