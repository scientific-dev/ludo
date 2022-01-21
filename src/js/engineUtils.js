import { START_POINTS } from "./constants";
import { sleep } from "./engine";

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
        this.parent.prepend(this.element);
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

    static NULL_PLAYER = new LudoPlayer('No Player', "null").null();

    kills = 0;
    cors = [null, null, null, null];
    // Coordinates of coins. 
    // - number, if the coin is on track
    // - null, if coin at start.
    // - NaN, if coin has reached the house.

    constructor (name, color, isBot) {
        this.name = name;
        this.color = color;
        if (isBot) this.isBot = true;
    }

    static fromJSON (json) {
        let pl = new LudoPlayer(json.name, json.color);

        pl.cors = json.cors.map(x => x == 'nan' ? NaN : x);
        pl.kills = json.kills;

        if (json.color) pl.color = json.color;
        if (json.rank) pl.rank = json.rank;
        if (json.bot) pl.isBot = json.bot;

        return pl;
    }

    get coinsReached () {
        return this.cors.filter(x => isNaN(x)).length;
    }

    get coinsAtPrison () {
        // Because null is object and others are number including NaN.
        return this.cors.filter(x => typeof x == "object").length;
    }

    get coinsOutside () {
        return this.cors.filter(x => !isNaN(x) && typeof x == "number").length;
    }

    get completed () {
        for (let i = 0; i < this.cors.length; i++)
            if (!isNaN(this.cors[i])) return false;

        return true;
    }

    get startPoint () {
        return START_POINTS[this.color];
    }

    get activeCoinsIndices () {
        let coins = [];

        for (let i = 0; i < this.cors.length; i++) {
            let x = this.cors[i];
            if (!isNaN(x) && typeof x == "number") coins.push(i);
        }

        return coins;
    }

    get coinsInsideIndices () {
        let coins = [];
        for (let i = 0; i < this.cors.length; i++)
            if (typeof this.cors[i] == "object") coins.push(i);

        return coins;
    }

    get type () {
        if (this.isBot) return 'bot';
        if (this.isNull) return 'null';
        return 'player';
    }

    null () {
        this.isNull = true;
        return this;
    }

    toJSON () {
        return {
            kills: this.kills,
            cors: this.cors.map(x => isNaN(x) ? 'nan' : x),
            name: this.name,
            color: this.color,
            bot: this.isBot
        };
    }

} 