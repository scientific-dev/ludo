<script>
    import Step from './Step.svelte';

    export let offsetIndex;
    export let flexDirection = "row";
    export let color = null;
</script>

<div class="flex flex-nowrap flex-{flexDirection}">
    {#if !color}
        {#each Array(6) as _, i}
            <Step i={offsetIndex + i}/>
        {/each}
    {:else}
        <Step i={offsetIndex}/>
        {#each Array(5) as _, i}
            <Step i={offsetIndex + i + 1} {color}/>
        {/each}
    {/if}
</div>