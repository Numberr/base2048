// === UI Integration for Wallet Connection ===
import { walletManager } from './wallet.js';
import { NAME_RULES } from './contract.js';

// UI Elements
let walletButton = null;
let walletModal = null;
let walletList = null;
let nameRegistrationModal = null;

// Initialize wallet UI
export async function initWalletUI() {
  createWalletButton();
  createWalletModal();
  createNameRegistrationModal();
  
  // Detect wallets
  await walletManager.detectWallets();
  
  // Try to restore previous connection
  const restored = await walletManager.checkExistingConnection();
  if (restored) {
    updateWalletButton(restored.address, restored.icon);
    updatePlayButtonState();
  }
  
  // Listen for wallet events
  window.addEventListener('walletDisconnected', handleWalletDisconnect);
  window.addEventListener('walletAccountChanged', handleAccountChange);
  
  // Initialize leaderboard
  try {
    const { initLeaderboard } = await import('./leaderboard.js');
    await initLeaderboard();
  } catch (error) {
    console.error('[WalletUI] Leaderboard initialization failed:', error.message);
  }
}

// Create wallet connect button
function createWalletButton() {
  walletButton = document.createElement('button');
  walletButton.className = 'wallet-btn wallet-btn--primary';
  walletButton.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M17.5 6.25H5C4.30964 6.25 3.75 6.80964 3.75 7.5V15C3.75 15.6904 4.30964 16.25 5 16.25H17.5C18.1904 16.25 18.75 15.6904 18.75 15V7.5C18.75 6.80964 18.1904 6.25 17.5 6.25Z" stroke="currentColor" stroke-width="1.5"/>
      <path d="M13.75 11.25C13.75 11.9404 13.1904 12.5 12.5 12.5C11.8096 12.5 11.25 11.9404 11.25 11.25C11.25 10.5596 11.8096 10 12.5 10C13.1904 10 13.75 10.5596 13.75 11.25Z" fill="currentColor"/>
      <path d="M5 6.25V5C5 4.30964 5.55964 3.75 6.25 3.75H15C15.6904 3.75 16.25 4.30964 16.25 5V6.25" stroke="currentColor" stroke-width="1.5"/>
    </svg>
    <span>Connect Wallet</span>
  `;
  walletButton.addEventListener('click', openWalletModal);
  
  // Place on start screen
  const startScreen = document.getElementById('startScreen');
  const playBtn = startScreen?.querySelector('.primary-btn');
  if (startScreen && playBtn) {
    // Create actions container if it doesn't exist
    let actions = startScreen.querySelector('.start-actions');
    if (!actions) {
      actions = document.createElement('div');
      actions.className = 'start-actions';
      playBtn.parentNode.insertBefore(actions, playBtn);
    }
    
    // Add both buttons to actions
    actions.appendChild(walletButton);
    actions.appendChild(playBtn);
    return;
  }

  // Fallback: floating button
  walletButton.classList.add('wallet-btn--floating');
  document.body.appendChild(walletButton);
}

// Create wallet selection modal
function createWalletModal() {
  walletModal = document.createElement('div');
  walletModal.className = 'overlay wallet-modal hidden';
  walletModal.innerHTML = `
    <div class="modal wallet-modal-content">
      <div class="wallet-modal-header">
        <h2>Connect Wallet</h2>
        <button class="close-modal-btn" id="closeWalletModal">×</button>
      </div>
      <div class="wallet-list" id="walletList">
        <div class="wallet-loading">
          <div class="spinner"></div>
          <p>Detecting wallets...</p>
        </div>
      </div>
      <div class="wallet-modal-footer">
        <p class="wallet-info-text">Connect to Base blockchain</p>
      </div>
    </div>
  `;
  
  document.body.appendChild(walletModal);
  
  // Close button
  const closeBtn = walletModal.querySelector('#closeWalletModal');
  closeBtn.addEventListener('click', closeWalletModal);
  
  // Close on overlay click
  walletModal.addEventListener('click', (e) => {
    if (e.target === walletModal) {
      closeWalletModal();
    }
  });
  
  walletList = walletModal.querySelector('#walletList');
}

// Open wallet modal
async function openWalletModal() {
  // If already connected, show disconnect option
  if (walletManager.isConnected()) {
    showConnectedOptions();
    return;
  }
  
  walletModal.classList.remove('hidden');
  populateWalletList();
}

// Close wallet modal
function closeWalletModal() {
  walletModal.classList.add('hidden');
}

// Populate wallet list
function populateWalletList() {
  const wallets = walletManager.getAvailableWallets();
  
  if (wallets.length === 0) {
    walletList.innerHTML = `
      <div class="no-wallets">
        <p>No wallets detected</p>
        <p class="wallet-info-text">Please install MetaMask or another Web3 wallet</p>
      </div>
    `;
    return;
  }
  
  walletList.innerHTML = wallets.map(wallet => `
    <button class="wallet-option" data-wallet-id="${wallet.info.uuid}">
      <img src="${wallet.icon}" alt="${wallet.name}" class="wallet-icon">
      <span class="wallet-name">${wallet.name}</span>
      <svg class="wallet-arrow" width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M7.5 5L12.5 10L7.5 15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
    </button>
  `).join('');
  
  // Add click handlers
  walletList.querySelectorAll('.wallet-option').forEach(btn => {
    btn.addEventListener('click', async () => {
      const walletId = btn.dataset.walletId;
      const wallet = wallets.find(w => w.info.uuid === walletId);
      if (wallet) {
        await connectWallet(wallet);
      }
    });
  });
}

// Create name registration modal
function createNameRegistrationModal() {
  nameRegistrationModal = document.createElement('div');
  nameRegistrationModal.className = 'overlay name-registration-modal hidden';
  nameRegistrationModal.innerHTML = `
    <div class="modal name-modal-content">
      <div class="wallet-modal-header">
        <h2>Register Player Name</h2>
        <button class="close-modal-btn" id="closeNameModal">×</button>
      </div>
      
      <div class="name-registration-body">
        <div class="name-status" id="nameStatus">
          <p class="name-requirements">
            <strong>Name requirements:</strong><br>
            • 3-16 characters<br>
            • Only lowercase letters (a-z)<br>
            • No spaces or special characters
          </p>
        </div>
        
        <div class="name-input-container">
          <input 
            type="text" 
            id="playerNameInput" 
            class="name-input" 
            placeholder="Enter your name" 
            maxlength="16"
            autocomplete="off"
            spellcheck="false"
          />
          <div class="name-validation" id="nameValidation"></div>
        </div>
        
        <button class="mint-name-btn" id="mintNameBtn" disabled>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M10 5V15M5 10H15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          Mint Name
        </button>
        
        <div class="name-info">
          <p>This will create a transaction on Base network.</p>
          <p>You'll need a small amount of ETH for gas fees.</p>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(nameRegistrationModal);
  
  // Close button
  const closeBtn = nameRegistrationModal.querySelector('#closeNameModal');
  closeBtn.addEventListener('click', closeNameModal);
  
  // Close on overlay click
  nameRegistrationModal.addEventListener('click', (e) => {
    if (e.target === nameRegistrationModal) {
      closeNameModal();
    }
  });
  
  // Name input validation
  const nameInput = nameRegistrationModal.querySelector('#playerNameInput');
  const nameValidation = nameRegistrationModal.querySelector('#nameValidation');
  const mintBtn = nameRegistrationModal.querySelector('#mintNameBtn');
  
  let debounceTimer;
  nameInput.addEventListener('input', async (e) => {
    const value = e.target.value.toLowerCase();
    e.target.value = value; // Force lowercase
    
    clearTimeout(debounceTimer);
    
    // Clear validation
    nameValidation.textContent = '';
    nameValidation.className = 'name-validation';
    mintBtn.disabled = true;
    
    if (!value) return;
    
    // Validate format
    const validation = walletManager.validateName(value);
    
    if (!validation.valid) {
      nameValidation.textContent = validation.error;
      nameValidation.className = 'name-validation error';
      return;
    }
    
    // Show checking state
    nameValidation.textContent = 'Checking availability...';
    nameValidation.className = 'name-validation checking';
    
    // Check availability with debounce
    debounceTimer = setTimeout(async () => {
      try {
        const available = await walletManager.checkNameAvailability(validation.name);
        
        if (available) {
          nameValidation.textContent = '✓ Name is available!';
          nameValidation.className = 'name-validation success';
          mintBtn.disabled = false;
        } else {
          nameValidation.textContent = '✗ Name is already taken';
          nameValidation.className = 'name-validation error';
          mintBtn.disabled = true;
        }
      } catch (error) {
        nameValidation.textContent = 'Error checking availability';
        nameValidation.className = 'name-validation error';
        mintBtn.disabled = true;
      }
    }, 500);
  });
  
  // Mint button
  mintBtn.addEventListener('click', async () => {
    const name = nameInput.value.trim().toLowerCase();
    if (!name) return;
    
    await mintPlayerName(name);
  });
}

