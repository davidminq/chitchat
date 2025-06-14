/* eslint-disable react/no-unescaped-entities */
import { useState, useEffect } from 'react'
import appleIcon from './assets/icons/btn_apple.svg'; /* Import Apple icon */
import googleIcon from './assets/icons/btn_google.svg'; /* Import Google icon */
import blueCheckMarkIcon from './assets/icons/blue_check.svg'; /* Corrected blue checkmark icon import */

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
          nickname: "Admin",
          text: "Welcome! Please follow netiquette as we are anonymous. Users who violate netiquette will be banned from the server.",
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
          style={{
            display: 'flex',
            flexDirection: 'column',
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '1rem',
            boxSizing: 'border-box',
            minHeight: '100vh',
            alignItems: 'center'
          }}
        >
          <div
            className="chat-section"
            style={{
              flex: 1,
              overflowY: 'auto',
              marginBottom: '1rem',
              backgroundColor: '#1e1e1e',
              padding: '1rem',
              borderRadius: '8px'
            }}
          >
            <header className="app-header">
              <h1>Hello!</h1>
              <p style={{ fontSize: '0.9rem', color: '#888' }}>
                Enjoy chatting with random people. Please type your message in the input box below.
              </p>
            </header>

            <main className="chat-window">
              {messages.length === 0 ? (
                <p style={{ color: "#ffffff", textAlign: "center" }}>채팅을 시작해보세요!</p>
              ) : (
                messages.map(msg => (
                  <div key={msg.id} className="chat-bubble">
                    <div className="message-content">
                      <span style={{ display: 'flex', alignItems: 'center', gap: '00.05rem' }}>
                        <strong style={{ color: msg.color }}>{msg.nickname}</strong>
                        {msg.nickname === "Admin" && (
                          <img src={blueCheckMarkIcon} alt="Blue Check" style={{ width: '18px', height: '18px', objectFit: 'contain' }} />
                        )}
                      </span>
                      <span className="timestamp">
                        {new Date(msg.id).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <div>{msg.text}</div>
                    </div>
                  </div>
                ))
              )}
            </main>

            <div
              className="chat-controls"
              style={{ display: 'flex' }}
            >
              <input
                type="text"
                className="nickname-input"
                placeholder="Nickname"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                style={{ flex: 3, backgroundColor: 'white', color: '#000' }}
              />
              <input
                type="text"
                className="message-input"
                placeholder="Type a message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                style={{ flex: 7, backgroundColor: 'white', color: '#000' }}
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
                  marginLeft: '0.5rem',
                  fontWeight: 'bold'
                }}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          className="auth-gate"
          style={{ padding: '1rem', textAlign: 'center' }}
        >
          <h1>ibuddy</h1>
          <div
            className="side-section"
            style={{ width: '100%', maxWidth: '400px' }}
          >
            <div className="auth-box">
              <input type="text" placeholder="아이디" className="auth-input" />
              <input type="password" placeholder="비밀번호" className="auth-input" />
              <button
                className="auth-login"
                style={{
                  backgroundColor: '#58a6ff',
                  color: 'white',
                  padding: '0.8rem 1.2rem',
                  border: 'none',
                  borderRadius: '4px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  marginBottom: '1rem'
                }}
              >
                로그인
              </button>
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
              <button onClick={() => setIsAuthenticated(true)} className="guest-button">
                게스트로 시작
              </button>
            </div>

            {/* Added Social Login Options */}
            <div className="social-login" style={{ marginTop: '2rem', textAlign: 'center' }}>
              <p style={{ marginBottom: '0.8rem', color: '#ccc' }}>또는 소셜 계정으로 로그인</p>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: '0.8rem', padding: '0 1rem' }}>
                <button style={{ backgroundColor: 'white', color: '#333', padding: '0.8rem', borderRadius: '4px', border: '1px solid #ddd', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}> {/* Added subtle border for white button, and flex styles, changed color and added bold font weight */}
                  {/* Google Icon Here */}
                  <img src={googleIcon} alt="Google" style={{ width: '24px', height: '24px', marginRight: '8px', objectFit: 'contain' }} /> {/* Added height back */}
                  Continue with Google
                </button>
                <button style={{ backgroundColor: 'white', color: '#333', padding: '0.8rem', borderRadius: '4px', border: '1px solid #ddd', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}> {/* Changed background, text color, and added border, added bold font weight */}
                  {/* Apple Icon Here */}
                  <img src={appleIcon} alt="Apple" style={{ width: '24px', height: '24px', marginRight: '8px', objectFit: 'contain' }} /> {/* Added height back */}
                  Continue with Apple
                </button>
              </div>
            </div>

            <footer className="chat-footer" style={{
              marginTop: '4rem',
              padding: '1rem 0',
              backgroundColor: 'transparent',
              textAlign: 'center'
            }}>
              <div
                className="footer-meta"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  color: '#bbb',
                  gap: '0.3rem'
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
      )}
    </>
  )
}

export default App;