class Controls {
    constructor(game) {
        this.game = game;
        this.keys = {};
        this.touches = {};
        this.swipeThreshold = 50;
        this.swipeTimeout = 300;
        this.lastTouchStart = null;
        
        // Bind methods
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);
        this.handleTouchStart = this.handleTouchStart.bind(this);
        this.handleTouchMove = this.handleTouchMove.bind(this);
        this.handleTouchEnd = this.handleTouchEnd.bind(this);
        this.handleMouseDown = this.handleMouseDown.bind(this);
        
        // Initialize event listeners
        this.initializeEventListeners();
    }
    
    initializeEventListeners() {
        // Keyboard events
        document.addEventListener('keydown', this.handleKeyDown);
        document.addEventListener('keyup', this.handleKeyUp);
        
        // Touch events
        document.addEventListener('touchstart', this.handleTouchStart, { passive: false });
        document.addEventListener('touchmove', this.handleTouchMove, { passive: false });
        document.addEventListener('touchend', this.handleTouchEnd, { passive: false });
        
        // Mouse events (for desktop testing)
        document.addEventListener('mousedown', this.handleMouseDown);
        
        // Button events
        this.initializeButtonControls();
        
        // UI button events
        this.initializeUIControls();
        
        // Prevent context menu on long press
        document.addEventListener('contextmenu', (e) => {
            if (e.target.closest('#gameContainer')) {
                e.preventDefault();
            }
        });
    }
    
    initializeButtonControls() {
        // Touch control buttons
        const jumpBtn = document.getElementById('jumpBtn');
        const duckBtn = document.getElementById('duckBtn');
        
        if (jumpBtn) {
            jumpBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.jump();
            });
            jumpBtn.addEventListener('mousedown', (e) => {
                e.preventDefault();
                this.jump();
            });
        }
        
        if (duckBtn) {
            duckBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.duck();
            });
            duckBtn.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.stopDuck();
            });
            duckBtn.addEventListener('mousedown', (e) => {
                e.preventDefault();
                this.duck();
            });
            duckBtn.addEventListener('mouseup', (e) => {
                e.preventDefault();
                this.stopDuck();
            });
        }
    }
    
    initializeUIControls() {
        // Start button
        const startBtn = document.getElementById('startBtn');
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                if (this.game) {
                    this.game.startGame();
                }
            });
        }
        
        // Restart button
        const restartBtn = document.getElementById('restartBtn');
        if (restartBtn) {
            restartBtn.addEventListener('click', () => {
                if (this.game) {
                    this.game.restartGame();
                }
            });
        }
        
        // Pause button
        const pauseBtn = document.getElementById('pauseBtn');
        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => {
                if (this.game) {
                    this.game.pauseGame();
                    this.updatePauseButton();
                }
            });
        }
        
        // Sound button
        const soundBtn = document.getElementById('soundBtn');
        if (soundBtn) {
            soundBtn.addEventListener('click', () => {
                if (window.audioManager) {
                    window.audioManager.toggleAllAudio();
                }
            });
        }
        
        // Share button
        const shareBtn = document.getElementById('shareBtn');
        if (shareBtn) {
            shareBtn.addEventListener('click', () => {
                this.shareScore();
            });
        }
    }
    
    handleKeyDown(e) {
        // Prevent default behavior for game keys
        if (['Space', 'ArrowUp', 'ArrowDown', 'KeyW', 'KeyS'].includes(e.code)) {
            e.preventDefault();
        }
        
        this.keys[e.code] = true;
        
        // Handle game controls
        if (this.game && this.game.gameState === 'playing') {
            switch (e.code) {
                case 'Space':
                case 'ArrowUp':
                case 'KeyW':
                    this.jump();
                    break;
                case 'ArrowDown':
                case 'KeyS':
                    this.duck();
                    break;
            }
        }
        
        // Handle UI controls
        switch (e.code) {
            case 'Enter':
                if (this.game && this.game.gameState === 'start') {
                    this.game.startGame();
                } else if (this.game && this.game.gameState === 'gameOver') {
                    this.game.restartGame();
                }
                break;
            case 'Escape':
                if (this.game && (this.game.gameState === 'playing' || this.game.gameState === 'paused')) {
                    this.game.pauseGame();
                    this.updatePauseButton();
                }
                break;
            case 'KeyM':
                if (window.audioManager) {
                    window.audioManager.toggleAllAudio();
                }
                break;
        }
    }
    
    handleKeyUp(e) {
        this.keys[e.code] = false;
        
        // Handle duck release
        if (this.game && this.game.gameState === 'playing') {
            switch (e.code) {
                case 'ArrowDown':
                case 'KeyS':
                    this.stopDuck();
                    break;
            }
        }
    }
    
    handleTouchStart(e) {
        e.preventDefault();
        
        const touch = e.touches[0];
        const touchId = touch.identifier;
        
        this.touches[touchId] = {
            startX: touch.clientX,
            startY: touch.clientY,
            startTime: Date.now(),
            currentX: touch.clientX,
            currentY: touch.clientY
        };
        
        this.lastTouchStart = {
            x: touch.clientX,
            y: touch.clientY,
            time: Date.now()
        };
        
        // Simple tap to jump (if not swiping)
        if (this.game && this.game.gameState === 'playing') {
            // Don't jump immediately, wait to see if it's a swipe
            setTimeout(() => {
                const touchData = this.touches[touchId];
                if (touchData && !touchData.isSwipe) {
                    this.jump();
                }
            }, 100);
        }
    }
    
    handleTouchMove(e) {
        e.preventDefault();
        
        const touch = e.touches[0];
        const touchId = touch.identifier;
        
        if (this.touches[touchId]) {
            this.touches[touchId].currentX = touch.clientX;
            this.touches[touchId].currentY = touch.clientY;
            
            // Check for swipe
            const deltaX = touch.clientX - this.touches[touchId].startX;
            const deltaY = touch.clientY - this.touches[touchId].startY;
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            
            if (distance > this.swipeThreshold) {
                this.touches[touchId].isSwipe = true;
                
                // Determine swipe direction
                if (Math.abs(deltaY) > Math.abs(deltaX)) {
                    if (deltaY > 0) {
                        // Swipe down
                        this.duck();
                    } else {
                        // Swipe up
                        this.jump();
                    }
                }
            }
        }
    }
    
    handleTouchEnd(e) {
        e.preventDefault();
        
        const touch = e.changedTouches[0];
        const touchId = touch.identifier;
        
        if (this.touches[touchId]) {
            const touchData = this.touches[touchId];
            const duration = Date.now() - touchData.startTime;
            const deltaX = touch.clientX - touchData.startX;
            const deltaY = touch.clientY - touchData.startY;
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            
            // If it was a swipe down, stop ducking
            if (touchData.isSwipe && deltaY > 0 && Math.abs(deltaY) > Math.abs(deltaX)) {
                this.stopDuck();
            }
            
            delete this.touches[touchId];
        }
    }
    
    handleMouseDown(e) {
        // Only handle mouse clicks on the game canvas for desktop testing
        if (e.target.id === 'gameCanvas' && this.game && this.game.gameState === 'playing') {
            const rect = e.target.getBoundingClientRect();
            const clickY = e.clientY - rect.top;
            const canvasHeight = rect.height;
            
            // Click in upper half = jump, lower half = duck
            if (clickY < canvasHeight * 0.5) {
                this.jump();
            } else {
                this.duck();
                // Auto-release duck after short time for mouse
                setTimeout(() => this.stopDuck(), 200);
            }
        }
    }
    
    jump() {
        if (this.game && this.game.dino && this.game.gameState === 'playing') {
            this.game.dino.jump();
        }
    }
    
    duck() {
        if (this.game && this.game.dino && this.game.gameState === 'playing') {
            this.game.dino.duck();
        }
    }
    
    stopDuck() {
        if (this.game && this.game.dino) {
            this.game.dino.stopDuck();
        }
    }
    
    updatePauseButton() {
        const pauseBtn = document.getElementById('pauseBtn');
        if (pauseBtn && this.game) {
            if (this.game.gameState === 'paused') {
                pauseBtn.textContent = '▶️';
            } else {
                pauseBtn.textContent = '⏸️';
            }
        }
    }
    
    shareScore() {
        if (!this.game) return;
        
        const score = Math.floor(this.game.score);
        const stage = this.game.currentStage;
        
        // Create share text
        const shareText = `🦕 I just scored ${score} points and reached Stage ${stage} in Dino Runner! Can you beat my score? 🎮`;
        
        // Try to use Web Share API if available
        if (navigator.share) {
            navigator.share({
                title: 'Dino Runner - My Score',
                text: shareText,
                url: window.location.href
            }).catch(err => {
                console.log('Error sharing:', err);
                this.fallbackShare(shareText);
            });
        } else {
            this.fallbackShare(shareText);
        }
    }
    
    fallbackShare(text) {
        // Fallback: copy to clipboard
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => {
                this.showShareNotification('Score copied to clipboard!');
            }).catch(() => {
                this.showShareNotification('Share: ' + text);
            });
        } else {
            // Last resort: show text to copy manually
            this.showShareNotification('Share: ' + text);
        }
    }
    
    showShareNotification(message) {
        // Create temporary notification
        const notification = document.createElement('div');
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 20px;
            border-radius: 10px;
            z-index: 1000;
            max-width: 80%;
            text-align: center;
            font-size: 16px;
        `;
        
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }
    
    // Detect if device supports touch
    isTouchDevice() {
        return ('ontouchstart' in window) || 
               (navigator.maxTouchPoints > 0) || 
               (navigator.msMaxTouchPoints > 0);
    }
    
    // Get appropriate control instructions
    getControlInstructions() {
        if (this.isTouchDevice()) {
            return {
                jump: 'Tap to Jump',
                duck: 'Swipe Down to Duck'
            };
        } else {
            return {
                jump: 'Spacebar/↑ to Jump',
                duck: '↓ to Duck'
            };
        }
    }
    
    // Clean up event listeners
    destroy() {
        document.removeEventListener('keydown', this.handleKeyDown);
        document.removeEventListener('keyup', this.handleKeyUp);
        document.removeEventListener('touchstart', this.handleTouchStart);
        document.removeEventListener('touchmove', this.handleTouchMove);
        document.removeEventListener('touchend', this.handleTouchEnd);
        document.removeEventListener('mousedown', this.handleMouseDown);
    }
}

// Global controls instance
let controls = null;
