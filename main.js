import './style.css';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score');
const gameOverDisplay = document.getElementById('gameOver');

const laneWidth = 100; // Increased lane width
const lanes = [canvas.width / 2 - laneWidth / 2, canvas.width / 2 + laneWidth / 2]; // Centered lanes
let currentLane = 0;
let score = 0;
let gameOver = false;

const player = {
    x: lanes[currentLane],
    y: 550,
    width: 15,
    height: 20
};

const mobs = [];
const projectiles = [];
const multipliers = [];

let weapons = [
    { name: "Pistol", damage: 1, projectileCount: 1 },
    { name: "Shotgun", damage: 0.5, projectileCount: 3 },
];
let currentWeaponIndex = 0;
let activeMultiplier = 1;

function spawnMob() {
    const lane = Math.floor(Math.random() * lanes.length);
    const xOffset = (Math.random() - 0.5) * (laneWidth - 20); // Random x position within lane
    const speed = 0.5 + Math.random() * 0.5 + score * 0.01; // Slower base speed, slight increase with score

    mobs.push({
        x: lanes[lane] + xOffset,
        y: 0,
        width: 15,
        height: 20,
        speed,
        health: 5,
        multiplierDisplay: null // To display multiplier on mob
    });
}

function spawnMultiplier() {
    const lane = Math.floor(Math.random() * lanes.length);
    const multiplierValue = Math.floor(Math.random() * 4) + 2; // Multiplier between x2 and x5
    const xOffset = (Math.random() - 0.5) * (laneWidth - 20);

    multipliers.push({
        x: lanes[lane],
        y: 0,
        width: 60,
        height: 20,
        speed: 1, // Slower multiplier speed
        value: multiplierValue,
        displayValue: `x${multiplierValue}` // Display value for multiplier
    });
}


function shoot() {
    const currentWeapon = weapons[currentWeaponIndex];
    const projectileSpread = 10;

    for (let i = 0; i < currentWeapon.projectileCount * activeMultiplier; i++) {
        let xOffset = 0;
        if (currentWeapon.projectileCount > 1) {
            xOffset = (i - (currentWeapon.projectileCount * activeMultiplier - 1) / 2) * projectileSpread;
        }

        // Find closest mob to target
        let targetMob = null;
        let minDistance = Infinity;

        for (const mob of mobs) {
            const distance = Math.sqrt((mob.x - player.x) ** 2 + (mob.y - player.y) ** 2);
            if (distance < minDistance) {
                minDistance = distance;
                targetMob = mob;
            }
        }


        projectiles.push({
            x: player.x + xOffset,
            y: player.y,
            damage: currentWeapon.damage,
            targetMob: targetMob // Add target mob to projectile
        });
    }
}

