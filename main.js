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
        // Vote Interval
        const voteIntervalInput = document.getElementById('voteInterval');
        const voteIntervalValue = document.getElementById('voteIntervalValue');
        voteIntervalInput.value = CONFIG.voting.interval;
        voteIntervalValue.textContent = CONFIG.voting.interval;

        voteIntervalInput.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            CONFIG.voting.interval = value;
            voteIntervalValue.textContent = value;
            
            // FIXED: Update the timer immediately if not voting
            if (!this.voteManager.active) {
                // If the new interval is shorter than current countdown, adjust it
                if (this.voteManager.timeUntilNextVote > value) {
                    this.voteManager.timeUntilNextVote = value;
                }
            }
        });

        // Vote Duration
        const voteDurationInput = document.getElementById('voteDuration');
        const voteDurationValue = document.getElementById('voteDurationValue');
        voteDurationInput.value = CONFIG.voting.duration;
        voteDurationValue.textContent = CONFIG.voting.duration;
        
        voteDurationInput.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            CONFIG.voting.duration = value;
            voteDurationValue.textContent = value;
        });

        // Vote Cooldown
        const voteCooldownInput = document.getElementById('voteCooldown');
        const voteCooldownValue = document.getElementById('voteCooldownValue');
        voteCooldownInput.value = CONFIG.voting.cooldown;
        voteCooldownValue.textContent = CONFIG.voting.cooldown;
        
        voteCooldownInput.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            CONFIG.voting.cooldown = value;
            voteCooldownValue.textContent = value;
        });

        // Food Spawn Interval
        const foodIntervalInput = document.getElementById('foodInterval');
        const foodIntervalValue = document.getElementById('foodIntervalValue');
        foodIntervalInput.value = CONFIG.food.spawnInterval;
        foodIntervalValue.textContent = CONFIG.food.spawnInterval;
        
        foodIntervalInput.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            CONFIG.food.spawnInterval = value;
            foodIntervalValue.textContent = value;
        });

        // Food Spawn Amount
        const foodAmountInput = document.getElementById('foodAmount');
        const foodAmountValue = document.getElementById('foodAmountValue');
        foodAmountInput.value = CONFIG.food.spawnAmount;
        foodAmountValue.textContent = CONFIG.food.spawnAmount;
        
        foodAmountInput.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            CONFIG.food.spawnAmount = value;
            foodAmountValue.textContent = value;
        });

        // Hunger Rate (Health Decay)
        const hungerRateInput = document.getElementById('hungerRate');
        const hungerRateValue = document.getElementById('hungerRateValue');
        hungerRateInput.value = CONFIG.entity.healthDecayRate;
        hungerRateValue.textContent = CONFIG.entity.healthDecayRate.toFixed(1);
        
        hungerRateInput.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            CONFIG.entity.healthDecayRate = value;
            hungerRateValue.textContent = value.toFixed(1);
        });

        // Birth Cooldown
        const birthCooldownInput = document.getElementById('birthCooldown');
        const birthCooldownValue = document.getElementById('birthCooldownValue');
        birthCooldownInput.value = CONFIG.entity.reproductionCooldown;
        birthCooldownValue.textContent = CONFIG.entity.reproductionCooldown;
        
        birthCooldownInput.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            CONFIG.entity.reproductionCooldown = value;
            birthCooldownValue.textContent = value;
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
