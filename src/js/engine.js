import { DICE_HTML_SIDES, NULL_POINTS, PLAYER_PATHS, START_POINTS } from "./constants";
import { LudoAlert, LudoPlayer } from './engineUtils';
import { TinyEmitter } from "tiny-emitter";

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

    get playersArray () {
        return Object.values(this.players);
    }

    get playerCount () {
        return this.playersArray.filter(x => !x.isNull).length;
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

    async start () {
        if (this.started) return false;

        this.activePlayers = [];
        this.ranks = [];

        Object.entries(this.players)
            .forEach(x => {
                if (!x[1].isNull) {
                    this.activePlayers.push(x[1].refresh());
                    this.emit(`${x[1].color}Turn`); // Just in case, if it is not edited...
                }
            });

        if (this.activePlayers.length < 2) return false;

        this.started = true;
        this.ended = false;
        this.emit('start');
        this.activeBots = this.activePlayers.filter(x => x.isBot)
        this.clearSaved();

        await this.alert('The game has started...', 1000);
        return this.startTurns();
    }

    async startTurns () {
        // A bonus roll when if the die is rolled at 6, killed a coin
        // or one coin reached a house.
        let isBonusRoll = false;
        let repeatedDiceNumber = 0;

        while (!(await this.checkForCompletion())) {
            this.current = this.activePlayers[this.currentTurn];
            this.save(); // Autosaves the progress so you don't mess up later!

            let current = this.current; // To shorten code in this function...
            let isPlayer = !current.isBot;

            if (current.completed) {
                // Sometimes ranks may not appear...
                if (!this.ranks.includes(current)) await this.pushRank(current);
                this.nextTurn();
                repeatedDiceNumber = 0;
                continue;
            }

            // If it isn't a bonus roll, it would consider as a new turn
            if (!isBonusRoll) {
                this.emit(`turn`, current.color);
                if (isPlayer) await this.waitForEvent('diceRoll');
            }

            let diceNumber = repeatedDiceNumber || (await this.diceRoll(current.name + '\'s')) + 1;
            let coinsInside = current.coinsInsideIndices;
            let is6 = diceNumber == 6; // Just to reduce some code...
            isBonusRoll = is6;

            if (coinsInside.length == 4) {
                if (is6) {
                    current.cor(0, 0);
                    await this.moveCoin(current.color, 1, current.startPoint);
                    this.emit(`${current.color}Update`);
                } else await this.alert('Unfortunate!', 1200);
            } else {
                // Make the prison selectable..
                const togglePrisonSelectable =
                    is6 && isPlayer
                        ? () => this.emit(`${current.color}PrisonSelectable`)
                        : () => null;

                let type, expectedNumber;
                let usePrison = current.coinsAtPrison && is6;

                // If there is a number other than 6 and there are no coins outside to move...
                if (!is6 && !current.coinsOutside) {
                    isBonusRoll = false, repeatedDiceNumber = 0;
                    await this.alert('Unfortunate! No coins to move!', 1200);
                    this.nextTurn();
                    continue;
                }

                // If the decision results in out of range error...
                if ((expectedNumber = this.expectOutOfRange(diceNumber)) && !usePrison) {
                    repeatedDiceNumber = 0;
                    await this.alert(`Unforturnate! Needed ${expectedNumber} to reach the house.`, 1200);
                    if (!is6) this.nextTurn();
                    continue;
                } else usePrison = false;

                togglePrisonSelectable();

                // If it is a player, it awaits for a decision.
                // If it is a bot, it calculates moments and returns a decision.
                if (isPlayer) {
                    await this.alert('Select your move...', 1100);
                    type = await this.waitForEvent(`${current.color}Select`)
                } else type = usePrison ? 'prison' : await this.getBotChoice(diceNumber, coinsInside.length);

                if (type == 'prison') {
                    // The type 'prison' means the decision maker is asking
                    // to release a coin from the prison.
                    let x = coinsInside.random(); // Takes a random coin to release from prison
                    if (!x) {
                        await this.alert('No more coins left in prison...', 1100);
                        repeatedDiceNumber = diceNumber, isBonusRoll = true;
                        togglePrisonSelectable();
                        continue;
                    }

                    current.cor(x, 0);
                    await this.moveCoin(current.color, x + 1, current.startPoint);
                    this.emit(`${current.color}Update`);
                } else if (typeof type[0] == "number") {
                    // If the decision is returned in [number] format then it 
                    // is asking to move that paticular coin.
                    // It is in the format [number] for future purposes...

                    let { 
                        bonusRoll, // Boolean stating that this move got a bonus roll or not.
                        newStep, // Returns the new step id.
                        gameOver, // Boolean stating if the game got over with this move.
                        playerCompleted, // Boolean stating if the player has completed the game with this move.
                        outOfRange // Boolean stating if the decision selected makes the coin go out of range.
                    } = await this.moveCoinInPath(type[0], diceNumber);

                    // Out of range errors can be only caused by players so
                    // they will be given another chance...
                    if (outOfRange && isPlayer) {
                        repeatedDiceNumber = diceNumber, isBonusRoll = true;
                        togglePrisonSelectable();
                        continue;
                    }
                    
                    if (gameOver) break;
                    // If the player has completed his game, then there is no need of bonus rolls...
                    if (playerCompleted) isBonusRoll = false;
                    else {
                        isBonusRoll = isBonusRoll || bonusRoll;
                        // If the new step exists, it checks coins which can be killed...
                        if (!isNaN(newStep)) 
                            isBonusRoll = (await this.killCoins(newStep)) || isBonusRoll;
                    }
                } 
                
                // Other types like "skip" does not do anything so
                // there is no need for separate else if block for
                // other types.

                togglePrisonSelectable();
            }

            // If it is a bonus roll, it displays a screen that it is rolling again
            // else moves to next turn.
            if (isBonusRoll) await this.alert('Rolling again...', 750);
            else this.nextTurn();

            repeatedDiceNumber = 0;
        }

        this.end();
        return true;
    }

    async moveCoinInPath (id, toAdd) {
        let player = this.current;
        let coinID = `coin-${player.color}-${id}`;
        let cor = player.cors[id - 1] + toAdd;
        let newStep = PLAYER_PATHS[player.color][cor];

        if (newStep == Infinity) {
            player.cor(id - 1, NaN);
            
            let coinElement = document.getElementById(coinID);
            let playerCompleted = player.completed;

            coinElement.parentElement.removeChild(coinElement);
            await this.alert(`${player.name}'s coin has reached the house!`, 1100);

            if (playerCompleted) await this.pushRank(player, true, false);
            this.emit(`${player.color}Update`);

            return { 
                bonusRoll: true, 
                newStep: NaN, 
                gameOver: await this.checkForCompletion(),
                playerCompleted
            };
        } else if (!newStep) {
            await this.alert(`Unfortunate! Needed ${56 - player.cors[id - 1]} to reach the house...`);
            return { outOfRange: true, newStep: NaN };
        }

        player.cor(id - 1, cor);
        await this.moveCoin(player.color, id, newStep);

        return { bonusRoll: false, newStep };
    }

    async killCoins (step) {
        if (NULL_POINTS.includes(step)) return;

        // Find a better way to do this thing...
        for (let i = 0; i < this.activePlayers.length; i++) {
            let player = this.activePlayers[i];
            if (player == this.current) continue;

            let path = PLAYER_PATHS[player.color];
            let kills = 0;

            for (let i = 0; i < player.cors.length; i++) {
                if (path[player.cors[i]] == step) {
                    player.cor(i, null);
                    kills += 1;
                    await this.moveCoinToPrison(player.color, i + 1);
                }
            }

            if (kills) {
                this.current.kills += kills;
                this.emit(`${player.color}Update`)
                    .emit(`${this.current.color}Update`);

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

    async moveCoinToPrison (color, n) {
        let coinElement = document.getElementById(`coin-${color}-${n}`);
        let stepElement = coinElement.parentElement;
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

    getBotChoice (diceNumber, hasCoinsInPrison) {
        let indices = this.current.activeCoinIndices(diceNumber);

        // The brain of a very poor ai...
        return (
            !indices.length || 
            (diceNumber == 6 && hasCoinsInPrison && getRandom(2))
        ) ? 'prison' : this.getBotCoinChoice(indices, diceNumber);
    }

    getBotCoinChoice (indices, diceNumber) {
        let playerPath = PLAYER_PATHS[this.current.color];
        let futureCors = [];

        // Creating an array of cors which will be the future positions
        // of the coins.
        for (let i = 0; i < this.current.cors.length; i++) {
            let cor = this.current.cors[i];
            if (isNaN(cor)) futureCors.push(NaN);
            else {
                let fc = playerPath[cor + diceNumber];
                // Returning if the coin will reach its house...
                if (fc == Infinity) return [i + 1];
                futureCors.push(fc);
            };
        }

        // Finding if there is a coin which might kill other player/bot's
        // coin in its future position...
        //
        // Maximum possible iterations: 4 * 4 * 4 = 64
        // Minimum possible iterations: 2 * 4 * 1 = 8
        for (let i = 0; i < this.activePlayers.length; i++) {
            let player = this.activePlayers[i];
            if (this.current == player) continue;
            let playerPath = PLAYER_PATHS[player.color];

            for (let i = 0; i < player.cors.length; i++) {
                let c = playerPath[player.cors[i]];
                let x = futureCors.findIndex(c1 => typeof c1 == "number" && c1 == c);
                if (x != -1) return [x + 1];
            }
        }

        // If it fails to find some coin which can increase the bot's
        // winning chance, then it would move to a random decision!
        return [indices.random() + 1];
    }

    async checkForCompletion () {
        if (this.ranks.length == 3) {
            // This might look not the most efficient but the maximum array size would
            // be 4 so it should not be a problem...
            await this.pushRank(this.activePlayers.find(x => !this.ranks.includes(x)))
            return true;
        }

        for (let i = 0; i < this.activePlayers.length; i++) {
            let player = this.activePlayers[i];
            if (!player.isBot && !player.completed) return false;
        }

        // There might be chances that there are some bots still alive
        // even if all players are eliminated...
        for (let i = 0; i < this.activeBots.length; i++) {
            let bot = this.activeBots[i];
            if (!bot.completed) await this.pushRank(bot, false);
        }

        return true;
    }

    async pushRank (player, toAlert = true, toUpdate = true) {
        this.ranks.push(player);
        player.rank = this.ranks.length;
        if (toAlert) await this.alert(`${player.name} has won the ${nthString(this.ranks.length)} place!`, 1100);
        this.emit('canDisplayResults')
        if (toUpdate) this.emit(`${player.color}Update`);
    }

    expectOutOfRange (diceNumber) {
        if (this.current.coinsOutside == 1) {
            let playerPath = PLAYER_PATHS[this.current.color];

            for (let i = 0; i < this.current.cors.length; i++) {
                let cor = this.current.cors[i];
                if (
                    !isNaN(cor) && 
                    typeof cor == "number" &&
                    !playerPath[cor + diceNumber]
                ) return 56 - cor;
            }
        }
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

        this.started = false;
        this.ended = false;
        this.currentTurn = data.currentTurn;
        this.activeBots = []
        this.activePlayers = data.players.map(LudoPlayer.fromJSON);
        this.activeBots = this.activePlayers.filter(x => x.isBot)
        this.ranks = [];
        this.players = {
            red: LudoPlayer.NULL_PLAYER,
            green: LudoPlayer.NULL_PLAYER,
            yellow: LudoPlayer.NULL_PLAYER,
            blue: LudoPlayer.NULL_PLAYER
        };

        for (let i = 0; i < this.activePlayers.length; i++) {
            let player = this.activePlayers[i];
            let path = PLAYER_PATHS[player.color];

            this.players[player.color] = player;
            this.emit(`${player.color}Update`);

            for (let i = 0; i < player.cors.length; i++) {
                let n = player.cors[i];

                if (isNaN(n)) {
                    let coinElement = document.getElementById(`coin-${player.color}-${i + 1}`);
                    coinElement.parentElement.removeChild(coinElement);
                } else if (typeof n == "number")
                    promises.push(this.moveCoin(player.color, i + 1, path[n]));
            }
        }

        for (let i = 0; i < data.ranks.length; i++) {
            let player = this.players[data.ranks[i]];
            player.rank = i + 1;
            this.ranks.push(player);
        }

        if (this.ranks.length) this.emit('canDisplayResults');
        if (data.ended) this.end().emit('displayResult');
        else if (data.started) {
            this.started = true;
            this.emit('start');
        }

        await Promise.all(promises);
        if (data.started) {
            await this.alert('The game has resumed...', 1000);
            await this.startTurns();
        }
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

    end () {
        this.started = false;
        this.ended = true;
        this.save(); // A final save...
        this.emit('end');
        return this;
    }

}

// The default and primary ludo engine where the game process exists...
export const engine = new LudoEngine();
export const hasSaved = Boolean(localStorage.getItem('ludo_data'));
export { LudoPlayer, LudoAlert };