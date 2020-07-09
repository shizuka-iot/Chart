'use strict';

// グローバル変数
// offsetやclient座標は円の座標に関係しないのでプロパティにせず
// グローバル変数として扱うことにする。
// オフセットは複数のインスタンス（キャンバス）ごとに違う値を持つので
// グローバルでは駄目！！修正が必要だがどうすれば？
let px = 0; // イベントのたびに数値が変わる(代入する)のでlet
let py = 0; // イベントのたびに数値が変わる(代入する)のでlet
let cx = 0; // イベントのたびに数値が変わる(代入する)のでlet
let cy = 0; // イベントのたびに数値が変わる(代入する)のでlet


/* 円を描くメソッド */
class Circle
{
	constructor( canvas_id , sectorInfo, radius, center_x, center_y, type, max )
	{

		// 各扇の情報を全て2次元配列で取得。
		this.sectorInfo = sectorInfo;

		// 配列を量の降順にソート
		if(type !== 2)
		{
			this.sectorInfo.sort(function(a,b){
				return ( b[2] - a[2] );
			});
		}

		this.centerX = center_x;
		this.centerY = center_y;
		this.radius = radius;

		this.type = type;
		this.max = max;

		/*****************************************
				キャンバスの初期化
		*****************************************/
		this.canvas = canvas_id;
		this.can = document.getElementById(canvas_id); 
		// this.can = document.querySelector('#can');でもオッケー

		// htmlタグの属性よりも後で記述したこちらの値で上書きされる。
		// this.can.width = 800;
		// this.can.height = 600;

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

		/* 角度に関するプロパティ */
		this.sum = 0; //　各項目の量の合計を保持するプロパティ
		this.angles = []; // 各項目の持つ角度を配列で保持。
		this.startAngles = []; // 各扇の開始角
		this.finishAngles = []; // 各扇の終了角
		this.halfDegrees = [];

		this.setQuantities();// this.sumに量の合計を格納している。
		this.setEachAngles();// 各扇が持つ角度を配列にセット。
		this.setStartFinishAngles();// this.startAngles・this.finishAnglesに開始角・終了角を格納。
		this.setHalfDegrees();

		this.angle = 0;// マウスと中心座標が形成する角度
		this.degree = 0;// 修正前の角度

		this.flag = [];// 扇にマウスオーバーで半径を増やすかどうか判定するフラグ。
		this.increase = [];// マウスオーバーで増える扇の半径の増加量。
		this.hitted = [];// マウスオーバーか否か。

		this.init_array();// 受け取った配列を初期化。

		// this.ox = 0;
		// this.oy = 0;
		this.x = 0;
		this.y = 0;

		/* 座標に使用するプロパティ */
		this.sqrt_xy = 0;// 中心座標とマウスの平方根
		this.rect = this.can.getBoundingClientRect();
		this.absoluteCenterX = this.cutNum(this.rect.left+this.centerX+window.pageXOffset);
		this.absoluteCenterY = this.cutNum(this.rect.top+this.centerY+window.pageYOffset);
		// console.log(this.absoluteCenterX);
		// console.log(this.absoluteCenterY);

		/* レーダーチャート */
		this.ratio = [];
		this.scaleArray = [];
		this.raderCordinates = [];
		this.setRaderCordinates();
		this.drawChartScale();
		this.setchartRatio()


		// this.drawRaderChart();

	}// コンストラクタ




	/****************************************************
	 										イベントリスナー
	****************************************************/
	// マウスイベント。イベント情報はグローバル変数に代入。
	mouseMove(e)
	{
		// クライアントはブラウザの左上を0,0としてそこからのマウスの座標を取得。
		// オフセットはターゲットエレメントの左上を0,0としてそこからのマウスの座標を取得。
		/*
		px = e.offsetX;
		py = e.offsetY;
		cx = e.clientX;
		cy = e.clientX;
		*/
		px = e.pageX;
		py = e.pageY;
	}
	
