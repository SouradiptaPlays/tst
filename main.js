const startGame = (function() { 

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let SCREEN_WIDTH = 0;
let SCREEN_HEIGHT = 0;

function fixCanvasSize() {
    SCREEN_WIDTH = document.body.clientWidth;
    SCREEN_HEIGHT = document.body.clientHeight;
    canvas.width = SCREEN_WIDTH;
    canvas.height = SCREEN_HEIGHT;
}

window.addEventListener("resize", fixCanvasSize);
fixCanvasSize();

// Variables and Stuff

const GAME_NAME = "ThroughSpaceTime";
const GAME_FONT = "\"PixelFont\""; //"Arial";
const GAME_NAME_FONT_SIZE = "40px"; //"50px";
const GAME_VERSION = "Pre-Alpha v011123";
const GAME_VERSION_FONT_SIZE = "20px";
let GAME_NAME_TOPMARGIN = 25;
const GAME_NAME_GAP = 25;
const GAME_NAME_RAINBOW_GAP = 4; // [1-4]

const gameText = {
    clickToStart: {
        text: "Click anywhere to start",
        fontSize: "30px",
    },
    controls: {
        text: "WASD to move; Space to shoot.",
        fontSize: "20px",
    },
};

let inTitleScreen = true;

let assets = {
    player: "images/rocket.svg"
};
let loadedAssetsCount = 0;

let sfx = {
    gunshot: new Howl({
        src: ["sounds/gunshot.mp3"],
        volume: 0.2
    }),
}

let musics = {
    space: new Howl({
        src: ["sounds/music/space.mp3"],
        volume: 0.75
    }),
    space2: new Howl({
        src: ["sounds/music/sPACE.mp3"],
        volume: 0.75
    }),
    throughSpace: new Howl({
        src: ["sounds/music/throughspace.ogg"],
        volume: 0.2
    }),
}

let logoColorCounter = 0;

// Classes

class Utils {
    constructor() {}

    static getRandomNumber(min, max) {
        return Math.random() * (max - min) + min;
    }

    static toPlayerRelativeScreenX(x) {
        return (x - mainPlayer.x) + mainPlayer.screenX;
    }

    static toPlayerRelativeScreenY(y) {
        return (y - mainPlayer.y) + mainPlayer.screenY;
    }
}

class Music {
    constructor() {
        const musicClass = this;
        this.noOfMusic = Object.keys(musics).length;
        this.currentNo = -1;
        this.play = true;
        this.waitForUnlock().then(function() {
            Object.entries(musics).forEach(function([name, music], index) {
                music.on("end", function() {
                    musicClass.playRandomMusic();
                });
            });
            musicClass.playRandomMusic();
        });
    }

    getRandomMusicNumber(except) {
        let randomNo;
        do {
            randomNo = Math.floor(Math.random() * this.noOfMusic);
        } while (randomNo === except);
        return randomNo;
    }

    playRandomMusic() {
        this.currentNo = this.getRandomMusicNumber(this.currentNo);
        this.playMusic(this.currentNo);
    }

    waitForUnlock() {
        const promise = new Promise(resolve => {
            const checkInterval = 250;
            if (checkUnlocked()) {
                // resolve immediately if already unlocked
                resolve();
            } else {
                // wait for unlock
                setInterval(checkUnlocked, checkInterval);
            }
            function checkUnlocked() {
                if (Howler._audioUnlocked) {
                    resolve();
                    return true;
                }
                return false;
            }
        });
    
        return promise;
    }

    playMusic(no) {
        const currentMusic = musics[Object.keys(musics)[no]];
        currentMusic.play();
        return currentMusic;
    }
}

class InputHandler {
    constructor() {
        this.keys = new Set(); // Only allows 1 of each unique element, i.e., no repeations.

        document.addEventListener("keydown", (e) => {
            this.keys.add(e.code);
        });

        document.addEventListener("keyup", (e) => {
            this.processKeyUps(e.code);
            this.keys.delete(e.code);
        });
    }

    processKeyPresses() {
        if(this.keys.has("KeyW") || this.keys.has("Numpad8")) {
            mainPlayer.speedX += Math.cos(mainPlayer.angle) * mainPlayer.PLAYER_SPEED / 3;
            mainPlayer.speedY += Math.sin(mainPlayer.angle) * mainPlayer.PLAYER_SPEED / 3;
        }
        if(this.keys.has("KeyS") || this.keys.has("Numpad2")) {
            mainPlayer.speedX -= Math.cos(mainPlayer.angle) * mainPlayer.PLAYER_SPEED / 3;
            mainPlayer.speedY -= Math.sin(mainPlayer.angle) * mainPlayer.PLAYER_SPEED / 3;
        }
        if(this.keys.has("KeyA") || this.keys.has("Numpad4")) {
            mainPlayer.angle -= toRadians(mainPlayer.PLAYER_ANGLE_STEP);
        }
        if(this.keys.has("KeyD") || this.keys.has("Numpad6")) {
            mainPlayer.angle += toRadians(mainPlayer.PLAYER_ANGLE_STEP);
        }
    }

    processKeyUps(keycode) {
        if(keycode == "Numpad9") {
            pointToCenter = !pointToCenter;
        }
        if(keycode == "Space" || keycode == "Numpad0") {
            bullets.createBullet(mainPlayer.angle, mainPlayer.x, mainPlayer.y);
        }
    }
}

class Stars {
    constructor(totalStars, minStarSize) {
        this.stars = [];
        this.totalStars = totalStars;
        this.STAR_SIZE = minStarSize;
    }

    move() {
        this.stars.forEach((star) => {
            star.x = star.initX - mainPlayer.x;
            star.y = star.initY - mainPlayer.y;
    
            if(star.x < 0) { // Is far left on the screen
                star.x = (star.x % SCREEN_WIDTH + SCREEN_WIDTH) % SCREEN_WIDTH
                
            } else if (star.x > SCREEN_WIDTH) {
                star.x = star.x % SCREEN_WIDTH;
            }
    
            if(star.y < 0) { // Is far top on the screen
                star.y = (star.y % SCREEN_HEIGHT + SCREEN_HEIGHT) % SCREEN_HEIGHT
                
            } else if (star.y > SCREEN_HEIGHT) {
                star.y = star.y % SCREEN_HEIGHT;
            }
        });
    }

    fill() {
        let occupiedXStars = [];
        let occupiedYStars = [];

        if(this.totalStars > SCREEN_WIDTH * SCREEN_HEIGHT) {
            console.error(
                "(GAME) fillStars: The total amount of stars is a bit too much (>"
                + SCREEN_WIDTH.toString()
                + "*"
                + SCREEN_HEIGHT.toString()
                + ")"
            );
            return;
        }

        for(let i = 0; i < this.totalStars; i++) {
            const extraSize = Math.random() * (this.STAR_SIZE * 1.25);
            while (true) {

                let starX = Math.floor(Math.random() * SCREEN_WIDTH);
                let starY = Math.floor(Math.random() * SCREEN_HEIGHT);

                // Summary: find random coordinates until a coordinate has found, which also doesn't have a star already in that place.
                if(!occupiedXStars.includes(starX) && !occupiedYStars.includes(starY)) {
                    occupiedXStars.push(starX);
                    occupiedYStars.push(starY);
                    this.stars.push({x: starX, y: starY, initX: starX, initY: starY, extraSize: extraSize});

                    break;
                }

            }
        }

    }

    render() {
        ctx.fillStyle = "#ffffff";
        this.stars.forEach((star) => {
            /*ctx.fillRect(
                ((star.x - STAR_SIZE / 2) - mainPlayer.x) % SCREEN_WIDTH,
                ((star.y - STAR_SIZE / 2) - mainPlayer.y) % SCREEN_HEIGHT,
                STAR_SIZE + star.extraSize,
                STAR_SIZE + star.extraSize
            );*/
            ctx.beginPath();
            ctx.arc(
                star.x, // - mainPlayer.x, //) % -SCREEN_WIDTH,
                star.y, // - mainPlayer.y, //) % -SCREEN_HEIGHT,
                (this.STAR_SIZE + star.extraSize) / 2,
                0,
                Math.PI * 2
            );
            ctx.closePath();
            ctx.fill();
        });
    }
}

class Bullet {
    constructor(angle, speed, startX, startY, size) {
        this.angle = angle;
        this.startX = startX;
        this.startY = startY;
        this.x = startX;
        this.y = startY;
        this.speed = speed;
        this.size = size
    }

    move() {
        this.x += Math.cos(this.angle) * (this.speed * Utils.getRandomNumber(0.9, 1.1)) + (2 * mainPlayer.speedX);
        this.y += Math.sin(this.angle) * (this.speed * Utils.getRandomNumber(0.9, 1.1)) + (2 * mainPlayer.speedY);
    }

    outOfScreenOrNot() {
        return (
            Utils.toPlayerRelativeScreenX(this.x) <= -SCREEN_WIDTH * 2.5  ||
            Utils.toPlayerRelativeScreenX(this.x) >= SCREEN_WIDTH * 2.5 ||
            Utils.toPlayerRelativeScreenY(this.y) <= -SCREEN_HEIGHT * 2.5  ||
            Utils.toPlayerRelativeScreenY(this.y) >= SCREEN_HEIGHT * 2.5
        );
    }

    render() {
        ctx.fillStyle = "#FFDDDD";
        ctx.fillRect(
            Utils.toPlayerRelativeScreenX(this.x),
            Utils.toPlayerRelativeScreenY(this.y),
            this.size,
            this.size
        );
    }
}

class Bullets {
    constructor() {
        this.size = 4;
        this.speed = 20;
        this.bullets = [];
    }

    createBullet(angle, startX, startY) {
        this.bullets.push(new Bullet(angle, this.speed, startX, startY, this.size));
        sfx.gunshot.play();
    }

    process() {
        this.bullets.forEach((bullet, index) => {
            bullet.move();
            if(bullet.outOfScreenOrNot()) this.bullets.splice(index, 1);
        });
    }

    render() {
        this.bullets.forEach((bullet) => bullet.render());
    }
}

class Enemy {
    constructor(x, y, angle) {
        this.x = x;
        this.y = y;
        this.speedX = 0;
        this.speedY = 0;
        this.angle = angle; // upwards

        this.ENEMY_SIZE = 75;
        this.ENEMY_SPEED = 2.5;
        this.ENEMY_ANGLE_STEP = 5;
        this.PLAYER_PROXIMITY = 100; // How close the enemy will get to the player before stopping
    }

    lookTowardsXY(x, y) {
        this.angle = Math.atan2(y - this.y, x - this.x);
    }

    lookTowardsPlayer(targetPlayer) {
        this.lookTowardsXY(targetPlayer.x, targetPlayer.y);
    }

    move() {
        this.x += Math.cos(this.angle) * this.ENEMY_SPEED;
        this.y += Math.sin(this.angle) * this.ENEMY_SPEED;
    }

    process() {
        this.lookTowardsPlayer(mainPlayer);

        if (Math.hypot(mainPlayer.x - this.x, mainPlayer.y - this.y) > this.PLAYER_PROXIMITY) {
            this.move();
        }
    }

    render() {
        const sizeX = this.ENEMY_SIZE;
        const sizeY = (this.ENEMY_SIZE * assets.player.height) / assets.player.width;
        const screenX = Utils.toPlayerRelativeScreenX(this.x);
        const screenY = Utils.toPlayerRelativeScreenY(this.y);

        ctx.save();
        ctx.translate(screenX, screenY);
        ctx.rotate(this.angle + Math.PI / 2);
        ctx.drawImage(
            assets.player,
            -sizeX / 2,
            -sizeY / 2,
            sizeX,
            sizeY
        );
        ctx.restore();
    }
}

class Enemies {
    constructor() {
        this.size = 4;
        this.speed = 20;
        this.enemies = [];
        this.totalEnemies = 10;
    }

    createEnemy(angle, startX, startY) {
        this.enemies.push(new Enemy(startX, startY, angle));
    }

    generate() {

        let occupiedXEnemies = [];
        let occupiedYEnemies = [];

        if(this.totalEnemies > SCREEN_WIDTH * SCREEN_HEIGHT) {
            console.error(
                "(GAME) generateEnemies: The total amount of enemies is a bit too much (>"
                + SCREEN_WIDTH.toString()
                + "*"
                + SCREEN_HEIGHT.toString()
                + ")"
            );
            return;
        }

        for(let i = 0; i < this.totalEnemies; i++) {
            const angle = Math.random() * Math.PI * 2;
            while (true) {

                let enemyX = Math.floor(Math.random() * SCREEN_WIDTH);
                let enemyY = Math.floor(Math.random() * SCREEN_HEIGHT);

                // Summary: find random coordinates until a coordinate has found, which also doesn't have a enemy already in that place.
                if(!occupiedXEnemies.includes(enemyX) && !occupiedYEnemies.includes(enemyY)) {
                    occupiedXEnemies.push(enemyX);
                    occupiedYEnemies.push(enemyY);
                    this.createEnemy(angle, enemyX, enemyY);

                    break;
                }

            }
        }

    }

    process() {
        this.enemies.forEach((enemy, index) => {
            enemy.process();
            //if(enemy.outOfScreenOrNot()) this.enemies.splice(index, 1);
        });
    }

    render() {
        this.enemies.forEach((enemy) => enemy.render());
    }
}

class Player {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.screenX = SCREEN_WIDTH / 2;
        this.screenY = SCREEN_HEIGHT / 2;
        this.speedX = 0;
        this.speedY = 0;
        this.angle = -Math.PI / 2; // upwards
        
        this.PLAYER_SIZE = 75;
        this.PLAYER_SPEED = 1;
        this.PLAYER_ANGLE_STEP = 5;
    }

    render() {
        const sizeX = this.PLAYER_SIZE;
        const sizeY = (this.PLAYER_SIZE * assets.player.height) / assets.player.width;
        const screenX = this.screenX;
        const screenY = this.screenY;

        ctx.save();
        ctx.translate(screenX, screenY);
        ctx.rotate(this.angle + Math.PI / 2);
        ctx.drawImage(
            assets.player,
            -sizeX / 2,
            -sizeY / 2,
            sizeX,
            sizeY
        );
        ctx.restore();
    }
}

class MainPlayer extends Player {
    constructor() {
        super();
    }

    move() {  
        if(this.speedX > 0.001 || this.speedX < -0.001) this.speedX *= 0.99; // TODO: Make it a constant variable
        else this.speedX = 0;
        if(this.speedY > 0.001 || this.speedY < -0.001) this.speedY *= 0.99;
        else this.speedY = 0;
        
        this.x += this.speedX;
        this.y += this.speedY;
    }
}

let bullets = new Bullets();
let mainPlayer = new MainPlayer();
let inputHandler = new InputHandler();
let musicHandler = new Music();
let stars = new Stars(20, 2);
let enemies = new Enemies();

// Debug stuff

let pointToCenter = false;
function debug_drawPointToCenterLine() {
    if(!pointToCenter) return;
    
    const diffX = SCREEN_WIDTH / 2 - mainPlayer.x;
    const diffY = SCREEN_HEIGHT / 2 - mainPlayer.y;

    ctx.strokeStyle = "#11FF00";
    ctx.beginPath();
    ctx.moveTo(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2);
    ctx.lineTo(diffX, diffY);
    ctx.stroke();
}

// Game on Resize (GoR)

function gameOnResize() {
    mainPlayer.screenX = SCREEN_WIDTH / 2;
    mainPlayer.screenY = SCREEN_HEIGHT / 2;
}

window.addEventListener("resize", gameOnResize);

// Extra Utilities

function toRadians(deg) {
    return (Math.PI / 180) * deg;
}

function rotatePoint(x, y, angle) { // Angle needs to be in radians
    return {
        x: x * Math.cos(angle) - y * Math.sin(angle),
        y: x * Math.sin(angle) + y * Math.cos(angle)
    };
}

// Rendering and Stuff

function clearScreen() {
    ctx.clearRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
}

function renderBackground() {
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
}

function drawLogo() {
    if(inTitleScreen) {
        GAME_NAME_TOPMARGIN = canvas.height * 0.3;
    } else {
        if(!(GAME_NAME_TOPMARGIN <= 25)) {
            GAME_NAME_TOPMARGIN -= ((canvas.height * 0.3) - 25) / 8;
        }
    }

    ctx.font = GAME_NAME_FONT_SIZE + " " + GAME_FONT;
    ctx.textAlign = "center";
    
    ctx.fillStyle = "hsl(" + (logoColorCounter % 360).toString() + ", 100%, 50%)";
    ctx.fillText(GAME_NAME, canvas.width / 2, parseInt(GAME_NAME_FONT_SIZE) + GAME_NAME_TOPMARGIN + GAME_NAME_RAINBOW_GAP);
    logoColorCounter++;

    ctx.fillStyle = "#ffffff";
    ctx.fillText(GAME_NAME, canvas.width / 2, parseInt(GAME_NAME_FONT_SIZE) + GAME_NAME_TOPMARGIN);

    // Version
    ctx.font = GAME_VERSION_FONT_SIZE + " " + GAME_FONT;
    ctx.fillStyle = "#ffffff";
    ctx.fillText(GAME_VERSION, canvas.width / 2, parseInt(GAME_VERSION_FONT_SIZE) + parseInt(GAME_NAME_FONT_SIZE) + GAME_NAME_TOPMARGIN + GAME_NAME_GAP);
}

function clickToStart() {
    ctx.font = gameText.clickToStart.fontSize + " " + GAME_FONT;
    ctx.textAlign = "center";
    
    ctx.fillStyle = "hsl(" + (logoColorCounter % 360).toString() + ", 100%, 50%)";
    ctx.fillText(gameText.clickToStart.text, canvas.width / 2, canvas.height * 0.6);
}

function showControls() {
    ctx.font = gameText.controls.fontSize + " " + GAME_FONT;
    ctx.textAlign = "center";
    
    ctx.fillStyle = "#ffffff";
    ctx.fillText(gameText.controls.text, canvas.width / 2, canvas.height * 0.7);
}

function update() {
    clearScreen();

    // Processing Stuff
    if(!inTitleScreen) {
        inputHandler.processKeyPresses();
        stars.move();
        mainPlayer.move();
        enemies.process();
        bullets.process(mainPlayer);
    }

    // Render Stuff
    renderBackground();
    stars.render();

    if(!inTitleScreen) {
        debug_drawPointToCenterLine();
        enemies.render();
        bullets.render(mainPlayer);
        mainPlayer.render();
    } else {
        clickToStart();
        showControls();
    }

    drawLogo();

    requestAnimationFrame(update);
}

function start() {
    if (inTitleScreen) canvas.addEventListener("click", function() {
        inTitleScreen = false;
        enemies.generate();
    });
    stars.fill();
}

function loadAssets(callback) {
    for(let key in assets) {
        // Replaces the asset's value, a path, with a Image with the same path.
        const pathOfImage = assets[key];
        assets[key] = new Image();
        assets[key].src = pathOfImage;

        assets[key].onload = function() {
            loadedAssetsCount++;

            if(loadedAssetsCount == Object.keys(assets).length) {
                document.fonts.load(GAME_NAME_FONT_SIZE + " " + GAME_FONT).then(function() {
                    callback();
                });
            }
        }
    }
}

start();
loadAssets(function() {
    update();
});

})();