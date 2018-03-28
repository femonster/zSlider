function setTransform(element, value, key) {
    key = key || "Transform";
    try {
        ["moz", "o", "ms", "webkit", ""].forEach(function(prefix) {
            element.style[prefix + key] = value;
        });

    } catch (e) {
        console.log(e);
    }
    return element;
}

function $(selector, context) {
    var domArray = (context || document).querySelectorAll(selector);
    return domArray.length === 1 || domArray.length === 0 ? domArray[0] : domArray;
}

var currentPos = 0; //记录当前页面的位置（px）
var currentPoint = -1; //记录当前点的位置（？）
var pageNow = 1; //当前页码
var points = null; //页码数

var slider = {
    pageNow:0,
    transform: function(obj,translate) {
        setTransform(obj, "translate3d(" + translate + "px, 0, 0)", "transform");
        currentPos = translate;
    },
    setSliderWidth: function(obj) {
        var items = Array.prototype.slice.call(obj.children);
        var itemW = document.body.offsetWidth || document.documentElement.offsetWidth;
        var wrapW = 0;
        var points = items.length;

        items.forEach(function(item, index) {
            console.log(item);
            item.style.width = itemW + "px";
            wrapW += itemW;
        })
        obj.style.width = wrapW + "px";
        this.bindEvent(obj,points);

    },
    setPageNow:function(p){
        var pageUl = $(".slider-page");
        var pageli = $(".item-page",pageUl);

        Array.prototype.slice.call(pageli).forEach(function(item,index){
            item.classList.remove("now");
        })
        pageli[p-1].classList.add("now");
    },
    bindEvent: function(box,points) {
        var pageW = window.innerWidth; //页面宽度
        var maxWidth = - pageW * (points-1); //页面滑动最后一页的位置
        var isTouchEnd = true; //当前滑动是否结束
        var startPos = 0; //手指按下时的滑块位置
        var startT = 0;  //手指摁下是的开始时间
        var isMove = false; //是否发生左右滑动
        var startX,startY;
        var direct = "l"; //滑动的方向
        var moveLen = 0; //手指当前滑动的距离

        box.addEventListener("touchstart", function(e) {
            e.preventDefault();
            if(e.touches.length==1||isTouchEnd){
                var touch = e.touches[0];
                startX = touch.pageX;
                startY = touch.pageY;
                startPos = currentPos; //本次滑动前的初始位置
                box.style.webkitTransition = "";
                startT = new Date().getTime(); //手指按下的开始时间
                isMove = false; //是否产生滑动
                isTouchEnd = false; //当前滑动开始
            }

        }.bind(this),false);

        document.addEventListener("touchmove",function(e){
            // e.preventDefault();

            // 如果当前滑动已结束，不管其他手指是否在屏幕上都禁止move事件
            if(isTouchEnd) return;

            var touch = e.touches[0];
            // 位移
            var deltaX = touch.pageX - startX;
            var deltaY = touch.pageY - startY;

            // 如果x方向上的位移大于y方向上的位移，则认为左右滑动
            if(Math.abs(deltaX)>Math.abs(deltaY)){
                moveLen = deltaX;
                var translate = startPos + deltaX; //当前需要滑动到的位置
                if(translate<=0 && translate >=maxWidth){
                    
                    this.transform(box,translate);
                    isMove = true;
                }
                direct = deltaX>0?"r":"l"; //判断手指滑动方向
            }
        }.bind(this),{passive: true});

        document.addEventListener("touchend",function(e){
            e.preventDefault();
            var translate = 0;
            // 计算手指在屏幕上停留的时间
            var deltaT = new Date().getTime() - startT;
            // 发生了滑动，并且当前滑动时间未结束
            if(isMove && !isTouchEnd){
                isTouchEnd = true; //标记当前完整的滑动事件已完成（s,m,e）
                
                // 使用动画过渡让页面滑动到最终位置
                box.style.webkitTransition = "0.3s ease -webkit-transform";
                // 如果停留时间小于300ms，则认为快速滑动，继续过渡到下一页
                if (deltaT < 300) {
                    translate = direct == "l"?
                    currentPos+(-(pageW+moveLen)):currentPos+pageW-moveLen;
                    // 边界判断
                    translate = translate>0?0:translate;
                    translate = translate<maxWidth?maxWidth:translate;
                }else{
                    // 如果滑动距离 < 屏幕宽的50%，则退回上一页
                    if(Math.abs(moveLen)/pageW<0.5){
                        translate = currentPos - moveLen;
                    }else{
                        // 如果滑动距离 > 屏幕宽的50%，则滑动到下一页
                        translate = direct == "l"?
                        currentPos+(-(pageW+moveLen)):currentPos+pageW-moveLen;
                        // 边界判断
                        translate = translate>0?0:translate;
                        translate = translate<maxWidth?maxWidth:translate;
                    }
                }

                // 滑动
                this.transform(box,translate);
                // 当前页码
                this.pageNow = pageNow = Math.round(Math.abs(translate)/pageW)+1;

                this.setPageNow(pageNow);
            }
        }.bind(this),false);

    },
    init: function() {
        var wraps = $(".slider");
        this.setSliderWidth(wraps);
    }

}

slider.init();