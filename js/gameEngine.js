import { GAME_CONSTANTS, GAME_STATES, MESSAGES } from './constants.js';
import { DollManager } from './dollManager.js';

export class GameEngine {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.dollManager = new DollManager();
        
        this.gameState = GAME_STATES.LOADING;
        this.coins = GAME_CONSTANTS.INITIAL_COINS;
        this.collectedDolls = new Set();
        this.hasBeggedForMoney = false;
        
        this.claw = {
            x: canvas.width / 2,
            y: GAME_CONSTANTS.CLAW.INITIAL_Y,
            width: GAME_CONSTANTS.CLAW.WIDTH,
            height: GAME_CONSTANTS.CLAW.HEIGHT,
            speed: GAME_CONSTANTS.CLAW.SPEED,
            isClosed: false,
            grabbedDoll: null,
            isShaking: false
        };

        this.images = {
            background: null,
            clawOpen: null,
            clawClosed: null,
            prize: null
        };

        this.prizeChuteX = GAME_CONSTANTS.PRIZE_CHUTE.X;
        this.prizeChuteWidth = GAME_CONSTANTS.PRIZE_CHUTE.WIDTH;
    }

    async initialize() {
        await this.dollManager.loadDollData();
        await this.loadGameImages();
        await this.dollManager.loadImages(() => {
            this.dollManager.createDolls(
                this.canvas.width, 
                this.canvas.height,
                { 
                    x: this.prizeChuteX, 
                    y: this.canvas.height - 200, 
                    width: 300, 
                    height: 200 
                }
            );
            this.gameState = GAME_STATES.READY;
        });
    }

    async loadGameImages() {
        return new Promise((resolve) => {
            let loadedCount = 0;
            const totalCount = 4;

            const imageMap = {
                background: 'images/background.png',
                clawOpen: 'images/catch_o.png',
                clawClosed: 'images/catch_c.png',
                prize: 'images/prize.png'
            };

            Object.entries(imageMap).forEach(([key, src]) => {
                const img = new Image();
                img.src = src;
                img.onload = () => {
                    loadedCount++;
                    if (loadedCount === totalCount) resolve();
                };
                img.onerror = () => {
                    console.warn(`Failed to load image: ${src}`);
                    loadedCount++;
                    if (loadedCount === totalCount) resolve();
                };
                this.images[key] = img;
            });
        });
    }

    canPlay() {
        return this.coins >= GAME_CONSTANTS.GAME_COST;
    }

    deductCoins() {
        this.coins -= GAME_CONSTANTS.GAME_COST;
    }

    addCoins(amount) {
        this.coins += amount;
    }

    getCoins() {
        return this.coins;
    }

    getGameState() {
        return this.gameState;
    }

    setGameState(state) {
        this.gameState = state;
    }

    getClaw() {
        return this.claw;
    }

    getDolls() {
        return this.dollManager.getDolls();
    }

    getImages() {
        return this.images;
    }

    getDollImage(id) {
        return this.dollManager.getDollImage(id);
    }

    collectDoll(dollId) {
        this.collectedDolls.add(dollId);
    }

    getCollectedDolls() {
        return this.collectedDolls;
    }

    hasBegged() {
        return this.hasBeggedForMoney;
    }

    setBeggedForMoney() {
        this.hasBeggedForMoney = true;
    }

    getRandomTauntMessage() {
        const messages = MESSAGES.TAUNT;
        return messages[Math.floor(Math.random() * messages.length)];
    }

    getRandomCelebrationMessage(dollName) {
        const messages = MESSAGES.CELEBRATION;
        const template = messages[Math.floor(Math.random() * messages.length)];
        return template.replace('${dollName}', dollName);
    }

    moveClawLeft() {
        if (this.gameState !== GAME_STATES.READY) return;
        this.claw.x = Math.max(0, this.claw.x - 20);
    }

    moveClawRight() {
        if (this.gameState !== GAME_STATES.READY) return;
        this.claw.x = Math.min(this.canvas.width - this.claw.width, this.claw.x + 20);
    }

    reset() {
        this.gameState = GAME_STATES.READY;
        this.claw.x = this.canvas.width / 2;
        this.claw.y = GAME_CONSTANTS.CLAW.INITIAL_Y;
        this.claw.isClosed = false;
        this.claw.grabbedDoll = null;
        this.claw.isShaking = false;
        this.collectedDolls.clear();
        this.hasBeggedForMoney = false;
        this.coins = GAME_CONSTANTS.INITIAL_COINS;
        
        this.dollManager.createDolls(
            this.canvas.width, 
            this.canvas.height,
            { 
                x: this.prizeChuteX, 
                y: this.canvas.height - 200, 
                width: 300, 
                height: 200 
            }
        );
    }
}