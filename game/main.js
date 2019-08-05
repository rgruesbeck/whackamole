/**
 * game/main.js
 * 
 * What it Does:
 *   This file is the main game class
 *   Important parts are the load, create, and play functions
 *   
 *   Load: is where images, sounds, and fonts are loaded
 *   
 *   Create: is where game elements and characters are created
 *   
 *   Play: is where game characters are updated according to game play
 *   before drawing a new frame to the screen, and calling play again
 *   this creates an animation just like the pages of a flip book
 * 
 *   Other parts include boilerplate for requesting and canceling new frames
 *   handling input events, pausing, muting, etc.
 * 
 * What to Change:
 *   Most things to change will be in the play function
 */

import Koji from 'koji-tools';

import {
    requestAnimationFrame,
    cancelAnimationFrame
} from './helpers/animationframe.js';

import {
    loadList,
    loadImage,
    loadSound,
    loadFont
} from 'game-asset-loader';

import audioContext from 'audio-context';
import audioPlayback from 'audio-play';
import unlockAudioContext from 'unlock-audio-context';

import {
    hashCode,
    bounded,
    randomBetween,
    getCursorPosition
} from './helpers/utils.js';

import {
    pickLocationAwayFromList
} from './helpers/sprite.js';

import Mole from './characters/mole.js';
import Reaction from './characters/reaction.js';

class Game {

    constructor(canvas, overlay, topbar, config) {
        this.config = config; // customization
        this.overlay = overlay;
        this.topbar = topbar;

        this.prefix = hashCode(this.config.settings.name); // set prefix for local-storage keys

        this.canvas = canvas; // game screen
        this.ctx = canvas.getContext("2d"); // game screen context

        this.audioCtx = audioContext(); // create new audio context
        this.playlist = [];

        // setup event listeners
        // handle keyboard events
        document.addEventListener('keydown', ({ code }) => this.handleKeyboardInput('keydown', code));
        document.addEventListener('keyup', ({ code }) => this.handleKeyboardInput('keyup', code));

        // handle taps
        document.addEventListener('touchstart', ({ touches }) => this.handleTap(touches[0]));
        document.addEventListener('mousedown', (e) => this.handleTap(e));

        // handle overlay clicks
        this.overlay.root.addEventListener('click', ({ target }) => this.handleClicks(target));

        // handle resize events
        window.addEventListener('resize', () => this.handleResize());
        window.addEventListener("orientationchange", (e) => this.handleResize(e));
        
        // handle koji config changes
        Koji.on('change', (scope, key, value) => {
            console.log('updating configs...', scope, key, value);
            this.config[scope][key] = value;
            this.cancelFrame(this.frame.count - 1);
            this.load();
        });


        unlockAudioContext(this.audioCtx);
    }

    init() {

        // set topbar and topbar color
        this.topbar.active = this.config.settings.gameTopBar;
        this.topbar.style.display = this.topbar.active ? 'block' : 'none';
        this.topbar.style.backgroundColor = this.config.colors.primaryColor;

        // set canvas
        this.canvas.width = window.innerWidth; // set game screen width
        this.canvas.height = this.topbar.active ? window.innerHeight - this.topbar.clientHeight : window.innerHeight; // set game screen height

        // frame count, rate, and time
        // this is just a place to keep track of frame rate (not set it)
        this.frame = {
            count: 0,
            time: Date.now(),
            rate: null,
            scale: null
        };

        // game settings
        this.state = {
            current: 'loading',
            prev: '',
            score: 0,
            lives: parseInt(this.config.settings.lives),
            paused: false,
            muted: localStorage.getItem('game-muted') === 'true'
        };

        this.input = {
            active: 'keyboard',
            keyboard: { up: false, right: false, left: false, down: false },
            mouse: { x: 0, y: 0, click: false },
            touch: { x: 0, y: 0 },
        };

        this.images = {}; // place to keep images
        this.sounds = {}; // place to keep sounds
        this.fonts = {}; // place to keep fonts

        this.moles = [];
        this.reactions = [];

        // set screen
        this.screen = {
            top: 0,
            bottom: this.canvas.height,
            left: 0,
            right: this.canvas.width,
            centerX: this.canvas.width / 2,
            centerY: this.canvas.height / 2,
            scale: ((this.canvas.width + this.canvas.height) / 2) * 0.003
        };

        // set document body to backgroundColor
        document.body.style.backgroundColor = this.config.colors.primaryColor;

        // set loading indicator to textColor
        document.querySelector('#loading').style.color = this.config.colors.textColor;

    }

