/* eslint-disable react/no-unescaped-entities */
import { useState, useEffect } from 'react'

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [nickname, setNickname] = useState('');
  const [color, setColor] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const version = "v1.0.3";

  useEffect(() => {
    const colors = ['#FF69B4', '#1E90FF', '#FFD700', '#00FA9A', '#BA55D3', '#FF4500'];
    setColor(colors[Math.floor(Math.random() * colors.length)]);
  }, []);

  useEffect(() => {
    const chatWindow = document.querySelector('.chat-window');
    if (chatWindow) {
      chatWindow.scrollTop = chatWindow.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (isAuthenticated && messages.length === 0) {
      setMessages([
        {
          id: Date.now(),
          nickname: "ibuddy",
          text: "어서오세요! 랜덤 채팅을 즐겨보세요 😊",
          color: "#58a6ff"
        }
      ]);
    }
  }, [isAuthenticated]);

  const handleSend = () => {
    if (input.trim() === '' || nickname.trim() === '') return;
    const newMessage = {
      id: Date.now(),
      nickname,
      text: input,
      color
    };
    setMessages([...messages, newMessage]);
    setInput('');
  };

  return (
    <>
      {isAuthenticated ? (
        <div
          className="main-layout"
          style={{ display: 'flex', flexDirection: 'column', maxWidth: '100%', padding: '1rem', boxSizing: 'border-box' }}
        >
          <div
            className="chat-section"
            style={{ flex: 1, overflowY: 'auto', marginBottom: '1rem' }}
          >
            <header className="app-header">
              <h1>ibuddy chat chat</h1>
              <p style={{ fontSize: '0.9rem', color: '#888' }}>
                랜덤한 모르는 사람과 채팅을 즐기실 수 있습니다. 아래 입력창에 메시지를 입력해주세요.
              </p>
            </header>

            <main className="chat-window">
              {messages.length === 0 ? (
                <p style={{ color: "#ffffff", textAlign: "center" }}>채팅을 시작해보세요!</p>
              ) : (
                messages.map(msg => (
                  <div key={msg.id} className="chat-bubble">
                    <div className="message-content">
                      <strong style={{ color: msg.color, marginRight: '0.5rem' }}>{msg.nickname}</strong>
                      <span className="timestamp">
                        {new Date(msg.id).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <div>{msg.text}</div>
                    </div>
                  </div>
                ))
              )}
            </main>

            <div className="chat-controls">
              <input
                type="text"
                className="nickname-input"
                placeholder="Nickname"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
              />
              <input
                type="text"
                className="message-input"
                placeholder="Type a message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
              <button className="send-button" onClick={handleSend}>Send</button>
            </div>
          </div>

          <div
            className="side-section"
            style={{ width: '100%', maxWidth: '400px', margin: '0 auto' }}
          >
            <div className="auth-box">
              <input type="text" placeholder="아이디" className="auth-input" />
              <input type="password" placeholder="비밀번호" className="auth-input" />
              <button className="auth-login">로그인</button>
              <div
                className="auth-options"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.4rem',
                  marginBottom: '0.5rem'
                }}
              >
                <label>
                  <input type="checkbox" /> 자동 로그인
                </label>
                <strong className="signup-link">회원가입</strong>
              </div>
              <div className="auth-links">
                <a href="#">계정 찾기</a> | <a href="#">메일 재발송</a>
              </div>
            </div>

            <footer className="chat-footer">
              <div
                className="footer-meta"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  fontSize: '0.75rem',
                  color: '#d1d5da',
                  marginTop: '0.5rem'
                }}
              >
                <small style={{ display: 'block' }}>
                  © 2025 Concrete Lab — All rights reserved. {version}
                </small>
                <small style={{ display: 'block', marginTop: '0.25rem' }}>
                  현재 접속자: {messages.length}명
                </small>
              </div>
            </footer>
          </div>
        </div>
      ) : (
        <div
          className="auth-gate"
          style={{ padding: '1rem', textAlign: 'center' }}
        >
          <h1>ibuddy 시작하기</h1>
          <div className="auth-buttons">
            <button>로그인</button>
            <button>회원가입</button>
          </div>
          <button onClick={() => setIsAuthenticated(true)} className="guest-button">
            게스트로 시작
          </button>
        </div>
      )}
    </>
  )
}

export default App;