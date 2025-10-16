const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const gameOverEl = document.getElementById('game-over');

let score = 0;
let gameOver = false;

// プレイヤー（シーサー）
const player = {
    x: canvas.width / 2 - 25,
    y: canvas.height - 60,
    width: 50,
    height: 50,
    speed: 5,
    dx: 0,
    emoji: '🦁'
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
    rows: 4,
    cols: 8,
    padding: 20,
    offsetX: 60,
    offsetY: 50,
    speed: 1
};

// 敵の生成
function createEnemies() {
    for (let r = 0; r < enemyInfo.rows; r++) {
        for (let c = 0; c < enemyInfo.cols; c++) {
            enemies.push({
                x: c * (enemyInfo.width + enemyInfo.padding) + enemyInfo.offsetX,
                y: r * (enemyInfo.height + enemyInfo.padding) + enemyInfo.offsetY,
                width: enemyInfo.width,
                height: enemyInfo.height
            });
        }
    }
}

createEnemies(); // 最初の敵を生成
setInterval(createEnemies, 10000); // 10秒ごとに新しい敵を生成

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
        ctx.fillText(enemyInfo.emoji, enemy.x, enemy.y + enemy.height - 5);
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
        if (p.y + p.height < 0) {
            projectiles.splice(index, 1);
        }
    });
}

// 敵の移動
function moveEnemies() {
    let moveDown = false;
    enemies.forEach(enemy => {
        enemy.x += enemyInfo.speed;
        if (enemy.x + enemy.width > canvas.width || enemy.x < 0) {
            moveDown = true;
        }
    });

    if (moveDown) {
        enemyInfo.speed *= -1;
        enemies.forEach(enemy => {
            enemy.y += enemy.height / 2;
        });
    }
}

// 衝突判定
function checkCollisions() {
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
                enemies.splice(eIndex, 1);
                score++;
                scoreEl.innerText = score;
            }
        });
    });

    // 敵が下まで来たか
    enemies.forEach(enemy => {
        if (enemy.y + enemy.height > player.y) {
            gameOver = true;
        }
    });
}

function update() {
    if (gameOver) {
        gameOverEl.classList.remove('hidden');
        return;
    }

    movePlayer();
    moveProjectiles();
    moveEnemies();
    checkCollisions();

    draw();

    requestAnimationFrame(update);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawPlayer();
    drawProjectiles();
    drawEnemies();
}

// キー操作
function keyDown(e) {
    if (e.key === 'ArrowRight' || e.key === 'Right') {
        player.dx = player.speed;
    } else if (e.key === 'ArrowLeft' || e.key === 'Left') {
        player.dx = -player.speed;
    } else if (e.key === ' ' || e.key === 'Spacebar') {
        // 弾の発射
        if (projectiles.length < 5) { // 画面上の弾の数を制限
            projectiles.push({
                x: player.x + player.width / 2 - projectile.width / 2,
                y: player.y,
                width: projectile.width,
                height: projectile.height,
                speed: projectile.speed
            });
        }
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

update();
