# zSlider
##移动端 slider 轮播图组件，原生js编写，无需依赖

```
opts = {
    wrap:父容器，（class,id）
    page: boolean 是否显示下标
    loop: boolean 是否无限循环
    auto: boolean 是否自动滚动，只有在 loop == true 时设置有效
    autoTime: 1000 自动循环时间 单位ms , 只有在 loop == true 时设置有效
}

this.goNext(trans) : 下一页
this.goPrev(trans) : 上一页
this.goOne(p,trans)  : 某一页(p为页码，trans为过渡时间,单位ms ，可不传)

callback:
cb(ind){}  返回当前索引（index）

```