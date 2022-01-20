<script>
    import Coin from './Coin.svelte';
    import { engine } from '../../js/engine';
import { HOUSE_SIDES } from '../../js/constants';

    export let code, cellSize, prisonSize, prisonSelectable;
    engine.on(`${code}PrisonSelectable`, () => prisonSelectable = !prisonSelectable);

    let innerPrisonSize, prisonInnerMargin;

    $: {
        innerPrisonSize = (4 * cellSize) + 4;
        prisonInnerMargin = (prisonSize - innerPrisonSize - 10) / 2;
    }
</script>

<div 
    class="prison {prisonSelectable ? 'prison-selectable' : ''}" 
    style="width: {prisonSize}px; height: {prisonSize}px; --color: var(--{code}-player);" 
    id="prison-{code}"
    on:click={() => {
        if (prisonSelectable) engine.emit(`${code}Select`, 'prison');
    }}
>
    <div 
        class="prison-cover"
        style="border-{HOUSE_SIDES[code]}-radius: 8px;"
    >
        <div 
            class="prison-inner" 
            style="
                margin: {prisonInnerMargin}px;
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
</div>

<style>
    .prison {
	    display: inline-block;
    }

    .prison-inner {
	    background-color: var(--step-color);
	    border-radius: 5px;
	    padding: 5px;
    }

    :global(.prison-inner .coin) {
        margin: calc(var(--cell-size) / 2)!important;
    }

    .prison-cover {
        background-color: var(--color);
        height: calc(100% - 4px);
        width: calc(100% - 4px);
        display: inline-block;
        margin: 2px;
    }

    :global(.prison-selectable) {
	    cursor: pointer;
    }
</style>