    load() {
        // load pictures, sounds, and fonts

        this.init(); // apply new configs
        
        // make a list of assets
        const gameAssets = [
            loadImage('happyMole', this.config.images.happyMole),
            loadImage('angryMole', this.config.images.angryMole),
            loadImage('backgroundImage', this.config.images.backgroundImage),
            loadSound('whackSound', this.config.sounds.whackSound),
            loadSound('scoreSound', this.config.sounds.scoreSound),
            loadSound('extraSound', this.config.sounds.extraSound),
            loadSound('attackSound', this.config.sounds.attackSound),
            loadSound('gameOverSound', this.config.sounds.gameOverSound),
            loadSound('backgroundMusic', this.config.sounds.backgroundMusic),
            loadFont('gameFont', this.config.settings.fontFamily)
        ];

        // put the loaded assets the respective containers
        loadList(gameAssets, (progress) => {
            this.overlay.setProgress(progress);
        })
        .then((assets) => {

            this.images = assets.image;
            this.sounds = assets.sound;
            this.fonts = assets.font;
        })
        .then(() => this.create())
        .catch((err) => console.error(err))
    }

    create() {
        // create game characters

        const { scale, centerX, centerY } = this.screen;
        const { happyMole } = this.images;

        this.moleHeight = 50 * scale;
        this.moleWidth = 60 * scale;

        // set overlay styles
        this.overlay.setStyles({...this.config.colors, ...this.config.settings});

        this.setState({ current: 'ready' });
        this.play();
    }

