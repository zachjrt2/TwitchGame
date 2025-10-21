// ==========================================
// LEADERBOARD.JS - Leaderboard System
// ==========================================

class LeaderboardSystem {
    constructor(world) {
        this.world = world;
        this.visible = false;
        this.currentTab = 'evolved'; // 'evolved', 'survival', 'foodEaten'
        this.updateInterval = 2; // Update every 2 seconds
        this.updateTimer = 0;
        this.cachedLeaderboards = {
            evolved: [],
            survival: [],
            foodEaten: []
        };
    }

    update(dt) {
        this.updateTimer += dt;
        if (this.updateTimer >= this.updateInterval) {
            this.updateTimer = 0;
            this.updateLeaderboards();
        }
    }

    updateLeaderboards() {
        const entities = this.world.entities.filter(e => e.alive && !e.isPredator);
        
        // Most Evolved (by generation)
        this.cachedLeaderboards.evolved = [...entities]
            .sort((a, b) => {
                if (b.generation !== a.generation) {
                    return b.generation - a.generation;
                }
                return b.sides - a.sides; // Tie-breaker: most sides
            })
            .slice(0, 5)
            .map(e => ({
                name: e.name,
                value: `G${e.generation} (${e.sides} sides)`,
                entity: e
            }));
        
        // Longest Living (by age)
        this.cachedLeaderboards.survival = [...entities]
            .sort((a, b) => b.age - a.age)
            .slice(0, 5)
            .map(e => ({
                name: e.name,
                value: `${Math.floor(e.age)}s`,
                entity: e
            }));
        
        // Most Food Eaten
        this.cachedLeaderboards.foodEaten = [...entities]
            .sort((a, b) => b.foodEaten - a.foodEaten)
            .slice(0, 5)
            .map(e => ({
                name: e.name,
                value: `${e.foodEaten} food`,
                entity: e
            }));
    }

    toggle() {
        this.visible = !this.visible;
        const panel = document.getElementById('leaderboardPanel');
        if (this.visible) {
            panel.classList.add('show');
            this.render();
        } else {
            panel.classList.remove('show');
        }
    }

    setTab(tab) {
        this.currentTab = tab;
        this.render();
    }

    render() {
        if (!this.visible) return;

        const container = document.getElementById('leaderboardContent');
        const leaderboard = this.cachedLeaderboards[this.currentTab];
        
        if (leaderboard.length === 0) {
            container.innerHTML = '<div style="text-align: center; padding: 20px; color: #888;">No data yet...</div>';
            return;
        }

        container.innerHTML = leaderboard.map((entry, index) => {
            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
            return `
                <div class="leaderboard-entry">
                    <span class="leaderboard-rank">${medal}</span>
                    <span class="leaderboard-name">${entry.name}</span>
                    <span class="leaderboard-value">${entry.value}</span>
                </div>
            `;
        }).join('');
    }
}