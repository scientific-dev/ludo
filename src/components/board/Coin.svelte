<script>
    export let code, i, cellSize;
</script>

<div 
    class="coin" 
    id="coin-{code}-{i}" 
    style="background-color: var(--{code}-house); width: {cellSize}px; height: {cellSize}px;"
></div>