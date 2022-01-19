<script>
    import Step from './Step.svelte';

    export let cellSize, offsetIndex;
    export let flexDirection = "row";
    export let color = null;
</script>

<div class="flex flex-nowrap flex-{flexDirection}">
    {#if !color}
        {#each Array(6) as _, i}
            <Step i={offsetIndex + i} {cellSize}/>
        {/each}
    {:else}
        <Step i={offsetIndex} {cellSize}/>
        {#each Array(5) as _, i}
            <Step i={offsetIndex + i + 1} {color}/>
        {/each}
    {/if}
</div>