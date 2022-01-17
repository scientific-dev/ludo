<script>
	import Board from './Board.svelte';
	import InfoTab from './InfoTab.svelte';

	const queries = new URLSearchParams(window.location.search);

	let isGame = queries.has('game');
</script>

{#if isGame}
	<div class="game-page">
		<Board/>
		<InfoTab/>
	</div>
{:else}	
	<div class="cover">
		<h1>Ludo</h1>
		<p>A simple site to play Ludo (Pachisi Variant)!</p>

		<a href="?game" class="cover-btn">Lets play!</a>
		<p class="credits">Made by <a href="https://github.com/scientific-dev">scientific-dev</a></p>
	</div>
{/if}