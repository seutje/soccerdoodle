// Game constants
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 500;
const FIELD_WIDTH = CANVAS_WIDTH - 100;
const FIELD_HEIGHT = CANVAS_HEIGHT - 100;
const FIELD_X = 50;
const FIELD_Y = 50;
const GOAL_WIDTH = 10;
const GOAL_HEIGHT = 100;
const PLAYER_RADIUS = 10;
const BALL_RADIUS = 7;
const MAX_SPEED = 2.5;
const MAX_BALL_SPEED = 4;

// Loaded AI models per position
let aiModels = {};

function loadModels() {
    const roles = ['goalkeeper', 'defender', 'midfielder', 'forward'];

    roles.forEach(role => {
        const modelPath = `models/${role}.json`;

        if (typeof window !== 'undefined' && window.fetch) {
            fetch(modelPath)
                .then(res => res.ok ? res.json() : null)
                .then(model => { if (model) aiModels[role] = model; })
                .catch(() => { /* ignore load errors */ });
        } else {
            try {
                const fs = require('fs');
                const path = require('path');
                const data = fs.readFileSync(path.join(__dirname, `../../models/${role}.json`), 'utf8');
                aiModels[role] = JSON.parse(data);
            } catch (e) {
                // ignore load errors
            }
        }
    });
}

if (typeof __TEST__ === 'undefined') {
    loadModels();
}

// Get canvas and context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game state
let gameState = {
    score: [0, 0],
    ball: {
        x: CANVAS_WIDTH / 2,
        y: CANVAS_HEIGHT / 2,
        vx: 0,
        vy: 0
    },
    players: [],
    isPaused: false,
    speedMultiplier: 1
};

// Team definitions
const team1 = {
    name: "Red Team",
    color: "#e53e3e",
    direction: 1,  // Attacking right
    players: []
};

const team2 = {
    name: "Blue Team",
    color: "#3182ce",
    direction: -1,  // Attacking left
    players: []
};

// Initialize players
function initPlayers() {
    gameState.players = [];
    team1.players = [];
    team2.players = [];

    // Team 1 (Red) - 5 players
    const team1Positions = [
        { x: FIELD_X + 100, y: CANVAS_HEIGHT / 2, role: 'goalkeeper' },
        { x: FIELD_X + 200, y: CANVAS_HEIGHT / 2 - 50, role: 'defender' },
        { x: FIELD_X + 200, y: CANVAS_HEIGHT / 2 + 50, role: 'defender' },
        { x: FIELD_X + 350, y: CANVAS_HEIGHT / 2 - 30, role: 'midfielder' },
        { x: FIELD_X + 350, y: CANVAS_HEIGHT / 2 + 30, role: 'forward' }
    ];

    // Team 2 (Blue) - 5 players
    const team2Positions = [
        { x: FIELD_X + FIELD_WIDTH - 100, y: CANVAS_HEIGHT / 2, role: 'goalkeeper' },
        { x: FIELD_X + FIELD_WIDTH - 200, y: CANVAS_HEIGHT / 2 - 50, role: 'defender' },
        { x: FIELD_X + FIELD_WIDTH - 200, y: CANVAS_HEIGHT / 2 + 50, role: 'defender' },
        { x: FIELD_X + FIELD_WIDTH - 350, y: CANVAS_HEIGHT / 2 - 30, role: 'midfielder' },
        { x: FIELD_X + FIELD_WIDTH - 350, y: CANVAS_HEIGHT / 2 + 30, role: 'forward' }
    ];

    // Create team 1 players
    for (let i = 0; i < 5; i++) {
        const player = {
            team: 0,
            x: team1Positions[i].x,
            y: team1Positions[i].y,
            targetX: team1Positions[i].x,
            targetY: team1Positions[i].y,
            vx: 0,
            vy: 0,
            role: team1Positions[i].role
        };
        gameState.players.push(player);
        team1.players.push(player);
    }

    // Create team 2 players
    for (let i = 0; i < 5; i++) {
        const player = {
            team: 1,
            x: team2Positions[i].x,
            y: team2Positions[i].y,
            targetX: team2Positions[i].x,
            targetY: team2Positions[i].y,
            vx: 0,
            vy: 0,
            role: team2Positions[i].role
        };
        gameState.players.push(player);
        team2.players.push(player);
    }
}