// Open name registration modal
function openNameModal() {
  if (!nameRegistrationModal) {
    createNameRegistrationModal();
  }
  
  // Reset form
  const nameInput = nameRegistrationModal.querySelector('#playerNameInput');
  const nameValidation = nameRegistrationModal.querySelector('#nameValidation');
  const mintBtn = nameRegistrationModal.querySelector('#mintNameBtn');
  
  nameInput.value = '';
  nameValidation.textContent = '';
  nameValidation.className = 'name-validation';
  mintBtn.disabled = true;
  
  nameRegistrationModal.classList.remove('hidden');
  
  // Focus input
  setTimeout(() => nameInput.focus(), 100);
}

// Close name registration modal
function closeNameModal() {
  if (nameRegistrationModal) {
    nameRegistrationModal.classList.add('hidden');
  }
}

// Mint player name
async function mintPlayerName(name) {
  const nameStatus = nameRegistrationModal.querySelector('#nameStatus');
  const mintBtn = nameRegistrationModal.querySelector('#mintNameBtn');
  
  try {
    // Show minting state
    nameStatus.innerHTML = `
      <div class="wallet-loading">
        <div class="spinner"></div>
        <p>Minting name "${name}"...</p>
        <p class="wallet-info-text">Please confirm the transaction in your wallet</p>
      </div>
    `;
    mintBtn.disabled = true;
    
    const result = await walletManager.mintPlayerName(name);
    
    // Show success
    nameStatus.innerHTML = `
      <div class="name-success">
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
          <circle cx="24" cy="24" r="24" fill="#10B981" opacity="0.2"/>
          <path d="M14 24L20 30L34 16" stroke="#10B981" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <h3>Name Minted Successfully!</h3>
        <p class="minted-name">${result.name}</p>
        <p class="tx-hash">
          Transaction: <a href="https://basescan.org/tx/${result.txHash}" target="_blank" rel="noopener">
            ${result.txHash.slice(0, 10)}...${result.txHash.slice(-8)}
          </a>
        </p>
      </div>
    `;
    
    // Update UI
    updatePlayButtonState();
    
    // Close modal after delay
    setTimeout(() => {
      closeNameModal();
      showNotification('Name registered successfully!', 'success');
    }, 3000);
    
  } catch (error) {
    console.error('[NameUI] Minting failed:', error);
    
    let errorMsg = error.message || 'Failed to mint name';
    
    nameStatus.innerHTML = `
      <div class="name-error">
        <p class="error-message">${errorMsg}</p>
        <button class="secondary-btn" onclick="this.closest('.name-status').querySelector('.name-requirements').style.display='block'; this.parentElement.remove();">
          Try Again
        </button>
      </div>
    `;
    
    showNotification(errorMsg, 'error');
  }
}

