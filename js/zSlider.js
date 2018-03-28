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

var Observer = (function() {
    var _messages = {};
    return {
        //注册信息接口
        //prams 消息类型以及相应的处理动作
        regist: function(type, fn) {
            //如果此消息不存在则应该创建一个该消息类型
            if (typeof _messages[type] === 'undefined') {
                _messages[type] = [fn];
                //如果存在
            } else {
                _messages[type].push(fn);
            }
        },
        //发布信息接口 
        fire: function(type, args) {
            //如果该消息没有被注册，则返回
            if (!_messages[type]) return;
            //定义消息信息
            var events = {
                    type: type,
                    args: args || {}
                },
                i = 0,
                len = _messages[type].length;
            //遍历消息动作
            for (; i < len; i++) {
                _messages[type][i].call(this, events);
            }
        },
        //移除信息接口
        remove: function(type, fn) {
            //如果消息动作队列存在
            if (_messages[type] instanceof Array) {
                var i = _messages[type].length - 1;
                for (; i >= 0; i--) {
                    _messages[type][i] === fn && _messages[type].splice(i, 1);
                }
            }
        }
    }
})();

/**
opts = {
    wrap:父容器，
    pageWrap: 下标容器，
    page: boolean 是否显示下标
    infinite: boolean 是否无限循环
}

this.goNext : 下一页
this.goPrev : 上一页
this.goOne  : 某一页
this.getNowPage : 获取当前页

this.currPos : 记录当前页面的位置（px）
this.pageNow : 记录当前页码
this.points ：记录页码数

*/

function Zslider(opts) {
    this.defultOpts = {
        wrap: ".z-wrap",
        pageWrap: ".z-pageWrap",
        page: false,
        infinite: false
    };
    this.options = Object.assign({}, this.defultOpts, opts);
    this.currPos = 0;
    this.pageNow = 1;
    this.points = null;
    this.checkOptions().checkInfinite().setOriginPage().setSliderWidth();
}

// 查看容器元素是否存在
Zslider.prototype.checkOptions = function() {
    if (!document.querySelector(this.options.wrap)) {
        throw new Error('element is required');
    }
    return this
}

// 循环滚动
Zslider.prototype.checkInfinite = function(){
    if(this.options.infinite){
        var oWrap = document.querySelector(this.options.wrap);
        var ocloneWrap = oWrap.cloneNode(true);
        var aLi = ocloneWrap.children;

        console.log(oWrap);
        console.log(oWrap.children[0].cloneNode(true));
        oWrap.insertBefore(ocloneWrap.children[aLi.length-1].cloneNode(true),oWrap.children[0]);
        oWrap.appendChild(ocloneWrap.children[0].cloneNode(true));
    }

    return this;
}

// 设置原始页码
Zslider.prototype.setOriginPage = function() {
    console.log(this.page);
    if (this.options.page) {
        if(!document.querySelector(this.options.pageWrap)){
            throw new Error('page element is required');
        }else{
            var oWrap = document.querySelector(this.options.wrap);
            var iw = -oWrap.offsetWidth;
            var opWrap = document.querySelector(this.options.pageWrap);
            var iLen = oWrap.children.length;
            var str = "";
            if(this.options.infinite){
                for(var i = 0;i<iLen-2;i++){
                    str+="<li></li>";
                }
                this.transform(oWrap, iw);
            }else{
                Array.prototype.slice.call(oWrap.children).forEach(function(item,index) {
                    str+="<li></li>";
                })
            }
            
            opWrap.innerHTML = str;
            document.querySelector(this.options.pageWrap).children[0].classList.add("now");
        }
    }
    return this
}

Zslider.prototype.transform = function(obj, translate) {
    setTransform(obj, "translate3d(" + translate + "px, 0, 0)", "transform");
    this.currPos = translate;
}

// 设置宽度
Zslider.prototype.setSliderWidth = function() {
    var oWrap = document.querySelector(this.options.wrap),
        items = Array.prototype.slice.call(oWrap.children),
        itemW = document.body.offsetWidth || document.documentElement.offsetWidth,
        wrapW = 0;
    this.points = items.length;

    items.forEach(function(item, index) {
        item.style.width = itemW + "px";
        wrapW += itemW;
    });

    oWrap.style.width = wrapW + "px";
    this.bindEvent();
}

// 绑定事件
Zslider.prototype.bindEvent = function() {
    var pageW = window.innerWidth; //页面宽度
    var maxWidth = -pageW * (this.points - 1); //页面滑动最后一页的位置    
    var isTouchEnd = true; //当前滑动是否结束
    var startPos = 0; //手指按下时的滑块位置
    var startT = 0; //手指摁下时的开始时间
    var isMove = false; //是否发生左右滑动
    var startX, startY;
    var direct = "l"; //滑动的方向
    var moveLen = 0; //手指当前滑动的距离
    var box = document.querySelector(this.options.wrap);

    box.addEventListener("touchstart", function(e) {
        e.preventDefault();
        if (e.touches.length == 1 || isTouchEnd) {
            var touch = e.touches[0];
            startX = touch.pageX;
            startY = touch.pageY;
            startPos = this.currPos;
            box.style.webkitTransition = "";
            startT = +new Date();
            isMove = false; //是否产生滑动
            isTouchEnd = false; //当前滑动是否开始
        }
    }.bind(this), false);

    document.addEventListener("touchmove", function(e) {
        e.preventDefault();

        if (isTouchEnd) return;

        var touch = e.touches[0];
        // move位移
        var deltaX = touch.pageX - startX;
        var deltaY = touch.pageY - startY;

        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            moveLen = deltaX;
            var translate = startPos + deltaX;
            if (translate <= 0 && translate >= maxWidth) {
                this.transform(box, translate);
                isMove = true;
            }
            direct = deltaX > 0 ? "r" : "l";
        }
    }.bind(this), false);

    document.addEventListener("touchend", function(e) {
        e.preventDefault();
        var translate = 0;
        // 手指在屏幕上的停留时间
        var deltaT = +new Date() - startT;
        if (isMove && !isTouchEnd) {
            isTouchEnd = true;
            box.style.webkitTransition = "0.3s ease -webkit-transform";
            if (deltaT < 300) {
                translate = direct == "l" ? this.currPos - (pageW + moveLen) : this.currPos + pageW - moveLen;
                translate = translate > 0 ? 0 : translate;
                translate = translate < maxWidth ? maxWidth : translate;
            } else {
                if (Math.abs(moveLen) / pageW < 0.4) {
                    translate = this.currPos - moveLen;
                } else {
                    translate = direct == "l" ? this.currPos - (pageW + moveLen) : this.currPos + pageW - moveLen;
                    translate = translate > 0 ? 0 : translate;
                    translate = translate < maxWidth ? maxWidth : translate;
                }
            }

            this.transform(box, translate);
            // if(this.options.infinite){
            //     this.pageNow = Math.round(Math.abs(translate) / pageW)/2 + 1;

            // }else{
                this.pageNow = Math.round(Math.abs(translate) / pageW) + 1;
            // }

            this.setPageNow();
        }
    }.bind(this), false);
}

// 设置页码
Zslider.prototype.setPageNow = function() {
    if (this.options.page) {
        var pageUl = document.querySelector(this.options.pageWrap);
        var pageli = pageUl.children;

        Array.prototype.slice.call(pageli).forEach(function(item,index){
            item.classList.remove("now");
        })
        pageli[this.pageNow-1].classList.add("now");
    }      
}


Zslider.prototype.goNext = function() {};
Zslider.prototype.goPrev = function() {};
Zslider.prototype.getNowPage = function() {};