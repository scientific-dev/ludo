<script>
    export let i;
    export let color = null;
</script>

<div 
    class="step" 
    id="step-{i}" 
    style={color ? `background-color: var(--${color}-player);` : ''}
/>

<style>
    .step {
	    background-color: var(--wood);
	    margin: 2px;
	    width: var(--cell-size);
	    height: var(--cell-size);
    }
</style>