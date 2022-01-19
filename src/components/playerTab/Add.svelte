<script>
    import { engine } from "../../engine";

    export let started;

    let toDisplay = engine.playerCount != 4;
    engine.on('playerCountUpdate', () => toDisplay = engine.playerCount != 4);

    function createPlayer () {
        if (!engine.createPlayer()) engine.alert('Player limit has been reached...');
    }
</script>

{#if !started && toDisplay}
    <div class="player-tab">
        <div class="head" style="background-color: var(--dull-player);">
            <h3>Add</h3>
        </div>

        <div class="foot">
            <a href="#wrap" on:click={createPlayer}>Add Player?</a>
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