	/****************************************************
	 											更新・描画
	****************************************************/
	/* 更新メソッド。この中に色んな処理の更新をまとめて入れる */
	update()
	{
		/* 中心座標の更新 */
		this.rect = this.can.getBoundingClientRect();
		this.absoluteCenterX = this.cutNum(this.rect.left+this.centerX+window.pageXOffset);
		this.absoluteCenterY = this.cutNum(this.rect.top+this.centerY+window.pageYOffset);

		/* マウスの座標の更新 */
		this.getMouseAngle();

		/* 増加量の更新 */
		this.increaseRadius();
	}
	/* 描画メソッド。この中に色んな描画処理をまとめて入れる。 */
	draw()
	{
		// これはmain.jsのupdate draw mainloopをつくりdrawに静的メソッドを呼び出してやる。
		// this.con.clearRect(0, 0, this.can.width, this.can.height);

		// デバッグが必要なら下記をアンコメント
		// this.drawDebug();
		// this.drawCircleGraph();
		// this.drawText();
		// ドーナツ型円グラフにしたい場合、下記をアンコメント
		switch( this.type )
		{
			case 0:
				this.drawCircleGraph();
				this.drawText();
				break;
			case 1:
				this.drawCircleGraph();
				this.drawCenterCircle();
				this.drawText();
				break;
			case 2:
				this.drawRaderChart();
				this.drawChartScale();
				this.drawRatio();
				this.drawChartItem();
				this.drawScaleNumber();
				break;
			default:
				this.drawCircleGraph();
				this.drawText();
				break;
		}
	}
	/* 更新と描画メソッドを入れる。 */
	mainLoop()
	{
		// requestAnimationFrame(this.mainLoop);
		// requestAnimationFrame( () => {this.mainLoop();});
		this.update();
		this.draw();
	}




	/****************************************************
	 											画面クリア
	****************************************************/
	static clear(canvas_id)
	{
		let can = document.getElementById(canvas_id); 
		let con = can.getContext('2d');
		con.clearRect(0, 0, can.width, can.height);
	}




	/****************************************************
	 											計算関数定義
	****************************************************/
	// 少数第一位までで切り捨てるメソッド
	cutNum(number)
	{
		return Math.round(number * 10)/10;
	}

	// 角度を入力してラジアンを得る。
	getRadian(deg)
	{
		return deg * (Math.PI / 180 );
	}






	/* デバッグ用のテキストを表示。draw()メソッドに入れる。 */
	drawDebug()
	{
		// 事前準備
		this.con.globalAlpha = 1;
		this.con.font="16px 'ＭＳ　ゴシック'";// フォントを指定。
		this.con.fillStyle = "#000";// 色を指定
		// ここから実際に描画。
		this.con.fillText("角度:"+this.getMouseAngle(), this.centerX - this.radius, this.centerY - this.radius - 10);
		this.con.fillText("増加度:"+this.increase, this.centerX - this.radius, this.centerY - this.radius - 30);
		this.con.fillText("フラグ:"+this.flag, this.centerX - this.radius, this.centerY - this.radius - 50);
		this.con.fillText("hit:"+this.hitted, this.centerX - this.radius, this.centerY - this.radius - 70);
		this.con.fillText("sqrt_xy:"+this.sqrt_xy, this.centerX - this.radius, this.centerY + this.radius + 20);
		this.con.fillText("offset:("+px+","+py+")", this.centerX - this.radius, this.centerY + this.radius + 40);

		this.con.fillText("client:("+cx+","+cy+")", this.centerX - this.radius, this.centerY + this.radius + 80);
		this.con.fillText("pxxxx:("+px+","+py+")", this.centerX - this.radius, this.centerY + this.radius + 100);

		this.con.fillText(
			"elem + center + scroll:("+this.cutNum(this.rect.left+this.centerX+window.pageXOffset)+
			","+this.cutNum(this.rect.top+this.centerY+window.pageYOffset)+")",
			this.centerX - this.radius, this.centerY + this.radius + 60);

		for( let i=0; i<this.sectorInfo.length; i++ )
		{
			this.con.fillText("Info:"+this.sectorInfo[i], this.centerX - this.radius, this.centerY - this.radius - i*20-100);
		}
	}





