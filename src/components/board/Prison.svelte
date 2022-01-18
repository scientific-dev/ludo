<script>
    import Coin from './Coin.svelte';

    export let code, cellSize, prisonSize;

    let innerPrisonSize;
    $: innerPrisonSize = (2 * cellSize) + 8;
</script>

<div class="prison" style="width: {prisonSize}px; height: {prisonSize}px;">
    <div 
        class="prison-inner" 
        style="margin: {(prisonSize - innerPrisonSize - 10) / 2}px; width: {innerPrisonSize}px"    
    >
        <div style="display: flex; flex-wrap: nowrap;">
            <div>
                <Coin code={code} i={1}/>
                <Coin code={code} i={3}/>
            </div>
            <div>
                <Coin code={code} i={2}/>
                <Coin code={code} i={4}/>
            </div>
        </div>
    </div>
</div>