// Update Play button state based on name registration
function updatePlayButtonState() {
  const playBtn = document.querySelector('.primary-btn');
  const startScreen = document.getElementById('startScreen');
  
  console.log('[WalletUI] updatePlayButtonState called');
  console.log('[WalletUI] playBtn:', !!playBtn);
  console.log('[WalletUI] startScreen:', !!startScreen);
  
  if (!playBtn || !startScreen) {
    console.log('[WalletUI] Missing elements, exiting');
    return;
  }
  
  const hasName = walletManager.hasPlayerName();
  const playerName = walletManager.getPlayerName();
  const isConnected = walletManager.isConnected();
  
  console.log('[WalletUI] isConnected:', isConnected);
  console.log('[WalletUI] hasName:', hasName);
  console.log('[WalletUI] playerName:', playerName);
  
  // Find or create name button container
  let nameButtonContainer = startScreen.querySelector('.name-button-container');
  if (!nameButtonContainer) {
    nameButtonContainer = document.createElement('div');
    nameButtonContainer.className = 'name-button-container';
    
    const actions = startScreen.querySelector('.start-actions');
    if (actions) {
      actions.parentNode.insertBefore(nameButtonContainer, actions);
    } else {
      playBtn.parentNode.insertBefore(nameButtonContainer, playBtn);
    }
  }
  
  if (!isConnected) {
    // Not connected - hide name info, enable play
    console.log('[WalletUI] State: Not connected');
    playBtn.disabled = false;
    playBtn.textContent = 'Play';
    playBtn.style.opacity = '';
    playBtn.style.cursor = '';
    nameButtonContainer.innerHTML = '';
    return;
  }
  
  if (hasName) {
    // Has name - show name and enable play
    console.log('[WalletUI] State: Has name');
    playBtn.disabled = false;
    playBtn.textContent = 'Play';
    playBtn.style.opacity = '';
    playBtn.style.cursor = '';
    nameButtonContainer.innerHTML = `
      <div class="player-name-display">
        <div class="name-label">Playing as</div>
        <div class="name-value">${playerName}</div>
      </div>
    `;
  } else {
    // No name - disable play and show mint button
    console.log('[WalletUI] State: No name - showing register button');
    playBtn.disabled = true;
    playBtn.textContent = 'Play (Name Required)';
    playBtn.style.opacity = '0.5';
    playBtn.style.cursor = 'not-allowed';
    
    nameButtonContainer.innerHTML = `
      <div class="name-required-notice">
        <p>⚠️ You need to register a player name before playing</p>
        <button class="mint-name-trigger-btn" id="mintNameTrigger">
          Register Name
        </button>
      </div>
    `;
    
    // Add event listener to trigger button
    const mintTrigger = document.getElementById('mintNameTrigger');
    console.log('[WalletUI] Mint trigger button found:', !!mintTrigger);
    if (mintTrigger) {
      mintTrigger.addEventListener('click', () => {
        console.log('[WalletUI] Register Name button clicked');
        openNameModal();
      });
    }
  }
}