// AI decision making
function makeAIDecisions() {
    const ball = gameState.ball;
    
    // Team 1 AI decisions
    team1.players.forEach(player => {
        let targetX, targetY;
        
        switch(player.role) {
            case 'goalkeeper':
                // Goalkeeper stays near goal and tries to intercept ball
                const goalX1 = FIELD_X + 5;
                if (aiModels.goalkeeper) {
                    const features = [ball.x - player.x, ball.y - player.y];
                    let z = aiModels.goalkeeper.bias;
                    aiModels.goalkeeper.weights.forEach((w, i) => { z += w * features[i]; });
                    const prob = 1 / (1 + Math.exp(-z));
                    if (prob > 0.5) {
                        targetX = ball.x;
                        targetY = ball.y;
                        break;
                    }
                }
                targetX = goalX1 + 15;
                targetY = Math.max(FIELD_Y + 20, Math.min(FIELD_Y + FIELD_HEIGHT - 20, ball.y));
                break;
                
            case 'defender':
                if (aiModels.defender) {
                    const features = [ball.x - player.x, ball.y - player.y];
                    let z = aiModels.defender.bias;
                    aiModels.defender.weights.forEach((w, i) => { z += w * features[i]; });
                    const prob = 1 / (1 + Math.exp(-z));
                    if (prob > 0.5) {
                        targetX = ball.x - 20;
                        targetY = ball.y;
                    } else {
                        targetX = player.x;
                        targetY = player.y;
                    }
                } else {
                    if (ball.x < FIELD_X + FIELD_WIDTH / 2) {
                        targetX = ball.x - 20;
                        targetY = ball.y;
                    } else {
                        targetX = player.x;
                        targetY = player.y;
                    }
                }
                break;
                
            case 'midfielder':
                if (aiModels.midfielder) {
                    const features = [ball.x - player.x, ball.y - player.y];
                    let z = aiModels.midfielder.bias;
                    aiModels.midfielder.weights.forEach((w, i) => { z += w * features[i]; });
                    const prob = 1 / (1 + Math.exp(-z));
                    if (prob > 0.5) {
                        targetX = ball.x - 30 * team1.direction;
                        targetY = ball.y;
                    } else {
                        targetX = player.x;
                        targetY = CANVAS_HEIGHT / 2;
                    }
                } else {
                    targetX = ball.x - 30 * team1.direction;
                    targetY = ball.y;
                }
                break;
                
            case 'forward':
                if (aiModels.forward) {
                    const features = [ball.x - player.x, ball.y - player.y];
                    let z = aiModels.forward.bias;
                    aiModels.forward.weights.forEach((w, i) => { z += w * features[i]; });
                    const prob = 1 / (1 + Math.exp(-z));
                    if (prob > 0.5) {
                        targetX = ball.x + 10 * team1.direction;
                        targetY = ball.y;
                    } else {
                        targetX = FIELD_X + FIELD_WIDTH - 100;
                        targetY = CANVAS_HEIGHT / 2;
                    }
                } else {
                    if (Math.abs(ball.x - (FIELD_X + FIELD_WIDTH)) < 100) {
                        targetX = ball.x + 10 * team1.direction;
                        targetY = ball.y;
                    } else {
                        targetX = FIELD_X + FIELD_WIDTH - 100;
                        targetY = CANVAS_HEIGHT / 2;
                    }
                }
                break;
        }
        
        player.targetX = targetX;
        player.targetY = targetY;
    });
    
    // Team 2 AI decisions
    team2.players.forEach(player => {
        let targetX, targetY;
        
        switch(player.role) {
            case 'goalkeeper':
                const goalX2 = FIELD_X + FIELD_WIDTH - 5;
                if (aiModels.goalkeeper) {
                    const features = [ball.x - player.x, ball.y - player.y];
                    let z = aiModels.goalkeeper.bias;
                    aiModels.goalkeeper.weights.forEach((w, i) => { z += w * features[i]; });
                    const prob = 1 / (1 + Math.exp(-z));
                    if (prob > 0.5) {
                        targetX = ball.x;
                        targetY = ball.y;
                        break;
                    }
                }
                targetX = goalX2 - 15;
                targetY = Math.max(FIELD_Y + 20, Math.min(FIELD_Y + FIELD_HEIGHT - 20, ball.y));
                break;
                
            case 'defender':
                if (aiModels.defender) {
                    const features = [ball.x - player.x, ball.y - player.y];
                    let z = aiModels.defender.bias;
                    aiModels.defender.weights.forEach((w, i) => { z += w * features[i]; });
                    const prob = 1 / (1 + Math.exp(-z));
                    if (prob > 0.5) {
                        targetX = ball.x + 20;
                        targetY = ball.y;
                    } else {
                        targetX = player.x;
                        targetY = player.y;
                    }
                } else {
                    if (ball.x > FIELD_X + FIELD_WIDTH / 2) {
                        targetX = ball.x + 20;
                        targetY = ball.y;
                    } else {
                        targetX = player.x;
                        targetY = player.y;
                    }
                }
                break;
                
            case 'midfielder':
                if (aiModels.midfielder) {
                    const features = [ball.x - player.x, ball.y - player.y];
                    let z = aiModels.midfielder.bias;
                    aiModels.midfielder.weights.forEach((w, i) => { z += w * features[i]; });
                    const prob = 1 / (1 + Math.exp(-z));
                    if (prob > 0.5) {
                        targetX = ball.x + 30 * team2.direction;
                        targetY = ball.y;
                    } else {
                        targetX = player.x;
                        targetY = CANVAS_HEIGHT / 2;
                    }
                } else {
                    targetX = ball.x + 30 * team2.direction;
                    targetY = ball.y;
                }
                break;
                
            case 'forward':
                if (aiModels.forward) {
                    const features = [ball.x - player.x, ball.y - player.y];
                    let z = aiModels.forward.bias;
                    aiModels.forward.weights.forEach((w, i) => { z += w * features[i]; });
                    const prob = 1 / (1 + Math.exp(-z));
                    if (prob > 0.5) {
                        targetX = ball.x - 10 * team2.direction;
                        targetY = ball.y;
                    } else {
                        targetX = FIELD_X + 100;
                        targetY = CANVAS_HEIGHT / 2;
                    }
                } else {
                    if (Math.abs(ball.x - FIELD_X) < 100) {
                        targetX = ball.x - 10 * team2.direction;
                        targetY = ball.y;
                    } else {
                        targetX = FIELD_X + 100;
                        targetY = CANVAS_HEIGHT / 2;
                    }
                }
                break;
        }
        
        player.targetX = targetX;
        player.targetY = targetY;
    });
}

