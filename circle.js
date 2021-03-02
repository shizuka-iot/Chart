'use strict';

// グローバル変数
// offsetやclient座標は円の座標に関係しないのでプロパティにせず
// グローバル変数として扱うことにする。
// オフセットは複数のインスタンス（キャンバス）ごとに違う値を持つので
let px = 0; // e.pageX
let py = 0; // e.pageY
let ox = 0; // e.offsetX
let oy = 0; // e.offsetY


/*
 * グラフ生成クラス
 */
class Circle
{
	/*
	 * コンストラクタ
	 *
	 * @param string canvas_id キャンバスIDを指定
	 * @param array sectorInfo 表示するデータを配列で受け取る
	 * @param int radius 円グラスの半径を指定
	 * @param int center_x 中心X座標
	 * @param int center_y 中心Y座標
	 * @param int type 表示するグラスのタイプを指定
	 * @param int max レーダーチャート用。基準となる最大値。円グラフには影響しない
	 */
	constructor( canvas_id, sectorInfo, radius, center_x, center_y, type, max = 0 )
	{
		// キャンバスの初期化
		this.initCanvas(canvas_id);

		// コンストラクタで受け取った各扇の情報をプロパティに格納
		this.sectorInfo = sectorInfo;
		this.centerX = center_x;
		this.centerY = center_y;
		this.radius = radius;
		this.type = type;
		this.max = max;

		// 配列を量の降順にソート
		this.sortSectorInfo(this.type);

		// windowのマウスムーブを監視
		window.addEventListener('mousemove', this.mouseMove, false);

		// プロパティ等を初期化
		this.initProperties();
	}// コンストラクタ


	/*
	 * 配列を量が多い順に並び替え
	 * タイプが2（レーダーチャート）の場合は何もしない
	 */
	sortSectorInfo(type)
	{
		if(type !== 2) {
			this.sectorInfo.sort(function(a,b) {
				return (b[2] - a[2]);
			});
		}
	}


	/*
	 * キャンバス初期化。コンテキストの取得。
	 *
	 * @param string canvas_id
	 */
	initCanvas(canvas_id)
	{
		this.can = document.getElementById(canvas_id); 
		this.con = this.can.getContext('2d');

		// ブラウザがキャンバスに対応しているかチェックして未対応ならリターン。
		if( typeof this.can.getContext === 'undefined')
		{
			return;
		}
	}

	initProperties()
	{
		/* 角度に関するプロパティ */
		this.sum = 0; //　各項目の量の合計を保持するプロパティ
		this.angles = []; // 各項目の持つ角度を配列で保持。
		this.startAngles = []; // 各扇の開始角
		this.finishAngles = []; // 各扇の終了角
		this.halfDegrees = [];
		/* 扇の中心座標をいれる配列 */
		this.eachSectorCenters = [];

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

		this.halfDegreeX = 0;
		this.halfDegreeY = 0;

		/* 座標に使用するプロパティ */
		this.sqrt_xy = 0;// 中心座標とマウスの平方根
		this.rect = this.can.getBoundingClientRect();
		this.absoluteCenterX = this.cutNum(this.rect.left+this.centerX+window.pageXOffset);
		this.absoluteCenterY = this.cutNum(this.rect.top+this.centerY+window.pageYOffset);

		/* レーダーチャート */
		this.ratio = [];
		this.scaleArray = [];
		this.raderCordinates = [];
		this.setRaderCordinates();
		this.drawChartScale();
		this.setchartRatio()

		this.edge_flag = 1;// 扇の縁を描画するか否かのフラグ。基本的に描画するフラグを建てておく
		this.checkSectorValueForEdge();// 項目が一つしかなく他の項目の値が0（100％)かどうか検証
	}




	/*
	 * イベントリスナー
	 * グラフとの当たり判定をするためにマウスを監視
	 *
	 */
	mouseMove(e)
	{
		// クライアントはブラウザの左上を0,0としてそこからのマウスの座標を取得。
		// オフセットはターゲットエレメントの左上を0,0としてそこからのマウスの座標を取得。
		px = e.pageX;
		py = e.pageY;
		ox = e.offsetX;
		oy = e.offsetY;
	}
	


	/*
	 * 更新メソッド。この中に色んな処理の更新をまとめて入れる 
	 * */
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


