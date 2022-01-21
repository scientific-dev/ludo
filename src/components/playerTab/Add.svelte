<script>
    import { engine } from "../../js/engine";

    export let started;

    const updateToDislplay = () => toDisplay = engine.playerCount != 4;
    let toDisplay = engine.playerCount != 4;

    engine.on('playerCountUpdate', updateToDislplay);
    engine.on('end', updateToDislplay); // Sometimes it messes up in the "end" event.
</script>

{#if !started && toDisplay}
    <div class="player-tab">
        <div class="head" style="background-color: var(--dull-player);">
            <h3>Add</h3>
        </div>

        <div class="foot">
            <a 
                href="#wrap"
                on:click={() => {
                    if (!engine.createPlayer()) 
                        engine.alert('Player limit has been reached...');
                }}
            >Add Player?</a>

            <a 
                href="#wrap" 
                on:click={() => {
                    if (!engine.createPlayer(true)) 
                        engine.alert('Player limit has been reached...');
                }}
            >Add Bot?</a>
        </div>
    </div>
{/if}

<style>
    .player-tab h3 {
	    margin: 0;
	    font-size: 30px;
    }

    :global(.mobile-view) .player-tab h3 { 
        font-size: 25px; 
    }
</style>