// Update game state
function update() {
    if (gameState.isPaused) return;

    const speed = gameState.speedMultiplier;
    
    makeAIDecisions();
    
    // Update players
    gameState.players.forEach(player => {
        // Move towards target
        const dx = player.targetX - player.x;
        const dy = player.targetY - player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 5) {
            player.vx = (dx / dist) * MAX_SPEED * speed;
            player.vy = (dy / dist) * MAX_SPEED * speed;
        } else {
            player.vx *= 0.8;
            player.vy *= 0.8;
        }
        
        // Apply velocity
        player.x += player.vx * speed;
        player.y += player.vy * speed;
        
        // Keep players on the field
        player.x = Math.max(FIELD_X + PLAYER_RADIUS, Math.min(FIELD_X + FIELD_WIDTH - PLAYER_RADIUS, player.x));
        player.y = Math.max(FIELD_Y + PLAYER_RADIUS, Math.min(FIELD_Y + FIELD_HEIGHT - PLAYER_RADIUS, player.y));
    });
    
    // Update ball
    gameState.ball.x += gameState.ball.vx * speed;
    gameState.ball.y += gameState.ball.vy * speed;
    
    // Ball friction
    gameState.ball.vx *= 0.98;
    gameState.ball.vy *= 0.98;
    
    // Ball collision with boundaries
    if (gameState.ball.y - BALL_RADIUS < FIELD_Y || gameState.ball.y + BALL_RADIUS > FIELD_Y + FIELD_HEIGHT) {
        gameState.ball.vy *= -0.8;
        gameState.ball.y = Math.max(FIELD_Y + BALL_RADIUS, Math.min(FIELD_Y + FIELD_HEIGHT - BALL_RADIUS, gameState.ball.y));
    }
    
    // Check for goals
    if (gameState.ball.x - BALL_RADIUS < FIELD_X) {
        // Check if ball is within goal
        if (gameState.ball.y > CANVAS_HEIGHT / 2 - GOAL_HEIGHT / 2 && 
            gameState.ball.y < CANVAS_HEIGHT / 2 + GOAL_HEIGHT / 2) {
            // Goal for team 2
            gameState.score[1]++;
            document.getElementById('score2').textContent = gameState.score[1];
            canvas.classList.add('goal-flash');
            setTimeout(() => canvas.classList.remove('goal-flash'), 1000);
            resetPositions();
        } else {
            // Out of bounds
            gameState.ball.vx *= -0.8;
            gameState.ball.x = FIELD_X + BALL_RADIUS;
        }
    }
    
    if (gameState.ball.x + BALL_RADIUS > FIELD_X + FIELD_WIDTH) {
        if (gameState.ball.y > CANVAS_HEIGHT / 2 - GOAL_HEIGHT / 2 && 
            gameState.ball.y < CANVAS_HEIGHT / 2 + GOAL_HEIGHT / 2) {
            // Goal for team 1
            gameState.score[0]++;
            document.getElementById('score1').textContent = gameState.score[0];
            canvas.classList.add('goal-flash');
            setTimeout(() => canvas.classList.remove('goal-flash'), 1000);
            resetPositions();
        } else {
            gameState.ball.vx *= -0.8;
            gameState.ball.x = FIELD_X + FIELD_WIDTH - BALL_RADIUS;
        }
    }
    
    // Ball collision with players
    gameState.players.forEach(player => {
        const dx = gameState.ball.x - player.x;
        const dy = gameState.ball.y - player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < PLAYER_RADIUS + BALL_RADIUS) {
            // Calculate collision response
            const angle = Math.atan2(dy, dx);
            const speed = Math.sqrt(player.vx * player.vx + player.vy * player.vy) + 2;
            
            gameState.ball.vx = Math.cos(angle) * Math.min(speed, MAX_BALL_SPEED);
            gameState.ball.vy = Math.sin(angle) * Math.min(speed, MAX_BALL_SPEED);
            
            // Move ball outside player
            gameState.ball.x = player.x + Math.cos(angle) * (PLAYER_RADIUS + BALL_RADIUS);
            gameState.ball.y = player.y + Math.sin(angle) * (PLAYER_RADIUS + BALL_RADIUS);
        }
    });
}

