class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.resizeCanvas();
        
        // Game state
        this.gameState = 'start'; // start, playing, paused, gameOver
        this.score = 0;
        this.currentStage = 1;
        this.gameSpeed = 4;
        this.baseSpeed = 4;
        this.speedMultiplier = 1;
        
        // Game objects
        this.dino = null;
        this.obstacles = [];
        this.background = null;
        
        // Timing
        this.lastTime = 0;
        this.deltaTime = 0;
        this.obstacleTimer = 0;
        this.obstacleInterval = 2000; // milliseconds
        
        // Stage progression
        this.stageThreshold = 500;
        this.nextStageScore = this.stageThreshold;
        
        // Performance
        this.frameCount = 0;
        this.fps = 60;
        
        // Initialize components
        this.initializeGame();
        
        // Bind methods
        this.gameLoop = this.gameLoop.bind(this);
        this.handleResize = this.handleResize.bind(this);
        
        // Event listeners
        window.addEventListener('resize', this.handleResize);
    }
    
    resizeCanvas() {
        const container = document.getElementById('gameContainer');
        const rect = container.getBoundingClientRect();
        
        // Set canvas size to match container
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        
        // Store dimensions for easy access
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        
        // Ground level (80% down from top)
        this.groundY = this.height * 0.8;
    }
    
    handleResize() {
        this.resizeCanvas();
        if (this.background) {
            this.background.resize(this.width, this.height);
        }
        if (this.dino) {
            this.dino.updateGroundLevel(this.groundY);
        }
    }
    
    initializeGame() {
        // Initialize game objects
        this.dino = new Dino(this.width * 0.1, this.groundY);
        this.background = new Background(this.width, this.height, this.currentStage);
        this.obstacles = [];
        
        // Reset game state
        this.score = 0;
        this.currentStage = 1;
        this.gameSpeed = this.baseSpeed;
        this.speedMultiplier = 1;
        this.nextStageScore = this.stageThreshold;
        
        // Update UI
        this.updateUI();
    }
    
    startGame() {
        this.gameState = 'playing';
        this.hideScreens();
        this.showTouchControls();
        this.lastTime = performance.now();
        this.gameLoop();
        
        // Start background music
        if (window.audioManager) {
            window.audioManager.playBackgroundMusic(this.currentStage);
        }
    }
    
    pauseGame() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
            if (window.audioManager) {
                window.audioManager.pauseBackgroundMusic();
            }
        } else if (this.gameState === 'paused') {
            this.gameState = 'playing';
            this.lastTime = performance.now();
            this.gameLoop();
            if (window.audioManager) {
                window.audioManager.resumeBackgroundMusic();
            }
        }
    }
    
    gameOver() {
        this.gameState = 'gameOver';
        this.showGameOverScreen();
        this.hideTouchControls();
        
        // Play game over sound
        if (window.audioManager) {
            window.audioManager.stopBackgroundMusic();
            window.audioManager.playSound('collision');
        }
    }
    
    restartGame() {
        this.initializeGame();
        this.startGame();
    }
    
    gameLoop(currentTime = 0) {
        if (this.gameState !== 'playing') return;
        
        // Calculate delta time
        this.deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        // Update game objects
        this.update(this.deltaTime);
        
        // Render everything
        this.render();
        
        // Continue loop
        requestAnimationFrame(this.gameLoop);
    }
    
    update(deltaTime) {
        // Update dino
        this.dino.update(deltaTime);
        
        // Update background
        this.background.update(deltaTime, this.gameSpeed);
        
        // Update obstacles
        this.updateObstacles(deltaTime);
        
        // Spawn new obstacles
        this.spawnObstacles(deltaTime);
        
        // Check collisions
        this.checkCollisions();
        
        // Update score
        this.updateScore(deltaTime);
        
        // Check stage progression
        this.checkStageProgression();
        
        // Increase difficulty over time
        this.updateDifficulty();
    }
    
    updateObstacles(deltaTime) {
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obstacle = this.obstacles[i];
            obstacle.update(deltaTime, this.gameSpeed);
            
            // Remove obstacles that are off-screen
            if (obstacle.x + obstacle.width < 0) {
                this.obstacles.splice(i, 1);
            }
        }
    }
    
    spawnObstacles(deltaTime) {
        this.obstacleTimer += deltaTime;
        
        if (this.obstacleTimer >= this.obstacleInterval) {
            this.createObstacle();
            this.obstacleTimer = 0;
            
            // Randomize next obstacle interval
            this.obstacleInterval = 1500 + Math.random() * 1500; // 1.5-3 seconds
            this.obstacleInterval /= this.speedMultiplier; // Adjust for difficulty
        }
    }
    
    createObstacle() {
        const obstacleTypes = this.getStageObstacles();
        const randomType = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
        
        const obstacle = new Obstacle(
            this.width + 50,
            this.groundY,
            randomType,
            this.currentStage
        );
        
        this.obstacles.push(obstacle);
    }
    
    getStageObstacles() {
        const stageObstacles = {
            1: ['cactus', 'rock'],
            2: ['log', 'vine', 'tree'],
            3: ['crystal', 'shadow', 'bat'],
            4: ['icicle', 'snowball', 'ice'],
            5: ['fireball', 'lava', 'volcano']
        };
        
        return stageObstacles[this.currentStage] || stageObstacles[1];
    }
    
    checkCollisions() {
        const dinoRect = this.dino.getBoundingRect();
        
        for (const obstacle of this.obstacles) {
            const obstacleRect = obstacle.getBoundingRect();
            
            if (this.isColliding(dinoRect, obstacleRect)) {
                this.gameOver();
                return;
            }
        }
    }
    
    isColliding(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }
    
    updateScore(deltaTime) {
        // Increase score based on time and speed
        this.score += (deltaTime / 100) * this.speedMultiplier;
        this.updateUI();
    }
    
    checkStageProgression() {
        if (this.score >= this.nextStageScore) {
            this.advanceStage();
        }
    }
    
    advanceStage() {
        this.currentStage++;
        
        // Loop back to stage 1 after stage 5, but increase difficulty
        if (this.currentStage > 5) {
            this.currentStage = 1;
            this.speedMultiplier += 0.5;
        }
        
        // Update next stage threshold
        this.nextStageScore += this.stageThreshold;
        
        // Change background and music
        this.background.changeStage(this.currentStage);
        
        // Play stage clear sound
        if (window.audioManager) {
            window.audioManager.playSound('stage');
            window.audioManager.playBackgroundMusic(this.currentStage);
        }
        
        this.updateUI();
    }
    
    updateDifficulty() {
        // Gradually increase game speed
        this.gameSpeed = this.baseSpeed * this.speedMultiplier;
    }
    
    updateUI() {
        document.getElementById('score').textContent = Math.floor(this.score);
        
        const stageNames = {
            1: 'Sunny Desert',
            2: 'Jungle Trail',
            3: 'Moonlit Night',
            4: 'Snowy Mountains',
            5: 'Lava Volcano'
        };
        
        const stageName = stageNames[this.currentStage] || 'Unknown';
        document.getElementById('stage').textContent = `${this.currentStage} - ${stageName}`;
    }
    
    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        // Render background
        this.background.render(this.ctx);
        
        // Render obstacles
        for (const obstacle of this.obstacles) {
            obstacle.render(this.ctx);
        }
        
        // Render dino
        this.dino.render(this.ctx);
        
        // Render ground line
        this.renderGround();
    }
    
    renderGround() {
        this.ctx.strokeStyle = '#8B4513';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.groundY);
        this.ctx.lineTo(this.width, this.groundY);
        this.ctx.stroke();
    }
    
    showGameOverScreen() {
        const gameOverScreen = document.getElementById('gameOverScreen');
        document.getElementById('finalScore').textContent = Math.floor(this.score);
        document.getElementById('highestStage').textContent = this.currentStage;
        gameOverScreen.classList.remove('hidden');
    }
    
    hideScreens() {
        document.getElementById('startScreen').classList.add('hidden');
        document.getElementById('gameOverScreen').classList.add('hidden');
    }
    
    showTouchControls() {
        if (this.isMobile()) {
            document.getElementById('touchControls').classList.remove('hidden');
        }
    }
    
    hideTouchControls() {
        document.getElementById('touchControls').classList.add('hidden');
    }
    
    isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
               ('ontouchstart' in window) ||
               (navigator.maxTouchPoints > 0);
    }
}

// Global game instance
let game = null;
