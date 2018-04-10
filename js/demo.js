/**
 * @module wap slider
 * @date 2018/04/08
 * @description 原生移动端slider插件
 * @author gengkai.zhang
 * @email  gengkai.zhang@renren-inc.com
 */

// Object.assign polyfill
if (typeof Object.assign != 'function') {
    // Must be writable: true, enumerable: false, configurable: true
    Object.defineProperty(Object, "assign", {
        value: function assign(target, varArgs) { // .length of function is 2
            'use strict';
            if (target == null) { // TypeError if undefined or null
                throw new TypeError('Cannot convert undefined or null to object');
            }

            var to = Object(target);

            for (var index = 1; index < arguments.length; index++) {
                var nextSource = arguments[index];

                if (nextSource != null) { // Skip over if undefined or null
                    for (var nextKey in nextSource) {
                        // Avoid bugs when hasOwnProperty is shadowed
                        if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
                            to[nextKey] = nextSource[nextKey];
                        }
                    }
                }
            }
            return to;
        },
        writable: true,
        configurable: true
    });
}

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

/**
opts = {
    wrap:父容器，
    pageWrap: 下标容器，
    page: boolean 是否显示下标
    loop: boolean 是否无限循环
    auto: boolean 是否自动滚动，只有在 loop == true 时设置有效
    autoTime: 1000 自动循环时间 单位ms , 只有在 loop == true 时设置有效
}

this.goNext(trans) : 下一页
this.goPrev(trans) : 上一页
this.goOne(p,trans)  : 某一页(p为页码，trans为过渡时间,单位s ，可不传)
this.getNowPage : 获取当前页

this.currPos : 记录当前页面的位置（px）
this.points ：记录页码数

*/

function Zslider(opts) {
    this.defultOpts = {
        wrap: ".z-wrap",
        loop: false,
        auto:false,
        autoTime:3000
    };
    this.options = Object.assign({}, this.defultOpts, opts);
    this.currPos = 0;//初始位置信息[不循环情况下的值]
    this.busy = false; //是否正在滑动（在忙）
    this.timer = null;//自动播放的timer
    this.index = 0;  // slider中元素索引
    this.points = 0;
    this.scroll_time = 300;
    this.checkOptions().checkloop().setSliderWidth().auto_scroll();

}

Zslider.prototype.transform = function(translate) {
    setTransform(this.moveBox, "translate3d(" + translate + "px, 0, 0)", "transform");
    this.currPos = translate;
};

// 加过渡
Zslider.prototype.addTransition = function(ani) {
    ani = ani == 0 ? 0 : ( ani || this.scroll_time );
    this.moveBox.style.transition = "transform "+ani+"ms ease";
    this.moveBox.style.webkitTransition = "-webkit-transform "+ani+"ms ease";
};

// 清除过渡
Zslider.prototype.removeTransition = function() {
    this.moveBox.style.transition = "transform 0s";
    this.moveBox.style.webkitTransition = "transform 0s";
};

// 查看容器元素是否存在（ok）
Zslider.prototype.checkOptions = function() {
    if (!document.querySelector(this.options.wrap) || !document.querySelector(this.options.wrap).children[0]) {
        throw new Error('element is required');
    }
    this.oWrap = document.querySelector(this.options.wrap);// slider的容器元素
    this.moveBox = this.oWrap.children[0]; //slider元素
    this.oWrap.style.opacity = 0;
    return this
};

// 循环滚动（ok）
Zslider.prototype.checkloop = function(){
   
    this.oneMoveWidth = this.oWrap.offsetWidth; //一次滚动的宽度
    
    this.points = this.moveBox.children.length; //slider的总张数

    this.minLeft = -this.oWrap.offsetWidth * (this.points - 1); //最小left值，注意是负数[不循环情况下的值]

    this.maxLeft = 0;//最大lfet值[不循环情况下的值]

    if(this.options.loop){
        // 初始化信息【循环条件下】
        this.currPos = -this.oneMoveWidth;

        this.minLeft = -this.oneMoveWidth * this.points;

        this.maxLeft = -this.oneMoveWidth;

        this.transform(this.currPos,0);

        var oWrap = this.moveBox;

        var ocloneWrap = oWrap.cloneNode(true);
        
        var aLi = ocloneWrap.children;
        
        // 前后各克隆一个
        oWrap.insertBefore(ocloneWrap.children[aLi.length-1].cloneNode(true),oWrap.children[0]);
       
        oWrap.appendChild(ocloneWrap.children[0].cloneNode(true));
    }

    return this;
};

// 设置宽度(ok)
Zslider.prototype.setSliderWidth = function() {

    var items = Array.prototype.slice.call(this.moveBox.children),
        itemW = this.oneMoveWidth,
        moveBoxW = 0;   
    items.forEach(function(item, index) {
        item.style.width = itemW + "px";
        moveBoxW += itemW;
    });

    this.moveBox.style.width = moveBoxW + "px";
    this.oWrap.style.opacity = 1;
    this.bindEvent();
    return this;
};

