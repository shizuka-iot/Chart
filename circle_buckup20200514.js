'use strict';

// グローバル変数
// offsetやclient座標は円の座標に関係しないのでプロパティにせず
// グローバル変数として扱うことにする。
// オフセットは複数のインスタンス（キャンバス）ごとに違う値を持つので
// グローバルでは駄目！！修正が必要だがどうすれば？
let off_x = 0; // イベントのたびに数値が変わる(代入する)のでlet
let off_y = 0; // イベントのたびに数値が変わる(代入する)のでlet
let cx = 0; // イベントのたびに数値が変わる(代入する)のでlet
let cy = 0; // イベントのたびに数値が変わる(代入する)のでlet
let px = 0;
let py = 0;

/*
function	mouseMove(e)
	{
		// クライアントはブラウザの左上を0,0としてそこからのマウスの座標を取得。
		// オフセットはターゲットエレメントの左上を0,0としてそこからのマウスの座標を取得。
		off_x = e.offsetX;
		off_y = e.offsetY;
		cx = e.clientX;
		cy = e.clientX;
	}

		 window.addEventListener('mousemove', mouseMove, false);
		 */

/* 円を描くメソッド */
class Circle
{
	constructor( canvas_id , sectorInfo, center_x, center_y, type )
	{

		// 各扇の情報を全て2次元配列で取得。
		this.sectorInfo = sectorInfo;

		// 配列を量の降順にソート
		this.sectorInfo.sort(function(a,b){
			return ( b[2] - a[2] );
		});

		this.center_x = center_x;
		this.center_y = center_y;

		this.type = type;

		/*****************************************
				キャンバスの初期化
		*****************************************/
		this.canvas = canvas_id;
		this.can = document.getElementById(canvas_id); 
		// this.can = document.querySelector('#can');でもオッケー

		// htmlタグの属性よりも後で記述したこちらの値で上書きされる。
		this.can.width = 800;
		this.can.height = 600;

		// 取得したキャンバスのコンテキストを取得。
		// 今後これを操作して２次元の描画を行う。
		this.con = this.can.getContext('2d');

		/* イベントリスナー */
		// イベントリスナーは一度呼び出すと常にイベントを監視しているので
		// ループの中に入れてはいけない。入れると処理が重くなる。
		// 第一引数はイベントの種類
		// 第二引数は実行する処理
		// 第三引数はイベントが伝播する順番が変わるそう
		// this.can.addEventListener('mousemove', this.mouseMove, false);
		// アロー関数は定義時のthisの値を拘束してしまう。
		// だから0に固定されてしまうので、定義を見直す必要がある？
		// this.can.addEventListener('mousemove', (e) => {this.mouseMove}, false);

		// addEventListenerの.以前はターゲットとなる要素。
		// windowとすれば全体に対してイベントが適用され、
		// canとすると取得したキャンバスエレメント上のみイベントが発生する。
		window.addEventListener('mousemove', this.mouseMove, false);
		// window.addEventListener('mousemove', mouseMove, false);

		this.sum = 0; //　各項目の量の合計を保持するプロパティ
		this.angles = []; // 各項目の持つ角度を配列で保持。
		this.startAngles = []; // 各扇の開始角
		this.finishAngles = []; // 各扇の終了角
		this.sfAngles = [[]]; // 各扇の開始ー終了角

		this.setQuantities();// this.sumに量の合計を格納している。
		this.setEachAngles();// 各扇が持つ角度を配列にセット。
		this.setStartFinishAngles();// this.startAngles・this.finishAnglesに開始角・終了角を格納。

		this.sqrt_xy = 0;// 中心座標とマウスの平方根
		this.angle = 0;// マウスと中心座標が形成する角度

		this.flag = [];// 扇にマウスオーバーで半径を増やすかどうか判定するフラグ。
		this.increase = [];// マウスオーバーで増える扇の半径の増加量。
		this.hitted = [];// マウスオーバーか否か。

		this.init_array();// 受け取った配列を初期化。

		this.ox = 0;
		this.oy = 0;

	}// コンストラクタ



	// マウスイベント。イベント情報はグローバル変数に代入。
	mouseMove(e)
	{
		// クライアントはブラウザの左上を0,0としてそこからのマウスの座標を取得。
		// オフセットはターゲットエレメントの左上を0,0としてそこからのマウスの座標を取得。
		off_x = e.offsetX;
		off_y = e.offsetY;
		cx = e.clientX;
		cy = e.clientX;
		px = e.pageX;
		py = e.pageY;
	}
	
	/****************************************************
	 											関数定義
	****************************************************/
	/* 更新メソッド。この中に色んな処理の更新をまとめて入れる */
	update()
	{
		this.getMouseAngle();
		this.increaseRadius();
	}
	/* 描画メソッド。この中に色んな描画処理をまとめて入れる。 */
	draw()
	{
		// this.con.clearRect(0, 0, this.can.width, this.can.height);
		this.drawDebug();
		this.drawCircleGraph();
	}

