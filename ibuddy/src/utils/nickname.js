// Random nickname generator for complete anonymity
const adjectives = [
  '신비한', '즐거운', '용감한', '귀여운', '멋진', '빠른', '느린', '조용한', 
  '시끄러운', '작은', '큰', '똑똑한', '재미있는', '착한', '친절한', '활발한',
  '차분한', '밝은', '어두운', '따뜻한', '차가운', '달콤한', '매운', '신선한',
  '오래된', '새로운', '강한', '약한', '높은', '낮은', '깊은', '얕은'
];

const nouns = [
  '호랑이', '사자', '고양이', '강아지', '토끼', '곰', '여우', '늑대',
  '독수리', '참새', '비둘기', '까마귀', '펭귄', '돌고래', '고래', '상어',
  '나비', '벌', '개미', '거미', '드래곤', '유니콘', '피닉스', '그리핀',
  '별', '달', '태양', '구름', '바람', '비', '눈', '번개',
  '꽃', '나무', '잎', '열매', '보석', '다이아몬드', '루비', '사파이어'
];

export const generateRandomNickname = () => {
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const number = Math.floor(Math.random() * 999) + 1;
  
  return `${adjective}${noun}${number}`;
};

// Nickname effects based on like count
export const getNicknameEffect = (likeCount) => {
  if (likeCount >= 1000) return { effect: '✨👑✨', color: '#FFD700' }; // Gold crown
  if (likeCount >= 500) return { effect: '⭐', color: '#FF69B4' }; // Pink star
  if (likeCount >= 300) return { effect: '💎', color: '#00CED1' }; // Diamond
  if (likeCount >= 100) return { effect: '🔥', color: '#FF4500' }; // Fire
  return { effect: '', color: '' };
};