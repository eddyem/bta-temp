/*
 *			Инициализация переменных и констант
 */
var MaxTemp, MinTemp;
const deg2rad = Math.PI / 180.0;
var theScene, SScene, IScene, TScene, tScene; // весь рисунок, подкупольное, межкупольное,
	// слой для кружочков от сенсоров (чувствительных к мыше), вспомогательный слой
// угол phi в координатах датчиков - в плоскости рисунка
// R, Z - в дециметрах
const Ssen_pos = [ // сенсоры на неподвижной части, цилиндр. СК: [R,phi,Z]
	[123, 140,  3], // 12
	[144, -40,  3], // 13
	[150, -44, 36], // 14
	[134, 170, 37], // 15
	[122, 139, 35], // 16
	[106,  27, 57], // 17
	[185, -43, 77], // 18
	[164, 175, 77], // 19
	[186,-114, 69], // 20
	[111, 137, 69], // 21
	[179,  50, 76]  // 22
];
// в массивах sincos элемент 0 - синус, 1 - косинус угла phi положения сенсора
const Ssen_num = [12,13,14,15,16,17,18,19,20,21,22];
// номер датчкика ssen (из DomeTemperatures)
const Dsen_pos = [ // сенсоры на подвижной части купола, угловая к-та от стороны с датчиком 14
	23, 39, 90, 125, 148, 167
];
var Dsen_sincos = new Array();
const Dsen_num = [6, 8, 11, 9, 7, 5]; // номера датчиков (из DomeTemperatures)
const Isen_pos = [ // сенсоры во внутрикупольном пространстве - 2 штуки
	2, 70
];
var Isen_sincos = new Array();
const Isen_num = [2, 10];
const MDsen_pos = [ // датчики на подв. части купола (металл), коорд.: R
	243, 239, 233, 229
];
const MDsen_num = [0, 1, 3, 4];
const ZAxisHeight = 88; // высота оси Z (зенитн. р.) от пола
// tube6 doesn't work
const Tsen_pos = [ // воздушные сенсоры на телескопе !!! Высоты - от оси Z !!!
	[ 0,   0,190], // 19
	[37, -90,-55], // 2
	[37,   0,-55], // 3
	[31,  69,-33], // 4
	[33,  69,-28], // 5
/*	[34,-171,-10], // 6*/
	[ 4, -82, -8], // 7
	[ 4, -82,  0], // 8
	[35, 147, 40], // 9
	[35, 117, 58], // 10
	[35, -71, 82], // 11
	[35,  20, 97], // 12
	[35,  20,104], // 13
	[36,  81,108], // 14
	[36, -98,129], // 15
	[ 0,   0,146], // 16
	[40, -90,155], // 17
	[10, 180,190], // 18
	[37,  90,-55], // 1
	[ 9, 180,201]  // 20
];
var Tsen_sincos = new Array();
const Tsen_num = [1,2,3,4,5/*,6*/,7,8,9,10,11,12,13,14,15,16,17,18,19,20];
// типы датчиков:
const Tsen_type = [	"a", "a", "a", "a", "m"/*, "a"*/, "a", "m", "a", "a",
					"a", "m", "a", "a", "a", "a", "m", "m", "a", "a"];
var DomeTemperatures = new Array(); // показания температур датчиков купола
var DomeTempsUsed = new Array(); // 1 - показания датчика используются
var TubeTemperatures = new Array(); // показания датчиков телескопа
var TubeTempsUsed = new Array(); // 1 - показания датчика используются
const Az0 = 134.92; // азимут купола из чертежа (для "нулевой" проекции)
var TelAz = Az0; var TelZ = 0; // азимут и зенитное расстояние телескопа
var DomeAz = Az0; // азимут купола
var RotAngle = Az0; // Угол вращения главной плоскости рисунка (вокруг вертикальной оси)
var SSensors = new Array(); // датчики на неподвижной части
var DSensors = new Array(); // датчики на подвижной части, в т.ч. в межкупольном
var TSensors = new Array(); // датчики на телескопе

var Tel; // "телескоп"
var init = 1;

function $(el){
	return document.getElementById(el);
}