Zslider.prototype.bindEvent = function() {
    this.point_x = null; //记录一个x坐标
    this.point_y = null; //记录一个y坐标
    this.direct = ''; //记录向哪边滑动
    this.moveLen = 0; //手指当前滑动距离
    this.startT = 0; //手指摁下时的开始时间
    //this.isMove = false; //是否发生左右滑动
    var startPos = 0;

    this.moveBox.addEventListener("touchstart",function(e) {
        // e.preventDefault();

        startPos = this.currPos;
        if(e.touches.length == 1 && !this.busy){
            var touch = e.touches[0];
            this.point_x = touch.pageX;
            this.point_y = touch.pageY;
            this.removeTransition();
            clearTimeout(this.timer);
            // this.moveBox.style.webkitTransition =  this.moveBox.style.transition = "";
            this.startT = +new Date();
            // this.isMove = false; 
            // this.isTouchEnd = false; 
        }
    }.bind(this),false);

    document.addEventListener("touchmove",function(e) {
        e.preventDefault();

        if(e.touches.length==1 && !this.busy){
            var touch = e.touches[0];
            var deltaX = touch.pageX - (this.point_x===null?touch.pageX:this.point_x);
            var deltaY = touch.pageY - (this.point_y===null?touch.pageY:this.point_y);
            console.log(deltaX,deltaY);
            if(Math.abs(deltaX) > Math.abs(deltaY)){
                this.moveLen = deltaX;
                var translate = startPos + deltaX;
                this.transform(translate);
                this.direct = deltaX > 0 ? "r" : "l";
            }else{
                return;
            }
        }

    }.bind(this),false);

    document.addEventListener("touchend",function(e){
        console.log(this.direct);
        // e.preventDefault();
        !this.busy && this.moveEnd(); 
    }.bind(this),false);
};

Zslider.prototype.moveEnd = function() {
    var deltaT = +new Date() - this.startT; //手指在页面上停留的事件
    var ind; // 真正的索引（一开始为-1，最后为length）
    //var changeX = this.currPos % this.oneMoveWidth; //检查它是否已经滑动到当前页，而不是滑到一半
    if(deltaT<300){
        //if(this.currPos<this.minLeft){ //手指向左滑动
        //ind = this.index+1;
        //}else if(this.currPos>this.maxLeft){ //手指 向右滑动
            //nd = this.index-1;
        //}else if(changeX!=0){
            if(this.direct=="l"){
                ind = this.index+1;
            }else if(this.direct=="r"){
                ind = this.index-1;
            }else{
                ind = this.index;
            }
        //}else{
            //ind = this.index;
        //}
    }else{
        if(Math.abs(this.moveLen)/this.oneMoveWidth<0.4){
            ind = this.index;
        }else{
            //if(this.currPos<this.minLeft){ //手指向左滑动
            //ind = this.index+1;
            //}else if(this.currPos>this.maxLeft){ //手指 向右滑动
                //ind = this.index-1;
            //}else if(changeX!=0){
                if(this.direct=="l"){
                ind = this.index+1;
                }else if(this.direct=="r"){
                    ind = this.index-1;
                }else{
                    ind = this.index;
                }
            //}else{
                //ind = this.index;
            //}
        }
    }
    

    this.addTransition();
    this.goOne(ind);
};

Zslider.prototype.goOne = function(ind,ani) {

    var self = this;
    if(this.busy)return;
    clearTimeout(this.timer);
    this.busy = true;
    this.addTransition(ani);
    if(this.options.loop){
        ind = ind < 0 ? -1 : ind;
        ind = ind >= this.points ? this.points : ind; 
    }else{
        ind = ind < 0 ? 0 : ind;
        ind = ind >= this.points ? (this.points-1) : ind;
    }

    if(!this.options.loop && (this.currPos == -(this.oneMoveWidth*ind))){
        this.complete(ind);
    }else if(this.options.loop && (this.currPos == -this.oneMoveWidth*(ind+1))){
        this.complete(ind);
    }else{
        if(ind==-1 || ind ==this.points){ //循环时的滚动边界
            this.index = ind == -1 ? (this.points - 1) : 0;  //当滑动到克隆元素（首尾），将索引改变
            this.currPos = ind == -1 ? 0 : -this.oneMoveWidth*(this.points+1);  //将位置变为真正元素的位置
        }else{
            this.index = ind;
            this.currPos = -(self.oneMoveWidth*(self.index+(self.options.loop ? 1 : 0)));
        }
        this.transform(this.currPos);
        setTimeout(function(){
            self.complete(ind);
        },self.scroll_time);
    }
};

Zslider.prototype.auto_scroll = function() {
    if(!this.options.loop || !this.options.auto) return;
    var self = this;
    clearTimeout(this.timer);
    this.timer = setTimeout(function(){
        self.goOne(self.index+1);
    },self.options.autoTime);
    return this;
};

Zslider.prototype.complete = function(ind) {
    this.busy = false;
    this.direct = "";
    this.removeTransition();
    this.options.cb && this.options.cb(this.index);
    if(ind==-1){
        this.currPos = this.minLeft;
    }else if(ind==this.points){
        this.currPos = this.maxLeft;
    }
    this.transform(this.currPos);
    this.auto_scroll();
};

Zslider.prototype.goNext = function(ani) {
    if(!this.busy){
        this.goOne(this.index+1,ani);
    }
};

Zslider.prototype.goPrev = function(ani) {
    if(!this.busy){
        this.goOne(this.index-1,ani);
    }
};