	/*
	 * 描画メソッド。この中に色んな描画処理をまとめて入れる。 
	 */
	draw()
	{
		// これはmain.jsのupdate draw mainloopをつくりdrawに静的メソッドを呼び出してやる。
		// this.con.clearRect(0, 0, this.can.width, this.can.height);

		// デバッグが必要なら下記をアンコメント
		// this.drawDebug();
		// this.drawCircleGraph();
		// this.drawText();


		// グラフのタイプで場合分け
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
		// this.drawMouseText();
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
	 * 画面クリア
	****************************************************/
	static clear(canvas_id)
	{
		let can = document.getElementById(canvas_id); 
		let con = can.getContext('2d');
		con.clearRect(0, 0, can.width, can.height);
	}




	/****************************************************
	 * 計算関数定義
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
		this.con.fillText("pageX,Y:("+px+","+py+")", this.centerX - this.radius, this.centerY + this.radius + 40);

		// this.con.fillText("client:("+cx+","+cy+")", this.centerX - this.radius, this.centerY + this.radius + 80);
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
	 * 円グラグ計算メソッド
	 ****************************************************/
	/* 項目の各量を足して合計を求めるメソッド。this.sumプロパティに入れる */
	setQuantities()
	{
		this.sectorInfo.forEach( (sect, index) => {
			this.sum += sect[2];// 量を加算していく。
		});
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
	}


	// 各扇の角度を計算して配列に格納。
	setEachAngles()
	{
		let ex = 0;
		this.sectorInfo.forEach( (sect, index) => {
			this.angles.push( Math.round( sect[2]/this.sum * 1000 * 3.6)/10);
		});

		// 配列に格納した角度を全て足して360になるか一応確認。
		let sum = 0;
		this.angles.forEach( (sect, index) => {
			sum += sect;
		});
	}




	/****************************************************
	 * 円グラグ描画メソッド
	****************************************************/
	/* 扇を一つだけ描画するメソッド。これをループで回して円グラグを作る */
	drawSector(start, finish, color, increase)
	// drawSector(start, finish, color, increase, centerX, centerY)
	{
		// 扇を描画
		this.con.beginPath();// パスで描画するということを宣言。

		this.con.arc(
			this.centerX, this.centerY, this.radius+ increase,// x座標、y座標、半径、
			(start-90)*Math.PI/180,// 開始角
			(finish-90)*Math.PI/180, false)// 終了角
		/*
		this.con.arc(
			this.centerX+centerX, this.centerY+centerY, this.radius+ increase,// x座標、y座標、半径、
			(start-90)*Math.PI/180,// 開始角
			(finish-90)*Math.PI/180, false)// 終了角
			*/
		this.con.lineTo(this.centerX, this.centerY);
		this.con.fillStyle = color;// 色を指定

		/* 影の設定。影は一度宣言するとずっと適応されるので必ずリセットする。
		 * 影はCPU使用率が少し上がるので注意 */

		/*
		this.con.shadowOffsetX = 4;
		this.con.shadowOffsetY = 4;
		this.con.shadowBlur = 4;
		this.con.shadowColor = 'rgba(0, 0, 0, 0.3)';


		this.con.shadowOffsetX = 0;
		this.con.shadowOffsetY = 0;
		this.con.shadowBlur = 0;
		this.con.shadowColor = 'rgba(0, 0, 0, 0.3)';
		*/
		this.con.fill();

		// 扇の縁を白で描画。各扇に隙間が空いているように見える。
		if (this.edge_flag)
		{
		this.con.beginPath();
		this.con.arc(
			this.centerX, this.centerY, this.radius + increase,// x座標、y座標、半径、
			(start-90)*Math.PI/180,// 開始角
			(finish-90)*Math.PI/180, false)// 終了角
		this.con.lineTo(this.centerX, this.centerY);
		this.con.lineWidth = 1;// 扇の縁の線の太さ
		this.con.closePath();
		this.con.strokeStyle = "#fff";
		this.con.stroke();
		}
	}

	// ドーナツ型グラフを作成したい場合はこのメソッドで中心に白い円を描き塗りつぶす。
	drawCenterCircle()
	{
		this.con.globalAlpha = 1;
		this.con.beginPath();
		this.con.arc(
			this.centerX,		 // x座標
			this.centerY,		 // y座標
			this.radius/2,	 // 半径
			// 2,	 // 半径
			(0)*Math.PI/180, // 開始角
			(360)*Math.PI/180, false); // 終了角
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
	}

	drawMouseText(sectorItem)
	{
		for( let i=0; i<this.hitted.length; i++)
		{
			this.con.font = "20px Arial, meiryo";
			// let textSize = this.con.measureText(this.sectorInfo[i][1]+":"+this.sectorInfo[i][2]);
			let textSize = this.con.measureText(this.sectorInfo[i][1]);
			if(this.hitted[i])
			{
				// this.can.classList.add('hideCursor');
				this.con.fillStyle = "#000";// 色を指定
				this.con.fillRect(ox, oy-20, textSize.width, 20);
				this.con.fillStyle = "#fff";// 色を指定
				// this.con.fillText(this.sectorInfo[i][1]+":"+this.sectorInfo[i][2], ox, oy-4);
				this.con.fillText(this.sectorInfo[i][1], ox, oy-4);
			}
			else if(!this.hitted[i]) {
			// this.can.classList.remove('hideCursor');
			}
			this.con.fillStyle = "#000";// 色を指定
			this.con.fillText("hit:"+this.hitted, this.centerX - this.radius, this.centerY - this.radius - 70);
		}
	}

	getHalfText(text)
	{
		let halfTextSize = 0;
		halfTextSize = this.con.measureText(text);
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
		
		/* 各項目のパーセンテージを個別の取り出したいのでループさせる */
		for( let i = 0; i<this.sectorInfo.length; i++)
		{
			this.con.font = "12px Arial, meiryo";

			/* measureTextは文字サイズ情報をオブジェクトで返す関数。
			 * 使用する前にcontext.fontでフォントを指定する必要がある。
			 * 文字の幅と%を足した幅を変数に格納 */
			halfTextSize = this.con.measureText(this.cutNum(this.sectorInfo[i][2]/this.sum*100)+"%");
			/* 各扇の中間の角度を0-360度まで計算 */
			deg = this.cutNum(this.startAngles[i]+(this.finishAngles[i] - this.startAngles[i])/2);// 円の角度
			sin = Math.sin(this.getRadian(deg));
			cos = Math.cos(this.getRadian(deg));


			this.halfDegreeX = this.cutNum(this.radius * sin);
			this.halfDegreeY = this.cutNum(this.radius * cos);
			// if( deg === 0 ){ }
			if( deg > 0 && deg < 90 ){ if(this.halfDegreeX<0)this.halfDegreeX=-this.halfDegreeX;if(this.halfDegreeY>0)this.halfDegreeY=-this.halfDegreeY;}
			else if( deg > 90 && deg < 180 ){ if(this.halfDegreeX<0)this.halfDegreeX=-this.halfDegreeX;if(this.halfDegreeY<0)this.halfDegreeY=-this.halfDegreeY;}
			// else if( deg === 180 ){ }
			else if( deg > 180 && deg < 270 ){if(this.halfDegreeX>0)this.halfDegreeX=-this.halfDegreeX;if(this.halfDegreeY<0)this.halfDegreeY=-this.halfDegreeY;}
			// else if( deg === 270 ){}
			else if( deg > 270 && deg < 360 ){if(this.halfDegreeX>0)this.halfDegreeX=-this.halfDegreeX;if(this.halfDegreeY>0)this.halfDegreeY=-this.halfDegreeY;}
			// else if( deg === 360 ){deg = 360;}

			
			/* パーセンテージをどこに配置するか下で調整。
			 * 中心座標から円周上の点までの距離 */
			// let sectorCenter = [this.halfDegreeX/100 , this.halfDegreeY/100];
			// this.eachSectorCenters.push( sectorCenter );
			this.halfDegreeX *= 0.8;
			this.halfDegreeY *= 0.8;

			/* 中心座標+上で求めた半分の角度の円周上の座標-文字サイズ/2 */
			this.halfDegreeX = this.cutNum(this.centerX+this.halfDegreeX-halfTextSize.width/2);
			this.halfDegreeY = this.cutNum(this.centerY+this.halfDegreeY);

			/* この操作非常に重要。
			 * 一旦x,yの座標を入れた配列を作り、
			 * それを別の配列にプッシュしていけば二次元配列が出来る！ */
			let array = [this.halfDegreeX, this.halfDegreeY];
			this.halfDegrees.push(array);
		}
	}




	/****************************************************
	 *	レーダーチャート用
	****************************************************/
	// レーダーチャート用の座標をセット
	setRaderCordinates()
	{
		// let base = 360/this.sectorInfo.length;
		const base = (2*Math.PI)/this.sectorInfo.length;
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
			array = [x, y, ix, iy];
			this.raderCordinates.push(array);
		}
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
			/* 影を設定 */
			this.con.shadowOffsetX = 4;
			this.con.shadowOffsetY = 4;
			this.con.shadowBlur = 4;
			this.con.shadowColor = 'rgba(0, 0, 0, 0.3)';
			this.con.fill();

			/* 影をリセット */
			this.con.shadowOffsetX = 0;
			this.con.shadowOffsetY = 0;
			this.con.shadowBlur = 0;

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


	checkSectorValueForEdge()
	{
		let edge_count = 0;
		for (let i=0; i<this.sectorInfo.length; i++)
		{
			if (this.sectorInfo[i][2])
			{
				edge_count++;
			}
		}

		if (edge_count === 1)
		{
			this.edge_flag = 0;
		}
	}



	// 項目などの情報を描画
	drawText()
	{
		this.con.globalAlpha = 1;
		// this.con.globalAlpha = 0.4;
		this.con.font="12px 'ＭＳ　ゴシック'";// フォントを指定。
		this.con.fillStyle = "#000";// 色を指定
		// this.con.fillText(this.degree, this.centerX + 100, this.centerY + 100);
		for( let i=0; i<this.sectorInfo.length; i++ )
		{
			/*
			if( this.hitted[i])
			{
				this.con.globalAlpha = 1;
			}
			else if( !this.hitted && this.hit()) 
			{
				this.con.globalAlpha = 0.4;
			}
			else if( !this.hitted[i] && !this.hit())
			{
				this.con.globalAlpha = 1;
			}
			*/
			this.con.fillStyle = "#000";// 色を指定
			this.con.fillText(
			this.sectorInfo[i][1]+":"+this.cutNum((this.sectorInfo[i][2]/this.sum)*100),
			this.centerX - this.radius/2, this.centerY + this.radius + i*20+50);
			this.con.fillStyle = "#fff";// 色を指定

			if (this.sectorInfo[i][2])
			{
			this.con.fillText(this.cutNum(this.sectorInfo[i][2]/this.sum*100)+"%", this.halfDegrees[i][0], this.halfDegrees[i][1]);
			}
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