function fillDTused(){
	function fill__(temps, tused){
		var i, l = temps.length;
		for(i=0; i<l; i++)
			tused[temps[i]] = 1;
	}
	fill__(Ssen_num, DomeTempsUsed);
	fill__(Dsen_num, DomeTempsUsed);
	fill__(Isen_num, DomeTempsUsed);
	fill__(MDsen_num,DomeTempsUsed);
	fill__(Tsen_num, TubeTempsUsed);
}

var Visor;
function start(){
	window.onresize = resizeSVG;
	fillDTused();
	resizeSVG();
	theScene = new Scene(null, "whole_pic"); // весь рисунок
	theScene.MoveTo(0.0, -YOffset);
	InitVisor();
	SScene = new Scene(theScene, "inner"); // подкупольное (обрезается до внутренней пов. купола)
	SScene.ChAttrs("clip-path", "url(#innerclip)");
	IScene = new Scene(theScene, "dome-in"); // межкупольное (обрезается обеими пов. купола)
	IScene.ChAttrs("clip-path", "url(#domeclip)");
	tScene = new Scene(theScene, "moving-dome-in");
	TScene = new Scene(theScene, "sensors"); // верхний слой, где расположены "сенсоры" (сами серые кружочки)
	SVGDoc.onmousedown = startRotate;
	//SVGDoc.onmouseover = function(evt){evt.preventDefault();evt.target.style.cursor = "w-resize";}
	SVGDoc.addEventListener('DOMMouseScroll', wheel, false);
	getData();
}

function wheel(evt){
	RotateScene(evt.detail);
}

/*
 *			Функции инициализации
 */
function gradByTemp(gradId, Temp){
	function to16(v){
		var vh = parseInt(v).toString(16);
		if(vh.length == 1) vh = '0' + vh;
		return vh;
	}
	function getColor(Temp){
		var i, r, g, b, dT = (MaxTemp - MinTemp)/4, Ti;
		i = Math.floor( (Temp - MinTemp) / dT);
		Ti = (Temp - MinTemp - dT * i) / dT;
		switch(i){
			case 0:
				r = 0;
				g = 255 * Ti;
				b = 255;
			break;
			case 1:
				r = 0;
				g = 255;
				b = 255 * (1 - Ti);
			break;
			case 2:
				r = 255 * Ti;
				g = 255;
				b = 0;
			break;
			case 3:
				r = 255;
				g = 255 * (1 - Ti);
				b = 0;
			break;
			default:
				if(i>3){r=255; g=0; b=0;}
				if(i<0){r=0; g=0; b=255;}
		}
		var Color = '#' + to16(r) + to16(g) + to16(b);
		return Color;
	}
	var color = getColor(Temp);
	Gradient('r', gradId, [50,50,100], [0,50,100], [color, color, color], [1,0,0]);
}

function initGradients(){
	var i, t, l;
	MaxTemp = -100.0; MinTemp = 100.0;
	function findExtrems(tmas){
		l = tmas.length;
		for(i=0; i<l; i++){
			if(typeof(tmas[i]) == "undefined") continue;
			t = tmas[i];
			if(t > MaxTemp) MaxTemp = t;
			if(t < MinTemp) MinTemp = t;
		}
	}
	function mkGrads(tmas, def){
		l = tmas.length;
		for(i=0; i<l; i++){
			if(typeof(tmas[i]) != "undefined")
				gradByTemp(def+i, tmas[i]);
		}
	}
	findExtrems(DomeTemperatures);
	findExtrems(TubeTemperatures);
	mkGrads(DomeTemperatures, "grd");
	mkGrads(TubeTemperatures, "grt");
}

