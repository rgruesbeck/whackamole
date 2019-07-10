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

// get random number between min and max
const randomBetween = (min, max, type) => {
    const rand = Math.random() * (max - min) + min;

    if (type && type === 'int') {
        return parseInt(rand);
    }

    return rand;
}

// distance between two points
const getDistance = (pointA, pointB) => {
    let vx = pointA.x - pointB.x;
    let vy = pointA.y - pointB.y;

    return Math.sqrt(vx * vx + vy * vy);
}

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

// check if n is within bounds
const isBounded = (n, min, max) => {
    return n > min && n < max;
}

// get cursor event position (tap, click, etc)
// needed for canvas click while top bar active
const getCursorPosition = (canvas, event) => {
    const rect = canvas.getBoundingClientRect();
    return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
    }
}

// color converter
const hexToRgbA = (hex, opacity) => {
    let h=hex.replace('#', '');
    h =  h.match(new RegExp('(.{'+h.length/3+'})', 'g'));

    for(let i=0; i<h.length; i++)
        h[i] = parseInt(h[i].length==1? h[i]+h[i]:h[i], 16);

    if (typeof opacity != 'undefined')  h.push(opacity);

    return 'rgba('+h.join(',')+')';
}

// toy hash for prefixes
// useful for prefexing localstorage keys
const hashCode = (str, base = 16) => {
    return [str.split("")
    .reduce(function(a, b) {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a
    }, 0)] // create simple hash from string
    .map(num => Math.abs(num)) // only positive numbers
    .map(num => num.toString(base)) // convert to base
    .reduce(h => h); // fold
}

export {
    randomBetween,
    getDistance,
    throttled,
    bounded,
    isBounded,
    getCursorPosition,
    hexToRgbA,
    hashCode
};