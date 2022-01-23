<script>
    import { onMount } from 'svelte';
    import Board from './components/board/Index.svelte';
    import PlayerTab from './components/playerTab/Index.svelte';
    import AddPlayer from './components/playerTab/Add.svelte';
    import Result from './components/result/Index.svelte';
    import { engine, hasSaved } from './js/engine';

    let mobileView = false;
    let canDisplayResultBtn = false;
    let started = engine.started;
    let ended = engine.ended;
    let boardKey = {};

    engine.on('start', () => {
        started = true
        if (ended) boardKey = {};
        ended = false;
    });

    engine.on('canDisplayResults', () => canDisplayResultBtn = true);
    engine.on('end', () => {
        canDisplayResultBtn = true;
        ended = true;
        engine.emit('displayResult');
    });

    function gamePageResponsiveHandler () {
        let wrapElement = document.getElementById('wrap');
        mobileView = wrapElement.clientWidth < (wrapElement.clientHeight * 2);
	}

	onMount(() => {
		gamePageResponsiveHandler();
		window.addEventListener('resize', gamePageResponsiveHandler);
	});
</script>

<!-- This element just wraps the whole body... -->
<div class="wrap" id="wrap"/>

<Result {started}/>

<div class="flex" class:mobile-view={mobileView}>
    {#key boardKey}
        <Board/> 
    {/key}

    <div class="players-tab">
        <div class="flex flex-wrap">
            <PlayerTab color="red" {started} {ended}/>
            <PlayerTab color="yellow" {started} {ended}/>
            <PlayerTab color="blue" {started} {ended}/> 
            <PlayerTab color="green" {started} {ended}/>
            <AddPlayer {started}/>
        </div>

        <div class="flex flex-wrap">
            {#if !started}
                <a 
                    class="player-tab-btn" 
                    href="#wrap" 
                    on:click={async () => {
                        if (hasSaved && !confirm('Are you sure? Your old game data might be deleted!')) return;
                        let success = await engine.start();
                        if (!success) engine.alert('Minimum two players are required.', 1000);
                    }}
                >New Game</a>

                {#if hasSaved && !ended}
                    <a 
                        class="player-tab-btn" 
                        href="#wrap" 
                        on:click={() => engine.startFromSaved()}
                    >Resume Game</a>
                {/if}
            {:else}
                <a 
                    class="player-tab-btn" 
                    href="#wrap" 
                    on:click={() => engine.emit('diceRoll')}
                >Roll Dice</a>

                <a 
                    class="player-tab-btn" 
                    href="#wrap" 
                    on:click={() => engine.save()}
                >Save Game</a>

                <a 
                    class="player-tab-btn" 
                    href="#wrap" 
                    on:click={() => {
                        if (confirm('Are you sure? Your old game data might be deleted!')) {
                            engine.clearSaved();
                            window.location.href = "?game";
                        }
                    }}
                >New Game</a>
            {/if}

            {#if canDisplayResultBtn}
                <a 
                    class="player-tab-btn" 
                    href="#wrap" 
                    on:click={() => engine.emit('displayResult')}
                >Results</a>
            {/if}
        </div>
    </div>
</div>

<style>
    .wrap {
	    width: 100vw;
	    height: 100vh;
    	position: fixed;
	    z-index: -1;
    }

    .players-tab {
	    padding: 30px;
	    width: 100%;
    }

    .player-tab-btn {
        display: inline-block;
	    margin: 10px 10px 0 10px;
        width: calc(50% - 40px);
        padding: 5px 10px;
        background-color: var(--dark-wood);
	    color: white;
	    font-family: "Titillium Web";
	    border-radius: 4px;
    	text-align: center;
        text-decoration: none;
    }

    .player-tab-btn:hover {
        background-color: var(--darker-wood);
    }

    .mobile-view {
	    display: block!important;
    }

    .mobile-view .players-tab {
	    padding: 10px;
	    width: calc(100% - 20px);
    }

    .mobile-view .player-tab-btn {
	    padding-top: 5px;
	    width: calc(100% - 30px);
	    margin: 5px;
    }
</style>