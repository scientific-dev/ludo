<script>
    import { engine } from "../../engine";

    export let color;
    let player = engine.players[color];

    // To trigger state update...
    engine.on(`${color}Update`, () => player = engine.players[color]);
</script>

{#if player.isNull}
    <!-- Just keep this empty... -->
{:else}
    <div class="player-tab" style="background-color: var(--{color}-player);">
        <h3>{player.name.slice(0, 10)}</h3>

        <p class="inline-block strong">Coins Outside: </p>
        <p class="inline-block">{player.coinsOutside}</p><br/>

        <p class="inline-block strong">Coins At Start: </p>
        <p class="inline-block">{player.coinsAtStart}</p><br/>

        <p class="inline-block strong">Coins Reached: </p>
        <p class="inline-block">{player.coinsReached}</p><br/>
    </div>
{/if}