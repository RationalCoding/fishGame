//Thomas Mullen 2015

function run() {
    var canvas = document.getElementById("canvas");
    var ctx = canvas.getContext('2d');
    var b1 = document.getElementById("b1");
    var b2 = document.getElementById("b2");
    var b3 = document.getElementById("b3");
    var b4 = document.getElementById("b4");
    var b5 = document.getElementById("b5");
    var github = document.getElementById("github");

    HungerImg = new Image();
    HungerImg.src = "hungry.png"

    //-----------Customizable Paramters----------
    var columnSize = 10; //Width of columns
    var k = 0.1;
    var damping=0.8;
    var splashSize = 0.3;
    var waterLevel;

    var backAmplitude = 2;
    var backStrecth = 0.1;
    var backSpeed = 30;
    var backPhase=Math.PI*2;

    var fishSize = 10;
    var fishSpeed = 5;
    var gravity = 0.5;
    var friction = 0.8;
    var waterPull = 0.05;
    var fishSplash = 1;
    var maxFish = 100;
    var viewRadius = 200;
    var interactRadius = 7;
    var fishStarve = 0.003;
    var fishFeed = 0.6;
    var foodDrop = 9;
    var fishExplosion=30;

    var playerBoost = 2;

    var bouyancy = [0,1];
    var objectSplash = [0.3,0.3,0.3];
    var maxObjects = 400;

    var waterColor = "rgb(255,255,255)"
    var backColor = "rgb(0,0,0)"
    var fishColor = "rgb(50,50,50)"
    var deadColor = "rgb(100,100,100)"
    var objectColor = ["rgb(100,100,100)","rgb(50,50,50)",fishColor]
    var player1Color = "rgb(0,0,100)"
    var player2Color = "rgb(100,0,0)"
    //------------------------------------------

    var columns;
    var t=0;
    var backWaves = [[],[],[],[]];
    var fish = []
    var numFish = 0;

    var mouseDown = false;
    var holdTime = 0;

    var objects = []
    var numObjects = 0;

    var msX=0;
    var msY=0;
    var lastMsy=0

    var fade = 0;
    var fadeDir = 0.05;
    var textIndex = 0;
    var selected = "fish";
    var toolTip = "";
    var toolFade = 0;
    var toolFadeDir = 0.05;

    var keys = [[0,0,0,0,0],[0,0,0,0,0]];
    var playerCount = 0;

    var mobile = false;
    var windowSize = [window.innerWidth,window.innerHeight];
    var clickedGithub = false;

    var scwDesigned = 1280;

    var r=100,g=100,b=100; //For rainbow water

    function init() {
        //Full screen
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        waterLevel = canvas.height/2;

        //Initialize columns with height, velocity
        columns = Array(parseInt(canvas.width/columnSize)+4);
        for (i=0;i<columns.length;i++){
            columns[i]=[waterLevel,0];
        }

        //Initialize background waves
        for (i=0;i<10;i++){
            backWaves[i] = [backAmplitude*Math.random(),backStrecth*(Math.random()-0.5),backSpeed*(Math.random()-0.5),backPhase*(Math.random()-0.5)];
        }

        if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) )
        {
            mobile =true;
        }
    }


    function update(){
        //Water simulation in 1D
        t+=1; //Time variable

        if (mouseDown){
            holdTime++;
            if (holdTime % 3 == 0){
                clickf();
                mouseDown=true;
            }
        }else{
            holdTime=0;
        }

        for (i=0;i<columns.length;i+=1){
            left = (i-1);
            if (left < 0){
                left = columns.length-1;
            }
            right = (i+1);
            if (right > columns.length - 1){
                right = 0;
            }

            //F = -kx
            F= -k*(3*columns[i][0] - columns[left][0] - columns[right][0] - waterLevel)

            columns[i][1] = columns[i][1]*damping + F; //v=at

            newHeight = columns[i][0]+columns[i][1]; //h=vt

            //Limit via canvas
            if (newHeight < canvas.height && newHeight > canvas.height/3){
                columns[i][0]=newHeight;
            }
            else{
                columns[i][1]+=-k*(columns[i][0]-waterLevel);
                columns[i][0]+=columns[i][1];
            }
        }

        //Github rainbow water
        if (clickedGithub){
            r = mod(Math.abs(r+2*(Math.random()-0.5)),255);
            g = mod(Math.abs(g+2*(Math.random()-0.5)),255);
            b = mod(Math.abs(b+2*(Math.random()-0.5)),255);
            waterColor = "rgb("+parseInt(r)+","+parseInt(g)+","+parseInt(b)+")";
        }

        //Change background waves from time to time
        if (t%50==0){
            backWaves[parseInt(Math.random()*10)][-1]+=(Math.random()-0.5)
        }
        simulate();
        draw();
    }

    function makeSplash(pos,size){
        pos = pos //Small correction
        L = columns.length
        i2 = parseInt(pos/columnSize);
        columns[mod(i2,L)][1]+=size;
        columns[mod(i2-1,L)][1]+=size*0.9
        columns[mod(i2+1,L)][1]+=size*0.9
        columns[mod(i2-2,L)][1]+=size*0.7
        columns[mod(i2+2,L)][1]+=size*0.7
        columns[mod(i2-3,L)][1]+=size*0.3
        columns[mod(i2+3,L)][1]+=size*0.3
    }

    function mod(a,b){
        //Modulo corrected for negative numbers
        c = a%b;
        if (c<0){
            c+=b
        }
        return c;
    }

    function backgroundWave(pos){
        //Background waves are merely for show
        a=0;
        for (i2=0;i2<10;i2++){
            a+=backWaves[i2][0]*Math.sin(backWaves[i2][1]*(pos*columnSize+backWaves[i2][2]*t+backWaves[i2][3]));
        }
        return a;
    }

    function mouseMove(e){
        lastMsy = msY;
        msX = e.clientX;
        msY = e.clientY;
        if (canvas.height - columns[i][0] > msY){return;}
        makeSplash(e.clientX,splashSize*(lastMsy-msY));
    }

    function clickf(){
        mouseDown = false; //Raised mouse
        if (selected == "fish"){
            makeFish(msX,msY,false,-1,fishSize*(Math.random()+0.5));
        }
        else if (selected == "food"){
            makeObject(msX,msY,0,0,0);
        }
        else if (selected == "barrels"){
            makeObject(msX,msY,0,0,1);
        }
        else if (selected == "shark"){
            makeFish(msX,msY,true,-1,fishSize*(Math.random()+0.5));
        }
        else if (selected == "player" && playerCount < 2){
            makeFish(msX,msY,false,playerCount,fishSize*(Math.random()+0.5));
            playerCount=mod(playerCount+1,2);
        }
    }

    function keydown(e){
        e.preventDefault();
        if (e.keyCode == 37){ //left
            keys[0][0]=1
        }else if (e.keyCode == 39){ //right
            keys[0][1]=1
        }else if (e.keyCode == 38){ //up
            keys[0][2]=1
        }else if (e.keyCode == 40){ //down
            keys[0][3]=1
        }else if (e.keyCode == 65){ //a
            keys[1][0]=1
        }else if (e.keyCode == 68){ //d
            keys[1][1]=1
        }else if (e.keyCode == 87){ //w
            keys[1][2]=1
        }else if (e.keyCode == 83){ //s
            keys[1][3]=1
        }

        else if (e.keyCode == 16){ //shift
            keys[0][4]=1
        }else if (e.keyCode == 32){ //space
            keys[1][4]=1
        }
    }

    function keyup(e){
        e.preventDefault();
        if (e.keyCode == 37){ //left
            keys[0][0]=0
        }else if (e.keyCode == 39){ //right
            keys[0][1]=0
        }else if (e.keyCode == 38){ //up
            keys[0][2]=0
        }else if (e.keyCode == 40){ //down
            keys[0][3]=0
        }else if (e.keyCode == 65){ //left
            keys[1][0]=0
        }else if (e.keyCode == 68){ //right
            keys[1][1]=0
        }else if (e.keyCode == 87){ //up
            keys[1][2]=0
        }else if (e.keyCode == 83){ //down
            keys[1][3]=0
        }

        else if (e.keyCode == 16){ //shift
            keys[0][4]=0
        }else if (e.keyCode == 32){ //space
            keys[1][4]=0
        }
    }

    function hyp(a,b){
        //hyptotenus

        c = Math.sqrt(Math.pow(a,2)+Math.pow(Math.abs(b),2));
        if (c==0 || c==NaN ){
            return 100000000; //Out of range (all minimums will return false)
        }
        else{
            return c;
        }
    }

    function showToolTip(text){
        toolTip = text;
        toolFadeDir = 0.1;
        toolFade = 0;
    }


    function makeObject(x,y,vx,vy,typeOfObject){
        if (numObjects < maxObjects){
            //x,y,vx,vy,type,special
            objects.push([0,0,0,0,0,0]);
            objects[numObjects][0] = x;
            objects[numObjects][1] = y;
            objects[numObjects][2] = vx;
            objects[numObjects][3] = vy;
            objects[numObjects][4] = typeOfObject;
            numObjects++;
        }
    }

    function makeFish(x,y,shark,player,size){
        if (numFish < maxFish){
            fish.push([x,y,0,0,0,0,size,Math.random(),player,1+Math.random()]);
            fish[numFish][4] = 3*fishSpeed*(Math.random()-0.5)/fish[i][6];
            fish[numFish][5] = fishSpeed*(Math.random()-0.5)/fish[i][6];
            if (shark){
                fish[numFish][6] = 20;
            }
            numFish++;
        }
    }

    function simulate(){ //Simulates fish and objects
        //Tiny fish because why not
        for (i=0;i<numFish;i++){
            myWater = columns[mod(parseInt(fish[i][0]/columnSize),columns.length)];
            fish[i][0] = mod(fish[i][0],canvas.width);

            localWaterHeight = canvas.height - myWater[0]

            if (fish[i][1] < localWaterHeight){
                //Fish out of water!
                fish[i][3]+= gravity;
            }
            else{
                fish[i][3]=fish[i][3]*friction - (myWater[1]*waterPull);

                fish[i][3]+=fish[i][5]; //Move on own accord
                fish[i][2]=fish[i][2]*friction + fish[i][4];
            }
            fish[i][0]+=fish[i][2];
            newHeight = fish[i][1]+fish[i][3];
            surface1 = (fish[i][1] > localWaterHeight);
            surface2 = (newHeight > localWaterHeight)
            if ((surface1 || surface2) && !(surface1 && surface2)){
                //Crossed over the fluid boundary, make a splash
                makeSplash(fish[i][0],fish[i][3]*fishSplash);
            }

            if (newHeight < canvas.height){
                fish[i][1]=newHeight;
            }
            else{
                fish[i][3] = 0;
                fish[i][5]= -fishSpeed/fish[i][6];
            }

            //Behaviour
            minObject = 0
            minDist = 1000000;
            direction = 1;
            if (fish[i][9] > 0){
                if (fish[i][6] < 20){ //Max fish size
                    //Find nearest food
                    if (fish[i][9] < 0.5 || fish[i][8]!=-1){
                        for (i2=0;i2<numObjects;i2++){
                            if (objects[i2][4] == 0){
                                dist = hyp(objects[i2][0]-fish[i][0],fish[i][1]-objects[i2][1]);
                                if (dist < interactRadius){
                                    //Eat the food
                                    if (fish[i][9] < 1.5){fish[i][9]+=fishFeed;}
                                    objects.splice(i2,1)
                                    numObjects--;
                                    minObject = 0;
                                    fish[i][6]+=1;
                                    break;
                                }
                                if (dist < minDist){
                                    minDist = dist;
                                    minObject=objects[i2];
                                    direction=1;
                                }
                            }
                        }
                    }

                    //Flee carnivores
                    for (i2=0;i2<numFish;i2++){
                        if (i2 != i && fish[i2][6] >= 20){
                            dist = hyp(fish[i2][0]-fish[i][0],fish[i2][1]-fish[i][1]);
                            if (dist < 0.1){
                                //Infinity crash prevention
                                continue;
                            }
                            if (dist/2 < minDist && dist < viewRadius && (fish[i2][9] <= 0.5 || dist < viewRadius/3) && fish[i][9]>0.2){
                                direction=-2; //book it
                                minDist = dist;
                                minObject=fish[i2];
                            }
                        }
                    }

                    //Little fish can have babies
                    if (numFish < maxFish-20 && Math.random() > 0.999){
                        makeFish(fish[i][0],fish[i][1],false,fish[i][8],4);
                    }

                }
                else{
                    //Carnivorous fish
                    //Find nearest small fish
                    for (i2=0;i2<numFish;i2++){
                        if ((fish[i2][6] < 20 || fish[i2][9] <=0) && (fish[i][9] < 0.5 || fish[i][8]!=-1)){
                            dist = hyp(fish[i2][0]-fish[i][0],fish[i2][1]-fish[i][1]);
                            if (dist < interactRadius){
                                //Makes some food fly out too
                                for (i3=0;i3<foodDrop;i3++){
                                    makeObject(fish[i2][0],fish[i2][1],fishExplosion*(Math.random()-0.5),7*(Math.random()-0.5),0);
                                }

                                //Eat the fish
                                if (fish[i][9] < 1.5){fish[i][9]+=fishFeed;}
                                fish.splice(i2,1)
                                if (i2 < i){
                                    i--;
                                }
                                numFish--;
                                minObject = 0;

                                break;
                            }
                            if (dist < minDist){
                                direction=1;
                                if (dist < viewRadius){direction = 4;} //book it
                                minDist = dist;
                                minObject=fish[i2];
                            }
                        }
                    }
                }
            }
            fish[i][9]-=fishStarve; //fish need to be fed
            if (fish[i][9] < -0.2){
                //Dead fish turns into food
                for (i3=0;i3<foodDrop;i3++){
                    makeObject(fish[i][0],fish[i][1],fishExplosion*(Math.random()-0.5),7*(Math.random()-0.5),0);
                }
                fish.splice(i,1);
                numFish--;

            }else if (fish[i][9] <= 0){
                //Fish died :(
                fish[i][4] = 0;
                fish[i][5] = -0.3; // float to the top
            }else if (fish[i][8] != -1){

                if (keys[fish[i][8]][4] == 0){
                    boost = 1
                }
                else{
                    boost = playerBoost
                }
                fish[i][4]= boost*3*keys[fish[i][8]][0]*-fishSpeed/(fish[i][6])
                fish[i][4]+=boost*3*keys[fish[i][8]][1]*fishSpeed/(fish[i][6])
                fish[i][5]= boost*3*keys[fish[i][8]][2]*-fishSpeed/(fish[i][6])
                fish[i][5]+=boost*3*keys[fish[i][8]][3]*fishSpeed/(fish[i][6])
            }else if (minObject != 0){
                //Go to target
                fish[i][4] = direction*fishSpeed*(minObject[0]-fish[i][0])/(minDist*fish[i][6]);
                fish[i][5]= direction*fishSpeed*(minObject[1]-fish[i][1])/(minDist*fish[i][6]);

            }else if (Math.random() > 0.95){
                //Random wandering
                fish[i][4] = 3*fishSpeed*(Math.random()-0.5)/fish[i][6];
                fish[i][5] = fishSpeed*(Math.random()-0.5)/fish[i][6];
            }
        }

        for (i=0;i<numObjects;i++){
            myWater = columns[mod(parseInt(objects[i][0]/columnSize),columns.length)];
            objects[i][0] = mod(objects[i][0],canvas.width);

            localWaterHeight = canvas.height - myWater[0]

            if (objects[i][1] < localWaterHeight){
                objects[i][3]+= gravity;
            }
            else{
                objects[i][2]=objects[i][2]*friction+(Math.random()-0.5)/2 //Drift
                objects[i][3]=objects[i][3]*friction - (myWater[1]*waterPull) - bouyancy[objects[i][4]]
                if (objects[i][4] == 0){
                    objects[i][3]+=(Math.random()-0.5)/3 //Drift y for food
                }
            }
            objects[i][0]+=objects[i][2];
            newHeight = objects[i][1]+objects[i][3];

            surface1 = (objects[i][1] > localWaterHeight);
            surface2 = (newHeight > localWaterHeight)
            if ((surface1 || surface2) && !(surface1 && surface2)){
                //Crossed over the fluid boundary, make a splash
                makeSplash(objects[i][0],objects[i][3]*objectSplash[objects[i][4]]);
            }


            if (newHeight < canvas.height){
                objects[i][1]=newHeight;
            }
            else{
                objects[i][3] = -1;
            }
        }
    }

    function drawObjects(type){
        //Draw objects
        for (i=0;i<numObjects;i++){
            if (objects[i][4]==type){
                ctx.beginPath();
                ctx.strokeStyle = objectColor[objects[i][4]];
                ctx.fillStyle = ctx.strokeStyle;
                if (objects[i][4] == 1){
                    ctx.rect(objects[i][0]-15,objects[i][1]-40,30,60);
                    ctx.fill()
                    ctx.moveTo(objects[i][0]-13,objects[i][1]-40)
                    ctx.lineTo(objects[i][0],objects[i][1]-60)
                    ctx.lineTo(objects[i][0]+12,objects[i][1]-40)
                    ctx.moveTo(objects[i][0]-13,objects[i][1]-40)
                    ctx.lineTo(objects[i][0],objects[i][1]-80)
                    ctx.lineTo(objects[i][0]+12,objects[i][1]-40)
                    ctx.stroke()
                    //Flashing bouy light

                    if (objects[i][5]==1){
                        if (mod(t,20)==0){
                            objects[i][5]=0;
                        }
                        ctx.fillStyle = "rgb(0,0,0)"
                    }
                    else{
                        if (mod(t,20)==0){
                            objects[i][5]=1;
                        }
                        ctx.fillStyle = "rgb(255,0,0)"
                    }
                    ctx.beginPath()
                    ctx.arc(objects[i][0],objects[i][1]-80,5,0,Math.PI*2);
                    ctx.fill()
                }
                if (objects[i][4] == 0){
                  ctx.arc(objects[i][0],objects[i][1],4,0,Math.PI*2);
                  ctx.fill()
                }
            }
        }
    }


    function draw() {
        //Draw background
        ctx.fillStyle = backColor; //Black
        ctx.fillRect(0,0,canvas.width,canvas.height); //Clear canvas

        //Background objects
        drawObjects(1);

        //Draw water
        ctx.beginPath();
        ctx.lineCap="round";
        ctx.lineJoin = "round";
        ctx.lineWidth=15
        ctx.moveTo(0,canvas.height-columns[0][0])
        for (i=1;i<columns.length;i+=1){ //Iterate across column columns
            ctx.lineTo(i*columnSize,canvas.height-columns[i][0]-backgroundWave(i))
        }
        ctx.lineTo(canvas.width,canvas.height);
        ctx.lineTo(0,canvas.height);
        ctx.lineTo(0,canvas.height-columns[1][0]);
        ctx.save();
        grd=ctx.createLinearGradient(0,canvas.height-waterLevel,0,canvas.height);
        grd.addColorStop(0,waterColor);
        grd.addColorStop(1,"black");
        ctx.fillStyle=grd;
        ctx.strokeStyle=grd;
        ctx.fill();
        ctx.stroke();

        //Foreground objects
        drawObjects(0);

        //Draw fish
        ctx.fillStyle = fishColor;
        ctx.strokeStyle = fishColor;
        ctx.lineWidth=6
        for (i=0;i<numFish;i++){
            if (fish[i][9]<= 0){
                //Dead fish :(
                ctx.fillStyle = deadColor;
                ctx.strokeStyle = deadColor;
                if (fish[i][8]!=-1){
                    fish[i][8]=-1;
                }
            }
            else if (fish[i][8]==0){
                //players are different color
                ctx.fillStyle = player1Color;
                ctx.strokeStyle = player1Color;
            }else if (fish[i][8]==1){
                //players are different color
                ctx.fillStyle = player2Color;
                ctx.strokeStyle = player2Color;
            }
            size = fish[i][6];
            if (fish[i][9]<0.5 && fish[i][9] > 0){
                ctx.drawImage(HungerImg,fish[i][0]-10,fish[i][1]-size-23,20,20);
            }
            ctx.beginPath();
            ctx.arc(fish[i][0],fish[i][1],size,0,2*Math.PI)
            ctx.fill()
            ctx.beginPath()
            ctx.moveTo(fish[i][0],fish[i][1])
            antiAlias =fish[i][7];
            if (fish[i][4] < 0){ //direction of fish
                //Animated fin flapping
                ctx.lineTo(fish[i][0]+(Math.abs(Math.sin(fish[i][2]*t/30+antiAlias))+1)*size,fish[i][1]+size);
                ctx.lineTo(fish[i][0]+(Math.abs(Math.sin(fish[i][2]*t/30+15+antiAlias))+1)*size,fish[i][1]-size);
            }
            else{
                ctx.lineTo(fish[i][0]-(Math.abs(Math.sin(fish[i][2]*t/30+antiAlias))+1)*size,fish[i][1]+size);
                ctx.lineTo(fish[i][0]-(Math.abs(Math.sin(fish[i][2]*t/30+12+antiAlias))+1)*size,fish[i][1]-size);
            }
            ctx.closePath();
            ctx.stroke();
            ctx.fill();

            if (fish[i][6] >= 20){
                //Carnivourous fish fin
                ctx.beginPath();
                ctx.moveTo(fish[i][0]-16,fish[i][1]-5);
                ctx.lineTo(fish[i][0],fish[i][1]-25);
                ctx.lineTo(fish[i][0]+16,fish[i][1]-5);
                ctx.stroke();
                ctx.fill();
            }

            if (ctx.fillStyle!=fishColor){
                //return to proper color
                ctx.fillStyle = fishColor;
                ctx.strokeStyle = fishColor;
            }
        }

        if (window.innerWidth != windowSize[0] || window.innerHeight != windowSize[1]){
            //Page resized, reload
            window.location.reload();
        }

        //Text
        fade+=fadeDir;
        if (fade > 1.9){
            fadeDir=-0.05;
        }
        if (fade < 0){
            fadeDir=0.05;
            textIndex++;
        }

        screenRatio = window.innerWidth/scwDesigned

        ctx.font = screenRatio* 50+"px MyFont";
        ctx.weight = "bolder";
        ctx.fillStyle = "rgba(255,255,255,"+fade+")";
        ctx.textAlign = "center";

        if (mobile){
            ctx.fillText("No mobile yet :(",0,0);
            return;
        }

        if (textIndex == 0){ctx.fillText("Welcome to Grey Scales", canvas.width/2, canvas.height*0.28);}
        if (textIndex == 1){ctx.fillText("A simulation game by Thomas Mullen", canvas.width/2, canvas.height*0.28);}
        if (textIndex == 2){ctx.fillText("The water is disturbed by mouse movement", canvas.width/2, canvas.height*0.28);}
        if (textIndex == 3){ctx.fillText("Click and hold to drop objects", canvas.width/2, canvas.height*0.28);}
        if (textIndex == 4){ctx.fillText("The buttons at the top will change what you drop", canvas.width/2, canvas.height*0.28);}
        if (textIndex == 5){ctx.fillText("There are many secrets to discover...", canvas.width/2, canvas.height*0.28);}
        if (textIndex == 6){ctx.fillText("Enjoy!", canvas.width/2, canvas.height*0.28);}


        toolFade+=toolFadeDir;
        if (toolFade > 2){
            toolFadeDir=-0.02;
        }
        if (toolFade < 0){
            toolFadeDir=0;
        }

        if (toolTip != ""){
            ctx.font = screenRatio* 35+"px MyFont";
            if (toolTip == "Thanks for visiting my GitHub!"){
                ctx.fillStyle = "rgb(150,150,150)";
            }else{
                ctx.fillStyle = "rgba(150,150,150,"+toolFade+")";
            }
            ctx.fillText(toolTip, canvas.width/2, canvas.height*0.17);
        }
    }

    init();
    canvas.addEventListener('mousemove',mouseMove);
    canvas.addEventListener('click', clickf);
    canvas.addEventListener('mousedown', function(e){mouseDown=true; e.preventDefault();}, false);
    b1.addEventListener('click', function(){selected="fish";showToolTip("Tiny fish that need care");});
    b2.addEventListener('click', function(){selected="food";showToolTip("Food for your fish");});
    b3.addEventListener('click', function(){selected="barrels";showToolTip("Buoys that bob on the seas");});
    b4.addEventListener('click', function(){selected="shark";showToolTip("Aggresive fish");});
    b5.addEventListener('click', function(){selected="player";showToolTip("Arrow+Shift keys for blue, WASD+Space for red");});
    github.addEventListener('click', function(){clickedGithub=true;showToolTip("Thanks for visiting my GitHub!")});

    document.addEventListener("keydown", keydown);
    document.addEventListener("keyup", keyup);

    window.setInterval(update,50);
}
run();


