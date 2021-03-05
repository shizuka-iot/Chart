<?php
ini_set('display_errors', 1);
function h($s) {
	return htmlspecialchars($s, ENT_QUOTES, 'utf-8');
}

define('SITE_TITLE', '円グラフ描画ライブラリ');

$sectInfo = [
	["blue", "php", 299],
	["green", "pdo", 100],
	["red", "mysql", 49],
];

$sectorInfo = json_encode($sectInfo);

?>

<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title><?= h(SITE_TITLE)?></title>
  <link rel="stylesheet" href="styles.css">
</head>

<body class="center">
	<header class="center container">
		<h1>サンプルページ</h1>
	</header>

	<main class="center">
		<div class="container fs14 center">
			<h2>キャンバス1</h2>
			<canvas id="can" width="800" height="480"></canvas>
			<h2>キャンバス2</h2>
			<canvas id="can2" width="800" height="480"></canvas>
			<h2>キャンバス3</h2>
			<canvas id="can4" width="800" height="600"></canvas>
			<h2>キャンバス4</h2>
			<canvas id="can3" width="800" height="600"></canvas>
		</div>
	</main>
	<footer class="center upper-line container">
		<p class="no-margin bold">
		© 2020 SHIZUKA-IOT
		</p>
	</footer>
	<script>
		const arr = <?php echo $sectorInfo; ?>;
	</script>
	<script src="Circle.js"></script>
	<script src="main.js"></script>
</body>
</html>