    play() {
        // update game characters

        // clear the screen of the last picture
        this.ctx.fillStyle = this.config.colors.primaryColor; 
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // draw and do stuff that you need to do
        // no matter the game state
        this.ctx.drawImage(this.images.backgroundImage, 0, 0, this.canvas.width, this.canvas.height);

        // update score and lives
        this.overlay.setScore(this.state.score);
        this.overlay.setLives(bounded(this.state.lives, 0, this.state.lives));

        // ready to play
        if (this.state.current === 'ready' && this.state.prev === 'loading') {
            this.overlay.hide('loading');
            this.canvas.style.opacity = 1;

            this.overlay.setBanner(this.config.settings.name);
            this.overlay.setButton(this.config.settings.startText);
            this.overlay.setInstructions({
                desktop: this.config.settings.instructionsDesktop,
                mobile: this.config.settings.instructionsMobile
            });

            this.overlay.show('stats');
            this.overlay.setLives(this.config.settings.lives);
            this.overlay.setScore(this.state.score);

            this.overlay.setMute(this.state.muted);
            this.overlay.setPause(this.state.paused);

            this.setState({ current: 'ready' });
        }

        // game play
        if (this.state.current === 'play') {

            // if last state was 'ready'
            // hide overlay items
            if (this.state.prev === 'ready') {
                this.overlay.hide(['banner', 'button', 'instructions'])
            }

            if (!this.state.muted && !this.state.backgroundMusic) {
                let sound = this.sounds.backgroundMusic;
                this.state.backgroundMusic = audioPlayback(sound, {
                    start: 0,
                    end: sound.duration,
                    loop: true,
                    context: this.audioCtx
                });
            }

            // spawn new moles every second if less than max targets on screen
            let maxTargets = parseInt(this.config.settings.maxTargets);
            if (this.frame.count % 60 === 0 && this.moles.length < maxTargets) {
                // get new mole location
                const location = pickLocationAwayFromList(this.screen, this.moles, this.moleWidth * 2)

                if (location) {
                    this.moles = [
                        ...this.moles,
                        new Mole({
                            ctx: this.ctx,
                            image: this.images.happyMole,
                            angryImage: this.images.angryMole,
                            x: location.x,
                            y: location.y,
                            width: this.moleWidth,
                            height: this.moleHeight,
                            speed: 50,
                            aggression: parseInt(this.config.settings.aggressionLevel),
                            bounds: this.screen
                        })
                    ]
                }
            }

            // moles attack
            // get attackers
            let attackers = this.moles
            .filter(mole => mole.width > this.canvas.width / 2);

            // every 2 seconds there is an attacking mole in range, remove a life
            if (this.frame.count % 120 === 0 && attackers.length > 0) {

                // play attack sound
                this.playback('attackSound', this.sounds.attackSound);

                // remove life
                this.setState({ lives: this.state.lives - attackers.length });
            }

            if (attackers.length === 0) {
                // stop attack sound
                this.stopPlayback('attackSound');
            }

            // draw moles
            this.moles.forEach(mole => mole.draw(this.frame));

            // filter moles and sort by width
            this.moles = [
                ...this.moles
                .filter(moles => moles.mood != 'done')
                .sort((a, b) => a.width - b.width)
            ];

            // draw reactions
            this.reactions.forEach(reaction => reaction.draw());

            // filter reactions
            this.reactions = [
                ...this.reactions
                .filter(reaction => reaction.y > 0)
            ];

            // check for game over
            if (this.state.lives < 1) {
                this.setState({ current: 'over' });
            }

        }

        // game over
        if (this.state.current === 'over') {
            this.overlay.setBanner(this.config.settings.gameoverText);

            this.state.backgroundMusic.pause();
	    this.stopPlayback('attackSound');
	    this.playback('gameOverSound', this.sounds.gameOverSound);

            this.cancelFrame(this.frame.count - 1);
        }

        // draw the next screen
        this.requestFrame(() => this.play());
    }

    // handle whacks
    handleWhacks(mole) {
        // increment score and play score sound
        let score = mole.whacked + 10;
        this.setState({ score: this.state.score + score });
        this.playback('scoreSound', this.sounds.scoreSound);

        // play whack sound
        this.playback('whackSound', this.sounds.whackSound);

        // make score reaction
        let scoreReaction = new Reaction({
            ctx: this.ctx,
            text: `+${this.state.score}`,
            x: randomBetween(this.screen.left, this.screen.right),
            y: this.screen.bottom,
            speed: 10,
            font: this.fonts.gameFont,
            fontSize: bounded(Math.random() * 90, 30, 90),
            color: this.config.colors.pointColor
        });

        // extra celebration every 250 points
        let isExtra = this.state.score % 250 < 10;

        // play extra sound
        if (isExtra) {
            this.playback('extraSound', this.sounds.extraSound);
        }

        // get extra text
        let extra = isExtra ? `+${Math.round(this.state.score/250) * 250}!` : ``;
        let extraReaction = new Reaction({
            ctx: this.ctx,
            text: extra,
            x: randomBetween(this.screen.left, this.screen.right),
            y: this.screen.bottom,
            speed: 4,
            font: this.fonts.gameFont,
            fontSize: 90,
            color: this.config.colors.extraColor,
            minAlpha: 0.50
        });

        // make mole reaction
        let reactionList = Object.entries(this.config.reactions)
        .map(reaction => reaction[1]);
        let reactionIndex = parseInt(Math.random() * reactionList.length);
        let reactionText = reactionList[reactionIndex];
        let moleReaction = new Reaction({
            ctx: this.ctx,
            text: reactionText,
            x: mole.x,
            y: mole.y,
            speed: 2,
            font: this.fonts.gameFont,
            fontSize: bounded(15 * mole.whacked, 30, 90),
            color: this.config.colors.reactionColor,
            minAlpha: 0.25
        });

        // add reactions
        this.reactions = [
            ...this.reactions,
            moleReaction,
            scoreReaction,
            extraReaction
        ]
    }

