import { TinyEmitter } from 'tiny-emitter';
import { DICE_HTML_SIDES, NULL_POINTS, PLAYER_PATHS, START_POINTS } from "./constants";
import { LudoAlert, LudoPlayer } from './engineUtils';

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

export function nthString (n) {
    if (n == 1) return '1st';
    else if (n == 2) return '2nd';
    else if (n == 3) return '3rd';
    else return `${n}th`;
}

export default class LudoEngine extends TinyEmitter {

    started = false;
    ended = false;
    activePlayers = []; // Will be defined when the game starts...
    currentTurn = 0;
    ranks = [];
    players = {
        red: new LudoPlayer('You', 'red'),
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
        return this.activePlayers[this.currentTurn];
    }

    get completed () {
        for (let i = 0; i < this.activePlayers.length; i++) {
            if (!this.activePlayers[i].completed) return false;
        }

        return true;
    }

    nextTurn () {
        let x = this.activePlayers.length - 1;
        this.currentTurn += (this.currentTurn == x) ? -x : 1;
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

        document.getElementById('wrap').append(styleElement)

        if (this.started) {
            this.emit('start');
            this.alert('Resuming your game...', 1200);
        }
    }

    createPlayer (isBot) {
        let entry = Object.entries(this.players).find(([_, player]) => player.isNull);
        if (!entry) return null;

        this.players[entry[0]] = new LudoPlayer(isBot ? 'Bot' : 'Player', entry[0], isBot);
        this.emit(`${entry[0]}Update`)
            .emit('playerCountUpdate');

        return this.players[entry[0]];
    }

    deletePlayer (color) {
        if (this.playerCount == 1) return null;
        let player = this.players[color];

        this.players[color] = LudoPlayer.NULL_PLAYER;
        this.emit(`${color}Update`)
            .emit('playerCountUpdate');

        return player;
    }

    updatePlayerName(color, name) {
        // The engine may crash if wrong values supplied but
        // only if someone makes a fault in the engine.
        this.players[color].name = name;
        this.emit(`${color}Update`);
    }

    async start (toAlert = false) {
        if (this.started) return false;
        this.activePlayers = [];

        Object.entries(this.players)
            .forEach(x => {
                if (!x[1].isNull) 
                    this.activePlayers.push(x[1]);
            });

        if (this.activePlayers.length < 2) return false;

        this.started = true;
        this.emit('start');
        this.clearSaved();

        if (toAlert) await this.alert('The game has started...', 1000);
        return this.startTurns();
    }

