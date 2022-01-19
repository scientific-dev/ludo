<script>
    import { onMount } from 'svelte';
    import Board from './components/board/Index.svelte';
    import PlayerTab from './components/playerTab/Index.svelte';
    import AddPlayer from './components/playerTab/Add.svelte';
    import { engine } from './engine';

    let rGamePage = false;
    let started = engine.started;

    engine.on('start', () => started = true);
    engine.on('end', () => started = false);

    async function startGame () {
        let success = await engine.start(true);
        if (!success) engine.alert('Minimum two players are required.');
    }

    function gamePageResponsiveHandler () {
        let wrapElement = document.getElementById('wrap');
        rGamePage = wrapElement.clientWidth < (wrapElement.clientHeight * 2);
	}

	onMount(() => {
		gamePageResponsiveHandler();
		window.addEventListener('resize', gamePageResponsiveHandler);
	});
</script>

<!-- This element just wraps the whole body... -->
<div class="wrap" id="wrap"/>

<div class="game-page" class:r-game-page={rGamePage}>
    <Board/> 

    <div class="players-tab">
        <div class="flex flex-wrap">
            <PlayerTab color="red" {started}/>
            <PlayerTab color="yellow" {started}/>
            <PlayerTab color="blue" {started}/> 
            <PlayerTab color="green" {started}/>
            <AddPlayer {started}/>
        </div>

        {#if !started}
            <a 
                class="pt-btn" 
                href="#wrap" 
                on:click={startGame}
            >Start Game</a>
        {:else}
            <a 
                class="pt-btn" 
                href="#wrap" 
                on:click={() => engine.emit('diceRoll')}
            >Roll Dice</a>
        {/if}
    </div>
</div>