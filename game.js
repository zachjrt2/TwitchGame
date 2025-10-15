// ==========================================
// CHAT LIFE - GAME.JS
// Main game logic and classes
// ==========================================

// ==========================================
// CONFIG
// ==========================================
const CONFIG = {
    canvas: {
        width: 1200,
        height: 800
    },
    entity: {
        baseSize: 15,
        maxSize: 50,
        baseSpeed: 50,
        speedVariance: 30,
        wanderStrength: 2,
        maxHealth: 100,
        startingHealth: 100,
        healthDecayRate: 1.5,
        foodDetectionRange: 120,
        foodAttractionStrength: 3,
        eatRange: 15,
        foodEnergyGain: 25,
        growthRate: 0.3,
        collisionDamage: 5,
        reproductionThreshold: 80,
        reproductionCost: 40,
        reproductionCooldown: 10,
        mutationChance: 0.05,
        trailLength: 10
    },
    predator: {
        spawnChance: 0.02,
        baseSize: 25,
        speed: 80,
        detectionRange: 200,
        attackDamage: 30,
        attackRange: 20
    },
    food: {
        size: 6,
        spawnInterval: 2,
        spawnAmount: 3,
        dropOnDeath: 2
    },
    twitch: {
        energyPerMessage: 2,
        energyDecayRate: 5,
        minEnergy: 20,
        maxEnergy: 100,
        populationCapMin: 10,
        populationCapMax: 30
    },
    voting: {
        interval: 180,
        duration: 30,
        cooldown: 30,
        options: [
            { command: '!food', name: 'Spawn Food', description: 'Add 20 food items' },
            { command: '!bomb', name: 'Meteor Strike', description: 'Damage random area' },
            { command: '!heal', name: 'Heal All', description: 'Restore all health' },
            { command: '!spawn', name: 'Spawn Entity', description: 'Add 3 new creatures' }
        ]
    },
    effects: {
        screenShakeIntensity: 10,
        screenShakeDuration: 0.5,
        deathCamDuration: 1.5,
        deathCamSlowmo: 0.3
    }
};

// Mutation types
const MUTATIONS = {
    SPEED: { name: 'Swift', color: 180, speedMult: 1.5, sizeMult: 0.8 },
    TANK: { name: 'Tank', color: 0, speedMult: 0.7, sizeMult: 1.3, healthMult: 1.5 },
    REGEN: { name: 'Regen', color: 120, decayMult: 0.5, glowIntensity: 20 },
    TINY: { name: 'Micro', color: 280, sizeMult: 0.5, speedMult: 1.3 },
    GIANT: { name: 'Titan', color: 40, sizeMult: 1.5, speedMult: 0.8, healthMult: 1.3 }
};

// ==========================================
// UTILITY FUNCTIONS
// ==========================================
function randomRange(min, max) {
    return Math.random() * (max - min) + min;
}

function lerp(a, b, t) {
    return a + (b - a) * t;
}

function distance(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
}

function clamp(val, min, max) {
    return Math.min(Math.max(val, min), max);
}

// ==========================================
// TRAIL CLASS
// ==========================================
class Trail {
    constructor(x, y, size, color) {
        this.points = [{ x, y, age: 0 }];
        this.maxLength = CONFIG.entity.trailLength;
        this.size = size;
        this.color = color;
    }

    addPoint(x, y) {
        this.points.unshift({ x, y, age: 0 });
        if (this.points.length > this.maxLength) {
            this.points.pop();
        }
    }

    update(dt) {
        for (const point of this.points) {
            point.age += dt;
        }
    }