// Draw field
function drawField() {
    // Field
    ctx.fillStyle = '#2e7d32';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Field lines
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    
    // Outer boundary
    ctx.strokeRect(FIELD_X, FIELD_Y, FIELD_WIDTH, FIELD_HEIGHT);
    
    // Center line
    ctx.beginPath();
    ctx.moveTo(CANVAS_WIDTH / 2, FIELD_Y);
    ctx.lineTo(CANVAS_WIDTH / 2, FIELD_Y + FIELD_HEIGHT);
    ctx.stroke();
    
    // Center circle
    ctx.beginPath();
    ctx.arc(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 50, 0, Math.PI * 2);
    ctx.stroke();
    
    // Center spot
    ctx.beginPath();
    ctx.arc(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 3, 0, Math.PI * 2);
    ctx.fill();
    
    // Goals
    ctx.fillStyle = '#ffffff';
    // Left goal
    ctx.fillRect(FIELD_X - GOAL_WIDTH, CANVAS_HEIGHT / 2 - GOAL_HEIGHT / 2, GOAL_WIDTH, GOAL_HEIGHT);
    // Right goal
    ctx.fillRect(FIELD_X + FIELD_WIDTH, CANVAS_HEIGHT / 2 - GOAL_HEIGHT / 2, GOAL_WIDTH, GOAL_HEIGHT);
    
    // Penalty areas
    ctx.strokeRect(FIELD_X, CANVAS_HEIGHT / 2 - GOAL_HEIGHT, 60, GOAL_HEIGHT * 2);
    ctx.strokeRect(FIELD_X + FIELD_WIDTH - 60, CANVAS_HEIGHT / 2 - GOAL_HEIGHT, 60, GOAL_HEIGHT * 2);
}

