/**
 * game/character/reaction.js
 * 
 * What it Does:
 *   This file is a basic button character
 * 
 * What to Change:
 *   Add any character specific methods
 *   eg. eat
 * 
 */

import { hexToRgbA } from '../helpers/utils.js';

class Reaction {
    constructor({ctx, text, x, y, speed, font = 'Arial', fontSize, color, minAlpha}) {
        this.ctx = ctx;

        this.x = x;
        this.y = y;

        this.ox = x;
        this.oy = y;

        this.speed = Math.random() * speed + speed;

        this.text = text;

        this.color = color;
        this.font = `bold ${fontSize}px ${font}`

        this.alpha = 1;
        this.minAlpha = minAlpha || 0;
    }
    
    draw() {
        this.y -= this.speed;
        this.alpha = (this.y / this.oy) + this.minAlpha;

        this.ctx.font = this.font;
        this.ctx.fillStyle = hexToRgbA(this.color, this.alpha);
        this.ctx.fillText(this.text, this.x, this.y )
    }
}

export default Reaction;