    draw(ctx) {
        for (let i = 0; i < this.points.length; i++) {
            const point = this.points[i];
            const alpha = 1 - (i / this.points.length);
            const size = this.size * (1 - i / this.points.length) * 0.5;
            
            ctx.save();
            ctx.globalAlpha = alpha * 0.3;
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(point.x, point.y, size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }
}

// ==========================================
// PARTICLE CLASS
// ==========================================
class Particle {
    constructor(x, y, type = 'generic') {
        this.x = x;
        this.y = y;
        this.type = type;
        this.alive = true;
        this.age = 0;
        this.maxAge = 1;
        
        switch(type) {
            case 'explosion':
                this.vx = randomRange(-200, 200);
                this.vy = randomRange(-200, 200);
                this.size = randomRange(3, 8);
                this.color = `hsl(${randomRange(0, 60)}, 100%, 60%)`;
                this.maxAge = randomRange(0.3, 0.6);
                break;
            case 'heal':
                this.vx = randomRange(-50, 50);
                this.vy = randomRange(-100, -50);
                this.size = randomRange(4, 8);
                this.color = '#4ecca3';
                this.maxAge = randomRange(0.8, 1.2);
                break;
            case 'spawn':
                this.vx = randomRange(-100, 100);
                this.vy = randomRange(-100, 100);
                this.size = randomRange(3, 6);
                this.color = `hsl(${randomRange(180, 250)}, 80%, 60%)`;
                this.maxAge = randomRange(0.5, 1);
                break;
            case 'food':
                this.vx = randomRange(-80, 80);
                this.vy = randomRange(-80, 80);
                this.size = randomRange(2, 5);
                this.color = '#4ecca3';
                this.maxAge = randomRange(0.4, 0.8);
                break;
            case 'death':
                this.vx = randomRange(-150, 150);
                this.vy = randomRange(-150, 150);
                this.size = randomRange(4, 10);
                this.color = `hsl(${randomRange(0, 30)}, 70%, 50%)`;
                this.maxAge = randomRange(0.8, 1.5);
                break;
        }
    }

    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.vy += 200 * dt;
        this.vx *= 0.98;
        this.age += dt;
        
        if (this.age >= this.maxAge) {
            this.alive = false;
        }
    }

    draw(ctx) {
        const alpha = 1 - (this.age / this.maxAge);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// ==========================================
// FOOD CLASS
// ==========================================
class Food {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = CONFIG.food.size;
        this.alive = true;
        this.age = 0;
        this.pulsePhase = Math.random() * Math.PI * 2;
    }

    update(dt) {
        this.age += dt;
        this.pulsePhase += dt * 2;
    }

    draw(ctx) {
        const pulse = Math.sin(this.pulsePhase) * 0.3 + 1;
        const currentSize = this.size * pulse;
        
        ctx.fillStyle = '#4ecca3';
        ctx.strokeStyle = '#45b393';
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, currentSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    }

    consume() {
        this.alive = false;
    }
}

// ==========================================
// ENTITY CLASS
// ==========================================
class Entity {
    constructor(x, y, name = "Entity", parentSize = null, mutation = null) {
        this.x = x;
        this.y = y;
        this.name = name;
        this.isPredator = false;
        
        // Mutation
        this.mutation = mutation;
        if (!mutation && Math.random() < CONFIG.entity.mutationChance) {
            const mutTypes = Object.keys(MUTATIONS);
            const mutKey = mutTypes[Math.floor(Math.random() * mutTypes.length)];
            this.mutation = MUTATIONS[mutKey];
        }
        
        const speedMult = this.mutation?.speedMult || 1;
        const sizeMult = this.mutation?.sizeMult || 1;
        const healthMult = this.mutation?.healthMult || 1;
        
        this.vx = randomRange(-1, 1);
        this.vy = randomRange(-1, 1);
        this.speed = (CONFIG.entity.baseSpeed + randomRange(-CONFIG.entity.speedVariance, CONFIG.entity.speedVariance)) * speedMult;
        
        this.health = CONFIG.entity.startingHealth * healthMult;
        this.maxHealth = CONFIG.entity.maxHealth * healthMult;
        this.size = (parentSize ? parentSize * 0.6 : CONFIG.entity.baseSize) * sizeMult;
        this.age = 0;
        this.alive = true;
        this.timeSinceReproduction = 0;
        this.isChatter = false;
        
        if (this.mutation) {
            this.hue = this.mutation.color;
            this.name = this.mutation.name + " " + name;
        } else {
            this.hue = Math.random() * 360;
        }
        
        this.trail = new Trail(x, y, this.size, `hsl(${this.hue}, 70%, 50%)`);
        this.updateShape();
    }

    updateShape() {
        if (this.size < 20) {
            this.shape = 'triangle';
        } else if (this.size < 30) {
            this.shape = 'square';
        } else if (this.size < 40) {
            this.shape = 'pentagon';
        } else {
            this.shape = 'hexagon';
        }
    }

    update(dt, worldWidth, worldHeight, foodArray, otherEntities) {
        const decayMult = this.mutation?.decayMult || 1;
        this.health -= CONFIG.entity.healthDecayRate * decayMult * dt;
        this.timeSinceReproduction += dt;
        
        if (this.health <= 0) {
            this.health = 0;
            this.alive = false;
            return;
        }
        
        if (this.health > 70 && this.size < CONFIG.entity.maxSize) {
            this.size += CONFIG.entity.growthRate * dt;
            this.size = Math.min(this.size, CONFIG.entity.maxSize);
            this.updateShape();
        }
        
        let nearestFood = null;
        let nearestDist = Infinity;
        
        for (const food of foodArray) {
            if (!food.alive) continue;
            const dist = distance(this.x, this.y, food.x, food.y);
            if (dist < nearestDist && dist < CONFIG.entity.foodDetectionRange) {
                nearestDist = dist;
                nearestFood = food;
            }
        }
        
        if (nearestFood) {
            const dx = nearestFood.x - this.x;
            const dy = nearestFood.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist > 0) {
                const seekStrength = CONFIG.entity.foodAttractionStrength * dt;
                this.vx += (dx / dist) * seekStrength;
                this.vy += (dy / dist) * seekStrength;
            }
            
            if (dist < CONFIG.entity.eatRange) {
                this.eatFood(nearestFood);
            }
        }
        
        for (const other of otherEntities) {
            if (other === this || !other.alive) continue;
            
            const dist = distance(this.x, this.y, other.x, other.y);
            const minDist = this.size + other.size;
            
            if (dist < minDist) {
                this.health -= CONFIG.entity.collisionDamage * dt;
                
                const overlap = minDist - dist;
                const pushX = (this.x - other.x) / dist * overlap * 0.5;
                const pushY = (this.y - other.y) / dist * overlap * 0.5;
                
                this.x += pushX;
                this.y += pushY;
                
                this.vx = -this.vx;
                this.vy = -this.vy;
            }
        }
        
        this.vx += randomRange(-CONFIG.entity.wanderStrength, CONFIG.entity.wanderStrength) * dt;
        this.vy += randomRange(-CONFIG.entity.wanderStrength, CONFIG.entity.wanderStrength) * dt;
        
        const mag = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (mag > 0) {
            this.vx /= mag;
            this.vy /= mag;
        }
        
        const oldX = this.x;
        const oldY = this.y;
        
        this.x += this.vx * this.speed * dt;
        this.y += this.vy * this.speed * dt;
        
        const movedDist = distance(oldX, oldY, this.x, this.y);
        if (movedDist > 5) {
            this.trail.addPoint(this.x, this.y);
        }
        this.trail.update(dt);
        
        if (this.x < this.size) {
            this.x = this.size;
            this.vx = Math.abs(this.vx);
        }
        if (this.x > worldWidth - this.size) {
            this.x = worldWidth - this.size;
            this.vx = -Math.abs(this.vx);
        }
        if (this.y < this.size) {
            this.y = this.size;
            this.vy = Math.abs(this.vy);
        }
        if (this.y > worldHeight - this.size) {
            this.y = worldHeight - this.size;
            this.vy = -Math.abs(this.vy);
        }
        
        this.age += dt;
    }

    eatFood(food) {
        food.consume();
        this.health = Math.min(this.health + CONFIG.entity.foodEnergyGain, this.maxHealth);
    }

    canReproduce() {
        return this.health >= CONFIG.entity.reproductionThreshold && 
               this.timeSinceReproduction >= CONFIG.entity.reproductionCooldown &&
               this.size > 20;
    }

    reproduce() {
        this.health -= CONFIG.entity.reproductionCost;
        this.timeSinceReproduction = 0;
        
        const angle = Math.random() * Math.PI * 2;
        const dist = this.size + 20;
        const childX = this.x + Math.cos(angle) * dist;
        const childY = this.y + Math.sin(angle) * dist;
        
        return new Entity(childX, childY, this.name + "'", this.size, this.mutation);
    }

    draw(ctx) {
        if (this.speed > 70) {
            this.trail.draw(ctx);
        }
        
        const healthPercent = this.health / this.maxHealth;
        const brightness = lerp(30, 70, healthPercent);
        const saturation = lerp(40, 90, healthPercent);
        
        ctx.save();
        ctx.translate(this.x, this.y);
        
        const glowIntensity = this.mutation?.glowIntensity || (this.isChatter ? 15 : 0);
        if (glowIntensity > 0) {
            ctx.shadowBlur = glowIntensity;
            ctx.shadowColor = `hsl(${this.hue}, 80%, 60%)`;
        }
        
        ctx.fillStyle = `hsl(${this.hue}, ${saturation}%, ${brightness}%)`;
        ctx.strokeStyle = `hsl(${this.hue}, ${saturation}%, ${brightness + 10}%)`;
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        
        const sides = this.shape === 'triangle' ? 3 :
                     this.shape === 'square' ? 4 :
                     this.shape === 'pentagon' ? 5 : 6;
        
        for (let i = 0; i < sides; i++) {
            const angle = (Math.PI * 2 * i / sides) - Math.PI / 2;
            const x = Math.cos(angle) * this.size;
            const y = Math.sin(angle) * this.size;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        ctx.shadowBlur = 0;
        
        const barWidth = this.size * 2;
        const barHeight = 4;
        const barY = this.size + 8;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(-barWidth / 2, barY, barWidth, barHeight);
        
        ctx.fillStyle = healthPercent > 0.3 ? '#4ecca3' : '#ff6b6b';
        ctx.fillRect(-barWidth / 2, barY, barWidth * healthPercent, barHeight);
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = '12px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText(this.name, 0, barY + 16);
        
        ctx.restore();
    }
}

// ==========================================
// PREDATOR CLASS
// ==========================================
class Predator extends Entity {
    constructor(x, y) {
        super(x, y, "PREDATOR", null, null);
        this.isPredator = true;
        this.size = CONFIG.predator.baseSize;
        this.speed = CONFIG.predator.speed;
        this.hue = 0;
        this.maxHealth = 150;
        this.health = 150;
        this.target = null;
        this.attackCooldown = 0;
    }

    update(dt, worldWidth, worldHeight, foodArray, otherEntities) {
        this.health -= CONFIG.entity.healthDecayRate * 0.5 * dt;
        this.attackCooldown -= dt;
        
        if (this.health <= 0) {
            this.alive = false;
            return;
        }
        
        let nearestPrey = null;
        let nearestDist = Infinity;
        
        for (const entity of otherEntities) {
            if (entity === this || !entity.alive || entity.isPredator) continue;
            
            const dist = distance(this.x, this.y, entity.x, entity.y);
            if (dist < nearestDist && dist < CONFIG.predator.detectionRange) {
                nearestDist = dist;
                nearestPrey = entity;
            }
        }
        
        if (nearestPrey) {
            this.target = nearestPrey;
            const dx = nearestPrey.x - this.x;
            const dy = nearestPrey.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist > 0) {
                this.vx = dx / dist;
                this.vy = dy / dist;
            }
            
            if (dist < CONFIG.predator.attackRange && this.attackCooldown <= 0) {
                nearestPrey.health -= CONFIG.predator.attackDamage;
                this.attackCooldown = 1;
                this.health = Math.min(this.health + 10, this.maxHealth);
            }
        } else {
            this.vx += randomRange(-CONFIG.entity.wanderStrength, CONFIG.entity.wanderStrength) * dt;
            this.vy += randomRange(-CONFIG.entity.wanderStrength, CONFIG.entity.wanderStrength) * dt;
        }
        
        const mag = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (mag > 0) {
            this.vx /= mag;
            this.vy /= mag;
        }
        
        const oldX = this.x;
        const oldY = this.y;
        
        this.x += this.vx * this.speed * dt;
        this.y += this.vy * this.speed * dt;
        
        const movedDist = distance(oldX, oldY, this.x, this.y);
        if (movedDist > 5) {
            this.trail.addPoint(this.x, this.y);
        }
        this.trail.update(dt);
        
        if (this.x < this.size) {
            this.x = this.size;
            this.vx = Math.abs(this.vx);
        }
        if (this.x > worldWidth - this.size) {
            this.x = worldWidth - this.size;
            this.vx = -Math.abs(this.vx);
        }
        if (this.y < this.size) {
            this.y = this.size;
            this.vy = Math.abs(this.vy);
        }
        if (this.y > worldHeight - this.size) {
            this.y = worldHeight - this.size;
            this.vy = -Math.abs(this.vy);
        }
        
        this.age += dt;
    }

    draw(ctx) {
        this.trail.draw(ctx);
        
        const healthPercent = this.health / this.maxHealth;
        const brightness = lerp(40, 60, healthPercent);
        
        ctx.save();
        ctx.translate(this.x, this.y);
        
        ctx.shadowBlur = 20;
        ctx.shadowColor = 'rgba(255, 0, 0, 0.8)';
        
        ctx.fillStyle = `hsl(0, 90%, ${brightness}%)`;
        ctx.strokeStyle = `hsl(0, 100%, ${brightness + 10}%)`;
        ctx.lineWidth = 3;
        
        ctx.beginPath();
        const spikes = 8;
        const outerRadius = this.size;
        const innerRadius = this.size * 0.5;
        
        for (let i = 0; i < spikes * 2; i++) {
            const angle = (Math.PI * i / spikes) - Math.PI / 2;
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        ctx.shadowBlur = 0;
        
        const barWidth = this.size * 2;
        const barHeight = 4;
        const barY = this.size + 8;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(-barWidth / 2, barY, barWidth, barHeight);
        
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(-barWidth / 2, barY, barWidth * healthPercent, barHeight);
        
        ctx.fillStyle = 'rgba(255, 100, 100, 0.9)';
        ctx.font = 'bold 12px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText(this.name, 0, barY + 16);
        
        ctx.restore();
    }

    canReproduce() {
        return false;
    }
}

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
            this.world.spawnChatter(username);
        }
    }

    getChatters() {
        return this.chatters;
    }
}

