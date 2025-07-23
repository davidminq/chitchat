import { useState } from 'react';
import { purchaseBlueCheck } from '../utils/userManagement';
import blueCheckMarkIcon from '../assets/icons/blue_check.svg';

const PremiumModal = ({ user, onClose, onPurchaseSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePurchase = async () => {
    if (user.isAnonymous) {
      setError('게스트 사용자는 프리미엄 기능을 구매할 수 없습니다. 소셜 로그인을 해주세요.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // In a real app, you would integrate with payment providers like:
      // - Apple In-App Purchase (for iOS)
      // - Google Play Billing (for Android)
      // - Stripe, PayPal, etc. (for web)
      
      // For demo purposes, we'll simulate a successful payment
      console.log('Processing payment...');
      
      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mark user as having Blue Check
      await purchaseBlueCheck(user.uid);
      
      onPurchaseSuccess();
      onClose();
    } catch (error) {
      console.error('Purchase error:', error);
      setError('결제 처리 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: '#1e1e1e',
        padding: '2rem',
        borderRadius: '12px',
        maxWidth: '400px',
        width: '90%',
        color: 'white',
        textAlign: 'center'
      }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <img 
            src={blueCheckMarkIcon} 
            alt="Blue Check" 
            style={{ width: '48px', height: '48px', marginBottom: '1rem' }} 
          />
          <h2 style={{ margin: '0 0 0.5rem 0', color: '#58a6ff' }}>Blue Check</h2>
          <p style={{ margin: 0, color: '#ccc', fontSize: '0.9rem' }}>
            프리미엄 기능을 잠금 해제하세요
          </p>
        </div>

        <div style={{ 
          backgroundColor: '#2a2a2a', 
          padding: '1.5rem', 
          borderRadius: '8px', 
          marginBottom: '1.5rem',
          textAlign: 'left'
        }}>
          <h3 style={{ margin: '0 0 1rem 0', color: 'white', fontSize: '1.1rem' }}>포함된 기능:</h3>
          <ul style={{ margin: 0, paddingLeft: '1.2rem', color: '#ccc' }}>
            <li style={{ marginBottom: '0.5rem' }}>닉네임 옆 블루체크 마크 ✅</li>
            <li style={{ marginBottom: '0.5rem' }}>1:1 DM 기능 사용 가능</li>
            <li style={{ marginBottom: '0.5rem' }}>프리미엄 사용자만의 특별한 권한</li>
            <li>단 한 번의 결제로 영구 사용</li>
          </ul>
        </div>

        <div style={{ 
          fontSize: '1.5rem', 
          fontWeight: 'bold', 
          color: '#58a6ff', 
          marginBottom: '1.5rem' 
        }}>
          $3.99
        </div>

        {error && (
          <div style={{ 
            color: '#ff4444', 
            marginBottom: '1rem', 
            fontSize: '0.9rem',
            backgroundColor: '#2a2a2a',
            padding: '0.8rem',
            borderRadius: '4px'
          }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              flex: 1,
              padding: '0.8rem',
              backgroundColor: '#404040',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1
            }}
          >
            취소
          </button>
          <button
            onClick={handlePurchase}
            disabled={loading}
            style={{
              flex: 1,
              padding: '0.8rem',
              backgroundColor: '#58a6ff',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              fontWeight: 'bold'
            }}
          >
            {loading ? '처리 중...' : '구매하기'}
          </button>
        </div>

        <p style={{ 
          fontSize: '0.7rem', 
          color: '#888', 
          marginTop: '1rem', 
          marginBottom: 0 
        }}>
          데모 버전에서는 실제 결제가 이루어지지 않습니다
        </p>
      </div>
    </div>
  );
};

export default PremiumModal;