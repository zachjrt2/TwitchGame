// ==========================================
// ENTITIES.JS - Entity, Predator, Food, Particle, Trail classes
// ==========================================

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
    constructor(x, y, baseName = "Entity", parentSize = null, parentMutation = null, parentGeneration = 0, parentMutationStack = null) {
        this.x = x;
        this.y = y;
        this.baseName = baseName;
        this.isPredator = false;
        this.generation = parentGeneration;
        
        // Mutation stack tracking
        this.mutationStack = parentMutationStack ? {...parentMutationStack} : {};
        
        // Determine if new mutation occurs
        this.mutation = parentMutation;
        if (Math.random() < CONFIG.entity.mutationChance) {
            const mutTypes = Object.keys(MUTATIONS);
            const mutKey = mutTypes[Math.floor(Math.random() * mutTypes.length)];
            this.mutation = MUTATIONS[mutKey];
            
            // Add to stack
            if (this.mutationStack[this.mutation.name]) {
                this.mutationStack[this.mutation.name]++;
            } else {
                this.mutationStack[this.mutation.name] = 1;
            }
        }
        
        // Calculate multipliers from mutation stack
        let speedMult = 1;
        let sizeMult = 1;
        let healthMult = 1;
        let decayMult = 1;
        let glowIntensity = 0;
        
        for (const [mutName, count] of Object.entries(this.mutationStack)) {
            const mut = Object.values(MUTATIONS).find(m => m.name === mutName);
            if (mut) {
                if (mut.speedMult) speedMult *= Math.pow(mut.speedMult, count);
                if (mut.sizeMult) sizeMult *= Math.pow(mut.sizeMult, count);
                if (mut.healthMult) healthMult *= Math.pow(mut.healthMult, count);
                if (mut.decayMult) decayMult *= Math.pow(mut.decayMult, count);
                if (mut.glowIntensity) glowIntensity += mut.glowIntensity * count;
            }
        }
        
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
        this.decayMultiplier = decayMult;
        this.glowIntensity = glowIntensity;
        
        // Set hue based on primary mutation
        if (this.mutation) {
            this.hue = this.mutation.color;
        } else {
            this.hue = Math.random() * 360;
        }
        
        // Build display name
        this.name = this.buildName();
        
        this.trail = new Trail(x, y, this.size, `hsl(${this.hue}, 70%, 50%)`);
        this.updateShape();
    }

    buildName() {
        let parts = [];
        
        // Add mutation stack
        if (Object.keys(this.mutationStack).length > 0) {
            const mutStrings = [];
            for (const [mutName, count] of Object.entries(this.mutationStack)) {
                if (count > 1) {
                    mutStrings.push(`${mutName} x${count}`);
                } else {
                    mutStrings.push(mutName);
                }
            }
            parts.push(mutStrings.join(', '));
        }
        
        // Add base name
        parts.push(this.baseName);
        
        // Add generation (if > 0)
        if (this.generation > 0) {
            parts.push(`G${this.generation}`);
        }
        
        return parts.join(' ');
    }

    updateShape() {
    if (this.size < 15) {
        this.shape = 'triangle';
        this.sides = 3;
    } else if (this.size < 20) {
        this.shape = 'square';
        this.sides = 4;
    } else if (this.size < 25) {
        this.shape = 'pentagon';
        this.sides = 5;
    } else if (this.size < 30) {
        this.shape = 'hexagon';
        this.sides = 6;
    } else if (this.size < 35) {
        this.shape = 'septagon';
        this.sides = 7;
    } else if (this.size < 40) {
        this.shape = 'octagon';
        this.sides = 8;
    } else if (this.size < 43) {
        this.shape = 'nonagon';
        this.sides = 9;
    } else if (this.size < 46) {
        this.shape = 'decagon';
        this.sides = 10;
    } else if (this.size < 49) {
        this.shape = 'hendecagon';
        this.sides = 11;
    } else {
        this.shape = 'dodecagon';
        this.sides = 12;
    }
}

    update(dt, worldWidth, worldHeight, foodArray, otherEntities) {
        this.health -= CONFIG.entity.healthDecayRate * this.decayMultiplier * dt;
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
        
        return new Entity(childX, childY, this.baseName, this.size, this.mutation, this.generation + 1, this.mutationStack);
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
        
        const totalGlow = this.glowIntensity + (this.isChatter ? 15 : 0);
        if (totalGlow > 0) {
            ctx.shadowBlur = totalGlow;
            ctx.shadowColor = `hsl(${this.hue}, 80%, 60%)`;
        }
        
        ctx.fillStyle = `hsl(${this.hue}, ${saturation}%, ${brightness}%)`;
        ctx.strokeStyle = `hsl(${this.hue}, ${saturation}%, ${brightness + 10}%)`;
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        
        const sides = this.sides;
        
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
        super(x, y, "PREDATOR", null, null, 0, null);
        this.isPredator = true;
        this.size = CONFIG.predator.baseSize;
        this.speed = CONFIG.predator.speed;
        this.hue = 0;
        this.maxHealth = 150;
        this.health = 150;
        this.target = null;
        this.attackCooldown = 0;
        this.name = "PREDATOR"; // Override name building
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
