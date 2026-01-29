// === Mobile Debug Overlay ===
// Shows console logs on screen for mobile debugging

class DebugOverlay {
    constructor() {
      this.logs = [];
      this.maxLogs = 15;
      this.overlay = null;
      this.isVisible = false;
      this.init();
    }
  
    init() {
      // Create overlay container
      this.overlay = document.createElement('div');
      this.overlay.id = 'debug-overlay';
      this.overlay.style.cssText = `
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        max-height: 50vh;
        background: rgba(0, 0, 0, 0.95);
        color: #00ff00;
        font-family: 'Courier New', monospace;
        font-size: 11px;
        padding: 10px;
        overflow-y: auto;
        z-index: 9999;
        display: none;
        border-top: 2px solid #00ff00;
      `;
      
      document.body.appendChild(this.overlay);
      
      // Create toggle button
      const toggleBtn = document.createElement('button');
      toggleBtn.innerHTML = '🐛';
      toggleBtn.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        background: rgba(0, 0, 0, 0.8);
        border: 2px solid #00ff00;
        color: #00ff00;
        font-size: 24px;
        cursor: pointer;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0, 255, 0, 0.3);
      `;
      
      toggleBtn.addEventListener('click', () => this.toggle());
      document.body.appendChild(toggleBtn);
      
      // Intercept console methods
      this.interceptConsole();
    }
  
    interceptConsole() {
      const methods = ['log', 'warn', 'error', 'info'];
      
      methods.forEach(method => {
        const original = console[method];
        console[method] = (...args) => {
          // Call original
          original.apply(console, args);
          
          // Add to overlay
          const message = args.map(arg => {
            if (typeof arg === 'object') {
              try {
                return JSON.stringify(arg, null, 2);
              } catch (e) {
                return String(arg);
              }
            }
            return String(arg);
          }).join(' ');
          
          this.addLog(method, message);
        };
      });
    }
  
    addLog(type, message) {
      const timestamp = new Date().toLocaleTimeString();
      const color = {
        log: '#00ff00',
        warn: '#ffaa00',
        error: '#ff0000',
        info: '#00aaff'
      }[type] || '#00ff00';
      
      this.logs.push({ timestamp, type, message, color });
      
      // Keep only last N logs
      if (this.logs.length > this.maxLogs) {
        this.logs.shift();
      }
      
      this.render();
    }
  
    render() {
      if (!this.isVisible) return;
      
      this.overlay.innerHTML = this.logs.map(log => `
        <div style="margin-bottom: 8px; border-bottom: 1px solid #333; padding-bottom: 4px;">
          <span style="color: #666;">[${log.timestamp}]</span>
          <span style="color: ${log.color}; font-weight: bold;">[${log.type.toUpperCase()}]</span>
          <pre style="margin: 4px 0 0 0; white-space: pre-wrap; word-break: break-all; color: ${log.color};">${log.message}</pre>
        </div>
      `).join('');
      
      // Auto-scroll to bottom
      this.overlay.scrollTop = this.overlay.scrollHeight;
    }
  
    toggle() {
      this.isVisible = !this.isVisible;
      this.overlay.style.display = this.isVisible ? 'block' : 'none';
      if (this.isVisible) {
        this.render();
      }
    }
  
    clear() {
      this.logs = [];
      this.render();
    }
  }
  
  // Initialize debug overlay
  const debugOverlay = new DebugOverlay();
  
  // Expose to window for manual control
  window.debugOverlay = debugOverlay;
  
  console.log('[Debug] Debug overlay initialized. Click 🐛 button to toggle.');