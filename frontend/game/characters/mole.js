/**
 * game/character/mole.js
 * 
 * What it Does:
 *   This file is a basic mole character
 *   it extends the imageSprite class and adds two collision detections methods
 * 
 * What to Change:
 *   Add any character specific methods
 *   eg. eat
 * 
 */

import ImageSprite from '../objects/imageSprite.js';
import { inBox } from '../helpers/sprite.js';

class Mole extends ImageSprite {
    constructor(options) {
        super(options);

        this.originalHeight = this.height;
        this.height = this.height / 10;
        this.width = this.width / 10;

        this.angryImage = options.angryImage;

        this.aggression = options.aggression;
        this.whacked = 0;
        this.mood = 'happy';

        this.bounceX = Math.random() * 15 + 15;
        this.bounceY = Math.random() * 5 + 5;

        this.chargeX = Math.random() * 2.5 + 2.5;
    }

    whack({x, y}) {
        // check if whacked
        const whacked = inBox(x, y, this.box);

        // if whacked, increment whacked
        if (whacked) {
            this.whacked += 1;

            // retreat
            this.width -= 3;
            this.height -= 3;
        }

        // change mood:angry if whacked +2 times
        if (this.whacked > 1) {
            this.mood = 'angry';

            // attack
            this.width -= 10;
            this.height -= 10;

            this.image = this.angryImage;
        }
        
        // change mood:done if whacked +4 times
        if (this.whacked > 5) {
            this.mood = 'done';
        }

        return whacked;
    }

    draw(frame) {

        if (this.mood === 'angry') {
            this.width += this.aggression;
            this.height += this.aggression;

            // mole charge
            let dx = Math.cos(frame.count / this.chargeX) / 5;
            let dy = Math.cos(frame.count / 5) / 20;

            this.move(dx, dy, frame.scale);

        } else {
            // mole bounce
            let dx = Math.cos(frame.count / this.bounceX) / 20;
            let dy = Math.cos(frame.count / this.bounceY) / 20;

            this.move(dx, dy, frame.scale);
        }

        // appear
        if (this.height < this.originalHeight) {
            this.y -= 1;
            this.height += 1;
            this.width += 1;
        }

        super.draw();
    }

}

export default Mole;