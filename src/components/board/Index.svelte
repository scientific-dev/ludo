<script>
    import { onMount } from 'svelte';
    import Prison from './Prison.svelte';
    import Walkway from './Walkway.svelte';
    import { engine } from '../../engine';

    let minSide, cellSize, prisonSize, walkwayWidth;

    function setCSSDimensions () {
        let wrapElement = document.getElementById('wrap');
        minSide = Math.min(wrapElement.clientHeight,  wrapElement.clientWidth);
    }

    $: {
        cellSize = (minSide - 70) / 15;
        prisonSize = (6 * cellSize) + 24;
        walkwayWidth = cellSize + 4;
    }

    onMount(() => {
        setCSSDimensions();
        engine.onWindowLoad();
        window.addEventListener('resize', () => setCSSDimensions());
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
                <Walkway {cellSize} offsetIndex={1} flexDirection="column"/>
                <!-- 7 to 12 -->
                <Walkway {cellSize} offsetIndex={7} flexDirection="column" color="blue"/>
                <!-- 13 to 18 -->
                <Walkway {cellSize} offsetIndex={13} flexDirection="column"/>

                <Prison code="blue" {cellSize} {prisonSize}/>
            </div>

            <div class="flex flex-nowrap">
                <div>
                    <!-- 19 to 24 -->
                    <Walkway {cellSize} offsetIndex={19}/>
                    <!-- 25 to 30 -->
                    <Walkway {cellSize} offsetIndex={25} color="red"/>
                    <!-- 31 to 36 -->
                    <Walkway {cellSize} offsetIndex={31}/>
                </div>
                
                <div style="width: {walkwayWidth * 3}px;"/>

                <div>
                    <!-- 37 to 42 -->
                    <Walkway {cellSize} offsetIndex={37} flexDirection="row-r"/>
                    <!-- 43 to 48 -->
                    <Walkway {cellSize} offsetIndex={43} flexDirection="row-r" color="yellow"/>
                    <!-- 49 to 54 -->
                    <Walkway {cellSize} offsetIndex={49} flexDirection="row-r"/>
                </div>
            </div>

            <div class="flex flex-nowrap">
                <Prison code="green" {cellSize} {prisonSize}/>

                <!-- 55 to 60 -->
                <Walkway {cellSize} offsetIndex={55} flexDirection="column-r"/>
                <!-- 61 to 66 -->
                <Walkway {cellSize} offsetIndex={61} flexDirection="column-r" color="green"/>
                <!-- 67 to 72 -->
                <Walkway {cellSize} offsetIndex={67} flexDirection="column-r"/>

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
</style>