/*!
 * jQuery UI Touch Punch 0.2.3
 *
 * Copyright 2011–2014, Dave Furfero
 * Dual licensed under the MIT or GPL Version 2 licenses.
 *
 * Depends:
 *  jquery.ui.widget.js
 *  jquery.ui.mouse.js
 */
!function(a){function f(a,b){if(!(a.originalEvent.touches.length>1)){a.preventDefault();var c=a.originalEvent.changedTouches[0],d=document.createEvent("MouseEvents");d.initMouseEvent(b,!0,!0,window,1,c.screenX,c.screenY,c.clientX,c.clientY,!1,!1,!1,!1,0,null),a.target.dispatchEvent(d)}}if(a.support.touch="ontouchend"in document,a.support.touch){var e,b=a.ui.mouse.prototype,c=b._mouseInit,d=b._mouseDestroy;b._touchStart=function(a){var b=this;!e&&b._mouseCapture(a.originalEvent.changedTouches[0])&&(e=!0,b._touchMoved=!1,f(a,"mouseover"),f(a,"mousemove"),f(a,"mousedown"))},b._touchMove=function(a){e&&(this._touchMoved=!0,f(a,"mousemove"))},b._touchEnd=function(a){e&&(f(a,"mouseup"),f(a,"mouseout"),this._touchMoved||f(a,"click"),e=!1)},b._mouseInit=function(){var b=this;b.element.bind({touchstart:a.proxy(b,"_touchStart"),touchmove:a.proxy(b,"_touchMove"),touchend:a.proxy(b,"_touchEnd")}),c.call(b)},b._mouseDestroy=function(){var b=this;b.element.unbind({touchstart:a.proxy(b,"_touchStart"),touchmove:a.proxy(b,"_touchMove"),touchend:a.proxy(b,"_touchEnd")}),d.call(b)}}}(jQuery);
