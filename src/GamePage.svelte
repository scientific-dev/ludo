<script>
    import Board from './components/board/Index.svelte';
    import PlayerTab from './components/playerTab/Index.svelte';
    import AddPlayer from './components/playerTab/Add.svelte';
    import { engine } from './engine';

    let started = engine.started;

    engine.on('start', () => started = true);
    engine.on('end', () => started = false);
</script>

<div class="game-page">
    <Board/> 

    <div class="players-tab">
        <div class="flex flex-wrap">
            <PlayerTab color="red" started={started}/>
            <PlayerTab color="yellow" started={started}/>
            <PlayerTab color="blue" started={started}/> 
            <PlayerTab color="green" started={started}/>
            <AddPlayer started={started}/>
        </div>
    </div>
</div>