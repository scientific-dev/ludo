<script>
    import Coin from './Coin.svelte';

    export let code, cellSize, houseSize;
    let innerHouseSize;

    $: innerHouseSize = (2 * cellSize) + 8;
</script>

<div class="house" style="width: {houseSize}px; height: {houseSize}px;">
    <div 
        class="house-inner" 
        style="margin: {(houseSize - innerHouseSize - 10) / 2}px; width: {innerHouseSize}px"    
    >
        <div style="display: flex; flex-wrap: nowrap;">
            <div>
                <Coin code={code} i={1} cellSize={cellSize}/>
                <Coin code={code} i={3} cellSize={cellSize}/>
            </div>
            <div>
                <Coin code={code} i={2} cellSize={cellSize}/>
                <Coin code={code} i={4} cellSize={cellSize}/>
            </div>
        </div>
    </div>
</div>