<script>
    export let i;
    export let color = null;
</script>

<div 
    class="step" 
    id="step-{i}" 
    style={color ? `background-color: var(--${color}-player);` : ''}
/>