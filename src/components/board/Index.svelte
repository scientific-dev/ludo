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

<!-- This element just wraps the whole body... -->
<div class="wrap" id="wrap"/>

<div class="board-wrapper" style="height: {minSide - 10}px; width: {minSide}px;">
    <div class="board">
        <div class="board-inner">
            <div class="flex flex-nowrap">
                <Prison code="red" cellSize={cellSize} prisonSize={prisonSize}/>

                <!-- 0 to 6 -->
                <Walkway cellSize={cellSize} offsetIndex={1} flexDirection="column"/>
                <!-- 7 to 12 -->
                <Walkway cellSize={cellSize} offsetIndex={7} flexDirection="column" color="blue"/>
                <!-- 13 to 18 -->
                <Walkway cellSize={cellSize} offsetIndex={13} flexDirection="column"/>

                <Prison code="blue" cellSize={cellSize} prisonSize={prisonSize}/>
            </div>

            <div class="flex flex-nowrap">
                <div>
                    <!-- 19 to 24 -->
                    <Walkway cellSize={cellSize} offsetIndex={19}/>
                    <!-- 25 to 30 -->
                    <Walkway cellSize={cellSize} offsetIndex={25} color="red"/>
                    <!-- 31 to 36 -->
                    <Walkway cellSize={cellSize} offsetIndex={31}/>
                </div>
                
                <div style="width: {walkwayWidth * 3}px;"/>

                <div>
                    <!-- 37 to 42 -->
                    <Walkway cellSize={cellSize} offsetIndex={37} flexDirection="row-r"/>
                    <!-- 43 to 48 -->
                    <Walkway cellSize={cellSize} offsetIndex={43} flexDirection="row-r" color="yellow"/>
                    <!-- 49 to 54 -->
                    <Walkway cellSize={cellSize} offsetIndex={49} flexDirection="row-r"/>
                </div>
            </div>

            <div class="flex flex-nowrap">
                <Prison code="green" cellSize={cellSize} prisonSize={prisonSize}/>

                <!-- 55 to 60 -->
                <Walkway cellSize={cellSize} offsetIndex={55} flexDirection="column-r"/>
                <!-- 61 to 66 -->
                <Walkway cellSize={cellSize} offsetIndex={61} flexDirection="column-r" color="green"/>
                <!-- 67 to 72 -->
                <Walkway cellSize={cellSize} offsetIndex={67} flexDirection="column-r"/>

                <Prison code="yellow" cellSize={cellSize} prisonSize={prisonSize}/>
            </div>
        </div>
    </div>
</div>