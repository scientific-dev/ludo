<script>
    export let code, i, cellSize;
</script>

<div 
    class="coin" 
    id="coin-{code}-{i}" 
    style="background-color: var(--{code}-player); width: {cellSize}px; height: {cellSize}px;"
></div>