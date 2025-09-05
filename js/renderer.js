import { GAME_CONSTANTS } from './constants.js';

export class GameRenderer {
    constructor(canvas, ctx, gameEngine) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.game = gameEngine;
    }

    drawBackground() {
        const backgroundImg = this.game.getImages().background;
        if (backgroundImg) {
            this.ctx.drawImage(backgroundImg, 0, 0, this.canvas.width, this.canvas.height);
        } else {
            this.ctx.fillStyle = '#87CEEB';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }

    drawPrizeChute() {
        const prizeImg = this.game.getImages().prize;
        if (prizeImg) {
            this.ctx.drawImage(prizeImg, this.game.prizeChuteX, this.canvas.height - 220, 300, 220);
        } else {
            this.ctx.fillStyle = '#8B4513';
            this.ctx.fillRect(this.game.prizeChuteX, this.canvas.height - 200, 300, 200);
        }
    }

    drawDolls() {
        const dolls = this.game.getDolls();
        dolls.forEach(doll => {
            if (!doll.isGrabbed) {
                const dollImg = this.game.getDollImage(doll.id);
                if (dollImg) {
                    this.ctx.drawImage(dollImg, doll.x, doll.y, doll.width, doll.height);
                } else {
                    this.ctx.fillStyle = doll.rarity === 'Common' ? '#FFB6C1' : 
                                       doll.rarity === 'Rare' ? '#DDA0DD' : '#FF69B4';
                    this.ctx.fillRect(doll.x, doll.y, doll.width, doll.height);
                    
                    this.ctx.fillStyle = 'black';
                    this.ctx.font = '10px Arial';
                    this.ctx.textAlign = 'center';
                    this.ctx.fillText(doll.name, doll.x + doll.width/2, doll.y + doll.height/2);
                }
            }
        });
    }

    drawClaw() {
        const claw = this.game.getClaw();
        const clawImg = claw.isClosed ? 
            this.game.getImages().clawClosed : 
            this.game.getImages().clawOpen;

        if (clawImg) {
            let drawX = claw.x;
            let drawY = claw.y;
            
            if (claw.isShaking) {
                drawX += (Math.random() - 0.5) * 6;
                drawY += (Math.random() - 0.5) * 6;
            }
            
            this.ctx.drawImage(clawImg, drawX, drawY, claw.width, claw.height);
        } else {
            this.ctx.fillStyle = claw.isClosed ? '#999' : '#ccc';
            this.ctx.fillRect(claw.x, claw.y, claw.width, claw.height);
        }

        if (claw.grabbedDoll) {
            const dollImg = this.game.getDollImage(claw.grabbedDoll.id);
            if (dollImg) {
                this.ctx.drawImage(
                    dollImg, 
                    claw.x + 10, 
                    claw.y + claw.height - 10, 
                    claw.grabbedDoll.width, 
                    claw.grabbedDoll.height
                );
            }
        }
    }

    drawClawLine() {
        const claw = this.game.getClaw();
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(claw.x + claw.width / 2, 0);
        this.ctx.lineTo(claw.x + claw.width / 2, claw.y);
        this.ctx.stroke();
    }

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.drawBackground();
        this.drawPrizeChute();
        this.drawDolls();
        this.drawClawLine();
        this.drawClaw();
    }
}