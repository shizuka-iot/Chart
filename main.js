

/* 扇の情報を2次元配列で全て保持する */
const sectInfo = [
	["red", "php", 80],
	["blue", "pdo", 40],
	["green", "java", 30],
	["#c70067", "html", 20],
	["orange", "css", 60],
	["purple", "others", 70],
	["#a22041", "C", 120],
];

const sectInfo2 = [
	["#ea5532", "スカーレット",40 ],
	["#00ac97", "シーグリーン",50 ],
	["#e4007f", "マゼンタ", 50],
	["#915da3", "モーブ",70 ],
	["#47266e", "アイボリー", 64],
];

const sectInfo3 = [
	["#00ac97", "生命力",50 ],
	["#00ac97", "集中力",10 ],
	["#e4007f", "持久力", 40],
	["#915da3", "体力",30 ],
	["#47266e", "筋力", 40],
	["#47266e", "技量", 40],
	["#47266e", "理力", 8],
	["#47266e", "信仰", 10],
	["#47266e", "運", 7],
];

const ex = [
	["#e95295", "好き",50 ],
	["#2ca9e1", "嫌い",10 ],
];

const sectInfo4 = [
	["#606060", "エンジニアになれない",50 ],
	["#282828", "エンジニアになれる",10 ],
	["#705b67", "わからない", 7],
];


const sectInfo5 = [
	["orange", "数学",92 ],
	["", "英語",62],
	["", "物理",56],
	["", "国語",30],
];


const circle = [];
circle.push(new DrawCircle('can', arr, 100, 200, 200, 0, 100));
circle.push(new DrawCircle('can2', sectInfo2, 80, 200, 200, 0, 100));
circle.push(new DrawCircle('can', sectInfo, 100, 560, 200, 1, 100));
circle.push(new DrawCircle('can2', ex, 120, 560, 200, 1, 100));
circle.push(new DrawCircle('can3', sectInfo4, 200, 400, 250, 0, 100));
circle.push(new DrawCircle('can4', sectInfo5, 200, 400, 250, 2, 100));


function update()
{
	for(let i=0; i<circle.length; i++)
	{
		circle[i].update();
	}
}

function draw()
{

	DrawCircle.clear('can');
	DrawCircle.clear('can2');
	DrawCircle.clear('can3');
	DrawCircle.clear('can4');

	for(let i=0; i<circle.length; i++)
	{
		circle[i].draw();
	}
}
function mainLoop()
{
	requestAnimationFrame(mainLoop);
	update();
	draw();
}


/* 実行 */
window.onload = function() {
	mainLoop();
}
