// 사용자 데이터 관리 서비스
import { nicknameGenerator } from './nickname-generator.js';

class UserService {
  constructor(database) {
    this.db = database; // MongoDB, PostgreSQL 등의 DB 연결
  }

  // 사용자 등록/업데이트 (OAuth 인증 후 호출)
  async createOrUpdateUser(authData) {
    try {
      const { user, provider } = authData;
      
      // 기존 사용자 확인
      let existingUser = await this.findUserByAuthId(user.uid);
      
      if (existingUser) {
        // 기존 사용자 - 로그인 정보만 업데이트
        return await this.updateUserLogin(existingUser.id);
      }

      // 신규 사용자 - 닉네임 생성 및 등록
      const nickname = await this.generateUniqueNickname();
      
      const newUser = {
        authId: user.uid,
        email: user.email,
        provider: provider,
        nickname: nickname,
        likeCount: 0,
        isBlueVerified: false,
        isBanned: false,
        banEndDate: null,
        banReason: null,
        reportCount: 0,
        joinedAt: new Date(),
        lastLoginAt: new Date(),
        // 민감 정보는 저장하지 않음 (실제 이름, 프로필 사진 등)
      };

      const savedUser = await this.saveUser(newUser);
      
      return {
        success: true,
        user: this.sanitizeUserData(savedUser),
        isNewUser: true
      };
      
    } catch (error) {
      console.error('사용자 생성/업데이트 오류:', error);
      return {
        success: false,
        error: '사용자 정보 처리 중 오류가 발생했습니다.'
      };
    }
  }

  // 고유한 닉네임 생성
  async generateUniqueNickname() {
    const checkDuplicate = async (nickname) => {
      const existing = await this.findUserByNickname(nickname);
      return existing !== null;
    };

    return await nicknameGenerator.generateUnique(checkDuplicate);
  }

  // 사용자 데이터 저장 (DB별 구현 필요)
  async saveUser(userData) {
    // MongoDB 예시
    // return await this.db.collection('users').insertOne(userData);
    
    // PostgreSQL/Prisma 예시
    // return await this.db.user.create({ data: userData });
    
    // 임시 구현 (실제 DB 연결 필요)
    console.log('사용자 저장:', userData);
    return { id: 'temp_id_' + Date.now(), ...userData };
  }

  // AuthID로 사용자 찾기
  async findUserByAuthId(authId) {
    // 실제 DB 쿼리 구현 필요
    // return await this.db.collection('users').findOne({ authId });
    console.log('AuthID로 사용자 검색:', authId);
    return null; // 임시 반환
  }

  // 닉네임으로 사용자 찾기
  async findUserByNickname(nickname) {
    // 실제 DB 쿼리 구현 필요
    // return await this.db.collection('users').findOne({ nickname });
    console.log('닉네임으로 사용자 검색:', nickname);
    return null; // 임시 반환
  }

  // 로그인 정보 업데이트
  async updateUserLogin(userId) {
    try {
      const updatedUser = await this.updateUser(userId, {
        lastLoginAt: new Date()
      });

      return {
        success: true,
        user: this.sanitizeUserData(updatedUser),
        isNewUser: false
      };
    } catch (error) {
      throw new Error('로그인 정보 업데이트 실패: ' + error.message);
    }
  }

  // 사용자 정보 업데이트
  async updateUser(userId, updateData) {
    // 실제 DB 업데이트 구현 필요
    console.log('사용자 업데이트:', userId, updateData);
    return { id: userId, ...updateData };
  }

  // 클라이언트에 전송할 사용자 데이터 정제
  sanitizeUserData(user) {
    return {
      id: user.id,
      nickname: user.nickname,
      likeCount: user.likeCount,
      isBlueVerified: user.isBlueVerified,
      isBanned: user.isBanned,
      banEndDate: user.banEndDate,
      joinedAt: user.joinedAt,
      // 민감 정보는 제외 (email, authId, reportCount 등)
    };
  }

  // 사용자 정지 처리
  async banUser(userId, reason = '신고 누적', days = 7) {
    try {
      const banEndDate = new Date();
      banEndDate.setDate(banEndDate.getDate() + days);

      await this.updateUser(userId, {
        isBanned: true,
        banEndDate: banEndDate,
        banReason: reason
      });

      return {
        success: true,
        message: `사용자가 ${days}일간 정지되었습니다.`,
        banEndDate: banEndDate
      };
    } catch (error) {
      return {
        success: false,
        error: '사용자 정지 처리 실패: ' + error.message
      };
    }
  }

  // 정지 해제 확인
  async checkBanStatus(userId) {
    try {
      const user = await this.findUserById(userId);
      
      if (!user.isBanned) {
        return { isBanned: false };
      }

      const now = new Date();
      const banEndDate = new Date(user.banEndDate);

      if (now >= banEndDate) {
        // 정지 기간 만료 - 자동 해제
        await this.updateUser(userId, {
          isBanned: false,
          banEndDate: null,
          banReason: null
        });

        return { 
          isBanned: false,
          wasUnbanned: true,
          message: '정지가 해제되었습니다.'
        };
      }

      return {
        isBanned: true,
        banEndDate: user.banEndDate,
        banReason: user.banReason,
        remainingDays: Math.ceil((banEndDate - now) / (1000 * 60 * 60 * 24))
      };
    } catch (error) {
      return {
        error: '정지 상태 확인 실패: ' + error.message
      };
    }
  }

  // 사용자 ID로 찾기
  async findUserById(userId) {
    // 실제 DB 쿼리 구현 필요
    console.log('사용자 ID로 검색:', userId);
    return null; // 임시 반환
  }

  // 블루체크 구매 처리
  async purchaseBlueCheck(userId, paymentData) {
    try {
      // 결제 검증 로직 필요 (Stripe 등)
      const isPaymentValid = await this.verifyPayment(paymentData);
      
      if (!isPaymentValid) {
        return {
          success: false,
          error: '결제 검증 실패'
        };
      }

      const updatedUser = await this.updateUser(userId, {
        isBlueVerified: true,
        blueCheckPurchasedAt: new Date()
      });

      return {
        success: true,
        message: '블루체크가 활성화되었습니다!',
        user: this.sanitizeUserData(updatedUser)
      };
    } catch (error) {
      return {
        success: false,
        error: '블루체크 구매 처리 실패: ' + error.message
      };
    }
  }

  // 결제 검증 (Stripe 등)
  async verifyPayment(paymentData) {
    // 실제 결제 검증 로직 구현 필요
    console.log('결제 검증:', paymentData);
    return true; // 임시 반환
  }
}

// 사용 예시
export default UserService;

// 유틸리티 함수들
export const userUtils = {
  // 닉네임 효과 계산
  getNicknameEffect: (likeCount) => {
    if (likeCount >= 1000) return { effect: '✨👑', level: 'legendary' };
    if (likeCount >= 500) return { effect: '✨⭐', level: 'epic' };
    if (likeCount >= 300) return { effect: '✨', level: 'rare' };
    if (likeCount >= 100) return { effect: '⭐', level: 'common' };
    return { effect: '', level: 'normal' };
  },

  // 사용자 권한 체크
  canSendDM: (user1, user2) => {
    return user1.isBlueVerified && 
           user2.isBlueVerified && 
           user1.likedUsers?.includes(user2.id) && 
           user2.likedUsers?.includes(user1.id);
  },

  // 사용자 활동 상태 확인
  getUserStatus: (user) => {
    if (user.isBanned) return 'banned';
    if (user.isBlueVerified) return 'verified';
    return 'normal';
  }
};