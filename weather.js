// ==========================================
// WEATHER.JS - Weather System
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
        console.log(`Weather changing to: ${newWeather.name}`);
    }

draw(ctx, width, height) {
    if (!CONFIG.weather.enabled) {
        this.currentWeather = WEATHER.CLEAR; // Reset to clear
        return;
    }

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
        const time = Date.now();
        for (let i = 0; i < raindrops; i++) {
            const x = (time * 0.1 + i * 37) % width;
            const y = (time * 0.5 + i * 73) % height;
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