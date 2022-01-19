import { TinyEmitter } from 'tiny-emitter';
import { COLORS, DICE_HTML_SIDES, NULL_POINTS, PLAYER_PATHS, START_POINTS } from "./constants";

Array.prototype.random = function () {
    return this[Math.floor(Math.random() * this.length)];
}

String.prototype.toProperCase = function () {
    return this.charAt(0).toUpperCase() + this.substring(1).toLowerCase();
}

Element.prototype.setNodeIDCss = function () {
    for (let i = 0; i < this.children.length; i++) {
        this.children[i].style.setProperty('--node-id', i + 1);
    }
}

export async function sleep (ms) {
    return new Promise(r => setTimeout(r, ms));
}

export function getRandom (n) {
    return Math.floor(Math.random() * n);
}

export default class LudoEngine extends TinyEmitter {

    started = false;
    botCount = 0;
    actualPlayers = []; // Will be defined when the game starts...
    currentTurn = 0;
    ranks = [];
    players = {
        red: new LudoPlayer('You'),
        green: LudoPlayer.NULL_PLAYER,
        yellow: LudoPlayer.NULL_PLAYER,
        blue: LudoPlayer.NULL_PLAYER
    };

    get playersArray () {
        return Object.values(this.players);
    }

    get playerCount () {
        return this.playersArray.filter(x => !x.isNull).length;
    }

    get currentTurnPlayer () {
        return this.actualPlayers[this.currentTurn];
    }

    onWindowLoad () {
        let styleElement = document.createElement('style');

        styleElement.innerHTML = 
            NULL_POINTS
                .map(id => `#step-${id} {background-color:var(--dark-wood)!important}`)
                .join('');

        styleElement.innerHTML += 
            Object.entries(START_POINTS)
                .map(([color, id]) => `#step-${id} {background-color:var(--${color}-player)!important}`)
                .join('');

        document.getElementById('wrap').append(styleElement);
    }

    createPlayer (isBot = false) {
        let entry = Object.entries(this.players).find(([_, player]) => player.isNull);
        if (!entry) return null;

        if (isBot) this.botCount += 1;
        this.players[entry[0]] = new LudoPlayer(isBot ? `Bot ${this.botCount}` : 'Player', isBot);
        this.emit(`${entry[0]}Update`);
        this.emit('playerCountUpdate');
        return this.players[entry[0]];
    }

    deletePlayer (color) {
        if (this.playerCount == 1) return null;
        let player = this.players[color];
        if (player.isBot) this.botCount -= 1;
        this.players[color] = LudoPlayer.NULL_PLAYER;
        this.emit(`${color}Update`);
        this.emit('playerCountUpdate');
        return player;
    }

    updatePlayerName(color, name) {
        // The engine may crash if wrong values supplied but
        // only if someone makes a fault in the engine.
        this.players[color].name = name;
        this.emit(`${color}Update`);
    }

    nextTurn () {
        let x = this.actualPlayers.length - 1;
        this.currentTurn += (this.currentTurn == x) ? -x : 1;
    }

    async start (toAlert = false) {
        if (this.started) return false;

        this.actualPlayers = [];
        Object.entries(this.players).forEach(x => {
            if (!x[1].isNull) this.actualPlayers.push(new LudoLinkedPlayer(x));
        });

        if (this.actualPlayers.length < 2) return false;

        this.started = true;
        this.emit('start');
        if (toAlert) await this.alert('The game has started...', 1000);
        return this.startTurns();
    }

    async startTurns () {
        while (true) {
            let current = this.currentTurnPlayer;

            if (current.completed) continue;
            this.emit(`turn`, current.color);
            await this.waitForEvent('diceRoll');

            let diceNumber = (await this.diceRoll(current.name + '\'s')) + 1;
            diceNumber = 6;
            let coinsInside = current.coinsAtStart;
            let coinsOutside = current.coinsOutside;

            if (coinsInside == 4) {
                if (diceNumber == 6) {
                    await this.moveCoin(`coin-${current.color}-1`, current.startPoint);
                    current.setCor(1, 0);
                    this.emit(`${current.color}Update`);
                } else await this.alert('Unfortunate!', 1200);
            } else {
                let prisonElement = document.getElementById(`prison-${current.color}`);
                prisonElement.classList.add('prison-selectable');

                await this.alert('Select your move...', 1200);
                const type = await this.waitForEvent(`${current.color}Select`);

                if (type == 'house') {
                    let x = 5 - coinsInside;
                    await this.moveCoin(`coin-${current.color}-${x}`, current.startPoint);
                    current.setCor(x, 0);
                    this.emit(`${current.color}Update`);
                } else if (typeof type[0] == "number") {
                    await this.moveCoinInPath(current.color, type[0], current, diceNumber);
                }

                prisonElement.classList.remove('prison-selectable');
            }

            this.nextTurn();
        }

        return true;
    }

