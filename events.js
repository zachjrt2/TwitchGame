// ==========================================
// EVENTS.JS - Special Events System
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
            if (this.currentEvent) {
                this.endEvent(); // End any active event
            }
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
        
        console.log(`🎆 Event Started: ${this.currentEvent.name}`);
        this.showEventNotification();
        this.executeEventStart();
    }

    executeEventStart() {
        if (this.currentEvent === EVENTS.EVOLUTION_BOOM) {
            // Reset reproduction cooldowns
            for (const entity of this.world.entities) {
                if (entity.canReproduce && !entity.isPredator) {
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
        notif.innerHTML = `
            <div style="font-size: 28px; margin-bottom: 8px;">🎆 ${this.currentEvent.name}</div>
            <div style="font-size: 16px; opacity: 0.9;">${this.currentEvent.description}</div>
        `;
        notif.classList.add('show');
        
        setTimeout(() => {
            notif.classList.remove('show');
        }, 4000);
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

        // Draw event timer bar
        ctx.save();
        const barWidth = 300;
        const barHeight = 30;
        const x = width / 2 - barWidth / 2;
        const y = 80;
        
        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(x, y, barWidth, barHeight);
        
        // Progress bar
        const progress = this.eventTimer / CONFIG.events.duration;
        ctx.fillStyle = '#4ecca3';
        ctx.fillRect(x, y, barWidth * progress, barHeight);
        
        // Border
        ctx.strokeStyle = '#4ecca3';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, barWidth, barHeight);
        
        // Text
        ctx.fillStyle = 'white';
        ctx.font = 'bold 14px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText(`${this.currentEvent.name}: ${Math.ceil(this.eventTimer)}s`, width / 2, y + 20);
        
        ctx.restore();
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

    isActive() {
        return this.currentEvent !== null;
    }

    getCurrentEventName() {
        return this.currentEvent?.name || 'None';
    }
}