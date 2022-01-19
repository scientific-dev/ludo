<script>
    import Coin from './Coin.svelte';
    import { engine } from '../../engine';

    export let code, cellSize, prisonSize;

    let innerPrisonSize;
    $: innerPrisonSize = (2 * cellSize) + 8;
</script>

<div 
    class="prison" 
    style="width: {prisonSize}px; height: {prisonSize}px;" 
    id="prison-{code}"
    on:click={() => engine.emit(`${code}Select`, 'house')}
>
    <div 
        class="prison-inner" 
        style="
            margin: {(prisonSize - innerPrisonSize - 10) / 2}px; 
            width: {innerPrisonSize}px
        "    
    >
        <div class="flex flex-nowrap">
            <div>
                <Coin {code} i={1}/>
                <Coin {code} i={3}/>
            </div>
            <div>
                <Coin {code} i={2}/>
                <Coin {code} i={4}/>
            </div>
        </div>
    </div>
</div>

<style>
    .prison {
	    display: inline-block;
    }

    .prison-inner {
	    background-color: var(--wood);
	    border-radius: 2px;
	    padding: 5px;
    }

    :global(.prison-selectable) {
	    cursor: pointer;
    }
</style>