<script>
    import { onMount } from 'svelte';
    import Prison from './Prison.svelte';
    import Walkway from './Walkway.svelte';
    import Triangle from './Triangle.svelte'
    import { engine } from '../../js/engine';

    let minSide, cellSize, prisonSize, gameHomeSize;

    function setCSSDimensions () {
        let wrapElement = document.getElementById('wrap');
        minSide = Math.min(wrapElement.clientHeight,  wrapElement.clientWidth);
    }

    $: {
        cellSize = (minSide - 70) / 15;
        prisonSize = (6 * cellSize) + 24;
        // walkwayWidth = cellSize + 4;
        gameHomeSize = (cellSize * 3) + 8;
    }

    onMount(() => {
        setCSSDimensions();
        engine.onWindowLoad();
        window.addEventListener('resize', setCSSDimensions);
    });
</script>

<div 
    class="board-wrapper" 
    style="
        --board-width: {minSide}px; 
        --board-height: {minSide}px;
        --cell-size: {cellSize}px;
    "
>
    <div class="board w-full h-full">
        <div class="board-inner w-full">
            <div class="flex flex-nowrap">
                <Prison code="red" {cellSize} {prisonSize}/>

                <!-- 0 to 6 -->
                <Walkway offsetIndex={1} flexDirection="column"/>
                <!-- 7 to 12 -->
                <Walkway offsetIndex={7} flexDirection="column" color="blue"/>
                <!-- 13 to 18 -->
                <Walkway offsetIndex={13} flexDirection="column"/>

                <Prison code="blue" {cellSize} {prisonSize}/>
            </div>

            <div class="flex flex-nowrap">
                <div>
                    <!-- 19 to 24 -->
                    <Walkway offsetIndex={19}/>
                    <!-- 25 to 30 -->
                    <Walkway offsetIndex={25} color="red"/>
                    <!-- 31 to 36 -->
                    <Walkway offsetIndex={31}/>
                </div>

                <div style="width: {gameHomeSize}px;" class="game-home">
                    <div style="z-index: 6;">
                        <Triangle color="green" i={0} top={gameHomeSize / 2} {gameHomeSize}/>
                        <Triangle color="red" i ={1} top={gameHomeSize / 4} left={-gameHomeSize / 4} {gameHomeSize}/>
                        <Triangle color="blue" i={2} {gameHomeSize}/>
                        <Triangle color="yellow" i={3} top={gameHomeSize / 4} left={gameHomeSize / 4} {gameHomeSize}/>
                    </div>
                </div>

                <div>
                    <!-- 37 to 42 -->
                    <Walkway offsetIndex={37} flexDirection="row-r"/>
                    <!-- 43 to 48 -->
                    <Walkway offsetIndex={43} flexDirection="row-r" color="yellow"/>
                    <!-- 49 to 54 -->
                    <Walkway offsetIndex={49} flexDirection="row-r"/>
                </div>
            </div>

            <div class="flex flex-nowrap">
                <Prison code="green" {cellSize} {prisonSize}/>

                <!-- 55 to 60 -->
                <Walkway offsetIndex={55} flexDirection="column-r"/>
                <!-- 61 to 66 -->
                <Walkway offsetIndex={61} flexDirection="column-r" color="green"/>
                <!-- 67 to 72 -->
                <Walkway offsetIndex={67} flexDirection="column-r"/>

                <Prison code="yellow" {cellSize} {prisonSize}/>
            </div>
        </div>
    </div>
</div>

<style>
    .board {
        padding: 5px;
    }

    .board-wrapper {
        -webkit-transform: scale(0.95);
		-moz-transform: scale(0.95);
		-o-transform: scale(0.95);
		transform: scale(0.95);
    }

    :global(.mobile-view) .board-wrapper {
	    margin-left: calc(50% - min(50vw, 50vh));
    }

    :global(.alert) {
	    position: absolute;
	    background-color: rgba(0,0,0,0.6);
	    z-index: 5;
        border-radius: 10px;
    }

    :global(.alert p) {
	    font-family: "Titillium Web";
	    font-size: 30px;
    	color: white;
	    text-align: center;
    	line-height: 1;
	    margin-top: calc(50% - 50px);
    }

    :global(.alert), .board-wrapper {
        width: var(--board-width);
        height: var(--board-height);
    }

    .game-home {
        color: white;
        font-family: "Titillium Web";
        font-size: 30px;
        text-align: center;
        margin: 2px;
    }
</style>