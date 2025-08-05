// Socket.io 실시간 채팅 시스템 (클라이언트)
import { io } from 'socket.io-client';
import LocationService, { LocationChatManager } from './location-service.js';

class ChatSocket {
  constructor(serverUrl = 'http://localhost:3001') {
    this.socket = null;
    this.serverUrl = serverUrl;
    this.isConnected = false;
    this.currentUser = null;
    this.locationService = new LocationService();
    this.locationChatManager = new LocationChatManager(this.locationService);
    this.messageHandlers = new Map();
    this.currentChatRoom = null;
    
    // 이벤트 핸들러 바인딩
    this.bindEvents();
  }

  // Socket.io 연결 초기화
  async initialize(user) {
    try {
      this.currentUser = user;
      
      // 위치 권한 요청
      const location = await this.locationService.getCurrentLocation();
      console.log('위치 정보 획득:', location);
      
      // Socket 연결
      await this.connect();
      
      // 채팅방 입장
      await this.joinLocationBasedRoom();
      
      return { success: true, location, chatRoom: this.currentChatRoom };
      
    } catch (error) {
      console.error('채팅 초기화 실패:', error);
      return { success: false, error: error.message };
    }
  }

  // Socket 서버 연결
  connect() {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve();
        return;
      }

      this.socket = io(this.serverUrl, {
        transports: ['websocket'],
        timeout: 10000,
        auth: {
          userId: this.currentUser?.id,
          nickname: this.currentUser?.nickname,
          location: this.locationService.userLocation
        }
      });

