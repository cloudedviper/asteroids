const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const ship = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: 15,
    angle: 0,
    rotation: 0,
    thrusting: false,
    thrust: {
        x: 0,
        y: 0
    },
    canShoot: true,
    shootCooldown: 0,
    lives: 3,
    blinkNum: 0
};

const FRICTION = 0.7; // Friction coefficient of space (0 = no friction, 1 = lots of friction)
const SHIP_THRUST = 0.1; // Acceleration of the ship in pixels per frame per frame
const TURN_SPEED = 360; // Turn speed in degrees per second

const bullets = [];
const BULLET_SPEED = 5; // Speed of bullets in pixels per frame
const BULLET_LIFETIME = 60; // Lifetime of bullets in frames

const asteroids = [];
const ASTEROID_NUM = 5; // Number of initial asteroids
const ASTEROID_SIZE = 50; // Size of asteroids in pixels
const ASTEROID_SPEED = 1; // Maximum speed of asteroids in pixels per frame
const ASTEROID_VERT = 10; // Average number of vertices on each asteroid
const ASTEROID_JAG = 0.4; // Jaggedness of the asteroids (0 = none, 1 = lots)

let score = 0;
let gameOver = false;

function createAsteroidBelt() {
    for (let i = 0; i < ASTEROID_NUM; i++) {
        createAsteroid();
    }
}

function createAsteroid() {
    let x, y;
    do {
        x = Math.floor(Math.random() * canvas.width);
        y = Math.floor(Math.random() * canvas.height);
    } while (distBetweenPoints(ship.x, ship.y, x, y) < ASTEROID_SIZE * 2 + ship.radius);

    const xv = (Math.random() - 0.5) * ASTEROID_SPEED;
    const yv = (Math.random() - 0.5) * ASTEROID_SPEED;

    const vert = Math.floor(Math.random() * (ASTEROID_VERT + 1) + ASTEROID_VERT / 2);
    const offs = [];
    for (let i = 0; i < vert; i++) {
        offs.push(Math.random() * ASTEROID_JAG * 2 + 1 - ASTEROID_JAG);
    }

    asteroids.push({ x, y, xv, yv, vert, offs });
}

