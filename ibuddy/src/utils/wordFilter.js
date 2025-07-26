// Word filtering system for chat moderation
const bannedWords = [
  // Add banned words here - keeping it minimal for demo
  'badword1', 'badword2', 'inappropriate', 
  // You should expand this list based on your moderation needs
];

const suspiciousPatterns = [
  /\b\d{3}-\d{4}-\d{4}\b/, // Phone numbers
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email addresses
  /\bhttps?:\/\/[^\s]+/gi, // URLs
];

export const filterMessage = (message) => {
  let filteredMessage = message;
  let hasViolation = false;
  
  // Check for banned words
  bannedWords.forEach(word => {
    const regex = new RegExp(word, 'gi');
    if (regex.test(filteredMessage)) {
      filteredMessage = filteredMessage.replace(regex, '*'.repeat(word.length));
      hasViolation = true;
    }
  });
  
  // Check for suspicious patterns
  suspiciousPatterns.forEach(pattern => {
    if (pattern.test(filteredMessage)) {
      filteredMessage = filteredMessage.replace(pattern, '[Censored]');
      hasViolation = true;
    }
  });
  
  return {
    filteredMessage,
    hasViolation
  };
};

export const reportUser = async (reportedUserId, reporterUserId, reason, messageId) => {
  // This would typically save to Firebase
  const report = {
    reportedUserId,
    reporterUserId,
    reason,
    messageId,
    timestamp: new Date(),
    status: 'pending'
  };
  
  console.log('Report submitted:', report);
  // TODO: Implement Firebase storage for reports
  return report;
};