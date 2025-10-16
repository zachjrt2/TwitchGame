// ==========================================
// CONFIG.JS - Configuration and Settings
// ==========================================

const CONFIG = {
    canvas: {
        width: 1200,
        height: 800
    },
     background: {
        enabled: false  // NEW - off by default
    },
    entity: {
        baseSize: 15,
        maxSize: 60,
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
        trailLength: 10,
        sizeScaler: 1.0,      // NEW
        healthScaler: 1.0     // NEW
    },
    predator: {
        spawnChance: 0.02,
        spawnInterval: 30,     // NEW - configurable
        baseSize: 25,
        speed: 80,
        detectionRange: 200,
        attackDamage: 30,
        attackScaler: 1.0,     // NEW
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
        populationCapMax: 30,
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
// SETTINGS PERSISTENCE
// ==========================================
function saveSettings() {
    const settings = {
        background: {
            enabled: CONFIG.background.enabled
        },
        voting: {
            interval: CONFIG.voting.interval,
            duration: CONFIG.voting.duration,
            cooldown: CONFIG.voting.cooldown
        },
        food: {
            spawnInterval: CONFIG.food.spawnInterval,
            spawnAmount: CONFIG.food.spawnAmount
        },
        entity: {
            healthDecayRate: CONFIG.entity.healthDecayRate,
            reproductionCooldown: CONFIG.entity.reproductionCooldown,
            sizeScaler: CONFIG.entity.sizeScaler,
            healthScaler: CONFIG.entity.healthScaler
        },
        predator: {
            spawnInterval: CONFIG.predator.spawnInterval,
            attackScaler: CONFIG.predator.attackScaler
        },
        twitch: {
            populationCapMin: CONFIG.twitch.populationCapMin,
            populationCapMax: CONFIG.twitch.populationCapMax
        }
    };
    
    localStorage.setItem('chatLifeSettings', JSON.stringify(settings));
    console.log('Settings saved!');
}

function loadSettings() {
    const saved = localStorage.getItem('chatLifeSettings');
    if (!saved) return false;
    
    try {
        const settings = JSON.parse(saved);
        
        if (settings.background !== undefined) {
            CONFIG.background.enabled = settings.background.enabled || false;
        }
        
        if (settings.voting) {
            CONFIG.voting.interval = settings.voting.interval || CONFIG.voting.interval;
            CONFIG.voting.duration = settings.voting.duration || CONFIG.voting.duration;
            CONFIG.voting.cooldown = settings.voting.cooldown || CONFIG.voting.cooldown;
        }
        
        if (settings.food) {
            CONFIG.food.spawnInterval = settings.food.spawnInterval || CONFIG.food.spawnInterval;
            CONFIG.food.spawnAmount = settings.food.spawnAmount || CONFIG.food.spawnAmount;
        }
        
        if (settings.entity) {
            CONFIG.entity.healthDecayRate = settings.entity.healthDecayRate || CONFIG.entity.healthDecayRate;
            CONFIG.entity.reproductionCooldown = settings.entity.reproductionCooldown || CONFIG.entity.reproductionCooldown;
            CONFIG.entity.sizeScaler = settings.entity.sizeScaler || CONFIG.entity.sizeScaler;
            CONFIG.entity.healthScaler = settings.entity.healthScaler || CONFIG.entity.healthScaler;
        }
        
        if (settings.predator) {
            CONFIG.predator.spawnInterval = settings.predator.spawnInterval || CONFIG.predator.spawnInterval;
            CONFIG.predator.attackScaler = settings.predator.attackScaler || CONFIG.predator.attackScaler;
        }
        
        if (settings.twitch) {
            CONFIG.twitch.populationCapMin = settings.twitch.populationCapMin || CONFIG.twitch.populationCapMin;
            CONFIG.twitch.populationCapMax = settings.twitch.populationCapMax || CONFIG.twitch.populationCapMax;
        }
        
        console.log('Settings loaded!');
        return true;
    } catch (e) {
        console.error('Failed to load settings:', e);
        return false;
    }
}

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

function getChatterSpawnChance(viewerCount) {
    const rates = CONFIG.twitch.chatterSpawnRates;
    
    if (viewerCount < rates.verySmall.threshold) return rates.verySmall.chance;
    if (viewerCount < rates.small.threshold) return rates.small.chance;
    if (viewerCount < rates.medium.threshold) return rates.medium.chance;
    if (viewerCount < rates.large.threshold) return rates.large.chance;
    return rates.veryLarge.chance;
}