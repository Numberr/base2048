// === Wallet Management ===
// VARIANT 5: Base Account SDK Integration
import { WALLET_CONFIG } from './config.js';
import { contractManager, NAME_RULES } from './contract.js';

class WalletManager {
  constructor() {
    this.connectedWallet = null;
    this.currentProvider = null;
    this.isAuthenticated = false;
    this.availableProviders = new Map();
    this.walletConnectProvider = null;
    this.playerName = null;
    this.hasName = false;
  }

  // === Wallet Detection ===
  async detectWallets() {
    console.log('[Wallet] Starting detection...');
    this.availableProviders.clear();

    // EIP-6963: Modern wallet detection
    const announceHandler = (event) => {
      const { info, provider } = event.detail;
      
      this.availableProviders.set(info.uuid, {
        info,
        provider,
        name: info.name,
        icon: WALLET_CONFIG.ICONS[info.name] || WALLET_CONFIG.ICONS.default
      });
      
      console.log('[Wallet] Detected via EIP-6963:', info.name);
    };

    window.addEventListener('eip6963:announceProvider', announceHandler);
    window.dispatchEvent(new Event('eip6963:requestProvider'));

    await new Promise(resolve => setTimeout(resolve, 300));

    // Legacy detection fallback
    this.detectLegacyWallets();

    // Initialize WalletConnect
    if (WALLET_CONFIG.PROJECT_ID && WALLET_CONFIG.PROJECT_ID !== 'YOUR_PROJECT_ID_HERE') {
      await this.initWalletConnect();
    } else {
      console.warn('[Wallet] WalletConnect Project ID not configured');
    }

    console.log(`[Wallet] Total found: ${this.availableProviders.size}`);
    return this.availableProviders.size > 0;
  }

  detectLegacyWallets() {
    if (!window.ethereum) return;

    console.log('[Wallet] Checking legacy providers...');

    const legacyWallets = [
      { check: 'isMetaMask', name: 'MetaMask' },
      { check: 'isRabby', name: 'Rabby' },
      { check: 'isCoinbaseWallet', name: 'Coinbase Wallet' },
      { check: 'isTrust', name: 'Trust Wallet' },
      { check: 'isBraveWallet', name: 'Brave Wallet' }
    ];

    for (const wallet of legacyWallets) {
      if (window.ethereum[wallet.check] && !this.hasProvider(wallet.name)) {
        this.availableProviders.set(`${wallet.name.toLowerCase()}-legacy`, {
          provider: window.ethereum,
          name: wallet.name,
          icon: WALLET_CONFIG.ICONS[wallet.name],
          info: { name: wallet.name, uuid: `${wallet.name.toLowerCase()}-legacy` }
        });
        console.log(`[Wallet] Detected ${wallet.name} (legacy)`);
      }
    }

    // Generic fallback
    if (this.availableProviders.size === 0) {
      this.availableProviders.set('generic', {
        provider: window.ethereum,
        name: 'Browser Wallet',
        icon: WALLET_CONFIG.ICONS.default,
        info: { name: 'Browser Wallet', uuid: 'generic' }
      });
      console.log('[Wallet] Detected Generic Browser Wallet');
    }
  }

  hasProvider(name) {
    for (let [, wallet] of this.availableProviders) {
      if (wallet.name === name) return true;
    }
    return false;
  }

  // === WalletConnect Initialization ===
  async initWalletConnect() {
    try {
      if (typeof window.EthereumProvider === 'undefined') {
        console.log('[WalletConnect] SDK not loaded, waiting...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        if (typeof window.EthereumProvider === 'undefined') {
          console.warn('[WalletConnect] SDK still unavailable after 2s');
          return false;
        }
      }

      console.log('[WalletConnect] Initializing...');

      this.walletConnectProvider = await window.EthereumProvider.init({
        projectId: WALLET_CONFIG.PROJECT_ID,
        chains: [WALLET_CONFIG.CHAINS.BASE_MAINNET],
        optionalChains: [WALLET_CONFIG.CHAINS.ETHEREUM, WALLET_CONFIG.CHAINS.BASE_SEPOLIA],
        showQrModal: true,
        qrModalOptions: {
          themeMode: 'light',
          themeVariables: {
            '--wcm-z-index': '1000'
          }
        },
        metadata: {
          name: 'Base 2048',
          description: 'Classic 2048 game on Base',
          url: window.location.origin,
          icons: ['https://base.org/favicon.ico']
        }
      });

      this.availableProviders.set('walletconnect', {
        provider: this.walletConnectProvider,
        name: 'WalletConnect',
        icon: WALLET_CONFIG.ICONS.WalletConnect,
        info: { name: 'WalletConnect', uuid: 'walletconnect' }
      });

      console.log('[WalletConnect] Initialized successfully');
      return true;

    } catch (error) {
      console.error('[WalletConnect] Init error:', error);
      return false;
    }
  }

