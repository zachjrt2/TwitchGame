// ==========================================
// MANAGERS.JS - VoteManager and TwitchManager
// ==========================================

// ==========================================
// VOTE MANAGER
// ==========================================
class VoteManager {
    constructor(world, twitchManager) {
        this.world = world;
        this.twitchManager = twitchManager;
        this.active = false;
        this.votes = {};
        this.timeUntilNextVote = CONFIG.voting.interval;
        this.voteDuration = 0;
        this.lastWinner = null;
    }

    update(dt) {
        if (this.active) {
            this.voteDuration -= dt;
            if (this.voteDuration <= 0) {
                this.endVote();
            }
        } else {
            this.timeUntilNextVote -= dt;
            if (this.timeUntilNextVote <= 0 && this.twitchManager.connected) {
                this.startVote();
            }
        }
    }

    startVote() {
        this.active = true;
        this.voteDuration = CONFIG.voting.duration;
        this.votes = {};
        
        for (const option of CONFIG.voting.options) {
            this.votes[option.command] = 0;
        }
        
        this.renderVoteUI();
        document.getElementById('votePanel').classList.add('active');
    }

    castVote(command) {
        if (this.active && this.votes.hasOwnProperty(command)) {
            this.votes[command]++;
            this.renderVoteUI();
        }
    }

    endVote() {
        this.active = false;
        document.getElementById('votePanel').classList.remove('active');
        
        let winner = null;
        let maxVotes = 0;
        for (const [command, count] of Object.entries(this.votes)) {
            if (count > maxVotes) {
                maxVotes = count;
                winner = command;
            }
        }
        
        if (winner && maxVotes > 0) {
            this.executeVote(winner);
            this.lastWinner = winner;
        }
        
        this.timeUntilNextVote = CONFIG.voting.interval + CONFIG.voting.cooldown;
    }

    executeVote(command) {
        const optionName = CONFIG.voting.options.find(o => o.command === command)?.name || command;
        this.showNotification(optionName);
        
        switch(command) {
            case '!food':
                for (let i = 0; i < 20; i++) {
                    const x = randomRange(50, this.world.width - 50);
                    const y = randomRange(50, this.world.height - 50);
                    this.world.spawnFood(x, y);
                    for (let j = 0; j < 3; j++) {
                        this.world.particles.push(new Particle(x, y, 'food'));
                    }
                }
                break;
            
            case '!bomb':
                const bombX = randomRange(200, this.world.width - 200);
                const bombY = randomRange(200, this.world.height - 200);
                const bombRadius = 150;
                
                this.world.triggerScreenShake();
                
                for (let i = 0; i < 50; i++) {
                    this.world.particles.push(new Particle(bombX, bombY, 'explosion'));
                }
                
                for (const entity of this.world.entities) {
                    const dist = distance(entity.x, entity.y, bombX, bombY);
                    if (dist < bombRadius) {
                        const damage = 50 * (1 - dist / bombRadius);
                        entity.health -= damage;
                    }
                }
                break;
            
            case '!heal':
                for (const entity of this.world.entities) {
                    entity.health = entity.maxHealth;
                    for (let i = 0; i < 8; i++) {
                        this.world.particles.push(new Particle(entity.x, entity.y, 'heal'));
                    }
                }
                break;
            
            case '!spawn':
                for (let i = 0; i < 3; i++) {
                    const x = randomRange(100, this.world.width - 100);
                    const y = randomRange(100, this.world.height - 100);
                    const names = ['Voter', 'Spawned', 'Summoned', 'Called'];
                    const name = names[Math.floor(Math.random() * names.length)];
                    this.world.entities.push(new Entity(x, y, name));
                    
                    for (let j = 0; j < 15; j++) {
                        this.world.particles.push(new Particle(x, y, 'spawn'));
                    }
                }
                break;
        }
    }

    showNotification(text) {
        const notif = document.getElementById('notification');
        notif.textContent = text;
        notif.classList.add('show');
        
        setTimeout(() => {
            notif.classList.remove('show');
        }, 2000);
    }

    renderVoteUI() {
        const container = document.getElementById('voteOptions');
        container.innerHTML = '';
        
        const totalVotes = Object.values(this.votes).reduce((a, b) => a + b, 0);
        let maxVotes = Math.max(...Object.values(this.votes));
        
        for (const option of CONFIG.voting.options) {
            const votes = this.votes[option.command] || 0;
            const percent = totalVotes > 0 ? (votes / totalVotes) * 100 : 0;
            const isWinning = votes > 0 && votes === maxVotes;
            
            const optionDiv = document.createElement('div');
            optionDiv.className = 'vote-option' + (isWinning ? ' winning' : '');
            optionDiv.innerHTML = `
                <div>
                    <div class="vote-command">${option.command}</div>
                    <div class="vote-description">${option.description}</div>
                </div>
                <div class="vote-count">${votes}</div>
            `;
            
            const bar = document.createElement('div');
            bar.className = 'vote-bar';
            bar.innerHTML = `<div class="vote-bar-fill" style="width: ${percent}%"></div>`;
            optionDiv.appendChild(bar);
            
            container.appendChild(optionDiv);
        }
    }

    getTimeUntilNext() {
        return Math.ceil(this.timeUntilNextVote);
    }

    getVoteDuration() {
        return Math.ceil(this.voteDuration);
    }
}

// ==========================================
// TWITCH CHAT MANAGER
// ==========================================
class TwitchManager {
    constructor(world) {
        this.world = world;
        this.client = null;
        this.connected = false;
        this.channel = null;
        this.chatters = new Set();
        this.messageCount = 0;
        this.voteManager = null;
    }

    setVoteManager(voteManager) {
        this.voteManager = voteManager;
    }

    async connect(channelName) {
        if (typeof tmi === 'undefined') {
            alert('⚠️ TMI.js not loaded. Make sure tmi.min.js is in the same folder!');
            return false;
        }

        if (this.connected) {
            this.disconnect();
        }

        this.channel = channelName.toLowerCase().replace('#', '');
        
        this.client = new tmi.Client({
            options: { debug: true },
            connection: {
                reconnect: true,
                secure: true
            },
            channels: [this.channel]
        });

        this.client.on('message', (channel, tags, message, self) => {
            this.handleMessage(tags.username, message);
        });

        this.client.on('connected', (addr, port) => {
            this.connected = true;
            console.log(`Connected to ${this.channel} at ${addr}:${port}`);
        });

        this.client.on('disconnected', (reason) => {
            console.log(`Disconnected: ${reason}`);
        });

        try {
            await this.client.connect();
            return true;
        } catch (error) {
            console.error('Connection failed:', error);
            alert(`Failed to connect to channel: ${this.channel}`);
            return false;
        }
    }

    disconnect() {
        if (this.client) {
            this.client.disconnect();
            this.client = null;
        }
        this.connected = false;
        this.channel = null;
        this.chatters.clear();
    }

    handleMessage(username, message) {
        this.messageCount++;
        
        this.world.addEnergy(CONFIG.twitch.energyPerMessage);
        
        if (this.voteManager && this.voteManager.active) {
            const command = message.trim().toLowerCase();
            if (command.startsWith('!')) {
                this.voteManager.castVote(command);
            }
        }
        
        if (!this.chatters.has(username)) {
            this.chatters.add(username);
            
            // Determine spawn chance based on viewer count
            const viewerCount = this.chatters.size;
            const spawnChance = getChatterSpawnChance(viewerCount);
            
            // Roll for spawn
            if (Math.random() < spawnChance) {
                this.world.spawnChatter(username);
            }
        }
    }

    getChatters() {
        return this.chatters;
    }
}