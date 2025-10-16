const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const gameOverEl = document.getElementById('game-over');
const startScreen = document.getElementById('start-screen');
const restartButton = document.getElementById('restart-button');

let score = 0;
let gameOver = false;
let gameStarted = false;

// プレイヤー（シーサー）
const player = {
    x: canvas.width / 2 - 25,
    y: canvas.height - 60,
    width: 50,
    height: 50,
    speed: 5,
    dx: 0,
    emoji: '🦁',
    hasPowerUp: false
};

// パワーアップアイテム
const powerUps = [];
const powerUpInfo = {
    width: 30,
    height: 30,
    speed: 3,
    emoji: '🍪' // ちんすこう
};

// 弾
const projectiles = [];
const projectile = {
    width: 10,
    height: 20,
    speed: 7,
    emoji: '🔥'
};

// 敵（ゴーヤ）
const enemies = [];
const enemyInfo = {
    width: 40,
    height: 40,
    emoji: '🥒',
    specialEmoji: '🍍',
    rows: 2,
    cols: 8,
    padding: 20,
    offsetX: 60,
    offsetY: 50,
    speedY: 0.2, // 敵の下降速度
    speedX: 1 // 敵の水平速度
};

// 敵の生成
function createEnemies() {
    const newEnemies = [];
    for (let r = 0; r < enemyInfo.rows; r++) {
        for (let c = 0; c < enemyInfo.cols; c++) {
            const isSpecial = Math.random() < 0.2;
            newEnemies.push({
                x: c * (enemyInfo.width + enemyInfo.padding) + enemyInfo.offsetX,
                y: r * (enemyInfo.height + enemyInfo.padding) - enemyInfo.offsetY, // Start off-screen
                width: enemyInfo.width,
                height: enemyInfo.height,
                isSpecial: isSpecial,
                emoji: isSpecial ? enemyInfo.specialEmoji : enemyInfo.emoji
            });
        }
    }

    // 新しい敵の塊が既存の敵と重ならないかチェック
    let overlapping = false;
    for (const newEnemy of newEnemies) {
        for (const existingEnemy of enemies) {
            if (isOverlapping(newEnemy, existingEnemy)) {
                overlapping = true;
                break;
            }
        }
        if (overlapping) {
            break;
        }
    }

    // 重なっていなければ敵を追加
    if (!overlapping) {
        enemies.push(...newEnemies);
    }
}

function isOverlapping(rect1, rect2) {
    return (
        rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y
    );
}

let enemyInterval;

function startEnemySpawning() {
    if (enemyInterval) clearInterval(enemyInterval);
    enemyInterval = setInterval(() => {
        if(gameStarted && !gameOver) {
            createEnemies();
        }
    }, 5000); // 5秒ごとに新しい敵を生成
}

// 描画
function drawPlayer() {
    ctx.font = '48px serif';
    ctx.fillText(player.emoji, player.x, player.y + player.height - 10);
}

function drawProjectiles() {
    ctx.font = '24px serif';
    projectiles.forEach(p => {
        ctx.fillText(projectile.emoji, p.x, p.y + p.height - 5);
    });
}

function drawEnemies() {
    ctx.font = '36px serif';
    enemies.forEach(enemy => {
        ctx.fillText(enemy.emoji, enemy.x, enemy.y + enemy.height - 5);
    });
}

function drawPowerUps() {
    ctx.font = '30px serif';
    powerUps.forEach(powerUp => {
        ctx.fillText(powerUpInfo.emoji, powerUp.x, powerUp.y + powerUpInfo.height - 5);
    });
}

// プレイヤーの移動
function movePlayer() {
    player.x += player.dx;

    // 壁のチェック
    if (player.x < 0) {
        player.x = 0;
    }
    if (player.x + player.width > canvas.width) {
        player.x = canvas.width - player.width;
    }
}

// 弾の移動
function moveProjectiles() {
    projectiles.forEach((p, index) => {
        p.y -= p.speed;
        p.x += p.dx; // 水平方向の移動を追加
        if (p.y + p.height < 0) {
            projectiles.splice(index, 1);
        }
    });
}

// 敵の移動
function moveEnemies() {
    let edgeReached = false;
    enemies.forEach((enemy, index) => {
        enemy.x += enemyInfo.speedX;
        enemy.y += enemyInfo.speedY;

        if (enemy.x + enemy.width > canvas.width || enemy.x < 0) {
            edgeReached = true;
        }

        if (enemy.y > canvas.height) {
            enemies.splice(index, 1);
        }
    });

    if (edgeReached) {
        enemyInfo.speedX *= -1;
    }
}

// パワーアップアイテムの移動
function movePowerUps() {
    powerUps.forEach((powerUp, index) => {
        powerUp.y += powerUpInfo.speed;
        if (powerUp.y > canvas.height) {
            powerUps.splice(index, 1);
        }
    });
}

