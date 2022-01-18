<script>
    import House from './House.svelte';
    import Walkway from './Walkway.svelte';
    import LudoEngine from '../../engine';

    const engine = new LudoEngine();

    let minSide, cellSize, houseSize, walkwayWidth;

    function setCSSDimensions () {
        let wrapElement = document.getElementById('wrap');
        let wh = wrapElement.clientHeight;
        let ww = wrapElement.clientWidth;

        minSide = Math.min(ww, wh);
        // maxSide = Math.max(ww, wh);
        // marginSide = wrapElement.clientWidth > wrapElement.clientHeight ? 'left' : 'top';
    }

    $: {
        cellSize = (minSide - 70) / 15;
        houseSize = (6 * cellSize) + 24;
        walkwayWidth = cellSize + 4;
        // walkwayHeight = houseSize;
    }

    window.addEventListener('load', () => {
        setCSSDimensions();
        engine.onWindowLoad();
        // document.querySelectorAll('.step').forEach(e => e.innerHTML = e.id.split('-')[1]);
    });

    window.addEventListener('resize', () => {
        setCSSDimensions();
    });

    // margin-{marginSide}: {(maxSide - minSide) / 2}px;
</script>

<div class="wrap" id="wrap"/>

<div class="board-wrapper" style="height: {minSide - 10}px; width: {minSide}px;">
    <div class="board">
        <div class="board-inner">
            <div class="flex flex-nowrap">
                <House code="red" cellSize={cellSize} houseSize={houseSize}/>

                <!-- 0 to 6 -->
                <Walkway cellSize={cellSize} offsetIndex={1} flexDirection="column"/>
                <!-- 7 to 12 -->
                <Walkway cellSize={cellSize} offsetIndex={7} flexDirection="column" color="blue"/>
                <!-- 13 to 18 -->
                <Walkway cellSize={cellSize} offsetIndex={13} flexDirection="column"/>

                <House code="blue" cellSize={cellSize} houseSize={houseSize}/>
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
                <House code="green" cellSize={cellSize} houseSize={houseSize}/>

                <!-- 55 to 60 -->
                <Walkway cellSize={cellSize} offsetIndex={55} flexDirection="column-r"/>
                <!-- 61 to 66 -->
                <Walkway cellSize={cellSize} offsetIndex={61} flexDirection="column-r" color="green"/>
                <!-- 67 to 72 -->
                <Walkway cellSize={cellSize} offsetIndex={67} flexDirection="column-r"/>

                <House code="yellow" cellSize={cellSize} houseSize={houseSize}/>
            </div>
        </div>
    </div>
</div>