      this.socket.on('connect', () => {
        console.log('Socket 연결 성공:', this.socket.id);
        this.isConnected = true;
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        console.error('Socket 연결 실패:', error);
        this.isConnected = false;
        reject(error);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('Socket 연결 해제:', reason);
        this.isConnected = false;
        this.triggerHandler('disconnected', { reason });
      });
    });
  }

  // 위치 기반 채팅방 입장
  async joinLocationBasedRoom() {
    const chatRoomId = this.locationChatManager.getCurrentChatRoomId();
    
    if (!chatRoomId) {
      throw new Error('위치 정보를 찾을 수 없습니다.');
    }

    return new Promise((resolve, reject) => {
      this.socket.emit('join_room', {
        roomId: chatRoomId,
        location: this.locationService.userLocation,
        user: {
          id: this.currentUser.id,
          nickname: this.currentUser.nickname,
          isBlueVerified: this.currentUser.isBlueVerified,
          likeCount: this.currentUser.likeCount
        }
      });

      this.socket.on('room_joined', (data) => {
        this.currentChatRoom = data.roomId;
        console.log('채팅방 입장 완료:', data);
        resolve(data);
      });

      this.socket.on('room_join_error', (error) => {
        console.error('채팅방 입장 실패:', error);
        reject(error);
      });
    });
  }

  // 메시지 전송
  sendMessage(content, type = 'text') {
    if (!this.isConnected || !this.currentChatRoom) {
      return { success: false, error: '채팅방에 연결되지 않았습니다.' };
    }

    const message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      content: content.trim(),
      type: type,
      timestamp: Date.now(),
      roomId: this.currentChatRoom,
      sender: {
        id: this.currentUser.id,
        nickname: this.currentUser.nickname,
        isBlueVerified: this.currentUser.isBlueVerified,
        likeCount: this.currentUser.likeCount
      }
    };

    this.socket.emit('send_message', message);
    return { success: true, message };
  }

  // 사용자 추천(Like)
  likeUser(targetUserId) {
    if (!this.isConnected) return { success: false, error: '연결되지 않았습니다.' };

    this.socket.emit('like_user', {
      targetUserId,
      fromUserId: this.currentUser.id,
      roomId: this.currentChatRoom
    });

    return { success: true };
  }

  // 사용자 신고
  reportUser(targetUserId, reason = 'inappropriate_content') {
    if (!this.isConnected) return { success: false, error: '연결되지 않았습니다.' };

    this.socket.emit('report_user', {
      targetUserId,
      fromUserId: this.currentUser.id,
      reason,
      roomId: this.currentChatRoom,
      timestamp: Date.now()
    });

    return { success: true };
  }

  // 위치 업데이트 (사용자가 이동한 경우)
  updateLocation() {
    this.locationService.getCurrentLocation()
      .then((newLocation) => {
        const newChatRoomId = this.locationChatManager.getCurrentChatRoomId();
        
        // 채팅방이 변경된 경우
        if (newChatRoomId !== this.currentChatRoom) {
          this.socket.emit('leave_room', { roomId: this.currentChatRoom });
          this.joinLocationBasedRoom();
        } else {
          // 같은 채팅방 내에서 위치만 업데이트
          this.socket.emit('update_location', {
            location: newLocation,
            roomId: this.currentChatRoom
          });
        }
      })
      .catch((error) => {
        console.error('위치 업데이트 실패:', error);
      });
  }

  // 이벤트 핸들러 등록
  on(event, handler) {
    this.messageHandlers.set(event, handler);
  }

  // 이벤트 핸들러 제거
  off(event) {
    this.messageHandlers.delete(event);
  }

  // 이벤트 핸들러 실행
  triggerHandler(event, data) {
    const handler = this.messageHandlers.get(event);
    if (handler) {
      handler(data);
    }
  }

  // Socket 이벤트 바인딩
  bindEvents() {
    // 소켓 연결 후에 이벤트 리스너 등록
    this.onConnect = () => {
      if (!this.socket) return;

      // 새 메시지 수신
      this.socket.on('new_message', (message) => {
        this.triggerHandler('message_received', message);
      });

      // 사용자 입장/퇴장
      this.socket.on('user_joined', (user) => {
        this.triggerHandler('user_joined', user);
      });

      this.socket.on('user_left', (user) => {
        this.triggerHandler('user_left', user);
      });

      // 추천 알림
      this.socket.on('like_received', (data) => {
        this.triggerHandler('like_received', data);
      });

      // 근처 사용자 목록 업데이트
      this.socket.on('nearby_users_updated', (users) => {
        const nearbyUsers = this.locationChatManager.updateNearbyUsers(users);
        this.triggerHandler('nearby_users_updated', nearbyUsers);
      });

      // 시스템 알림
      this.socket.on('system_notification', (notification) => {
        this.triggerHandler('system_notification', notification);
      });

      // 에러 처리
      this.socket.on('error', (error) => {
        this.triggerHandler('error', error);
      });
    };
  }

  // 연결 해제
  disconnect() {
    if (this.socket) {
      if (this.currentChatRoom) {
        this.socket.emit('leave_room', { roomId: this.currentChatRoom });
      }
      
      this.socket.disconnect();
      this.socket = null;
    }
    
    this.locationService.stopWatchingLocation();
    this.isConnected = false;
    this.currentChatRoom = null;
  }

  // 연결 상태 확인
  getStatus() {
    return {
      isConnected: this.isConnected,
      hasLocation: this.locationService.userLocation !== null,
      currentChatRoom: this.currentChatRoom,
      nearbyUserCount: this.locationChatManager.nearbyUsers.size,
      socketId: this.socket?.id
    };
  }

  // 실시간 위치 추적 시작 (사용자가 이동하는 경우 감지)
  startLocationTracking() {
    this.locationService.startWatchingLocation((result) => {
      if (result.success) {
        this.updateLocation();
      } else {
        console.error('위치 추적 오류:', result);
      }
    });
  }

  // 채팅방 통계 요청
  requestRoomStats() {
    if (this.isConnected && this.currentChatRoom) {
      this.socket.emit('get_room_stats', { roomId: this.currentChatRoom });
    }
  }
}

export default ChatSocket;