  // === Detect Base App ===
  detectBaseApp(wallet) {
    const provider = wallet.provider;
    
    const checks = {
      isCoinbaseWallet: provider?.isCoinbaseWallet === true,
      isBaseWallet: provider?.isBaseWallet === true,
      walletName: wallet.name === 'Coinbase Wallet',
      hasBaseProperty: typeof provider?.isBase !== 'undefined'
    };
    
    console.log('[VARIANT 5] 🔍 Base App detection checks:', checks);
    
    const isBase = checks.isCoinbaseWallet || checks.isBaseWallet || checks.walletName;
    
    return isBase;
  }

  // === Create Base Account Provider ===
  async createBaseAccountProvider() {
    try {
      console.log('[VARIANT 5] 📦 Creating Base Account SDK provider...');
      
      if (typeof window.BaseAccount === 'undefined') {
        throw new Error('Base Account SDK not loaded');
      }
      
      console.log('[VARIANT 5] SDK found, creating instance...');
      
      const sdk = window.BaseAccount.createBaseAccountSDK({
        appName: 'Base 2048',
        appLogoUrl: null,
        appChainIds: [8453]
      });
      
      console.log('[VARIANT 5] SDK instance created');
      
      const provider = sdk.getProvider();
      
      console.log('[VARIANT 5] ✅ Base Account provider obtained');
      console.log('[VARIANT 5] Provider type:', typeof provider);
      console.log('[VARIANT 5] Provider methods:', Object.keys(provider).slice(0, 10));
      
      return provider;
      
    } catch (error) {
      console.error('[VARIANT 5] ❌ Failed to create Base Account provider:', error);
      throw error;
    }
  }

  // === Connection ===
  async connect(wallet) {
    try {
      console.log('[VARIANT 5] ========================================');
      console.log('[VARIANT 5] 🚀 STARTING CONNECTION');
      console.log('[VARIANT 5] Wallet name:', wallet.name);
      console.log('[VARIANT 5] ========================================');
      
      let provider = wallet.provider;
      
      // 🔥 VARIANT 5: Detect Base App and create proper provider
      const isBaseApp = this.detectBaseApp(wallet);
      console.log('[VARIANT 5] Is Base App detected:', isBaseApp);
      
      if (isBaseApp) {
        console.log('[VARIANT 5] 📱 Base App detected - using Base Account SDK');
        provider = await this.createBaseAccountProvider();
        console.log('[VARIANT 5] ✅ Base Account SDK provider created');
      } else {
        console.log('[VARIANT 5] 💼 Regular wallet - using standard provider');
      }

      // WalletConnect needs explicit connect()
      if (wallet.name === 'WalletConnect') {
        if (!provider.connect) {
          throw new Error('WalletConnect provider not properly initialized');
        }
        console.log('[WalletConnect] Opening modal...');
        await provider.connect();
      }

      // Request account access
      console.log('[VARIANT 5] Requesting accounts...');
      const accounts = await provider.request({ 
        method: 'eth_requestAccounts' 
      });

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts returned from wallet');
      }

      const address = accounts[0];
      console.log('[VARIANT 5] ✅ Connected:', address);

      // Get and verify chain
      const chainId = await provider.request({ method: 'eth_chainId' });
      console.log('[VARIANT 5] Chain ID:', chainId);

      await this.switchToBaseChain(provider, chainId);

      // Request signature for authentication
      console.log('[VARIANT 5] ========================================');
      console.log('[VARIANT 5] 🔐 REQUESTING AUTHENTICATION SIGNATURE');
      console.log('[VARIANT 5] ========================================');
      
      let signature = null;
      
      try {
        signature = await this.requestSignature(provider, address);
        console.log('[VARIANT 5] ✅ Signature obtained successfully!');
      } catch (error) {
        console.error('[VARIANT 5] ❌ Signature failed:', error.message);
        console.error('[VARIANT 5] Error code:', error.code);
        console.error('[VARIANT 5] Full error:', error);
        throw error;
      }

      // Initialize contract manager
      await contractManager.init(provider);

      // Check if player has a registered name
      await this.checkPlayerName(address);

      // Save connection state with signature
      this.connectedWallet = address;
      this.currentProvider = provider;
      this.isAuthenticated = true;

      this.saveConnection(address, wallet.name, signature);
      this.subscribeToEvents(provider);

      console.log('[VARIANT 5] ========================================');
      console.log('[VARIANT 5] ✅ CONNECTION COMPLETE');
      console.log('[VARIANT 5] Address:', address);
      console.log('[VARIANT 5] Player name:', this.playerName || '(not registered)');
      console.log('[VARIANT 5] Has signature:', !!signature?.signature);
      console.log('[VARIANT 5] ========================================');
      
      return { 
        address, 
        icon: wallet.icon, 
        signature,
        playerName: this.playerName,
        hasName: this.hasName
      };

    } catch (error) {
      console.error('[VARIANT 5] ========================================');
      console.error('[VARIANT 5] ❌ CONNECTION FAILED');
      console.error('[VARIANT 5] Error:', error);
      console.error('[VARIANT 5] ========================================');
      
      let errorMessage = 'Failed to connect wallet';
      if (error.code === 4001) {
        errorMessage = 'Connection rejected by user';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      throw new Error(errorMessage);
    }
  }

