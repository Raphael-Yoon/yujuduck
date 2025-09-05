import { GAME_CONSTANTS } from './constants.js';

export class DollManager {
    constructor() {
        this.dolls = [];
        this.dollData = [];
        this.images = {};
    }

    async loadDollData() {
        try {
            const response = await fetch('./data/dolls.json');
            const data = await response.json();
            this.dollData = data.dolls;
        } catch (error) {
            console.error('Failed to load doll data:', error);
            this.dollData = this.getDefaultDollData();
        }
    }

    getDefaultDollData() {
        return [
            { id: 1, name: '인형 1호', rarity: 'Common', src: 'images/doll_01.png', type: 'normal' },
            { id: 2, name: '인형 2호', rarity: 'Common', src: 'images/doll_02.png', type: 'normal' },
            { id: 3, name: '인형 3호', rarity: 'Common', src: 'images/doll_03.png', type: 'normal' },
            { id: 4, name: '인형 4호', rarity: 'Common', src: 'images/doll_04.png', type: 'normal' },
            { id: 5, name: '인형 5호', rarity: 'Common', src: 'images/doll_05.png', type: 'normal' },
            { id: 6, name: '인형 6호', rarity: 'Common', src: 'images/doll_06.png', type: 'normal' },
            { id: 7, name: '인형 7호', rarity: 'Common', src: 'images/doll_07.png', type: 'normal' },
            { id: 8, name: '인형 8호', rarity: 'Common', src: 'images/doll_08.png', type: 'normal' },
            { id: 9, name: '인형 9호', rarity: 'Common', src: 'images/doll_09.png', type: 'normal' },
            { id: 10, name: '인형 10호', rarity: 'Common', src: 'images/doll_10.png', type: 'normal' },
            { id: 11, name: '인형 11호', rarity: 'Rare', src: 'images/doll_11.png', type: 'normal' },
            { id: 12, name: '인형 12호', rarity: 'Rare', src: 'images/doll_12.png', type: 'normal' },
            { id: 13, name: '인형 13호', rarity: 'Rare', src: 'images/doll_13.png', type: 'normal' },
            { id: 14, name: '인형 14호', rarity: 'Rare', src: 'images/doll_14.png', type: 'normal' },
            { id: 15, name: '인형 15호', rarity: 'Rare', src: 'images/doll_15.png', type: 'normal' },
            { id: 16, name: '인형 16호', rarity: 'Rare', src: 'images/doll_16.png', type: 'normal' },
            { id: 17, name: '인형 17호', rarity: 'Super Rare', src: 'images/doll_17.png', type: 'normal' },
            { id: 18, name: '인형 18호', rarity: 'Super Rare', src: 'images/doll_18.png', type: 'normal' },
            { id: 19, name: '폭탄 인형', rarity: 'Super Rare', src: 'images/doll_19.png', type: 'bomb' },
            { id: 20, name: '돈 인형', rarity: 'Super Rare', src: 'images/doll_20.png', type: 'coin' }
        ];
    }

    async loadImages(callback) {
        let loadedCount = 0;
        const totalCount = this.dollData.length;

        for (const data of this.dollData) {
            const img = new Image();
            img.src = data.src;
            img.onload = () => {
                loadedCount++;
                if (loadedCount === totalCount) {
                    callback();
                }
            };
            img.onerror = () => {
                console.warn(`Failed to load image: ${data.src}`);
                loadedCount++;
                if (loadedCount === totalCount) {
                    callback();
                }
            };
            this.images[data.id] = img;
        }
    }

    createDolls(canvasWidth, canvasHeight, prizeChuteRect) {
        this.dolls = [];
        
        for (let i = 0; i < GAME_CONSTANTS.DOLL.COUNT; i++) {
            const data = this.dollData[Math.floor(Math.random() * this.dollData.length)];
            let newDoll;
            
            do {
                newDoll = {
                    x: Math.random() * (canvasWidth - 150) + 100,
                    y: canvasHeight - (Math.random() * 100 + 40),
                    width: GAME_CONSTANTS.DOLL.WIDTH,
                    height: GAME_CONSTANTS.DOLL.HEIGHT,
                    isGrabbed: false,
                    isFalling: false,
                    ...data
                };
            } while (this.checkCollision(newDoll, prizeChuteRect));
            
            this.dolls.push(newDoll);
        }
    }

    checkCollision(doll, rect) {
        return doll.x < rect.x + rect.width &&
               doll.x + doll.width > rect.x &&
               doll.y < rect.y + rect.height &&
               doll.y + doll.height > rect.y;
    }

    getDolls() {
        return this.dolls;
    }

    getDollById(id) {
        return this.dollData.find(doll => doll.id === id);
    }

    getDollImage(id) {
        return this.images[id];
    }
}