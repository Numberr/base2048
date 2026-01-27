// === PlayerName Contract Integration ===
// ВЕРСИЯ С ПОДРОБНЫМ ЛОГИРОВАНИЕМ ДЛЯ ОТЛАДКИ

// PlayerName Contract Configuration
export const CONTRACT_CONFIG = {
  ADDRESS: '0x9eF4F7edB902456B5F98c3b04D673F4802BF14b0',
  CHAIN_ID: 8453, // Base Mainnet
  
  ABI: [
    {
      "inputs": [{"internalType": "address", "name": "", "type": "address"}],
      "name": "playerName",
      "outputs": [{"internalType": "string", "name": "", "type": "string"}],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [{"internalType": "string", "name": "name", "type": "string"}],
      "name": "mintName",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [{"internalType": "string", "name": "name", "type": "string"}],
      "name": "isNameAvailable",
      "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [{"internalType": "string", "name": "", "type": "string"}],
      "name": "nameTaken",
      "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
      "stateMutability": "view",
      "type": "function"
    }
  ]
};

// Name validation rules
export const NAME_RULES = {
  MIN_LENGTH: 3,
  MAX_LENGTH: 16,
  PATTERN: /^[a-z]+$/,
  
  validate(name) {
    if (!name || typeof name !== 'string') {
      return { valid: false, error: 'Name is required' };
    }
    
    const trimmed = name.trim().toLowerCase();
    
    if (trimmed.length < this.MIN_LENGTH) {
      return { valid: false, error: `Name must be at least ${this.MIN_LENGTH} characters` };
    }
    
    if (trimmed.length > this.MAX_LENGTH) {
      return { valid: false, error: `Name must be at most ${this.MAX_LENGTH} characters` };
    }
    
    if (!this.PATTERN.test(trimmed)) {
      return { valid: false, error: 'Name must contain only lowercase letters (a-z)' };
    }
    
    return { valid: true, name: trimmed };
  }
};

