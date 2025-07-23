// 랜덤 영어 닉네임 생성 시스템
class NicknameGenerator {
  constructor() {
    // 영어 형용사 목록
    this.adjectives = [
      'Quick', 'Brave', 'Swift', 'Bright', 'Cool', 'Smart', 'Happy', 'Lucky',
      'Wild', 'Free', 'Bold', 'Sharp', 'Sweet', 'Pure', 'Wise', 'Kind',
      'Fast', 'Strong', 'Gentle', 'Noble', 'Calm', 'Fierce', 'Silent', 'Golden',
      'Silver', 'Dark', 'Light', 'Mystic', 'Epic', 'Royal', 'Magic', 'Cosmic',
      'Fire', 'Ice', 'Storm', 'Ocean', 'Sky', 'Moon', 'Star', 'Sun',
      'Red', 'Blue', 'Green', 'Purple', 'Pink', 'Orange', 'Yellow', 'Black'
    ];

    // 영어 명사 목록 (동물, 자연, 객체 등)
    this.nouns = [
      'Wolf', 'Lion', 'Tiger', 'Eagle', 'Hawk', 'Fox', 'Bear', 'Cat',
      'Dog', 'Rabbit', 'Deer', 'Horse', 'Dragon', 'Phoenix', 'Falcon', 'Panther',
      'Thunder', 'Lightning', 'Storm', 'Wind', 'Rain', 'Snow', 'Fire', 'Ice',
      'Mountain', 'Ocean', 'River', 'Forest', 'Desert', 'Valley', 'Hill', 'Lake',
      'Star', 'Moon', 'Sun', 'Comet', 'Galaxy', 'Planet', 'Meteor', 'Aurora',
      'Knight', 'Warrior', 'Hunter', 'Guardian', 'Shadow', 'Ghost', 'Spirit', 'Angel',
      'Arrow', 'Blade', 'Shield', 'Crown', 'Ring', 'Stone', 'Crystal', 'Diamond',
      'Rose', 'Lily', 'Oak', 'Pine', 'Maple', 'Willow', 'Cedar', 'Ivy'
    ];

    // 숫자 범위 (10~999)
    this.numberRange = { min: 10, max: 999 };
  }

  // 랜덤 요소 선택
  getRandomElement(array) {
    return array[Math.floor(Math.random() * array.length)];
  }

  // 랜덤 숫자 생성
  getRandomNumber() {
    return Math.floor(Math.random() * (this.numberRange.max - this.numberRange.min + 1)) + this.numberRange.min;
  }

  // 기본 닉네임 생성 (형용사 + 명사 + 숫자)
  generateBasicNickname() {
    const adjective = this.getRandomElement(this.adjectives);
    const noun = this.getRandomElement(this.nouns);
    const number = this.getRandomNumber();
    
    return `${adjective}${noun}${number}`;
  }

  // 짧은 닉네임 생성 (명사 + 숫자)
  generateShortNickname() {
    const noun = this.getRandomElement(this.nouns);
    const number = this.getRandomNumber();
    
    return `${noun}${number}`;
  }

  // 긴 닉네임 생성 (형용사 + 형용사 + 명사)
  generateLongNickname() {
    const adjective1 = this.getRandomElement(this.adjectives);
    const adjective2 = this.getRandomElement(this.adjectives.filter(adj => adj !== adjective1));
    const noun = this.getRandomElement(this.nouns);
    
    return `${adjective1}${adjective2}${noun}`;
  }

  // 메인 닉네임 생성 함수 (랜덤 형식 선택)
  generate() {
    const formats = ['basic', 'short', 'long'];
    const selectedFormat = this.getRandomElement(formats);

    switch (selectedFormat) {
      case 'basic':
        return this.generateBasicNickname();
      case 'short':
        return this.generateShortNickname();
      case 'long':
        return this.generateLongNickname();
      default:
        return this.generateBasicNickname();
    }
  }

  // 중복 체크와 함께 닉네임 생성 (DB 조회 필요)
  async generateUnique(checkDuplicateFunction) {
    let nickname;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      nickname = this.generate();
      attempts++;
      
      if (attempts >= maxAttempts) {
        // 최대 시도 횟수 도달 시 타임스탬프 추가
        nickname = this.generate() + Date.now().toString().slice(-4);
        break;
      }
    } while (await checkDuplicateFunction(nickname));

    return nickname;
  }

  // 여러 개 닉네임 생성 (선택권 제공)
  generateMultiple(count = 3) {
    const nicknames = [];
    const attempts = new Set();

    while (nicknames.length < count && attempts.size < count * 3) {
      const nickname = this.generate();
      if (!attempts.has(nickname)) {
        nicknames.push(nickname);
        attempts.add(nickname);
      }
    }

    return nicknames;
  }
}

// 사용 예시 및 유틸리티 함수들
export const nicknameGenerator = new NicknameGenerator();

// 닉네임 유효성 검사
export const validateNickname = (nickname) => {
  const rules = {
    minLength: 3,
    maxLength: 20,
    allowedCharacters: /^[a-zA-Z0-9]+$/,
    prohibitedWords: ['admin', 'operator', 'system', 'root', 'moderator', 'bot', 'support']
  };

  if (!nickname || nickname.length < rules.minLength) {
    return { valid: false, reason: 'Nickname is too short.' };
  }

  if (nickname.length > rules.maxLength) {
    return { valid: false, reason: 'Nickname is too long.' };
  }

  if (!rules.allowedCharacters.test(nickname)) {
    return { valid: false, reason: 'Only English letters and numbers are allowed.' };
  }

  const hasProhibitedWord = rules.prohibitedWords.some(word => 
    nickname.toLowerCase().includes(word.toLowerCase())
  );

  if (hasProhibitedWord) {
    return { valid: false, reason: 'This nickname contains prohibited words.' };
  }

  return { valid: true };
};

// 기본 내보내기
export default NicknameGenerator;