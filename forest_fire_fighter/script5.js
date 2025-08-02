class ForestFireFighter {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.gameIsRunning = false;
        
        this.aircraft = {
            x: 400,
            y: 300,
            width: 40,
            height: 30,
            waterLevel: 100,
            maxWater: 100,
            speed: 3
        };
        
        this.terrain = [];
        this.fires = [];
        this.waterSources = [];
        this.trees = [];
        this.smokeParticles = [];
        
        this.keys = {};
        this.score = 0;
        this.treesLost = 0;
        this.maxTreesLost = 20;
        
        this.mapWidth = 800;
        this.mapHeight = 600;
        this.tileSize = 20;
        
        this.initializeGame();
    }
    
    initializeGame() {
        this.loadAssets();
        this.generateTerrain();
        this.spawnFiresAndWaterSources();
        this.setPlayerStartPosition();
        this.setupEventListeners();
        this.gameIsRunning = true;
        this.gameLoop();
    }
    
    loadAssets() {
        console.log("Loading game assets...");
    }
    
    generateTerrain() {
        for (let x = 0; x < this.mapWidth; x += this.tileSize) {
            for (let y = 0; y < this.mapHeight; y += this.tileSize) {
                this.terrain.push({
                    x: x,
                    y: y,
                    type: Math.random() > 0.7 ? 'tree' : 'ground'
                });
            }
        }
    }
    
    spawnFiresAndWaterSources() {
        for (let i = 0; i < 5; i++) {
            this.fires.push({
                x: Math.random() * (this.mapWidth - 40),
                y: Math.random() * (this.mapHeight - 40),
                width: 20,
                height: 20,
                intensity: 1,
                spreadTimer: 0
            });
        }
        
        for (let i = 0; i < 3; i++) {
            this.waterSources.push({
                x: Math.random() * (this.mapWidth - 60),
                y: Math.random() * (this.mapHeight - 60),
                width: 60,
                height: 60
            });
        }
    }
    
    setPlayerStartPosition() {
        this.aircraft.x = 400;
        this.aircraft.y = 300;
    }
    
    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });
    }
    
    gameLoop() {
        if (!this.gameIsRunning) return;
        
        this.handleInput();
        this.updateEntities();
        this.checkCollisions();
        this.updateFireSpread();
        this.renderScene();
        this.checkWinLoseConditions();
        
        requestAnimationFrame(() => this.gameLoop());
    }
    
    handleInput() {
        if (this.keys['ArrowUp'] || this.keys['w']) {
            this.moveAircraft(0, -this.aircraft.speed);
        }
        if (this.keys['ArrowDown'] || this.keys['s']) {
            this.moveAircraft(0, this.aircraft.speed);
        }
        if (this.keys['ArrowLeft'] || this.keys['a']) {
            this.moveAircraft(-this.aircraft.speed, 0);
        }
        if (this.keys['ArrowRight'] || this.keys['d']) {
            this.moveAircraft(this.aircraft.speed, 0);
        }
        
        if (this.keys[' ']) {
            this.dropWater();
        }
        
        if (this.keys['t']) {
            this.plantTree();
        }
        
        this.refillWaterTank();
    }
    
    moveAircraft(dx, dy) {
        this.aircraft.x = Math.max(0, Math.min(this.mapWidth - this.aircraft.width, this.aircraft.x + dx));
        this.aircraft.y = Math.max(0, Math.min(this.mapHeight - this.aircraft.height, this.aircraft.y + dy));
    }
    
    dropWater() {
        if (this.aircraft.waterLevel > 0) {
            this.aircraft.waterLevel -= 10;
            
            for (let i = this.fires.length - 1; i >= 0; i--) {
                const fire = this.fires[i];
                if (this.isColliding(this.aircraft, fire)) {
                    this.extinguishFire(i);
                    this.score += 10;
                }
            }
        }
    }
    
    refillWaterTank() {
        for (const waterSource of this.waterSources) {
            if (this.isColliding(this.aircraft, waterSource)) {
                this.aircraft.waterLevel = Math.min(this.aircraft.maxWater, this.aircraft.waterLevel + 2);
            }
        }
    }
    
    plantTree() {
        const clearedZone = this.terrain.find(tile => 
            tile.type === 'ground' && 
            Math.abs(tile.x - this.aircraft.x) < this.tileSize && 
            Math.abs(tile.y - this.aircraft.y) < this.tileSize
        );
        
        if (clearedZone) {
            this.trees.push({
                x: clearedZone.x,
                y: clearedZone.y,
                age: 0,
                growthStage: 0
            });
        }
    }
    
    updateEntities() {
        this.updateAircraftPosition();
        this.updateFireAndSmoke();
        this.updateTreeGrowth();
    }
    
    updateAircraftPosition() {
        this.aircraft.x = Math.max(0, Math.min(this.mapWidth - this.aircraft.width, this.aircraft.x));
        this.aircraft.y = Math.max(0, Math.min(this.mapHeight - this.aircraft.height, this.aircraft.y));
    }
    
    updateFireAndSmoke() {
        for (const fire of this.fires) {
            if (Math.random() < 0.1) {
                this.smokeParticles.push({
                    x: fire.x + Math.random() * fire.width,
                    y: fire.y + Math.random() * fire.height,
                    vx: (Math.random() - 0.5) * 2,
                    vy: -Math.random() * 2 - 1,
                    life: 100,
                    maxLife: 100
                });
            }
        }
        
        for (let i = this.smokeParticles.length - 1; i >= 0; i--) {
            const smoke = this.smokeParticles[i];
            smoke.x += smoke.vx;
            smoke.y += smoke.vy;
            smoke.life--;
            
            if (smoke.life <= 0) {
                this.smokeParticles.splice(i, 1);
            }
        }
    }
    
    updateTreeGrowth() {
        for (const tree of this.trees) {
            tree.age++;
            if (tree.age > 100 && tree.growthStage < 3) {
                tree.growthStage++;
                tree.age = 0;
            }
        }
    }
    
    checkCollisions() {
        for (const smoke of this.smokeParticles) {
            if (this.isCollidingWithPoint(this.aircraft, smoke.x, smoke.y)) {
                this.applySmokeEffect();
            }
        }
        
        for (const waterSource of this.waterSources) {
            if (this.isColliding(this.aircraft, waterSource)) {
                this.refillWaterTank();
            }
        }
    }
    
    applySmokeEffect() {
        console.log("Aircraft hit by smoke!");
    }
    
    extinguishFire(fireIndex) {
        this.fires.splice(fireIndex, 1);
    }
    
    updateFireSpread() {
        for (const fire of this.fires) {
            fire.spreadTimer++;
            
            if (fire.spreadTimer > 120) {
                this.spreadToAdjacentTiles(fire);
                fire.spreadTimer = 0;
            }
        }
    }
    
    spreadToAdjacentTiles(fire) {
        if (Math.random() < 0.3) {
            const newFire = {
                x: fire.x + (Math.random() - 0.5) * 60,
                y: fire.y + (Math.random() - 0.5) * 60,
                width: 20,
                height: 20,
                intensity: 1,
                spreadTimer: 0
            };
            
            newFire.x = Math.max(0, Math.min(this.mapWidth - newFire.width, newFire.x));
            newFire.y = Math.max(0, Math.min(this.mapHeight - newFire.height, newFire.y));
            
            this.fires.push(newFire);
        }
    }
    
    renderScene() {
        this.ctx.clearRect(0, 0, this.mapWidth, this.mapHeight);
        
        this.drawTerrain();
        this.drawFires();
        this.drawSmoke();
        this.drawTrees();
        this.drawWaterSources();
        this.drawAircraft();
        this.drawUI();
    }
    
    drawTerrain() {
        this.ctx.fillStyle = '#8B7355';
        this.ctx.fillRect(0, 0, this.mapWidth, this.mapHeight);
        
        for (const tile of this.terrain) {
            if (tile.type === 'tree') {
                this.ctx.fillStyle = '#228B22';
                this.ctx.fillRect(tile.x, tile.y, this.tileSize, this.tileSize);
            }
        }
    }
    
    drawFires() {
        for (const fire of this.fires) {
            this.ctx.fillStyle = '#FF4500';
            this.ctx.fillRect(fire.x, fire.y, fire.width, fire.height);
            
            this.ctx.fillStyle = '#FFD700';
            this.ctx.fillRect(fire.x + 5, fire.y + 5, fire.width - 10, fire.height - 10);
        }
    }
    
    drawSmoke() {
        for (const smoke of this.smokeParticles) {
            const alpha = smoke.life / smoke.maxLife;
            this.ctx.fillStyle = `rgba(128, 128, 128, ${alpha * 0.5})`;
            this.ctx.beginPath();
            this.ctx.arc(smoke.x, smoke.y, 5, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
    
    drawTrees() {
        for (const tree of this.trees) {
            const size = 5 + tree.growthStage * 3;
            this.ctx.fillStyle = '#006400';
            this.ctx.fillRect(tree.x, tree.y, size, size);
        }
    }
    
    drawWaterSources() {
        for (const waterSource of this.waterSources) {
            this.ctx.fillStyle = '#4169E1';
            this.ctx.fillRect(waterSource.x, waterSource.y, waterSource.width, waterSource.height);
        }
    }
    
    drawAircraft() {
        this.ctx.fillStyle = '#C0C0C0';
        this.ctx.fillRect(this.aircraft.x, this.aircraft.y, this.aircraft.width, this.aircraft.height);
        
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(this.aircraft.x + 15, this.aircraft.y + 10, 10, 10);
    }
    
    drawUI() {
        this.ctx.fillStyle = '#000000';
        this.ctx.font = '16px Arial';
        this.ctx.fillText(`Score: ${this.score}`, 10, 25);
        this.ctx.fillText(`Water: ${this.aircraft.waterLevel}/${this.aircraft.maxWater}`, 10, 45);
        this.ctx.fillText(`Trees Lost: ${this.treesLost}/${this.maxTreesLost}`, 10, 65);
        this.ctx.fillText('Controls: WASD/Arrows to move, Space to drop water, T to plant tree', 10, this.mapHeight - 10);
    }
    
    checkWinLoseConditions() {
        if (this.treesLost >= this.maxTreesLost) {
            this.endGame("Game Over - Too many trees lost!");
        } else if (this.fires.length === 0 && this.trees.length >= 10) {
            this.endGame("You Win - Forest restored!");
        }
    }
    
    endGame(message) {
        this.gameIsRunning = false;
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, this.mapWidth, this.mapHeight);
        
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '32px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(message, this.mapWidth / 2, this.mapHeight / 2);
        
        this.ctx.font = '16px Arial';
        this.ctx.fillText('Press F5 to restart', this.mapWidth / 2, this.mapHeight / 2 + 40);
        this.ctx.textAlign = 'left';
    }
    
    isColliding(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }
    
    isCollidingWithPoint(rect, x, y) {
        return x >= rect.x && x <= rect.x + rect.width &&
               y >= rect.y && y <= rect.y + rect.height;
    }
}

window.addEventListener('DOMContentLoaded', () => {
    new ForestFireFighter();
});