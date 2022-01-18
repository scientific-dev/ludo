import { TinyEmitter } from 'tiny-emitter';
import { DICE_HTML_SIDES, NULL_POINTS, START_POINTS } from "./constants";

Array.prototype.random = function () {
    return this[Math.floor(Math.random() * this.length)];
}

String.prototype.toProperCase = function () {
    return this.charAt(0).toUpperCase() + this.substring(1).toLowerCase();
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

    get type () {
        if (this.isBot) return 'bot';
        if (this.isNull) return 'null';
        else return 'player';
    }

}


// The default and primary ludo engine where the game process exists...
export const engine = new LudoEngine();