    // event listeners
    handleClicks(target) {
        if (this.state.current === 'loading') { return; }
        // mute
        if (target.id === 'mute') {
            this.mute();
        }

        // pause
        if (target.id === 'pause') {
            this.pause();
        }

        // button
        if ( target.id === 'button') {
            this.setState({ current: 'play' });

            // if defaulting to have sound on by default
            // double mute() to warmup iphone audio here
            this.mute();
            this.mute();
        }

    }

    handleKeyboardInput(type, code) {
        this.input.active = 'keyboard';

        if (type === 'keyup') {
            // spacebar: pause and play game
            if (code === 'Space') {
                this.pause();
            }
        }
    }

    handleTap(touch) {
        if (this.state.current === 'over') { this.load(); }
        if (this.state.current != 'play' || this.state.paused) { return; }

        let tap = getCursorPosition(this.canvas, touch);

        // send tap to moles
        this.moles.forEach(mole => {
            // send whack to mole
            // if whacked, add a reaction
            let whacked = mole.whack(tap);

            if (whacked) {
                this.handleWhacks(mole);
            }
        });
    }

    handleResize() {

        document.location.reload();
    }

    // game helpers
    // pause game
    pause() {
        if (this.state.current != 'play') { return; }

        this.state.paused = !this.state.paused;
        this.overlay.setPause(this.state.paused);

        if (this.state.paused) {
            // pause game loop
            this.cancelFrame(this.frame.count - 1);

            // mute all game sounds
            this.audioCtx.suspend();

            this.overlay.setBanner('Paused');
        } else {
            // resume game loop
            this.requestFrame(() => this.play(), true);

            // resume game sounds if game not muted
            if (!this.state.muted) {
                this.audioCtx.resume();
            }

            this.overlay.hide('banner');
        }
    }

    // mute game
    mute() {
        let key = this.prefix.concat('muted');
        localStorage.setItem(
            key,
            localStorage.getItem(key) === 'true' ? 'false' : 'true'
        );
        this.state.muted = localStorage.getItem(key) === 'true';

        this.overlay.setMute(this.state.muted);

        if (this.state.muted) {
            // mute all game sounds
            this.audioCtx.suspend();
        } else {
            // unmute all game sounds
            if (!this.state.paused) {
                this.audioCtx.resume();
            }
        }
    }

    // reset game
    reset() {
        document.location.reload();
    }

    playback(key, audioBuffer, options = {}) {
        // add to playlist
        let id = Math.random().toString(16).slice(2);
        this.playlist.push({
            id: id,
            key: key,
            playback: audioPlayback(audioBuffer, {
                ...{
                    start: 0,
                    end: audioBuffer.duration,
                    context: this.audioCtx
                },
                ...options
            }, () => {
                // remove played sound from playlist
                this.playlist = this.playlist
                    .filter(s => s.id != id);
            })
        });
    }

    stopPlayback(key) {
        this.playlist = this.playlist
        .filter(s => {
            let targetBuffer = s.key === key;
            if (targetBuffer) {
                s.playback.pause();
            }
            return targetBuffer;
        })
    }

    // update game state
    setState(state) {
        this.state = {
            ...this.state,
            ...{ prev: this.state.current },
            ...state,
        };
    }

    // request new frame
    // wraps requestAnimationFrame.
    // see game/helpers/animationframe.js for more information
    requestFrame(next, resumed) {
        let now = Date.now();
        this.frame = {
            count: requestAnimationFrame(next),
            time: now,
            rate: resumed ? 0 : now - this.frame.time,
            scale: this.screen.scale * this.frame.rate * 0.01
        };
    }

    // cancel frame
    // wraps cancelAnimationFrame.
    // see game/helpers/animationframe.js for more information
    cancelFrame() {
        cancelAnimationFrame(this.frame.count);
    }
}

export default Game;
