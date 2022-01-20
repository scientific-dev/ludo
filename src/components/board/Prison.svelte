<script>
    import Coin from './Coin.svelte';
    import { engine } from '../../js/engine';

    export let code, cellSize, prisonSize, prisonSelectable;
    engine.on(`${code}PrisonSelectable`, () => prisonSelectable = !prisonSelectable);

    let innerPrisonSize;
    $: innerPrisonSize = (2 * cellSize) + 12;
</script>

<div 
    class="prison {prisonSelectable ? 'prison-selectable' : ''}" 
    style="width: {prisonSize}px; height: {prisonSize}px;" 
    id="prison-{code}"
    on:click={() => {
        if (prisonSelectable) engine.emit(`${code}Select`, 'prison');
    }}
>
    <div 
        class="prison-inner" 
        style="
            margin: {(prisonSize - innerPrisonSize - 10) / 2}px; 
            width: {innerPrisonSize}px;
            height: {innerPrisonSize}px;
        "    
    >
        <div class="flex flex-wrap">
            <Coin {code} i={1}/>
            <Coin {code} i={2}/>
            <Coin {code} i={3}/>
            <Coin {code} i={4}/>
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