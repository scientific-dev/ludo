<script>
    import { LudoPlayer } from "../../engine";

    export let color, player = LudoPlayer.NULL_PLAYER;
    $: if (!player) player = LudoPlayer.NULL_PLAYER;
</script>

<div class="player-tab" style="background-color: var(--{color}-house);">
    <h3>{player.name.slice(0, 10)}</h3>

    <p class="inline-block strong">Coins Outside: </p>
    <p class="inline-block">{player.coinsOutside}</p><br/>

    <p class="inline-block strong">Coins At Start: </p>
    <p class="inline-block">{player.coinsAtStart}</p><br/>

    <p class="inline-block strong">Coins Reached: </p>
    <p class="inline-block">{player.coinsReached}</p><br/>
</div>