function initSensors(){
	var i, l, j, x, y, R, phi, theta;
	l = Ssen_pos.length;
	for(i=0; i<l; i++){
		SSensors[i] = new Sensor(SScene, "a",0,0, Ssen_num[i], "d", "dome-stat"+i);
	}
	l = Dsen_pos.length;
	for(i=0; i<l; i++){
		Dsen_sincos[i] = [	Math.sin(Dsen_pos[i]*deg2rad),
							Math.cos(Dsen_pos[i]*deg2rad)];
		DSensors[i] = new Sensor(SScene, "a",0,0, Dsen_num[i], "d", "dome-moving"+i);
	}
	j = l; l = Isen_pos.length;
	for(i=0; i<l; i++,j++){
		Isen_sincos[i] = [	Math.sin(Isen_pos[i]*deg2rad),
							Math.cos(Isen_pos[i]*deg2rad)];
		DSensors[j] = new Sensor(IScene, "a",0,0, Isen_num[i], "d", "inner"+i);
	}
	l = MDsen_pos.length;
	for(i=0; i<l; i++,j++){
		DSensors[j] = new Sensor(tScene, "m",0,0, MDsen_num[i], "d", "moving-metall"+i);
	}
	l = Tsen_pos.length;
	for(i=0; i<l; i++){
		var ang = (Tsen_pos[i][1] + 90)*deg2rad;
		Tsen_sincos[i] = [	Math.sin(ang),
							Math.cos(ang)];
		TSensors[i] = new Sensor(SScene, Tsen_type[i],0,0, Tsen_num[i], "t", "tel"+i);
	}
}

function Telescope(){
	this.body = new Object2D(SScene, "g", "telframe");
	this.body.Xmax = this.body.Ymax = 0;
	this.body.Center.x = this.body.Center.y = 0;
	const r0 = 30; r1 = 35, r2 = 26.9;
	const h0 = -73, h1 = -54, h2 = -8, h3 = 8, h4 = 150;
	// координаты вершин в ЦСК, z относительно оси Z
	this.points = new Array();
	var linesz = 0;
	function fillpts(step, r1,h1, r2, h2){
		var l = 720 / step, half = step / 2 * deg2rad, a45 = 45*deg2rad;
		points = new Array(l);
		for(var i = 0; i < l; i+=2){
			var ang = i*half - a45;
			points[i]   = [r1, Math.sin(ang), Math.cos(ang), h1];
			points[i+1] = [r2, Math.sin(ang+half), Math.cos(ang+half), h2];
		}
		linesz += l*2;
		return points;
	}
	this.points[0] = fillpts(45, 38,-54, 30,-73); // оправа
	this.points[1] = fillpts(90, 35,-54, 35,-8); // ниж. опоры
	this.points[2] = fillpts(45, 40,-8, 40,8); // ср. кольцо
	this.points[3] = fillpts(90, 35,8, 35,150); // верх. опоры
	this.points[4] = fillpts(45, 40,150, 40,163); // верх. кольцо
	this.points[5] = fillpts(45, 9,146, 9,192); // стакан
	this.lines = new Array(linesz);
	for(var i = 0; i < linesz; i++){
		this.lines[i] = new Line(this.body, null, 'line'+i);
		this.lines[i].ChAttrs("stroke-width", 0.3);
	}
	this.Rotate = RotTel;
	return this;
}

function RotTel(){
	var phi = (RotAngle - 180 - TelAz)*deg2rad;
	var sinPhi = Math.sin(phi);
	var cosPhi = Math.cos(phi);
	var cosZ = Math.cos(TelZ*deg2rad);
	var sinZ = Math.sin(TelZ*deg2rad);
	var zmax = 270 * Math.sin(TelZ*deg2rad);
	function movept(i, line1, line2, crds){
		var r = crds[i][0] * crds[i][2];
		var x1 = r*cosZ + crds[i][3]*sinZ;
		var z1 = crds[i][0] * crds[i][1];
		var y = crds[i][3]*cosZ - r*sinZ + ZAxisHeight;
		var x = x1*cosPhi + z1*sinPhi;
		var z = z1*cosPhi - x1*sinPhi;
		var wd = z/2/zmax + 0.5;
		if(wd < 0.05) wd = 0.05;
		line1.ChAttrs("opacity", wd);
		line1.ChAttrs('x1', x);
		line1.ChAttrs('y1', -y);
		line2.ChAttrs('x2', x);
		line2.ChAttrs('y2', -y);
	}
	var offset = 0;
	function show_part(crds, lines){
		var l = crds.length;
		for(var i=0; i<l; i++){
			k = i - 1;
			if(k < 0) k += l; // рисуем верт. опоры
			movept(i, lines[i+offset], lines[k+offset], crds);
			k = i + l - 2;
			if(k < l) k += l; // рисуем ниж. и верх. контуры
			movept(i, lines[i+l+offset], lines[k+offset], crds);
		}
		offset += 2 * l;
	}
	for(var i = 0; i < this.points.length; i++)
		show_part(this.points[i], this.lines);
}

