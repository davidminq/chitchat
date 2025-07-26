// 통합 위치 서비스 시스템
class LocationService {
  constructor() {
    this.userLocation = null;
    this.watchId = null;
    this.locationOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 30000 // 30초 캐시
    };
  }

  // 현재 위치 가져오기
  async getCurrentPosition() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject({
          error: 'GEOLOCATION_NOT_SUPPORTED',
          message: '이 브라우저는 위치 서비스를 지원하지 않습니다.'
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
              errorMessage = '위치 접근이 거부되었습니다. 브라우저 설정에서 위치 권한을 허용해주세요.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = '현재 위치를 찾을 수 없습니다.';
              break;
            case error.TIMEOUT:
              errorMessage = '위치 요청 시간이 초과되었습니다.';
              break;
            default:
              errorMessage = '알 수 없는 오류가 발생했습니다.';
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

  // 실시간 위치 추적 시작
  startWatchingLocation(callback) {
    if (!navigator.geolocation) {
      callback({
        error: 'GEOLOCATION_NOT_SUPPORTED',
        message: '이 브라우저는 위치 서비스를 지원하지 않습니다.'
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
        
        // 위치가 크게 변경된 경우에만 업데이트 (10m 이상)
        if (this.hasLocationChanged(location, 10)) {
          this.userLocation = location;
          callback({ success: true, location });
        }
      },
      (error) => {
        callback({
          error: 'GEOLOCATION_ERROR',
          code: error.code,
          message: '위치 추적 중 오류가 발생했습니다.'
        });
      },
      this.locationOptions
    );

    return this.watchId;
  }

  // 위치 추적 중지
  stopWatchingLocation() {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  // 위치 변경 감지
  hasLocationChanged(newLocation, minDistanceMeters = 10) {
    if (!this.userLocation) return true;
    
    const distance = LocationService.calculateDistance(
      this.userLocation.latitude,
      this.userLocation.longitude,
      newLocation.latitude,
      newLocation.longitude
    ) * 1000; // km를 m로 변환
    
    return distance >= minDistanceMeters;
  }

  // 두 지점 간 거리 계산 (하버사인 공식)
  static calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // 지구 반지름 (km)
    const dLat = LocationService.toRadians(lat2 - lat1);
    const dLon = LocationService.toRadians(lon2 - lon1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(LocationService.toRadians(lat1)) * Math.cos(LocationService.toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // km 단위
    
    return distance;
  }

  // 도를 라디안으로 변환
  static toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  // 반경 내 위치 확인
  static isWithinRadius(userLat, userLon, targetLat, targetLon, radiusKm = 1) {
    const distance = this.calculateDistance(userLat, userLon, targetLat, targetLon);
    return distance <= radiusKm;
  }

  // 지오해시 생성 (채팅방 그룹핑용)
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

  // 채팅방 ID 생성 (그리드 시스템)
  static getChatRoomId(latitude, longitude) {
    const gridSize = 0.009; // 대략 1km
    const latGrid = Math.floor(latitude / gridSize);
    const lonGrid = Math.floor(longitude / gridSize);
    
    return `room_${latGrid}_${lonGrid}`;
  }

  // 현재 위치의 지오해시 가져오기
  getCurrentGeohash(precision = 7) {
    if (!this.userLocation) return null;
    
    return LocationService.generateGeohash(
      this.userLocation.latitude,
      this.userLocation.longitude,
      precision
    );
  }

  // 위치 정보 익명화
  static anonymizeLocation(lat, lon, radiusMeters = 100) {
    const latOffset = (Math.random() - 0.5) * (radiusMeters / 111000);
    const lonOffset = (Math.random() - 0.5) * (radiusMeters / (111000 * Math.cos(lat * Math.PI / 180)));
    
    return {
      latitude: lat + latOffset,
      longitude: lon + lonOffset
    };
  }

  // 위치 상태 확인
  getLocationStatus() {
    return {
      hasLocation: this.userLocation !== null,
      isWatching: this.watchId !== null,
      location: this.userLocation,
      geohash: this.getCurrentGeohash(),
      lastUpdate: this.userLocation?.timestamp
    };
  }

  // 위치 권한 상태 확인
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

// 위치 기반 채팅방 관리
class LocationChatManager {
  constructor(locationService) {
    this.locationService = locationService;
    this.currentChatRoom = null;
    this.nearbyUsers = new Map();
  }

  // 현재 위치 기반 채팅방 ID 생성
  getCurrentChatRoomId() {
    const geohash = this.locationService.getCurrentGeohash(6);
    if (!geohash) return null;
    
    return `chat_${geohash}`;
  }

  // 근처 사용자 목록 업데이트
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
        1 // 1km 반경
      );
    });

    this.nearbyUsers.clear();
    nearbyUsers.forEach(user => {
      this.nearbyUsers.set(user.id, user);
    });

    return nearbyUsers;
  }

  // 채팅방 입장 가능 여부 확인
  canJoinChatRoom() {
    return this.locationService.userLocation !== null;
  }

  // 현재 채팅방 정보
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

// 인스턴스 생성
const locationService = new LocationService();

// 호환성을 위한 유틸리티 함수들
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