	/****************************************************
	 									円グラグ計算メソッド
	****************************************************/
	/* 項目の各量を足して合計を求めるメソッド。this.sumプロパティに入れる */
	setQuantities()
	{
		this.sectorInfo.forEach( (sect, index) => {
			this.sum += sect[2];// 量を加算していく。
		});
		// console.log(`量の合計:${this.sum}`);
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
		// console.log('開始角'+this.startAngles);
		// console.log('終了角'+this.finishAngles);
		// // console.log(angle_sum);
	}


	// 各扇の角度を計算して配列に格納。
	setEachAngles()
	{
		let ex = 0;
		this.sectorInfo.forEach( (sect, index) => {
			// // console.log('テスト: '+Math.round( sect[2]/this.sum * 1000));
			// // console.log('テスト2: '+Math.round( sect[2]/this.sum * 1000)/10);
			// // console.log('テスト3: '+Math.round( sect[2]/this.sum * 1000*3.6)/10);
			// // console.log('テスト4: '+Math.round( sect[2]/this.sum * 1000)/10*3.6);
			this.angles.push( Math.round( sect[2]/this.sum * 1000 * 3.6)/10);
		});

		// 配列に格納した角度を全て足して360になるか一応確認。
		let sum = 0;
		this.angles.forEach( (sect, index) => {
			sum += sect;
		});
		// console.log('角度の合計: '+sum);
		// console.log(`各角度 :${this.angles}`);
	}




	/****************************************************
	 									円グラグ描画メソッド
	****************************************************/
	/* 扇を一つだけ描画するメソッド。これをループで回して円グラグを作る */
	drawSector(start, finish, color, increase)
	{
		// 扇を描画
		this.con.beginPath();// パスで描画するということを宣言。
		this.con.arc(
			this.centerX, this.centerY, this.radius+ increase,// x座標、y座標、半径、
			(start-90)*Math.PI/180,// 開始角
			(finish-90)*Math.PI/180, false)// 終了角
		this.con.lineTo(this.centerX, this.centerY);
		this.con.fillStyle = color;// 色を指定
		this.con.fill();

		// 扇の縁を白で描画。各扇に隙間が空いているように見える。
		this.con.beginPath();
		this.con.arc(
			this.centerX, this.centerY, this.radius + increase,// x座標、y座標、半径、
			(start-90)*Math.PI/180,// 開始角
			(finish-90)*Math.PI/180, false)// 終了角
		this.con.lineTo(this.centerX, this.centerY);
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
			this.centerX, this.centerY, this.radius/2,// x座標、y座標、半径、
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
			if( this.sqrt_xy < this.radius )
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
		/*
		// ドーナツ型円グラフにしたい場合、下記をアンコメント
		switch( this.type)
		{
			case 0:
				break;
			case 1:
				// this.drawCenterCircle();
			case 2:
				this.drawRaderChart();
				break;
			default:
				break;
		}
		*/
	}

	getHalfText(text)
	{
		let halfTextSize = 0;
		halfTextSize = this.con.measureText(text);
		// // console.log(halfTextSize);
		return halfTextSize.width/2;
	}