// Connect to wallet
// Connect to wallet
async function connectWallet(wallet) {
  try {
    console.log('[WalletUI] Starting connection to', wallet.name);
    
    // Show initial loading state
    walletList.innerHTML = `
      <div class="wallet-loading">
        <div class="spinner"></div>
        <p>Connecting to ${wallet.name}...</p>
      </div>
    `;
    
    // Start connection process
    const connectionPromise = walletManager.connect(wallet);
    
    // Wait a bit to show "requesting signature" message
    setTimeout(() => {
      if (walletList.querySelector('.wallet-loading')) {
        walletList.innerHTML = `
          <div class="wallet-loading">
            <div class="spinner"></div>
            <p>Please sign the message in your wallet...</p>
            <p class="wallet-info-text" style="margin-top: 12px;">
              This verifies wallet ownership without any fees
            </p>
          </div>
        `;
      }
    }, 1000);
    
    const result = await connectionPromise;
    
    console.log('[WalletUI] Connection result:', result);
    console.log('[WalletUI] Has name:', result.hasName);
    
    updateWalletButton(result.address, result.icon);
    updatePlayButtonState();
    closeWalletModal();
    
    // Show success message with name status
    let message = 'Wallet connected and authenticated!';
    if (result.hasName) {
      message += `\nPlaying as: ${result.playerName}`;
    } else {
      message = 'Wallet connected! Please register a player name to play.';
    }
    
    showNotification(message, 'success');
    
  } catch (error) {
    console.error('[WalletUI] Connection failed:', error);
    
    // Specific error messages
    let errorMsg = error.message || 'Failed to connect wallet';
    if (error.message.includes('Signature rejected')) {
      errorMsg = 'Signature required for authentication';
    }
    
    showNotification(errorMsg, 'error');
    populateWalletList(); // Restore wallet list
  }
}

