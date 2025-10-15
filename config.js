// ==========================================
// CONFIG.JS - Configuration and Settings
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
        healthDecayRate: 1.5,  // Configurable
        foodDetectionRange: 120,
        foodAttractionStrength: 3,
        eatRange: 15,
        foodEnergyGain: 25,
        growthRate: 0.3,
        collisionDamage: 5,
        reproductionThreshold: 80,
        reproductionCost: 40,
        reproductionCooldown: 10,  // Configurable
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
        spawnInterval: 2,  // Configurable
        spawnAmount: 3,    // Configurable
        dropOnDeath: 2
    },
    twitch: {
        energyPerMessage: 2,
        energyDecayRate: 5,
        minEnergy: 20,
        maxEnergy: 100,
        populationCapMin: 10,
        populationCapMax: 30,
        // Chatter spawn chance based on viewer count
        chatterSpawnRates: {
            verySmall: { threshold: 10, chance: 1.0 },
            small: { threshold: 50, chance: 0.8 },
            medium: { threshold: 100, chance: 0.5 },
            large: { threshold: 500, chance: 0.3 },
            veryLarge: { threshold: Infinity, chance: 0.15 }
        }
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

// Get chatter spawn chance based on viewer count
function getChatterSpawnChance(viewerCount) {
    const rates = CONFIG.twitch.chatterSpawnRates;
    
    if (viewerCount < rates.verySmall.threshold) return rates.verySmall.chance;
    if (viewerCount < rates.small.threshold) return rates.small.chance;
    if (viewerCount < rates.medium.threshold) return rates.medium.chance;
    if (viewerCount < rates.large.threshold) return rates.large.chance;
    return rates.veryLarge.chance;
}