// ==========================================
// CONFIG.JS - Configuration and Settings
// ==========================================

const CONFIG = {
    canvas: {
        width: 1200,
        height: 800
    },
    background: {
        enabled: true
    },
        entity: {
        baseSize: 15,
        maxSize: 35,  // Changed from 60 - entities cap earlier
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
        growthRate: 0.15,  // Changed from 0.3 - slower growth
        collisionDamage: 5,
        reproductionThreshold: 80,
        reproductionCost: 40,
        reproductionCooldown: 10,
        mutationChance: 0.05,
        trailLength: 10,
        sizeScaler: 1.0,
        healthScaler: 1.0
},
    predator: {
        spawnChance: 0.02,
        spawnInterval: 30,
        baseSize: 25,
        speed: 80,
        detectionRange: 200,
        attackDamage: 30,
        attackScaler: 1.0,
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
            { command: '!spawn', name: 'Spawn Entity', description: 'Add 3 new creatures' },
            { command: '!event', name: 'Random Event', description: 'Trigger special event' }
        ]
    },
    effects: {
        screenShakeIntensity: 10,
        screenShakeDuration: 0.5,
        deathCamDuration: 1.5,
        deathCamSlowmo: 0.3
    },
    weather: {
        enabled: true,
        changeDuration: 45,  // How long weather lasts (seconds)
        transitionDuration: 5  // How long transition takes (seconds)
    },
    biomes: {
        enabled: true,
        count: 3  // Number of biome circles
    },
    events: {
        enabled: true,
        minInterval: 60,  // Minimum time between random events
        maxInterval: 180,  // Maximum time between random events
        duration: 20  // How long events last
    }
};

// Weather types
const WEATHER = {
    CLEAR: {
        name: 'Clear',
        foodSpawnMult: 1.0,
        hungerMult: 1.0,
        speedMult: 1.0,
        color: null
    },
    RAIN: {
        name: 'Rain',
        foodSpawnMult: 1.5,
        hungerMult: 0.8,
        speedMult: 0.7,
        color: 'rgba(100, 150, 200, 0.2)'
    },
    DROUGHT: {
        name: 'Drought',
        foodSpawnMult: 0.5,
        hungerMult: 1.5,
        speedMult: 1.2,
        color: 'rgba(200, 150, 100, 0.2)'
    },
    FOG: {
        name: 'Fog',
        foodSpawnMult: 1.0,
        hungerMult: 1.0,
        speedMult: 0.8,
        detectionMult: 0.6,
        color: 'rgba(180, 180, 200, 0.3)'
    }
};

// Biome types
const BIOMES = {
    SAFE: {
        name: 'Safe Zone',
        color: 'rgba(100, 255, 150, 0.15)',
        hungerMult: 0.6,
        predatorImmune: true,
        borderColor: 'rgba(100, 255, 150, 0.4)'
    },
    DANGER: {
        name: 'Danger Zone',
        color: 'rgba(255, 100, 100, 0.15)',
        hungerMult: 1.3,
        growthMult: 1.5,
        predatorAttraction: true,
        borderColor: 'rgba(255, 100, 100, 0.4)'
    },
    FERTILE: {
        name: 'Fertile Zone',
        color: 'rgba(100, 200, 255, 0.15)',
        foodSpawnMult: 2.0,
        hungerMult: 0.8,
        borderColor: 'rgba(100, 200, 255, 0.4)'
    }
};

// Special events
const EVENTS = {
    BLOOD_MOON: {
        name: 'Blood Moon',
        description: 'All entities become aggressive!',
        collisionDamageMult: 3.0,
        color: 'rgba(150, 0, 0, 0.3)'
    },
    AURORA: {
        name: 'Aurora',
        description: 'Mutation rates skyrocket!',
        mutationMult: 10.0,
        color: 'rgba(100, 255, 200, 0.2)'
    },
    EVOLUTION_BOOM: {
        name: 'Evolution Boom',
        description: 'Mass reproduction event!',
        reproductionBoost: true,
        color: 'rgba(255, 200, 100, 0.2)'
    },
    FAMINE: {
        name: 'Famine',
        description: 'All food vanishes!',
        noFoodSpawn: true,
        color: 'rgba(100, 100, 80, 0.3)'
    },
    ABUNDANCE: {
        name: 'Abundance',
        description: 'Food everywhere!',
        foodSpawnMult: 5.0,
        color: 'rgba(150, 255, 150, 0.2)'
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
        },
        weather: {
            enabled: CONFIG.weather.enabled
        },
        biomes: {
            enabled: CONFIG.biomes.enabled
        },
        events: {
            enabled: CONFIG.events.enabled
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
        
        if (settings.weather !== undefined) {
            CONFIG.weather.enabled = settings.weather.enabled !== false;
        }
        
        if (settings.biomes !== undefined) {
            CONFIG.biomes.enabled = settings.biomes.enabled !== false;
        }
        
        if (settings.events !== undefined) {
            CONFIG.events.enabled = settings.events.enabled !== false;
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