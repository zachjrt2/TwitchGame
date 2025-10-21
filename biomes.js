// ==========================================
// BIOMES.JS - Biome/Territory System
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
                radius: randomRange(120, 180),
                type: biomeTypes[i % biomeTypes.length]
            });
        }
    }

    regenerate() {
        this.generateBiomes();
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
    if (!CONFIG.biomes.enabled) {
        this.biomes = []; // Clear when disabled
        return;
    }
    
    // Regenerate if we have no biomes but should
    if (this.biomes.length === 0) {
        this.generateBiomes();
    }

    for (const biome of this.biomes) {
        ctx.save();
        
        // Draw biome circle
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
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = 'bold 14px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText(biome.type.name, biome.x, biome.y);
        
        ctx.restore();
    }
}

    getHungerMultAt(x, y) {
        const biome = this.getBiomeAt(x, y);
        return biome?.type.hungerMult || 1.0;
    }

    getGrowthMultAt(x, y) {
        const biome = this.getBiomeAt(x, y);
        return biome?.type.growthMult || 1.0;
    }

    getFoodSpawnMultAt(x, y) {
        const biome = this.getBiomeAt(x, y);
        return biome?.type.foodSpawnMult || 1.0;
    }

    isPredatorImmuneAt(x, y) {
        const biome = this.getBiomeAt(x, y);
        return biome?.type.predatorImmune || false;
    }
}