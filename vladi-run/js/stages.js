class Background {
    constructor(width, height, stage) {
        this.width = width;
        this.height = height;
        this.stage = stage;
        
        // Parallax layers
        this.layers = [];
        this.initializeLayers();
        
        // Animation
        this.animationTimer = 0;
        this.cloudOffset = 0;
        this.particleOffset = 0;
        
        // Stage colors
        this.stageThemes = this.getStageThemes();
        this.currentTheme = this.stageThemes[stage] || this.stageThemes[1];
    }
    
    getStageThemes() {
        return {
            1: { // Sunny Desert
                name: 'Sunny Desert',
                sky: ['#87CEEB', '#F0E68C'], // Sky blue to khaki
                ground: '#F4A460', // Sandy brown
                accent1: '#FFD700', // Gold
                accent2: '#FF6347', // Tomato
                accent3: '#32CD32'  // Lime green
            },
            2: { // Jungle Trail
                name: 'Jungle Trail',
                sky: ['#228B22', '#90EE90'], // Forest green to light green
                ground: '#8B4513', // Saddle brown
                accent1: '#006400', // Dark green
                accent2: '#FF6347', // Tomato
                accent3: '#FFD700'  // Gold
            },
            3: { // Moonlit Night
                name: 'Moonlit Night',
                sky: ['#191970', '#4B0082'], // Midnight blue to indigo
                ground: '#2F4F4F', // Dark slate gray
                accent1: '#9370DB', // Medium purple
                accent2: '#00CED1', // Dark turquoise
                accent3: '#FFD700'  // Gold
            },
            4: { // Snowy Mountains
                name: 'Snowy Mountains',
                sky: ['#B0E0E6', '#E0E0E0'], // Powder blue to light gray
                ground: '#FFFFFF', // White
                accent1: '#4682B4', // Steel blue
                accent2: '#87CEEB', // Sky blue
                accent3: '#C0C0C0'  // Silver
            },
            5: { // Lava Volcano
                name: 'Lava Volcano',
                sky: ['#8B0000', '#FF4500'], // Dark red to orange red
                ground: '#2F4F4F', // Dark slate gray
                accent1: '#DC143C', // Crimson
                accent2: '#FF6347', // Tomato
                accent3: '#FFD700'  // Gold
            }
        };
    }
    
    initializeLayers() {
        // Create parallax layers with different speeds
        this.layers = [
            { type: 'sky', speed: 0, offset: 0 },
            { type: 'mountains', speed: 0.5, offset: 0 },
            { type: 'clouds', speed: 1, offset: 0 },
            { type: 'midground', speed: 2, offset: 0 },
            { type: 'foreground', speed: 3, offset: 0 },
            { type: 'particles', speed: 4, offset: 0 }
        ];
    }
    
    changeStage(newStage) {
        this.stage = newStage;
        this.currentTheme = this.stageThemes[newStage] || this.stageThemes[1];
    }
    
    resize(width, height) {
        this.width = width;
        this.height = height;
    }
    
    update(deltaTime, gameSpeed) {
        // Update layer offsets
        this.layers.forEach(layer => {
            layer.offset -= (gameSpeed * layer.speed * deltaTime) / 100;
            
            // Reset offset when it goes too far
            if (layer.offset <= -this.width) {
                layer.offset = 0;
            }
        });
        
        // Update animation timers
        this.animationTimer += deltaTime;
        this.cloudOffset = Math.sin(this.animationTimer * 0.001) * 20;
        this.particleOffset = (this.animationTimer * 0.05) % (Math.PI * 2);
    }
    
    render(ctx) {
        // Render each layer
        this.layers.forEach(layer => {
            switch (layer.type) {
                case 'sky':
                    this.renderSky(ctx);
                    break;
                case 'mountains':
                    this.renderMountains(ctx, layer.offset);
                    break;
                case 'clouds':
                    this.renderClouds(ctx, layer.offset);
                    break;
                case 'midground':
                    this.renderMidground(ctx, layer.offset);
                    break;
                case 'foreground':
                    this.renderForeground(ctx, layer.offset);
                    break;
                case 'particles':
                    this.renderParticles(ctx, layer.offset);
                    break;
            }
        });
    }
    
    renderSky(ctx) {
        // Gradient sky
        const gradient = ctx.createLinearGradient(0, 0, 0, this.height);
        gradient.addColorStop(0, this.currentTheme.sky[0]);
        gradient.addColorStop(1, this.currentTheme.sky[1]);
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.width, this.height);
        
        // Stage-specific sky elements
        switch (this.stage) {
            case 1: // Desert - Sun
                this.renderSun(ctx);
                break;
            case 2: // Jungle - Canopy
                this.renderCanopy(ctx);
                break;
            case 3: // Night - Moon and stars
                this.renderMoonAndStars(ctx);
                break;
            case 4: // Snow - Aurora
                this.renderAurora(ctx);
                break;
            case 5: // Volcano - Smoke
                this.renderVolcanicSky(ctx);
                break;
        }
    }
    
    renderSun(ctx) {
        const sunX = this.width * 0.8;
        const sunY = this.height * 0.2;
        const sunRadius = 40;
        
        // Sun glow
        const sunGradient = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunRadius * 2);
        sunGradient.addColorStop(0, this.currentTheme.accent1 + '80');
        sunGradient.addColorStop(1, 'transparent');
        ctx.fillStyle = sunGradient;
        ctx.fillRect(sunX - sunRadius * 2, sunY - sunRadius * 2, sunRadius * 4, sunRadius * 4);
        
        // Sun
        ctx.fillStyle = this.currentTheme.accent1;
        ctx.beginPath();
        ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // Sun rays
        ctx.strokeStyle = this.currentTheme.accent1 + '60';
        ctx.lineWidth = 3;
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const rayLength = 20;
            const startX = sunX + Math.cos(angle) * (sunRadius + 10);
            const startY = sunY + Math.sin(angle) * (sunRadius + 10);
            const endX = sunX + Math.cos(angle) * (sunRadius + 10 + rayLength);
            const endY = sunY + Math.sin(angle) * (sunRadius + 10 + rayLength);
            
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);
            ctx.stroke();
        }
    }
    
    renderCanopy(ctx) {
        // Jungle canopy silhouette
        ctx.fillStyle = this.currentTheme.accent1 + '40';
        
        for (let x = 0; x < this.width; x += 50) {
            const leafHeight = 60 + Math.sin(x * 0.01) * 20;
            ctx.beginPath();
            ctx.ellipse(x, this.height * 0.15, 30, leafHeight, 0, 0, Math.PI);
            ctx.fill();
        }
    }
    
    renderMoonAndStars(ctx) {
        // Moon
        const moonX = this.width * 0.8;
        const moonY = this.height * 0.2;
        const moonRadius = 35;
        
        ctx.fillStyle = this.currentTheme.accent3;
        ctx.beginPath();
        ctx.arc(moonX, moonY, moonRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // Moon craters
        ctx.fillStyle = this.currentTheme.accent2 + '40';
        ctx.beginPath();
        ctx.arc(moonX - 10, moonY - 5, 8, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(moonX + 8, moonY + 10, 5, 0, Math.PI * 2);
        ctx.fill();
        
        // Stars
        ctx.fillStyle = this.currentTheme.accent3;
        for (let i = 0; i < 20; i++) {
            const starX = (i * 137.5) % this.width; // Golden angle distribution
            const starY = (i * 50) % (this.height * 0.6);
            const starSize = 1 + Math.sin(this.animationTimer * 0.003 + i) * 1;
            
            ctx.beginPath();
            ctx.arc(starX, starY, starSize, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    renderAurora(ctx) {
        // Aurora borealis effect
        const gradient = ctx.createLinearGradient(0, 0, 0, this.height * 0.5);
        gradient.addColorStop(0, this.currentTheme.accent2 + '20');
        gradient.addColorStop(0.5, this.currentTheme.accent1 + '30');
        gradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = gradient;
        
        for (let x = 0; x < this.width; x += 100) {
            const waveHeight = 100 + Math.sin(x * 0.01 + this.animationTimer * 0.002) * 50;
            ctx.beginPath();
            ctx.ellipse(x, this.height * 0.2, 80, waveHeight, 0, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    renderVolcanicSky(ctx) {
        // Volcanic ash and embers
        ctx.fillStyle = this.currentTheme.accent2;
        
        for (let i = 0; i < 15; i++) {
            const emberX = (i * 80 + this.animationTimer * 0.1) % this.width;
            const emberY = this.height * 0.1 + Math.sin(i + this.animationTimer * 0.003) * 30;
            const emberSize = 2 + Math.sin(this.animationTimer * 0.005 + i) * 2;
            
            ctx.beginPath();
            ctx.arc(emberX, emberY, emberSize, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    renderMountains(ctx, offset) {
        ctx.fillStyle = this.currentTheme.accent1 + '60';
        
        // Draw repeating mountain silhouettes
        for (let x = offset; x < this.width + 200; x += 200) {
            this.drawMountain(ctx, x, this.height * 0.4, 150, 120);
        }
        for (let x = offset + 200; x < this.width + 200; x += 200) {
            this.drawMountain(ctx, x, this.height * 0.4, 150, 120);
        }
    }
    
    drawMountain(ctx, x, y, width, height) {
        ctx.beginPath();
        ctx.moveTo(x, y + height);
        ctx.lineTo(x + width * 0.3, y);
        ctx.lineTo(x + width * 0.7, y + height * 0.3);
        ctx.lineTo(x + width, y);
        ctx.lineTo(x + width * 1.2, y + height);
        ctx.closePath();
        ctx.fill();
    }
    
    renderClouds(ctx, offset) {
        ctx.fillStyle = this.currentTheme.sky[0] + '40';
        
        // Draw repeating clouds
        for (let x = offset + this.cloudOffset; x < this.width + 300; x += 300) {
            this.drawCloud(ctx, x, this.height * 0.25, 80);
        }
        for (let x = offset + this.cloudOffset + 150; x < this.width + 300; x += 300) {
            this.drawCloud(ctx, x, this.height * 0.35, 60);
        }
    }
    
    drawCloud(ctx, x, y, size) {
        // Simple cloud shape
        ctx.beginPath();
        ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
        ctx.arc(x + size * 0.3, y, size * 0.4, 0, Math.PI * 2);
        ctx.arc(x - size * 0.3, y, size * 0.4, 0, Math.PI * 2);
        ctx.arc(x + size * 0.6, y + size * 0.2, size * 0.3, 0, Math.PI * 2);
        ctx.arc(x - size * 0.6, y + size * 0.2, size * 0.3, 0, Math.PI * 2);
        ctx.fill();
    }
    
    renderMidground(ctx, offset) {
        // Stage-specific midground elements
        switch (this.stage) {
            case 1: // Desert - Dunes
                this.renderDunes(ctx, offset);
                break;
            case 2: // Jungle - Trees
                this.renderJungleTrees(ctx, offset);
                break;
            case 3: // Night - Crystals
                this.renderNightCrystals(ctx, offset);
                break;
            case 4: // Snow - Ice formations
                this.renderIceFormations(ctx, offset);
                break;
            case 5: // Volcano - Lava flows
                this.renderLavaFlows(ctx, offset);
                break;
        }
    }
    
    renderDunes(ctx, offset) {
        ctx.fillStyle = this.currentTheme.ground + '80';
        
        for (let x = offset; x < this.width + 400; x += 400) {
            ctx.beginPath();
            ctx.ellipse(x, this.height * 0.7, 200, 50, 0, 0, Math.PI);
            ctx.fill();
        }
    }
    
    renderJungleTrees(ctx, offset) {
        ctx.fillStyle = this.currentTheme.accent1;
        
        for (let x = offset; x < this.width + 150; x += 150) {
            // Tree trunk
            ctx.fillRect(x + 20, this.height * 0.5, 10, this.height * 0.3);
            
            // Tree leaves
            ctx.beginPath();
            ctx.arc(x + 25, this.height * 0.5, 25, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    renderNightCrystals(ctx, offset) {
        ctx.fillStyle = this.currentTheme.accent2 + '60';
        
        for (let x = offset; x < this.width + 200; x += 200) {
            // Crystal formation
            ctx.beginPath();
            ctx.moveTo(x, this.height * 0.7);
            ctx.lineTo(x + 15, this.height * 0.5);
            ctx.lineTo(x + 30, this.height * 0.7);
            ctx.closePath();
            ctx.fill();
        }
    }
    
    renderIceFormations(ctx, offset) {
        ctx.fillStyle = this.currentTheme.accent3 + '80';
        
        for (let x = offset; x < this.width + 250; x += 250) {
            // Ice spikes
            ctx.beginPath();
            ctx.moveTo(x, this.height * 0.7);
            ctx.lineTo(x + 10, this.height * 0.4);
            ctx.lineTo(x + 20, this.height * 0.7);
            ctx.closePath();
            ctx.fill();
        }
    }
    
    renderLavaFlows(ctx, offset) {
        ctx.fillStyle = this.currentTheme.accent1;
        
        for (let x = offset; x < this.width + 300; x += 300) {
            // Lava stream
            ctx.beginPath();
            ctx.ellipse(x, this.height * 0.75, 100, 15, 0, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    renderForeground(ctx, offset) {
        // Ground details
        ctx.fillStyle = this.currentTheme.ground;
        ctx.fillRect(0, this.height * 0.8, this.width, this.height * 0.2);
        
        // Ground texture
        ctx.fillStyle = this.currentTheme.accent1 + '40';
        for (let x = offset; x < this.width + 100; x += 100) {
            ctx.beginPath();
            ctx.arc(x, this.height * 0.85, 5, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    renderParticles(ctx, offset) {
        // Stage-specific particles
        switch (this.stage) {
            case 1: // Desert - Sand particles
                this.renderSandParticles(ctx);
                break;
            case 2: // Jungle - Pollen
                this.renderPollen(ctx);
                break;
            case 3: // Night - Fireflies
                this.renderFireflies(ctx);
                break;
            case 4: // Snow - Snowflakes
                this.renderSnowflakes(ctx);
                break;
            case 5: // Volcano - Ash
                this.renderAsh(ctx);
                break;
        }
    }
    
    renderSandParticles(ctx) {
        ctx.fillStyle = this.currentTheme.accent1 + '60';
        
        for (let i = 0; i < 10; i++) {
            const x = (i * 120 + this.particleOffset * 50) % this.width;
            const y = this.height * 0.6 + Math.sin(i + this.particleOffset) * 20;
            
            ctx.beginPath();
            ctx.arc(x, y, 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    renderPollen(ctx) {
        ctx.fillStyle = this.currentTheme.accent3 + '80';
        
        for (let i = 0; i < 8; i++) {
            const x = (i * 150 + this.particleOffset * 30) % this.width;
            const y = this.height * 0.4 + Math.sin(i * 2 + this.particleOffset) * 40;
            
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    renderFireflies(ctx) {
        ctx.fillStyle = this.currentTheme.accent3;
        
        for (let i = 0; i < 12; i++) {
            const x = (i * 100 + Math.sin(i + this.particleOffset) * 50) % this.width;
            const y = this.height * 0.5 + Math.cos(i * 1.5 + this.particleOffset) * 60;
            const brightness = Math.sin(this.particleOffset * 2 + i) * 0.5 + 0.5;
            
            ctx.fillStyle = this.currentTheme.accent3 + Math.floor(brightness * 255).toString(16).padStart(2, '0');
            ctx.beginPath();
            ctx.arc(x, y, 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    renderSnowflakes(ctx) {
        ctx.fillStyle = this.currentTheme.accent3;
        
        for (let i = 0; i < 15; i++) {
            const x = (i * 80 + this.particleOffset * 20) % this.width;
            const y = (this.particleOffset * 100 + i * 50) % this.height;
            
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    renderAsh(ctx) {
        ctx.fillStyle = this.currentTheme.accent2 + '60';
        
        for (let i = 0; i < 20; i++) {
            const x = (i * 60 + this.particleOffset * 40) % this.width;
            const y = (this.particleOffset * 80 + i * 40) % this.height;
            
            ctx.beginPath();
            ctx.arc(x, y, 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}
