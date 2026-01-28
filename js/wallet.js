// === Wallet Management ===
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

  // === Connection ===
  async connect(wallet) {
    try {
      console.log(`[Wallet] Connecting to ${wallet.name}...`);
      const provider = wallet.provider;

      // WalletConnect needs explicit connect()
      if (wallet.name === 'WalletConnect') {
        if (!provider.connect) {
          throw new Error('WalletConnect provider not properly initialized');
        }
        console.log('[WalletConnect] Opening modal...');
        await provider.connect();
      }

      // Request account access
      const accounts = await provider.request({ 
        method: 'eth_requestAccounts' 
      });

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts returned from wallet');
      }

      const address = accounts[0];
      console.log('[Wallet] Connected:', address);

      // Get and verify chain
      const chainId = await provider.request({ method: 'eth_chainId' });
      console.log('[Wallet] Chain ID:', chainId);

      await this.switchToBaseChain(provider, chainId);

      // Request signature for authentication
      console.log('[Wallet] Requesting signature for authentication...');
      const signature = await this.requestSignature(provider, address);
      
      if (!signature) {
        throw new Error('Signature required for authentication');
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

      console.log('[Wallet] Successfully connected and authenticated');
      console.log('[Wallet] Player name:', this.playerName || '(not registered)');
      
      return { 
        address, 
        icon: wallet.icon, 
        signature,
        playerName: this.playerName,
        hasName: this.hasName
      };

    } catch (error) {
      console.error('[Wallet] Connection error:', error);
      
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

  // === Signature Request for Authentication ===
  async requestSignature(provider, address) {
    try {
      const timestamp = Date.now();
      const nonce = Math.random().toString(36).substring(7);
      const issuedAt = new Date(timestamp).toISOString();
      const domain = window.location.host;
      const uri = window.location.origin;
      
      // Proper SIWE (EIP-4361) format - required for Base App compatibility
      const message = `${domain} wants you to sign in with your Ethereum account:
${address}

Sign this message to authenticate your wallet and play Base 2048. This will not trigger any blockchain transaction or cost any gas fees.

URI: ${uri}
Version: 1
Chain ID: 8453
Nonce: ${nonce}
Issued At: ${issuedAt}`;

      console.log('[Wallet] Requesting signature...');
      console.log('[Wallet] SIWE Message:', message);
      
      const signature = await provider.request({
        method: 'personal_sign',
        params: [message, address]
      });

      console.log('[Wallet] Signature received');
      
      // Store signature data
      const signatureData = {
        signature,
        message,
        address,
        timestamp,
        nonce
      };

      return signatureData;

    } catch (error) {
      console.error('[Wallet] Signature error:', error);
      
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