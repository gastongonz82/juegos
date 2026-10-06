class Obstacle {
    constructor(x, groundY, type, stage) {
        this.x = x;
        this.groundY = groundY;
        this.type = type;
        this.stage = stage;
        
        // Set dimensions based on type
        this.setDimensions();
        
        // Position
        this.y = this.groundY - this.height;
        
        // Movement
        this.speed = 0;
        
        // Animation
        this.animationFrame = 0;
        this.animationTimer = 0;
        this.animationSpeed = 200;
        
        // Colors based on stage
        this.colors = this.getStageColors(stage);
        
        // Special properties
        this.isFlying = this.type === 'bat' || this.type === 'fireball';
        if (this.isFlying) {
            this.y = this.groundY - this.height - 60; // Flying height
            this.floatOffset = 0;
        }
    }
    
    setDimensions() {
        const dimensions = {
            // Stage 1 - Desert
            cactus: { width: 30, height: 60 },
            rock: { width: 40, height: 25 },
            
            // Stage 2 - Jungle
            log: { width: 50, height: 20 },
            vine: { width: 15, height: 80 },
            tree: { width: 35, height: 70 },
            
            // Stage 3 - Night
            crystal: { width: 25, height: 45 },
            shadow: { width: 45, height: 30 },
            bat: { width: 35, height: 25 },
            
            // Stage 4 - Snow
            icicle: { width: 20, height: 50 },
            snowball: { width: 35, height: 35 },
            ice: { width: 40, height: 20 },
            
            // Stage 5 - Volcano
            fireball: { width: 30, height: 30 },
            lava: { width: 60, height: 15 },
            volcano: { width: 45, height: 55 }
        };
        
        const dim = dimensions[this.type] || { width: 30, height: 30 };
        this.width = dim.width;
        this.height = dim.height;
    }
    
    getStageColors(stage) {
        const stageColors = {
            1: { // Desert
                primary: '#8B4513',   // Saddle brown
                secondary: '#D2691E', // Chocolate
                accent: '#228B22',    // Forest green
                highlight: '#FFD700'  // Gold
            },
            2: { // Jungle
                primary: '#006400',   // Dark green
                secondary: '#8B4513', // Saddle brown
                accent: '#32CD32',    // Lime green
                highlight: '#FF6347'  // Tomato
            },
            3: { // Night
                primary: '#4B0082',   // Indigo
                secondary: '#9370DB', // Medium purple
                accent: '#00CED1',    // Dark turquoise
                highlight: '#FFD700'  // Gold
            },
            4: { // Snow
                primary: '#B0E0E6',   // Powder blue
                secondary: '#87CEEB', // Sky blue
                accent: '#4682B4',    // Steel blue
                highlight: '#FFFFFF'  // White
            },
            5: { // Volcano
                primary: '#DC143C',   // Crimson
                secondary: '#FF4500', // Orange red
                accent: '#FF6347',    // Tomato
                highlight: '#FFD700'  // Gold
            }
        };
        
        return stageColors[stage] || stageColors[1];
    }
    
    update(deltaTime, gameSpeed) {
        // Move obstacle
        this.x -= gameSpeed;
        
        // Update animation
        this.animationTimer += deltaTime;
        if (this.animationTimer >= this.animationSpeed) {
            this.animationFrame = (this.animationFrame + 1) % 4;
            this.animationTimer = 0;
        }
        
        // Update flying obstacles
        if (this.isFlying) {
            this.floatOffset = Math.sin(Date.now() * 0.005) * 10;
        }
    }
    
    render(ctx) {
        ctx.save();
        
        let renderY = this.y;
        if (this.isFlying) {
            renderY += this.floatOffset;
        }
        
        // Render based on type
        switch (this.type) {
            case 'cactus':
                this.drawCactus(ctx, this.x, renderY);
                break;
            case 'rock':
                this.drawRock(ctx, this.x, renderY);
                break;
            case 'log':
                this.drawLog(ctx, this.x, renderY);
                break;
            case 'vine':
                this.drawVine(ctx, this.x, renderY);
                break;
            case 'tree':
                this.drawTree(ctx, this.x, renderY);
                break;
            case 'crystal':
                this.drawCrystal(ctx, this.x, renderY);
                break;
            case 'shadow':
                this.drawShadow(ctx, this.x, renderY);
                break;
            case 'bat':
                this.drawBat(ctx, this.x, renderY);
                break;
            case 'icicle':
                this.drawIcicle(ctx, this.x, renderY);
                break;
            case 'snowball':
                this.drawSnowball(ctx, this.x, renderY);
                break;
            case 'ice':
                this.drawIce(ctx, this.x, renderY);
                break;
            case 'fireball':
                this.drawFireball(ctx, this.x, renderY);
                break;
            case 'lava':
                this.drawLava(ctx, this.x, renderY);
                break;
            case 'volcano':
                this.drawVolcano(ctx, this.x, renderY);
                break;
        }
        
        ctx.restore();
    }
    
    drawCactus(ctx, x, y) {
        ctx.fillStyle = this.colors.accent;
        ctx.strokeStyle = this.colors.primary;
        ctx.lineWidth = 2;
        
        // Main trunk
        ctx.beginPath();
        ctx.roundRect(x + this.width * 0.4, y, this.width * 0.2, this.height, 5);
        ctx.fill();
        ctx.stroke();
        
        // Left arm
        ctx.beginPath();
        ctx.roundRect(x, y + this.height * 0.3, this.width * 0.5, this.width * 0.15, 5);
        ctx.fill();
        ctx.stroke();
        
        // Right arm
        ctx.beginPath();
        ctx.roundRect(x + this.width * 0.5, y + this.height * 0.5, this.width * 0.5, this.width * 0.15, 5);
        ctx.fill();
        ctx.stroke();
        
        // Spikes
        ctx.fillStyle = this.colors.highlight;
        for (let i = 0; i < 8; i++) {
            const spikeY = y + (i * this.height / 8);
            ctx.beginPath();
            ctx.arc(x + this.width * 0.3, spikeY, 2, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.beginPath();
            ctx.arc(x + this.width * 0.7, spikeY, 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    drawRock(ctx, x, y) {
        ctx.fillStyle = this.colors.secondary;
        ctx.strokeStyle = this.colors.primary;
        ctx.lineWidth = 2;
        
        // Main rock shape (irregular)
        ctx.beginPath();
        ctx.ellipse(x + this.width/2, y + this.height/2, this.width * 0.4, this.height * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Rock texture
        ctx.fillStyle = this.colors.primary;
        const spots = [
            {x: x + this.width * 0.3, y: y + this.height * 0.3, size: 3},
            {x: x + this.width * 0.7, y: y + this.height * 0.6, size: 4},
            {x: x + this.width * 0.5, y: y + this.height * 0.8, size: 2}
        ];
        
        spots.forEach(spot => {
            ctx.beginPath();
            ctx.arc(spot.x, spot.y, spot.size, 0, Math.PI * 2);
            ctx.fill();
        });
    }
    
    drawLog(ctx, x, y) {
        ctx.fillStyle = this.colors.secondary;
        ctx.strokeStyle = this.colors.primary;
        ctx.lineWidth = 2;
        
        // Log body
        ctx.beginPath();
        ctx.roundRect(x, y, this.width, this.height, this.height/2);
        ctx.fill();
        ctx.stroke();
        
        // Wood rings
        ctx.strokeStyle = this.colors.primary;
        ctx.lineWidth = 1;
        for (let i = 0; i < 3; i++) {
            const ringX = x + (i + 1) * this.width / 4;
            ctx.beginPath();
            ctx.ellipse(ringX, y + this.height/2, 3, this.height * 0.3, 0, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
    
    drawVine(ctx, x, y) {
        ctx.strokeStyle = this.colors.accent;
        ctx.lineWidth = this.width;
        ctx.lineCap = 'round';
        
        // Wavy vine
        ctx.beginPath();
        ctx.moveTo(x + this.width/2, y);
        
        for (let i = 0; i <= this.height; i += 10) {
            const waveX = x + this.width/2 + Math.sin(i * 0.1) * 5;
            ctx.lineTo(waveX, y + i);
        }
        ctx.stroke();
        
        // Leaves
        ctx.fillStyle = this.colors.accent;
        for (let i = 0; i < this.height; i += 20) {
            const leafX = x + this.width/2 + Math.sin(i * 0.1) * 5;
            ctx.beginPath();
            ctx.ellipse(leafX + 8, y + i, 6, 3, 0, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    drawTree(ctx, x, y) {
        // Trunk
        ctx.fillStyle = this.colors.secondary;
        ctx.strokeStyle = this.colors.primary;
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.roundRect(x + this.width * 0.4, y + this.height * 0.4, this.width * 0.2, this.height * 0.6, 5);
        ctx.fill();
        ctx.stroke();
        
        // Leaves
        ctx.fillStyle = this.colors.accent;
        ctx.beginPath();
        ctx.arc(x + this.width/2, y + this.height * 0.3, this.width * 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    }
    
    drawCrystal(ctx, x, y) {
        ctx.fillStyle = this.colors.accent;
        ctx.strokeStyle = this.colors.highlight;
        ctx.lineWidth = 2;
        
        // Crystal shape (diamond-like)
        ctx.beginPath();
        ctx.moveTo(x + this.width/2, y);
        ctx.lineTo(x + this.width, y + this.height * 0.3);
        ctx.lineTo(x + this.width * 0.8, y + this.height);
        ctx.lineTo(x + this.width * 0.2, y + this.height);
        ctx.lineTo(x, y + this.height * 0.3);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Crystal glow effect
        const gradient = ctx.createRadialGradient(x + this.width/2, y + this.height/2, 0, x + this.width/2, y + this.height/2, this.width/2);
        gradient.addColorStop(0, this.colors.highlight + '80');
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.fill();
    }
    
    drawShadow(ctx, x, y) {
        ctx.fillStyle = this.colors.primary + '80';
        
        // Shadowy blob
        ctx.beginPath();
        ctx.ellipse(x + this.width/2, y + this.height/2, this.width * 0.4, this.height * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Darker center
        ctx.fillStyle = this.colors.primary;
        ctx.beginPath();
        ctx.ellipse(x + this.width/2, y + this.height/2, this.width * 0.2, this.height * 0.15, 0, 0, Math.PI * 2);
        ctx.fill();
    }
    
    drawBat(ctx, x, y) {
        ctx.fillStyle = this.colors.primary;
        ctx.strokeStyle = this.colors.secondary;
        ctx.lineWidth = 1;
        
        // Body
        ctx.beginPath();
        ctx.ellipse(x + this.width/2, y + this.height/2, this.width * 0.2, this.height * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Wings (animated)
        const wingFlap = Math.sin(this.animationFrame * Math.PI / 2) * 0.3 + 0.7;
        
        // Left wing
        ctx.beginPath();
        ctx.ellipse(x + this.width * 0.2, y + this.height * 0.4, this.width * 0.25 * wingFlap, this.height * 0.2, -0.5, 0, Math.PI * 2);
        ctx.fill();
        
        // Right wing
        ctx.beginPath();
        ctx.ellipse(x + this.width * 0.8, y + this.height * 0.4, this.width * 0.25 * wingFlap, this.height * 0.2, 0.5, 0, Math.PI * 2);
        ctx.fill();
        
        // Eyes
        ctx.fillStyle = this.colors.highlight;
        ctx.beginPath();
        ctx.arc(x + this.width * 0.4, y + this.height * 0.3, 2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(x + this.width * 0.6, y + this.height * 0.3, 2, 0, Math.PI * 2);
        ctx.fill();
    }
    
    drawIcicle(ctx, x, y) {
        ctx.fillStyle = this.colors.highlight;
        ctx.strokeStyle = this.colors.accent;
        ctx.lineWidth = 2;
        
        // Icicle shape
        ctx.beginPath();
        ctx.moveTo(x + this.width/2, y + this.height);
        ctx.lineTo(x + this.width * 0.8, y);
        ctx.lineTo(x + this.width * 0.2, y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Ice shine
        ctx.fillStyle = this.colors.highlight + '60';
        ctx.beginPath();
        ctx.moveTo(x + this.width * 0.6, y + this.height * 0.8);
        ctx.lineTo(x + this.width * 0.7, y + this.height * 0.2);
        ctx.lineTo(x + this.width * 0.5, y + this.height * 0.2);
        ctx.closePath();
        ctx.fill();
    }
    
    drawSnowball(ctx, x, y) {
        ctx.fillStyle = this.colors.highlight;
        ctx.strokeStyle = this.colors.accent;
        ctx.lineWidth = 2;
        
        // Main snowball
        ctx.beginPath();
        ctx.arc(x + this.width/2, y + this.height/2, this.width * 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Snow texture
        ctx.fillStyle = this.colors.accent;
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const dotX = x + this.width/2 + Math.cos(angle) * this.width * 0.2;
            const dotY = y + this.height/2 + Math.sin(angle) * this.height * 0.2;
            
            ctx.beginPath();
            ctx.arc(dotX, dotY, 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    drawIce(ctx, x, y) {
        ctx.fillStyle = this.colors.highlight + '80';
        ctx.strokeStyle = this.colors.accent;
        ctx.lineWidth = 2;
        
        // Ice block
        ctx.beginPath();
        ctx.roundRect(x, y, this.width, this.height, 5);
        ctx.fill();
        ctx.stroke();
        
        // Ice cracks
        ctx.strokeStyle = this.colors.accent;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + this.width * 0.2, y + this.height * 0.3);
        ctx.lineTo(x + this.width * 0.8, y + this.height * 0.7);
        ctx.moveTo(x + this.width * 0.7, y + this.height * 0.2);
        ctx.lineTo(x + this.width * 0.3, y + this.height * 0.8);
        ctx.stroke();
    }
    
    drawFireball(ctx, x, y) {
        // Fire glow
        const gradient = ctx.createRadialGradient(x + this.width/2, y + this.height/2, 0, x + this.width/2, y + this.height/2, this.width/2);
        gradient.addColorStop(0, this.colors.highlight);
        gradient.addColorStop(0.5, this.colors.accent);
        gradient.addColorStop(1, this.colors.primary);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x + this.width/2, y + this.height/2, this.width * 0.4, 0, Math.PI * 2);
        ctx.fill();
        
        // Fire particles
        ctx.fillStyle = this.colors.highlight;
        for (let i = 0; i < 5; i++) {
            const angle = (i / 5) * Math.PI * 2 + this.animationFrame * 0.1;
            const particleX = x + this.width/2 + Math.cos(angle) * this.width * 0.3;
            const particleY = y + this.height/2 + Math.sin(angle) * this.height * 0.3;
            
            ctx.beginPath();
            ctx.arc(particleX, particleY, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    drawLava(ctx, x, y) {
        ctx.fillStyle = this.colors.primary;
        
        // Lava pool
        ctx.beginPath();
        ctx.ellipse(x + this.width/2, y + this.height/2, this.width * 0.4, this.height * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Bubbles
        ctx.fillStyle = this.colors.accent;
        const bubbles = [
            {x: x + this.width * 0.3, y: y + this.height * 0.4, size: 4},
            {x: x + this.width * 0.7, y: y + this.height * 0.6, size: 3},
            {x: x + this.width * 0.5, y: y + this.height * 0.3, size: 5}
        ];
        
        bubbles.forEach(bubble => {
            ctx.beginPath();
            ctx.arc(bubble.x, bubble.y, bubble.size, 0, Math.PI * 2);
            ctx.fill();
        });
    }
    
    drawVolcano(ctx, x, y) {
        ctx.fillStyle = this.colors.secondary;
        ctx.strokeStyle = this.colors.primary;
        ctx.lineWidth = 2;
        
        // Volcano shape
        ctx.beginPath();
        ctx.moveTo(x + this.width/2, y);
        ctx.lineTo(x + this.width, y + this.height);
        ctx.lineTo(x, y + this.height);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Crater
        ctx.fillStyle = this.colors.primary;
        ctx.beginPath();
        ctx.ellipse(x + this.width/2, y + this.height * 0.2, this.width * 0.2, this.height * 0.1, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Lava glow
        ctx.fillStyle = this.colors.accent + '60';
        ctx.beginPath();
        ctx.ellipse(x + this.width/2, y + this.height * 0.2, this.width * 0.15, this.height * 0.08, 0, 0, Math.PI * 2);
        ctx.fill();
    }
    
    getBoundingRect() {
        let y = this.y;
        if (this.isFlying) {
            y += this.floatOffset;
        }
        
        return {
            x: this.x + 5, // Slight padding
            y: y + 5,
            width: this.width - 10,
            height: this.height - 10
        };
    }
}
