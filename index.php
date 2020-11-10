<?php
ini_set('display_errors', 1);
function h($s) {
	return htmlspecialchars($s, ENT_QUOTES, 'utf-8');
}

$values = [
	'円の中心座標',
	'円の半径',
	'円の要素',
	'円の要素の値',
	'中心座標とマウスとの距離',
	'中心座標とマウスが形成する角度',
	'各扇の開始角度、終了角度',
];

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
  <title>円グラフを再利用可能なクラスで作るぞ！</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body class="center">
<header class="center container">
	<h1 class="fs18 under-line">円グラフを再利用可能なクラスで作るぞ！</h1>
	<h2 class="fs16">
	円グラフを再利用可能なライブラリとして作成する。
	<br>
	引数に値を入れるだけでどこにでも円グラフを作成したい。
	</h2>

	<p class="fs14 bold no-margin">
	必要となる引数を考える。
	</p>
	<ul class="no-padding">
		<?php foreach( $values as $value ):?>
			<li><?php echo $value?></li>
		<?php endforeach;?>
	</ul>
</header>
<main class="center">
	<div class="container fs14 center">
		<p>
			まずはじめに、キャンバスを宣言する。幅と高さはピクセル単位で自由に指定できる。
		<br>
		キャンバスタグ内でwidthとheightを指定してもいいが、
		js内でcan.width = 800; can.height = 600;とやっても多分大丈夫。
		<p class="color-blue">
	<?=h('<canvas id="can" width="800" height="600"></canvas>')?>
		</p>
		<br>
		次にスクリプトタグでjsでプログラミングをしていく。<br>
		記述量が多いのでsrc属性を使って別ファイルを読み込むようにする。
		<br>
		jsに入ったらキャンバスのhtml内に記述したキャンバスのidを取得して変数に格納。定数でも良いかもしれない。<br>
		<br>
		<p class="color-blue">
		const can = document.getElementById('can');
		</p>

		<p>const can = document.querySelector('#can');としても同じだが、idを取得する際に#が必要になる。
		<br>
		<br>
		取得したキャンバスをいれた変数canに対してcontextを2dに指定して定数に格納。
		<br>
		今後このconを操作して描画を行っていく。canはキャンバスのサイズなど環境を指定するためのもの。
		</p>
		<p class="color-blue">
		const con = can.getContext('2d');
		</p>
		<br>
		<br>

		<h2>キャンバス１</h2>
		<canvas id="can" width="800" height="480"></canvas>
		<canvas id="can2" width="800" height="480"></canvas>
		<canvas id="can4" width="800" height="600"></canvas>
		<canvas id="can3" width="800" height="600"></canvas>
	</div>
</main>
<footer class="center upper-line container">
	<p class="no-margin bold">
	© 2020 しずか
	</p>
</footer>
<script>
	const arr = <?php echo $sectorInfo; ?>;
</script>
<script src="circle.js"></script>
<script src="main.js"></script>
</body>
</html>