	/* 扇の中に表示するパーセンテージの位置を計算 */
	setHalfDegrees()
	{
		let deg = 0;// 角度
		let rad = 0;// ラジアン
		let sin = 0;// サイン
		let cos = 0;// コサイン
		let halfTextSize = 0;// テキストサイズのオブジェクトを格納する
		// let base = 180;
		
		/* 各項目のパーセンテージを個別の取り出したいのでループさせる */
		for( let i = 0; i<this.sectorInfo.length; i++)
		{
			this.con.font = "12px Arial, meiryo";

			/* measureTextは文字サイズ情報をオブジェクトで返す関数。
			 * 使用する前にcontext.fontでフォントを指定する必要がある。
			 * 文字の幅と%を足した幅を変数に格納 */
			halfTextSize = this.con.measureText(this.cutNum(this.sectorInfo[i][2]/this.sum*100)+"%");
			// // console.log(halfTextSize);
			// deg = this.cutNum((this.finishAngles[i] - this.startAngles[i])/2);// 単純に三角形の角度
			/* 各扇の中間の角度を0-360度まで計算 */
			deg = this.cutNum(this.startAngles[i]+(this.finishAngles[i] - this.startAngles[i])/2);// 円の角度
			// deg = this.cutNum(this.startAngles[i]+base+(this.finishAngles[i]+base - this.startAngles[i]+base)/2);
			sin = Math.sin(this.getRadian(deg));
			cos = Math.cos(this.getRadian(deg));
			this.x = this.cutNum(this.radius * sin);
			this.y = this.cutNum(this.radius * cos);
			// if( deg === 0 ){ }
			if( deg > 0 && deg < 90 ){ if(this.x<0)this.x=-this.x;if(this.y>0)this.y=-this.y;}
			else if( deg > 90 && deg < 180 ){ if(this.x<0)this.x=-this.x;if(this.y<0)this.y=-this.y;}
			// else if( deg === 180 ){ }
			else if( deg > 180 && deg < 270 ){if(this.x>0)this.x=-this.x;if(this.y<0)this.y=-this.y;}
			// else if( deg === 270 ){}
			else if( deg > 270 && deg < 360 ){if(this.x>0)this.x=-this.x;if(this.y>0)this.y=-this.y;}
			// else if( deg === 360 ){deg = 360;}
			// // console.log("sin"+deg+":"+sin);
			// // console.log("cos"+deg+":"+cos);
			// // console.log("x:y("+this.x+ ":"+this.y+")");
			
			/* パーセンテージをどこに配置するか下で調整。
			 * 中心座標から円周上の点までの距離 */
			this.x *= 0.8;
			this.y *= 0.8;

			/* 中心座標+上で求めた半分の角度の円周上の座標-文字サイズ/2 */
			// this.x = this.cutNum(this.centerX+this.x-halfTextSize.width/2);
			this.x = this.cutNum(this.centerX+this.x-halfTextSize.width/2);
			this.y = this.cutNum(this.centerY+this.y);
			// // console.log("x/2:y/2("+(this.x)+ ":"+(this.y)+")");

			/* この操作非常に重要。
			 * 一旦x,yの座標を入れた配列を作り、
			 * それを別の配列にプッシュしていけば二次元配列が出来る！ */
			let array = [this.x, this.y];
			this.halfDegrees.push(array);
		}
		// // console.log(this.halfDegrees);
	}




	/****************************************************
	 								レーダーチャート用
	****************************************************/
	// レーダーチャート用の座標をセット
	setRaderCordinates()
	{
		// let base = 360/this.sectorInfo.length;
		const base = (2*Math.PI)/this.sectorInfo.length;
		// // console.log("base: "+base);
		let array = [];
		let x = 0;
		let y = 0;
		let ix = 0;
		let iy = 0;
		for(let i=0; i<this.sectorInfo.length; i++)
		{
			// レーダーチャート用の各項目のx座標,y座標を配列に格納していく
			x = Math.round(this.cutNum((Math.sin(i*base)*this.radius)));
			y = Math.round(this.cutNum((Math.cos(i*base)*this.radius)));

			// チャートの項目の座標
			ix = Math.round(this.cutNum((Math.sin(i*base)*(this.radius*1.16))));
			iy = Math.round(this.cutNum((Math.cos(i*base)*(this.radius*1.16))));
			// // console.log("x: "+x+"  y: "+y);
			// // console.log(y);
			array = [x, y, ix, iy];
			this.raderCordinates.push(array);
		}
		// console.log("chart:");
		// console.log(this.raderCordinates);
	}

