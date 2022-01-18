<script>
    import Board from './components/board/Index.svelte';
    import PlayerTab from './components/playerTab/Index.svelte';
</script>

<div class="game-page">
    <Board/> 

    <div class="players-tab">
        <div class="flex flex-nowrap">
            <PlayerTab color="red"/>
            <PlayerTab color="yellow"/>
        </div>

        <div class="flex flex-nowrap">
            <PlayerTab color="blue"/> 
            <PlayerTab color="green"/>
        </div>
    </div>
</div>