	static clear(canvas_id)
	{
		let can = document.getElementById(canvas_id); 
		let con = can.getContext('2d');
		con.clearRect(0, 0, can.width, can.height);
	}

	/* 更新と描画メソッドを入れる。 */
	mainLoop()
	{
		// requestAnimationFrame(this.mainLoop);
		// requestAnimationFrame( () => {this.mainLoop();});
		this.update();
		this.draw();
	}

	/* デバッグ用のテキストを表示。draw()メソッドに入れる。 */
	drawDebug()
	{
		// 事前準備
		this.con.globalAlpha = 1;
		this.con.font="16px 'ＭＳ　ゴシック'";// フォントを指定。
		this.con.fillStyle = "#000";// 色を指定
		// ここから実際に描画。
		// this.con.fillText("オフセット("+off_x+","+off_y+")", 20, 40);
		// this.con.fillText("クライアント("+cli_x+","+cli_y+")", 20, 80);
		this.con.fillText("角度:"+this.getMouseAngle(), this.center_x - RADIUS, this.center_y - RADIUS - 10);
		this.con.fillText("増加度:"+this.increase, this.center_x - RADIUS, this.center_y - RADIUS - 30);
		this.con.fillText("フラグ:"+this.flag, this.center_x - RADIUS, this.center_y - RADIUS - 50);
		this.con.fillText("hit:"+this.hitted, this.center_x - RADIUS, this.center_y - RADIUS - 70);
		this.con.fillText("sqrt_xy:"+this.sqrt_xy, this.center_x - RADIUS, this.center_y + RADIUS + 20);
		this.con.fillText("offset:("+off_x+","+off_y+")", this.center_x - RADIUS, this.center_y + RADIUS + 40);



		this.con.fillText("client:("+cx+","+cy+")", this.center_x - RADIUS, this.center_y + RADIUS + 80);
		this.con.fillText("pxxxx:("+px+","+py+")", this.center_x - RADIUS, this.center_y + RADIUS + 100);


		let Rect = this.can.getBoundingClientRect();
		this.con.fillText(
			"elem + center + scroll:("+this.cutNum(Rect.left+this.center_x+window.pageXOffset)+
			","+this.cutNum(Rect.top+this.center_y+window.pageYOffset)+")",
			this.center_x - RADIUS, this.center_y + RADIUS + 60);

		for( let i=0; i<this.sectorInfo.length; i++ )
		{
			this.con.fillText("Info:"+this.sectorInfo[i], this.center_x - RADIUS, this.center_y - RADIUS - i*20-100);
		}
	}

	/* 項目の各量を足して合計を求めるメソッド。this.sumプロパティに入れる */
	setQuantities()
	{
		this.sectorInfo.forEach( (sect, index) => {
			this.sum += sect[2];// 量を加算していく。
		});
		console.log(`量の合計:${this.sum}`);
	}

	/* 配列の初期化 */
	init_array()
	{
		for( let i=0; i<this.sectorInfo.length; i++)
		{
			this.flag.push(0);
			this.increase.push(0);
			this.hitted.push(0);
		}
	}


	// 扇の開始角・終了角を配列に格納するメソッド。
	setStartFinishAngles()
	{
		let angle_sum = 0;
		for( let i=0; i<this.angles.length; i++)
		{
			if( i === 0 )
			{
				this.startAngles.push(0)
				this.finishAngles.push(this.angles[i]);
			}
			else
			{
				// this.startAngles.push(angle_sum+1)
				this.startAngles.push(this.cutNum(angle_sum))
				this.finishAngles.push(this.cutNum(angle_sum+this.angles[i]));
			}
			angle_sum += this.angles[i];
		}
		console.log('開始角'+this.startAngles);
		console.log('終了角'+this.finishAngles);
		console.log(angle_sum);
	}


	// 各扇の角度を計算して配列に格納。
	setEachAngles()
	{
		let ex = 0;
		this.sectorInfo.forEach( (sect, index) => {
			// console.log('テスト: '+Math.round( sect[2]/this.sum * 1000));
			// console.log('テスト2: '+Math.round( sect[2]/this.sum * 1000)/10);
			// console.log('テスト3: '+Math.round( sect[2]/this.sum * 1000*3.6)/10);
			// console.log('テスト4: '+Math.round( sect[2]/this.sum * 1000)/10*3.6);
			this.angles.push( Math.round( sect[2]/this.sum * 1000 * 3.6)/10);
		});

		// 配列に格納した角度を全て足して360になるか一応確認。
		let sum = 0;
		this.angles.forEach( (sect, index) => {
			sum += sect;
		});
		console.log('角度の合計: '+sum);
		console.log(`各角度 :${this.angles}`);
	}


	// 少数第一位までで切り捨てるメソッド
	cutNum(number)
	{
		return Math.round(number * 100)/100;
	}