// Helper function to wait for ethers.js to load
async function waitForEthers(maxAttempts = 50) {
  for (let i = 0; i < maxAttempts; i++) {
    if (typeof window.ethers !== 'undefined') {
      console.log('[Contract] ✓ ethers.js detected');
      return true;
    }
    console.log(`[Contract] Waiting for ethers.js... (${i + 1}/${maxAttempts})`);
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  return false;
}

class ContractManager {
  constructor() {
    this.contract = null;
    this.provider = null;
    this.ethersInterface = null;
    this.initialized = false;
  }

  // Initialize contract with provider
  async init(provider) {
    this.provider = provider;
    
    // Wait for ethers.js to load
    console.log('[Contract] Checking for ethers.js...');
    const ethersLoaded = await waitForEthers();
    
    if (!ethersLoaded) {
      console.error('[Contract] ❌ ethers.js not loaded!');
      throw new Error('ethers.js library is required but not loaded');
    }
    
    // Initialize ethers Interface for proper ABI encoding
    try {
      this.ethersInterface = new window.ethers.utils.Interface(CONTRACT_CONFIG.ABI);
      this.initialized = true;
      console.log('[Contract] ✓ Initialized with ethers.js Interface');
    } catch (error) {
      console.error('[Contract] ❌ Failed to initialize Interface:', error);
      throw error;
    }
  }

  // Get player name from contract
  async getPlayerName(address) {
    console.log('[Contract] ========================================');
    console.log('[Contract] 🔍 GET PLAYER NAME - START');
    console.log('[Contract] Address:', address);
    
    try {
      if (!this.provider) {
        throw new Error('Provider not initialized');
      }

      if (!this.initialized || !this.ethersInterface) {
        throw new Error('Contract not initialized - call init() first');
      }

      // Encode function call
      const data = this.ethersInterface.encodeFunctionData('playerName', [address]);
      console.log('[Contract] 📝 Encoded call data:', data);
      
      // Make the call
      console.log('[Contract] 📡 Calling contract...');
      const result = await this.provider.request({
        method: 'eth_call',
        params: [{
          to: CONTRACT_CONFIG.ADDRESS,
          data: data
        }, 'latest']
      });

      console.log('[Contract] 📥 Raw result:', result);
      console.log('[Contract] 📥 Raw result length:', result.length);

      // Check if result is empty
      if (!result || result === '0x' || result.length < 130) {
        console.log('[Contract] ⚠️ Empty or short result - likely no name registered');
        console.log('[Contract] 🔍 GET PLAYER NAME - END (no name)');
        console.log('[Contract] ========================================');
        return '';
      }

      // Decode the result
      console.log('[Contract] 🔓 Attempting to decode with ethers.js...');
      let name;
      try {
        const decoded = this.ethersInterface.decodeFunctionResult('playerName', result);
        console.log('[Contract] 🔓 Decoded result:', decoded);
        name = decoded[0];
        console.log('[Contract] 📛 Extracted name:', name);
      } catch (decodeError) {
        console.error('[Contract] ❌ Decode error:', decodeError);
        console.log('[Contract] 🔧 Attempting manual decode...');
        
        // Try manual decode as fallback
        name = this.manualDecodeString(result);
        console.log('[Contract] 📛 Manual decode result:', name);
      }
      
      // Validate the name
      const finalName = (name && name.length > 0) ? name : '';
      console.log('[Contract] ✅ Final name:', finalName || '(not set)');
      console.log('[Contract] 🔍 GET PLAYER NAME - END');
      console.log('[Contract] ========================================');
      
      return finalName;

    } catch (error) {
      console.error('[Contract] ❌ Error getting player name:', error);
      console.error('[Contract] ❌ Error details:', {
        message: error.message,
        code: error.code,
        data: error.data
      });
      console.log('[Contract] 🔍 GET PLAYER NAME - END (error)');
      console.log('[Contract] ========================================');
      return '';
    }
  }

  // Manual decode string (fallback)
  manualDecodeString(hex) {
    try {
      if (!hex || hex === '0x') return '';
      
      hex = hex.replace('0x', '');
      console.log('[Contract] Manual decode - hex length:', hex.length);
      
      // Skip offset (first 64 chars)
      const lengthHex = hex.slice(64, 128);
      const length = parseInt(lengthHex, 16);
      console.log('[Contract] Manual decode - string length:', length);
      
      if (length === 0 || length > 100) {
        console.log('[Contract] Manual decode - invalid length');
        return '';
      }
      
      // Get data (length * 2 because 2 hex chars = 1 byte)
      const dataHex = hex.slice(128, 128 + length * 2);
      console.log('[Contract] Manual decode - data hex:', dataHex);
      
      // Convert to string
      let result = '';
      for (let i = 0; i < dataHex.length; i += 2) {
        const byte = parseInt(dataHex.substr(i, 2), 16);
        if (byte !== 0) {
          result += String.fromCharCode(byte);
        }
      }
      
      console.log('[Contract] Manual decode - result:', result);
      return result;
      
    } catch (error) {
      console.error('[Contract] Manual decode error:', error);
      return '';
    }
  }

  // Check if name is available
  async isNameAvailable(name) {
    try {
      if (!this.provider) {
        throw new Error('Provider not initialized');
      }

      if (!this.initialized || !this.ethersInterface) {
        throw new Error('Contract not initialized - call init() first');
      }

      console.log('[Contract] Checking name availability:', name);

      const data = this.ethersInterface.encodeFunctionData('isNameAvailable', [name]);
      console.log('[Contract] Encoded call data:', data);
      
      const result = await this.provider.request({
        method: 'eth_call',
        params: [{
          to: CONTRACT_CONFIG.ADDRESS,
          data: data
        }, 'latest']
      });

      console.log('[Contract] Raw result:', result);

      const decoded = this.ethersInterface.decodeFunctionResult('isNameAvailable', result);
      const available = decoded[0];
      
      console.log('[Contract] Name available:', available);
      
      return available;

    } catch (error) {
      console.error('[Contract] Error checking name availability:', error);
      throw error;
    }
  }

  // Mint new player name
  async mintName(name, address) {
    try {
      if (!this.provider) {
        throw new Error('Provider not initialized');
      }

      if (!this.initialized || !this.ethersInterface) {
        throw new Error('Contract not initialized - call init() first');
      }

      // Validate name
      const validation = NAME_RULES.validate(name);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // ⭐ ВАЖНО: Проверяем, что у пользователя еще НЕТ имени
      console.log('[Contract] 🔍 Checking if user already has a name...');
      const existingName = await this.getPlayerName(address);
      if (existingName && existingName.length > 0) {
        console.log('[Contract] ❌ User already has name:', existingName);
        throw new Error(`You already have a registered name: ${existingName}`);
      }
      console.log('[Contract] ✅ User has no name yet');

      // Check availability
      const available = await this.isNameAvailable(validation.name);
      if (!available) {
        throw new Error('This name is already taken');
      }

      console.log('[Contract] Minting name:', validation.name);

      const data = this.ethersInterface.encodeFunctionData('mintName', [validation.name]);

      const txHash = await this.provider.request({
        method: 'eth_sendTransaction',
        params: [{
          from: address,
          to: CONTRACT_CONFIG.ADDRESS,
          data: data,
          gas: '0x30D40' // 200,000 gas limit
        }]
      });

      console.log('[Contract] Transaction sent:', txHash);

      // Wait for transaction confirmation
      const receipt = await this.waitForTransaction(txHash);
      
      if (receipt.status === '0x0') {
        throw new Error('Transaction failed');
      }

      console.log('[Contract] Name minted successfully');
      return { txHash, name: validation.name };

    } catch (error) {
      console.error('[Contract] Error minting name:', error);
      
      // User-friendly error messages
      if (error.code === 4001) {
        throw new Error('Transaction rejected by user');
      }
      
      if (error.message?.includes('insufficient funds')) {
        throw new Error('Insufficient ETH balance for gas fees');
      }
      
      throw error;
    }
  }

  // Wait for transaction to be mined
  async waitForTransaction(txHash, maxAttempts = 60) {
    console.log('[Contract] Waiting for transaction:', txHash);
    
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const receipt = await this.provider.request({
          method: 'eth_getTransactionReceipt',
          params: [txHash]
        });

        if (receipt) {
          console.log('[Contract] Transaction confirmed:', receipt);
          return receipt;
        }

        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.error('[Contract] Error checking transaction:', error);
      }
    }

    throw new Error('Transaction timeout - please check block explorer');
  }
}

export const contractManager = new ContractManager();