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
    blinkNum: 0 // Number of blinks remaining (for visibility toggle)
};

const FRICTION = 0.7; // Friction coefficient of space (0 = no friction, 1 = lots of friction)
const SHIP_THRUST = 0.1; // Acceleration of the ship in pixels per second per second
const TURN_SPEED = 360; // Turn speed in degrees per second

const bullets = [];
const BULLET_SPEED = 500; // Speed of bullets in pixels per second
const BULLET_LIFETIME = 2; // Lifetime of bullets in seconds

const asteroids = [];
const ASTEROID_NUM = 5; // Starting number of asteroids
const ASTEROID_SIZE = 100; // Starting size of asteroids in pixels
const ASTEROID_SPEED = 50; // Maximum starting speed of asteroids in pixels per second
const ASTEROID_VERTICES = 10; // Average number of vertices on each asteroid
const ASTEROID_JAG = 0.4; // Jaggedness of the asteroids (0 = none, 1 = lots)

function createAsteroidBelt() {
    for (let i = 0; i < ASTEROID_NUM; i++) {
        let x, y;
        do {
            x = Math.floor(Math.random() * canvas.width);
            y = Math.floor(Math.random() * canvas.height);
        } while (distBetweenPoints(ship.x, ship.y, x, y) < ASTEROID_SIZE * 2 + ship.radius);
        asteroids.push(newAsteroid(x, y, Math.ceil(ASTEROID_SIZE / 2)));
    }
}

function newAsteroid(x, y, r) {
    const lvlMult = 1 + 0.1; // level multiplier, adjust for difficulty
    const asteroid = {
        x: x,
        y: y,
        xv: Math.random() * ASTEROID_SPEED * lvlMult / 30 * (Math.random() < 0.5 ? 1 : -1),
        yv: Math.random() * ASTEROID_SPEED * lvlMult / 30 * (Math.random() < 0.5 ? 1 : -1),
        r: r,
        a: Math.random() * Math.PI * 2, // in radians
        vert: Math.floor(Math.random() * (ASTEROID_VERTICES + 1) + ASTEROID_VERTICES / 2),
        offs: []
    };

    for (let i = 0; i < asteroid.vert; i++) {
        asteroid.offs.push(Math.random() * ASTEROID_JAG * 2 + 1 - ASTEROID_JAG);
    }

    return asteroid;
}

function distBetweenPoints(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

function update() {
    const blinkOn = ship.blinkNum % 2 === 0;

    // Rotate ship
    ship.angle += ship.rotation;

    // Move the ship
    ship.thrust.x += ship.thrusting ? SHIP_THRUST * Math.cos(ship.angle) : 0;
    ship.thrust.y -= ship.thrusting ? SHIP_THRUST * Math.sin(ship.angle) : 0;
    ship.x += ship.thrust.x;
    ship.y += ship.thrust.y;

    // Apply friction (slow the ship down when not thrusting)
    ship.thrust.x -= FRICTION * ship.thrust.x;
    ship.thrust.y -= FRICTION * ship.thrust.y;

    // Handle edge of screen
    if (ship.x < 0 - ship.radius) {
        ship.x = canvas.width + ship.radius;
    } else if (ship.x > canvas.width + ship.radius) {
        ship.x = 0 - ship.radius;
    }
    if (ship.y < 0 - ship.radius) {
        ship.y = canvas.height + ship.radius;
    } else if (ship.y > canvas.height + ship.radius) {
        ship.y = 0 - ship.radius;
    }

    // Move the asteroids
    for (let i = 0; i < asteroids.length; i++) {
        asteroids[i].x += asteroids[i].xv;
        asteroids[i].y += asteroids[i].yv;

        // Handle edge of screen
        if (asteroids[i].x < 0 - asteroids[i].r) {
            asteroids[i].x = canvas.width + asteroids[i].r;
        } else if (asteroids[i].x > canvas.width + asteroids[i].r) {
            asteroids[i].x = 0 - asteroids[i].r;
        }
        if (asteroids[i].y < 0 - asteroids[i].r) {
            asteroids[i].y = canvas.height + asteroids[i].r;
        } else if (asteroids[i].y > canvas.height + asteroids[i].r) {
            asteroids[i].y = 0 - asteroids[i].r;
        }
    }

    // Draw space
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw ship
    if (blinkOn) {
        ctx.strokeStyle = 'white';
        ctx.lineWidth = ship.radius / 20;
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

    // Draw asteroids
    ctx.strokeStyle = 'slategrey';
    ctx.lineWidth = ship.radius / 20;
    for (let i = 0; i < asteroids.length; i++) {
        ctx.beginPath();
        ctx.moveTo(
            asteroids[i].x + asteroids[i].r * asteroids[i].offs[0] * Math.cos(asteroids[i].a),
            asteroids[i].y + asteroids[i].r * asteroids[i].offs[0] * Math.sin(asteroids[i].a)
        );
        for (let j = 1; j < asteroids[i].vert; j++) {
            ctx.lineTo(
                asteroids[i].x + asteroids[i].r * asteroids[i].offs[j] * Math.cos(asteroids[i].a + j * Math.PI * 2 / asteroids[i].vert),
                asteroids[i].y + asteroids[i].r * asteroids[i].offs[j] * Math.sin(asteroids[i].a + j * Math.PI * 2 / asteroids[i].vert)
            );
        }
        ctx.closePath();
        ctx.stroke();
    }

    requestAnimationFrame(update);
}

document.addEventListener('keydown', keyDown);
document.addEventListener('keyup', keyUp);

function keyDown(/** @type {KeyboardEvent} */ ev) {
    switch(ev.keyCode) {
        case 32: // space bar (shoot laser)
            shootLaser();
            break;
        case 37: // left arrow (rotate ship left)
            ship.rotation = TURN_SPEED / 180 * Math.PI / 60;
            break;
        case 38: // up arrow (thrust the ship forward)
            ship.thrusting = true;
            break;
        case 39: // right arrow (rotate ship right)
            ship.rotation = -TURN_SPEED / 180 * Math.PI / 60;
            break;
    }
}

function keyUp(/** @type {KeyboardEvent} */ ev) {
    switch(ev.keyCode) {
        case 32: // space bar (allow shooting again)
            ship.canShoot = true;
            break;
        case 37: // left arrow (stop rotating left)
            ship.rotation = 0;
            break;
        case 38: // up arrow (stop thrusting)
            ship.thrusting = false;
            break;
        case 39: // right arrow (stop rotating right)
            ship.rotation = 0;
            break;
    }
}

function shootLaser() {
    if (ship.canShoot && bullets.length < 5) {
        bullets.push({
            x: ship.x + 4 / 3 * ship.radius * Math.cos(ship.angle),
            y: ship.y - 4 / 3 * ship.radius * Math.sin(ship.angle),
            xv: BULLET_SPEED * Math.cos(ship.angle) / 60,
            yv: -BULLET_SPEED * Math.sin(ship.angle) / 60,
            dist: 0
        });
        ship.canShoot = false;
    }
}

createAsteroidBelt();
update();