	/* 扇を一つだけ描画するメソッド。これをループで回して円グラグを作る */
	drawSector(start, finish, color, increase)
	{
		// 扇を描画
		this.con.beginPath();// パスで描画するということを宣言。
		this.con.arc(
			this.center_x, this.center_y, RADIUS+ increase,// x座標、y座標、半径、
			(start-90)*Math.PI/180,// 開始角
			(finish-90)*Math.PI/180, false)// 終了角
		this.con.lineTo(this.center_x, this.center_y);
		this.con.fillStyle = color;// 色を指定
		this.con.fill();

		// 扇の縁を白で描画。各扇に隙間が空いているように見える。
		this.con.beginPath();
		this.con.arc(
			this.center_x, this.center_y, RADIUS + increase,// x座標、y座標、半径、
			(start-90)*Math.PI/180,// 開始角
			(finish-90)*Math.PI/180, false)// 終了角
		this.con.lineTo(this.center_x, this.center_y);
		this.con.lineWidth = 2;
		this.con.closePath();
		this.con.strokeStyle = "#fff";
		this.con.stroke();
	}

	// ドーナツ型グラフを作成したい場合はこのメソッドで中心に白い円を描き塗りつぶす。
	drawCenterCircle()
	{
		this.con.globalAlpha = 1;
		this.con.beginPath();
		this.con.arc(
			this.center_x, this.center_y, RADIUS/2,// x座標、y座標、半径、
			(0)*Math.PI/180,// 開始角
			(360)*Math.PI/180, false)// 終了角
		this.con.fillStyle = "#fff";
		this.con.closePath();
		this.con.fill();
	}

	/* 円グラフを描画するメソッド。ループで各セクターを描画して円グラフを形成 */
	drawCircleGraph()
	{
		for( let i=0; i<this.sectorInfo.length; i++ )
		{
			// 半径よりも内側にある時、
			if( this.sqrt_xy < RADIUS )
			{
				// そのうち扇のどれかの中にマウスがある時。
				if( this.hit( this.startAngles[i], this.finishAngles[i]) )
				{
					this.con.globalAlpha = 1;
					this.hitted[i] = 1;
				}
				else
				{
					this.con.globalAlpha = 0.3;
					this.hitted[i] = 0;
				}
			}
			// 半径の外側にある時
			else 
			{
					this.con.globalAlpha = 1;
					this.hitted[i] = 0;
			}
			this.drawSector(this.startAngles[i], this.finishAngles[i], this.sectorInfo[i][0], this.increase[i]);
		}
		// ドーナツ型円グラフにしたい場合、下記をアンコメント
		switch( this.type)
		{
			case 0:
				break;
			case 1:
				this.drawCenterCircle();
				break;
			default:
				break;
		}
	}


	/* 各円グラグとマウスとの角度を求めるメソッド */
	getMouseAngle()
	{
		// まずマウスと中心座標の距離を計算する。
		let abs_x = 0;
		let abs_y = 0;
		abs_x = Math.abs(off_x - this.center_x);// マウスと中心座標のx座標を絶対値で取得
		abs_y = Math.abs(off_y - this.center_y);// マウスと中心座標のy座標を絶対値で取得
		// xとyと中心座標との平方根を求める
		this.sqrt_xy = Math.floor(Math.sqrt(abs_x*abs_x+abs_y*abs_y));

		// 各円グラブとマウスの角度を計算して求める。
		this.angle = Math.floor(Math.atan2( abs_y, abs_x ) * 180/Math.PI);

		// このままでは値がおかしいので自然な角度に修正。
		if( off_x > this.center_x && off_y < this.center_y) this.angle = 90 - this.angle;
		else if( off_x > this.center_x && off_y === this.center_y) this.angle = 90;
		else if( off_x > this.center_x && off_y > this.center_y) this.angle = 90 + this.angle;
		else if( off_x === this.center_x && off_y > this.center_y) this.angle = 180;
		else if( off_x < this.center_x && off_y > this.center_y) this.angle = 270 - this.angle;
		else if( off_x < this.center_x && off_y === this.center_y) this.angle = 270;
		else if( off_x < this.center_x && off_y < this.center_y) this.angle = 270 + this.angle;
		else { this.angle = 0;}
		return this.angle;
	}


	/* あたり判定 */
	// hit( start, finish )
	hit( start, finish )
	{
		// 半径より内側にマウスが合ったら、角度が扇のどれかの範囲に該当していたら。
		if( this.sqrt_xy < RADIUS && this.angle >= start && this.angle < finish )
		{
			return true;
		}
		return false;
	}

	/* マウスオーバーで跳ねるアニメーション */
	increaseRadius()
	{
		for( let i=0; i<this.sectorInfo.length; i++ )
		{
			if(this.hitted[i] && !this.flag[i] && this.increase[i]<10)
			{
				this.increase[i]++;
				this.increase[i]++;
				if(this.increase[i] > 9 ) this.flag[i] = 1;
			}
			else if( !this.hitted[i] )
			{
				this.increase[i] = 0;
				this.flag[i] = 0;
			}

			if( this.flag[i] && this.increase[i] > 5 )
			{
				this.increase[i]--;
				this.increase[i]--;
			}
		}
	}

}// Circleクラスのとじカッコ
