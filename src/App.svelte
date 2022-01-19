<script>
	import GamePage from './GamePage.svelte';

	const queries = new URLSearchParams(window.location.search);
	let isGame = queries.has('game');
</script>

<div class="bg-cover"/>

{#if isGame}
	<GamePage/>
{:else}	
	<div class="cover">
		<h1>Ludo</h1>
		<p>A simple site to play Ludo (Pachisi Variant)!</p>

		<a href="?game" class="cover-btn">Lets play!</a>
		<p class="credits">Made by <a href="https://github.com/scientific-dev">scientific-dev</a></p>
	</div>
{/if}