    async startTurns () {
        let isBonusRoll = false;

        while (!this.completed) {
            let current = this.currentTurnPlayer;
            let isPlayer = !current.isBot;
            this.save(); // Autosaves the progress so you don't mess up later!

            if (!isBonusRoll) {
                if (current.completed) continue;
                this.emit(`turn`, current.color);
                if (isPlayer) await this.waitForEvent('diceRoll');
            }

            let diceNumber = (await this.diceRoll(current.name + '\'s')) + 1;
            let coinsInside = current.coinsInsideIndices;
            let is6 = diceNumber == 6;
            isBonusRoll = is6;

            if (coinsInside.length == 4) {
                if (is6) {
                    current.cors[0] = 0;
                    await this.moveCoin(current.color, 1, current.startPoint);
                    this.emit(`${current.color}Update`);
                } else await this.alert('Unfortunate!', 1200);
            } else {
                let type;

                if (is6) this.emit(`${current.color}PrisonSelectable`);
                if (isPlayer) {
                    await this.alert('Select your move...', 1100);
                    type = await this.waitForEvent(`${current.color}Select`)
                } else type = this.getRandomBotChoice(current, is6);

                if (type == 'prison') {
                    let x = coinsInside.random();
                    current.cors[x] = 0;
                    await this.moveCoin(current.color, x + 1, current.startPoint);
                    this.emit(`${current.color}Update`);
                } else if (typeof type[0] == "number") {
                    let [cond, x] = await this.moveCoinInPath(current.color, type[0], current, diceNumber);
                    isBonusRoll = isBonusRoll || cond;
                    if (!isNaN(x)) isBonusRoll = (await this.killCoins(current, x)) || isBonusRoll;
                }

                if (is6) this.emit(`${current.color}PrisonSelectable`);
            }

            if ((diceNumber == 6) || isBonusRoll) await this.alert('Rolling again...', 750);
            else this.nextTurn();
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

    async killCoins (currentPlayer, step) {
        if (NULL_POINTS.includes(step)) return;

        // Find a better way to do this thing...
        for (let i = 0; i < this.activePlayers.length; i++) {
            let player = this.activePlayers[i];
            if (player == currentPlayer) continue;

            let path = PLAYER_PATHS[player.color];
            let kills = 0;

            for (let i = 0; i < player.cors.length; i++) {
                if (path[player.cors[i]] == step) {
                    player.cors[i] = null;
                    kills += 1;
                    await this.moveCoinToPrison(player.color, i + 1);
                }
            }

            if (kills) {
                currentPlayer.kills += kills;
                this.emit(`${player.color}Update`)
                    .emit(`${currentPlayer.color}Update`);

                return true;
            }
        }
    }

    async moveCoin (color, number, stepID) {
        let coinElement = document.getElementById(`coin-${color}-${number}`);
        let stepElement = document.getElementById(`step-${stepID}`);
        let clonedCoin = coinElement.cloneNode();
        
        coinElement.classList.add('coin-exit');
        await sleep(500);
        coinElement.parentElement.removeChild(coinElement);

        clonedCoin.addEventListener('click', () => this.emit(`${color}Select`, number));
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
            await this.alert(`${player.name}'s coin has reached the house!`, 1100);

            if (player.completed) {
                await this.alert(`${player.name} has won the ${nthString(this.ranks.length)} place!`, 1100);
                this.ranks.push(player);
                player.rank = this.ranks.length;
            }

            this.emit(`${color}Update`);
            return [true, NaN];
        }

        player.cors[id - 1] = cor;
        await this.moveCoin(color, id, newStep);
        return [false, newStep]
    }

    async moveCoinToPrison (color, n) {
        let coinElement = document.getElementById(`coin-${color}-${n}`);
        let stepElement = coinElement.parentElement; // Since the coin is active one
        let clonedCoin = coinElement.cloneNode();
        
        coinElement.classList.add('coin-exit');
        await sleep(500);
        coinElement.parentElement.removeChild(coinElement);

        clonedCoin.classList.add('coin-active');
        document.querySelector(`#prison-${color} .prison-inner div`).appendChild(clonedCoin);
        stepElement.setNodeIDCss();
        await sleep(400);
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

    getRandomBotChoice (current, is6) {
        window.kek = current;
        return is6 && getRandom(2)
            ? 'house'
            : [current.activeCoinsIndices.random() + 1];
    }

    getRandomDiceSideHTML () {
        return this.getDiceSideHTML(getRandom(6));
    }

    getDiceSideHTML (n) {
        return `<div class="dside-${n + 1}">${DICE_HTML_SIDES[n]}</div>`;
    }

    toJSON () {
        return {
            started: this.started,
            ended: this.ended,
            currentTurn: this.currentTurn,
            ranks: this.ranks.map(x => x.color),
            players: this.activePlayers.map(player => ({
                kills: player.kills,
                cors: player.cors,
                name: player.name,
                color: player.color,
                bot: player.isBot
            }))
        };
    }

    save () {
        localStorage.setItem('ludo_data', JSON.stringify(this.toJSON()));
    }

    clearSaved () {
        localStorage.removeItem('ludo_data');
    }

    async startFromSaved () {
        let data = JSON.parse(localStorage.getItem('ludo_data') || '{}');
        let promises = [];

        if (data.started) {
            this.started = true;
            this.currentTurn = data.currentTurn;
            this.activePlayers = data.players.map(LudoPlayer.fromJSON);
            this.players.red = LudoPlayer.NULL_PLAYER;

            for (let i = 0; i < this.activePlayers.length; i++) {
                let player = this.activePlayers[i];
                let path = PLAYER_PATHS[player.color];

                this.players[player.color] = player;
                this.emit(`${player.color}Update`);

                for (let i = 0; i < player.cors.length; i++) {
                    let n = player.cors[i];
                    if (!isNaN(n) && typeof n == "number")
                        promises.push(this.moveCoin(player.color, i + 1, path[n]));
                }
            }

            for (let i = 0; i < data.ranks.length; i++) 
                this.ranks.push(this.players[data.ranks[i]]);
        }

        this.emit('start');
        await Promise.all(promises);
        
        if (data.started) {
            await this.alert('The game has resumed...', 1000);
            await this.startTurns();
        } else if (data.ended) this.emit('displayResult');
    }

}

// The default and primary ludo engine where the game process exists...
export const engine = new LudoEngine();
export const hasSaved = Boolean(localStorage.getItem('ludo_data'));
export { LudoPlayer, LudoAlert };