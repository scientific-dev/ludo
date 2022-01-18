import { DICE_HTML_SIDES, NULL_POINTS, START_POINTS } from "./constants";

Array.prototype.random = function () {
    return this[Math.floor(Math.random() * this.length)];
}

export async function sleep (ms) {
    return new Promise(r => setTimeout(r, ms));
}

export function getRandom (n) {
    return Math.floor(Math.random() * n);
}

export default class LudoEngine {

    players = {
        red: new LudoPlayer('You'),
        green: null,
        yellow: null,
        blue: null
    };

    onWindowLoad () {
        let styleElement = document.createElement('style');

        styleElement.innerHTML = 
            Object.entries(START_POINTS)
                .map(([color, id]) => `#step-${id} {background-color:var(--${color}-house)!important}`)
                .join('');

        styleElement.innerHTML += 
            NULL_POINTS
                .map(id => `#step-${id} {background-color:var(--dark-wood)!important}`)
                .join('');

        document.getElementById('wrap').append(styleElement);
    }

    async alert (message, waitTill = 2000) {
        let alrt = await new LudoAlert()
            .setParent(document.querySelector('.board-wrapper'))
            .setInnerHTML(`<p>${message}</p>`)
            .display();
        
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

    async display () {
        await sleep(1000)
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

    static NULL_PLAYER = new LudoPlayer('No Player');

    kills = [0, 0, 0, 0]; // [r, g, b, y]
    cors = [null, null, null, null];
    // Coordinates of coins. 
    // - null if coin at start.
    // - NaN if coin has reached the house.

    constructor (name) {
        this.name = name;
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

}