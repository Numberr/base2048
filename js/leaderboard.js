// === Leaderboard UI Component ===
import { backendAPI } from './backend-api.js';

let leaderboardContainer = null;
let leaderboardModal = null;
let refreshInterval = null;
let cachedLeaderboard = null;

/**
 * Initialize leaderboard on start screen
 */
export async function initLeaderboard() {
  createLeaderboardUI();
  createLeaderboardModal();
  await loadLeaderboard();
  
  // Auto-refresh every 30 seconds
  refreshInterval = setInterval(() => {
    loadLeaderboard();
  }, 30000);
}

/**
 * Stop auto-refresh
 */
export function stopLeaderboard() {
  if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = null;
  }
}

/**
 * Create compact top-3 leaderboard UI
 */
function createLeaderboardUI() {
  const startScreen = document.getElementById('startScreen');
  if (!startScreen) return;
  
  if (document.getElementById('leaderboardContainer')) return;
  
  leaderboardContainer = document.createElement('div');
  leaderboardContainer.id = 'leaderboardContainer';
  leaderboardContainer.className = 'leaderboard-container';
  leaderboardContainer.innerHTML = `
    <div class="personal-best hidden" id="personalBest">
      <div class="personal-best-label">Your Best Score</div>
      <div class="personal-best-value" id="personalBestValue">-</div>
      <div class="personal-best-rank" id="personalBestRank"></div>
    </div>
    <div class="leaderboard-header">
      <h3>🏆 Top Players</h3>
    </div>
    <div class="leaderboard-list-compact" id="leaderboardListCompact">
      <div class="leaderboard-loading">
        <div class="spinner"></div>
        <p>Loading...</p>
      </div>
    </div>
    <button class="view-more-btn" id="viewMoreBtn">
      View More
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M4 6L8 10L12 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>
  `;
  
  startScreen.appendChild(leaderboardContainer);
  
  // Add view more button handler
  const viewMoreBtn = document.getElementById('viewMoreBtn');
  if (viewMoreBtn) {
    viewMoreBtn.addEventListener('click', () => {
      openLeaderboardModal();
    });
  }
}

/**
 * Create full leaderboard modal
 */
function createLeaderboardModal() {
  leaderboardModal = document.createElement('div');
  leaderboardModal.className = 'overlay leaderboard-modal hidden';
  leaderboardModal.innerHTML = `
    <div class="modal leaderboard-modal-content">
      <div class="wallet-modal-header">
        <h2>🏆 Leaderboard</h2>
        <button class="close-modal-btn" id="closeLeaderboardModal">×</button>
      </div>
      <div class="leaderboard-modal-body">
        <div class="personal-best-modal hidden" id="personalBestModal">
          <div class="personal-best-label">Your Best Score</div>
          <div class="personal-best-value" id="personalBestValueModal">-</div>
          <div class="personal-best-rank" id="personalBestRankModal"></div>
        </div>
        <div class="leaderboard-list-full" id="leaderboardListFull">
          <div class="leaderboard-loading">
            <div class="spinner"></div>
            <p>Loading...</p>
          </div>
        </div>
      </div>
      <div class="leaderboard-modal-footer">
        <button class="leaderboard-refresh-btn" id="refreshLeaderboardModal">
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
            <path d="M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C12.7614 3 15.1307 4.62886 16.2426 7M16 3V7H12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Refresh
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(leaderboardModal);
  
  // Close button
  const closeBtn = document.getElementById('closeLeaderboardModal');
  closeBtn.addEventListener('click', closeLeaderboardModal);
  
  // Close on overlay click
  leaderboardModal.addEventListener('click', (e) => {
    if (e.target === leaderboardModal) {
      closeLeaderboardModal();
    }
  });
  
  // Refresh button
  const refreshBtn = document.getElementById('refreshLeaderboardModal');
  refreshBtn.addEventListener('click', async () => {
    refreshBtn.classList.add('spinning');
    await loadLeaderboard();
    setTimeout(() => refreshBtn.classList.remove('spinning'), 500);
  });
}

/**
 * Open leaderboard modal
 */
function openLeaderboardModal() {
  if (!leaderboardModal) return;
  
  leaderboardModal.classList.remove('hidden');
  
  // Populate with cached data
  if (cachedLeaderboard && cachedLeaderboard.length > 0) {
    renderFullLeaderboard(cachedLeaderboard);
    updatePersonalBestModal();
  }
}

/**
 * Close leaderboard modal
 */
function closeLeaderboardModal() {
  if (leaderboardModal) {
    leaderboardModal.classList.add('hidden');
  }
}

/**
 * Update personal best in compact view
 */
async function updatePersonalBest() {
  const personalBestEl = document.getElementById('personalBest');
  const personalBestValue = document.getElementById('personalBestValue');
  const personalBestRank = document.getElementById('personalBestRank');
  
  if (!personalBestEl || !personalBestValue || !personalBestRank) return;
  
  try {
    const { walletManager } = await import('./wallet.js');
    
    if (!walletManager.isConnected()) {
      personalBestEl.classList.add('hidden');
      return;
    }
    
    const address = walletManager.getAddress();
    const playerScore = await backendAPI.getPlayerScore(address);
    
    if (playerScore && playerScore.bestScore > 0) {
      personalBestValue.textContent = playerScore.bestScore.toLocaleString();
      if (playerScore.rank) {
        personalBestRank.textContent = `Rank #${playerScore.rank}`;
      } else {
        personalBestRank.textContent = '';
      }
      personalBestEl.classList.remove('hidden');
    } else {
      personalBestEl.classList.add('hidden');
    }
    
  } catch (error) {
    console.error('[Leaderboard] Error updating personal best:', error);
    personalBestEl.classList.add('hidden');
  }
}