function Sensor(aParent, type, x, y, Num, prefix, id){
	var outer = new Circle(aParent, 0, id);
	var radius = (type == "m") ? 3 : 5;
	var inner = new Circle(TScene, radius);
	outer.MoveTo(x,y);
	inner.MoveTo(x,y)
	if(prefix == "d" && typeof(DomeTemperatures[Num]) != "undefined") outer.Fill("url(#grd"+Num+")");
	else if(prefix == "t" && typeof(TubeTemperatures[Num]) != "undefined") outer.Fill("url(#grt"+Num+")");
	else outer.Fill("none");
	inner.Border("#000000", 0.1);
	inner.Fill("#FFFFFF");
	inner.ChAttrs("fill-opacity", "0");
	inner.ChAttrs("id", prefix+type+Num);
	inner.Group.onmouseover = showTemp;
	this.outer = outer; this.inner = inner;
	this.Move = MoveSensor;
	return this;
}

function InitVisor(){
	Visor = new Object2D(theScene, "path", "visor-borders"); // края забрала
	Visor.Points = [ // координаты базовых точек в цилиндрической СК
		[247, 168.3, 68], // нижний левый угол
		[247,-168.3, 68], // нижний правый угол
		[ 40, -90.0,315], // верхний правый угол
		[ 40,  90.0,315], // верхний левый угол
		[247, 180.0, 68], // середина нижней части
	];
	Visor.Border("#000000", 2);
	Visor.Cline = new Object2D(Visor.Parent, "path", "visor-centerline"); // средняя линия забрала
	Visor.Cline.Border("#000000", 1);
	Visor.Cline.ChAttrs("opacity", "0.5");
	Visor.ChAttrs("fill-opacity", "0.2");
}

/*
 *			Функции для отрисовки SVG
 */
var xClick0, yClick0; // начальные координаты щелчка (для вращения "сцены")
var olddir=0; // начальное направление перемещения мыши (1-влево, -1-вправо)
var sign=0;   // направление вращения картины (1-против, -1-по часовой)

function startRotate(evt){
	evt.preventDefault();
	xClick0 = evt.clientX;
	yClick0 = evt.clientY;
	SVGDoc.onmousemove = doRotate;
	SVGDoc.onmouseup = endRotate;
}

function doRotate(evt){
	var X = evt.clientX, Y = evt.clientY, R = $('SVG').clientWidth / 2;
	var Xc = SVGDoc.width/2, Xabs = (xClick0-Xc)/R;
	var Yc = SVGDoc.height/2, Yabs = (yClick0-Yc)/R;
	var dir = (xClick0-X)>0?1:-1;
	var Xabs1 = (X-Xc)/R, Yabs1 = (Y-Yc)/R;
	if(Xabs>1) Xabs=1; else if(Xabs<-1) Xabs=-1;
	if(Yabs>1) Yabs=1; else if(Yabs<-1) Yabs=-1;
	if(Xabs1>1) Xabs1=1; else if(Xabs1<-1) Xabs1=-1;
	if(Yabs1>1) Yabs1=1; else if(Yabs1<-1) Yabs1=-1;
	if(olddir == 0) olddir = dir;
	else if(olddir != dir){olddir = dir; sign = 0;}
	if((Y-yClick0)>0) dir *= -1; // тянут за "заднюю часть"
	var dphi = Math.abs(Math.acos(Xabs1) - Math.acos(Xabs))+
		Math.abs(Math.asin(Yabs1) - Math.asin(Yabs));
	xClick0 = X; yClick0 = Y;
	if(sign == 0) sign = dir;
	dphi *= sign/deg2rad;
/*	$("test").innerHTML = " Xabs="+Xabs+"<br>Yabs="+Yabs
		+"<br>sign="+sign+"<br>olddir="+olddir+"<br>dir="+dir
		+"<br>dphi="+dphi;*/
	RotateScene(dphi);
}

function endRotate(evt){
	SVGDoc.onmousemove = '';
	SVGDoc.onmouseup = '';
	doRotate(evt);
	olddir=sign=0;
}

