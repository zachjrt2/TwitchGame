// ==========================================
// WORLD.JS - Game World class
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