// ==========================================
// GAME WORLD
// ==========================================
class World {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.entities = [];
        this.food = [];
        this.particles = [];
        this.energy = 50;
        this.deathCount = 0;
        this.birthCount = 0;
        
        this.foodSpawnTimer = 0;
        this.predatorSpawnTimer = 0;
        
        this.screenShake = 0;
        this.shakeX = 0;
        this.shakeY = 0;
        
        this.deathCamActive = false;
        this.deathCamTimer = 0;
        this.deathCamTarget = null;
        this.timeScale = 1;
        
        this.spawnInitialEntities();
        this.spawnInitialFood();
    }

    getPopulationCap() {
        const energyPercent = this.energy / 100;
        return Math.floor(lerp(
            CONFIG.twitch.populationCapMin,
            CONFIG.twitch.populationCapMax,
            energyPercent
        ));
    }

    addEnergy(amount) {
        this.energy = clamp(
            this.energy + amount,
            CONFIG.twitch.minEnergy,
            CONFIG.twitch.maxEnergy
        );
    }

    triggerScreenShake() {
        this.screenShake = CONFIG.effects.screenShakeDuration;
    }

    triggerDeathCam(entity) {
        this.deathCamActive = true;
        this.deathCamTimer = CONFIG.effects.deathCamDuration;
        this.deathCamTarget = { x: entity.x, y: entity.y };
        this.timeScale = CONFIG.effects.deathCamSlowmo;
        document.getElementById('deathOverlay').classList.add('active');
    }

    spawnChatter(username) {
        const cap = this.getPopulationCap();
        if (this.entities.length >= cap) return;
        
        const x = randomRange(100, this.width - 100);
        const y = randomRange(100, this.height - 100);
        const entity = new Entity(x, y, username);
        entity.isChatter = true;
        entity.hue = (username.charCodeAt(0) * 137.5) % 360;
        this.entities.push(entity);
        
        for (let i = 0; i < 12; i++) {
            this.particles.push(new Particle(x, y, 'spawn'));
        }
    }

    spawnInitialEntities() {
        const names = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank'];
        for (let i = 0; i < 6; i++) {
            const x = randomRange(100, this.width - 100);
            const y = randomRange(100, this.height - 100);
            this.entities.push(new Entity(x, y, names[i]));
        }
    }

    spawnInitialFood() {
        for (let i = 0; i < 15; i++) {
            this.spawnFood();
        }
    }

    spawnFood(x = null, y = null) {
        const fx = x !== null ? x : randomRange(50, this.width - 50);
        const fy = y !== null ? y : randomRange(50, this.height - 50);
        this.food.push(new Food(fx, fy));
    }

    update(dt) {
        const scaledDt = dt * this.timeScale;
        
        if (this.deathCamActive) {
            this.deathCamTimer -= dt;
            if (this.deathCamTimer <= 0) {
                this.deathCamActive = false;
                this.timeScale = 1;
                document.getElementById('deathOverlay').classList.remove('active');
            }
        }
        
        if (this.screenShake > 0) {
            this.screenShake -= dt;
            const intensity = CONFIG.effects.screenShakeIntensity * (this.screenShake / CONFIG.effects.screenShakeDuration);
            this.shakeX = randomRange(-intensity, intensity);
            this.shakeY = randomRange(-intensity, intensity);
        } else {
            this.shakeX = 0;
            this.shakeY = 0;
        }
        
        this.energy = clamp(
            this.energy - CONFIG.twitch.energyDecayRate * scaledDt,
            CONFIG.twitch.minEnergy,
            CONFIG.twitch.maxEnergy
        );
        
        const energyMultiplier = this.energy / 100;
        const adjustedSpawnInterval = CONFIG.food.spawnInterval / (0.5 + energyMultiplier);
        
        this.foodSpawnTimer += scaledDt;
        if (this.foodSpawnTimer >= adjustedSpawnInterval) {
            this.foodSpawnTimer = 0;
            const spawnAmount = Math.ceil(CONFIG.food.spawnAmount * energyMultiplier);
            for (let i = 0; i < spawnAmount; i++) {
                this.spawnFood();
            }
        }
        
        this.predatorSpawnTimer += scaledDt;
        if (this.predatorSpawnTimer >= 30) {
            this.predatorSpawnTimer = 0;
            if (Math.random() < 0.3 && this.entities.length > 5) {
                const x = randomRange(100, this.width - 100);
                const y = randomRange(100, this.height - 100);
                this.entities.push(new Predator(x, y));
            }
        }
        
        for (const particle of this.particles) {
            particle.update(scaledDt);
        }
        this.particles = this.particles.filter(p => p.alive);
        
        for (const food of this.food) {
            food.update(scaledDt);
        }
        
        this.food = this.food.filter(f => f.alive);
        
        for (const entity of this.entities) {
            if (entity.alive) {
                entity.update(scaledDt, this.width, this.height, this.food, this.entities);
            }
        }
        
        const cap = this.getPopulationCap();
        const newborns = [];
        for (const entity of this.entities) {
            if (entity.alive && entity.canReproduce() && this.entities.length < cap) {
                const child = entity.reproduce();
                newborns.push(child);
                this.birthCount++;
                
                for (let i = 0; i < 8; i++) {
                    this.particles.push(new Particle(child.x, child.y, 'spawn'));
                }
            }
        }
        this.entities.push(...newborns);
        
        const deadEntities = this.entities.filter(e => !e.alive);
        for (const dead of deadEntities) {
            if (!this.deathCamActive && Math.random() < 0.3) {
                this.triggerDeathCam(dead);
            }
            
            for (let i = 0; i < 20; i++) {
                this.particles.push(new Particle(dead.x, dead.y, 'death'));
            }
            
            for (let i = 0; i < CONFIG.food.dropOnDeath; i++) {
                const angle = (Math.PI * 2 * i) / CONFIG.food.dropOnDeath;
                const dist = 20;
                const fx = dead.x + Math.cos(angle) * dist;
                const fy = dead.y + Math.sin(angle) * dist;
                this.spawnFood(fx, fy);
            }
            this.deathCount++;
        }
        
        this.entities = this.entities.filter(e => e.alive);
        
        while (this.entities.length < 5) {
            const x = randomRange(100, this.width - 100);
            const y = randomRange(100, this.height - 100);
            const names = ['Newcomer', 'Respawn', 'Phoenix', 'Revival', 'Reborn'];
            const name = names[Math.floor(Math.random() * names.length)];
            
            if (Math.random() < CONFIG.predator.spawnChance) {
                this.entities.push(new Predator(x, y));
            } else {
                this.entities.push(new Entity(x, y, name));
            }
        }
    }

    draw(ctx) {
        ctx.save();
        
        ctx.translate(this.shakeX, this.shakeY);
        
        const bgBrightness = Math.floor(lerp(10, 30, this.energy / 100));
        ctx.fillStyle = `hsl(240, 30%, ${bgBrightness}%)`;
        ctx.fillRect(0, 0, this.width, this.height);
        
        for (const particle of this.particles) {
            particle.draw(ctx);
        }
        
        for (const food of this.food) {
            food.draw(ctx);
        }
        
        for (const entity of this.entities) {
            entity.draw(ctx);
        }
        
        ctx.restore();
    }

    getMutationCount() {
        return this.entities.filter(e => e.mutation && !e.isPredator).length;
    }

    getPredatorCount() {
        return this.entities.filter(e => e.isPredator).length;
    }
}

// ==========================================
// GAME ENGINE
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
});
