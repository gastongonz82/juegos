// Main game initialization
document.addEventListener('DOMContentLoaded', () => {
    console.log('🦕 Dino Runner - Loading...');
    
    // Initialize game components
    initializeGame();
});

function initializeGame() {
    try {
        // Create game instance
        game = new Game();
        window.game = game;
        
        // Create controls instance
        controls = new Controls(game);
        window.controls = controls;
        
        // Update control instructions based on device
        updateControlInstructions();
        
        // Show appropriate controls
        showAppropriateControls();
        
        // Initialize responsive design
        handleResponsiveDesign();
        
        // Add window resize listener
        window.addEventListener('resize', handleResponsiveDesign);
        
        // Add visibility change listener for pause on tab switch
        document.addEventListener('visibilitychange', handleVisibilityChange);
        
        // Prevent zoom on mobile
        preventMobileZoom();
        
        console.log('🎮 Dino Runner - Ready to play!');
        
    } catch (error) {
        console.error('Failed to initialize game:', error);
        showErrorMessage('Failed to load game. Please refresh the page.');
    }
}

function updateControlInstructions() {
    if (!controls) return;
    
    const instructions = controls.getControlInstructions();
    const instructionsDiv = document.querySelector('.instructions');
    
    if (instructionsDiv) {
        const controlsHTML = `
            <h3>Controls:</h3>
            <p><strong>Jump:</strong> ${instructions.jump}</p>
            <p><strong>Duck:</strong> ${instructions.duck}</p>
            <p><strong>Pause:</strong> ESC or Pause Button</p>
            <p><strong>Mute:</strong> M or Sound Button</p>
        `;
        instructionsDiv.innerHTML = controlsHTML;
    }
}

function showAppropriateControls() {
    const touchControls = document.getElementById('touchControls');
    const isMobile = controls && controls.isTouchDevice();
    
    if (touchControls) {
        if (isMobile) {
            touchControls.classList.remove('hidden');
        } else {
            touchControls.classList.add('hidden');
        }
    }
}

function handleResponsiveDesign() {
    const gameContainer = document.getElementById('gameContainer');
    const canvas = document.getElementById('gameCanvas');
    
    if (!gameContainer || !canvas) return;
    
    // Get viewport dimensions
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Calculate optimal game size
    let gameWidth = Math.min(viewportWidth, 1200);
    let gameHeight = Math.min(viewportHeight, 800);
    
    // Maintain aspect ratio on mobile
    if (viewportWidth < 768) {
        gameWidth = viewportWidth;
        gameHeight = viewportHeight;
    }
    
    // Update container size
    gameContainer.style.width = gameWidth + 'px';
    gameContainer.style.height = gameHeight + 'px';
    
    // Update canvas size if game exists
    if (game) {
        game.handleResize();
    }
    
    // Adjust UI elements for mobile
    adjustUIForMobile();
}

function adjustUIForMobile() {
    const isMobile = window.innerWidth < 768;
    const gameUI = document.getElementById('gameUI');
    const touchControls = document.getElementById('touchControls');
    
    if (isMobile) {
        // Make UI elements smaller on mobile
        if (gameUI) {
            gameUI.style.fontSize = '14px';
        }
        
        // Show touch controls
        if (touchControls && controls && controls.isTouchDevice()) {
            touchControls.classList.remove('hidden');
        }
    } else {
        // Reset UI for desktop
        if (gameUI) {
            gameUI.style.fontSize = '';
        }
        
        // Hide touch controls on desktop
        if (touchControls) {
            touchControls.classList.add('hidden');
        }
    }
}

function handleVisibilityChange() {
    if (game && game.gameState === 'playing') {
        if (document.hidden) {
            // Page is hidden, pause the game
            game.pauseGame();
            if (controls) {
                controls.updatePauseButton();
            }
        }
    }
}

function preventMobileZoom() {
    // Prevent zoom on double tap
    let lastTouchEnd = 0;
    document.addEventListener('touchend', (event) => {
        const now = (new Date()).getTime();
        if (now - lastTouchEnd <= 300) {
            event.preventDefault();
        }
        lastTouchEnd = now;
    }, false);
    
    // Prevent pinch zoom
    document.addEventListener('gesturestart', (e) => {
        e.preventDefault();
    });
    
    document.addEventListener('gesturechange', (e) => {
        e.preventDefault();
    });
    
    document.addEventListener('gestureend', (e) => {
        e.preventDefault();
    });
}

function showErrorMessage(message) {
    const errorDiv = document.createElement('div');
    errorDiv.innerHTML = `
        <div style="
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(255, 0, 0, 0.9);
            color: white;
            padding: 30px;
            border-radius: 15px;
            text-align: center;
            z-index: 10000;
            max-width: 80%;
            font-size: 18px;
        ">
            <h3>⚠️ Error</h3>
            <p>${message}</p>
            <button onclick="location.reload()" style="
                margin-top: 15px;
                padding: 10px 20px;
                background: white;
                color: red;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                font-size: 16px;
            ">Refresh Page</button>
        </div>
    `;
    document.body.appendChild(errorDiv);
}

// Performance monitoring
function monitorPerformance() {
    if (!game) return;
    
    let frameCount = 0;
    let lastTime = performance.now();
    
    function checkFPS() {
        frameCount++;
        const currentTime = performance.now();
        
        if (currentTime - lastTime >= 1000) {
            const fps = frameCount;
            frameCount = 0;
            lastTime = currentTime;
            
            // Log performance issues
            if (fps < 30) {
                console.warn(`Low FPS detected: ${fps}`);
            }
            
            // Adjust quality if needed
            if (fps < 20 && game.gameState === 'playing') {
                console.log('Reducing visual effects for better performance');
                // Could implement quality reduction here
            }
        }
        
        requestAnimationFrame(checkFPS);
    }
    
    requestAnimationFrame(checkFPS);
}

// Debug functions (only in development)
function enableDebugMode() {
    if (typeof game !== 'undefined') {
        window.debugGame = {
            skipToStage: (stage) => {
                game.currentStage = Math.max(1, Math.min(5, stage));
                game.background.changeStage(game.currentStage);
                game.updateUI();
                if (window.audioManager) {
                    window.audioManager.playBackgroundMusic(game.currentStage);
                }
            },
            addScore: (points) => {
                game.score += points;
                game.updateUI();
            },
            toggleInvincible: () => {
                game.invincible = !game.invincible;
                console.log('Invincible mode:', game.invincible ? 'ON' : 'OFF');
            },
            setSpeed: (speed) => {
                game.gameSpeed = speed;
                console.log('Game speed set to:', speed);
            }
        };
        
        console.log('Debug mode enabled. Use window.debugGame for debug functions.');
        console.log('Available functions: skipToStage(1-5), addScore(points), toggleInvincible(), setSpeed(speed)');
    }
}

// Enable debug mode in development
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    setTimeout(enableDebugMode, 1000);
}

// Service Worker registration for PWA (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initializeGame,
        game,
        controls,
        audioManager
    };
}
