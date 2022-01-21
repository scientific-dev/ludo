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
		<h1 class="m-0">Ludo</h1>
		<p class="m-0">An awesome site to play ludo singleplayer for fun even with bots!</p>

		<a href="?game" class="cover-btn">Lets play!</a>
		<p class="credits m-0">Made by <a href="https://github.com/scientific-dev">scientific-dev</a></p>
	</div>
{/if}

<style>
	.bg-cover {
		width: 100%;
		height: 100%;
		position: fixed;
		z-index: -1;
		background: #22252c url(../scenary.jpg) no-repeat;
		background-size: cover;
		background-blend-mode: multiply;
	}

	.cover {
		font-family: "Titillium Web";
		padding: 100px;
		color: white;
	}

	.cover h1 {
		font-size: 80px;
		margin-left: -4px;
	}

	.cover p {
		font-size: 20px; 
	}

	.cover-btn {
		border-radius: 20px;
		padding: 10px 100px;
		text-decoration: none;
		color: white;
		border: 2px solid white;
		margin-top: 10px;
		display: inline-block;
		text-transform: uppercase;
	}

	.cover-btn:hover {
		color: black;
		background-color: white;
	}

	.credits {
		margin-top: 10px;
	}

	.credits a {
		color: white;
	}

	@media (max-width: 750px) {
		.cover {
			padding: 50px;
		}

		.cover p {
			font-size: 15px;
		}
	
		.cover h1 {
			line-height: 1.25;
			margin-top: 30px;
		}

		.cover-btn {
			padding: 5px 50px;
			border: 1px solid black;
		}
	}
</style>