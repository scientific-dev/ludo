<script>
    import PlayerTab from '../playerTab/Index.svelte';
    import { engine } from "../../js/engine";

    export let started;
    let displayResult = false;

    engine.on('displayResult', () => displayResult = true);
</script>

{#if displayResult}
    <div class="result-wrap"/>
    <div class="result-tab">
        <h3>Result</h3>

        {#if engine.ranks.length}
            <p>{engine.ranks[0].name} has won the game!</p>
        {/if}

        <h5>Rankings</h5>
        <div class="result-players-tab">
            {#each engine.ranks as player}
                <PlayerTab 
                    color={player.color} 
                    editable={false} 
                    {started}
                />
            {/each}
        </div>

        <a href="#wrap" on:click={() => displayResult = false}>Close Tab</a>
    </div>
{/if}

<style>
    .result-wrap {
        position: fixed;
        background-color: rgba(0, 0, 0, 0.6);
        width: 100%;
        height: 100%;
        z-index: 10;
    }

    .result-tab {
        position: fixed;
        left: 10%;
        right: 10%;
        z-index: 12;
        font-family: "Titillium Web";
        padding: 20px;
        background-color: whitesmoke;
        border-radius: 5px;
        margin-top: 5%;
        -webkit-transform: scale(0);
		-moz-transform: scale(0);
		-o-transform: scale(0);
		transform: scale(0);
        animation: coin-entry .3s forwards;
    }

    .result-tab h3, .result-tab h5 {
        line-height: 1;
        margin: 0;
    }

    .result-tab p {
        margin-left: 1px;
        margin-top: 0px;
    }

    .result-tab h3 {
        font-size: 40px;
    }

    .result-tab h5 {
        font-size: 25px;
        margin: -5px 0 0 2px;
    }

    .result-tab a {
        color: white;
        width: 20%;
        display: inline-block;
        background-color: var(--dark-wood);
        border-radius: 3px;
        padding: 4px 0;
        text-align: center;
        margin-top: 10px;
        margin-left: 10px;
        cursor: pointer;
        text-decoration: none;
    }

    .result-tab a:hover {
        background-color: var(--darker-wood);
    }

    @media (max-width: 750px) {
        .result-tab a {
            width: calc(100% - 20px);
        }

        :global(.result-players-tab .player-tab) {
            width: calc(100% - 20px);
        }
    }

    @media (min-width: 750px) {
        .result-players-tab {
            display: flex;
            flex-wrap: wrap;
        }
    }
</style>