	drawRaderChart()
	{
		this.con.globalAlpha = 1;
		// this.con.strokeStyle = this.sectorInfo[i][0];// 色を指定
		this.con.fillStyle = this.sectorInfo[0][0];// 色を指定
		this.con.lineWidth = 1;
		this.con.beginPath();
		this.con.moveTo( this.raderCordinates[0][0]+this.centerX, -this.raderCordinates[0][1]+this.centerY);
		for(let i=1; i<this.sectorInfo.length; i++)
		{
			this.con.lineTo( this.raderCordinates[i][0]+this.centerX, -this.raderCordinates[i][1]+this.centerY);
		}
			this.con.closePath();
			this.con.fill();

		for(let i=0; i<this.sectorInfo.length; i++)
		{
			this.con.fillStyle = "#fff";// 色を指定
			this.con.lineWidth = 1;
			this.con.beginPath();
			this.con.moveTo(this.centerX, this.centerY);
			this.con.lineTo(this.raderCordinates[i][0]+this.centerX, -this.raderCordinates[i][1]+this.centerY);
			this.con.stroke();
		}
	}

	setchartRatio()
	{
		let ratio = 0;
		
		for(let i=0; i<this.sectorInfo.length; i++)
		{
			ratio = this.cutNum(this.sectorInfo[i][2]/this.max*this.radius)
			this.ratio.push(ratio);
		}
		console.log(this.ratio);
	}

	drawRatio()
	{
		this.con.globalAlpha = 0.5;
		this.con.strokeStyle = "#fff";// 色を指定
		this.con.lineWidth = 1;
		this.con.beginPath();
		this.con.moveTo( this.scaleArray[0][0]*this.ratio[0]+this.centerX, -this.scaleArray[0][1]*this.ratio[0]+this.centerY);
		for(let i=1; i<this.sectorInfo.length; i++)
		{
			this.con.lineTo( this.scaleArray[i][0]*this.ratio[i]+this.centerX, -this.scaleArray[i][1]*this.ratio[i]+this.centerY);
		}
			this.con.closePath();
			this.con.fill();
	}
	drawChartItem()
	{
		this.con.font = "bold 14px Arial, meiryo";
		this.con.fillStyle = "#000";// 色を指定
		for(let i=0; i<this.sectorInfo.length; i++)
		{
			this.con.fillText(
				this.sectorInfo[i][1],
				this.raderCordinates[i][2]+this.centerX-this.getHalfText(this.sectorInfo[i][1]),
				-this.raderCordinates[i][3]+this.centerY);
		}
	}

	/* レーダーチャートのメモリを取得 */
	drawChartScale()
	{
		// 角度を等分したものを基準とする。
		const base = (2*Math.PI)/this.sectorInfo.length;
		// 半径を等分したものをメモリの基準とする。
		const baseRadius = this.radius/5;
		let x = 0;// 配列に入れるx座標。
		let y = 0;// 配列に入れるy座標。
		let array = [];
		for( let i=0; i<this.sectorInfo.length; i++)
		{
			// x,yはround等で丸めてはいけない。
			x = Math.sin(i*base);
			y = Math.cos(i*base);
			array = [x, y];
			this.scaleArray.push(array);
		}
		// console.log(this.scaleArray);

		this.con.fillStyle = "#000";// 色を指定
		this.con.lineWidth = 1;
		this.con.beginPath();
		for(let j=0; j<5; j++)
		{
			this.con.moveTo( this.scaleArray[0][0]*j*baseRadius+this.centerX, -this.scaleArray[0][1]*j*baseRadius+this.centerY);
			for( let i=1; i<this.sectorInfo.length; i++)
			{
				this.con.lineTo( this.cutNum(this.scaleArray[i][0]*j*baseRadius+this.centerX),
				-this.cutNum(this.scaleArray[i][1]*j*baseRadius)+this.centerY);
			}
			this.con.closePath();
			this.con.stroke();
		}
	}