/**
 * Update personal best in modal
 */
async function updatePersonalBestModal() {
  const personalBestModalEl = document.getElementById('personalBestModal');
  const personalBestValueModal = document.getElementById('personalBestValueModal');
  const personalBestRankModal = document.getElementById('personalBestRankModal');
  
  if (!personalBestModalEl || !personalBestValueModal || !personalBestRankModal) return;
  
  try {
    const { walletManager } = await import('./wallet.js');
    
    if (!walletManager.isConnected()) {
      personalBestModalEl.classList.add('hidden');
      return;
    }
    
    const address = walletManager.getAddress();
    const playerScore = await backendAPI.getPlayerScore(address);
    
    if (playerScore && playerScore.bestScore > 0) {
      personalBestValueModal.textContent = playerScore.bestScore.toLocaleString();
      if (playerScore.rank) {
        personalBestRankModal.textContent = `Rank #${playerScore.rank}`;
      } else {
        personalBestRankModal.textContent = '';
      }
      personalBestModalEl.classList.remove('hidden');
    } else {
      personalBestModalEl.classList.add('hidden');
    }
    
  } catch (error) {
    console.error('[Leaderboard] Error updating personal best in modal:', error);
    personalBestModalEl.classList.add('hidden');
  }
}

/**
 * Load and display leaderboard
 */
async function loadLeaderboard() {
  const leaderboardListCompact = document.getElementById('leaderboardListCompact');
  
  try {
    console.log('[Leaderboard] Fetching...');
    
    const players = await backendAPI.getLeaderboard(10);
    
    // Cache full leaderboard
    cachedLeaderboard = players;
    
    if (!players || players.length === 0) {
      if (leaderboardListCompact) {
        leaderboardListCompact.innerHTML = `
          <div class="leaderboard-empty">
            <p>No players yet</p>
            <p class="leaderboard-info">Be the first!</p>
          </div>
        `;
      }
      return;
    }
    
    // Render top-3 in compact view
    if (leaderboardListCompact) {
      renderCompactLeaderboard(players.slice(0, 3));
    }
    
    // If modal is open, update it
    if (leaderboardModal && !leaderboardModal.classList.contains('hidden')) {
      renderFullLeaderboard(players);
      updatePersonalBestModal();
    }
    
    console.log('[Leaderboard] ✓ Displayed', players.length, 'players');
    
    // Update personal best
    await updatePersonalBest();
    
  } catch (error) {
    console.error('[Leaderboard] Error:', error);
    
    if (leaderboardListCompact) {
      leaderboardListCompact.innerHTML = `
        <div class="leaderboard-error">
          <p>⚠️ Unable to load</p>
          <p class="leaderboard-info">Server offline</p>
        </div>
      `;
    }
  }
}

/**
 * Render compact top-3
 */
function renderCompactLeaderboard(players) {
  const leaderboardListCompact = document.getElementById('leaderboardListCompact');
  if (!leaderboardListCompact) return;
  
  leaderboardListCompact.innerHTML = players.map(player => `
    <div class="leaderboard-item-compact rank-${player.rank}">
      <div class="compact-rank">${getRankDisplay(player.rank)}</div>
      <div class="compact-info">
        <div class="compact-name">${escapeHtml(player.playerName)}</div>
        <div class="compact-score">${player.bestScore.toLocaleString()}</div>
      </div>
    </div>
  `).join('');
}

/**
 * Render full leaderboard in modal
 */
function renderFullLeaderboard(players) {
  const leaderboardListFull = document.getElementById('leaderboardListFull');
  if (!leaderboardListFull) return;
  
  if (!players || players.length === 0) {
    leaderboardListFull.innerHTML = `
      <div class="leaderboard-empty">
        <p>No players yet</p>
        <p class="leaderboard-info">Be the first!</p>
      </div>
    `;
    return;
  }
  
  leaderboardListFull.innerHTML = players.map(player => `
    <div class="leaderboard-item ${player.rank <= 3 ? `rank-${player.rank}` : ''}">
      <div class="leaderboard-rank">${getRankDisplay(player.rank)}</div>
      <div class="leaderboard-name">${escapeHtml(player.playerName)}</div>
      <div class="leaderboard-score">${player.bestScore.toLocaleString()}</div>
    </div>
  `).join('');
}

/**
 * Get rank display
 */
function getRankDisplay(rank) {
  switch(rank) {
    case 1: return '🥇';
    case 2: return '🥈';
    case 3: return '🥉';
    default: return `#${rank}`;
  }
}

/**
 * Escape HTML
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Manual refresh
 */
export async function refreshLeaderboard() {
  await loadLeaderboard();
}