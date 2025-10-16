// ==========================================
// MAIN.JS - Game Engine and Initialization
// ==========================================

class Game {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        
        this.canvas.width = CONFIG.canvas.width;
        this.canvas.height = CONFIG.canvas.height;
        
        this.world = new World(CONFIG.canvas.width, CONFIG.canvas.height);
        this.twitchManager = new TwitchManager(this.world);
        this.voteManager = new VoteManager(this.world, this.twitchManager);
        this.twitchManager.setVoteManager(this.voteManager);
        
        this.lastTime = performance.now();
        this.fps = 0;
        this.frameCount = 0;
        this.fpsTime = 0;
        
        this.setupUI();
        this.setupSettings();
        
        this.running = true;
        this.loop();
    }

    setupUI() {
        const connectBtn = document.getElementById('connectBtn');
        const disconnectBtn = document.getElementById('disconnectBtn');
        const channelInput = document.getElementById('channelInput');
        const status = document.getElementById('status');

        connectBtn.addEventListener('click', async () => {
            const channel = channelInput.value.trim();
            if (!channel) return;

            connectBtn.disabled = true;
            status.textContent = 'Connecting...';
            status.className = 'status';

            const success = await this.twitchManager.connect(channel);

            if (success) {
                status.textContent = 'Connected';
                status.className = 'status';
                connectBtn.style.display = 'none';
                disconnectBtn.style.display = 'inline-block';
                channelInput.disabled = true;
                document.getElementById('channelName').textContent = channel;
            } else {
                status.textContent = 'Connection failed';
                status.className = 'status disconnected';
                connectBtn.disabled = false;
            }
        });

        disconnectBtn.addEventListener('click', () => {
            this.twitchManager.disconnect();
            status.textContent = 'Disconnected';
            status.className = 'status disconnected';
            connectBtn.style.display = 'inline-block';
            disconnectBtn.style.display = 'none';
            channelInput.disabled = false;
            document.getElementById('channelName').textContent = '-';
        });

        // Settings toggle button
        const settingsBtn = document.getElementById('settingsBtn');
        const settingsPanel = document.getElementById('settingsPanel');
        
        settingsBtn.addEventListener('click', () => {
            settingsPanel.classList.toggle('show');
        });
    }

    setupSettings() {
    // Load saved settings on startup
    loadSettings();
    
    // Helper function to setup a setting with auto-save
    const setupSetting = (inputId, valueId, configPath, formatter = (v) => v) => {
        const input = document.getElementById(inputId);
        const valueSpan = document.getElementById(valueId);
        
        // Get nested config value
        const keys = configPath.split('.');
        let value = CONFIG;
        for (const key of keys) {
            value = value[key];
        }
        
        input.value = value;
        valueSpan.textContent = formatter(value);
        
        input.addEventListener('input', (e) => {
            const newValue = e.target.type === 'range' ? 
                (e.target.step.includes('.') ? parseFloat(e.target.value) : parseInt(e.target.value)) : 
                e.target.value;
            
            // Set nested config value
            let obj = CONFIG;
            for (let i = 0; i < keys.length - 1; i++) {
                obj = obj[keys[i]];
            }
            obj[keys[keys.length - 1]] = newValue;
            
            valueSpan.textContent = formatter(newValue);
            saveSettings();
            });
        };

        const weatherToggle = document.getElementById('weatherToggle');
        weatherToggle.checked = CONFIG.weather.enabled;
        weatherToggle.addEventListener('change', (e) => {
            CONFIG.weather.enabled = e.target.checked;
            saveSettings();
        });
    
        // Voting Settings
        setupSetting('voteInterval', 'voteIntervalValue', 'voting.interval');
        setupSetting('voteDuration', 'voteDurationValue', 'voting.duration');
        setupSetting('voteCooldown', 'voteCooldownValue', 'voting.cooldown');
        
        // Food Settings
        setupSetting('foodInterval', 'foodIntervalValue', 'food.spawnInterval', v => v.toFixed(1));
        setupSetting('foodAmount', 'foodAmountValue', 'food.spawnAmount');
        
        // Entity Settings
        setupSetting('hungerRate', 'hungerRateValue', 'entity.healthDecayRate', v => v.toFixed(1));
        setupSetting('birthCooldown', 'birthCooldownValue', 'entity.reproductionCooldown');
        setupSetting('sizeScaler', 'sizeScalerValue', 'entity.sizeScaler', v => v.toFixed(2) + 'x');
        setupSetting('healthScaler', 'healthScalerValue', 'entity.healthScaler', v => v.toFixed(2) + 'x');
        
        // Predator Settings
        setupSetting('predatorInterval', 'predatorIntervalValue', 'predator.spawnInterval');
        setupSetting('attackScaler', 'attackScalerValue', 'predator.attackScaler', v => v.toFixed(2) + 'x');

        setupSetting('populationMin', 'populationMinValue', 'twitch.populationCapMin');
        setupSetting('populationMax', 'populationMaxValue', 'twitch.populationCapMax');

        const bgToggle = document.getElementById('backgroundToggle');
        bgToggle.checked = CONFIG.background.enabled;
        
        bgToggle.addEventListener('change', (e) => {
            CONFIG.background.enabled = e.target.checked;
            saveSettings(); 
        });
        
        // Special handling for vote interval (to update timer)
        document.getElementById('voteInterval').addEventListener('input', () => {
            if (!this.voteManager.active && this.voteManager.timeUntilNextVote > CONFIG.voting.interval) {
                this.voteManager.timeUntilNextVote = CONFIG.voting.interval;
            }
        });
    }

    loop() {
        if (!this.running) return;
        
        const currentTime = performance.now();
        const deltaMs = currentTime - this.lastTime;
        const dt = Math.min(deltaMs / 1000, 0.1);
        this.lastTime = currentTime;
        
        this.frameCount++;
        this.fpsTime += deltaMs;
        if (this.fpsTime >= 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.fpsTime = 0;
        }
        
        this.voteManager.update(dt);
        this.world.update(dt);
        this.world.draw(this.ctx);
        this.updateUI();
        
        requestAnimationFrame(() => this.loop());
    }

    updateUI() {
        document.getElementById('fps').textContent = this.fps;
        document.getElementById('entityCount').textContent = this.world.entities.length;
        document.getElementById('foodCount').textContent = this.world.food.length;
        document.getElementById('particleCount').textContent = this.world.particles.length;
        document.getElementById('mutationCount').textContent = this.world.getMutationCount();
        
        const energy = Math.round(this.world.energy);
        document.getElementById('energyLevel').textContent = energy;
        document.getElementById('energyBar').style.width = energy + '%';
        
        document.getElementById('popCount').textContent = this.world.entities.length;
        document.getElementById('popCap').textContent = this.world.getPopulationCap();
        document.getElementById('chatterCount').textContent = this.twitchManager.getChatters().size;
        document.getElementById('predatorCount').textContent = this.world.getPredatorCount();
        
        if (this.voteManager.active) {
            document.getElementById('voteTimer').textContent = this.voteManager.getVoteDuration();
            document.getElementById('nextVote').textContent = 'VOTING';
        } else {
            document.getElementById('nextVote').textContent = this.voteManager.getTimeUntilNext();
        }
    }
}

// ==========================================
// INITIALIZE
// ==========================================
window.addEventListener('DOMContentLoaded', () => {
    const game = new Game('gameCanvas');
    console.log('Chat Life - Session 7: Enhanced Effects initialized!');
    console.log('Chatter spawn rates configured based on viewer count');
});