// Update wallet button to show connected state
function updateWalletButton(address, icon) {
  const formattedAddress = walletManager.formatAddress(address);
  walletButton.innerHTML = `
    <img src="${icon}" alt="Wallet" class="wallet-icon-small">
    <span>${formattedAddress}</span>
  `;
  walletButton.classList.add('connected');
}

// Show disconnect options
function showConnectedOptions() {
  walletList.innerHTML = `
    <div class="connected-wallet-info">
      <div class="connected-address">
        <p class="label">Connected Address</p>
        <p class="address">${walletManager.formatAddress(walletManager.getAddress())}</p>
      </div>
      <button class="disconnect-btn" id="disconnectWallet">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M7.5 6.25V5C7.5 4.30964 8.05964 3.75 8.75 3.75H15C15.6904 3.75 16.25 4.30964 16.25 5V15C16.25 15.6904 15.6904 16.25 15 16.25H8.75C8.05964 16.25 7.5 15.6904 7.5 15V13.75" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          <path d="M12.5 10H3.75M3.75 10L6.25 7.5M3.75 10L6.25 12.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        Disconnect Wallet
      </button>
    </div>
  `;
  
  walletModal.classList.remove('hidden');
  
  const disconnectBtn = document.getElementById('disconnectWallet');
  disconnectBtn.addEventListener('click', async () => {
    await walletManager.disconnect();
    handleWalletDisconnect();
    closeWalletModal();
  });
}

// Handle wallet disconnect
function handleWalletDisconnect() {
  walletButton.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M17.5 6.25H5C4.30964 6.25 3.75 6.80964 3.75 7.5V15C3.75 15.6904 4.30964 16.25 5 16.25H17.5C18.1904 16.25 18.75 15.6904 18.75 15V7.5C18.75 6.80964 18.1904 6.25 17.5 6.25Z" stroke="currentColor" stroke-width="1.5"/>
      <path d="M13.75 11.25C13.75 11.9404 13.1904 12.5 12.5 12.5C11.8096 12.5 11.25 11.9404 11.25 11.25C11.25 10.5596 11.8096 10 12.5 10C13.1904 10 13.75 10.5596 13.75 11.25Z" fill="currentColor"/>
      <path d="M5 6.25V5C5 4.30964 5.55964 3.75 6.25 3.75H15C15.6904 3.75 16.25 4.30964 16.25 5V6.25" stroke="currentColor" stroke-width="1.5"/>
    </svg>
    <span>Connect Wallet</span>
  `;
  walletButton.classList.remove('connected');
  updatePlayButtonState();
  showNotification('Wallet disconnected', 'info');
}

// Handle account change
function handleAccountChange(event) {
  const { address } = event.detail;
  const iconSrc = walletButton.querySelector('.wallet-icon-small')?.src || '';
  if (iconSrc) {
    updateWalletButton(address, iconSrc);
  }
  updatePlayButtonState();
  showNotification('Account changed', 'info');
}

// Show notification
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  // Trigger animation
  setTimeout(() => notification.classList.add('show'), 10);
  
  // Remove after 3 seconds
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Export for use in game.js
export { walletManager, openNameModal };