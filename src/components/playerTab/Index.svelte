<script>
    import { engine } from "../../engine";

    export let color, started;

    let player = engine.players[color];
    let isTurn = false;

    engine.on(`${color}Update`, () => player = engine.players[color]);
    engine.on(`turn`, turnColor => isTurn = turnColor == color);

    function removePlayer () {
        if (!engine.deletePlayer(color)) engine.alert('You cannot remove yourself from the game!');
    }
</script>

{#if player.isNull}
    <!-- Just keep this empty... -->
{:else}
    <div class="player-tab">
        <div class="head" style="background-color: var(--{color}-player);">
            <input
                class="player-input"
                type="text"
                value={player.name.slice(0, 10)}
                on:blur={e => {
                    engine.updatePlayerName(color, e.target.value);
                    engine.alert('Name updated', 1000);
                }}
            />
        </div>

        <div class="foot">
            <p class="inline-block strong">Coins Outside: </p>
            <p class="inline-block">{player.coinsOutside}</p><br/>

            <p class="inline-block strong">Coins At Start: </p>
            <p class="inline-block">{player.coinsAtStart}</p><br/>

            <p class="inline-block strong">Coins Reached: </p>
            <p class="inline-block">{player.coinsReached}</p><br/>

            <p class="inline-block strong">Kills: </p>
            <p class="inline-block">{player.kills}</p><br/>

            {#if !started}
                <a href="#wrap" on:click={removePlayer}>Remove {player.type.toProperCase()}?</a>
            {/if}

            {#if isTurn}
                <p class="ct-label">CURRENT TURN</p>
            {/if}
        </div>
    </div>
{/if}