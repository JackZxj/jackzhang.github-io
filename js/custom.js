"use strict";
(function ($) {
// Write your custom JavaScript code here.

var can1, can2;//获取两个canvas对象
var ctx1, ctx2;//两个绘画操作
var lastFrameTime = 0;
var deltaFrameTime = 0;
var canvasWidth, canvasHeight;
var skyHeight = 150;
var speed = 0;
var speedMax = 90;
//键盘操作上下左右按钮
var keypress = {
	up : false,
	down : false,
	left : false,
	right : false
}
var carState = {
	maxSpeed : 60,
	friction : 0.3,
	accelerate : 10,
	deAccelerate : 15
}
var ground = {
	maxHeight : 150,
	minHeight : 2
}
var color = {
	sky : "#D4F5FE",
	mountains : "#83CACE",
	ground : "#8FC04C",
	groundDark : "#73B043",
	road : "#606a7c",
	roadLine : "#FFF",
	hud : "#FFF",
	coin : "#FFD800",
	lights : "#FF9166"
}
var road = {
	min : 60,
	max : 700
}
var startDark = true;
var offsetMove = 0;
var turnCar = 1;
var maxTurn = 10;
var posxCar = 0;
var currentCurve = 0;
var curveTemp = 0;
var pppp = 0;
var roadSection = 0;
var coinPos;
var hitCoin = {
	isHit : false,
	posX : 0,
	posY : 0,
	alpha : 1,
	order : 0,
	birth : true
}
var gasPos;
var hitGas = {
	isHit : false,
	posX : 0,
	posY : 0,
	alpha : 1,
	order : 0,
	birth : true
}
var leftGas = 100;
var maxGas = 100;
var score = new Number(0);
var seed = 0;
var itemOffset = {
	gasMin : 0,
	gasMax : 0,
	coinMin : 0,
	coinMax : 0
}


document.body.onload = game;//初始化后加载游戏

function game()
{
	init();
	lastFrameTime = Date.now();
	gameLoop();
}

function init()//游戏初始化函数
{
	can1 = document.getElementById("canvas1");//第一层，底层画布，画草地，山、天空、路中央的虚线
	if (can1 == null) {
		return;
	}
	ctx1 = can1.getContext("2d");
	can2 = document.getElementById("canvas2");//第二层顶层画布，画车、路、分数、速度表盘、汽油桶、油箱
	ctx2 = can2.getContext("2d");
	canvasHeight = can1.height;//初始化宽、高
	canvasWidth = can1.width;
	//键盘操作监听
	window.addEventListener("keydown", keyDown, false);
	window.addEventListener("keyup", keyUp, false);
}
function gameLoop(){//游戏循环
	if (can1 == null) {
		return;
	}
	requestAnimFrame(gameLoop);
	var now = Date.now();
	deltaFrameTime = now - lastFrameTime;
	lastFrameTime = now;
	if (deltaFrameTime > 40) {
		deltaFrameTime = 40;
	}
	carMovement();
	//console.log("a" + deltaFrameTime);
	drawBg();
	offsetMove += speed * 0.05;
	if (offsetMove > ground.minHeight) {
		offsetMove = ground.minHeight - offsetMove;
		startDark = !startDark;
	}
	//路中央的虚线
    drawGround(ctx1, offsetMove, color.roadLine, color.road, canvasWidth);
	
	//清空画布
	ctx2.clearRect(0, 0, canvasWidth, canvasHeight);
	drawGround(ctx2, offsetMove, color.ground, color.groundDark, canvasWidth);
    drawRoad(road.min + 6, road.max + 36, 10, color.roadLine);
    drawRoad(road.min, road.max, 10, color.road);
    drawCenterLine(3, 24, 0, "#fff");
	drawCar();
	drawHUD(ctx2, 700, 450, color.hud);
	seed -= speed;
	if (seed < 0) {
		if (hitCoin.order == 0) {
			itemOffset.coinMin = randomRange(-30, 30);
			itemOffset.coinMax = randomRange(-600, 600);
		}
		if (hitGas.order == 0) {
			itemOffset.gasMin = randomRange(-30, 30);
			itemOffset.gasMax = randomRange(-600, 600);
		}
		//保证在途中时不会切换状态
		if (hitCoin.order == 0 && hitGas.order == 0) {
			seed = randomRange(1000, 20000);

			hitGas.birth = false;
			hitCoin.birth = false;
		}
	}
	if (seed < 3000) {
		hitGas.birth = true;
	}
	if (seed < 10000) {
		hitCoin.birth = true;
	}
	drawCoin(ctx2, itemOffset.coinMin, itemOffset.coinMax, color.coin, hitCoin.birth);
	drawGas(ctx2, -itemOffset.gasMin, itemOffset.gasMax, hitGas.birth);
	drawGasBar(ctx2);
	drawScore(ctx2);
	if (leftGas <= 0) {
		keypress.up = false;
		if (speed <= 0) {
			//游戏结束
			drawEnding(ctx2);
		}
	}
}

function keyDown(e){
	move(e, true);
	if (leftGas <= 0) {
		if(e.keyCode === 38) {
			keypress.up = false;
		}
	}
}
function keyUp(e){
	move(e, false);
}
function move(e, isKeyDown){
	//解除其他键盘操作，使得能够进行赛车游戏
	if(e.keyCode >= 37 && e.keyCode <= 40) {
		e.preventDefault();
	}

	if(e.keyCode === 37) {
		keypress.left = isKeyDown;
	} 

	if(e.keyCode === 38) {
		keypress.up = isKeyDown;
	} 

	if(e.keyCode === 39) {
		keypress.right = isKeyDown;
	} 

	if(e.keyCode === 40) {
		keypress.down = isKeyDown;
	}
}

function carMovement(){
	var newCurve = 0, move = speed * 0.01;

	if (keypress.up) {
		speed += carState.accelerate * deltaFrameTime * 0.001;
		if (speed > carState.maxSpeed) {
			speed = carState.maxSpeed;
		}
	}else if (speed > 0) {
		speed -= carState.friction;
		if (speed < 0) {
			speed = 0;
		}
	}

	if (keypress.down && speed > 0) {
		speed -= carState.deAccelerate * deltaFrameTime * 0.001;
		if (speed < 0) {
			speed = 0;
		}
	}

	posxCar -= currentCurve * speed * 0.005;

	if (speed >0) {
		if (keypress.left) {
			posxCar += (Math.abs(turnCar) + 7 + (speed > speedMax / 4 ? (speedMax - (speed / 2)) : speed)) * 0.2;
			turnCar -= 1;
		}

		if (keypress.right) {
			posxCar -= (Math.abs(turnCar) + 7 + (speed > speedMax / 4 ? (speedMax - (speed / 2)) : speed)) * 0.2;
			turnCar += 1;
		}
		//没有控制的时候自动回到正中央
		if (turnCar !== 0 && !keypress.left && !keypress.right) {
			turnCar += turnCar > 0 ? -0.25 : 0.25;  
		}
	}
	if (turnCar < (0 - maxTurn)) {
		turnCar = (0 - maxTurn);
	}
	if (turnCar > maxTurn) {
		turnCar = maxTurn;
	}

	//生成路段
	roadSection -= speed;
	if (roadSection < 0) {
		roadSection = randomRange(2000, 20000);

		//这么做的原因大概是为了生成更不同的弯道吧
		//应该是尽量避免直道吧。。
		newCurve = randomRange(-80, 80);
		if (Math.abs(newCurve - curveTemp) < 30) {
			newCurve = randomRange(-80, 80);
		}

		curveTemp = newCurve;
	}

	//控制转弯
	if(currentCurve < curveTemp && move < Math.abs(currentCurve - curveTemp)) {
		currentCurve += move;
	} else if(currentCurve > curveTemp && move < Math.abs(currentCurve - curveTemp)) {
		currentCurve -= move;
	}

	//越界减速
	if (Math.abs(posxCar) > 500) {
		//如果还在加速的话，会达到一个平衡，最终使得匀速
		speed *= 0.98;
		if (speed > 0) {
			leftGas -= (Math.abs(posxCar) - 500) * 0.0002
		}
	}
	//限制车移动的范围
	posxCar = clamp(posxCar, -600, 600);
}

function drawSky(){
	ctx1.save();
	ctx1.fillStyle = color.sky;
	ctx1.fillRect(0, 0, canvasWidth, skyHeight);//画矩形
	ctx1.restore();
}

//山的左下角坐标、高度、宽度
function drawMountain(posx, posy, height, width) {
	ctx1.save();//保存之前的
	ctx1.fillStyle = color.mountains;
	ctx1.strokeStyle = color.mountains;
	ctx1.lineJoin = "round";
	ctx1.lineWidth = 30;
	ctx1.beginPath();//连续画线段
	ctx1.moveTo(posx, posy + 10);
	ctx1.lineTo(posx + (width / 2), posy + 10 - height);
	ctx1.lineTo(posx + width, posy + 10);
	ctx1.closePath();//回到起点
	ctx1.stroke();
	ctx1.fill();
	ctx1.restore();
}

function drawBg(){
	var basePos = posxCar * 0.7;
	drawSky();
	drawMountain(-570 + basePos, skyHeight, 70, 200);
	drawMountain(-400 + basePos, skyHeight, 30, 150);
	drawMountain(-200 + basePos, skyHeight, 80, 150);
	drawMountain(-100 + basePos, skyHeight, 130, 160);
	drawMountain(0 + basePos, skyHeight, 60, 200);
	drawMountain(280 + basePos, skyHeight, 40, 160);
	drawMountain(400 + basePos, skyHeight, 100, 200);
	drawMountain(550 + basePos, skyHeight, 70, 140);
	drawMountain(850 + basePos, skyHeight, 40, 200);
	drawMountain(950 + basePos, skyHeight, 70, 160);
	drawMountain(1050 + basePos, skyHeight, 40, 160);
}

function drawGround(ctx, offset, lightColor, darkColor, width) {
  var posY = (skyHeight - ground.minHeight) + offset, stepSize = 1, drawDark = startDark, firstRow = true;
  ctx.save();
  //先把浅色的涂满背景
  ctx.fillStyle = lightColor;
  ctx.fillRect(0, skyHeight, width, canvasHeight - skyHeight);
  ctx.globalCompositeOperation = "source-over";
  //涂深色区块
  ctx.fillStyle =  darkColor;
  while(posY <= canvasHeight) {
  	//计算下一个色块的宽度
    stepSize = norm(posY, skyHeight, canvasHeight) * ground.maxHeight;
    if(stepSize < ground.minHeight) {
      stepSize = ground.minHeight;
    }
  
    if(drawDark) {
      if(firstRow) {
        ctx.fillRect(0, skyHeight, width, stepSize - (offset > ground.minHeight ? ground.minHeight : ground.minHeight - offset));
      } else {
        ctx.fillRect(0, posY < skyHeight ? skyHeight : posY, width, stepSize);
      }
    }
    
    firstRow = false;
    posY += stepSize;
    drawDark = !drawDark;
  }
  ctx.restore();
}

function drawCar() {
  var carWidth = 160,
      carHeight = 50,
      carX = (canvasWidth / 2) - (carWidth / 2),
      carY = 420;

  var startX = carX, startY = 411,
      lights = [10, 26, 134, 152],
      lightsY = 0;

  ctx2.save();
  // shadow
  roundedRect(ctx2, "rgba(0,0,0,0.35)", carX - 1 + turnCar, carY + (carHeight - 35), carWidth + 10, carHeight, 9);

  // tires
  roundedRect(ctx2, "#111", carX, carY + (carHeight - 30), 30, 40, 6);
  roundedRect(ctx2, "#111", (carX - 22) + carWidth, carY + (carHeight - 30), 30, 40, 6);

  /* Front */
  roundedRect(ctx2, "#C2C2C2", startX + 6 + (turnCar * 1.1), startY - 18, 146, 40, 18);
  //车身

  ctx2.beginPath(); 
  ctx2.lineWidth = "12";
  ctx2.fillStyle = "#FFFFFF";
  ctx2.strokeStyle = "#FFFFFF";
  ctx2.moveTo(startX + 30, startY);
  ctx2.lineTo(startX + 46 + turnCar, startY - 25);
  ctx2.lineTo(startX + 114 + turnCar, startY - 25);
  ctx2.lineTo(startX + 130, startY);
  ctx2.fill();
  /* END: Front */
  
  ctx2.lineWidth="12";
  ctx2.lineCap = 'round';
  ctx2.beginPath(); 
  ctx2.fillStyle="#DEE0E2";
  ctx2.strokeStyle="#DEE0E2";
  ctx2.moveTo(startX + 2, startY + 12 + (turnCar * 0.2));
  ctx2.lineTo(startX + 159, startY + 12 + (turnCar * 0.2));
  ctx2.quadraticCurveTo(startX + 166, startY + 35, startX + 159, startY + 55 + (turnCar * 0.2));
  ctx2.lineTo(startX + 2, startY + 55 - (turnCar * 0.2));
  ctx2.quadraticCurveTo(startX - 5, startY + 32, startX + 2, startY + 12 - (turnCar * 0.2));
  ctx2.fill();
  ctx2.stroke();

  ctx2.beginPath(); 
  ctx2.lineWidth = "12";
  ctx2.fillStyle = "#DEE0E2";
  ctx2.strokeStyle = "#DEE0E2";
  ctx2.moveTo(startX + 30, startY);
  ctx2.lineTo(startX + 40 + (turnCar * 0.7), startY - 15);
  ctx2.lineTo(startX + 120 + (turnCar * 0.7), startY - 15);
  ctx2.lineTo(startX + 130, startY);
  ctx2.fill();
  ctx2.stroke();
  
  //ctx2.restore();

  roundedRect(ctx2, "#474747", startX - 4, startY, 169, 10, 3, true, 0.2);
  roundedRect(ctx2, "#474747", startX + 40, startY + 5, 80, 10, 5, true, 0.1);
  
  //画灯
  //ctx2.save();

  ctx2.fillStyle = "#FF9166";
  
  lights.forEach(function(xPos) {
    ctx2.beginPath();
    ctx2.arc(startX + xPos, startY + 20 + lightsY, 6, 0, Math.PI*2, true); 
    ctx2.closePath();
    ctx2.fill();
    lightsY += turnCar * 0.05;
  });
  
  ctx2.lineWidth = "9";
  ctx2.fillStyle = "#222222";
  ctx2.strokeStyle = "#444";
  
  roundedRect(ctx2, "#FFF", startX + 60, startY + 25, 40, 18, 3, true, 0.05);

  ctx2.restore();
}

//圆角矩形画法
function roundedRect(ctx, color, x, y, width, height, radius, turn, turneffect) {
  var skew = turn === true ? turnCar * turneffect : 0;
  
  //ctx.save();

  //ctx.globalAlpha=0.5;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x + radius, y - skew);
  
  // top right
  ctx.lineTo(x + width - radius, y + skew);
  ctx.arcTo(x + width, y + skew, x + width, y + radius + skew, radius);
  ctx.lineTo(x + width, y + radius + skew);
  
  // down right
  ctx.lineTo(x + width, (y + height + skew) - radius);
  ctx.arcTo(x + width, y + height + skew, (x + width) - radius, y + height + skew, radius);
  ctx.lineTo((x + width) - radius, y + height + skew);
  
  // down left
  ctx.lineTo(x + radius, y + height - skew);
  ctx.arcTo(x, y + height - skew, x, (y + height - skew) - radius, radius);
  ctx.lineTo(x, (y + height - skew) - radius);
  
  // top left
  ctx.lineTo(x, y + radius - skew);
  ctx.arcTo(x, y - skew, x + radius, y - skew, radius);
  ctx.lineTo(x + radius, y - skew);
  ctx.fill();

  //ctx.restore();
}

function drawRoad(min, max, squishFactor, color) {
  var basePos = canvasWidth + posxCar;
  
  ctx2.fillStyle = color;
  ctx2.beginPath();
  ctx2.moveTo(((basePos + min) / 2) - (currentCurve * 3), skyHeight);
  ctx2.quadraticCurveTo(((basePos / 2) + min) + (currentCurve / 3) + squishFactor, skyHeight + 52, (basePos + max) / 2, canvasHeight);
  ctx2.lineTo((basePos - max) / 2, canvasHeight);
  ctx2.quadraticCurveTo(((basePos / 2) - min) + (currentCurve / 3) - squishFactor, skyHeight + 52, ((basePos - min) / 2) - (currentCurve * 3), skyHeight);
  ctx2.closePath();
  ctx2.fill();
}
function drawCenterLine(min, max, squishFactor, color) {
  var basePos = canvasWidth + posxCar;
  ctx2.save();
  ctx2.globalAlpha = 1;
  ctx2.fillStyle = color;
  ctx2.globalCompositeOperation="xor";
  ctx2.beginPath();
  ctx2.moveTo(((basePos + min) / 2) - (currentCurve * 3), skyHeight);
  ctx2.quadraticCurveTo(((basePos / 2) + min) + (currentCurve / 3) + squishFactor, skyHeight + 52, (basePos + max) / 2, canvasHeight);
  ctx2.lineTo((basePos - max) / 2, canvasHeight);
  ctx2.quadraticCurveTo(((basePos / 2) - min) + (currentCurve / 3) - squishFactor, skyHeight + 52, ((basePos - min) / 2) - (currentCurve * 3), skyHeight);
  ctx2.closePath();
  ctx2.fill();
  ctx2.restore();
}

//速度表
function drawHUD(ctx, centerX, centerY, color) {
  var radius = 50, tigs = [0, 90, 135, 180, 225, 270, 315],
      angle = 90;
    ctx.save();

  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
  ctx.lineWidth = 7;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.stroke();
  
  for (var i = 0; i < tigs.length; i++) {
    drawTig(ctx, centerX, centerY, radius, tigs[i], 7);
  }
  
  // draw pointer
  angle = map(speed, 0, speedMax, 90, 480);
  //console.log("a" + angle);
  drawPointer(ctx, color, 50, centerX, centerY, angle);

  ctx.restore();
}

//指针
function drawPointer(ctx, color, radius, centerX, centerY, angle) {
  var point = getCirclePoint(centerX, centerY, radius - 20, angle),
      point2 = getCirclePoint(centerX, centerY, 2, angle + 90),
      point3 = getCirclePoint(centerX, centerY, 2, angle - 90);
  
  ctx.beginPath();
  ctx.strokeStyle = "#FF9166";
  ctx.lineCap = 'round';
  ctx.lineWidth = 4;
  ctx.moveTo(point2.x, point2.y);
  ctx.lineTo(point.x, point.y);
  ctx.lineTo(point3.x, point3.y);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.arc(centerX, centerY, 9, 0, 2 * Math.PI, false);
  ctx.fillStyle = color;
  ctx.fill();
}

//画刻度
function drawTig(ctx, x, y, radius, angle, size) {
  var startPoint = getCirclePoint(x, y, radius - 4, angle),
      endPoint = getCirclePoint(x, y, radius - size, angle)
  
  ctx.beginPath();
  ctx.lineCap = 'round';
  ctx.moveTo(startPoint.x, startPoint.y);
  ctx.lineTo(endPoint.x, endPoint.y);
  ctx.stroke();
}

//物品运动轨迹
function itemOrbit(startX, startY, finalX, finalY, PointNum, basePos) {
	
	var controlPointX = (basePos / 2) + (currentCurve / 3);
	var controlPointY = skyHeight +52;
	var item = {
		xPos : [PointNum],
		yPos : [PointNum]
	}
	for (var i = PointNum - 1; i >= 0; i--) {
		var t = i / PointNum;
		item.xPos[i] = Math.pow(1 - t, 2) * startX + 2 * (1 - t) * t * controlPointX + Math.pow(t, 2) * finalX;
		item.yPos[i] = Math.pow(1 - t, 2) * startY + 2 * (1 - t) * t * controlPointY + Math.pow(t, 2) * finalY;
	}
	return item;
}

//画硬币
function drawCoin(ctx, offsetMin, offsetMax, color, birth) {
	var basePos = canvasWidth + posxCar;
	var isHit;
	
	//如果不出硬币就没有绘画
	if (birth) {	
		//如果没有吃到硬币就过一段时间再生成硬币
		if (hitCoin.order >= 295) {
			hitCoin.alpha -= randomRange(0.001, 0.05);
			hitCoin.order = 299;
		}else{
			ctx.save();
			ctx.fillStyle = color;
			ctx.beginPath();
			//为了计算当前硬币所在的位置
			if (speed > 0) {
				hitCoin.order += speed > 10 ? Math.floor(speed * deltaFrameTime * 0.008) : 1;
			}
						
			//如果没吃到硬币
			if (!hitCoin.isHit) {
				coinPos = itemOrbit( (basePos + offsetMin) / 2 - currentCurve * 3, skyHeight, (basePos + offsetMax) / 2, canvasHeight, 300, basePos);
				//判断新的位置是不是吃到了硬币
				isHit = distance(canvasWidth / 2, 440, coinPos.xPos[hitCoin.order], coinPos.yPos[hitCoin.order], 70, 50);
				if (isHit) {
					hitCoin.isHit = true;		//吃到了硬币
					score += 10;
				}
				hitCoin.posX = coinPos.xPos[hitCoin.order];
				hitCoin.posY = coinPos.yPos[hitCoin.order];
			}else{		//如果已经吃到了硬币，硬币就会往上飘，并变透明
				hitCoin.posY -= 5;
				hitCoin.alpha -= randomRange(0.001, 0.03);
				hitCoin.order = 290;
				//往上飘一段距离后，硬币归位
				if (hitCoin.posY < 250) {
					hitCoin.posY = 0;
					hitCoin.order = 0;
				}
			}
			//硬币的透明度如果减到0则硬币归位
			if (hitCoin.alpha < 0) {
				hitCoin.order = 0;
			}else{
				//否则硬币变透明
				ctx.globalAlpha = hitCoin.alpha;
			}
			ctx.arc(hitCoin.posX, hitCoin.posY, hitCoin.order * 0.08, 0, Math.PI*2, true);
			ctx.fill();
			ctx.fillStyle = "#FF9166";
			ctx.font = hitCoin.order * 0.12 + "px Arial";
			ctx.fillText("$", hitCoin.posX - 0.03 * hitCoin.order, hitCoin.posY + 0.04 * hitCoin.order);
			ctx.restore();
		}

		//过完一段时间重新生成硬币
		if (hitCoin.alpha < -0.5) {
			hitCoin.isHit = false;
			hitCoin.alpha = 1;
			hitCoin.order = 0;
		}
	}
}

//画油桶
function drawGas(ctx, offsetMin, offsetMax, birth) {
	var basePos = canvasWidth + posxCar;
	var isHit;
	
	//如果不出就没有绘画
	if (birth) {
		//如果没有吃到汽油就过一段时间再生成汽油
		if (hitGas.order >= 295) {
			hitGas.alpha -= randomRange(0.001, 0.05);
			hitGas.order = 299;
		}else{
			ctx.save();
			//为了计算当前汽油所在的位置
			if (speed > 0) {
				hitGas.order += speed > 10 ? Math.floor(speed * deltaFrameTime * 0.008) : 1;
			}
						
			//如果没吃到汽油
			if (!hitGas.isHit) {
				gasPos = itemOrbit( (basePos + offsetMin) / 2 - currentCurve * 3, skyHeight, (basePos + offsetMax) / 2, canvasHeight, 300, basePos);
				//判断新的位置是不是吃到了汽油
				isHit = distance(canvasWidth / 2, 440, gasPos.xPos[hitGas.order] + 30, gasPos.yPos[hitGas.order] - 30, 70, 70);
				if (isHit) {
					hitGas.isHit = true;		//吃到了汽油
					leftGas += maxGas * 0.3;
					leftGas = leftGas > maxGas ? maxGas : leftGas;
				}
				hitGas.posX = gasPos.xPos[hitGas.order];
				hitGas.posY = gasPos.yPos[hitGas.order];
			}else{		//如果已经吃到了汽油，汽油就会往上飘，并变透明
				hitGas.posY -= 5;
				hitGas.alpha -= randomRange(0.001, 0.03);
				hitGas.order = 290;
				//往上飘一段距离后，汽油归位
				if (hitGas.posY < 250) {
					hitGas.posY = 0;
					hitGas.order = 0;
				}
			}
			//汽油的透明度如果减到0则汽油归位
			if (hitGas.alpha < 0) {
				hitGas.order = 0;
			}else{
				//否则汽油变透明
				ctx.globalAlpha = hitGas.alpha;
			}
			drawGasoline(ctx,hitGas.posX, hitGas.posY, hitGas.order * 0.003);
			ctx.restore();
		}

		//过完一段时间重新生成汽油
		if (hitGas.alpha < -2) {
			hitGas.isHit = false;
			hitGas.alpha = 1;
			hitGas.order = 0;
		}
	}
}
function drawGasoline(ctx, startX, startY, size){
	
	//ctx.scale(size, size);
	//轮廓
	ctx.lineWidth = 3 * size;
	ctx.fillStyle = '#000';
	ctx.beginPath();
	ctx.moveTo(startX, startY);
	ctx.lineTo(startX + 60 * size, startY);
	ctx.lineTo(startX + 60 * size, startY - 40 * size);
	ctx.lineTo(startX + 40 * size, startY - 60 * size);
	ctx.lineTo(startX, startY - 60 * size);
	ctx.closePath();
	ctx.stroke();
	ctx.fillStyle = 'red';
	ctx.fill();
	//把手
	ctx.lineJoin = "round";
	ctx.beginPath();
	ctx.moveTo(startX + 5 * size, startY - 38 * size);
	ctx.lineTo(startX + 22 * size, startY - 55 * size);
	ctx.lineTo(startX + 5 * size, startY - 55 * size);
	ctx.closePath();
	ctx.stroke();
	ctx.fillStyle = color.road;
	ctx.fill();
	//瓶盖
	ctx.beginPath();
	ctx.moveTo(startX + 45 * size, startY - 55 * size);
	ctx.lineTo(startX + 50 * size, startY - 60 * size);
	ctx.lineTo(startX + 60 * size, startY - 50 * size);
	ctx.lineTo(startX + 55 * size, startY - 45 * size);
	ctx.closePath();
	ctx.stroke();
	ctx.fillStyle = 'yellow';
	ctx.fill();
	//瓶身
	ctx.lineWidth = 7 * size;
	ctx.strokeStyle = 'yellow';
	ctx.lineCap = "round";
	ctx.beginPath();
	ctx.moveTo(startX + 20 * size, startY - 20 * size);
	ctx.lineTo(startX + 40 * size, startY - 40 * size);
	ctx.stroke();
	ctx.beginPath();
	ctx.moveTo(startX + 20 * size, startY - 40 * size);
	ctx.lineTo(startX + 40 * size, startY - 20 * size);
	ctx.stroke();
}
function drawGasBar(ctx) {
	var percent;
	leftGas -= speed * 0.001;
	if (leftGas < 0) {
		leftGas = 0;
	}
	ctx.save();
	ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
	ctx.fillRect(80,380,60,120);
	var gasBar = ctx.createLinearGradient(80, 380, 80, 500);
	gasBar.addColorStop(1,"red");
	gasBar.addColorStop(0.5,"yellow");
	gasBar.addColorStop(0,"green");
	ctx.fillStyle = gasBar;
	ctx.lineWidth = 7;
	ctx.lineJoin = "round";
	ctx.fillRect(80, 500 - 120 * leftGas / maxGas, 60, 120 * leftGas / maxGas);
	ctx.strokeStyle = '#FFF';
	ctx.strokeRect(80,380,60,120);
	ctx.fillStyle = 'rgba(255, 255, 255, 1)';
	ctx.font = "18px Arial";
	percent = leftGas / maxGas * 100;
	percent = percent.toFixed(1);
	ctx.fillText(percent + "%", 84, 400);
	ctx.restore();
}

function drawScore(ctx) {
	var temp = 0;
	score += speed / 100;
	temp = score.toFixed(0);
	//score = temp;
	ctx.save();
	ctx.fillStyle = color.road;
	ctx.font = "bold 30px Arial";
	ctx.fillText("score: " + temp, 50, 50);
	ctx.restore();
}

function drawEnding(ctx) {
	var rePlay,star,canDiv;
	//ctx, color, x, y, width, height, radius, turn, turneffect
	ctx.save();
	roundedRect(ctx, color.sky, 250, 200, 300, 200, 20, false, 0);
	ctx.fillStyle = color.road;
	ctx.font = "bold 40px Arial";
	ctx.textAlign = "center";
	ctx.fillText("Game Over", 400, 250);
	ctx.fillText("😫", 400, 300);
	ctx.font = "normal 30px Arial";
	ctx.fillText("Your Score : " + score.toFixed(0), 400, 340);

	roundedRect(ctx, color.mountains, 260, 350, 135, 40, 10, false, 0);
	roundedRect(ctx, color.lights, 405, 350, 135, 40, 10, false, 0);
	ctx.font = "bold 20px Arial";
	ctx.fillStyle = color.road;
	ctx.fillText("Play Again!", 327.5,377);
	ctx.fillText("Get Source!", 472.5,377);
	ctx.restore();
	can2.addEventListener("click", canvasClick, false);
}

function canvasClick(e) {
	var bbox = can2.getBoundingClientRect();
	var clickX = e.clientX - bbox.left;
	var clickY = e.clientY - bbox.top;
	if (clickX >= 260 && clickX <= 395 && clickY >= 350 && clickY <= 390) {
		//刷新游戏
		location.reload();
	}
	if (clickX >= 405 && clickX <= 540 && clickY >= 350 && clickY <= 390) {
		window.location.href = 'https://github.com/JackZxj/CarGame';	
	}
}

//requestAnimFrame 封装，可以兼容所有浏览器
window.requestAnimFrame = (function(){
    return  window.requestAnimationFrame       ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame    ||
            window.oRequestAnimationFrame      ||
            window.msRequestAnimationFrame     ||
            function(/* function */ callback, /* DOMElement */ element){
                window.setTimeout(callback, 1000 / 60);
            };
})();

function randomRange(min, max) {
  return min + Math.random() * (max - min);
}

function norm(value, min, max) {
  return (value - min) / (max - min);
}

function lerp(norm, min, max) {
  return (max - min) * norm + min;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
function map(value, sourceMin, sourceMax, destMin, destMax) {
  return lerp(norm(value, sourceMin, sourceMax), destMin, destMax);
}
function getCirclePoint(x, y, radius, angle) {
    var radian = (angle / 180) * Math.PI;
  
    return {
      x: x + radius * Math.cos(radian),
      y: y + radius * Math.sin(radian)
    }
}
function distance(x1, y1, x2, y2, dx, dy) {
	var x = Math.abs(x1 - x2);
	var y = Math.abs(y1 - y2);
	if (x < dx && y < dy) {
		return true;
	}
	return false;
}
})(jQuery);
