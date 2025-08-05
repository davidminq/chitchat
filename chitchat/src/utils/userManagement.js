import { doc, getDoc, setDoc, updateDoc, collection, serverTimestamp, addDoc } from 'firebase/firestore';
import { db } from '../firebase';

// User profile management
export const createUserProfile = async (userId, userData) => {
  const userRef = doc(db, 'users', userId);
  
  const userProfile = {
    uid: userId,
    nickname: userData.nickname,
    email: userData.email,
    isAnonymous: userData.isAnonymous,
    loginMethod: userData.loginMethod,
    isBlueCheck: false,
    likeCount: 0,
    createdAt: serverTimestamp(),
    lastActive: serverTimestamp(),
    // Suspension system
    isSuspended: false,
    suspensionEndDate: null,
    reportCount: 0,
    // Premium features
    premiumFeatures: {
      blueCheck: false,
      dmAccess: false
    }
  };

  try {
    await setDoc(userRef, userProfile);
    return userProfile;
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
};

export const getUserProfile = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      return userSnap.data();
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
};

export const updateUserProfile = async (userId, updateData) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      ...updateData,
      lastActive: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

// Suspension system
export const suspendUser = async (userId, days = 7) => {
  const suspensionEndDate = new Date();
  suspensionEndDate.setDate(suspensionEndDate.getDate() + days);

  try {
    await updateUserProfile(userId, {
      isSuspended: true,
      suspensionEndDate: suspensionEndDate,
      reportCount: 0 // Reset report count after suspension
    });
    
    console.log(`User ${userId} suspended for ${days} days`);
  } catch (error) {
    console.error('Error suspending user:', error);
    throw error;
  }
};

export const checkUserSuspension = async (userId) => {
  try {
    const userProfile = await getUserProfile(userId);
    
    if (!userProfile || !userProfile.isSuspended) {
      return { isSuspended: false };
    }

    const now = new Date();
    const suspensionEnd = userProfile.suspensionEndDate?.toDate();

    if (suspensionEnd && now > suspensionEnd) {
      // Suspension has expired, lift it
      await updateUserProfile(userId, {
        isSuspended: false,
        suspensionEndDate: null
      });
      return { isSuspended: false };
    }

    return {
      isSuspended: true,
      suspensionEndDate: suspensionEnd
    };
  } catch (error) {
    console.error('Error checking user suspension:', error);
    return { isSuspended: false };
  }
};

// Report system
export const submitReport = async (reportData) => {
  try {
    const reportRef = collection(db, 'reports');
    const report = {
      ...reportData,
      timestamp: serverTimestamp(),
      status: 'pending'
    };

    await addDoc(reportRef, report);

    // Update reported user's report count
    const reportedUserRef = doc(db, 'users', reportData.reportedUserId);
    const userProfile = await getUserProfile(reportData.reportedUserId);
    
    if (userProfile) {
      const newReportCount = (userProfile.reportCount || 0) + 1;
      
      await updateDoc(reportedUserRef, {
        reportCount: newReportCount
      });

      // Auto-suspend if report count reaches threshold (e.g., 5 reports)
      if (newReportCount >= 5) {
        await suspendUser(reportData.reportedUserId, 7);
      }
    }

    return report;
  } catch (error) {
    console.error('Error submitting report:', error);
    throw error;
  }
};

// Like system
export const updateLikeCount = async (userId, increment = 1) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userProfile = await getUserProfile(userId);
    
    if (userProfile) {
      const newLikeCount = (userProfile.likeCount || 0) + increment;
      await updateDoc(userRef, {
        likeCount: newLikeCount
      });
      return newLikeCount;
    }
  } catch (error) {
    console.error('Error updating like count:', error);
    throw error;
  }
};

// Blue Check premium feature
export const purchaseBlueCheck = async (userId) => {
  try {
    await updateUserProfile(userId, {
      'premiumFeatures.blueCheck': true,
      'premiumFeatures.dmAccess': true,
      isBlueCheck: true
    });
    
    console.log(`Blue Check purchased for user ${userId}`);
    return true;
  } catch (error) {
    console.error('Error purchasing Blue Check:', error);
    throw error;
  }
};