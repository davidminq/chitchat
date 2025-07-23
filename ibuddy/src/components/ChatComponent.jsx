import { useState, useEffect, useRef } from 'react';
import { collection, addDoc, query, orderBy, onSnapshot, where, serverTimestamp, deleteDoc, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { filterMessage, reportUser } from '../utils/wordFilter';
import { getCurrentPosition, getChatRoomId } from '../utils/geolocation';
import { getNicknameEffect } from '../utils/nickname';
import blueCheckMarkIcon from '../assets/icons/blue_check.svg';

const ChatComponent = ({ user, onLogout }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [location, setLocation] = useState(null);
  const [chatRoomId, setChatRoomId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const chatWindowRef = useRef(null);

  // Get user location and set up chat room
  useEffect(() => {
    const setupLocation = async () => {
      try {
        const position = await getCurrentPosition();
        setLocation(position);
        
        const roomId = getChatRoomId(position.latitude, position.longitude);
        setChatRoomId(roomId);
        
        setLoading(false);
      } catch (error) {
        console.error('Location error:', error);
        setError('위치 정보를 가져올 수 없습니다. 위치 권한을 허용해주세요.');
        setLoading(false);
      }
    };

    setupLocation();
  }, []);

  // Listen for messages in the current chat room
  useEffect(() => {
    if (!chatRoomId) return;

    const messagesQuery = query(
      collection(db, 'messages'),
      where('chatRoomId', '==', chatRoomId),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const newMessages = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        newMessages.push({
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate() || new Date()
        });
      });
      setMessages(newMessages);
      
      // Auto-scroll to bottom
      setTimeout(() => {
        if (chatWindowRef.current) {
          chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
        }
      }, 100);
    });

    return () => unsubscribe();
  }, [chatRoomId]);

  // Clean up old messages (volatile messages - auto delete after 1 hour)
  useEffect(() => {
    if (!chatRoomId) return;

    const cleanupInterval = setInterval(async () => {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const oldMessagesQuery = query(
        collection(db, 'messages'),
        where('chatRoomId', '==', chatRoomId),
        where('timestamp', '<', oneHourAgo)
      );

      try {
        const snapshot = await getDocs(oldMessagesQuery);
        const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deletePromises);
      } catch (error) {
        console.error('Cleanup error:', error);
      }
    }, 5 * 60 * 1000); // Run every 5 minutes

    return () => clearInterval(cleanupInterval);
  }, [chatRoomId]);

  const handleSend = async () => {
    if (input.trim() === '') return;

    const { filteredMessage, hasViolation } = filterMessage(input);
    
    // 게스트 모드 또는 Firebase 에러 시 로컬 메시지 추가
    if (user.uid.startsWith('guest_') || !chatRoomId) {
      const newMessage = {
        id: 'local_' + Date.now(),
        text: filteredMessage,
        nickname: user.nickname,
        userId: user.uid,
        timestamp: new Date(),
        hasViolation: hasViolation,
        likeCount: 0,
        isBlueCheck: user.isBlueCheck || false,
        color: user.color || '#58a6ff'
      };
      
      setMessages(prev => [...prev, newMessage]);
      setInput('');
      return;
    }

    // Firebase 모드
    try {
      await addDoc(collection(db, 'messages'), {
        text: filteredMessage,
        nickname: user.nickname,
        userId: user.uid,
        chatRoomId: chatRoomId,
        location: {
          latitude: location.latitude,
          longitude: location.longitude
        },
        timestamp: serverTimestamp(),
        hasViolation: hasViolation,
        likeCount: 0,
        isBlueCheck: user.isBlueCheck || false,
        color: user.color || '#58a6ff'
      });

      setInput('');
    } catch (error) {
      console.error('Send message error:', error);
      setError('메시지 전송에 실패했습니다.');
    }
  };

  const handleLike = async (messageId) => {
    // TODO: Implement like functionality with user tracking to prevent multiple likes
    console.log('Like message:', messageId);
  };

  const handleReport = async (messageId, reportedUserId) => {
    try {
      await reportUser(reportedUserId, user.uid, 'inappropriate_content', messageId);
      alert('신고가 접수되었습니다.');
    } catch (error) {
      console.error('Report error:', error);
      alert('신고 접수에 실패했습니다.');
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem', color: 'white' }}>
        <p>위치를 확인하는 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem', color: '#ff4444' }}>
        <p>{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          style={{ 
            marginTop: '1rem', 
            padding: '0.5rem 1rem', 
            backgroundColor: '#58a6ff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px' 
          }}
        >
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <div className="main-layout" style={{
      display: 'flex',
      flexDirection: 'column',
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '1rem',
      boxSizing: 'border-box',
      height: '100vh',
      alignItems: 'center'
    }}>
      {/* Header */}
      <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, color: 'white' }}>
            {user.nickname}
            {user.isBlueCheck && (
              <img src={blueCheckMarkIcon} alt="Blue Check" style={{ width: '18px', height: '18px', marginLeft: '8px' }} />
            )}
          </h2>
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#888' }}>
            반경 1km 내 익명 채팅
          </p>
        </div>
        <button 
          onClick={onLogout}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#ff4444',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          로그아웃
        </button>
      </div>

      {/* Chat Section */}
      <div className="chat-section" style={{
        flex: 1,
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#1e1e1e',
        padding: '1rem',
        borderRadius: '8px',
        minHeight: 0
      }}>
        <div 
          ref={chatWindowRef}
          className="chat-window" 
          style={{ 
            flex: 1,
            overflowY: 'auto',
            marginBottom: '1rem',
            minHeight: 0
          }}
        >
          {messages.length === 0 ? (
            <p style={{ color: "#ffffff", textAlign: "center" }}>
              주변 1km 내 사용자들과 채팅을 시작해보세요!
            </p>
          ) : (
            messages.map(msg => {
              const nicknameEffect = getNicknameEffect(msg.likeCount || 0);
              return (
                <div key={msg.id} className="chat-bubble" style={{ marginBottom: '1rem', padding: '0.5rem', backgroundColor: '#2a2a2a', borderRadius: '8px' }}>
                  <div className="message-content">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.05rem' }}>
                        <strong style={{ color: msg.color || '#58a6ff' }}>
                          {nicknameEffect.effect}{msg.nickname}{nicknameEffect.effect}
                        </strong>
                        {msg.isBlueCheck && (
                          <img src={blueCheckMarkIcon} alt="Blue Check" style={{ width: '16px', height: '16px', marginLeft: '4px' }} />
                        )}
                      </span>
                      <span className="timestamp" style={{ fontSize: '0.7rem', color: '#888' }}>
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div style={{ margin: '0.5rem 0', color: 'white' }}>{msg.text}</div>
                    <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.8rem' }}>
                      <button 
                        onClick={() => handleLike(msg.id, msg.likeCount || 0)}
                        style={{ background: 'none', border: 'none', color: '#58a6ff', cursor: 'pointer' }}
                      >
                        👍 {msg.likeCount || 0}
                      </button>
                      {msg.userId !== user.uid && (
                        <button 
                          onClick={() => handleReport(msg.id, msg.userId)}
                          style={{ background: 'none', border: 'none', color: '#ff4444', cursor: 'pointer' }}
                        >
                          신고
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Chat Input */}
        <div className="chat-controls" style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            className="message-input"
            placeholder="메시지를 입력하세요..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSend();
              }
            }}
            style={{ 
              flex: 1, 
              backgroundColor: 'white', 
              color: '#000', 
              padding: '0.5rem',
              border: 'none',
              borderRadius: '4px'
            }}
          />
          <button
            className="send-button"
            onClick={handleSend}
            style={{
              backgroundColor: '#58a6ff',
              color: 'white',
              padding: '0.5rem 1rem',
              border: 'none',
              borderRadius: '4px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            전송
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="chat-footer" style={{
        width: '100%',
        padding: '1rem 0',
        backgroundColor: 'transparent',
        textAlign: 'center'
      }}>
        <div className="footer-meta" style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.75rem',
          color: '#bbb',
          gap: '0.3rem'
        }}>
          <small style={{ display: 'block' }}>
            © 2025 Concrete Lab — All rights reserved. v1.0.3
          </small>
          <small style={{ display: 'block', marginTop: '0.25rem' }}>
            현재 접속자: 익명 사용자들
          </small>
        </div>
      </footer>
    </div>
  );
};

export default ChatComponent;