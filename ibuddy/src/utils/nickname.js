// Integrated nickname generation system (Korean + English support)
class NicknameGenerator {
  constructor() {
    // Korean adjectives list
    this.koreanAdjectives = [
      '신비한', '즐거운', '용감한', '귀여운', '멋진', '빠른', '느린', '조용한', 
      '시끄러운', '작은', '큰', '똑똑한', '재미있는', '착한', '친절한', '활발한',
      '차분한', '밝은', '어두운', '따뜻한', '차가운', '달콤한', '매운', '신선한',
      '오래된', '새로운', '강한', '약한', '높은', '낮은', '깊은', '얕은'
    ];

    // Korean nouns list
    this.koreanNouns = [
      '호랑이', '사자', '고양이', '강아지', '토끼', '곰', '여우', '늑대',
      '독수리', '참새', '비둘기', '까마귀', '펭귄', '돌고래', '고래', '상어',
      '나비', '벌', '개미', '거미', '드래곤', '유니콘', '피닉스', '그리핀',
      '별', '달', '태양', '구름', '바람', '비', '눈', '번개',
      '꽃', '나무', '잎', '열매', '보석', '다이아몬드', '루비', '사파이어'
    ];

    // English adjectives list
    this.englishAdjectives = [
      'Quick', 'Brave', 'Swift', 'Bright', 'Cool', 'Smart', 'Happy', 'Lucky',
      'Wild', 'Free', 'Bold', 'Sharp', 'Sweet', 'Pure', 'Wise', 'Kind',
      'Fast', 'Strong', 'Gentle', 'Noble', 'Calm', 'Fierce', 'Silent', 'Golden',
      'Silver', 'Dark', 'Light', 'Mystic', 'Epic', 'Royal', 'Magic', 'Cosmic',
      'Fire', 'Ice', 'Storm', 'Ocean', 'Sky', 'Moon', 'Star', 'Sun'
    ];

    // English nouns list
    this.englishNouns = [
      'Wolf', 'Lion', 'Tiger', 'Eagle', 'Hawk', 'Fox', 'Bear', 'Cat',
      'Dog', 'Rabbit', 'Deer', 'Horse', 'Dragon', 'Phoenix', 'Falcon', 'Panther',
      'Thunder', 'Lightning', 'Storm', 'Wind', 'Rain', 'Snow', 'Fire', 'Ice',
      'Mountain', 'Ocean', 'River', 'Forest', 'Desert', 'Valley', 'Hill', 'Lake',
      'Star', 'Moon', 'Sun', 'Comet', 'Galaxy', 'Planet', 'Meteor', 'Aurora',
      'Knight', 'Warrior', 'Hunter', 'Guardian', 'Shadow', 'Ghost', 'Spirit', 'Angel'
    ];

    this.numberRange = { min: 10, max: 999 };
  }

  // Select random element
  getRandomElement(array) {
    return array[Math.floor(Math.random() * array.length)];
  }

  // Generate random number
  getRandomNumber() {
    return Math.floor(Math.random() * (this.numberRange.max - this.numberRange.min + 1)) + this.numberRange.min;
  }

  // Generate Korean nickname
  generateKorean() {
    const adjective = this.getRandomElement(this.koreanAdjectives);
    const noun = this.getRandomElement(this.koreanNouns);
    const number = this.getRandomNumber();
    
    return `${adjective}${noun}${number}`;
  }

  // Generate English nickname
  generateEnglish() {
    const adjective = this.getRandomElement(this.englishAdjectives);
    const noun = this.getRandomElement(this.englishNouns);
    const number = this.getRandomNumber();
    
    return `${adjective}${noun}${number}`;
  }

  // Main nickname generation function (random language selection)
  generate(language = 'random') {
    if (language === 'korean') return this.generateKorean();
    if (language === 'english') return this.generateEnglish();
    
    // Randomly select language
    return Math.random() < 0.5 ? this.generateKorean() : this.generateEnglish();
  }

  // Generate nickname with duplicate check
  async generateUnique(checkDuplicateFunction, language = 'random') {
    let nickname;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      nickname = this.generate(language);
      attempts++;
      
      if (attempts >= maxAttempts) {
        nickname = this.generate(language) + Date.now().toString().slice(-4);
        break;
      }
    } while (await checkDuplicateFunction(nickname));

    return nickname;
  }

  // Nickname validation
  validate(nickname) {
    const rules = {
      minLength: 3,
      maxLength: 20,
      allowedCharacters: /^[a-zA-Z0-9가-힣]+$/,
      prohibitedWords: ['admin', 'operator', 'system', 'root', 'moderator', 'bot', 'support', '관리자', '운영자']
    };

    if (!nickname || nickname.length < rules.minLength) {
      return { valid: false, reason: 'Nickname is too short.' };
    }

    if (nickname.length > rules.maxLength) {
      return { valid: false, reason: 'Nickname is too long.' };
    }

    if (!rules.allowedCharacters.test(nickname)) {
      return { valid: false, reason: 'Only Korean, English letters and numbers are allowed.' };
    }

    const hasProhibitedWord = rules.prohibitedWords.some(word => 
      nickname.toLowerCase().includes(word.toLowerCase())
    );

    if (hasProhibitedWord) {
      return { valid: false, reason: 'This nickname contains prohibited words.' };
    }

    return { valid: true };
  }
}

// Create instance
const nicknameGenerator = new NicknameGenerator();

// Legacy function for compatibility
export const generateRandomNickname = (language = 'random') => {
  return nicknameGenerator.generate(language);
};

// Nickname effects (based on like count)
export const getNicknameEffect = (likeCount) => {
  if (likeCount >= 1000) return { effect: '✨👑✨', color: '#FFD700' }; // Gold crown
  if (likeCount >= 500) return { effect: '⭐', color: '#FF69B4' }; // Pink star
  if (likeCount >= 300) return { effect: '💎', color: '#00CED1' }; // Diamond
  if (likeCount >= 100) return { effect: '🔥', color: '#FF4500' }; // Fire
  return { effect: '', color: '' };
};

// Nickname validation
export const validateNickname = (nickname) => {
  return nicknameGenerator.validate(nickname);
};

// Generate unique nickname
export const generateUniqueNickname = async (checkDuplicateFunction, language = 'random') => {
  return await nicknameGenerator.generateUnique(checkDuplicateFunction, language);
};

export default nicknameGenerator;