// ==========================================
// ENVIRONMENT.JS - Weather, Biomes, Events
// ==========================================

// ==========================================
// WEATHER SYSTEM
// ==========================================
class WeatherSystem {
    constructor(world) {
        this.world = world;
        this.currentWeather = WEATHER.CLEAR;
        this.nextWeather = null;
        this.timer = CONFIG.weather.changeDuration;
        this.transitionProgress = 0;
        this.isTransitioning = false;
    }

    update(dt) {
        if (!CONFIG.weather.enabled) {
            this.currentWeather = WEATHER.CLEAR;
            return;
        }

        if (this.isTransitioning) {
            this.transitionProgress += dt / CONFIG.weather.transitionDuration;
            if (this.transitionProgress >= 1) {
                this.currentWeather = this.nextWeather;
                this.isTransitioning = false;
                this.transitionProgress = 0;
                this.timer = CONFIG.weather.changeDuration;
            }
        } else {
            this.timer -= dt;
            if (this.timer <= 0) {
                this.changeWeather();
            }
        }
    }

    changeWeather() {
        const weatherTypes = Object.values(WEATHER);
        let newWeather;
        do {
            newWeather = weatherTypes[Math.floor(Math.random() * weatherTypes.length)];
        } while (newWeather === this.currentWeather);
        
        this.nextWeather = newWeather;
        this.isTransitioning = true;
        this.transitionProgress = 0;
    }

    draw(ctx, width, height) {
        if (!CONFIG.weather.enabled) return;

        const weather = this.isTransitioning ? this.nextWeather : this.currentWeather;
        
        if (weather.color) {
            const alpha = this.isTransitioning ? this.transitionProgress : 1;
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.fillStyle = weather.color;
            ctx.fillRect(0, 0, width, height);
            ctx.restore();
        }

        // Rain effect
        if (weather === WEATHER.RAIN) {
            ctx.save();
            ctx.strokeStyle = 'rgba(150, 200, 255, 0.3)';
            ctx.lineWidth = 1;
            const raindrops = 100;
            for (let i = 0; i < raindrops; i++) {
                const x = (Date.now() * 0.1 + i * 37) % width;
                const y = (Date.now() * 0.5 + i * 73) % height;
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x + 2, y + 10);
                ctx.stroke();
            }
            ctx.restore();
        }
    }

    getFoodSpawnMult() {
        return this.currentWeather.foodSpawnMult || 1.0;
    }

    getHungerMult() {
        return this.currentWeather.hungerMult || 1.0;
    }

    getSpeedMult() {
        return this.currentWeather.speedMult || 1.0;
    }

    getDetectionMult() {
        return this.currentWeather.detectionMult || 1.0;
    }

    getCurrentWeatherName() {
        return this.currentWeather.name;
    }
}

// ==========================================
// BIOME SYSTEM
// ==========================================
class BiomeSystem {
    constructor(world) {
        this.world = world;
        this.biomes = [];
        this.generateBiomes();
    }

    generateBiomes() {
        if (!CONFIG.biomes.enabled) return;

        this.biomes = [];
        const biomeTypes = Object.values(BIOMES);
        
        for (let i = 0; i < CONFIG.biomes.count; i++) {
            this.biomes.push({
                x: randomRange(200, this.world.width - 200),
                y: randomRange(200, this.world.height - 200),
                radius: randomRange(100, 200),
                type: biomeTypes[i % biomeTypes.length]
            });
        }
    }

    getBiomeAt(x, y) {
        if (!CONFIG.biomes.enabled) return null;

        for (const biome of this.biomes) {
            const dist = distance(x, y, biome.x, biome.y);
            if (dist < biome.radius) {
                return biome;
            }
        }
        return null;
    }

    draw(ctx) {
        if (!CONFIG.biomes.enabled) return;

        for (const biome of this.biomes) {
            // Draw biome circle
            ctx.save();
            ctx.fillStyle = biome.type.color;
            ctx.beginPath();
            ctx.arc(biome.x, biome.y, biome.radius, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw border
            ctx.strokeStyle = biome.type.borderColor;
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.stroke();
            ctx.setLineDash([]);
            
            // Draw label
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.font = '14px Courier New';
            ctx.textAlign = 'center';
            ctx.fillText(biome.type.name, biome.x, biome.y);
            
            ctx.restore();
        }
    }
}

// ==========================================
// EVENT SYSTEM
// ==========================================
class EventSystem {
    constructor(world) {
        this.world = world;
        this.currentEvent = null;
        this.eventTimer = 0;
        this.nextEventTimer = randomRange(CONFIG.events.minInterval, CONFIG.events.maxInterval);
    }

    update(dt) {
        if (!CONFIG.events.enabled) {
            this.currentEvent = null;
            return;
        }

        if (this.currentEvent) {
            this.eventTimer -= dt;
            if (this.eventTimer <= 0) {
                this.endEvent();
            }
        } else {
            this.nextEventTimer -= dt;
            if (this.nextEventTimer <= 0) {
                this.triggerRandomEvent();
            }
        }
    }

    triggerRandomEvent() {
        const eventTypes = Object.values(EVENTS);
        this.currentEvent = eventTypes[Math.floor(Math.random() * eventTypes.length)];
        this.eventTimer = CONFIG.events.duration;
        
        console.log(`Event Started: ${this.currentEvent.name}`);
        this.showEventNotification();
        
        // Execute event start logic
        if (this.currentEvent === EVENTS.EVOLUTION_BOOM) {
            // Trigger mass reproduction
            for (const entity of this.world.entities) {
                if (entity.canReproduce() && !entity.isPredator) {
                    entity.timeSinceReproduction = CONFIG.entity.reproductionCooldown;
                }
            }
        } else if (this.currentEvent === EVENTS.FAMINE) {
            // Remove all food
            this.world.food = [];
        } else if (this.currentEvent === EVENTS.ABUNDANCE) {
            // Spawn tons of food
            for (let i = 0; i < 50; i++) {
                this.world.spawnFood();
            }
        }
    }

    endEvent() {
        console.log(`Event Ended: ${this.currentEvent.name}`);
        this.currentEvent = null;
        this.nextEventTimer = randomRange(CONFIG.events.minInterval, CONFIG.events.maxInterval);
    }

    showEventNotification() {
        const notif = document.getElementById('notification');
        notif.innerHTML = `<div style="font-size: 24px;">${this.currentEvent.name}</div><div style="font-size: 14px; margin-top: 5px;">${this.currentEvent.description}</div>`;
        notif.classList.add('show');
        
        setTimeout(() => {
            notif.classList.remove('show');
        }, 3000);
    }

    draw(ctx, width, height) {
        if (!this.currentEvent) return;

        // Draw event overlay
        if (this.currentEvent.color) {
            ctx.save();
            ctx.fillStyle = this.currentEvent.color;
            ctx.fillRect(0, 0, width, height);
            ctx.restore();
        }
    }

    getMutationMult() {
        if (this.currentEvent === EVENTS.AURORA) {
            return this.currentEvent.mutationMult;
        }
        return 1.0;
    }

    getCollisionDamageMult() {
        if (this.currentEvent === EVENTS.BLOOD_MOON) {
            return this.currentEvent.collisionDamageMult;
        }
        return 1.0;
    }

    getFoodSpawnMult() {
        if (this.currentEvent === EVENTS.ABUNDANCE) {
            return this.currentEvent.foodSpawnMult;
        }
        if (this.currentEvent === EVENTS.FAMINE) {
            return 0;
        }
        return 1.0;
    }

    shouldBlockFoodSpawn() {
        return this.currentEvent === EVENTS.FAMINE;
    }
}