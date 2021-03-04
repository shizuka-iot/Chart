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
		<h1 class="fs18 under-line"><?= h(SITE_TITLE)?></h1>

		<h2>最初にグラフ描画のデータを二次元配列で用意します</h2>

		<p>具体的には下記のようなものを用意してください
		<br>
			0番目の要素に扇（セクター）の色<br>
			1番目の要素に項目名<br>
			2番目の要素に量（パーセンテージでななく量)を指定してください<br>
		</p>

		<p>
			$sectInfo = [<br>
				["blue", "php", 299],<br>
				["green", "pdo", 100],<br>
				["red", "mysql", 49],<br>
			];<br>
		</p>

		<h2>Circle.jsを読み込みます</h2>
		<h2>新しくjsファイルを用意するかスクリプトタグでjsを記述していきます</h2>
	</header>

	<main class="center">
		<div class="container fs14 center">
			<h2>キャンバス１</h2>
			<canvas id="can" width="800" height="480"></canvas>
			<canvas id="can2" width="800" height="480"></canvas>
			<canvas id="can4" width="800" height="600"></canvas>
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
	<script src="circle.js"></script>
	<script src="main.js"></script>
</body>
</html>
