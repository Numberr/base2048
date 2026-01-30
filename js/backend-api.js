// === Backend API Client ===
// Handles communication with Node.js backend for scores and leaderboard
// Version: 2.1.0 - Added message passing for signature verification

const BACKEND_CONFIG = {
  // Change this to your backend URL when deployed
  API_URL: 'https://base2048-backend-production.up.railway.app/api'
  
  // For production:
  // API_URL: 'https://your-backend-domain.com/api'
};

class BackendAPI {
  constructor() {
    this.baseURL = BACKEND_CONFIG.API_URL;
    this.version = '2.1.0';
    console.log(`[BackendAPI] Initialized v${this.version}`);
  }

  /**
   * Submit score to backend
   * @param {string} address - Player's wallet address
   * @param {string} playerName - Player's registered name
   * @param {number} score - Game score
   * @param {string} signature - Signature from wallet
   * @param {number} timestamp - Timestamp when signature was created
   * @param {string} message - The exact message that was signed
   * @returns {Promise<Object>} Response with bestScore and isNewRecord
   */
  async submitScore(address, playerName, score, signature, timestamp, message) {
    try {
      const requestBody = {
        address,
        playerName,
        score,
        timestamp,
        signature,
        message
      };
      
      console.log('[BackendAPI] ==========================================');
      console.log('[BackendAPI] SUBMITTING TO BACKEND:');
      console.log('[BackendAPI]   Address:', address);
      console.log('[BackendAPI]   Player Name:', playerName);
      console.log('[BackendAPI]   Score:', score);
      console.log('[BackendAPI]   Timestamp:', timestamp);
      console.log('[BackendAPI]   Message:', message);
      console.log('[BackendAPI]   Signature:', signature);
      console.log('[BackendAPI]   Request Body:', JSON.stringify(requestBody, null, 2));
      console.log('[BackendAPI] ==========================================');
      
      const response = await fetch(`${this.baseURL}/score`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('[BackendAPI] Submit failed:', data);
        throw new Error(data.message || data.error || 'Failed to submit score');
      }

      console.log('[BackendAPI] âœ“ Score submitted:', data);
      return data;

    } catch (error) {
      console.error('[BackendAPI] Submit error:', error);
      throw error;
    }
  }

  /**
   * Get leaderboard
   * @param {number} limit - Number of top players to fetch
   * @returns {Promise<Array>} Array of top players
   */
  async getLeaderboard(limit = 10) {
    try {
      console.log('[BackendAPI] Fetching leaderboard, limit:', limit);

      const response = await fetch(`${this.baseURL}/leaderboard?limit=${limit}`);
      const data = await response.json();

      if (!response.ok) {
        console.error('[BackendAPI] Leaderboard fetch failed:', data);
        throw new Error(data.message || data.error || 'Failed to fetch leaderboard');
      }

      console.log('[BackendAPI] âœ“ Leaderboard fetched:', data.count, 'players');
      return data.leaderboard;

    } catch (error) {
      console.error('[BackendAPI] Leaderboard error:', error);
      throw error;
    }
  }

  /**
   * Get player's record
   * @param {string} address - Player's wallet address
   * @returns {Promise<Object>} Player's stats
   */
  async getPlayerScore(address) {
    try {
      console.log('[BackendAPI] Fetching player score:', address);

      const response = await fetch(`${this.baseURL}/score/${address}`);
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 404) {
          console.log('[BackendAPI] Player not found');
          return null;
        }
        throw new Error(data.message || data.error || 'Failed to fetch player score');
      }

      console.log('[BackendAPI] âœ“ Player score fetched:', data.data);
      return data.data;

    } catch (error) {
      console.error('[BackendAPI] Player score error:', error);
      throw error;
    }
  }

  /**
   * Request signature from wallet for score submission
   * @param {Object} provider - Web3 provider
   * @param {string} address - Player's wallet address
   * @param {number} score - Game score
   * @returns {Promise<string>} Signature
   */
  async requestScoreSignature(provider, address, score) {
    try {
      const timestamp = Date.now();
      
      // Wait for ethers.js
      if (typeof window.ethers === 'undefined') {
        console.log('[BackendAPI] Waiting for ethers.js...');
        await new Promise(resolve => setTimeout(resolve, 500));
        if (typeof window.ethers === 'undefined') {
          throw new Error('ethers.js not loaded');
        }
      }
      
      // Use checksum address (EIP-55)
      const checksumAddress = window.ethers.utils.getAddress(address);
      const addressLower = address.toLowerCase();
      
      // Simple text message (not SIWE) - like Pixotchi Airdrop
      const message = `Submit Base 2048 Score

Score: ${score}
Wallet: ${checksumAddress}
Timestamp: ${timestamp}

By signing this message, you confirm ownership of this wallet and submit your game score to the leaderboard.`;

      console.log('[BackendAPI] ==========================================');
      console.log('[BackendAPI] Score submission message:');
      console.log(message);
      console.log('[BackendAPI] ==========================================');

      const signature = await provider.request({
        method: 'personal_sign',
        params: [message, addressLower]
      });

      console.log('[BackendAPI] ✓ Signature created:', signature.substring(0, 20) + '...');
      
      return { signature, timestamp, message };

    } catch (error) {
      console.error('[BackendAPI] Signature error:', error);
      
      if (error.code === 4001) {
        throw new Error('Signature rejected by user');
      }
      
      throw error;
    }
  }


  /**
   * Check if backend is available
   * @returns {Promise<boolean>}
   */
  async checkHealth() {
    try {
      const response = await fetch(`${this.baseURL.replace('/api', '')}/health`);
      const data = await response.json();
      
      return data.status === 'ok' && data.mongodb === 'connected';
      
    } catch (error) {
      console.error('[BackendAPI] Health check failed:', error);
      return false;
    }
  }
}

export const backendAPI = new BackendAPI();