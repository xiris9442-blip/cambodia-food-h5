var MugedaPage = (function () {
    // [Lucas] 这个import函数是一个最小化的模块加载尝试
    var mapResource = {};
    var loadResource = function (name, callback, referer, type) {
        if (!mapResource[name]) {
            mapResource[name] = {
                status: 'ready',
                type: type || 'javascript',
                queueCallback: []
            }
        }

        var processCallback = function (callback, referer) {
            if (callback) {
                if (mapResource[name].status == 'loaded' || mapResource[name].status == "error") {
                    callback({
                        name: name,
                        referer: referer,
                        status: mapResource[name].status
                    });
                }
                else {
                    mapResource[name].queueCallback.push({
                        name: name,
                        func: callback,
                        referer: referer
                    });
                }
            }
            else {
                var len = mapResource[name].queueCallback;
                while (mapResource[name].queueCallback.length) {
                    var cb = mapResource[name].queueCallback.shift();
                    cb.func && cb.func({
                        name: name,
                        referer: cb.referer,
                        status: mapResource[name].status
                    });
                }
            }
        }

        processCallback(callback, referer);


        if (mapResource[name].type == 'javascript') {
            var head = document.head || document.getElementsByTagName('head')[0];
            var script = document.createElement('script');
            script.type = 'text/javascript';
            script.src = name;
            mapResource[name].status = 'loading';
            script.onload = function () {
                mapResource[name].status = 'loaded';
                processCallback();
            }
            script.onerror = function () {
                mapResource[name].status = 'error';
                processCallback();
            }
            head.appendChild(script);
        }
    };

    var insertCSS = function (rule, index) {
        index = index || 0;
        if (document.styleSheets && document.styleSheets[index]) {
            try {
                document.styleSheets[index].insertRule(rule, 0);
            }
            catch (ex) {
                insertCSS(rule, index + 1);
            }
        }
        else {
            var style = document.createElement("style");
            style.innerHTML = rule;
            document.head.appendChild(style);
        }
        return;
    };

    var bindAniObj = function (aniObj) {
        ['left', 'top', 'width', 'height'].forEach(function (name) {
            Object.defineProperty(aniObj, name, {
                set: function (v) {
                    aniObj.dom.style[name] = v + 'px';
                },
                get: function () {
                    return parseInt(getCurrentStyle(aniObj.dom, name));
                }
            });
        });
        Object.defineProperty(aniObj, 'x', {
            set: function (v) {
                aniObj.dom.style.left = (v - aniObj.width / 2) + 'px';
            },
            get: function () {
                return aniObj.left + aniObj.width / 2;
            }
        });
        Object.defineProperty(aniObj, 'y', {
            set: function (v) {
                aniObj.dom.style.top = (v - aniObj.height / 2) + 'px';
            },
            get: function () {
                return aniObj.top + aniObj.height / 2;
            }
        });
        Object.defineProperty(aniObj, 'right', {
            set: function (v) {
                aniObj.dom.style.left = (v - aniObj.width) + 'px';
            },
            get: function () {
                return aniObj.left + aniObj.width;
            }
        });
        Object.defineProperty(aniObj, 'bottom', {
            set: function (v) {
                aniObj.dom.style.top = (v - aniObj.height) + 'px';
            },
            get: function () {
                return aniObj.top + aniObj.height;
            }
        });

        var getTransformText = function (aniObj) {
            return (aniObj.dom.translateText || '') + ' ' + (aniObj.dom.scaleText || '') + ' ' + (aniObj.dom.rotateText || '');
        };
        Object.defineProperty(aniObj, 'scale', {
            set: function (v) {
                aniObj.dom.scaleX = v;
                aniObj.dom.scaleY = v;
                aniObj.dom.scaleText = 'scale('+aniObj.dom.scaleX+', '+ aniObj.dom.scaleX+')';
                aniObj.dom.style.webkitTransform = getTransformText(aniObj);
            },
            get: function () {
                return {
                    scaleX: aniObj.dom.scaleX === undefined ? 1.0 : aniObj.dom.scaleX,
                    scaleY: aniObj.dom.sclaeY === undefined ? 1.0 : aniObj.dom.scaleY
                };
            }
        });
        Object.defineProperty(aniObj, 'scaleX', {
            set: function (v) {
                aniObj.dom.scaleX = v;
                aniObj.dom.scaleText = 'scale('+aniObj.dom.scaleX+', '+ aniObj.dom.scaleX+')';
                aniObj.dom.style.webkitTransform = getTransformText(aniObj);
            },
            get: function () {
                return aniObj.dom.scaleX === undefined ? 1.0 : aniObj.dom.scaleX;
            }
        });
        Object.defineProperty(aniObj, 'scaleY', {
            set: function (v) {
                aniObj.dom.scaleY = v;
                aniObj.dom.scaleText = 'scale('+aniObj.dom.scaleY+', '+ aniObj.dom.scaleY+')';
                aniObj.dom.style.webkitTransform = getTransformText(aniObj);
            },
            get: function () {
                return aniObj.dom.sclaeY === undefined ? 1.0 : aniObj.dom.scaleY;
            }
        });
        Object.defineProperty(aniObj, 'alpha', {
            set: function (v) {
                if (v === undefined) {
                    aniObj.dom.style.opacity = 1;
                }
                else {
                    aniObj.dom.style.opacity = v;
                }
            },
            get: function () {
                return aniObj.dom.style.opacity || 1;
            }
        });
        Object.defineProperty(aniObj, 'visible', {
            set: function (v) {
                aniObj.dom.visible = v;
                if (v) {
                    aniObj.dom.style.display = 'block';
                }
                else {
                    aniObj.dom.style.display = 'none';
                }
            },
            get: function () {
                return aniObj.dom.visible || false;
            }
        });
    }



    var getCurrentStyle = function (ele, attr) {
        if (document.defaultView) {
            var style = document.defaultView.getComputedStyle(ele, null);
            return style ? style.getPropertyValue(attr) : null;
        } else {
            return ele.currentStyle[attr];
        }
    }

    var getType = function (type) {
        var useTouch = navigator.userAgent.match(/Android/i)
                                || navigator.userAgent.match(/webOS/i)
                                || navigator.userAgent.match(/iPhone/i)
                                || navigator.userAgent.match(/iPad/i)
                                || navigator.userAgent.match(/iPod/i)
                                || navigator.userAgent.match(/BlackBerry/i)
                                || navigator.userAgent.match(/Windows Phone/i);
        if (type == "inputstart") type = useTouch ? "touchstart" : "mousedown";
        else if (type == "inputmove") type = useTouch ? "touchmove" : "mousemove";
        else if (type == "inputend") type = useTouch ? "touchend" : "mouseup";
        return type;
    };

    var Page = function (name, aniObject, scene, left, top, options) {
        // 判断aniObject是不是group
        if (aniObject.data.type == 2014) {
            this.groupAdapt = true;
        }
        this.name = name;
        this.oriLeft = left || 0;
        this.oriTop = this.groupAdapt ? 0 : (top || 0);
        this.options = options || {};
        var instance = this.instance = aniObject;
        var that = this;

        if (this.groupAdapt) {
            if (aniObject.group.objectList) {
                aniObject.group.objectList.forEach(function (item) {
                    item.mugedaPageTop = item.top;
                    that.offsetTop = top || 0;
                });
            }
        }
    }

    Page.prototype.setChain = function (dir, page) {
        this['chain' + dir] = page;
    }

    Page.prototype.getScene = function (recursive) {
        var instance = this.instance;
        if (instance) {
            var scene = instance.scene;
            if (!scene) {
                if (instance.data.type == 2014 && recursive) {
                    var objlist = instance.group ? instance.group.objectList : [];
                    for (var objIdx = 0; objIdx < objlist.length; objIdx++) {
                        var child = objlist[objIdx];
                        if (child.data.type == 2021) {
                            scene = child.scene;
                        }
                    }
                }
            }
        }

        scene = scene || {
            addEventListener: function () { },
            removeEventListener: function () { },
            freeze: function () { },
            unfreeze: function () { }
        };
        return scene;
    }

    var createAniData = function (opt) {
        var d = {
            "guid": Mugeda.guidGen(),
            "type": opt.type,
            "param": {
                "rawWidth": opt.width,
                "rawHeight": opt.height,
                "left": opt.left,
                "right": opt.left + opt.width,
                "top": opt.top,
                "bottom": opt.top + opt.height,
                "scaleX": 1,
                "scaleY": 1,
                "rotate": 0,
                "alpha": 1,
                "width": opt.width,
                "height": opt.height,
                "fillInfo": opt.fillInfo
            }
        }
        if (opt.src) {
            d.param.imageSrc = opt.src
        }
        return d;
    }

    var createSpin = function (options) {
        options = options || {};
        var spin = document.createElement('div');
        spin.className = "mugeda_page_spin";
        spin.id = "mugeda_page_spin";

        var prefix = ['-webkit-', '-moz-', '-ms-', '-o-', ''];

        var css = "#mugeda_page_spin {\n";
        css += "    background-color: " + (options.background_color || "rgba(0,0,0,0)") + ";\n";
        css += "    border-radius: 100%;\n";
        css += "    border: " + (options.thickness || 2) + "px solid " + (options.color || "#fff") + ";\n";
        css += "    border-top: " + (options.thickness || 2) + "px solid rgba(255,70,0,0.6);\n";
        css += "    border-left: " + (options.thickness || 2) + "px solid rgba(255,70,0,0.6);\n";
        css += "    width: " + (options.size || 16) + "px;\n";
        css += "    height: " + (options.size || 16) + "px;\n";

        css += "\n";
        prefix.forEach(function (p) {
            css += "    " + p + "animation: loading " + (options.animation_time || 1000) + "ms infinite linear;\n";
        });
        css += "}\n\n";

        prefix.forEach(function (p) {
            css += "@" + p + "keyframes loading {\n";
            css += "    0% {\n";
            css += "        " + p + "transform: rotate(0deg);\n";
            css += "   }\n";
            css += "    100% {\n";
            css += "        " + p + "transform: rotate(360deg);\n";
            css += "   }\n";
        });

        var head = document.head || document.getElementsByTagName('head')[0];
        var style = document.createElement('style');
        style.type = 'text/css';
        if (style.styleSheet) {
            style.styleSheet.cssText = css;
        } else {
            style.appendChild(document.createTextNode(css));
        }

        head.appendChild(style);

        return spin;
    }

    var Slide = function (opt) {
        var downImg = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEMAAAAwCAMAAAB9ojcuAAAAA3NCSVQICAjb4U/gAAAA4VBMVEX///8AAABmZmZDQ0M8PDwAAAB7e3tKSkomJiYhISEAAACMjIyEhIR7e3t1dXVra2tmZmZaWlpSUlJDQ0M8PDwhISEAAAC0tLSZmZmUlJSMjIx1dXVra2tmZmZaWlpSUlJKSkq9vb20tLStra2ZmZmUlJSMjIx7e3t1dXXFxcW9vb20tLStra2jo6OZmZmUlJSEhIR7e3tra2vV1dW9vb20tLStra2jo6OZmZnd3d3MzMzFxcW9vb20tLTl5eXV1dXMzMzFxcXl5eXd3d3V1dXv7+/l5eXd3d3v7+/4+Pj///+JUDTnAAAAS3RSTlMAESIiIiIzMzMzM0RERERERERERERERFVVVVVVVVVVVVVmZmZmZmZmZnd3d3d3d3d3d3eIiIiIiIiZmZmZmaqqqqq7u7vMzMzd7v/EBuFkAAAACXBIWXMAAAsSAAALEgHS3X78AAAAHHRFWHRTb2Z0d2FyZQBBZG9iZSBGaXJld29ya3MgQ1M1cbXjNgAAAoNJREFUSInFlnt70jAUxhtnXOkmbh1sU0Q2dCBiwQugDiaMcin9/h/IXHpyadO04J5n+a/JyZv3nJ5fU8d5ooEQ+s9tKBl7C8hdCB2dnpxgvJ8IQhi/vj59yXchdPt3ufzq7SVCJLxP4XJ5m2jgXhzH0bhW3go1URlvyLY/ONG4Jg/xbtEoa4Wa8Kc7uquXaKCzkD7G4aCcCJXorJjEpgoa+M2CzUSTeol8SHxlsmHW5++weDG4No7Y5GOzyAothT9j0dHMl8HU3IDnsxraRWhol7veTFw1lK40YKViyYcEusGWWV51UqepDqd+ngiNqvGo3czPGradYHA7NrpVMw3cnICiqrF8pqLiqSC6Wp/wPBaGt4fEEG9+0dXDqInmI++iB0aFDjvdC5O0A5ndbaCK0IXhSunmJFqy/+Kq3QYV7LW04yAPYbABEhh/bF+9Euyvo2gEBjPhhkKxMLe/jtY9YP9L6gBhm5QfIwWxLXthXIKr/gT234odINKEpq0TFa8SqIVGqmofuD2eq23OTqk9JBB+8LwbrYHZupuozs+gqPhipGLLDxpseTt9/yFBEnmA6rnCvtjRkSLQtPkrKrjafOY07rAlJQJVVW9zU9Y8GhDTK9VKN7yKrVL9Lqt+eCdnbJ8ZuUPrgvNpGM7fyya2g2vsRuKuWj0WijZwBXo6tvpIg2uQcODi4NhyOpPvgqMRYL+G8g7LkpgrkRds/8KZrQzDDIQauHYFJ3XXsLuTWAvMX0hrPqIZm5T9VuHNY7YCEH67vPysoVROQofw128jYuXyAQjzECulIrAtusltIgBh4R+FTYR3Vj5iZURIPv37+9HFIXmoVug4XME59Df8ucY/LsbXlBra4usAAAAASUVORK5CYII=";
        var audioOnImg = "data:image/png;base64,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";
        var audioOffImg = "data:image/png;base64,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";

        this.options = {
            event: opt.event,
            scene: opt.scene,
            mode: opt.mode || "ladder",
            direction: opt.direction || "vertical",
            realtime: opt.realtime || "follow",
            showArrowIcon: false,
            showAudioIcon: opt.showAudioIcon == null ? true : opt.showAudioIcon,
            arrayMargin: opt.arrayMargin || '9,4,9,4',
            exit: typeof (opt.exit) == 'undefined' ? '' : (opt.exit == null ? '' : opt.exit),
            additional: opt.pages || opt.additional || [],
            link: opt.link,
            loop: opt.loop || false,
            arrowImg: opt.arrowImg || downImg,
            audioOnImg: opt.audioOnImg || audioOnImg,
            audioOffImg: opt.audioOffImg || audioOffImg,
            music: opt.music,
            duration: opt.duration || '1000',
            onpage: opt.onpage || null,
            beforePageChange: opt.beforePageChange || null,
            behind: opt.behind || null,
            horizontalArrow: opt.horizontalArrow || 'in',
            div: opt.div || false,
            pageHolder: opt.pageHolder || null,
            usePage: opt.usePage || false,
            endingEffect: opt.endingEffect || ((window.cardFrame && cardFrame.Utils.isSlideCard()) ? "blur" : undefined) || 'none'
        };
        this.pages = [];


        // insert transition class
        var classList = {
            '.transition1': '{{prefix}}transition: all ' + this.options.duration + 'ms ease-in-out;',
            '.arrow_flash': '{{prefix}}animation: 2s arrow_flash infinite;',
            '@-webkit-keyframes arrow_flash': '0% { opacity: 0.15; }  50% { opacity: 0.75; } 100% { opacity: 0.1; }'
        };
        for (var selector in classList) {
            if (classList.hasOwnProperty(selector)) {
                var cssTemplate = classList[selector];
                var prefixList = ['-webkit-', '-moz-', '-ms-', '-o-', ''];
                var cssText = '';
                if (cssTemplate.indexOf('{{prefix}}') > -1) {
                    prefixList.forEach(function (prefix) {
                        cssText += cssTemplate.replace(/{{prefix}}/g, prefix);
                    });
                }
                else cssText = cssTemplate;
                if (selector.indexOf('{{prefix}}') > -1) {
                    prefixList.forEach(function (prefix) {
                        //this.options.scene.thisAni.insertRule(selector.replace(/{{prefix}}/g, prefix), cssText)
                        insertCSS(selector.replace(/{{prefix}}/g, prefix) + '{' + cssText + '}');
                    });
                }
                else insertCSS(selector + '{' + cssText + '}');//this.options.scene.thisAni.insertRule(selector, cssText);
            }
        }

        if (opt.div && !opt.usePage) {
            var mugeda = {
                adaption: { marginTop: 0, marginLeft: 0, marginBottom: 0, marginRight: 0 },
                width: opt.width || parseInt(window.innerWidth), height: opt.height || parseInt(window.innerHeight)
            };

            this.options.scene = {
                thisAni: mugeda,
                setFrameout: function (time, cb) {
                    setTimeout(cb, time * 12);
                }
            }
        }

        this.createSlide();
        this.createAccessories();
        this.adaptView();
        this.bindTouchEvent();
        this.showSlideNow(this.firstPage);
        var _ = this;


        if (!this.options.div) {
            this.options.scene.thisAni.addEventListener.call(this.options.scene.thisAni, 'resize', function () { _.adaptView.call(_) });
        }
        else {
            window.addEventListener('resize', function () { _.adaptView.call(_) });
        }
    }

    Slide.prototype.switchAudioIconStatus = function (on) {
        this.cacheAudioStatus = on;
        if (on) {
            (this.audioOnBtn || {}).visible = true;
            (this.audioOffBtn || {}).visible = false;
        }
        else {
            (this.audioOnBtn || {}).visible = false;
            (this.audioOffBtn || {}).visible = true;
        }
    };

    Slide.prototype.toggleLoadingSpin = function (visible) {
        this.loadingSpin.visible = visible;
        if (this.arrowDown && this.options.direction == "vertical") this.arrowDown.visible = !visible;
    }


    Slide.prototype.createSlide = function () {
        var options = this.options;
        var additional = options.additional;
        var pageList = this.pageList = {};
        this.mapPages = {};
        var pageHolder = null;
        var createGroup = function () {
            var groupData = createAniData({
                type: 2014,
                width: options.scene.thisAni.width,
                height: options.scene.thisAni.height,
                left: 0,
                top: 0,
                rawWidth: options.scene.thisAni.width,
                rawHeight: options.scene.thisAni.height
            });
            groupData.items = [];

            var groupObj = new MugedaCss3.aObject(groupData);
            pageHolder.appendChild(groupObj);
            groupObj.dom.style.overflow = "hidden";
            return groupObj;
        }
        var createPage = function (name, type, i, j, left, top, opt) {
            opt = opt || {};
            opt.type = type;
            var aniObj = null;
            var groupObj = null;
            if (opt.div) {
                aniObj = {
                    dom: type,
                    data: {}
                };
                bindAniObj(aniObj);
                Object.defineProperty(aniObj, 'scene', {
                    get: function () {
                        if (options.usePage) {
                            return opt.scene;
                        }
                        else {
                            return MugedaCss3.stage[name] && MugedaCss3.stage[name].scene
                        }
                    }
                });

                pageList[i + '_' + j] = new Page(name, aniObj, null, left, top, opt);
            }
            else if (type == 'symbol') {
                aniObj = options.scene.thisAni.createInstanceOfSymbol(name);
                groupObj = createGroup();
                groupObj.appendChild(aniObj);
                aniObj.left = typeof left == "number" ? left : (aniObj.data.param.boundLeft || 0);
                aniObj.top = 0;
                left = 0;
                top = typeof top == "number" ? top : (aniObj.data.param.boundTop || 0);
            }
            else if (type == 'instance') {
                aniObj = options.scene.getObjectByName(name);

                if (aniObj.scene && aniObj.data.param.symbolId) {
                    groupObj = createGroup();
                    groupObj.appendChild(aniObj);

                    if (opt.keepPosition) {
                        aniObj.left = diffX + (typeof left == "number" ? left : (aniObj.left || 0));
                        aniObj.top = 0;
                        left = 0;
                        top = typeof top == "number" ? top : (aniObj.top || 0);
                    }
                    else {
                        var symbol = options.scene.thisAni.symbols[aniObj.data.param.symbolId] || {};
                        var bound = symbol.bound || {};

                        // TODO [Lucas]: diffX和diffY用来矫正由于元件中存在旋转物体带来的
                        // 计算元件边界和实例边界不一致的问题。下面的位置校正基于一个假设，
                        // 就是元件实例的旋转中心位于元素中心。如果不是这样，下面的逻辑需要矫正。
                        // 例如：5521b217a3664ea55600017c里面的元件4的实例，由于左边界不是由旋转物体
                        // 确定，会导致计算有误差需要修正。
                        var diffX = (symbol.bound.width - aniObj.width) / 2;
                        var diffY = (symbol.bound.height - aniObj.height) / 2;

                        aniObj.left = diffX + (typeof left == "number" ? left : (bound.left || 0));
                        aniObj.top = 0;
                        left = 0;
                        top = diffY + (typeof top == "number" ? top : (bound.top || 0));
                    }
                }
                else {
                    // TODO[Lucas]: 需要一个不直接更新dom的方式，而是通过aObject封装的功能来实现
                    pageHolder.dom.appendChild(aniObj.dom);
                    if (opt.keepPosition) {
                        left = typeof left == "number" ? left : (aniObj.left || 0);
                        top = typeof top == "number" ? top : (aniObj.top || 0);
                    }
                }
            }

            pageList[i + '_' + j] = new Page(name, groupObj || aniObj, options.scene, left, top, opt);

        }

        if (true || !options.behind) {
            var selectedIdx = -1;
            var selectedObj = null;
            for (var i = 0 ; i < additional.length; i++) {
                var additionalItem = additional[i];

                if (additionalItem.type == "instance") {
                    var aniObj = options.scene.getObjectByName(additionalItem.name);
                    var idx = Array.prototype.indexOf.call(aniObj.dom.parentNode.childNodes, aniObj.dom);
                    if (idx > selectedIdx) {
                        selectedIdx = idx;
                        selectedObj = aniObj;
                    }
                }
            }

            if (selectedObj) {
                var boxData = createAniData({
                    type: 2003,
                    width: 20,
                    height: 20,
                    left: 0,
                    top: 0,
                    fillInfo: {
                        fillStyle: 0,
                        fillColors: [{ p: 0, r: 0, g: 0, b: 0, a: 0 }]
                    }
                });

                var behindHolder = new MugedaCss3.aObject(boxData);
                while (selectedObj.parentGroup) {
                    selectedObj = selectedObj.parentGroup.parent;
                }

                options.scene.appendChild(behindHolder, selectedObj);
                behindHolder.dom.id = "mugeda_behind_holder";
                options.behind = behindHolder;
            }
        }

        if (typeof options.behind === "string") {
            options.behind = options.scene.getObjectByName(options.behind);
        }

        pageHolder = this.options.pageHolder;
        if (pageHolder == null) {
            var aniData = createAniData({
                type: 2014,
                width: options.scene.thisAni.width,
                height: options.scene.thisAni.height,
                left: 0,
                top: 0,
                rawWidth: options.scene.thisAni.width,
                rawHeight: options.scene.thisAni.height
            });
            aniData.items = [];

            pageHolder = new MugedaCss3.aObject(aniData);
            options.scene.appendChild(pageHolder, options.behind);
        }
        else if (pageHolder.dom == null) {
            var that = this;
            pageHolder.dom = pageHolder;
            options.scene.appendChild = function (dom) { 
                if (that.options.usePage) 
                    pageHolder.appendChild(dom.dom); 
                else 
                    pageHolder.children[0].appendChild(dom.dom); 
            };
            options.scene.originalAddEventListener = options.scene.addEventListener;
            options.scene.addEventListener = function (type, callback, o) {
                if(type == "enterframe" && options.scene.originalAddEventListener){
                    options.scene.originalAddEventListener(type, callback, o);
                }
                else{
                    type = getType(type);
                    pageHolder.dom.addEventListener(type, function (event) {
                        if (event.inputX == null) {
                            Object.defineProperty(event, "inputX", {
                                get: function () {
                                    return MugedaCss3.getEventPosition(event, pageHolder.dom, 1).x
                                }

                            });
                            Object.defineProperty(event, "inputY", {
                                get: function () {
                                    return MugedaCss3.getEventPosition(event, pageHolder.dom, 1).y;

                                }
                            });
                        }
                        callback.call(this, event)
                    }, o);
                }
            }
            options.scene.removeEventListener = function (type, callback, o) {
                type = getType(type);
                pageHolder.dom.removeEventListener(type, callback, o);
            }
            pageHolder.cut = pageHolder.dom.children[0];

        }
        pageHolder.dom.className = pageHolder.dom.className + " mugeda_page";

        // 将additional中的所有场景取出，创建一组page对象
        var idx = '';
        for (var i = 0 ; i < additional.length; i++) {
            var additionalItem = additional[i];
            if (options.div) {
                createPage(additionalItem.name, additionalItem.div, i, 0, 0, 0, { div: this.options.div, scene: additionalItem.scene });
            }
            else if (additionalItem.type === 'group') {
                for (var j = 0; j < additionalItem.items.length; j++) {
                    var additionalGroupItem = additionalItem.items[j];
                    if (additionalGroupItem.type === 'symbol' || additionalGroupItem.type === 'instance') {
                        createPage(additionalGroupItem.name, additionalGroupItem.type, i, j, additionalGroupItem.left, additionalGroupItem.top, additionalGroupItem.options);
                        idx = i + '_' + j;
                    }
                }
            }
            else if (additionalItem.type === 'symbol' || additionalItem.type === 'instance') {
                createPage(additionalItem.name, additionalItem.type, i, 0, additionalItem.left, additionalItem.top, additionalItem.options);
                idx = i + '_' + 0;
            }

            this.mapPages[additionalItem.name] = this.pageList[idx];
            if (additionalItem.options && additionalItem.options.id) {
                this.mapPages[additionalItem.options.id] = this.pageList[idx];
            }
        }

        // 为page建立链表
        var vertical = this.options.direction === 'vertical';
        for (var pos in pageList) {
            if (pageList.hasOwnProperty(pos)) {
                var split = pos.split('_');
                var currentI = split[0] * 1;
                var currentJ = split[1] * 1;
                var page = pageList[pos];

                var directionPath = vertical ? {
                    Up: (currentI - 1) + '_' + (0),
                    Down: (currentI + 1) + '_' + (0),
                    Left: (currentI) + '_' + (currentJ - 1),
                    Right: (currentI) + '_' + (currentJ + 1)
                } : {
                    Left: (currentI - 1) + '_' + (0),
                    Right: (currentI + 1) + '_' + (0),
                    Up: (currentI) + '_' + (currentJ - 1),
                    Down: (currentI) + '_' + (currentJ + 1)
                }

                for (dir in directionPath) {
                    if (directionPath.hasOwnProperty(dir)) {
                        var id = directionPath[dir];
                        if (pageList.hasOwnProperty(id)) {
                            page.setChain(dir, pageList[id]);
                        }
                    }
                }
            }
        }


        // 取出首个page
        this.firstPage = pageList['0_0'];
        this.lastPage = pageList[(additional.length - 1) + '_0'];

        // 对循环page，连接首尾
        if (this.options.loop) {
            var page = this.firstPage;
            while (page) {
                page.setChain(vertical ? 'Up' : 'Left', this.lastPage);
                page = page[vertical ? 'chainRight' : 'chainDown'];
            }
            page = this.lastPage;
            while (page) {
                page.setChain(vertical ? 'Down' : 'Right', this.firstPage);
                page = page[vertical ? 'chainRight' : 'chainDown'];
            }
        }
    };
    Slide.prototype.createAccessories = function () {
        var that = this;

        var num = 0;
        var waitAObject = function (aObject) {
            num++;
            if (that.options.event && !that.options.event.stopLoad) {
                that.options.event.stopLoad = true;
            }
            if (aObject.dom && aObject.dom.tagName.toLowerCase() == 'img') {
                aObject.dom.addEventListener('load', aObjectLoaded);
            }
        }
        var aObjectLoaded = function () {
            this.removeEventListener('load', aObjectLoaded);
            if (--num == 0) {
                if (that.options.event) that.options.event.goOnLoad();
            }
        }

        var MugedaCss3 = window.MugedaCss3;
        if ((window.cardFrame && cardFrame.Utils.isSlideCard()) || that.options.usePage) {
            MugedaCss3 = {
                aObject: function (data) {
                    var div = document.createElement('div');
                    div.style.position = 'absolute';
                    div.style.left = data.param.left + 'px';
                    div.style.top = data.param.top + 'px';
                    div.style.width = data.param.width + 'px';
                    div.style.height = data.param.height + 'px';
                    div.style.webkitTransform = 'rotate(' + data.param.rotate + 'rad)';
                    if (data.type == 2005) {
                        div.style.background = 'url("' + data.param.imageSrc + '")';
                        div.style.backgroundSize = '100% 100%';
                    }
                    this.dom = div;
                    bindAniObj(this);
                }
            }
            MugedaCss3.aObject.prototype.addEventListener = function (type, callback) {
                type = getType(type);
                this.dom.addEventListener(type, callback);
            };
        }

        if (this.options.showArrowIcon) {
            var aniData = createAniData({
                type: 2005,
                width: 34,
                height: 24,
                left: -34,
                top: 0,
                src: this.options.arrowImg
            });



            aniData.param.rotate = Math.PI;
            this.arrowDown = new MugedaCss3.aObject(aniData);

            aniData.param.rotate = that.options.horizontalArrow === "in" ? -Math.PI / 2 : Math.PI / 2;
            this.arrowLeft = new MugedaCss3.aObject(aniData);

            aniData.param.rotate = 0;
            this.arrowUp = new MugedaCss3.aObject(aniData);

            aniData.param.rotate = that.options.horizontalArrow === "in" ? Math.PI / 2 : -Math.PI / 2;
            this.arrowRight = new MugedaCss3.aObject(aniData);

            ['Down', 'Up', 'Left', 'Right'].forEach(function (dir) {
                that.options.scene.appendChild(that['arrow' + dir]);
                waitAObject(that['arrow' + dir]);
                that['arrow' + dir].dom.m_addClass('arrow_flash');
                that['arrow' + dir].addEventListener('inputstart', function (e) { e.preventDefault(); e.stopPropagation() });
                that['arrow' + dir].addEventListener('inputend', function (e) {
                    if (!that.animating) {
                        that.animateTo(dir);
                        e.stopPropagation();
                        e.preventDefault();
                    }

                });
            });
        }

        this.bindAudio = function () {
            // handle audio
            if (typeof this.options.music == 'string') {
                var url = this.options.music;
                if (window.weixinAudioLoader && window.weixinAudioLoader[url]) {
                    this.options.music = window.weixinAudioLoader[url];
                }
                else {
                    this.options.music = new Audio(url);
                }

            }

            if (this.options.music) {
                var timerId = 0;
                var that = this;
                this.options.music.addEventListener('playing', function () {
                    var currentId = this.currentTime;
                    var audio = this;
                    clearInterval(timerId);
                    timerId = setInterval(function () {
                        if (audio.currentTime != currentId) {
                            clearInterval(timerId);
                            that.switchAudioIconStatus(true);
                        }
                    }, 100);
                });
                this.options.music.addEventListener('pause', function () {
                    clearInterval(timerId);
                    that.switchAudioIconStatus(false);
                });
                // TODO: 这是为了临时解决mugeda_page的声音图标在App中不受控制的问题。
                // 需要更改为更加正式的方法。
                if (window.cardFrame && !cardFrame.setAudioState) {
                    cardFrame.setAudioState = function (status) {
                        that.switchAudioIconStatus(status == "play");
                    }
                }


            }


            var toggleAudio = function (on) {
                if (on) {
                    that.options.music && that.options.music.play();
                }
                else {
                    that.options.music && that.options.music.pause();
                }

                toggled = true;
            };
            if (this.options.audioOffImg && this.options.showAudioIcon) {
                var aniData = createAniData({
                    type: 2005,
                    width: 32,
                    height: 32,
                    left: -32,
                    top: 0,
                    src: this.options.audioOffImg
                });

                this.audioOffBtn = new MugedaCss3.aObject(aniData);
                this.options.scene.appendChild(this.audioOffBtn);
                waitAObject(this.audioOffBtn);
                this.audioOffBtn.addEventListener('inputstart', function () {
                    toggleAudio(true);
                })
                this.audioOffBtn.visible = !this.cacheAudioStatus;
            }
            if (this.options.audioOnImg && this.options.showAudioIcon) {
                var aniData = createAniData({
                    type: 2005,
                    width: 32,
                    height: 32,
                    left: -32,
                    top: 0,
                    src: this.options.audioOnImg
                });
                this.audioOnBtn = new MugedaCss3.aObject(aniData);
                this.options.scene.appendChild(this.audioOnBtn);
                waitAObject(this.audioOnBtn);
                this.audioOnBtn.addEventListener('inputstart', function () {
                    toggleAudio(false);
                });
                var startAudio = function () {
                    toggleAudio(true);

                    if (this.options.musicOnClick)
                        that.options.scene.removeEventListener('inputstart', startAudio, true);
                }
                this.audioOnBtn.visible = !!this.cacheAudioStatus;

                if (this.options.musicOnClick)
                    this.options.scene.addEventListener('inputstart', startAudio, true);
                else
                    toggleAudio(true);

                this.switchAudioIconStatus(this.options.music ? !this.options.music.paused : false);
            }
        }
        if (this.options.showAudioIcon) {
            this.bindAudio();
        }

        var boxData = createAniData({
            type: 2003,
            width: 20,
            height: 20,
            left: 0,
            top: 0,
            fillInfo: {
                fillStyle: 0,
                fillColors: [{ p: 0, r: 0, g: 0, b: 0, a: 0 }]
            }
        });

        this.loadingSpin = new MugedaCss3.aObject(boxData);
        this.options.scene.appendChild(this.loadingSpin);
        var spin = createSpin();
        this.loadingSpin.dom.appendChild(spin);
        this.toggleLoadingSpin(false);
    };

    Slide.prototype.adaptView = function () {
        var mugeda = this.options.scene.thisAni;


        if (this.options.div) {
            var _mrmcp = window._mrmcp || {};
            var pageWidth = mugeda.width || _mrmcp.width || parseInt(getCurrentStyle(this.firstPage.instance.dom, 'width'));
            var pageHeight = mugeda.height || _mrmcp.height || parseInt(getCurrentStyle(this.firstPage.instance.dom, 'height'));
            _mrmcp.width = pageWidth;
            _mrmcp.height = pageHeight;
            mugeda.width = pageWidth;
            mugeda.height = pageHeight;

            /*
            var scale = ($ == null || $.os == null || $.os.phone) ? mugeda.width / pageWidth : Math.min(mugeda.width / pageWidth, mugeda.height / pageHeight);
            this.walkThrough(function (page) {
                if (pageHeight * scale > mugeda.height) {
                    page.instance.height = mugeda.height / scale;
                    page.instance.dom.style.marginTop = (mugeda.height / scale - pageHeight) / 2 + 'px';
                    //page.instance.dom.style.marginLeft = Math.max(0, (mugeda.width / scale - pageWidth) / 2) + 'px';
                }
                else {
                    page.instance.height = pageHeight;
                    page.instance.dom.style.marginTop = 0;
                    //page.instance.dom.style.marginLeft = Math.max(0, (mugeda.width / scale - pageWidth) / 2) + 'px';
                }
                page.instance.dom.style.margin = null
            });
            
            this.options.pageHolder.cut.style.webkitTransform = 'scale(' + scale + ')';
            if (pageHeight * scale > mugeda.height) {
                this.options.pageHolder.cut.style.top = 0;
                this.options.pageHolder.cut.style.left = (mugeda.width - pageWidth * scale) / 2 + 'px';
            }
            else {
                this.options.pageHolder.cut.style.top = (mugeda.height - pageHeight * scale) / 2 + 'px';
                this.options.pageHolder.cut.style.left = 0;
            }
            mugeda.adaption.marginTop = mugeda.adaption.marginBottom = (mugeda.height - pageHeight * scale) / 2;
            mugeda.adaption.pageHeight =  pageHeight;
            mugeda.adaption.pageWidth = pageWidth;
            mugeda.adaption.scale = scale;
            */
        }

        if (this.options.showArrowIcon) {
            var margin = this.options.arrayMargin.split(',').map(function (item) { return item.replace(/\s/g, '') });
            this.arrowUp.top = Math.max(margin[0] * 1, -mugeda.adaption.marginTop + margin[0] * 1);
            this.arrowUp.x = mugeda.width / 2;
            this.arrowDown.bottom = Math.min(mugeda.height - margin[2] * 1, mugeda.height + mugeda.adaption.marginTop - margin[2] * 1);
            this.arrowDown.x = mugeda.width / 2;
            this.arrowLeft.left = margin[3] * 1;
            this.arrowLeft.y = mugeda.height / 2;
            this.arrowRight.right = mugeda.width - margin[1] * 1;
            this.arrowRight.y = mugeda.height / 2;

            this.loadingSpin.bottom = this.arrowDown.bottom;
            this.loadingSpin.x = this.arrowDown.x;
        }
        if (this.options.showAudioIcon) {
            this.audioOffBtn.top = this.audioOnBtn.top = Math.max(8, -mugeda.adaption.marginTop + 8);
            this.audioOffBtn.left = this.audioOnBtn.left = 280;
        }

        for (var id in this.pageList) {
            if (this.pageList.hasOwnProperty(id)) {
                var page = this.pageList[id];
                // if is group
                if (page.groupAdapt) {
                    var top = mugeda.adaption.marginTop;
                    //top = -150;
                    if (!isNaN(top)) {
                        if (top > 0) top = 0;
                        var pageHeight = mugeda.height;
                        var pageScaleY = page.instance.scaleY;
                        var PageDomHeight = pageHeight / pageScaleY + top * 2;
                        page.instance.dom.style.cssText += ('height:' + PageDomHeight + 'px;top: ' + (-top) + 'px;overflow:hidden;');

                        if (page.instance.group.objectList) {
                            page.instance.group.objectList.forEach(function (item) {
                                item.dom.style.top = (-(item.mugedaPageTop - page.offsetTop) + top + 'px');
                            });
                        }
                    }
                }
            }
        }
    };
    Slide.prototype.bindTouchEvent = function () {
        var stageScene = this.options.scene;
        var that = this;
        var timeTh = 500;
        var startX, startY, startTime, moved, captured, followed, endX, endY, endTime, page2, dir = null;
        stageScene.addEventListener('inputstart', function (e) {

            if (that.animating) return;
            startX = e.inputX;
            startY = e.inputY;
            startTime = new Date().getTime();
            moved = false;
            captured = true;
            followed = false;
            page2 = null;
            dir = null;
            //e.preventDefault();
        });
        stageScene.addEventListener('inputmove', function (e) {
            if (!captured) return;

            endX = e.inputX;
            endY = e.inputY;
            var deltaX = endX - startX;
            var deltaY = endY - startY;
            var nowTime = new Date().getTime();
            var deltaTime = nowTime - startTime;

            if (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4)
                moved = true;

            if (moved) {
                e.preventDefault();
            }

            if (!followed && that.options.realtime == "follow" && captured && deltaTime > timeTh) {
                if (Math.abs(deltaX) < Math.abs(deltaY)) {
                    if (deltaY > 32 && that.currentPage.chainUp) {
                        dir = 'Up';
                    }
                    else if (deltaY < -32 && that.currentPage.chainDown) {
                        dir = 'Down';
                    }
                }
                else {
                    if (deltaX > 32 && that.currentPage.chainLeft)
                        dir = 'Left';
                    if (deltaX < -32 && that.currentPage.chainRight)
                        dir = 'Right';
                }
                page2 = that.currentPage['chain' + dir];
                if (page2 && dir) {
                    followed = true;
                    that.animateToStepInit(page2, dir);
                }
            }
            if (followed) {
                if (dir == 'Up') page2.instance.bottom = endY;
                else if (dir == 'Down') page2.instance.top = endY;
                else if (dir == 'Left') page2.instance.right = endX;
                else if (dir == 'Right') page2.instance.left = endX;
                //page2.instance.top = page2.oriTop + (mugeda.height + mugeda.adaption.marginTop) + deltaY;
            }

        });
        stageScene.addEventListener('inputend', function (e) {
            if (moved) {
                e.preventDefault();
            }
            else if (!moved && captured) {
                that.openLink();
            }

            captured = false;
            endX = e.inputX;
            endY = e.inputY;
            endTime = new Date().getTime();

            if (endTime - startTime < timeTh || followed) {
                var deltaX = endX - startX;
                var deltaY = endY - startY;
                if (Math.abs(deltaX) < Math.abs(deltaY)) {
                    if (deltaY > 32 && that.currentPage.chainUp) {
                        if (that.options.scrollDisabledAfter) {
                            return;
                        } else {
                            that.animateTo('Up', followed);
                        }
                    }    
                    if (deltaY < -32 && (that.currentPage.chainDown || that.options.endingEffect != "none")) {
                        if (that.options.scrollDisabledForward) {
                            return;
                        } else {
                            that.animateTo('Down', followed);
                        }
                    }     
                }
                else {
                    if (deltaX > 32 && that.currentPage.chainLeft) {
                        if (that.options.scrollDisabledAfter) {
                            return;
                        } else {
                            that.animateTo('Left', followed);
                        } 
                    }           
                    if (deltaX < -32 && that.currentPage.chainRight) {
                        if (that.options.scrollDisabledForward) {
                            return;
                        } else {
                            that.animateTo('Right', followed);
                        } 
                    }                                  
                }
            }
        }, true);
    };
    Slide.prototype.updateArrowStatus = function () {
        var that = this;
        if (this.options.showArrowIcon) {
            ['Down', 'Up', 'Left', 'Right'].forEach(function (dir) {

                var hasMore = that.currentPage['chain' + dir] != null;
                if (!hasMore && dir == "Down")
                    hasMore = hasMore || (that.options.endingEffect != 'none' && !that.endingEffectRendered);

                var visible = (!that.options.scrollDisabledForward) && (!that.options.scrollDisabledAfter) && hasMore;

                that['arrow' + dir].visible = (!that.options.scrollDisabledForward) && (!that.options.scrollDisabledAfter) && visible;// && !that.animating);
                that['arrow' + dir].dom.style.zIndex = that.animating ? 1000 : 'auto';
            });
        }
        if (this.options.showAudioIcon) {
            that.audioOnBtn.dom.style.zIndex = that.audioOffBtn.dom.style.zIndex = that.animating ? 1000 : 'auto';
        }
    };
    Slide.prototype.showSlideNow = function (page) {
        page.instance.left = page.oriLeft;
        page.instance.top = page.oriTop;
        if(!this.options.usePage) {
            page.instance.visible = true;
        }
        // page.instance.scene && page.instance.scene.gotoAndPlay(0);
        page.getScene(true).unfreeze({ mode: 'beginning', force: true });

        /*
        var objlist = page.instance.group ? page.instance.group.objectList : [];
        for (var objIdx = 0; objIdx < objlist.length; objIdx++) {
            var child = objlist[objIdx];
            if (child.data.type == 2021) {
                // child.scene && child.scene.gotoAndPlay(0);
                child.scene && child.scene.unfreeze({ mode: 'beginning' });
            }
        }
        */
        var it = this;
        this.walkThrough(function (item) {
            if(!it.options.usePage) {
                item.instance.visible = false;
                item.getScene(true).freeze({mode: 'beginning'});
            }

            /*
            var objlist = item.instance.group ? item.instance.group.objectList : [];
            for (var objIdx = 0; objIdx < objlist.length; objIdx++) {
                var child = objlist[objIdx];
                if (child.data.type == 2021) {
                    child.scene && child.scene.freeze({ mode: 'beginning' });
                }
            }
            */

        }, page);
        this.currentPage = page;
        this.updateArrowStatus();

        if (this.options.onpage) {
            this.options.onpage({
                name: page.name
            });
        }

        var that = this;
        if (this.options.endingEffect == 'blur') {
            // 仅当有毛玻璃效果时才动态加载相关脚本
            page.getScene(true).addEventListener('enterframe', loadScript = function () {
                loadResource('scripts/blur.js');

                page.getScene(true).removeEventListener('enterframe', loadScript);
            });
        }
    };
    Slide.prototype.animateToStepInit = function (page2, direction) {
        var that = this;
        var mugeda = this.options.scene.thisAni;
        that.animating = true;
        that.updateArrowStatus();
        // move page2 to the init position
        var top = page2.oriTop, left = page2.oriLeft;
        if (direction == 'Down') {
            top += ((this.options.div) ? mugeda.height + Math.min(0, mugeda.adaption.marginBottom) : (mugeda.height + 2 * mugeda.adaption.marginBottom));
        }
        else if (direction == 'Up') {
            top += ((this.options.div) ? -(mugeda.height + Math.min(0, mugeda.adaption.marginTop)) : -(mugeda.height + 2 * mugeda.adaption.marginTop));
        }
        else if (direction == 'Right') {
            left += mugeda.width;
        }
        else if (direction == 'Left') {
            left += -mugeda.width;
        }

        page2.instance.top = top;
        page2.instance.left = left;
        if(!this.options.usePage) {
            page2.instance.visible = true;
        }
        page2.instance.dom.style.zIndex = 999;
    };

    Slide.prototype.disableScroll = function (disabled) {
        this.options.scrollDisabledForward = disabled;
        this.options.scrollDisabledAfter = disabled;
        this.updateArrowStatus();
    };

    Slide.prototype.disableScrollForward = function (disabled) {
        this.options.scrollDisabledForward = disabled;
        this.updateArrowStatus();
    };

    Slide.prototype.disableScrollAfter = function (disabled) {
        this.options.scrollDisabledAfter = disabled;
        this.updateArrowStatus();
    };

    Slide.prototype.scrollTo = function (direction) {

        direction = direction.toLowerCase();
        direction = direction.substr(0, 1).toUpperCase() + direction.substr(1);

        this.animateTo(direction, false);
    };

    var waitCache;
    Slide.prototype.animateTo = function (direction, skipInit, options) {
        var options = options || {};
        var opt = this.options;
        var page1 = this.currentPage;
        var that = this;
        var to;
        var page2 = null;
        
        if(opt.usePage && options.doNow){
            to = options.to;
            page2 = that.pageList[to + '_0'];
        }
        else
            page2 = page1['chain' + direction];
        
        var mugeda = this.options.scene.thisAni;
        
        mugeda.scene.activeDirection = direction;
        waitCache = false;


        if (this.options.div) {
            var cachedId = (page2.name);
            if (this.options.div.getCacheStatus(cachedId)) {
                var cached = true;
            }
            else{
                waitCache = true;
            }
        }
        else {
            var name = page2.options.type == "symbol" ? page2.name : null;

            var cached = true;
            if (name) {
                var status = mugeda.getCacheStatus(name);
                cached = !(status > 0);
            }
        }

        if(waitCache && to !== undefined){
            mugeda.scene.pageDom[to].isCaching = true;
        }
        this.options.div.waitCacheId = null;
        this.toggleLoadingSpin(!cached);
        if (!cached) {
            if (this.options.div) {
                this.options.div.waitCacheId = cachedId;
                this.options.div.waitCallback = function () {
                    if(waitCache) {
                        if(to !== undefined){
                            mugeda.scene.pageDom[to].isCaching = false; 
                            mugeda.scene.pageDom[to].m_css('display', 'none');
                        }
                        that.animateTo(direction, skipInit, options);
                    }
                };
            }
            else {
                mugeda.addEventListener('cacheupdated', function _cacheUpdate(name) {
                    if (name == page2.name)
                        that.animateTo(direction, skipInit);
                    mugeda.removeEventListener('cacheupdated', _cacheUpdate);
                });
            }

            return;
        }

        // 对使用Page来说，如果没有doNow，只是操作scene的gotoAndPlay
        if(opt.usePage){
            if(options.doNow){
                to = options.to;
                page2 = that.pageList[to + '_0'];
            }
            else {
                var nowIdx = mugeda.scene.currentPageIndex;
                var currentPage = mugeda.scene.pages[nowIdx];
                var beforePage = currentPage;
                
                var beforeIndex = nowIdx > 0 ? nowIdx - 1 : mugeda.scene.pages.length - 1;
                var beforePage = mugeda.scene.pages[beforeIndex];

                var afterIndex = nowIdx < mugeda.scene.pages.length - 1 ? nowIdx + 1 : 0;
                var afterPage = mugeda.scene.pages[afterIndex];

                if (direction == 'Down' || direction == 'Right') {
                    mugeda.scene.gotoAndPlay(afterPage.startFrame);
                }
                else {
                    mugeda.scene.gotoAndPlay(beforePage.startFrame);
                }
                return;
            }
        }

        if (!page2 && opt.endingEffect != 'none') {
            if (opt.endingEffect == "blur") {
                loadResource('scripts/blur.js', function () {
                    renderEndingImage(that.blurContext);
                    that.endingEffectRendered = true;
                    that.updateArrowStatus();
                });
            }

            return;
        }
        else if (!page1['chainDown'] && opt.endingEffect != 'none' && that.endingEffectRendered) {
            if (opt.endingEffect == "blur") {
                loadResource('scripts/blur.js', function () {
                    resetEndingImage(that.blurContext);
                    that.endingEffectRendered = false;
                    that.updateArrowStatus();
                });
            }

            return;
        }



        if (opt.beforePageChange) {
            var canceled = opt.beforePageChange(page1, direction);
            if (canceled)
                return;
        }

        if (page2) {
            if (!skipInit) {
                that.animateToStepInit(page2, direction);
            }

            opt.scene.inTransition = true;
            opt.scene.setFrameout(1, function () {
                page1.instance.dom.m_addClass('transition1');
                page2.instance.dom.m_addClass('transition1');


                if (opt.mode == "ladder") {
                    var left = page1.oriLeft, top = page1.oriTop;
                    if (direction == 'Down') {
                        top += ((that.options.div) ? -(mugeda.height + Math.min(0, mugeda.adaption.marginTop)) : -(mugeda.height + 2 * mugeda.adaption.marginTop));
                    }
                    else if (direction == 'Up') {
                        top += ((that.options.div) ? (mugeda.height + Math.min(0, mugeda.adaption.marginBottom)) : (mugeda.height + 2 * mugeda.adaption.marginBottom));
                    }
                    else if (direction == 'Right') {
                        left += -mugeda.width;
                    }
                    else if (direction == 'Left') {
                        left += mugeda.width;
                    }
                    page1.instance.left = left;
                    page1.instance.top = top;
                }

                if (opt.exit.indexOf("zoomout") >= 0) {
                    page1.instance.scaleX = 0.5;
                    page1.instance.scaleY = 0.5;
                }

                if (opt.exit.indexOf("fadeout") >= 0) {
                    page1.instance.alpha = 0;
                }

                page2.instance.top = page2.oriTop;
                page2.instance.left = page2.oriLeft;

                setTimeout(function () {
                    page1.instance.dom.m_removeClass('transition1');
                    page2.instance.dom.m_removeClass('transition1');

                    page2.instance.dom.style.zIndex = 'auto';

                    opt.scene.inTransition = false;
                    
                    for(cb in opt.scene.transitionCallbacks){
                        if(opt.scene.transitionCallbacks.hasOwnProperty(cb)){
                            var func = opt.scene.transitionCallbacks[cb];
                            func && func();
                        }                        
                    }                    
                    
                    var processScene = function (scene) {
                        if (!scene || that.options.usePage)
                            return;

                        ((window.cardFrame && cardFrame.Utils.isSlideCard())) ? scene.unfreeze({ mode: 'beginning' }) : scene.gotoAndPlay(0);
                        if (!page2.options.loop && !scene.loopHooked) {
                            scene.loopHooked = true;
                            scene.addEventListener('enterframe', function () {
                                if (scene.currentId == scene.length - 1)
                                    scene.gotoAndPause(scene.length - 1);
                            });
                        }
                    }

                    processScene(page2.getScene(true));

                    var objIdx;
                    var objlist = page2.instance.group ? page2.instance.group.objectList : [];
                    for (objIdx = 0; objIdx < objlist.length; objIdx++) {
                        var child = objlist[objIdx];
                        if (child.data.type == 2021) {
                            processScene(child.scene);
                        }
                    }

                    if (opt.onpage) {
                        opt.onpage({
                            name: page2.name
                        });
                    }

                    if (that.options.endingEffect == 'blur' && !page2['chainDown'] && !that.blurContext) {
                        loadResource('scripts/blur.js', function () {
                            that.blurContext = prepareBlurredImage(page2);
                        });
                    }

                    if(!opt.usePage) {
                        page1.instance.visible = false;
                        page1.getScene(true).freeze({mode: 'beginning'});
                    }

                    /*
                    var objlist = page1.instance.group ? page1.instance.group.objectList : [];
                    for (objIdx = 0; objIdx < objlist.length; objIdx++) {
                        var child = objlist[objIdx];
                        if (child.data.type == 2021) {
                            child.scene && child.scene.freeze({ mode: 'beginning' });
                        }
                    }
                    */
                    page1.instance.scaleX = 1;
                    page1.instance.scaleY = 1;
                    page1.instance.alpha = 1;

                    that.currentPage = page2;
                    that.animating = false;
                    that.updateArrowStatus();
                    
                    mugeda.scene.activeDirection = null;
                    
                    if(options.callback) options.callback();
                }, opt.duration)

            });

        }
    }
    Slide.prototype.openLink = function () {
        if (this.currentPage == this.lastPage && this.options.link) {
            location.href = this.options.link;
        }
    },
    Slide.prototype.walkThrough = function (callback, except) {
        except = except || [];
        except = except instanceof Array ? except : [except];
        for (var pos in this.pageList) {
            if (this.pageList.hasOwnProperty(pos)) {
                var page = this.pageList[pos];
                if (except.indexOf(page) == -1) {
                    callback(page);
                }
            }
        }

    }

    Slide.prototype.getPage = function (name) {
        var page = this.mapPages[name] || this.pageList[name];
        return page;
    }

    var pageLength;
    var pageStatus = [];
    Mugeda.scene.addEventListener('scriptReady', function () {
        var mugeda = this;
        var scene = mugeda.scene;

        if (mugeda.aniData.pages == null || mugeda.aniData.pages.length === 0) return;
        var pages = mugeda.aniData.pages;
        this.aniData.metadata = this.aniData.metadata || {};
        this.aniData.metadata.adaptMode = this.aniData.metadata.adaptMode || 'width';

        // 加载第一页
        pageLength = pages.map(function(page){
            return Mugeda.getFrameLength(page.layers);
        });
        pageLength.splice(0,0,Mugeda.getFrameLength(mugeda.aniData.layers));
        pageStatus = pageLength.map(function(){return false;});
        //console.log(pageLength);

        mugeda.cacheZone(0, pageLength[0] - 1);
    });

    var loadPage = function(mugeda, callback){
        //console.log(index)
        var startNum = 0;
        for(var i = 0; i < loadPageIndex; i++){
            startNum += pageLength[i];
        }
        mugeda.cacheZone(startNum, startNum + pageLength[loadPageIndex] - 1, null, function(process){
            //console.log('index:'+ index);
			if(process == 1){
                //setTimeout(function(){
                    callback();
                //}, 0);
            }

        });
    };

	var loadPageIndex = 0;
    var loadNext = function(mugeda){
		++loadPageIndex;
        loadPage(mugeda, function(){
			pageStatus[loadPageIndex] = true;
            if(loadPageIndex < pageLength.length)  loadNext(mugeda);
            else{
                //console.info('[加载结束]');
            }
        });
    };

    Mugeda.scene.addEventListener('renderReady', function () {
        var mugeda = this;
        var scene = mugeda.scene;

        if (mugeda.aniData.pages == null || mugeda.aniData.pages.length === 0) return;
		
		pageStatus[0] = true;
		loadNext(this);

        // 将页面暂停在每个page的最后一帧
        var lastFrame = null;
        scene.addEventListener('enterframe', function(){
            var scene = this;
            var currentFrameNum = scene.currentId;
            if(currentFrameNum == lastFrame) return;
            lastFrame = currentFrameNum;
            var pages = scene.pages;
            pages.forEach(function(page){
                if(page.startFrame + page.length - 1 == currentFrameNum && !scene.gotoFlag){
                    if(mugeda.aniData.loop && page.length > 1 && scene.playing)
                        scene.gotoAndPlay(page.startFrame);
                    else
                        scene.pause();
                    //console.info('[暂停] 到达page的最后一帧');
                }
            });
        });

        // 在page切换的瞬间，做一个transition变换
        var eventFired = false;
        mugeda.scene.addEventListener('beforeSwitchPage', function(pageIndex, defaultAction){
            var scene = this;
            // 对currentPageIndex为null的情形，说明是第一次进入动画，此时只需要显示就可以了。不需要做动画切换
            if(scene.currentPageIndex == null) return true;
            else{
                // 否则做一个transition变换
                var from = scene.currentPageIndex;
                var to = pageIndex;
                var fromDom = scene.pageDom[from];
                var toDom = scene.pageDom[to];

                if(!eventFired) {
                    eventFired = true;
                    var directions = ["Up", "Down", "Left", "Right"];
                    var pos = directions.indexOf(mugeda.scene.activeDirection);
                    
                    // TODO: Should also consider horizonal directions. 
                    
                    if(pos < 0){
                        if(from > to)
                            dir = slide.options.direction == "horizontal" ? "Left" : "Up";
                        else if(from < to)
                            dir = slide.options.direction == "horizontal" ? "Right" : "Down";
                        else
                            dir = null;
                    }
                    else 
                        dir = directions[pos];
                        
                    // var dir = pos >= 0 ? directions[pos] : from > to ? 'Up' : 'Down';
                    
                    dir && slide.animateTo(dir, false, {
                        doNow: true,
                        to: to,
                        callback: function(){
                            eventFired = false;
                            defaultAction();
							var pages = scene.pages;
							var currentFrameNum = scene.currentId;
							pages.forEach(function(page){
								if(page.startFrame + page.length - 1 == currentFrameNum){
									scene.pause();
									//console.info('[暂停] 到达page的最后一帧');
								}
							});
                        }
                    });
                }

                return false;
            }
        });

        var pages = scene.pageDom.map(function(dom, index){
            return {div: dom, scene: scene, name: index};
        });

        var divFun = {
            getCacheStatus: function (id) {
                //console.log(id);
                //if (id == 'animation2' && !check) { check = true; return false; }
                //return loadCache[id] != null;
                if(pageStatus[id]) return true;
                else {
                    var ints = setInterval(function(){
                        if(pageStatus[id]){
                            clearInterval(ints);
                            divFun.waitCallback();
                        }
                    },1000);

                    return false;
                }
            }
        }

        mugeda.aniData.pageInfo = mugeda.aniData.pageInfo || {};

        var slide = new Slide({
            usePage: true,
            pages: pages,
            div: divFun,
            width: mugeda.aniData.width,
            height: mugeda.aniData.height,
            pageHolder: mugeda.scene.dom,
            showAudioIcon: false,
            duration: mugeda.aniData.pageInfo.duration || 500,
            exit: mugeda.aniData.pageInfo.exit,
            mode: mugeda.aniData.pageInfo.transition,
            loop: parseInt(mugeda.aniData.pageInfo.loop),
            direction:mugeda.aniData.pageInfo.direction,
            scene: mugeda.scene
        });

        // 允许外部绑定一个声音
        var bindPageSlideAudio = function (audio) {
            slide.options.music = audio;
            slide.options.showAudioIcon = true;
            slide.bindAudio();
            slide.adaptView();
        };
        if (window.bindPageSlideAudio) { bindPageSlideAudio(window.bindPageSlideAudio) };
        window.bindPageSlideAudio = bindPageSlideAudio;

        window.dispatchEvent(new Event('resize'));

        scene.disablePage = function () {
            slide.disableScroll(true);
        };
        
        scene.enablePage = function () {
            slide.disableScroll(false);
        }

        // 禁止向上翻页
        scene.disablePageForward = function () {
            slide.disableScrollForward(true);
        }
        
        // 禁止向下翻页
        scene.disablePageAfter = function () {
            slide.disableScrollAfter(true);
        }

        // 恢复向上翻页
        scene.enablePageForward = function () {
            slide.disableScrollForward(false);
        }

        // 恢复向上翻页
        scene.enablePageAfter = function () {
            slide.disableScrollAfter(false);
        }
    });


    return Slide;


})();