function resizeSVG(){
	var SVG = $("SVG");
	var mainSVG = SVGDoc.getElementById("Main");
	var W = document.body.clientWidth - 2*SVG.offsetLeft - 5;
	var H = document.body.clientHeight - 2*SVG.offsetTop - 5;
	var zoom = Math.min(W/mainWidth, H/mainHeight);
	if(Math.abs(zoom - 1) > 0.01)
		mainSVG.setAttribute("transform", "scale("+zoom+")");
	else
		mainSVG.removeAttribute("transform");
	SVGDoc.width = SVG.width = mainWidth * zoom;
	SVGDoc.height = SVG.height = mainHeight * zoom;
}

function MoveSensor(x, y, r){
	this.outer.ChAttrs('r', r);
	this.outer.MoveTo(x,y);
	this.inner.MoveTo(x,y);
}

function RotateVisor(){
	var angle = RotAngle - DomeAz , fil = 1;
	var X0= Visor.Parent.Xmax;
	var Y0= Visor.Parent.Ymax;
	var X = new Array(5);
	var Y = new Array(5);
	var Z = new Array(5);
	var i, phi, ss='M ';
	for(i=0; i<5; i++){
		phi = (Visor.Points[i][1] + angle) * deg2rad;
		X[i] = X0 + Visor.Points[i][0] * Math.cos(phi);
		Y[i] = Y0 - Visor.Points[i][2]; // для сокращения записи
		Z[i] = Math.sin(phi);
	}
	var R1 = X[0]-X[3]; var R2 = X[1]-X[2]; var R3 = X[4]-(X[2]+X[3])/2;
	var f1 = (R1<0)?1:0; var f2 = (R2<0)?0:1; var f3 = (R3<0)?0:1;
	if(Z[0] < 0) ss += X[0]+','+Y[0]+' A '+Math.abs(R1)+',247 0 0 '+f1+' ';
	else fil = 0;
	ss += X[3]+','+Y[3]+' L '+X[2]+','+Y[2]+' ';
	if(Z[1] < 0) ss += 'A '+Math.abs(R2)+',247 0 0 '+f2+' ';
	else{ ss += 'M '; fil = 0;}
	ss += X[1]+','+Y[1]+' L '+X[0]+','+Y[0];
	Visor.ChAttrs('d', ss);
	ss = "M "+(X[2]+X[3])/2+','+Y[2]+' A '+Math.abs(R3)+',247 0 0 '+f3+' '+X[4]+','+Y[4]+' L '+X[0]+','+Y[0];
	Visor.Cline.ChAttrs('d', ss);
	if(fil) Visor.Fill("#aaaacc");
	else Visor.Fill("none");
}

function RotateScene(dPhi){
	RotAngle += dPhi;
	if(RotAngle > 360) RotAngle -= 360;
	if(RotAngle < 0) RotAngle += 360;
	RotateVisor();
	RotateSensors();
	theScene.Draw();
	update_coords_div();
}

