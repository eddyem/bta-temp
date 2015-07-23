var mainWidth, mainHeight, YOffset;
var SVGDoc, SVGScene;

function initSVG(oo, Y0){
	SVGDoc = oo;
	mainWidth = 500;
	mainHeight = 350;
	YOffset = Y0 - mainHeight / 2; // смещение, устанавливающее координату пола Y=0
	SVGScene = oo.getElementById("Scene");
	SVGScene.Xmax = mainWidth / 2;
	SVGScene.Ymax = mainHeight / 2;
}

function Vector(vx, vy){
	this.x = vx;
	this.y = vy;
	this.Add = function(va){
		this.x += va.x;
		this.y += va.y;
	}	
	this.Zoom = function(zf){
		this.x *= zf;
		this.y *= zf;
	}
	this.Length = function(){
		var l = this.x*this.x + this.y*this.y;
		return Math.sqrt(l);
	}
}

function DeleteScene(){
	var ii, nn, ss;
	ss = this.Group;
	nn = this.Shapes.length;
	for (ii = nn-1; ii > -1; ii--)
		ss.removeChild(this.Shapes[ii]);
	this.Ranks.length = 0;
	this.Shapes.length = 0;
	this.Callback.length = 0;
	SVGScene.removeChild(ss);
}

function DrawAll(){
	var ii, jj, ss = "";
	var ll = 0;
	if(this.Objs) ll = this.Objs.length;
	if(this.Attributes)
	for(ii in this.Attributes)
		this.Group.setAttribute(ii, this.Attributes[ii]);
	var x = this.Parent.Xmax + this.Center.x - this.Xmax;
	var y = this.Parent.Ymax - this.Center.y - this.Ymax;
	this.ChTr('translate', x, y);
	for(ii in this.Transform)
		ss += ii + '(' + this.Transform[ii] + ') ';
	this.Group.setAttribute('transform', ss);
	if(ll>0) for(ii=0; ii<ll; ii++)
		this.Objs[this.Ranks[ii][0]].Draw();
}

function ChangeAttributes(attr, val){
	this.Attributes[attr] = val;
}

function ChangeTransform(attr, val1, val2){
	var ss;
	if(ChangeTransform.arguments.length == 3) ss = val1 + "," + val2;
	else ss = val1;
	this.Transform[attr] = ss;
}

function AddObject(oo, type){
	var ii = this.Objs.length;
	this.Objs[ii] = oo;
	this.Ranks[ii] = new Array(ii, 0);
	this.Shapes[ii] = oo.Group;
	this.Group.appendChild(this.Shapes[ii]);
}

function Scene(aParent, id){
	if(Scene.arguments.length == 0 || aParent == null) aParent = SVGScene;
	var obj = new Object2D(aParent, "g", id);
	return obj;
}

function Object2D(aParent, aType, id){
	this.Parent = aParent;
	this.Visibility = "visible";
	this.Draw = DrawAll;
	this.Objs = new Array(); // Objs, Ranks и Shapes нужны, если данный объект - составной
	this.Ranks = new Array();
	this.Shapes = new Array();
	this.Xmax = mainWidth/2; // значения по умолчанию
	this.Ymax = mainHeight/2;
	this.Transform = {'translate': "0, 0", 'rotate': "0", 'scale': "1, 1"};
	this.ChAttrs = ChangeAttributes;
	this.ChTr = ChangeTransform;
	this.Center = new Vector(0,0);
	this.Callback = new Array();
	this.Attributes = {'fill': "none"}; // инициализируем объект
	this.AddObj = AddObject;
	this.Group = SVGDoc.createElementNS("http://www.w3.org/2000/svg", aType);
	if(typeof(id) != 'undefined') this.Group.id = id;
	this.Fill = function(c){this.ChAttrs('fill', c);}
	this.Rotate = function(a){this.ChTr('rotate', a);}
	this.Border = function(c, w){this.ChAttrs('stroke', c); this.ChAttrs('stroke-width', w);}
	this.MoveTo = function(x, y){this.Center.x = x; this.Center.y = y;}
	this.setEvent = function(Event, Callback){
		this.Group.addEventListener(Event, Callback, false);
		for(var i=0; i<this.Shapes.length; i++)
			this.Shapes[i].setEvent(Event, Callback);
	}
	this.removeEvent = function(Event, Callback){
		this.Group.removeEventListener(Event, Callback, false);
		for(var i=0; i<this.Shapes.length; i++)
			this.Shapes[i].removeEvent(Event, Callback);		
	}
	if(aParent == SVGScene) SVGScene.appendChild(this.Group);
	else this.Parent.AddObj(this, aType);
	return(this);
}

function Rect(aParent, aWidth, aHeight, id){
	var obj = new Object2D(aParent, "rect", id);
	obj.Xmax = aWidth / 2;
	obj.Ymax = aHeight / 2;
	obj.Attributes = {'width': aWidth, 'height': aHeight,
		'stroke': "black", 'stroke-width': 0.2};
	return obj;
}

function Circle(aParent, radius, id){
	var obj = new Object2D(aParent, "circle", id);
	obj.Xmax = obj.Ymax = 0;
	obj.Attributes = {'cx': 0, 'cy': 0, 'r': radius};
	return obj;
}

function Gradient(type, id, attrs, stop_points, stop_colors, stop_opacity, rotAngle){
	var i, l, Gname, Attr, band = new Array(), Grad;
	switch(type){
		case 'l': Gname = "linearGradient"; Attr = ['x1', 'y1', 'x2', 'y2']; break;
		case 'r': Gname = "radialGradient"; Attr = ['cx', 'cy', 'r'];
	}
	if(!(Grad = SVGDoc.getElementById(id))){
		Grad = SVGDoc.createElementNS("http://www.w3.org/2000/svg", Gname);
		SVGDoc.getElementById("defs").appendChild(Grad);
		Grad.setAttribute("id", id);
		l = Attr.length;
		for(i = 0; i < l; i++) Grad.setAttribute(Attr[i], attrs[i]+'%');
	}
	else{
		l = Grad.children.length;
		for(i=0; i<l; i++) Grad.removeChild(Grad.lastChild);
	}
	l = Math.min(stop_points.length, stop_colors.length);
	for(i = 0; i < l; i++){
		band[i] =  SVGDoc.createElementNS("http://www.w3.org/2000/svg","stop");
		band[i].setAttribute("offset", stop_points[i]+'%');
		band[i].setAttribute("stop-color", stop_colors[i]);
		if(stop_opacity) band[i].setAttribute("stop-opacity", stop_opacity[i]);
		Grad.appendChild(band[i]);
	}
	if(rotAngle)
		Grad.setAttribute('gradientTransform', 'rotate('+rotAngle+')');
}

function Path(aParent, path, id){
	var obj = new Object2D(aParent, "path", id);
	obj.Xmax = 0;
	obj.Ymax = 0;
	obj.Attributes = {'d': path, 'stroke': "black", 'stroke-width': 0.2};
	return obj;
}

function Line(aParent, crds, id){
	var obj = new Object2D(aParent, "line", id);
	obj.Xmax = obj.Ymax = 0;
	var crds;
	obj.Center.x = obj.Center.y = 0;
	if(Line.arguments.length == 1 || crds == null) crds = [0, 0, 0, 0];
	obj.Attributes = {'x1': crds[0], 'y1': crds[1],
	'x2': crds[2], 'y2': crds[3], 'stroke': "black", 'stroke-width': 0.2};
	return obj;
}
