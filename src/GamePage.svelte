<script>
    import Board from './components/board/Index.svelte';
    import PlayerTab from './components/playerTab/Index.svelte';
    import LudoEngine from './engine';

    const engine = new LudoEngine();

    let players = engine.players;
</script>

<div class="game-page">
    <Board 
        engine={engine}
        on:playersUpdate={() => players = engine.players}
    /> 

    <div class="players-tab">
        <div class="flex flex-nowrap">
            <PlayerTab color="red" player={players.red}/>
            <PlayerTab color="yellow" player={players.yellow}/>
        </div>

        <div class="flex flex-nowrap">
            <PlayerTab color="blue" player={players.blue}/> 
            <PlayerTab color="green" player={players.green}/>
        </div>
    </div>
</div>