//Thomas Mullen 2015

//Hackable scaling for all elements in any html container, body, div, etc.
//Allows you to design for one resolution and then forget the rest. (Needs to be manually changed right now)


//I couldn't find a satisfying alternative.


//------------------------------------------------------
var scw = 1280; //This is the resolution the page is designed for
var sch = 800;
var divID = "background"; //The id of the container
//------------------------------------------------------

var elem = document.getElementById(divID).querySelectorAll("*");
var originalStyle = [];


function getStyle(el,styleProp,unit)
{
	return getComputedStyle(el).getPropertyValue(styleProp).slice(0,-unit.length);
}

for (i=0;i<elem.length;i++){
    originalStyle[i]=[
        //---------------------------------------
        getStyle(elem[i],"margin-left","px"),
        getStyle(elem[i],"font-size","px"),
        getStyle(elem[i],"padding-left","px")
        //---------------------------------------
    ];
}

function update(percX,percY){
    for (i=0;i<elem.length;i++){
        //----------------------------------------------------------
        elem[i].style.marginLeft = originalStyle[i][0]*percX+"px";
        elem[i].style.fontSize = originalStyle[i][1]*percX+"px";
        elem[i].style.paddingLeft = originalStyle[i][2]*percX+"px";
        //----------------------------------------------------------
    }
}

function resizeEvent(){
    //Screen has been resized!
    new_scw = window.innerWidth;
    new_sch = window.innerHeight;

    update(new_scw/scw,new_sch/sch);
}

//window.addEventListener('resize', resizeEvent, true); Not needed because wave.js refreshes on resize
resizeEvent();
