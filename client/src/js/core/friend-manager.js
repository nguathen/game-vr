import {
  db, isConfigured,
  doc, getDoc, setDoc,
  collection, query, getDocs,
} from './firebase-config.js';
import authManager from './auth-manager.js';

const MAX_FRIENDS = 20;

class FriendManager {
  constructor() {
    this._friendProfiles = [];
  }

  generateFriendCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  async ensureFriendCode() {
    const profile = authManager.profile;
    if (profile.friendCode) return profile.friendCode;

    const code = this.generateFriendCode();
    await authManager.saveProfile({ friendCode: code });

    if (isConfigured && authManager.user) {
      const ref = doc(db, 'friendCodes', code);
      await setDoc(ref, { uid: authManager.uid });
    }
    return code;
  }

  async addFriend(friendCode) {
    const profile = authManager.profile;
    const friends = profile.friends || [];

    if (friends.length >= MAX_FRIENDS) {
      return { success: false, error: 'Friend list full (max 20)' };
    }

    if (friendCode === profile.friendCode) {
      return { success: false, error: "You can't add yourself" };
    }

    if (!isConfigured) {
      return { success: false, error: 'Friends require online mode' };
    }

    // Look up friend code
    const codeRef = doc(db, 'friendCodes', friendCode.toUpperCase());
    const codeSnap = await getDoc(codeRef);
    if (!codeSnap.exists()) {
      return { success: false, error: 'Friend code not found' };
    }

    const friendUid = codeSnap.data().uid;
    if (friends.includes(friendUid)) {
      return { success: false, error: 'Already friends' };
    }

    friends.push(friendUid);
    await authManager.saveProfile({ friends });
    return { success: true };
  }

  async removeFriend(uid) {
    const profile = authManager.profile;
    const friends = (profile.friends || []).filter(f => f !== uid);
    await authManager.saveProfile({ friends });
  }

  async getFriendProfiles() {
    const profile = authManager.profile;
    const friendUids = profile.friends || [];
    if (friendUids.length === 0 || !isConfigured) return [];

    const profiles = [];
    for (const uid of friendUids) {
      try {
        const ref = doc(db, 'players', uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          const lastSeen = data.lastSeen?.toDate?.() || null;
          const isOnline = lastSeen && (Date.now() - lastSeen.getTime()) < 5 * 60 * 1000;
          profiles.push({
            uid,
            displayName: data.displayName || 'Player',
            level: data.level || 1,
            highScores: data.highScores || {},
            isOnline,
          });
        }
      } catch (e) { /* skip failed fetches */ }
    }
    this._friendProfiles = profiles;
    return profiles;
  }

  getCachedFriends() {
    return this._friendProfiles;
  }
}

const friendManager = new FriendManager();
export { friendManager, MAX_FRIENDS };
export default friendManager;
