<script>
    export let code, i;
</script>

<div 
    class="coin" 
    id="coin-{code}-{i}" 
    style="background-color: var(--{code}-player);"
></div>

<style>
    .coin {
	    border-radius: 100%;
    	margin: 2px;
	    height: var(--cell-size);
    	width: var(--cell-size);
	    border: 1px solid black;
    }
</style>