// Geolocation utilities for 1km radius chat rooms
export const getCurrentPosition = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000 // Cache for 1 minute
      }
    );
  });
};

// Calculate distance between two points using Haversine formula
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  
  return distance;
};

const toRadians = (degrees) => {
  return degrees * (Math.PI / 180);
};

// Get chat room ID based on location (simplified grid system)
export const getChatRoomId = (latitude, longitude) => {
  // Create a grid system - each cell represents roughly 1km
  const gridSize = 0.009; // Approximately 1km at equator
  const latGrid = Math.floor(latitude / gridSize);
  const lonGrid = Math.floor(longitude / gridSize);
  
  return `room_${latGrid}_${lonGrid}`;
};

// Check if user is within 1km radius of a location
export const isWithinRadius = (userLat, userLon, targetLat, targetLon, radiusKm = 1) => {
  const distance = calculateDistance(userLat, userLon, targetLat, targetLon);
  return distance <= radiusKm;
};