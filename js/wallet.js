// === Wallet Management ===
// VARIANT 5.1: Simplified - standard SIWE works everywhere
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

    // EIP-6963
    const announceHandler = (event) => {
      const { info, provider } = event.detail;
      this.availableProviders.set(info.uuid, {
        info, provider, name: info.name,
        icon: WALLET_CONFIG.ICONS[info.name] || WALLET_CONFIG.ICONS.default
      });
      console.log('[Wallet] Detected via EIP-6963:', info.name);
    };

    window.addEventListener('eip6963:announceProvider', announceHandler);
    window.dispatchEvent(new Event('eip6963:requestProvider'));
    await new Promise(resolve => setTimeout(resolve, 300));

    this.detectLegacyWallets();

    if (WALLET_CONFIG.PROJECT_ID && WALLET_CONFIG.PROJECT_ID !== 'YOUR_PROJECT_ID_HERE') {
      await this.initWalletConnect();
    }

    console.log(`[Wallet] Total found: ${this.availableProviders.size}`);
    return this.availableProviders.size > 0;
  }

  detectLegacyWallets() {
    if (!window.ethereum) return;

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
          provider: window.ethereum, name: wallet.name,
          icon: WALLET_CONFIG.ICONS[wallet.name],
          info: { name: wallet.name, uuid: `${wallet.name.toLowerCase()}-legacy` }
        });
      }
    }

    if (this.availableProviders.size === 0) {
      this.availableProviders.set('generic', {
        provider: window.ethereum, name: 'Browser Wallet',
        icon: WALLET_CONFIG.ICONS.default,
        info: { name: 'Browser Wallet', uuid: 'generic' }
      });
    }
  }

  hasProvider(name) {
    for (let [, wallet] of this.availableProviders) {
      if (wallet.name === name) return true;
    }
    return false;
  }

  async initWalletConnect() {
    try {
      if (typeof window.EthereumProvider === 'undefined') {
        await new Promise(resolve => setTimeout(resolve, 2000));
        if (typeof window.EthereumProvider === 'undefined') return false;
      }

      this.walletConnectProvider = await window.EthereumProvider.init({
        projectId: WALLET_CONFIG.PROJECT_ID,
        chains: [WALLET_CONFIG.CHAINS.BASE_MAINNET],
        optionalChains: [WALLET_CONFIG.CHAINS.ETHEREUM, WALLET_CONFIG.CHAINS.BASE_SEPOLIA],
        showQrModal: true,
        qrModalOptions: { themeMode: 'light', themeVariables: { '--wcm-z-index': '1000' } },
        metadata: {
          name: 'Base 2048',
          description: 'Classic 2048 game on Base',
          url: window.location.origin,
          icons: ['https://base.org/favicon.ico']
        }
      });

      this.availableProviders.set('walletconnect', {
        provider: this.walletConnectProvider, name: 'WalletConnect',
        icon: WALLET_CONFIG.ICONS.WalletConnect,
        info: { name: 'WalletConnect', uuid: 'walletconnect' }
      });

      return true;
    } catch (error) {
      console.error('[WalletConnect] Init error:', error);
      return false;
    }
  }

  // === Connection ===
  async connect(wallet) {
    try {
      console.log('[V5.1] ========================================');
      console.log('[V5.1] ðŸš€ CONNECTING:', wallet.name);
      console.log('[V5.1] Is Base App:', this.isBaseApp(wallet));
      console.log('[V5.1] ========================================');
      
      const provider = wallet.provider;

      if (wallet.name === 'WalletConnect' && provider.connect) {
        await provider.connect();
      }

      const accounts = await provider.request({ method: 'eth_requestAccounts' });
      if (!accounts || accounts.length === 0) throw new Error('No accounts');

      const address = accounts[0];
      console.log('[V5.1] âœ… Connected:', address);

      const chainId = await provider.request({ method: 'eth_chainId' });
      await this.switchToBaseChain(provider, chainId);

      console.log('[V5.1] ðŸ” Requesting signature...');
      const signature = await this.requestSignature(provider, address);
      console.log('[V5.1] âœ… Signature obtained!');

      await contractManager.init(provider);
      await this.checkPlayerName(address);

      this.connectedWallet = address;
      this.currentProvider = provider;
      this.isAuthenticated = true;

      this.saveConnection(address, wallet.name, signature);
      this.subscribeToEvents(provider);

      console.log('[V5.1] âœ… COMPLETE - Name:', this.playerName || '(none)');
      
      return { 
        address, icon: wallet.icon, signature,
        playerName: this.playerName, hasName: this.hasName
      };

    } catch (error) {
      console.error('[V5.1] âŒ FAILED:', error.message, 'Code:', error.code);
      throw new Error(error.code === 4001 ? 'Connection rejected' : error.message);
    }
  }

  isBaseApp(wallet) {
    const p = wallet.provider;
    return p?.isCoinbaseWallet === true || p?.isBaseWallet === true || wallet.name === 'Coinbase Wallet';
  }

  async requestSignature(provider, address) {
    try {
      const timestamp = Date.now();
      
      // Wait for ethers.js
      if (typeof window.ethers === 'undefined') {
        console.log('[Wallet] Waiting for ethers.js...');
        await new Promise(resolve => setTimeout(resolve, 500));
        if (typeof window.ethers === 'undefined') {
          throw new Error('ethers.js not loaded');
        }
      }
      
      // IMPORTANT: Use checksum address (EIP-55) for SIWE
      const checksumAddress = window.ethers.utils.getAddress(address);
      
      const domain = window.location.host;
      const uri = window.location.origin;
      
      // Get chainId
      let chainIdNumeric = 8453;
      try {
        const chainIdRaw = await provider.request({ method: 'eth_chainId' });
        chainIdNumeric = typeof chainIdRaw === 'string' ? parseInt(chainIdRaw, 16) : chainIdRaw;
      } catch (e) {
        console.log('[Wallet] Using default chainId 8453');
      }
      
      // Generate nonce (minimum 8 characters, alphanumeric)
      const nonce = Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
      
      // ISO 8601 format
      const issuedAt = new Date(timestamp).toISOString();
      
      // Statement
      const statement = 'Sign in to Base 2048';
      
      // Create SIWE message according to EIP-4361
      // CRITICAL: Address must be in checksum format (EIP-55)
      const message = `${domain} wants you to sign in with your Ethereum account:
${checksumAddress}

${statement}

URI: ${uri}
Version: 1
Chain ID: ${chainIdNumeric}
Nonce: ${nonce}
Issued At: ${issuedAt}`;

      console.log('[Wallet] ========================================');
      console.log('[Wallet] SIWE Message:');
      console.log(message);
      console.log('[Wallet] ========================================');
      
      // personal_sign expects lowercase address
      const addressLower = address.toLowerCase();
      
      const signature = await provider.request({
        method: 'personal_sign',
        params: [message, addressLower]
      });

      console.log('[Wallet] ✓ Signature obtained:', signature.substring(0, 20) + '...');
      
      return { 
        signature, 
        message, 
        address: addressLower, 
        timestamp, 
        nonce 
      };

    } catch (error) {
      console.error('[Wallet] ✗ Signature failed:', error.message, error.code);
      if (error.code === 4001) throw new Error('Signature rejected by user');
      throw error;
    }
  }


  async checkPlayerName(address) {
    try {
      const name = await contractManager.getPlayerName(address);
      this.playerName = name || null;
      this.hasName = !!name;
      return { playerName: this.playerName, hasName: this.hasName };
    } catch (error) {
      this.playerName = null;
      this.hasName = false;
      return { playerName: null, hasName: false };
    }
  }

  async switchToBaseChain(provider, currentChainId) {
    const baseChainId = '0x2105';
    if (currentChainId === baseChainId) return;

    try {
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: baseChainId }],
      });
    } catch (switchError) {
      if (switchError.code === 4902) {
        await provider.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: baseChainId, chainName: 'Base',
            nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
            rpcUrls: ['https://mainnet.base.org'],
            blockExplorerUrls: ['https://basescan.org']
          }]
        });
      } else throw switchError;
    }
  }

  async disconnect() {
    if (this.walletConnectProvider && this.currentProvider === this.walletConnectProvider) {
      await this.walletConnectProvider.disconnect();
    }
    if (this.currentProvider) this.unsubscribeFromEvents(this.currentProvider);
    
    this.connectedWallet = null;
    this.currentProvider = null;
    this.isAuthenticated = false;
    this.playerName = null;
    this.hasName = false;
    this.clearConnection();
    return true;
  }

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
      window.dispatchEvent(new CustomEvent('walletAccountChanged', { detail: { address: accounts[0] } }));
    }
  }

  handleChainChanged() {
    window.location.reload();
  }

  handleDisconnect() {
    this.disconnect();
    window.dispatchEvent(new CustomEvent('walletDisconnected'));
  }

  saveConnection(address, walletName, signatureData = null) {
    const data = { address, walletName, timestamp: Date.now() };
    if (signatureData) {
      data.signature = signatureData.signature;
      data.signatureTimestamp = signatureData.timestamp;
      data.nonce = signatureData.nonce;
    }
    localStorage.setItem('2048-wallet', JSON.stringify(data));
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

      if (Date.now() - timestamp > 24 * 60 * 60 * 1000) {
        this.clearConnection();
        return null;
      }

      if (!signature || !signatureTimestamp || Date.now() - signatureTimestamp > 7 * 24 * 60 * 60 * 1000) {
        this.clearConnection();
        return null;
      }

      for (let [, wallet] of this.availableProviders) {
        if (wallet.name === walletName) {
          try {
            const provider = wallet.provider;
            const accounts = await provider.request({ method: 'eth_accounts' });
            if (accounts && accounts[0] && accounts[0].toLowerCase() === address.toLowerCase()) {
              return await this.restoreConnection(accounts[0], provider, wallet);
            }
          } catch (err) {}
        }
      }

      this.clearConnection();
      return null;
    } catch (error) {
      this.clearConnection();
      return null;
    }
  }

  async restoreConnection(address, provider, wallet) {
    this.connectedWallet = address;
    this.currentProvider = provider;
    this.isAuthenticated = true;
    this.subscribeToEvents(provider);
    await contractManager.init(provider);
    await this.checkPlayerName(address);
    return { address, icon: wallet.icon, playerName: this.playerName, hasName: this.hasName };
  }

  getAvailableWallets() {
    return Array.from(this.availableProviders.values());
  }

  isConnected() {
    return this.isAuthenticated && this.connectedWallet !== null;
  }

  getAddress() {
    return this.connectedWallet;
  }

  getSignature() {
    const saved = localStorage.getItem('2048-wallet');
    if (!saved) return null;
    try {
      const data = JSON.parse(saved);
      if (data.signature) {
        return { signature: data.signature, timestamp: data.signatureTimestamp, nonce: data.nonce, address: data.address };
      }
    } catch (error) {}
    return null;
  }

  isSignatureValid() {
    const sig = this.getSignature();
    return sig && (Date.now() - sig.timestamp) < 7 * 24 * 60 * 60 * 1000;
  }

  formatAddress(address) {
    return address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '';
  }

  getPlayerName() {
    return this.playerName;
  }

  hasPlayerName() {
    return this.hasName;
  }

  async mintPlayerName(name) {
    if (!this.isConnected()) throw new Error('Wallet not connected');
    const result = await contractManager.mintName(name, this.connectedWallet);
    this.playerName = result.name;
    this.hasName = true;
    this.updateStoredPlayerName(result.name);
    return result;
  }

  async checkNameAvailability(name) {
    return await contractManager.isNameAvailable(name);
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