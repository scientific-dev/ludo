<script>
    export let color, gameHomeSize, i;
    export let top = 0, right = 0, left = 0, bottom = 0;
</script>

<div 
    class="triangle" 
    style="
        background-color: var(--{color}-player); 
        height: {gameHomeSize / 2}px;
        width: {gameHomeSize}px;
        margin-top: {top}px;
        margin-right: {right}px;
        margin-left: {left}px;
        margin-bottom: {bottom}px;
        --rotate: {i * 90}deg;
    "
/>

<style>
    .triangle {
        clip-path: polygon(0% 100%, 50% 0%, 100% 100%);
        position: absolute;
        -webkit-transform: rotate(var(--rotate));
        -moz-transform: rotate(var(--rotate));
        transform: rotate(var(--rotate));
    }
</style>