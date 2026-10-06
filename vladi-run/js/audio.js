class AudioManager {
    constructor() {
        this.sounds = {};
        this.backgroundMusic = null;
        this.currentMusicStage = 0;
        this.soundEnabled = true;
        this.musicEnabled = true;
        this.masterVolume = 0.7;
        this.sfxVolume = 0.8;
        this.musicVolume = 0.5;
        
        // Initialize audio elements
        this.initializeAudio();
        
        // Create Web Audio Context for better control
        this.audioContext = null;
        this.initializeWebAudio();
    }
    
    initializeWebAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.audioContext.createGain();
            this.masterGain.connect(this.audioContext.destination);
            this.masterGain.gain.value = this.masterVolume;
        } catch (e) {
            console.warn('Web Audio API not supported, falling back to HTML5 audio');
        }
    }
    
    initializeAudio() {
        // Get audio elements from DOM
        this.sounds.jump = document.getElementById('jumpSound');
        this.sounds.duck = document.getElementById('duckSound');
        this.sounds.collision = document.getElementById('collisionSound');
        this.sounds.stage = document.getElementById('stageSound');
        this.backgroundMusic = document.getElementById('backgroundMusic');
        
        // Set volumes
        Object.values(this.sounds).forEach(sound => {
            if (sound) {
                sound.volume = this.sfxVolume * this.masterVolume;
            }
        });
        
        if (this.backgroundMusic) {
            this.backgroundMusic.volume = this.musicVolume * this.masterVolume;
        }
        
        // Create synthetic sounds if audio files are not available
        this.createSyntheticSounds();
    }
    
    createSyntheticSounds() {
        if (!this.audioContext) return;
        
        // Create synthetic sound effects using Web Audio API
        this.syntheticSounds = {
            jump: () => this.createJumpSound(),
            duck: () => this.createDuckSound(),
            collision: () => this.createCollisionSound(),
            stage: () => this.createStageSound()
        };
    }
    
    createJumpSound() {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.masterGain);
        
        // Jump sound: quick rising tone
        oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(600, this.audioContext.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.2);
    }
    
    createDuckSound() {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.masterGain);
        
        // Duck sound: quick falling tone
        oscillator.frequency.setValueAtTime(400, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(150, this.audioContext.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.15);
    }
    
    createCollisionSound() {
        if (!this.audioContext) return;
        
        // Create noise for collision
        const bufferSize = this.audioContext.sampleRate * 0.3;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const output = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            output[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
        }
        
        const noise = this.audioContext.createBufferSource();
        const gainNode = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        noise.buffer = buffer;
        noise.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.masterGain);
        
        filter.type = 'lowpass';
        filter.frequency.value = 1000;
        
        gainNode.gain.setValueAtTime(0.5, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
        
        noise.start(this.audioContext.currentTime);
        noise.stop(this.audioContext.currentTime + 0.3);
    }
    
    createStageSound() {
        if (!this.audioContext) return;
        
        // Stage clear: ascending arpeggio
        const notes = [261.63, 329.63, 392.00, 523.25]; // C, E, G, C
        
        notes.forEach((freq, index) => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.masterGain);
            
            oscillator.frequency.value = freq;
            oscillator.type = 'triangle';
            
            const startTime = this.audioContext.currentTime + index * 0.1;
            gainNode.gain.setValueAtTime(0.3, startTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);
            
            oscillator.start(startTime);
            oscillator.stop(startTime + 0.3);
        });
    }
    
    playSound(soundName) {
        if (!this.soundEnabled) return;
        
        // Try HTML5 audio first
        if (this.sounds[soundName]) {
            try {
                this.sounds[soundName].currentTime = 0;
                this.sounds[soundName].play().catch(e => {
                    // Fallback to synthetic sound
                    this.playSyntheticSound(soundName);
                });
            } catch (e) {
                this.playSyntheticSound(soundName);
            }
        } else {
            // Use synthetic sound
            this.playSyntheticSound(soundName);
        }
    }
    
    playSyntheticSound(soundName) {
        if (this.syntheticSounds && this.syntheticSounds[soundName]) {
            this.syntheticSounds[soundName]();
        }
    }
    
    playBackgroundMusic(stage) {
        if (!this.musicEnabled) return;
        
        this.currentMusicStage = stage;
        
        // Try to play stage-specific music
        this.playStageMusic(stage);
    }
    
    playStageMusic(stage) {
        if (!this.audioContext) {
            // Fallback: just play the default background music
            if (this.backgroundMusic) {
                this.backgroundMusic.play().catch(e => console.log('Music play failed:', e));
            }
            return;
        }
        
        // Stop current music
        this.stopBackgroundMusic();
        
        // Create stage-specific background music
        this.createStageMusic(stage);
    }
    
    createStageMusic(stage) {
        if (!this.audioContext) return;
        
        // Create simple background music for each stage
        const stageMusics = {
            1: () => this.createDesertMusic(),
            2: () => this.createJungleMusic(),
            3: () => this.createNightMusic(),
            4: () => this.createSnowMusic(),
            5: () => this.createVolcanoMusic()
        };
        
        if (stageMusics[stage]) {
            stageMusics[stage]();
        }
    }
    
    createDesertMusic() {
        // Desert: Warm, rhythmic melody
        this.playMelody([
            {freq: 261.63, duration: 0.5}, // C
            {freq: 293.66, duration: 0.5}, // D
            {freq: 329.63, duration: 0.5}, // E
            {freq: 293.66, duration: 0.5}, // D
        ], 'sine', 2.0);
    }
    
    createJungleMusic() {
        // Jungle: Tribal rhythm
        this.playMelody([
            {freq: 220.00, duration: 0.4}, // A
            {freq: 246.94, duration: 0.4}, // B
            {freq: 220.00, duration: 0.4}, // A
            {freq: 196.00, duration: 0.4}, // G
        ], 'triangle', 1.8);
    }
    
    createNightMusic() {
        // Night: Mysterious, ethereal
        this.playMelody([
            {freq: 174.61, duration: 0.8}, // F
            {freq: 196.00, duration: 0.8}, // G
            {freq: 220.00, duration: 0.8}, // A
            {freq: 196.00, duration: 0.8}, // G
        ], 'triangle', 3.2);
    }
    
    createSnowMusic() {
        // Snow: Gentle, crystalline
        this.playMelody([
            {freq: 329.63, duration: 0.6}, // E
            {freq: 369.99, duration: 0.6}, // F#
            {freq: 392.00, duration: 0.6}, // G
            {freq: 369.99, duration: 0.6}, // F#
        ], 'sine', 2.4);
    }
    
    createVolcanoMusic() {
        // Volcano: Intense, dramatic
        this.playMelody([
            {freq: 146.83, duration: 0.3}, // D
            {freq: 164.81, duration: 0.3}, // E
            {freq: 196.00, duration: 0.3}, // G
            {freq: 164.81, duration: 0.3}, // E
        ], 'sawtooth', 1.2);
    }
    
    playMelody(notes, waveType = 'sine', loopDuration = 2.0) {
        if (!this.audioContext || !this.musicEnabled) return;
        
        const playLoop = () => {
            let currentTime = this.audioContext.currentTime;
            
            notes.forEach((note, index) => {
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(this.masterGain);
                
                oscillator.frequency.value = note.freq;
                oscillator.type = waveType;
                
                gainNode.gain.setValueAtTime(this.musicVolume * 0.1, currentTime);
                gainNode.gain.setValueAtTime(this.musicVolume * 0.1, currentTime + note.duration * 0.9);
                gainNode.gain.exponentialRampToValueAtTime(0.001, currentTime + note.duration);
                
                oscillator.start(currentTime);
                oscillator.stop(currentTime + note.duration);
                
                currentTime += note.duration;
            });
            
            // Schedule next loop
            this.musicTimeout = setTimeout(playLoop, loopDuration * 1000);
        };
        
        playLoop();
    }
    
    pauseBackgroundMusic() {
        if (this.backgroundMusic && !this.backgroundMusic.paused) {
            this.backgroundMusic.pause();
        }
        
        if (this.musicTimeout) {
            clearTimeout(this.musicTimeout);
        }
    }
    
    resumeBackgroundMusic() {
        if (this.musicEnabled) {
            if (this.backgroundMusic && this.backgroundMusic.paused) {
                this.backgroundMusic.play().catch(e => console.log('Music resume failed:', e));
            }
            
            // Restart stage music
            this.playStageMusic(this.currentMusicStage);
        }
    }
    
    stopBackgroundMusic() {
        if (this.backgroundMusic) {
            this.backgroundMusic.pause();
            this.backgroundMusic.currentTime = 0;
        }
        
        if (this.musicTimeout) {
            clearTimeout(this.musicTimeout);
            this.musicTimeout = null;
        }
    }
    
    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        this.updateSoundButton();
        return this.soundEnabled;
    }
    
    toggleMusic() {
        this.musicEnabled = !this.musicEnabled;
        
        if (this.musicEnabled) {
            this.playBackgroundMusic(this.currentMusicStage);
        } else {
            this.stopBackgroundMusic();
        }
        
        this.updateSoundButton();
        return this.musicEnabled;
    }
    
    toggleAllAudio() {
        const newState = !(this.soundEnabled && this.musicEnabled);
        this.soundEnabled = newState;
        this.musicEnabled = newState;
        
        if (newState) {
            this.playBackgroundMusic(this.currentMusicStage);
        } else {
            this.stopBackgroundMusic();
        }
        
        this.updateSoundButton();
        return newState;
    }
    
    updateSoundButton() {
        const soundBtn = document.getElementById('soundBtn');
        if (soundBtn) {
            if (this.soundEnabled && this.musicEnabled) {
                soundBtn.textContent = '🔊';
            } else if (this.soundEnabled || this.musicEnabled) {
                soundBtn.textContent = '🔉';
            } else {
                soundBtn.textContent = '🔇';
            }
        }
    }
    
    setMasterVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
        
        if (this.masterGain) {
            this.masterGain.gain.value = this.masterVolume;
        }
        
        // Update HTML5 audio volumes
        Object.values(this.sounds).forEach(sound => {
            if (sound) {
                sound.volume = this.sfxVolume * this.masterVolume;
            }
        });
        
        if (this.backgroundMusic) {
            this.backgroundMusic.volume = this.musicVolume * this.masterVolume;
        }
    }
    
    // Initialize audio context on user interaction (required by browsers)
    initializeOnUserInteraction() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }
}

// Global audio manager instance
let audioManager = null;

// Initialize audio manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    audioManager = new AudioManager();
    window.audioManager = audioManager;
    
    // Initialize audio context on first user interaction
    const initAudio = () => {
        audioManager.initializeOnUserInteraction();
        document.removeEventListener('click', initAudio);
        document.removeEventListener('touchstart', initAudio);
        document.removeEventListener('keydown', initAudio);
    };
    
    document.addEventListener('click', initAudio);
    document.addEventListener('touchstart', initAudio);
    document.addEventListener('keydown', initAudio);
});