    async alert (message, waitTill = 2000) {
        let alrt = await new LudoAlert()
            .setParent(document.querySelector('.board-wrapper'))
            .setInnerHTML(`<p>${message}</p>`)
            .display(0);
        
        await sleep(waitTill);
        await alrt.undisplay()
    }

    async diceRoll (userName = 'Your', result = getRandom(6)) {
        let pElement = document.createElement('p');
        pElement.innerHTML = `${userName} Turn`;

        let diceElement = document.createElement('div');
        diceElement.className = 'dice';
        diceElement.innerHTML = this.getRandomDiceSideHTML();

        let alrt = await new LudoAlert()
            .appendChildren(pElement, diceElement)
            .setParent(document.querySelector('.board-wrapper'))
            .display();

        for (let i = 0; i < 4; i++) {
            await sleep(i * 50);
            diceElement.innerHTML = this.getRandomDiceSideHTML();
        }

        await sleep(200);
        diceElement.innerHTML = this.getDiceSideHTML(result);
        await sleep(400);
        diceElement.style.transform = 'scale(1.2)';
        await sleep(250);
        diceElement.style.transform = 'scale(1)';
        await sleep(750);
        await alrt.undisplay();

        return result;
    }

    async moveCoin (coinID, stepID) {
        const [_, color, number] = coinID.split('-');

        let coinElement = document.getElementById(coinID);
        let stepElement = document.getElementById(`step-${stepID}`);
        let clonedCoin = coinElement.cloneNode();
        
        coinElement.classList.add('coin-exit');
        await sleep(500);
        coinElement.parentElement.removeChild(coinElement);

        clonedCoin.addEventListener('click', () => this.emit(`${color}Select`, parseInt(number)));
        clonedCoin.classList.add('coin-active');
        stepElement.appendChild(clonedCoin);
        stepElement.setNodeIDCss();
        await sleep(400);
    }

    async moveCoinInPath(color, id, player, toAdd) {
        let coinID = `coin-${color}-${id}`;
        let cor = player.cors[id - 1] + toAdd;
        let newStep = PLAYER_PATHS[color][cor];

        if (!newStep) {
            let coinElement = document.getElementById(coinID);
            coinElement.parentElement.removeChild(coinElement);
            player.cors[id - 1] = NaN;
            this.emit(`${color}Update`);
            return true;
        }

        player.cors[id - 1] = cor;
        await this.moveCoin(coinID, newStep);
    }

    waitForEvent (evt) {
        return new Promise (resolve => {
            const event = (...args) => {
                this.off(evt, event);
                resolve(args);
            };

            this.on(evt, event);
        });
    }

    getRandomDiceSideHTML () {
        return this.getDiceSideHTML(getRandom(6));
    }

    getDiceSideHTML (n) {
        return `<div class="dside-${n + 1}">${DICE_HTML_SIDES[n]}</div>`;
    }

}

export class LudoAlert {

    constructor () {
        let alertElement = document.createElement('div');
        alertElement.className = 'alert';
        alertElement.style.opacity = 0;
        this.element = alertElement;
    }

    setInnerHTML (html) {
        this.element.innerHTML = html;
        return this;
    }

    appendChildren (...children) {
        this.element.append(...children);
        return this;
    }

    setParent (elem) {
        this.parent = elem;
        elem.append(this.element);
        return this;
    }

    removeParent () {
        this.parent.removeChild(this.element);
        return this;
    }

    async display (ms = 200) {
        await sleep(ms)
        this.element.style.opacity = 1;
        return this;
    }

    async undisplay () {
        this.element.style.opacity = 0;
        await sleep(200);
        return this.removeParent();
    }

}

export class LudoPlayer {

    static NULL_PLAYER = new LudoPlayer('No Player', false, true);

    kills = 0;
    cors = [null, null, null, null];
    // Coordinates of coins. 
    // - number, if the coin is on track
    // - null, if coin at start.
    // - NaN, if coin has reached the house.

    constructor (name, isBot = false, isNull = false) {
        if (name instanceof LudoPlayer) return name;
        this.name = name;
        if (isBot) this.isBot = true;
        if (isNull) this.isNull = true;
    }

    get coinsReached () {
        return this.cors.filter(x => isNaN(x)).length;
    }

    get coinsAtStart () {
        // Because null is object and others are number including NaN.
        return this.cors.filter(x => typeof x == "object").length;
    }

    get coinsOutside () {
        return this.cors.filter(x => !isNaN(x) && typeof x == "number").length;
    }

    get completed () {
        return this.coinsReached == 4;
    }

    get type () {
        if (this.isBot) return 'bot';
        if (this.isNull) return 'null';
        else return 'player';
    }

    setCor(coin, value) {
        this.cors[coin - 1] = value;
    }

}

export class LudoLinkedPlayer extends LudoPlayer {

    constructor ([color, player]) {
        super(player);
        this.color = color;

        try {
            Object.defineProperties(this, {
                startPoint: { get: () => START_POINTS[this.color] }
            })
        } catch (e) {}
    }

}

// The default and primary ludo engine where the game process exists...
export const engine = new LudoEngine();