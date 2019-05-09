/**
 * game/helpers/utils.js
 * 
 * What it Does:
 *   This file contains utilities for the game
 * 
 *   throttled: wraps a function so that it can't be called until the delay
 *   in milliseconds has gone by. useful for stopping unwanted side effects of button mashing.
 *   https://gph.is/1syA0yc
 * 
 *   bounded: apply a lower and upper bound to a number
 *   useful for add limits to AI character movements
 * 
 * What to Change:
 *   Add any new methods that don't fit anywhere else
 *   eg. 
 * 
 */

// create throttled function
// checkout: https://outline.com/nBajAS
const throttled = (delay, fn) => {
    let lastCall = 0;
    return function (...args) {
        const now = (new Date).getTime();
        if (now - lastCall < delay) {
            return;
        }
        lastCall = now;
        return fn(...args);
    }
}

// apply a lower and upper bound to a number
const bounded = (n, min, max) => {
    return [n]
    .map(n => n < min ? min : n)
    .map(n => n > max ? max : n)
    .reduce(n => n);
}

export { throttled, bounded };