function RotateSensors(){
	const Rmin=10, Rvar=110;
	var i, l, j, x, y, R, phi, op;
	l = Ssen_pos.length;
	for(i=0; i<l; i++){
		phi = (RotAngle + Ssen_pos[i][1]) * deg2rad;
		op = 1 - Ssen_pos[i][0]*Math.abs(Math.sin(phi))/250;
		R = Rmin + Rvar * op;;
		x = Ssen_pos[i][0] * Math.cos(phi);
		SSensors[i].Move(x, Ssen_pos[i][2], R);
		SSensors[i].outer.ChAttrs("fill-opacity", op);
	}
	l = Dsen_pos.length;
	phi = (RotAngle - DomeAz ) * deg2rad;
	var cosPhi = Math.cos(phi); var sinPhi = Math.sin(phi);
	for(i=0; i<l; i++){
		x = 232 * Dsen_sincos[i][1] * cosPhi;
		y = 242 * Dsen_sincos[i][0] + 68;
		op = 1 - Math.abs(Dsen_sincos[i][1]*sinPhi)*0.93;
		R = Rmin + Rvar * op;
		DSensors[i].Move(x, y, R);
		DSensors[i].outer.ChAttrs("fill-opacity", op);
	}
	j = l;
	l = Isen_pos.length;
	for(i=0; i<l; i++,j++){
		x = (237 * Isen_sincos[i][1]) * cosPhi;
		y = 242 * Isen_sincos[i][0] + 68;
		R = 50 + 160 * (1 - Math.abs(Isen_sincos[i][1] * sinPhi));
		DSensors[j].Move(x, y, R);
	}
	y = 85;
	op = 1 - Math.abs(sinPhi);
	R = 2 + 5 * op;
	l = MDsen_pos.length;
	for(i=0; i<l; i++,j++){
		x = MDsen_pos[i] * cosPhi;
		DSensors[j].Move(x, y, R);
		DSensors[j].outer.ChAttrs("fill-opacity", op);
	}
	l = Tsen_pos.length;
	phi = (RotAngle - TelAz-180) * deg2rad;
	cosPhi = Math.cos(phi); sinPhi = Math.sin(phi);
	var cosZ = Math.cos(TelZ*deg2rad);
	var sinZ = Math.sin(TelZ*deg2rad);
	var zmax = 40 + 200 * Math.sin(TelZ*deg2rad);
	for(i=0; i<l; i++){
		var r = Tsen_pos[i][0] * Tsen_sincos[i][1];
		var x1 = r*cosZ + Tsen_pos[i][2]*sinZ;
		var z1 = Tsen_pos[i][0] * Tsen_sincos[i][0];
		y = Tsen_pos[i][2]*cosZ - r*sinZ + ZAxisHeight;
		x = x1*cosPhi + z1*sinPhi;
		var z = Math.abs(z1*cosPhi - x1*sinPhi);
		op = 1 - z/zmax;
		R = Rmin + Rvar * op/5;
		TSensors[i].Move(x, y, R);
		TSensors[i].outer.ChAttrs("fill-opacity", op);
	}
	Tel.Rotate();
}

/*
 *		Плавающие подсказки
 */
function showTemp(evt){
	var type, t, num = Number(parseInt(evt.target.id.substr(2))), ss="";
	if(evt.target.id.charAt(0) == 'd'){t=DomeTemperatures[num]; ss="pka ";}
	else{t=TubeTemperatures[num]; ss="tube ";}
	if(evt.target.id.charAt(1) == 'm') type = "металл";
	else type = "воздух";
	if(typeof(t) == "undefined") t = "не подключен";
	tooltip(evt, t +"<br> датчик "+ss+num+"<br>("+type+")");
}

var tipobj, tiptext;
function tooltip(evt, txt){
	tipobj = document.createElement("DIV");
	tipobj.onclick = help;
	tipobj.className = "tooltip";
	tipobj.setAttribute("name", "tipobj");
	tipobj.style.opacity = 0.3;
	document.body.appendChild(tipobj);
	tiptext = document.createElement("DIV");
	tiptext.id = "tiptext";
	tiptext.onclick = help;
	document.body.appendChild(tiptext);
	tipobj.innerHTML = txt;
	tiptext.innerHTML = txt;
	evt.target.onmouseout = hide_info;
	evt.target.onmouseover = '';
	positiontip(evt);
}

function hide_info(el){
	document.body.removeChild(tiptext);
	setTimeout(hide, 3000);
	setTimeout(function(){el.target.onmouseover = showTemp;}, 4000);
	el.target.onmouseout = '';
}
var hideTmOut;
function hide(){
	var obj = document.getElementsByName("tipobj")[0];
	if(!obj) return;
	var op = obj.style.opacity;
	op -= 0.01;
	document.getElementsByName("tipobj")[0].style.opacity = op;
	if(op > 0) hideTmOut = setTimeout(hide, 30);
	else document.body.removeChild(obj);
}

function onkey(code){
	if(code != 27) return;
	clearTimeout(hideTmOut);
	var obj = document.getElementsByName("tipobj");
	var l = obj.length - 1;
	for(var i=l; i>-1; i--) document.body.removeChild(obj[i]);
}

