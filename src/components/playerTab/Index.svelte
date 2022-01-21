<script>
    import { engine, nthString } from "../../js/engine";

    export let color, started, ended;
    export let editable = true;

    let player = engine.players[color];
    let isTurn = false;

    if (editable) {
        engine.on(`${color}Update`, () => player = engine.players[color]);
        engine.on(`turn`, turnColor => isTurn = turnColor == color);
    }

    function removePlayer () {
        if (!engine.deletePlayer(color)) engine.alert('You cannot remove yourself from the game!');
    }
</script>

{#if !player.isNull}
    <div class="player-tab">
        <div class="head" style="background-color: var(--{color}-player);">
            <input
                class="player-input"
                type="text"
                value={player.name.slice(0, 10)}
                readonly={!editable}
                on:blur={e => {
                    if (editable) {
                        engine.updatePlayerName(color, e.target.value);
                        engine.alert('Name updated', 1000);
                    }
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

            <p class="sub-label">{player.type.toUpperCase()}</p>

            {#if !ended}
                {#if !started && editable}
                    <a href="#wrap" on:click={removePlayer}>Remove {player.type.toProperCase()}?</a>
                {:else if isTurn}
                    <p class="sub-label">CURRENT TURN</p>
                {/if}
            {/if}

            {#if player.rank}
                <p class="sub-label">{nthString(player.rank)} Place</p>
            {/if}
        </div>
    </div>
{/if}

<style>
    :global(.player-tab) {
	    color: white;
	    font-family: "Titillium Web";
    	margin: 10px;
	    width: calc(50% - 20px);
    }

    :global(.mobile-view .player-tab) { 
	    margin: 5px; 
	    width: calc(50% - 10px);
    }

    :global(.player-tab .foot) { 
	    background-color: white;
    	border-bottom-left-radius: 4px;
	    border-bottom-right-radius: 4px;
    	padding: 5px 10px;
	    height: calc(100% - 50px);
    }

    :global(.player-tab .head) {
    	border-top-left-radius: 4px;
	    border-top-right-radius: 4px;
	    padding: 0 10px;
    }

    :global(.player-tab p) {
    	margin: 0;
	    color: black;
    }

    :global(.player-tab a) { 
	    margin: 2px 0 0 0;
	    cursor: pointer;
	    text-decoration: none;
	    color: black;
	    border-radius: 2px;
	    padding: 2px 6px;
    	display: block;
	    text-align: center;
    }
    
    :global(.player-tab a:hover) {
	    color: white;
    	background-color: var(--dark-wood);
    }

    :global(.mobile-view) .player-input { 
        font-size: 25px; 
    }

    .mobile-view .player-tab p { 
        font-size: 15px; 
    }

    .player-input {
	    margin: 0;
	    background-color: transparent;
	    outline: none;
    	border: none;
	    width: 100%;
    	color: white;
        font-size: 30px;
	    font-weight: bold;
    	font-family: "Titillium Web";
    }

    .sub-label {
	    font-weight: bold;
	    border-radius: 3px;
	    text-align: center;
    }
</style>