function gameLoop() {
    if (gameOver) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    lanes.forEach(laneX => {
        ctx.fillStyle = 'gray';
        ctx.fillRect(laneX - laneWidth / 2, 0, laneWidth, canvas.height);
    });

    ctx.fillStyle = 'blue';
    ctx.fillRect(player.x - player.width / 2, player.y, player.width, player.height);


    // Update and draw mobs
    for (let i = mobs.length - 1; i >= 0; i--) {
        const mob = mobs[i];
        mob.y += mob.speed;
        ctx.fillStyle = 'red';
        ctx.fillRect(mob.x - mob.width / 2, mob.y, mob.width, mob.height);

        // Display multiplier on mob if set
        if (mob.multiplierDisplay) {
            ctx.fillStyle = 'white';
            ctx.font = '12px Arial';
            ctx.fillText(mob.multiplierDisplay, mob.x - 5, mob.y + 15);
        }


        if (mob.y > canvas.height) {
            mobs.splice(i, 1);
        }
    }


    // Update and draw projectiles
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const projectile = projectiles[i];

        if (projectile.targetMob && !projectile.targetMob.deleted) { // Check if target mob exists
            // Move projectile towards target mob
            const dx = projectile.targetMob.x - projectile.x;
            const dy = projectile.targetMob.y - projectile.y;
            const angle = Math.atan2(dy, dx);
            const speed = 5;
            projectile.x += speed * Math.cos(angle);
            projectile.y += speed * Math.sin(angle);
        } else {
            projectile.y -= 5; // If no target, move upwards
        }


        ctx.fillStyle = 'yellow';
        ctx.fillRect(projectile.x - 2, projectile.y, 4, 10);

        for (let j = mobs.length - 1; j >= 0; j--) {
            const mob = mobs[j];
            if (
                projectile.x < mob.x + mob.width &&
                projectile.x + 4 > mob.x &&
                projectile.y < mob.y + mob.height &&
                projectile.y + 10 > mob.y
            ) {
                mob.health -= projectile.damage;
                projectiles.splice(i, 1);

                if (mob.health <= 0) {
                    if (mob.multiplierDisplay) { // Apply multiplier if present
                        const multiplierValue = parseInt(mob.multiplierDisplay.slice(1)); // Extract multiplier value
                        score *= multiplierValue;
                    } else {
                        score++;
                    }

                    scoreDisplay.textContent = `Score: ${score}`;
                    mobs.splice(j, 1);
                    mob.deleted = true; // Mark mob as deleted to prevent targeting issues
                }
                break;
            }
        }

        if (projectile.y < 0 || projectile.y > canvas.height || projectile.x < 0 || projectile.x > canvas.width) {
            projectiles.splice(i, 1);
        }
    }


    // Update and draw multipliers
    for (let i = multipliers.length - 1; i >= 0; i--) {
        const multiplierObj = multipliers[i];
        multiplierObj.y += multiplierObj.speed;
        ctx.fillStyle = 'green';
        ctx.fillRect(multiplierObj.x - multiplierObj.width/2, multiplierObj.y, multiplierObj.width, multiplierObj.height);

        // Display multiplier value
        ctx.fillStyle = 'white';
        ctx.font = '14px Arial';
        ctx.fillText(multiplierObj.displayValue, multiplierObj.x - 10, multiplierObj.y + 15);


        if (
            player.x < multiplierObj.x + multiplierObj.width &&
            player.x + player.width > multiplierObj.x &&
            player.y < multiplierObj.y + multiplierObj.height &&
            player.y + player.height > multiplierObj.y
        ) {
            activeMultiplier = multiplierObj.value;
            multipliers.splice(i, 1);

            // Apply multiplier to a random mob
            const randomMobIndex = Math.floor(Math.random() * mobs.length);
            if (mobs[randomMobIndex]) {
                mobs[randomMobIndex].multiplierDisplay = `x${multiplierObj.value}`;
            }


            setTimeout(() => {
                activeMultiplier = 1;
            }, 5000);
        }

        if (multiplierObj.y > canvas.height) {
            multipliers.splice(i, 1);
        }
    }


    for (const mob of mobs) {
        if (
            player.x < mob.x + mob.width &&
            player.x + player.width > mob.x &&
            player.y < mob.y + mob.height &&
            player.y + player.height > mob.y
        ) {
            gameOver = true;
            gameOverDisplay.style.display = 'block';
        }
    }

    requestAnimationFrame(gameLoop);
}

document.addEventListener('keydown', (event) => {
    if (gameOver) return;

    if (event.key === 'ArrowLeft' && currentLane < lanes.length - 1) {
        currentLane++;
        player.x = lanes[currentLane];
    } else if (event.key === 'ArrowRight' && currentLane > 0) {
        currentLane--;
        player.x = lanes[currentLane];
    } else if (event.key === ' ') {
        shoot();
    } else if (event.key === '1') {
        currentWeaponIndex = 0;
    } else if (event.key === '2') {
        currentWeaponIndex = 1;
    }
});

setInterval(spawnMob, 2000);
setInterval(spawnMultiplier, 10000);

gameLoop();
