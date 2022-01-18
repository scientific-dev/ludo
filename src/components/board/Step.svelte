<script>
    export let i, cellSize;
    export let color = null;
</script>

<div 
    class="step" 
    id="step-{i}" 
    style="height: {cellSize}px; width: {cellSize}px; {color ? `background-color: var(--${color}-player);` : ''}"
/>