// 衝突判定
function checkCollisions() {
    // 弾と敵の衝突
    projectiles.forEach((p, pIndex) => {
        enemies.forEach((enemy, eIndex) => {
            if (
                p.x < enemy.x + enemy.width &&
                p.x + projectile.width > enemy.x &&
                p.y < enemy.y + enemy.height &&
                p.y + projectile.height > enemy.y
            ) {
                // 衝突したら弾と敵を消す
                projectiles.splice(pIndex, 1);

                if (enemy.isSpecial) {
                    score += 2;
                    // パワーアップアイテムを生成
                    powerUps.push({
                        x: enemy.x + enemy.width / 2 - powerUpInfo.width / 2,
                        y: enemy.y,
                        width: powerUpInfo.width,
                        height: powerUpInfo.height
                    });
                } else {
                    score++;
                }
                enemies.splice(eIndex, 1);
                scoreEl.innerText = score;
            }
        });
    });

    // プレイヤーとパワーアップアイテムの衝突
    powerUps.forEach((powerUp, puIndex) => {
        if (
            player.x < powerUp.x + powerUp.width &&
            player.x + player.width > powerUp.x &&
            player.y < powerUp.y + powerUp.height &&
            player.y + player.height > powerUp.y
        ) {
            powerUps.splice(puIndex, 1);
            player.hasPowerUp = true;
            // 10秒後にパワーアップ解除
            setTimeout(() => {
                player.hasPowerUp = false;
            }, 10000);
        }
    });

    // 敵がプレイヤーに衝突
    enemies.forEach(enemy => {
        if (
            player.x < enemy.x + enemy.width &&
            player.x + player.width > enemy.x &&
            player.y < enemy.y + enemy.height &&
            player.y + player.height > enemy.y
        ) {
            gameOver = true;
        }
    });
}

function restartGame() {
    score = 0;
    gameOver = false;
    scoreEl.innerText = score;
    gameOverEl.classList.add('hidden');
    startScreen.classList.remove('hidden');

    player.x = canvas.width / 2 - 25;
    player.y = canvas.height - 60;

    enemies.length = 0;
    projectiles.length = 0;

    gameStarted = false;
    if (enemyInterval) clearInterval(enemyInterval);

    update();
}

function update() {
    if (gameOver) {
        gameOverEl.classList.remove('hidden');
        if (enemyInterval) clearInterval(enemyInterval);
        return;
    }

    if (!gameStarted) {
        requestAnimationFrame(update);
        return;
    }

    movePlayer();
    moveProjectiles();
    moveEnemies();
    movePowerUps();
    checkCollisions();

    draw();

    requestAnimationFrame(update);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawPlayer();
    drawProjectiles();
    drawEnemies();
    drawPowerUps();
}

// キー操作
function keyDown(e) {
    if (e.key === ' ' || e.key === 'Spacebar') {
        if (!gameStarted) {
            gameStarted = true;
            startScreen.classList.add('hidden');
            createEnemies(); //最初の敵を生成
            startEnemySpawning();
        } else if (!gameOver) {
            const limit = player.hasPowerUp ? 15 : 5;
            if (projectiles.length < limit) { // 画面上の弾の数を制限
                if (player.hasPowerUp) {
                    // 3方向ショット
                    projectiles.push({ // 中央
                        x: player.x + player.width / 2 - projectile.width / 2,
                        y: player.y,
                        width: projectile.width,
                        height: projectile.height,
                        speed: projectile.speed,
                        dx: 0
                    });
                    projectiles.push({ // 左
                        x: player.x + player.width / 2 - projectile.width / 2,
                        y: player.y,
                        width: projectile.width,
                        height: projectile.height,
                        speed: projectile.speed,
                        dx: -2
                    });
                    projectiles.push({ // 右
                        x: player.x + player.width / 2 - projectile.width / 2,
                        y: player.y,
                        width: projectile.width,
                        height: projectile.height,
                        speed: projectile.speed,
                        dx: 2
                    });
                } else {
                    // 通常の弾
                    projectiles.push({
                        x: player.x + player.width / 2 - projectile.width / 2,
                        y: player.y,
                        width: projectile.width,
                        height: projectile.height,
                        speed: projectile.speed,
                        dx: 0
                    });
                }
            }
        }
    }
    if (e.key === 'ArrowRight' || e.key === 'Right') {
        player.dx = player.speed;
    } else if (e.key === 'ArrowLeft' || e.key === 'Left') {
        player.dx = -player.speed;
    }
}

function keyUp(e) {
    if (
        e.key === 'ArrowRight' ||
        e.key === 'Right' ||
        e.key === 'ArrowLeft' ||
        e.key === 'Left'
    ) {
        player.dx = 0;
    }
}

document.addEventListener('keydown', keyDown);
document.addEventListener('keyup', keyUp);
restartButton.addEventListener('click', restartGame);

update();