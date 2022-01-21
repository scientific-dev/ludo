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
    activeBots = [];
    currentTurn = 0;
    ranks = [];
    players = {
        red: new LudoPlayer('You', 'red'),
        green: LudoPlayer.NULL_PLAYER,
        yellow: LudoPlayer.NULL_PLAYER,
        blue: LudoPlayer.NULL_PLAYER
    };

    constructor () {
        super();

        this.on('start', () => this.activeBots = this.activePlayers.filter(x => x.isBot));
        this.on('end', () => this.ended = true);
    }

    get playersArray () {
        return Object.values(this.players);
    }

    get playerCount () {
        return this.playersArray.filter(x => !x.isNull).length;
    }

    get currentTurnPlayer () {
        return this.activePlayers[this.currentTurn];
    }

    nextTurn () {
        let x = this.activePlayers.length - 1;
        this.currentTurn += (this.currentTurn == x) ? -x : 1;
    }

    onWindowLoad () {
        // These things can be done directly through svelte but 
        // still I prefer to do it like this...
        let styleElement = document.createElement('style');

        styleElement.innerHTML = 
            NULL_POINTS
                .map(id => `#step-${id} {background-color:var(--dark-step-color)!important}`)
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
        // A bonus roll when if the die is rolled at 6, killed a coin
        // or one coin reached a house.
        let isBonusRoll = false;

        while (!await this.checkForCompletion()) {
            let current = this.currentTurnPlayer;
            let isPlayer = !current.isBot;
            this.save(); // Autosaves the progress so you don't mess up later!

            // If it isn't a bonus roll, it would consider as a new turn
            if (!isBonusRoll) {
                if (current.completed) continue;
                this.emit(`turn`, current.color);
                if (isPlayer) await this.waitForEvent('diceRoll');
            }

            let diceNumber = (await this.diceRoll(current.name + '\'s')) + 1;
            let coinsInside = current.coinsInsideIndices;
            let is6 = diceNumber == 6; // Just to reduce some code...
            isBonusRoll = is6;

            if (coinsInside.length == 4) {
                if (is6) {
                    current.cors[0] = 0;
                    await this.moveCoin(current.color, 1, current.startPoint);
                    this.emit(`${current.color}Update`);
                } else await this.alert('Unfortunate!', 1200);
            } else {
                let type;

                // If there is a number other than 6 but no coins outside the prison
                // then the turn is skipped...
                if (!current.coinsOutside) {
                    isBonusRoll = false;
                    await this.alert('Unfortunate! No coins to move!', 1200);
                    this.nextTurn();
                    continue;
                }

                // Makes the prison selectable...
                if (is6) this.emit(`${current.color}PrisonSelectable`);

                // If it is a player, it awaits for a decision.
                // If it is a bot, it calculates moments and returns a decision.
                if (isPlayer) {
                    await this.alert('Select your move...', 1100);
                    type = await this.waitForEvent(`${current.color}Select`)
                } else type = this.getBotChoice(current, diceNumber);

                if (type == 'prison') {
                    // The type 'prison' means the decision maker is asking
                    // to release a coin from the prison.

                    let x = coinsInside.random(); // Takes a random coin to release from prison
                    current.cors[x] = 0;
                    await this.moveCoin(current.color, x + 1, current.startPoint);
                    this.emit(`${current.color}Update`);
                } else if (typeof type[0] == "number") {
                    // If the decision is returned in [number] format then it 
                    // is asking to move that paticular coin.
                    // It is in the format [number] for future purposes...

                    let { 
                        bonusRoll, // Boolean stating that this move got a bonus roll or not.
                        newStep, // Returns the new step id.
                        gameOver // Boolean stating if the game got over with this move.
                    } = await this.moveCoinInPath(current.color, type[0], current, diceNumber);
                    
                    if (gameOver) break;
                    isBonusRoll = isBonusRoll || bonusRoll;

                    // If the new step exists, it checks coins which can be killed...
                    if (!isNaN(newStep)) 
                        isBonusRoll = (await this.killCoins(current, newStep)) || isBonusRoll;
                }

                // Makes the prison selectable.
                if (is6) this.emit(`${current.color}PrisonSelectable`);
            }

            // If it is a bonus roll, it displays a screen that it is rolling again
            // else moves to next turn.
            if (isBonusRoll) await this.alert('Rolling again...', 750);
            else this.nextTurn();
        }

        this.emit('end');
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
                this.ranks.push(player);
                await this.alert(`${player.name} has won the ${nthString(this.ranks.length)} place!`, 1100);
                player.rank = this.ranks.length;
                this.emit('canDisplayResults');
            }

            this.emit(`${color}Update`);
            return { 
                bonusRoll: true, 
                newStep: NaN, 
                gameOver: await this.checkForCompletion() 
            };
        }

        player.cors[id - 1] = cor;
        await this.moveCoin(color, id, newStep);
        return { bonusRoll: false, newStep };
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

    getForwardStep (x, color, offset) {
        let playerPath = PLAYER_PATHS[color];
        return playerPath[playerPath.indexOf(x) + offset + 1];
    }

    getBotChoice (current, diceNumber) {
        if ((diceNumber == 6) && getRandom(2)) return 'prison';
        else {
            // This can stress runtime.
            // But in future, this can be upgraded.
            
            let futureCors = current.cors
                .map(x => !x && isNaN(x) ? NaN : this.getForwardStep(x, current.color, diceNumber));
            
            for (let i = 0; i < this.activePlayers.length; i++) {
                let player = this.activePlayers[i];
                for (let i = 0; i < player.cors.length; i++) {
                    let cor = futureCors.findIndex(x => x == player.cors[i]);
                    if (cor != -1) return [cor];
                }
            }

            return [current.activeCoinsIndices.random() + 1];
        }
    }

    async checkForCompletion () {
        if (this.ranks.length == 3) {
            // This might look not the most efficient but the maximum array size would
            // be 4 so it should not be a problem...
            let lastPlayer = this.activePlayers.find(x => !this.ranks.includes(x));
            this.ranks.push(lastPlayer);

            await this.alert(`${lastPlayer.name} has won the ${nthString(this.ranks.length)} place!`, 1100);
            return true;
        }

        for (let i = 0; i < this.activePlayers.length; i++) {
            let player = this.activePlayers[i];
            if (!player.isBot && !player.completed) return false;
        }

        // There might be chances that there are some bots still alive
        // even if all players are eliminated...
        this.ranks.push(...this.activeBots.filter(x => !x.completed));
        return true;
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
            players: this.activePlayers.map(player => player.toJSON())
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