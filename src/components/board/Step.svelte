<script>
    export let i, cellSize, color;
</script>

<div 
    class="step" 
    id="step-{i}" 
    style="height: {cellSize}px; width: {cellSize}px; {color ? `background-color: var(--${color}-house);` : ''}"
/>