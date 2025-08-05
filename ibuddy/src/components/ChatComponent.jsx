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
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [showWarnings, setShowWarnings] = useState(true);
  const [checkedWarnings, setCheckedWarnings] = useState([false, false, false]);
  const chatWindowRef = useRef(null);
  const inputRef = useRef(null);

  // Safety warning messages
  const warningMessages = [
    {
      title: "Impersonation Warning",
      text: "Anyone claiming to be an administrator or cyber investigation officer is an imposter."
    },
    {
      title: "Scam Warning",
      text: "Anyone sharing Telegram / WhatsApp / LINE / WeChat / Kakao without conversation is a scammer."
    },
    {
      title: "Scam Warning", 
      text: "All adult web site promotions are scams."
    }
  ];

  // Check if all warnings are checked
  const allWarningsChecked = checkedWarnings.every(checked => checked);

  // Handle checkbox change
  const handleCheckboxChange = (index) => {
    const newCheckedWarnings = [...checkedWarnings];
    newCheckedWarnings[index] = !newCheckedWarnings[index];
    setCheckedWarnings(newCheckedWarnings);
  };

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
        setError('Unable to get location information. Please allow location permission.');
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
      
      // Auto-scroll to bottom when new messages arrive
      setTimeout(() => {
        if (chatWindowRef.current) {
          chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
        }
      }, 50);
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

  // Handle mobile keyboard focus - Enhanced for all devices
  useEffect(() => {
    const handleFocus = () => {
      // Multiple approaches for different devices
      setTimeout(() => {
        if (inputRef.current) {
          // Method 1: ScrollIntoView with end alignment
          inputRef.current.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'end',
            inline: 'nearest'
          });
        }
      }, 100);
      
      // Method 2: Additional scroll for Android and other devices
      setTimeout(() => {
        if (inputRef.current) {
          const rect = inputRef.current.getBoundingClientRect();
          const viewportHeight = window.visualViewport?.height || window.innerHeight;
          const inputBottom = rect.bottom;
          
          if (inputBottom > viewportHeight - 50) {
            window.scrollBy({
              top: inputBottom - viewportHeight + 100,
              behavior: 'smooth'
            });
          }
        }
      }, 300);
    };

    const handleResize = () => {
      // Handle viewport changes (keyboard open/close)
      setTimeout(() => {
        if (document.activeElement === inputRef.current) {
          handleFocus();
        }
      }, 100);
    };

    if (inputRef.current) {
      inputRef.current.addEventListener('focus', handleFocus);
    }
    
    // Listen for viewport changes
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
    } else {
      window.addEventListener('resize', handleResize);
    }

    return () => {
      if (inputRef.current) {
        inputRef.current.removeEventListener('focus', handleFocus);
      }
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize);
      } else {
        window.removeEventListener('resize', handleResize);
      }
    };
  }, []);

  // Simulate online users count (you can replace this with real Firebase presence)
  useEffect(() => {
    // Simulate random online users between 5-50
    const updateOnlineUsers = () => {
      setOnlineUsers(Math.floor(Math.random() * 46) + 5);
    };

    updateOnlineUsers(); // Initial count
    const interval = setInterval(updateOnlineUsers, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const handleSend = async () => {
    if (input.trim() === '') return;

    const { filteredMessage, hasViolation } = filterMessage(input);
    
    // Add local message in guest mode or Firebase error
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
      
      // Auto-scroll to bottom after adding local message
      setTimeout(() => {
        if (chatWindowRef.current) {
          chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
        }
      }, 50);
      return;
    }

    // Firebase mode
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
      setError('Failed to send message.');
    }
  };

  const handleLike = async (messageId) => {
    // TODO: Implement like functionality with user tracking to prevent multiple likes
    console.log('Like message:', messageId);
  };

  const handleReport = async (messageId, reportedUserId) => {
    try {
      await reportUser(reportedUserId, user.uid, 'inappropriate_content', messageId);
      alert('Report has been submitted.');
    } catch (error) {
      console.error('Report error:', error);
      alert('Failed to submit report.');
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem', color: 'white' }}>
        <p>Checking location...</p>
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
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="chat-layout" style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100dvh', // Dynamic viewport height for mobile
      width: '100%',
      backgroundColor: '#0d1117',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0
    }}>
      {/* Header - Fixed */}
      <div className="chat-header" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0.5rem 1rem',
        backgroundColor: '#161b22',
        borderBottom: '1px solid #21262d',
        flexShrink: 0,
        minHeight: '50px',
        zIndex: 1000
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <h2 style={{ margin: 0, color: 'white', fontSize: '1.2rem' }}>
            {user.nickname}
            {user.isBlueCheck && (
              <img src={blueCheckMarkIcon} alt="Blue Check" style={{ width: '18px', height: '18px', marginLeft: '8px' }} />
            )}
          </h2>
          <div style={{
            backgroundColor: '#58a6ff',
            color: 'white',
            padding: '0.3rem 0.8rem',
            borderRadius: '12px',
            fontSize: '0.8rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}>
            <span style={{ 
              width: '6px', 
              height: '6px', 
              backgroundColor: '#00ff00', 
              borderRadius: '50%',
              animation: 'pulse 2s infinite'
            }}></span>
            {onlineUsers} online
          </div>
        </div>
        
        <button 
          onClick={onLogout}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#ff4444',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.9rem'
          }}
        >
          Logout
        </button>
      </div>

      {/* Chat Messages Area - Flex Grow with Scroll */}
      <div 
        ref={chatWindowRef}
        className="chat-messages" 
        style={{ 
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '1rem',
          backgroundColor: '#0d1117',
          WebkitOverflowScrolling: 'touch',
          minHeight: 0,
          paddingBottom: '1rem'
        }}
      >
        
        {messages.length === 0 ? (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100%',
            color: '#8b949e',
            fontSize: '1.1rem'
          }}>
            Start chatting with users within 1km around you!
          </div>
        ) : (
          messages.map(msg => {
            const nicknameEffect = getNicknameEffect(msg.likeCount || 0);
            return (
              <div key={msg.id} style={{ 
                marginBottom: '1.5rem',
                padding: '1rem',
                backgroundColor: '#161b22',
                borderRadius: '8px',
                border: '1px solid #21262d'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <strong style={{ color: msg.color || '#58a6ff', fontSize: '0.95rem' }}>
                      {nicknameEffect.effect}{msg.nickname}{nicknameEffect.effect}
                    </strong>
                    {msg.isBlueCheck && (
                      <img src={blueCheckMarkIcon} alt="Blue Check" style={{ width: '16px', height: '16px' }} />
                    )}
                  </div>
                  <span style={{ fontSize: '0.8rem', color: '#8b949e' }}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div style={{ color: '#f0f6fc', marginBottom: '0.8rem', lineHeight: '1.5' }}>
                  {msg.text}
                </div>
                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem' }}>
                  <button 
                    onClick={() => handleLike(msg.id, msg.likeCount || 0)}
                    style={{ 
                      background: 'none', 
                      border: 'none', 
                      color: '#58a6ff', 
                      cursor: 'pointer',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '4px',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseOver={(e) => e.target.style.backgroundColor = '#21262d'}
                    onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                  >
                    👍 {msg.likeCount || 0}
                  </button>
                  {msg.userId !== user.uid && (
                    <button 
                      onClick={() => handleReport(msg.id, msg.userId)}
                      style={{ 
                        background: 'none', 
                        border: 'none', 
                        color: '#ff7b72', 
                        cursor: 'pointer',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseOver={(e) => e.target.style.backgroundColor = '#21262d'}
                      onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                    >
                      Report
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input Area - Fixed */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center',
        backgroundColor: showWarnings ? '#2f2f2f' : '#2f2f2f',
        borderRadius: '20px',
        border: 'none',
        padding: '0.2rem 0.8rem',
        minHeight: '44px',
        margin: '0.5rem 0.75rem',
        position: 'sticky',
        bottom: 'max(0.5rem, env(keyboard-inset-height, 0px))',
        zIndex: 1000,
        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(255, 255, 255, 0.03)',
        backgroundClip: 'padding-box',
        WebkitBackgroundClip: 'padding-box',
        transform: 'translateZ(0)',
        willChange: 'transform'
      }}>
        <input
          ref={inputRef}
          type="text"
          placeholder={showWarnings ? "Please acknowledge safety warnings first..." : "Message ChitChat"}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              if (!showWarnings) handleSend();
            }
          }}
          disabled={showWarnings}
          style={{ 
            flex: 1,
            padding: '0.3rem 0.4rem',
            backgroundColor: 'transparent',
            color: showWarnings ? '#8b949e' : '#ececf1',
            border: 'none',
            borderRadius: '0',
            fontSize: '16px',
            outline: 'none',
            cursor: showWarnings ? 'not-allowed' : 'text',
            resize: 'none',
            fontFamily: 'inherit'
          }}
        />
        <button
          onClick={handleSend}
          disabled={showWarnings || !input.trim()}
          style={{
            padding: '0.3rem',
            backgroundColor: (showWarnings || !input.trim()) ? '#565869' : '#19c37d',
            color: 'white',
            border: 'none',
            borderRadius: '16px',
            cursor: (showWarnings || !input.trim()) ? 'not-allowed' : 'pointer',
            fontSize: '0.9rem',
            fontWeight: '600',
            transition: 'all 0.2s ease',
            minWidth: '28px',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginLeft: '0.4rem'
          }}
          onMouseOver={(e) => {
            if (!showWarnings && input.trim()) e.target.style.backgroundColor = '#0fa968';
          }}
          onMouseOut={(e) => {
            if (!showWarnings && input.trim()) e.target.style.backgroundColor = '#19c37d';
          }}
        >
          ↑
        </button>
      </div>

      {/* Safety Warning Modal */}
      {showWarnings && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: 'black',
            borderRadius: '12px',
            padding: '1.5rem',
            maxWidth: '400px',
            width: '100%',
            maxHeight: '70vh',
            overflowY: 'auto',
            border: '2px solid #ffffff',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
            fontFamily: 'Poppins, sans-serif'
          }}>
            <div style={{
              textAlign: 'center',
              marginBottom: '1rem'
            }}>
              <h2 style={{
                color: '#ffffff',
                fontSize: '1.2rem',
                fontWeight: 'bold',
                margin: 0,
                marginBottom: '0.5rem',
                fontFamily: 'Poppins, sans-serif'
              }}>
                DISCLOSURE
              </h2>
              <p style={{
                color: '#cccccc',
                fontSize: '0.9rem',
                margin: 0,
                fontFamily: 'Poppins, sans-serif'
              }}>
                Please read these important safety notices before chatting
              </p>
            </div>

            {warningMessages.map((warning, index) => (
              <div 
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '1rem 0',
                  borderBottom: index < warningMessages.length - 1 ? '1px solid #333333' : 'none',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s ease'
                }}
                onClick={() => handleCheckboxChange(index)}
                onMouseOver={(e) => e.target.style.backgroundColor = '#2a2a2a'}
                onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
              >
                <div style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '4px',
                  border: checkedWarnings[index] ? 'none' : '2px solid #666666',
                  backgroundColor: checkedWarnings[index] ? '#007AFF' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '1rem',
                  transition: 'all 0.2s ease'
                }}>
                  {checkedWarnings[index] && (
                    <span style={{ color: 'white', fontSize: '12px', fontWeight: 'bold' }}>✓</span>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: '0.95rem',
                    fontWeight: '500',
                    color: '#ffffff',
                    lineHeight: '1.3',
                    fontFamily: 'Poppins, sans-serif'
                  }}>
                    {warning.title}
                  </div>
                  <div style={{
                    fontSize: '0.85rem',
                    fontWeight: 'normal',
                    lineHeight: '1.4',
                    color: '#999999',
                    marginTop: '0.3rem',
                    fontFamily: 'Poppins, sans-serif'
                  }}>
                    {warning.text}
                  </div>
                </div>
                <div style={{
                  fontSize: '0.8rem',
                  color: '#FF3B30',
                  fontWeight: '600',
                  marginLeft: '0.5rem',
                  fontFamily: 'Poppins, sans-serif'
                }}>
                  (Required)
                </div>
              </div>
            ))}

            <div style={{
              textAlign: 'center',
              marginTop: '1.5rem'
            }}>
              <button
                onClick={() => allWarningsChecked && setShowWarnings(false)}
                disabled={!allWarningsChecked}
                style={{
                  backgroundColor: allWarningsChecked ? '#007AFF' : '#333333',
                  color: 'white',
                  border: 'none',
                  padding: '1rem 2rem',
                  borderRadius: '12px',
                  cursor: allWarningsChecked ? 'pointer' : 'not-allowed',
                  fontSize: '1rem',
                  fontWeight: '600',
                  transition: 'all 0.2s',
                  width: '100%',
                  opacity: allWarningsChecked ? 1 : 0.5,
                  fontFamily: 'Poppins, sans-serif'
                }}
                onMouseOver={(e) => {
                  if (allWarningsChecked) {
                    e.target.style.backgroundColor = '#0056CC';
                  }
                }}
                onMouseOut={(e) => {
                  if (allWarningsChecked) {
                    e.target.style.backgroundColor = '#007AFF';
                  }
                }}
              >
                {allWarningsChecked ? 'Agree' : 'Please agree to all items'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatComponent;
// 🚨 Added red warning messages and auto-scroll behavior to ChatComponent