function positiontip(e){
	var SVG = $('SVG');
	var curX = e.clientX + SVG.offsetLeft;
	var curY = e.clientY + SVG.offsetTop - tipobj.offsetHeight - 5;
	var winwidth = SVG.offsetWidth - SVG.offsetLeft;
	var winheight = SVG.offsetHeight - SVG.offsetTop;
	var rightedge = winwidth - curX;
	if(rightedge < tipobj.offsetWidth)
		curX -= tipobj.offsetWidth+15;
	if(curY < SVG.offsetTop)
		curY += tipobj.offsetHeight*2+15;
	tipobj.style.left = curX+"px";
	tipobj.style.top = curY+"px";
	$('tiptext').style.top = curY+"px";
	$('tiptext').style.left = curX+"px";
}

function help(){
	alert("Всплывающие подсказки показывают значения температуры для данного датчика\n"
		+"и номер этого датчика.\n"
		+"В случае, если датчик не подключен, появляется соответствующая надпись.");
}

/*
 *			Запрос значений температур и координат
 */

function getData(){
	$('coords').innerHTML = "Обновляю...";
	sendrequest("http://tb.sao.ru/cgi-bin/eddy/bta_pos.cgi", "", parseCoords);
}

function update_coords_div(){
	function azimuth(ang){
		var x = ang;
		if(x > 180) x -= 360;
		else if(x < -180) x += 360;
		return x.toFixed(2);
	}
	var cDiv = $('coords');
	var SVG = $('SVG');
	cDiv.innerHTML = "Текущие координаты телескопа: A="+azimuth(TelAz)+
				", Z="+TelZ.toFixed(2)+"; азимут купола: A="+
				azimuth(DomeAz)+"; азимут наблюдателя: "+azimuth(RotAngle-90);
	cDiv.style.left = (SVG.offsetLeft + 5) + "px";
	cDiv.style.top = (SVG.offsetTop + 5) + "px";
}

function parseCoords(req){
	var i, args;
	var data = req.responseText.split(' ');
	var l = data.length;
	for(i=0; i<l; i++){
		args = data[i].split('=');
		switch(args[0]){
			case "telA": TelAz = Number(parseFloat(args[1]).toFixed(2)); break;
			case "telZ": TelZ  = Number(parseFloat(args[1]).toFixed(2)); break;
			case "domeA":DomeAz= Number(parseFloat(args[1]).toFixed(2)); break;
		}
	}
	update_coords_div();
	sendrequest("http://acs.sao.ru/cgi-bin/eddy/can_req.cgi", "", parseTemp);
}

function parseTemp(req){
	var i, l;
	var lines = req.responseText.split('\n');
	l = lines.length;
	for(i=0; i<l; i++){
		var args = lines[i].split(' ');
		if(args[0].indexOf("t_pka") > -1){
			// температура датчиков в подкупольном
			fillTemp("dome", args);
		}
		else if(args[0].indexOf("t_tube") > -1){
			// температура датчиков на телескопе
			fillTemp("tube", args);
		}
	}
	initGradients();
	if(init){
		initSensors();
		Tel = new Telescope();
		init = 0;
	}
	RotateSensors();
	RotateVisor();
	theScene.Draw();
	setTimeout(getData, 300000); // обновляем данные каждые 5 минут
}

function fillTemp(sObj, sArray){
	var n, d, t, pos;
	if(sObj == "dome") pos=6;
	else pos=7;
	n = Number(parseInt(sArray[0].substr(pos))); // номер датчика
	t = Number(parseFloat(sArray[3]).toFixed(1));
	if(sObj == "dome"){
		if(DomeTempsUsed[n] == 1) // этот датчик отображается
			DomeTemperatures[n] = t;
	}
	else{
		if(TubeTempsUsed[n] == 1) // этот датчик отображается
			TubeTemperatures[n] = t;
	}
}

function sendrequest(CGI_PATH, req_STR, fn_OK){
	var timeout_id, str;
	var request = new XMLHttpRequest();
	request.open("POST", CGI_PATH, true);
	request.setRequestHeader("Accept-Charset", "koi8-r");
	request.overrideMimeType("multipart/form-data;");
	request.onreadystatechange=function(){
		if(request.readyState == 4){
			if(request.status == 200){
				clearTimeout(timeout_id);
				fn_OK(request);
			}
			else{
				clearTimeout(timeout_id);
			}
		}
	}
	request.send(req_STR);
	timeout_id = setTimeout(function(){
			request.onreadystatechange=null; request.abort();
		}, 15000);
}