// Draw game
function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Draw field
    drawField();
    
    // Draw players
    gameState.players.forEach((player, index) => {
        ctx.beginPath();
        ctx.arc(player.x, player.y, PLAYER_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = player.team === 0 ? team1.color : team2.color;
        ctx.fill();
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Draw player number
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText((index % 5) + 1, player.x, player.y);
    });
    
    // Draw ball
    ctx.beginPath();
    ctx.arc(gameState.ball.x, gameState.ball.y, BALL_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Draw ball trail
    if (Math.abs(gameState.ball.vx) > 0.5 || Math.abs(gameState.ball.vy) > 0.5) {
        ctx.globalAlpha = 0.3;
        for (let i = 1; i <= 3; i++) {
            ctx.beginPath();
            ctx.arc(
                gameState.ball.x - gameState.ball.vx * i * 2,
                gameState.ball.y - gameState.ball.vy * i * 2,
                BALL_RADIUS - i,
                0,
                Math.PI * 2
            );
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }
    
    // Draw pause indicator
    if (gameState.isPaused) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.fillStyle = '#ffffff';
        ctx.font = '48px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    }
}

// Reset positions after goal
function resetPositions() {
    gameState.ball.x = CANVAS_WIDTH / 2;
    gameState.ball.y = CANVAS_HEIGHT / 2;
    gameState.ball.vx = (Math.random() - 0.5) * 2;
    gameState.ball.vy = (Math.random() - 0.5) * 2;
    
    initPlayers();
}

// Game loop
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Reset game
function resetGame() {
    gameState.score = [0, 0];
    document.getElementById('score1').textContent = '0';
    document.getElementById('score2').textContent = '0';
    resetPositions();
}

// Toggle pause
function togglePause() {
    gameState.isPaused = !gameState.isPaused;
}

// Expose controls in the browser and start the game unless running under test
if (typeof window !== 'undefined') {
    window.resetGame = resetGame;
    window.togglePause = togglePause;

    const speedSlider = document.getElementById('speedSlider');
    const speedValue = document.getElementById('speedValue');

    if (speedSlider && speedValue) {
        speedSlider.addEventListener('input', (e) => {
            gameState.speedMultiplier = parseFloat(e.target.value);
            speedValue.textContent = gameState.speedMultiplier.toFixed(1) + 'x';
        });
    }

    if (!window.__TEST__) {
        initPlayers();
        gameLoop();
    }
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { initPlayers, gameState };
}