  // === Check Player Name ===
  async checkPlayerName(address) {
    try {
      console.log('[Wallet] Checking player name...');
      const name = await contractManager.getPlayerName(address);
      
      this.playerName = name || null;
      this.hasName = !!name;
      
      return { playerName: this.playerName, hasName: this.hasName };
      
    } catch (error) {
      console.error('[Wallet] Error checking player name:', error);
      this.playerName = null;
      this.hasName = false;
      return { playerName: null, hasName: false };
    }
  }

  // === VARIANT 5: Standard SIWE (works with Base Account SDK) ===
  async requestSignature(provider, address) {
    try {
      console.log('[VARIANT 5] ========================================');
      console.log('[VARIANT 5] 🔐 CREATING SIWE SIGNATURE');
      console.log('[VARIANT 5] ========================================');
      
      const timestamp = Date.now();
      const addressLower = address.toLowerCase();
      
      // Generate strong nonce (12+ characters)
      const nonce = Math.random().toString(36).substring(2, 10) + 
                    Math.random().toString(36).substring(2, 6);
      
      const domain = window.location.host;
      const uri = window.location.origin;
      const issuedAt = new Date(timestamp).toISOString();
      
      // Get chainId from provider
      let chainIdNumeric = 8453;
      try {
        const chainIdRaw = await provider.request({ method: 'eth_chainId' });
        if (typeof chainIdRaw === 'string') {
          chainIdNumeric = parseInt(chainIdRaw, 16);
        } else if (typeof chainIdRaw === 'number') {
          chainIdNumeric = chainIdRaw;
        }
      } catch (e) {
        console.warn('[VARIANT 5] Could not read chainId, using default 8453');
      }
      
      // Standard SIWE format (EIP-4361)
      const message = `${domain} wants you to sign in with your Ethereum account:
${addressLower}

Sign in to Base 2048

URI: ${uri}
Version: 1
Chain ID: ${chainIdNumeric}
Nonce: ${nonce}
Issued At: ${issuedAt}`;

      console.log('[VARIANT 5] ========================================');
      console.log('[VARIANT 5] SIWE Message:');
      console.log(message);
      console.log('[VARIANT 5] ========================================');
      console.log('[VARIANT 5] Message details:');
      console.log('[VARIANT 5]   Domain:', domain);
      console.log('[VARIANT 5]   Address:', addressLower);
      console.log('[VARIANT 5]   Chain ID:', chainIdNumeric);
      console.log('[VARIANT 5]   Nonce:', nonce);
      console.log('[VARIANT 5]   Nonce length:', nonce.length);
      console.log('[VARIANT 5] ========================================');
      
      console.log('[VARIANT 5] Calling personal_sign...');
      
      const signature = await provider.request({
        method: 'personal_sign',
        params: [message, addressLower]
      });

      console.log('[VARIANT 5] ========================================');
      console.log('[VARIANT 5] ✅ SIGNATURE RECEIVED');
      console.log('[VARIANT 5] Signature length:', signature?.length);
      console.log('[VARIANT 5] Signature preview:', signature?.substring(0, 20) + '...');
      console.log('[VARIANT 5] ========================================');
      
      return {
        signature,
        message,
        address: addressLower,
        timestamp,
        nonce
      };

    } catch (error) {
      console.error('[VARIANT 5] ========================================');
      console.error('[VARIANT 5] ❌ SIGNATURE FAILED');
      console.error('[VARIANT 5] Error name:', error.name);
      console.error('[VARIANT 5] Error message:', error.message);
      console.error('[VARIANT 5] Error code:', error.code);
      console.error('[VARIANT 5] Full error:', error);
      console.error('[VARIANT 5] ========================================');
      
      if (error.code === 4001) {
        throw new Error('Signature rejected by user');
      }
      
      throw error;
    }
  }
  async switchToBaseChain(provider, currentChainId) {
    const baseChainId = '0x2105'; // Base mainnet (8453)
    
    if (currentChainId === baseChainId) return;

    console.log('[Wallet] Wrong network, switching to Base...');
    
    try {
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: baseChainId }],
      });
    } catch (switchError) {
      // Chain not added, add it
      if (switchError.code === 4902) {
        await provider.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: baseChainId,
            chainName: 'Base',
            nativeCurrency: {
              name: 'Ethereum',
              symbol: 'ETH',
              decimals: 18
            },
            rpcUrls: ['https://mainnet.base.org'],
            blockExplorerUrls: ['https://basescan.org']
          }]
        });
      } else {
        throw switchError;
      }
    }
  }

  async disconnect() {
    try {
      // Disconnect WalletConnect if active
      if (this.walletConnectProvider && this.currentProvider === this.walletConnectProvider) {
        await this.walletConnectProvider.disconnect();
      }

      // Remove event listeners
      if (this.currentProvider) {
        this.unsubscribeFromEvents(this.currentProvider);
      }

      // Clear state
      this.connectedWallet = null;
      this.currentProvider = null;
      this.isAuthenticated = false;
      this.playerName = null;
      this.hasName = false;

      this.clearConnection();

      console.log('[Wallet] Disconnected');
      return true;

    } catch (error) {
      console.error('[Wallet] Disconnect error:', error);
      return false;
    }
  }

  // === Event Handlers ===
  subscribeToEvents(provider) {
    provider.on('accountsChanged', this.handleAccountsChanged.bind(this));
    provider.on('chainChanged', this.handleChainChanged.bind(this));
    provider.on('disconnect', this.handleDisconnect.bind(this));
  }

  unsubscribeFromEvents(provider) {
    provider.removeListener('accountsChanged', this.handleAccountsChanged);
    provider.removeListener('chainChanged', this.handleChainChanged);
    provider.removeListener('disconnect', this.handleDisconnect);
  }

  handleAccountsChanged(accounts) {
    if (accounts.length === 0) {
      this.disconnect();
      window.dispatchEvent(new CustomEvent('walletDisconnected'));
    } else if (accounts[0] !== this.connectedWallet) {
      this.connectedWallet = accounts[0];
      this.updateStoredAddress(accounts[0]);
      window.dispatchEvent(new CustomEvent('walletAccountChanged', { 
        detail: { address: accounts[0] } 
      }));
    }
  }

  handleChainChanged() {
    console.log('[Wallet] Chain changed, reloading...');
    window.location.reload();
  }

  handleDisconnect() {
    console.log('[Wallet] Disconnected');
    this.disconnect();
    window.dispatchEvent(new CustomEvent('walletDisconnected'));
  }

  // === Storage ===
  saveConnection(address, walletName, signatureData = null) {
    const connectionData = {
      address,
      walletName,
      timestamp: Date.now()
    };
    
    // Add signature data if provided
    if (signatureData) {
      connectionData.signature = signatureData.signature;
      connectionData.signatureTimestamp = signatureData.timestamp;
      connectionData.nonce = signatureData.nonce;
    }
    
    localStorage.setItem('2048-wallet', JSON.stringify(connectionData));
  }

  updateStoredAddress(address) {
    const saved = localStorage.getItem('2048-wallet');
    if (saved) {
      const data = JSON.parse(saved);
      data.address = address;
      localStorage.setItem('2048-wallet', JSON.stringify(data));
    }
  }

  clearConnection() {
    localStorage.removeItem('2048-wallet');
  }

  async checkExistingConnection() {
    const saved = localStorage.getItem('2048-wallet');
    if (!saved) return null;

    try {
      const { address, walletName, timestamp, signature, signatureTimestamp } = JSON.parse(saved);

      // Check if connection is not too old (24 hours)
      const dayInMs = 24 * 60 * 60 * 1000;
      if (Date.now() - timestamp > dayInMs) {
        console.log('[Wallet] Connection expired');
        this.clearConnection();
        return null;
      }

      // Check if signature exists and is valid (not older than 7 days)
      if (signature && signatureTimestamp) {
        const weekInMs = 7 * 24 * 60 * 60 * 1000;
        if (Date.now() - signatureTimestamp > weekInMs) {
          console.log('[Wallet] Signature expired, re-authentication required');
          this.clearConnection();
          return null;
        }
      } else {
        console.log('[Wallet] No signature found, re-authentication required');
        this.clearConnection();
        return null;
      }

      console.log('[Wallet] Attempting to restore connection...');

      // Try to reconnect
      for (let [, wallet] of this.availableProviders) {
        if (wallet.name === walletName) {
          try {
            const provider = wallet.provider;

            // For WalletConnect, check if session exists
            if (walletName === 'WalletConnect' && provider.session) {
              const accounts = await provider.request({ method: 'eth_accounts' });
              if (accounts && accounts[0] && accounts[0].toLowerCase() === address.toLowerCase()) {
                return await this.restoreConnection(accounts[0], provider, wallet);
              }
            }

            // For other wallets
            const accounts = await provider.request({ method: 'eth_accounts' });
            if (accounts && accounts[0] && accounts[0].toLowerCase() === address.toLowerCase()) {
              return await this.restoreConnection(accounts[0], provider, wallet);
            }
          } catch (err) {
            console.log('[Wallet] Could not restore:', err.message);
          }
        }
      }

      this.clearConnection();
      return null;

    } catch (error) {
      console.error('[Wallet] Error checking existing connection:', error);
      this.clearConnection();
      return null;
    }
  }

  async restoreConnection(address, provider, wallet) {
    this.connectedWallet = address;
    this.currentProvider = provider;
    this.isAuthenticated = true;
    this.subscribeToEvents(provider);
    
    // Initialize contract manager
    await contractManager.init(provider);
    
    // Check player name
    await this.checkPlayerName(address);
    
    console.log('[Wallet] Connection restored');
    console.log('[Wallet] Player name:', this.playerName || '(not registered)');
    
    return { 
      address, 
      icon: wallet.icon,
      playerName: this.playerName,
      hasName: this.hasName
    };
  }

  // === Helpers ===
  getAvailableWallets() {
    return Array.from(this.availableProviders.values());
  }

  isConnected() {
    return this.isAuthenticated && this.connectedWallet !== null;
  }

  getAddress() {
    return this.connectedWallet;
  }

  // Get stored signature data
  getSignature() {
    const saved = localStorage.getItem('2048-wallet');
    if (!saved) return null;
    
    try {
      const data = JSON.parse(saved);
      if (data.signature) {
        return {
          signature: data.signature,
          timestamp: data.signatureTimestamp,
          nonce: data.nonce,
          address: data.address
        };
      }
    } catch (error) {
      console.error('[Wallet] Error reading signature:', error);
    }
    
    return null;
  }

  // Verify if signature is still valid
  isSignatureValid() {
    const signatureData = this.getSignature();
    if (!signatureData) return false;
    
    const weekInMs = 7 * 24 * 60 * 60 * 1000;
    return (Date.now() - signatureData.timestamp) < weekInMs;
  }

  formatAddress(address) {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  // === Player Name Methods ===
  getPlayerName() {
    return this.playerName;
  }

  hasPlayerName() {
    return this.hasName;
  }

  async mintPlayerName(name) {
    if (!this.isConnected()) {
      throw new Error('Wallet not connected');
    }

    try {
      const result = await contractManager.mintName(name, this.connectedWallet);
      
      // Update state
      this.playerName = result.name;
      this.hasName = true;
      
      // Update stored connection
      this.updateStoredPlayerName(result.name);
      
      return result;
      
    } catch (error) {
      console.error('[Wallet] Error minting name:', error);
      throw error;
    }
  }

  async checkNameAvailability(name) {
    try {
      return await contractManager.isNameAvailable(name);
    } catch (error) {
      console.error('[Wallet] Error checking name availability:', error);
      throw error;
    }
  }

  validateName(name) {
    return NAME_RULES.validate(name);
  }

  updateStoredPlayerName(name) {
    const saved = localStorage.getItem('2048-wallet');
    if (saved) {
      const data = JSON.parse(saved);
      data.playerName = name;
      data.hasName = true;
      localStorage.setItem('2048-wallet', JSON.stringify(data));
    }
  }
}

export const walletManager = new WalletManager();