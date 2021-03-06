import { PLAYER_PATHS, START_POINTS } from "./constants";
import { sleep } from "./engine";

Array.prototype.count = function (func) {
    let x = 0;
    for (let i = 0; i < this.length; i++) 
        if (func(this[i])) x += 1;

    return x;
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
        this.updateProps();
    }

    static fromJSON (json) {
        let pl = new LudoPlayer(json.name, json.color);

        pl.cors = json.cors.map(x => x == 'nan' ? NaN : x);
        pl.kills = json.kills;

        if (json.color) pl.color = json.color;
        if (json.rank) pl.rank = json.rank;
        if (json.bot) pl.isBot = json.bot;

        return pl.updateProps();
    }

    updateProps () {
        this.coinsReached = this.cors.count(isNaN);
        this.coinsAtPrison = this.cors.count(x => typeof x == "object");
        this.coinsOutside = this.cors.count(x => !isNaN(x) && typeof x == "number");
        return this;
    }

    refresh () {
        delete this.rank;

        this.cors = [null, null, null, null];
        this.kills = 0;

        return this.updateProps();
    }

    cor(x, y) {
        this.cors[x] = y;
        return this.updateProps();
    }

    get completed () {
        return this.cors.every(isNaN);
    }

    get startPoint () {
        return START_POINTS[this.color];
    }

    activeCoinIndices (y) {
        let coins = [];
        let playerPath = PLAYER_PATHS[this.color];

        for (let i = 0; i < this.cors.length; i++) {
            let x = this.cors[i];
            if (!isNaN(x) && typeof x == "number") {
                if (typeof playerPath[x + y] == "number") coins.push(i)
            }
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