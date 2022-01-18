<script>
	import { onMount } from 'svelte';
	import GamePage from './GamePage.svelte';

	const queries = new URLSearchParams(window.location.search);
	let isGame = queries.has('game');

	function gamePageResponsiveHandler () {
		let wrapElement = document.getElementById('wrap');
        let wh = wrapElement.clientHeight;
        let ww = wrapElement.clientWidth;

		// For responsive css
		document.querySelector('.game-page')
			.classList[(ww < (wh * 2)) ? 'add' : 'remove']('r-game-page');
	}

	onMount(() => {
		gamePageResponsiveHandler();
		window.addEventListener('resize', gamePageResponsiveHandler);
	})
</script>

<div class="bg-cover"></div>

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