function distBetweenPoints(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

function update() {
    if (gameOver) return;

    const blinkOn = ship.blinkNum % 2 === 0;

    // Rotate ship
    ship.angle += ship.rotation;

    // Move the ship
    if (ship.thrusting) {
        ship.thrust.x += SHIP_THRUST * Math.cos(ship.angle);
        ship.thrust.y += -SHIP_THRUST * Math.sin(ship.angle);
    }
    ship.x += ship.thrust.x;
    ship.y += ship.thrust.y;

    // Apply friction
    ship.thrust.x *= FRICTION;
    ship.thrust.y *= FRICTION;

    // Handle edge of screen
    if (ship.x < 0) {
        ship.x = canvas.width;
    } else if (ship.x > canvas.width) {
        ship.x = 0;
    }
    if (ship.y < 0) {
        ship.y = canvas.height;
    } else if (ship.y > canvas.height) {
        ship.y = 0;
    }

    // Move bullets
    for (let i = 0; i < bullets.length; i++) {
        bullets[i].x += bullets[i].xv;
        bullets[i].y += bullets[i].yv;
        bullets[i].life++;

        // Remove bullets that go off-screen or have exceeded their lifetime
        if (bullets[i].x < 0 || bullets[i].x > canvas.width || bullets[i].y < 0 || bullets[i].y > canvas.height || bullets[i].life > BULLET_LIFETIME) {
            bullets.splice(i, 1);
            i--;
        }
    }

    // Move asteroids
    for (let i = 0; i < asteroids.length; i++) {
        asteroids[i].x += asteroids[i].xv;
        asteroids[i].y += asteroids[i].yv;

        // Handle edge of screen
        if (asteroids[i].x < 0) {
            asteroids[i].x = canvas.width;
        } else if (asteroids[i].x > canvas.width) {
            asteroids[i].x = 0;
        }
        if (asteroids[i].y < 0) {
            asteroids[i].y = canvas.height;
        } else if (asteroids[i].y > canvas.height) {
            asteroids[i].y = 0;
        }
    }

    // Collision detection
    for (let i = 0; i < asteroids.length; i++) {
        if (distBetweenPoints(ship.x, ship.y, asteroids[i].x, asteroids[i].y) < ship.radius + ASTEROID_SIZE) {
            ship.lives--;
            asteroids.splice(i, 1);
            if (ship.lives <= 0) {
                gameOver = true;
            }
            break;
        }
    }

    // Bullet-asteroid collision detection
    for (let i = 0; i < asteroids.length; i++) {
        for (let j = 0; j < bullets.length; j++) {
            if (distBetweenPoints(bullets[j].x, bullets[j].y, asteroids[i].x, asteroids[i].y) < ASTEROID_SIZE) {
                asteroids.splice(i, 1);
                bullets.splice(j, 1);
                score += 10;
                break;
            }
        }
    }

    // Draw space
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw ship
    if (blinkOn) {
        ctx.strokeStyle = 'white';
        ctx.lineWidth = ship.radius / 10;
        ctx.beginPath();
        ctx.moveTo(
            ship.x + 4 / 3 * ship.radius * Math.cos(ship.angle),
            ship.y - 4 / 3 * ship.radius * Math.sin(ship.angle)
        );
        ctx.lineTo(
            ship.x - ship.radius * (2 / 3 * Math.cos(ship.angle) + Math.sin(ship.angle)),
            ship.y + ship.radius * (2 / 3 * Math.sin(ship.angle) - Math.cos(ship.angle))
        );
        ctx.lineTo(
            ship.x - ship.radius * (2 / 3 * Math.cos(ship.angle) - Math.sin(ship.angle)),
            ship.y + ship.radius * (2 / 3 * Math.sin(ship.angle) + Math.cos(ship.angle))
        );
        ctx.closePath();
        ctx.stroke();
    }

    // Draw bullets
    ctx.fillStyle = 'white';
    for (let i = 0; i < bullets.length; i++) {
        ctx.beginPath();
        ctx.arc(bullets[i].x, bullets[i].y, 2, 0, Math.PI * 2, false);
        ctx.fill();
    }

    // Draw asteroids
    ctx.strokeStyle = 'blue';
    for (let i = 0; i < asteroids.length; i++) {
        ctx.beginPath();
        ctx.moveTo(
            asteroids[i].x + asteroids[i].offs[0] * ASTEROID_SIZE * Math.cos(0),
            asteroids[i].y + asteroids[i].offs[0] * ASTEROID_SIZE * Math.sin(0)
        );
        for (let j = 1; j < asteroids[i].vert; j++) {
            ctx.lineTo(
                asteroids[i].x + asteroids[i].offs[j] * ASTEROID_SIZE * Math.cos(j * Math.PI * 2 / asteroids[i].vert),
                asteroids[i].y + asteroids[i].offs[j] * ASTEROID_SIZE * Math.sin(j * Math.PI * 2 / asteroids[i].vert)
            );
        }
        ctx.closePath();
        ctx.stroke();
    }

    // Draw score
    ctx.fillStyle = 'white';
    ctx.font = '24px Arial';
    ctx.fillText(`Score: ${score}`, 20, 30);

    // Draw lives
    ctx.fillText(`Lives: ${ship.lives}`, canvas.width - 100, 30);

    if (!gameOver) {
        requestAnimationFrame(update);
    } else {
        ctx.fillStyle = 'red';
        ctx.font = '48px Arial';
        ctx.fillText('GAME OVER', canvas.width / 2 - 150, canvas.height / 2);
    }
}

document.addEventListener('keydown', keyDown);
document.addEventListener('keyup', keyUp);

function keyDown(ev) {
    switch (ev.keyCode) {
        case 32: // Space bar (shoot)
            if (ship.canShoot && ship.shootCooldown === 0) {
                bullets.push({
                    x: ship.x + 4 / 3 * ship.radius * Math.cos(ship.angle),
                    y: ship.y - 4 / 3 * ship.radius * Math.sin(ship.angle),
                    xv: BULLET_SPEED * Math.cos(ship.angle),
                    yv: -BULLET_SPEED * Math.sin(ship.angle),
                    life: 0
                });
                ship.canShoot = false;
                ship.shootCooldown = 15; // Cooldown period for shooting
            }
            break;
        case 37: // Left arrow (rotate left)
            ship.rotation = -TURN_SPEED / 180 * Math.PI / 60;
            break;
        case 39: // Right arrow (rotate right)
            ship.rotation = TURN_SPEED / 180 * Math.PI / 60;
            break;
        case 38: // Up arrow (thrust)
            ship.thrusting = true;
            break;
    }
}

function keyUp(ev) {
    switch (ev.keyCode) {
        case 32: // Space bar (allow shooting again)
            ship.canShoot = true;
            ship.shootCooldown = 0;
            break;
        case 37: // Left arrow (stop rotation)
        case 39: // Right arrow (stop rotation)
            ship.rotation = 0;
            break;
        case 38: // Up arrow (stop thrust)
            ship.thrusting = false;
            break;
    }
}

// Continuously create new asteroids
setInterval(createAsteroid, 3000); // Every 3 seconds

createAsteroidBelt();
update();