	drawScaleNumber()
	{
		const base = this.radius/5
		let scale = this.max/5
		for(let i=1; i<=5; i++)
		{
			this.con.globalAlpha = 1;
			this.con.lineWidth = 1;
			this.con.font="14px 'ＭＳ　ゴシック'";// フォントを指定。
			this.con.fillStyle = "#000";// 色を指定
			this.con.fillText(scale*i, this.centerX-20, -i*base+this.centerY);
			/*
			this.con.strokeStyle = "#fff";// 色を指定
			this.con.strokeText(scale*i, this.centerX-20, -i*base+this.centerY);
			*/
		}
	}





	// 項目などの情報を描画
	drawText()
	{
		this.con.globalAlpha = 1;
		this.con.font="12px 'ＭＳ　ゴシック'";// フォントを指定。
		this.con.fillStyle = "#000";// 色を指定
		// this.con.fillText(this.degree, this.centerX + 100, this.centerY + 100);
		for( let i=0; i<this.sectorInfo.length; i++ )
		{
			this.con.fillStyle = "#000";// 色を指定
			this.con.fillText(
			this.sectorInfo[i][1]+":"+this.cutNum((this.sectorInfo[i][2]/this.sum)*100),
			this.centerX - this.radius/2, this.centerY + this.radius + i*20+50);
			this.con.fillStyle = "#fff";// 色を指定
			this.con.fillText(this.cutNum(this.sectorInfo[i][2]/this.sum*100)+"%", this.halfDegrees[i][0], this.halfDegrees[i][1]);
		}
		for( let i=0; i<this.sectorInfo.length; i++ )
		{
			this.con.fillStyle = "#000";// 色を指定
			this.con.fillStyle = this.sectorInfo[i][0];// 色を指定
			this.con.fillRect(this.centerX - this.radius/2 - 20, this.centerY + this.radius + i*20+40, 14, 14);
		}
	}


	/* 各円グラグとマウスとの角度を求めるメソッド */
	getMouseAngle()
	{
		// まずマウスと中心座標の距離を計算する。
		let abs_x = 0;
		let abs_y = 0;
		// abs_x = Math.abs(px - this.absoluteCenterX);// マウスと中心座標のx座標を絶対値で取得
		// abs_y = Math.abs(py - this.absoluteCenterY);// マウスと中心座標のy座標を絶対値で取得
		abs_x = Math.abs(px - this.absoluteCenterX);// マウスと中心座標のx座標を絶対値で取得
		abs_y = Math.abs(py - this.absoluteCenterY);// マウスと中心座標のy座標を絶対値で取得
		// xとyと中心座標との平方根を求める
		this.sqrt_xy = Math.floor(Math.sqrt(abs_x*abs_x+abs_y*abs_y));

		// 各円グラブとマウスの角度を計算して求める。
		this.angle = Math.floor(Math.atan2( abs_y, abs_x ) * 180/Math.PI);
		this.degree = this.angle;

		// このままでは値がおかしいので自然な角度に修正。
		if( px > this.absoluteCenterX && py < this.absoluteCenterY) this.angle = 90 - this.angle;
		else if( px > this.absoluteCenterX && py === this.absoluteCenterY) this.angle = 90;
		else if( px > this.absoluteCenterX && py > this.absoluteCenterY) this.angle = 90 + this.angle;
		else if( px === this.absoluteCenterX && py > this.absoluteCenterY) this.angle = 180;
		else if( px < this.absoluteCenterX && py > this.absoluteCenterY) this.angle = 270 - this.angle;
		else if( px < this.absoluteCenterX && py === this.absoluteCenterY) this.angle = 270;
		else if( px < this.absoluteCenterX && py < this.absoluteCenterY) this.angle = 270 + this.angle;
		else { this.angle = 0;}
		return this.angle;
	}


	/* あたり判定 */
	// hit( start, finish )
	hit( start, finish )
	{
		// 半径より内側にマウスが合ったら、角度が扇のどれかの範囲に該当していたら。
		if( this.sqrt_xy < this.radius && this.angle >= start && this.angle < finish )
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
			// this.hittedはそれぞれの扇がヒットしているか真偽値で保存しておく配列。
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
