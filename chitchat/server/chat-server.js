// Socket.io 채팅 서버 (Node.js + Express)
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

class ChatServer {
  constructor(port = 3001) {
    this.port = port;
    this.app = express();
    this.server = http.createServer(this.app);
    this.io = socketIo(this.server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });
    
    // 메모리 저장소 (실제 운영에서는 Redis 사용 권장)
    this.chatRooms = new Map(); // roomId -> { users: Set, messages: Array }
    this.connectedUsers = new Map(); // socketId -> userData
    this.userReports = new Map(); // userId -> reportCount
    this.userLikes = new Map(); // userId -> likeCount
    this.bannedUsers = new Set(); // 정지된 사용자 목록
    
    // 휘발성 메시지를 위한 타이머
    this.messageCleanupInterval = null;
    
    this.setupMiddleware();
    this.setupSocketHandlers();
    this.startMessageCleanup();
  }

  // Express 미들웨어 설정
  setupMiddleware() {
    this.app.use(cors());
    this.app.use(express.json());
    
    // 헬스체크 엔드포인트
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'ok',
        connectedUsers: this.connectedUsers.size,
        activeRooms: this.chatRooms.size,
        timestamp: new Date().toISOString()
      });
    });

    // 채팅방 통계 API
    this.app.get('/api/rooms/:roomId/stats', (req, res) => {
      const roomId = req.params.roomId;
      const room = this.chatRooms.get(roomId);
      
      if (!room) {
        return res.status(404).json({ error: 'Room not found' });
      }

      res.json({
        roomId,
        userCount: room.users.size,
        messageCount: room.messages.length,
        lastActivity: room.lastActivity || null
      });
    });
  }

  // Socket.io 이벤트 핸들러 설정
  setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`사용자 연결: ${socket.id}`);
      
      // 연결 시 사용자 정보 저장
      socket.on('join_room', (data) => {
        this.handleJoinRoom(socket, data);
      });

      // 메시지 전송
      socket.on('send_message', (message) => {
        this.handleSendMessage(socket, message);
      });

      // 사용자 추천
      socket.on('like_user', (data) => {
        this.handleLikeUser(socket, data);
      });

      // 사용자 신고
      socket.on('report_user', (data) => {
        this.handleReportUser(socket, data);
      });

      // 위치 업데이트
      socket.on('update_location', (data) => {
        this.handleUpdateLocation(socket, data);
      });

      // 채팅방 퇴장
      socket.on('leave_room', (data) => {
        this.handleLeaveRoom(socket, data);
      });

      // 채팅방 통계 요청
      socket.on('get_room_stats', (data) => {
        this.handleGetRoomStats(socket, data);
      });

      // 연결 해제
      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });
    });
  }

  // 채팅방 입장 처리
  handleJoinRoom(socket, data) {
    const { roomId, location, user } = data;
    
    // 정지된 사용자 확인
    if (this.bannedUsers.has(user.id)) {
      socket.emit('room_join_error', {
        error: 'BANNED_USER',
        message: '정지된 사용자는 채팅에 참여할 수 없습니다.'
      });
      return;
    }

    // 위치 정보 검증
    if (!location || !location.latitude || !location.longitude) {
      socket.emit('room_join_error', {
        error: 'INVALID_LOCATION',
        message: '위치 정보가 유효하지 않습니다.'
      });
      return;
    }

    // 사용자 정보 저장
    const userData = {
      ...user,
      socketId: socket.id,
      location,
      joinedAt: Date.now(),
      lastActivity: Date.now()
    };

    this.connectedUsers.set(socket.id, userData);

    // 채팅방 생성/입장
    if (!this.chatRooms.has(roomId)) {
      this.chatRooms.set(roomId, {
        users: new Set(),
        messages: [],
        createdAt: Date.now(),
        lastActivity: Date.now()
      });
    }

    const room = this.chatRooms.get(roomId);
    room.users.add(socket.id);
    room.lastActivity = Date.now();

    // Socket을 채팅방에 추가
    socket.join(roomId);

    // 입장 성공 알림
    socket.emit('room_joined', {
      roomId,
      userCount: room.users.size,
      success: true
    });

    // 다른 사용자들에게 새 사용자 입장 알림
    socket.to(roomId).emit('user_joined', {
      id: user.id,
      nickname: user.nickname,
      isBlueVerified: user.isBlueVerified,
      likeCount: user.likeCount,
      joinedAt: userData.joinedAt
    });

    // 근처 사용자 목록 업데이트
    this.updateNearbyUsers(roomId);

    console.log(`사용자 ${user.nickname} (${user.id})이 채팅방 ${roomId}에 입장`);
  }

  // 메시지 전송 처리
  handleSendMessage(socket, message) {
    const user = this.connectedUsers.get(socket.id);
    if (!user) {
      socket.emit('error', { message: '사용자 정보를 찾을 수 없습니다.' });
      return;
    }

    // 정지된 사용자 확인
    if (this.bannedUsers.has(user.id)) {
      socket.emit('error', { message: '정지된 사용자는 메시지를 보낼 수 없습니다.' });
      return;
    }

    // 메시지 검증
    if (!message.content || message.content.trim() === '') {
      socket.emit('error', { message: '메시지 내용이 비어있습니다.' });
      return;
    }

    if (message.content.length > 500) {
      socket.emit('error', { message: '메시지가 너무 깁니다. (최대 500자)' });
      return;
    }

    const roomId = message.roomId;
    const room = this.chatRooms.get(roomId);
    
    if (!room || !room.users.has(socket.id)) {
      socket.emit('error', { message: '채팅방에 입장하지 않았습니다.' });
      return;
    }

    // 단어 필터링 (기본적인 욕설 필터)
    const filteredContent = this.filterMessage(message.content);

    // 메시지 객체 생성
    const processedMessage = {
      ...message,
      content: filteredContent,
      sender: {
        id: user.id,
        nickname: user.nickname,
        isBlueVerified: user.isBlueVerified,
        likeCount: this.userLikes.get(user.id) || user.likeCount || 0
      },
      timestamp: Date.now(),
      expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24시간 후 삭제
    };

    // 메시지 저장
    room.messages.push(processedMessage);
    room.lastActivity = Date.now();

    // 사용자 활동 시간 업데이트
    user.lastActivity = Date.now();

    // 채팅방 전체에 메시지 브로드캐스트
    this.io.to(roomId).emit('new_message', processedMessage);

    console.log(`메시지 전송: ${user.nickname} -> ${roomId}: ${filteredContent}`);
  }

  // 사용자 추천 처리
  handleLikeUser(socket, data) {
    const { targetUserId, fromUserId, roomId } = data;
    const fromUser = this.connectedUsers.get(socket.id);

    if (!fromUser || fromUser.id !== fromUserId) {
      socket.emit('error', { message: '인증되지 않은 사용자입니다.' });
      return;
    }

    // 자기 자신 추천 방지
    if (targetUserId === fromUserId) {
      socket.emit('error', { message: '자기 자신을 추천할 수 없습니다.' });
      return;
    }

    // 추천 수 업데이트
    const currentLikes = this.userLikes.get(targetUserId) || 0;
    this.userLikes.set(targetUserId, currentLikes + 1);

    // 대상 사용자에게 알림
    const targetSocketId = this.findUserSocketId(targetUserId);
    if (targetSocketId) {
      this.io.to(targetSocketId).emit('like_received', {
        fromUser: {
          id: fromUser.id,
          nickname: fromUser.nickname,
          isBlueVerified: fromUser.isBlueVerified
        },
        newLikeCount: currentLikes + 1,
        timestamp: Date.now()
      });
    }

    console.log(`추천: ${fromUser.nickname} -> ${targetUserId} (총 ${currentLikes + 1}개)`);
  }

  // 사용자 신고 처리
  handleReportUser(socket, data) {
    const { targetUserId, fromUserId, reason, roomId } = data;
    const fromUser = this.connectedUsers.get(socket.id);

    if (!fromUser || fromUser.id !== fromUserId) {
      socket.emit('error', { message: '인증되지 않은 사용자입니다.' });
      return;
    }

    // 신고 누적
    const currentReports = this.userReports.get(targetUserId) || 0;
    const newReportCount = currentReports + 1;
    this.userReports.set(targetUserId, newReportCount);

    console.log(`신고 접수: ${fromUser.nickname} -> ${targetUserId} (${reason}), 누적: ${newReportCount}회`);

    // 신고 7회 누적 시 7일 정지
    if (newReportCount >= 7) {
      this.banUser(targetUserId, '신고 누적', 7);
    }

    // 신고자에게 확인 메시지
    socket.emit('system_notification', {
      type: 'report_success',
      message: '신고가 접수되었습니다.',
      timestamp: Date.now()
    });
  }

  // 사용자 정지 처리
  banUser(userId, reason, days = 7) {
    this.bannedUsers.add(userId);
    
    // 정지된 사용자의 소켓을 찾아 연결 해제
    const targetSocketId = this.findUserSocketId(userId);
    if (targetSocketId) {
      const targetSocket = this.io.sockets.sockets.get(targetSocketId);
      if (targetSocket) {
        targetSocket.emit('system_notification', {
          type: 'banned',
          message: `계정이 ${days}일간 정지되었습니다. (사유: ${reason})`,
          banDays: days,
          timestamp: Date.now()
        });
        
        setTimeout(() => {
          targetSocket.disconnect();
        }, 3000); // 3초 후 연결 해제
      }
    }

    // 정지 해제 예약 (실제 운영에서는 DB + 스케줄러 사용)
    setTimeout(() => {
      this.bannedUsers.delete(userId);
      console.log(`사용자 ${userId} 정지 해제`);
    }, days * 24 * 60 * 60 * 1000);

    console.log(`사용자 ${userId} 정지: ${reason} (${days}일)`);
  }

  // 위치 업데이트 처리
  handleUpdateLocation(socket, data) {
    const user = this.connectedUsers.get(socket.id);
    if (!user) return;

    user.location = data.location;
    user.lastActivity = Date.now();

    // 근처 사용자 목록 업데이트
    this.updateNearbyUsers(data.roomId);
  }

  // 채팅방 퇴장 처리
  handleLeaveRoom(socket, data) {
    const { roomId } = data;
    const user = this.connectedUsers.get(socket.id);
    
    if (user) {
      const room = this.chatRooms.get(roomId);
      if (room) {
        room.users.delete(socket.id);
        
        // 다른 사용자들에게 퇴장 알림
        socket.to(roomId).emit('user_left', {
          id: user.id,
          nickname: user.nickname,
          leftAt: Date.now()
        });

        // 빈 채팅방 정리
        if (room.users.size === 0) {
          this.chatRooms.delete(roomId);
          console.log(`채팅방 ${roomId} 삭제 (사용자 없음)`);
        }
      }
      
      socket.leave(roomId);
      console.log(`사용자 ${user.nickname}이 채팅방 ${roomId}에서 퇴장`);
    }
  }

  // 채팅방 통계 조회
  handleGetRoomStats(socket, data) {
    const { roomId } = data;
    const room = this.chatRooms.get(roomId);
    
    if (room) {
      socket.emit('room_stats', {
        roomId,
        userCount: room.users.size,
        messageCount: room.messages.length,
        lastActivity: room.lastActivity
      });
    }
  }

  // 연결 해제 처리
  handleDisconnect(socket) {
    const user = this.connectedUsers.get(socket.id);
    
    if (user) {
      // 모든 채팅방에서 사용자 제거
      this.chatRooms.forEach((room, roomId) => {
        if (room.users.has(socket.id)) {
          room.users.delete(socket.id);
          
          // 다른 사용자들에게 퇴장 알림
          socket.to(roomId).emit('user_left', {
            id: user.id,
            nickname: user.nickname,
            leftAt: Date.now()
          });

          // 빈 채팅방 정리
          if (room.users.size === 0) {
            this.chatRooms.delete(roomId);
          }
        }
      });

      this.connectedUsers.delete(socket.id);
      console.log(`사용자 ${user.nickname} 연결 해제`);
    }
  }

  // 근처 사용자 목록 업데이트
  updateNearbyUsers(roomId) {
    const room = this.chatRooms.get(roomId);
    if (!room) return;

    const nearbyUsers = [];
    
    room.users.forEach((socketId) => {
      const user = this.connectedUsers.get(socketId);
      if (user && user.location) {
        nearbyUsers.push({
          id: user.id,
          nickname: user.nickname,
          isBlueVerified: user.isBlueVerified,
          likeCount: this.userLikes.get(user.id) || user.likeCount || 0,
          location: user.location // 실제 운영시 익명화된 위치만 전송
        });
      }
    });

    // 채팅방의 모든 사용자에게 브로드캐스트
    this.io.to(roomId).emit('nearby_users_updated', nearbyUsers);
  }

  // 사용자 소켓 ID 찾기
  findUserSocketId(userId) {
    for (const [socketId, userData] of this.connectedUsers.entries()) {
      if (userData.id === userId) {
        return socketId;
      }
    }
    return null;
  }

  // 메시지 필터링 (기본적인 욕설 필터)
  filterMessage(content) {
    const bannedWords = ['욕설1', '욕설2']; // 실제로는 더 많은 단어 목록 필요
    let filteredContent = content;
    
    bannedWords.forEach(word => {
      const regex = new RegExp(word, 'gi');
      filteredContent = filteredContent.replace(regex, '*'.repeat(word.length));
    });
    
    return filteredContent;
  }

  // 휘발성 메시지 정리 (24시간 후 삭제)
  startMessageCleanup() {
    this.messageCleanupInterval = setInterval(() => {
      const now = Date.now();
      
      this.chatRooms.forEach((room, roomId) => {
        const validMessages = room.messages.filter(msg => 
          msg.expiresAt > now
        );
        
        if (validMessages.length !== room.messages.length) {
          room.messages = validMessages;
          console.log(`채팅방 ${roomId}에서 ${room.messages.length - validMessages.length}개 메시지 정리`);
        }
      });
    }, 60 * 60 * 1000); // 1시간마다 실행
  }

  // 서버 시작
  start() {
    this.server.listen(this.port, () => {
      console.log(`채팅 서버가 포트 ${this.port}에서 실행중입니다.`);
      console.log(`헬스체크: http://localhost:${this.port}/health`);
    });
  }

  // 서버 종료
  stop() {
    if (this.messageCleanupInterval) {
      clearInterval(this.messageCleanupInterval);
    }
    
    this.server.close(() => {
      console.log('채팅 서버 종료');
    });
  }
}

// 서버 실행
if (require.main === module) {
  const chatServer = new ChatServer(3001);
  chatServer.start();

  // 안전한 종료 처리
  process.on('SIGINT', () => {
    console.log('\n서버 종료 중...');
    chatServer.stop();
    process.exit(0);
  });
}

module.exports = ChatServer;