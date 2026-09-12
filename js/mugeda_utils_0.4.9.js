/// <reference path="./mugeda_utils.d.ts" />

//base tool
MugedaHelper = {
}

/**
 * 获取指定id的HTML元素
 * @param {string} s id
 * @returns {HTMLElement}
 */
function G(s) {
  return document.getElementById(s)
}

function E(f, e, o) {
  if (!e) e = 'load';
  if (!o) o = window;
  if(e === 'load' && o.document.readyState === 'complete') return setTimeout(f);
  if (o.attachEvent) {
    o.attachEvent('on' + e, f)
  } else {
    o.addEventListener(e, f, false)
  }
}
function json(s) {
  try {
    return eval('(' + s + ')')
  } catch (e) {
    return null
  }
}
function joinParam(o) {
  if (!o || typeof o == 'string') return o;
  var r = ''; for (var k in o) r += '&' + k + '=' + encodeURIComponent(o[k]);
  if (r) r = r.substr(1);
  return r;
}

function isChooseFileData(data) {
  return !!(data && data.type === 2089);
}

function ajax(o) {
  var b = /POST/i.test(o.type),
    p = o.data || '',
    t = o.dataType,
    url = o.url || location.href,
    q = /\?/.test(url) ? '&' : '?',
    x = window.XMLHttpRequest ? new XMLHttpRequest() : (new ActiveXObject('Msxml2.XMLHTTP') || new ActiveXObject('Microsoft.XMLHTTP')),
    z = function (s) {
      if (x.readyState == 4) {
        if (x.status == 200) {
          s = x.responseText;
          if (t == 'json')
            s = json(s);
          if (b = o.success)
            b(s)
        } else if (o.error) {
          o.error(x.status, x)
        }
      }
    };

  x.onreadystatechange = z;

  if (typeof p == 'object') {
    var r = [];
    for (var k in p)
      r.push(encodeURIComponent(k) + '=' + encodeURIComponent(p[k]));

    p = r.join('&')
  }

  x.open(b ? 'POST' : 'GET', url + (b ? '' : ((p ? q : '') + p + (o.cache ? '' : (((!p && q == '?') ? '?' : '&') + (o.cache_ok ? '' : '_=' + new Date().getTime()))))),

    o.async === false ? false : true);

  if (b)
    x.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
  x.send(p);
  return x;
}

/**
 *
 * @param {Object} options Object<String, String> options.headers
 * @returns {Promise<AjaxResponse>} promise
 *
 * @description TODO 目前headers只设置了xhr里面
 */
var ajaxHelper = function (options) {
  return new Promise(function(resolve, reject) {
  options = options || {};
  options.method = options.method || "GET";
  options.type = (options.type || "text").toLowerCase();
  options.success = options.success || function () {
  };
  options.error = options.error || function () {
  };
  options.cache_ok = options.cache_ok || false;
  var noUrlMsg = {status: -5, desc: "Empty url"};
  options.url = options.url || (options.error(noUrlMsg), reject(noUrlMsg), '');

  // 如果mode为iframe, 则通过iframe去请求跨域数据, 这样做是为了解决接口返回的数据callback相同的问题
  // mode为postMessage的话, 则通过postMessage来请求数据
  options.mode = options.mode || null;

  if (options.type == "jsonp") {
    var _mats = (new Date()).getTime() + '' + Math.random();
    _mats = _mats.replace('.', '');

    // 为每一个回调设置一个唯一的回调函数，否则并发的jsonp请求可能会因为回调被注销而出错。
    options.jsonp_callback = options.jsonp_callback || "callback_" + _mats;

    // window.hashOptions = window.hashOptions || {};
    // window.hashOptions[_mats] = options;
    // window.hashOptions[''] = options;

    if (!options.cache_ok) {
        options.url += options.url.indexOf('?') > -1 ? '&' : '?';
        options.url += "_mats=" + _mats;

        if(!options.isPost) {
            options.url += '&callback=' + options.jsonp_callback;
        }
    }

    if (options.mode && options.mode == 'postMessage') {

      var BASEURL;
      try {
        BASEURL = window.Mugine.Utils.Browser.getWeixinServerHost();
      } catch(e) {
        BASEURL = (location.protocol || 'http:') + '//weika.mugeda.com';
      }
      var TARGETORIGIN = BASEURL + '/server/postMessage.html?version=5'

      var callbackName = 'postMessage_' + _mats;
      window[callbackName] = function (data, frameId, header) {
        var h = {};
        (header || '').split('\r\n').forEach(function(s){
          var a = s.split(':');
          if(a.length === 2) {
            h[a[0].trim()] = a[1].trim()
          }
        });
        options.success(data, h);
        resolve(data);
        // head.removeChild(document.getElementById(_mats));
        delete window[callbackName];
      };

      var message = {
        url: options.url,
        form: options.form || {},
        mats: _mats,
        callbackName: callbackName,
        dataType: options.postMessageType || 'JSONP',
        isPost: options.isPost || false,
        responseType: options.responseType,
        contentType: options.contentType
      };

      // window._POSTMESSAGE
      // = undefined 代表用作发送消息的iframe还没有加载
      // = [] 代表用作发送消息的iframe正在加载中，此时所有的消息都push到[]中去，等到iframe加载完后会统一一起发出去
      // = window 此时已经加载完成了，可以直接调用window.postMessage发送数据
      if (!window._POSTMESSAGE) { // post message not init
        window._POSTMESSAGE = []; // post message is loading
        window.addEventListener('message', function (event) {
          // if (event.origin !== BASEURL && event.origin.indexOf('mugeda.') == -1) {
          // 	return;
          // };

          if (event.data) {
            if (event.data.callbackName && window[event.data.callbackName]) {
              window[event.data.callbackName](event.data.res, event.data.mats, event.data.header);
            }
          } else {
            console.log('postMessage请求失败');
          }
        });


        var head = document.getElementsByTagName('head')[0];
        var iFrame = document.createElement('iframe');

        iFrame.id = _mats;
        iFrame.src = TARGETORIGIN;
        head.appendChild(iFrame);
        iFrame.onload = function () {
          var win = iFrame.contentWindow;
          window._POSTMESSAGE.forEach(function(message){
            win.postMessage(message, BASEURL);
          });
          window._POSTMESSAGE = win;
        };
        iFrame.onerror = function () {
          alert('postMessage模块加载失败。');
        };
      }

      if(Array.isArray(window._POSTMESSAGE)) {
        window._POSTMESSAGE.push(message);
      }
      else {
        window._POSTMESSAGE.postMessage(message, BASEURL);
      }

    }
    else if (options.mode && options.mode == 'iframe') {
      var head = document.getElementsByTagName('head')[0];

      var callbackName = options.jsonp_callback + '_' + _mats;
      window[callbackName] = function (data) {
        options.success(data);
        resolve(data);
        head.removeChild(document.getElementById(_mats));
        delete window[callbackName];
      };

      var iFrame = document.createElement('iframe');
      head.appendChild(iFrame);
      var iframedocument = iFrame.contentDocument;
      var iframeWindow = iFrame.contentWindow;
      iFrame.id = _mats;
      iframedocument.open();
      iframedocument.write('<html><head><title>_iframe</title></head><body><script>window["' + options.jsonp_callback + '"] = function (data) {window.parent["' + callbackName + '"](data)}</script><script type="text/javascript" src="' + options.url + '"></script></body></html>');
      iframedocument.close();
    }
    else {
      var ok = false;
      window[options.jsonp_callback] = (function(options) {
        return function (data) {
          ok = true;
          // var opts = window.hashOptions[data._mats || ''];
          var opts = options;
          opts.success(data);
          resolve(data);
          // 触发过的JSONP回调函数需要注销，否则会对后续ajax产生干扰。
          delete window[opts.jsonp_callback];
        }
      })(options);

      var head = document.getElementsByTagName('head')[0];
      var script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = options.url;
      script._mats = _mats;
      script.onload = function () {
        if (!ok)
          ; // options.error({status:-3,desc:"jsonp not loaded correctly for the URL "+options.url});
      };
      script.onerror = (function(options) {
        return function () {
          // var opts = window.hashOptions[this._mats || ''];
          var opts = options;
          var msg = {status: -2, desc: "Failed to load the url: " + options.url};
          opts.error(msg);
          delete window[opts.jsonp_callback];
          reject(msg);
        }
      })(options);

      head.appendChild(script);
    }
  }
  else if (options.type == "fetch" && window.fetch) {
    try {
      var fetchOptions = {
        method: options.method || 'GET',
        credentials: options.credentials || 'include'
      };
      if (options.data) {
          fetchOptions.body = options.data;
      }
      fetch(options.url, fetchOptions).then(function (response) {
        if (response.status !== 200) {
            var msg = {
                status: response.status,
                desc: "Error in fetching data " + response.statusText
              };
          options.error && options.error(msg);
          reject(msg);
          return;
        }

        response.json().then(function (result) {
          options.success(result);
          resolve(result);

        });

      });
    } catch (e) {
      var msg = {
        status: -1,
        desc: "Error in fetching data " + e.toString()
      }
      options.error && options.error(msg);
      reject(msg);

    }
  }
  else {
    var xmlhttp;
    if (window.XMLHttpRequest) {// code for IE7+, Firefox, Chrome, Opera, Safari
      xmlhttp = new XMLHttpRequest();
    } else {
      var msg = {status: -3, desc: "Platform not supported"};
      options.error(msg);
      reject(msg);

    }

    xmlhttp.withCredentials = options.withCredentials || true;
    xmlhttp.onreadystatechange = function () {
      if (xmlhttp.readyState == 4) {
        if (xmlhttp.status == 200) {
          var desc = "ok";
          if (options.type == "json") {
            try {
              var data = JSON.parse(xmlhttp.responseText);
              options.success(data);
              resolve(data);
            } catch (e) {
              desc = e.toString();
              var msg = {status: -6, desc: "Error in parsing JSON (" + desc + ")"};
              options.error(msg);
              reject(msg);

            }
          } else if (options.type == "data" || options.type == "buffer") {
            options.success(xmlhttp.response);
            resolve(xmlhttp.response);
          } else if (options.type == "text") {
            options.success(xmlhttp.responseText);
            resolve(xmlhttp.responseText);
          }
        } else {
          var msg = {status: xmlhttp.status, desc: "Error in fetching data (code " + xmlhttp.status + ")"};
          options.error(msg);
          reject(msg);
        }
      }

    }

    if (options.type == 'data') {
      xmlhttp.responseType = 'blob';
    }
    else if (options.type == 'buffer') {
      xmlhttp.responseType = 'arraybuffer';
    }

    xmlhttp.open(options.method, options.url, true);

    // 处理自定义的headers
    for (var key in options.headers || []) {
        xmlhttp.setRequestHeader(key, options.headers[key]);
    }

    if (options.formData) {
      xmlhttp.send(options.formData);
    } else {
      xmlhttp.send();
    }
  }
  });
}

/**
 * 把一个img元素转成base64
 * @param {HTMLImageElement} imgEl
 * @returns {string} dataURL
 */
MugedaHelper.imgElementToBase64 = function(imgEl) {
    var canvas = document.createElement("canvas");
    canvas.width = imgEl.width;
    canvas.height = imgEl.height;
    var ctx = canvas.getContext("2d");
    ctx.drawImage(imgEl, 0, 0, imgEl.width, imgEl.height);
    var dataURL = canvas.toDataURL("image/png", 0.5);
    return dataURL;
};

/**
 * 上传base64格式的图片
 * @param {string} imgData
 * @returns {Promise<AjaxResponse>} promise
 */
MugedaHelper.uploadImageBase64 = function(imgData) {
    MugedaHelper.uploadImage({
        type: 'base64',
        imgData: imgData
    })
}

function checkFileType(url) {
  // 正则表达式
  const pattern = /\.(jpe?g|png|gif|bmp|webp|svg|tiff?|ico)$|\.(mp3|wav|flac|aac|ogg|wma|m4a|midi?)$/i;

  // 匹配后缀
  const match = url.match(pattern);
  if (match) {
      if (match[1]) {  // 图片文件
          return "image";
      } else if (match[2]) {  // 音频文件
          return "audio";
      }
  }
  return "";
}

// 返回{ type: "url"| "base64", mediaType: "image"| "audio"| "" }
function checkFileTypeIncludeBase64Url(data) {
    if (typeof data !== 'string') {
        return { type: "", mediaType: "" };
    }
    if (data.startsWith('data:image/')) {
        return { type: "base64", mediaType: "image" };
    }
    else if (data.startsWith('data:audio/')) {
        return { type: "base64", mediaType: "audio" };
    }
    else {
        var mediaType = checkFileType(data);
        if (mediaType) {
            return { type: "url", mediaType: mediaType };
        }
        else {
            return { type: "", mediaType: "" };
        }
    }
}

MugedaHelper.uploadImage = function(param) {
    var mediaType = ''
    if(param.type === 'base64') {
        if(param.imgData) {
            var type = /data:image\/(.*);/.test(param.imgData) && window['RegExp']['$1'];
            var imgData = param.imgData.replace(/data:image\/(.*);base64,/, '');
            mediaType = 'image'
        }
        else if(param.audioData) {
            var type = /data:audio\/(.*);/.test(param.audioData) && window['RegExp']['$1'];
            var imgData = param.audioData.replace(/data:audio\/(.*);base64,/, '');
            mediaType = 'audio'
        }
        else {
            return Promise.reject({ 'status': 20004, 'desc': '上传数据为空' });
        }
    } else if(param.type === 'url') {
        var uploadSrcUrl = param.url;

        if (!uploadSrcUrl) {
            return Promise.reject({ 'status': 20004, 'desc': '上传图片地址为空' });
        }

        mediaType = checkFileType(uploadSrcUrl);
    } else {
        return Promise.reject({ 'status': 20004, 'desc': '不支持的上传类型' });
    }

    var token = /token=(.*)(?:;|$)/.test(document.cookie) && window['RegExp']['$1'] || '';

    var dataServer = window.Mugine.Utils.Browser.getWeixinServerHost();


    if(window['_mrmcp'] && window['_mrmcp']['creative_id'])
        var crid = window['_mrmcp']['creative_id'];

    var customerVisitorTailorUid = '';
    if(window['_mrmcp'] && window['_mrmcp']['customer_visitor_tailor_uid'])
        customerVisitorTailorUid = window['_mrmcp']['customer_visitor_tailor_uid'];
    var formStr = 'urid='
        + (crid ? '&crid=' + crid : '')
        + '&' + 'login=' + 'true'
        + '&' + 'token=' + token
        + (customerVisitorTailorUid ? '&customer_visitor_tailor_uid=' + customerVisitorTailorUid : '');

    if(param.type === 'base64') {
        formStr += '&imgdata=' + encodeURIComponent(imgData)
        formStr += '&type=' + type
    } else if(param.type === 'url') {
        formStr += '&url=' + uploadSrcUrl
    }

    var re = Mugeda['getContentId']();
    // 原 reportResource 参数
    formStr += '&_tp=' + mediaType
    formStr += '&_msuid=' + getMsuid()
    formStr += '&_id=' + param['guid'] || ''
    formStr += '&mode=' + re['mode']

    return ajaxHelper({
        method: "POST",
        url: dataServer + '/server/app_asset.php/u',
        type: "json",
        withCredentials: true,
        headers: {
            "Content-Type" : "application/x-www-form-urlencoded"
        },
        formData: formStr
    });
}

/**
 * 判断是否是移动设备
 * @returns {boolean} isMobile
 */
function isMobile() {
  var isMobile = navigator.userAgent.match(/Android/i)
    || navigator.userAgent.match(/webOS/i)
    || navigator.userAgent.match(/iPhone/i)
    || navigator.userAgent.match(/iPad/i)
    || navigator.userAgent.match(/iPod/i)
    || navigator.userAgent.match(/BlackBerry/i)
    || navigator.userAgent.match(/Windows Phone/i);

  return isMobile ? true : false;
}

function fo(o) {
  var x = 0;
  var y = 0;
  do {
    x += o.offsetLeft || 0;
    y += o.offsetTop || 0;
  } while (o = o.offsetParent);
  return {
    x: x,
    y: y
  }
}
function fe(e) {
  e = e || event;
  return {
    x: e.pageX || e.x,
    y: e.pageY || e.y
  }
}
function fc(e) {
  if (e && e.stopPropagation) {
    e.stopPropagation();
  } else {
    event.cancelBubble = true
  }
}

function getClass(a, b) {
  var r = new RegExp('(^|\\s*)' + a + '(\\s*|$)'), e = b ? document.getElementsByTagName(b) : document.getElementsByTagName('*') || document.all, s = [];
  for (var i = 0, l = e.length; i < l; i++) {
    if (r.test(e[i].className)) {
      s.push(e[i]);
    }
  }
  return s;
}

var setCookie = function (c_name, value, expiredays) {
  var exdate = new Date();
  var domain_parts = window.location.host.split('.');
  var len = domain_parts.length;
  var domain = '';

  if (len >= 2) {
    domain = '.' + domain_parts[len - 2] + '.' + domain_parts[len - 1];
  } else {
    domain = '.mugeda.com';
  }

  exdate.setDate(exdate.getDate() + expiredays);
  document.cookie = c_name + "=" + escape(value) + ((expiredays == null) ? "" : ";expires=" + exdate.toGMTString()) + "; domain=" + domain + "; path=/";
};

var getCookie = function (c_name) {
  if (document.cookie.length > 0) {
    var c_start = document.cookie.indexOf(c_name + "=")
    if (c_start != -1) {
      c_start = c_start + c_name.length + 1;
      c_end = document.cookie.indexOf(";", c_start);
      if (c_end == -1) c_end = document.cookie.length;
      return unescape(document.cookie.substring(c_start, c_end));
    }
  }
  return ""
};

/**
 * 从url中获取GET参数
 * @param {string} key
 * @returns {string} value
 */
var getUrlParam = function(key) {
  var href = window.location.href;
  var url = href.split("?");
  if(url.length <= 1){
     return "";
  }
  var params = url[1].split("&");

  for(var i=0; i<params.length; i++){
     var param = params[i].split("=");
     if(key == param[0]){
        return param[1];
     }
  }
}

/**
 * 设置`window.__MSUID`并返回新的值
 * @param {Function<string, string>} callback uid处理函数
 * @returns {string} uid
 */
var getMsuid = function(callback) {
    // 暂时在各自域名下处理msuid
    function genSessionId(length) {
        var str = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'.split("");
        var time = Number(+new Date()).toString(36);

        for (var i = 0, id = "", len = str.length; i < length; i++) {
            id += str[Math.floor(Math.random() * len)];
        }

        return time + id.toLowerCase();
    };

    var uid = localStorage.getItem('msuid');
    if(!uid) {
        uid = genSessionId(32)
        localStorage.setItem('msuid', uid);
    }
    // 使用原生API获取params
    var usp = new URLSearchParams(location.search);
    if (usp.has('msuid')) {
        uid = usp.get('msuid');
    }
    window['__MSUID'] = uid;
    if (!callback || typeof callback != 'function') {
        return uid;
    }
    return callback(uid);



    // 新的msuid获取逻辑, 为了能在不同域名下拿到统一的msuid, 所有的msuid都通过mgd5域名下的frame页面拿到
	// 所以这个函数就成了异步函数, 函数会在第一次拿到msuid的时候将他给到window.__MSUID

  // window上如果已经有了__MSUID, 直接返回, 不需要重新请求
  if (!callback || typeof callback != 'function') {
    return window['__MSUID'] || 0;
  };
  if (window['__MSUID']) {
    callback && callback(window['__MSUID']);
    return window['__MSUID'];
  }

  // Max 恢复支持msuid作为链接参数的获取方式
  if (getUrlParam('msuid')) {
    window['__MSUID'] = getUrlParam('msuid');
    return window['__MSUID']
  }

  // 所有的请求存至队列中
  if (!window['_msuidQueue']) {
    window['_msuidQueue'] = {};
  }
  var queue = window['_msuidQueue'];
  var mats = ((new Date()).getTime() + '' + Math.random()).replace('.', '');
  queue[mats] = callback;

  var frameReady = function () {
    // frameload标记
    window['_msuidFrameLoaded'] = true;

    // 发送请求
    var BASEURL = (location.protocol || 'http:') + '//card.mugeda.com';
    var iFrame = window['_msuidFrame'];

    var message = {
      "getMsuid": true,
      "msuidCallbackName": mats
    };

    var iframeWindow = iFrame.contentWindow;
    iframeWindow.postMessage(message, BASEURL);
  };

  var createFrame = function (createCallback) {
    var BASEURL = (location.protocol || 'http:') + '//card.mugeda.com';
    var frameUrl = '//card.mugeda.com/card/getMsuid.html';

    var head = document.getElementsByTagName('head')[0];
    var iFrame = document.createElement('iframe');
    iFrame.src = frameUrl;
    iFrame.id = 'postMessage-msuid';

    iFrame.addEventListener('load', frameReady);
    window.addEventListener('message', function (event) {
      if (event['data'] && event['data']['type'] === 'getMsuid') {
        window['__MSUID'] = event['data']['msuid'];
        if(queue[event['data']['msuidCallbackName']])
          queue[event['data']['msuidCallbackName']](event.data.msuid);

        delete queue[event['data']['msuidCallbackName']];
      } else {
        console.log('postMessage收到未识别消息类型：' + (event['data'] ? event['data']['type'] : '（未定义）') + ', 忽略...');
      }
    });

    iFrame.onerror = function () {
      console.log('getMsuid模块加载失败');
    };


    head.appendChild(iFrame);

    window['_msuidFrame'] = iFrame;
    createCallback && createCallback();
  };

  // 每次进来都检查是否已生成了frame
  if (!window['_msuidFrame']) {
    createFrame();
  } else {
    // 如果已生成了frame, 则需要检查frame是否onload, 如果没有onload, 所有的请求需排队
    if (window['_msuidFrameLoaded']) {
      frameReady();
    } else {
      window['_msuidFrame'].addEventListener('load', frameReady);
    }
  }
}

/**
 * 根据url中的`owner_id`参数设置并返回`window.__OWNERID`
 *
 * @returns {string} owner_id
 *
 * @description owner_id被用在了培训系统中，疑似不再使用
 *
 * @deprecated
 */
var getOwnerid = function() {
  if (getUrlParam('owner_id')) {
    window['__OWNERID'] = getUrlParam('owner_id');
    return getUrlParam('owner_id')
  } else {
    return ''
  }
}

if(window.Mugeda) {
    Mugeda.getMsuid = getMsuid;
}

/**
 * 使用JSON序列化的方式拷贝一个对象
 * @param {Object} obj
 * @returns {Object} clonedObj
 */
JSON.clone = function (obj) {
  return JSON.parse(JSON.stringify(obj));
};

/**
 *
 * @param {HTMLElement} obj
 * @returns 距离左上角的偏移
 */
function getElementOffset(obj) {
  var top = 0;
  var left = 0;
  while (obj && obj.tagName != "BODY") {
    top += obj.offsetTop;
    left += obj.offsetLeft;
    obj = obj.offsetParent;
  }
  return { top: top, left: left };
};

Mugeda = window.Mugeda || {};

window._mrmcp = window._mrmcp || {};
var creative_path = (_mrmcp['creative_path'] || '');
if(Array.isArray(creative_path)) creative_path = creative_path[0];
if (creative_path.length && creative_path[creative_path.length - 1] != '/')
  creative_path += '/';

var close_img_url = _mrmcp.previewMode ? '/client/close_button.png' : creative_path + 'images/close_button.png';

var MugedaTools = window['MugedaTools'] = window['MugedaTools'] || {};

MugedaTools['message'] = (function () {
  var msgDiv;
  var msgInfo;
  var animationRulesPool = [];
  var animationRuleHash = {};

  var prefix = (function () {
    var styles = window.getComputedStyle(document.documentElement, ''),
      pre = (Array.prototype.slice
        .call(styles)
        .join('')
        .match(/-(moz|webkit|ms)-/) || (['', ''])
      )[1],
      dom = ('WebKit|Moz|MS').match(new RegExp('(' + pre + ')', 'i'))[1];
    return {
      dom: dom,
      lowercase: pre,
      css: '-' + pre + '-',
      js: pre[0].toUpperCase() + pre.substr(1)
    };
  })();

  var insertKeyframes = function (rule) {
    var style = document.createElement("style");
    document.head.appendChild(style);
    var styleSheet = style.sheet;

    var className = "spin_" + (new Date()).getTime();
    var text = '@' + prefix.css + 'keyframes ' + className + '{ ' + rule + '}';
    if (animationRulesPool.length) {
      var cssRule = animationRulesPool.pop();
      var animationName = cssRule.name;
      var oriLen = animationRuleHash[animationName];
      delete animationRuleHash[animationName];
      //cssRule.cssText = text;

      styleSheet.deleteRule(oriLen);
      styleSheet.insertRule(text, oriLen);

      animationRuleHash[className] = oriLen;
    }
    else {
      var len = styleSheet.cssRules.length;
      try { styleSheet.insertRule(text, len); } catch (e) { }
      animationRuleHash[className] = len;
    }
    return className;
  };

  function rotateElement(elem, time) {
    var animationName = insertKeyframes('from {' + prefix.css + 'transform:rotate( 0deg ) }' +
      'to {' + prefix.css + 'transform:rotate( 360deg ) }');
    elem.style.cssText += prefix.css + 'animation:' + animationName + ' ' + time + 'ms linear infinite;';
  }
  /**
   *
   * @param {string} msg 要显示的消息
   * @param {MugedaToolMessageShowOptions} opts
   * @returns
   */
  function show(msg, opts) {
    opts = opts || {};
    if (msgDiv) {
      if (msgInfo) {
        msgInfo.innerHTML = msg || '';
      }
      return;
    }

    var mask = document.createElement('div');
    mask.className = 'mugeda_mask';
    var parent = opts.parent || document.body;
    var hideShade = opts.hideShade;
    var center = opts.center;
    var clickable = opts.clickable;
    var panel = mask.appendChild(document.createElement('div'));
    var spin = panel.appendChild(document.createElement('div'));
    var info = panel.appendChild(document.createElement('div'));

    mask.style.cssText = clickable ? 'text-align: center; display: block; position: absolute;left: 50%; top: 50%; transform: translate(-50%, -50%);' :
      'position:fixed;left:0;right:0;top:0;bottom:0;text-align:center;line-height:' + (opts.parent ? parent.offsetHeight : document.body.clientHeight || document.documentElement.clientHeight) + 'px';
    panel.style.cssText = 'padding-top:10px; line-height:30px;display:inline-block;padding:8px; background-color:rgba(0,0,0,' + (hideShade ? 0 : 0.6) + ');border-radius:4px;' + (center ? 'position:relative;top:32px;' : '');
    panel.align = 'center';
    spin.style.cssText = 'width: 24px; height: 24px; display: block; border-radius: 50%; border-left: 2px solid #F36523; border-top: 2px solid #F36523; border-right: 2px solid white; border-bottom: 2px solid white; margin: 16px;';
    info.style.cssText = 'text-align:center;color:#fff;font:normal 12px "microsoft yahei";';

    info.innerHTML = msg || '';
    msgInfo = info;
    msgDiv = parent.appendChild(mask);

    rotateElement(spin, 1200);
  }

  function close() {
    if (msgDiv) {
      msgDiv.parentNode.removeChild(msgDiv);
      msgDiv = null;
      msgInfo = null;
    }
  }

  function showTikuEnd(tikuData, container, meta) {

    var icon = '<svg style="vertical-align: middle; width: 16px; height: 18px; margin-right: 12px;" t="1634033714371" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2643" xmlns:xlink="http://www.w3.org/1999/xlink" width="32" height="32"><defs><style type="text/css"></style></defs><path d="M204.8 51.2h614.4a102.4 102.4 0 0 1 102.4 102.4v716.8a102.4 102.4 0 0 1-102.4 102.4H204.8a102.4 102.4 0 0 1-102.4-102.4V153.6a102.4 102.4 0 0 1 102.4-102.4z m0 51.2a51.2 51.2 0 0 0-51.2 51.2v716.8a51.2 51.2 0 0 0 51.2 51.2h614.4a51.2 51.2 0 0 0 51.2-51.2V153.6a51.2 51.2 0 0 0-51.2-51.2H204.8z m277.8624 606.0032l253.44-253.44 36.1472 36.1984-289.5872 289.6384-181.0432-181.0432 36.1984-36.1984 144.8448 144.8448zM256 307.2h512v51.2H256V307.2z" p-id="2644" fill="#999999"></path></svg>'

    // 计算答题时长（使用 开始答题时间 和 完成时间），并格式化为 h:mm:ss
    var _parseTime = function(v){
      if(!v && v !== 0) return null;
      // 如果是数字（毫秒时间戳）
      if (typeof v === 'number') return new Date(v);
      // 如果字符串像 2025-11-14 00:42:11，则替换成可解析的 ISO 形式
      if (typeof v === 'string') {
        var s = v.trim();
        // 支持 / 和 - 以及 空格 分隔的时间
        // 把第一个空格换成 T，保证 new Date 能正确解析
        if (/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}$/.test(s)) {
          s = s.replace(' ', 'T');
        }
        var d = new Date(s);
        if (!isNaN(d.getTime())) return d;
        // 尝试 parseInt 当作时间戳
        var n = parseInt(s, 10);
        if (!isNaN(n)) return new Date(n);
      }
      return null;
    };

    var startDate = _parseTime(tikuData['开始答题时间'] || tikuData['startTime'] || (tikuData.examData && json(tikuData.examData) && json(tikuData.examData).startTime));
    var endDate = _parseTime(tikuData['完成时间'] || tikuData['完成时间'] === 0 ? tikuData['完成时间'] : (tikuData['完成时间'] || tikuData['完成'] || (tikuData.examData && json(tikuData.examData) && json(tikuData.examData).endTime)));

    var durationStr = tikuData['完成答卷时长'] || '';
    if (startDate && endDate && !isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
      var diff = Math.max(0, endDate.getTime() - startDate.getTime());
      var hours = Math.floor(diff / (1000 * 60 * 60));
      var mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      var secs = Math.floor((diff % (1000 * 60)) / 1000);
      var pad = function(n){ return (n < 10 ? '0' + n : '' + n); };
      durationStr = hours + ':' + pad(mins) + ':' + pad(secs);
    }

    // 提交时间只显示 h:mm:ss，从完成时间解析
    var submitTimeStr = '';
    if (endDate && !isNaN(endDate.getTime())) {
      var hh = endDate.getHours();
      var mm = endDate.getMinutes();
      var ss = endDate.getSeconds();
      var pad = function(n){ return (n < 10 ? '0' + n : '' + n); };
      submitTimeStr = hh + ':' + pad(mm) + ':' + pad(ss);
    } else if (typeof tikuData['完成时间'] === 'string') {
      // 尝试从字符串末尾提取时间部分 HH:MM:SS
      var m = (tikuData['完成时间'] || '').match(/(\d{2}:\d{2}:\d{2})/);
      submitTimeStr = m ? m[1] : '';
    }

    // 根据 meta.hideScore 决定分数显示逻辑
    var hideScore = !!(meta && meta.hideScore);

    var scoreHtml = '';
    if (hideScore) {
      // 仅显示提交成功文案，隐藏具体分数
      scoreHtml += '<div class="score1">提交成功</div>';
    } else {
      scoreHtml += '<div class="score1">你的分数</div>';
      scoreHtml += '<div class="score2"><span class="p-score" style="font-size: 46px;">' + (tikuData['最终得分'] != null ? tikuData['最终得分'] : '') + '</span>分</div>';
    }

    var title3Html = '';
    if (!hideScore) {
      title3Html = '<div class="title3" style="margin-top: 40px; color: #666; font-size: 18px;">' + icon + '通过分数：<span class="p-total">' + (tikuData['通过分数'] || 0) + '</span>分</div>';
    }

    // 如果需要显示反馈入口，则在通过分数下面添加一个初始隐藏的按钮元素
    var feedbackHtml = '';
    if (meta && meta.showFeedback) {
      // 使用 inline onmouseover/onmouseout 来兼容没有外部 CSS 的场景，初始 display:none
      feedbackHtml = '<div class="p-feedback-btn" style="padding:8px 16px;border: 1px solid #cdcdcd;background:#eee;color:#343434;margin-top:40px;border-radius:3px;cursor: pointer;" '
        + 'onmouseover="this.style.background=\'#e6e6e6\'" onmouseout="this.style.background=\'#eee\'">查看答题反馈</div>';
    }

    var tpl = '<div class="result" style="display: flex;flex-direction: column;position: fixed; top: 0; left: 0; width: 100%; height: 100%; background:#F5F5F5; box-sizing: border-box; align-items: center; text-align: center; justify-content: center;">'
    tpl += '    <div class="layout">'
    tpl += '        <div class="title1" style="font-size: 30px; color: #333;">' + (tikuData['考试名称'] || '') + '</div>'
    tpl += '        <div class="title2" style="margin-top: 14px; font-size: 14px; color: #666;">答题时间 <span class="p_time">' + durationStr + '</span></div>'
    tpl += '        <div class="title2" style="margin-top: 8px; font-size: 14px; color: #666;">提交时间 <span class="p_submit_time">' + submitTimeStr + '</span></div>'
    tpl += '        <div class="c1" style="margin-top: 57px; background: rgba(64,158,255,0.10); border-radius: 50%;">'
    tpl += '            <div class="c2" style="display:inline-block; margin: 15px; box-sizing: border-box; background: rgba(64,158,255,0.30); border-radius: 50%;">'
    tpl += '                <div class="c3" style="display:inline-flex; width: 170px; height: 170px; margin: 15px; background-image: linear-gradient(-180deg, #8CC5FF 0%, #1393FF 100%); border-radius: 50%; text-align: center; justify-content: center; flex-direction: column; font-size: 16px; color: white;">'
    tpl += scoreHtml;
    tpl += '                </div>'
    tpl += '            </div>'
    tpl += '        </div>'
  tpl += title3Html;
  tpl += feedbackHtml;
    tpl += '    </div>'
    tpl += '</div>'

    var mask = document.createElement('div');
    mask.className = 'mugeda_tiku_mask';
    mask.style.cssText = 'position:fixed;left:0;right:0;top:0;bottom:0;text-align:center;';
    mask.innerHTML = tpl
    var parent = container || document.body;

    msgDiv = parent.appendChild(mask);
    // 绑定反馈按钮的 click 事件，事件回调通过全局钩子 `window.onTikuFeedbackClick` 实现（由上层定义）
    try {
      var fbBtn = msgDiv.querySelector && msgDiv.querySelector('.p-feedback-btn');
      if (fbBtn) {
        fbBtn.addEventListener('click', function (e) {
          // 先关闭/隐藏弹层
          msgDiv.style.display = 'none';
        }, false);
      }
    } catch (e) {
      console.error(e);
    }
  }

  return {
    show: show,
    close: close,
    showTikuEnd: showTikuEnd
  };
})();

/**
 * 递归处理Object的所有原始值
 * @param {Object} data object
 * @param {string} context prefix
 * @param {(data: Object,prop: string)=> void} callback
 */
MugedaTools['iterate'] = function (data, context, callback) {
  for (var property in data) {
    if (data.hasOwnProperty(property)) {
      if (typeof data[property] == "object") {
        MugedaTools['iterate'](data[property], context + '.' + property, callback);
      } else {
        callback && callback(data, property);
      }
    }
  }
};

MugedaTools['detectSecurityRisk'] = function (val) {
  val = (val || '').toLowerCase();
  var detected = val.match(/\b(fscommand|onabort|onactivate|onafterprint|onafterupdate|onbeforeactivate|onbeforecopy|onbeforecut|onbeforedeactivate|onbeforeeditfocus|onbeforepaste|onbeforeprint|onbeforeunload|onbeforeupdate|onblur|onbounce|oncellchange|onchange|onclick|oncontextmenu|oncontrolselect|oncopy|oncut|ondataavailable|ondatasetchanged|ondatasetcomplete|ondblclick|ondeactivate|ondrag|ondragend|ondragleave|ondragenter|ondragover|ondragdrop|ondragstart|ondrop|onend|onerror|onerrorupdate|onfilterchange|onfinish|onfocus|onfocusin|onfocusout|onhashchange|onhelp|oninput|onkeydown|onkeypress|onkeyup|onlayoutcomplete|onload|onlosecapture|onmediacomplete|onmediaerror|onmessage|onmousedown|onmouseenter|onmouseleave|onmousemove|onmouseout|onmouseover|onmouseup|onmousewheel|onmove|onmoveend|onmovestart|onoffline|ononline|onoutofsync|onpaste|onpause|onpopstate|onprogress|onpropertychange|onreadystatechange|onredo|onrepeat|onreset|onresize|onresizeend|onresizestart|onresume|onreverse|onrowsenter|onrowexit|onrowdelete|onrowinserted|onscroll|onseek|onselect|onselectionchange|onselectstart|onstart|onstop|onstorage|onsyncrestored|onsubmit|ontimeerror|ontrackchange|onundo|onunload|onurlflip|seeksegmenttime|javascript|eval|fromcharcode|window(\.|\['|\[")|document(\.|\['|\["))\b/g) ||
    val.match(/\b(background\-image\s*\:|background\s*\:|href\s*\=|src\s*\=|style\s*\=)/g) ||
    val.match(/\<(script|link|img|input|style|meta|iframe|frame|table|td|tr|div|base|object|embed|xml)/g);

  return detected;
};


/////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////
//                        MRAID Implementation                         //
/////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////


MugedaMraid = {
  mraidReadyStatus: 0,
  mraidState: undefined,

  getStage: function () {
    var target = null;
    if (window.event)
      target = window.event.target || window.event.srcElement;

    while (target) {
      if ((target.id || '').indexOf("_stage") > 0 || (target.getAttribute && (target.getAttribute('data-mid') == 0)))
        break;
      target = target.parentNode;
    }

    if (target)
      return target;
    else
      return document.getElementsByClassName("MugedaStage")[0];
  },

  setMraidState: function (state) {
    _mrmcp = (typeof _mrmcp == 'undefined') ? {} : _mrmcp;
    var displayMode = _mrmcp['display_mode'];
    var placementType = mraid.getPlacementType();
    this.mraidState = state.toLowerCase();

    var imgClose = document.getElementById('mugeda_close_button');
    switch (this.mraidState) {
      case "default":

        if (displayMode != "expand" && placementType != "interstitial" && imgClose) {
          imgClose.style.display = "none";
        }
        if ((typeof Mugeda != "undefined") && Mugeda.gotoAndPlay)
          Mugeda.gotoAndPlay(1);
        break;
      case "expanded":
        if (displayMode == "auto" || displayMode == "expand" || displayMode == "interstitial") {
          // Avoid accident click.
          setTimeout(function () {
            imgClose.style.display = "block";
          }, 50);
        }
        break;
      case "resized":
        {
          // Always display our own close indicator for the resized.
          // Avoid accident click.
          setTimeout(function () {
            imgClose.style.display = "block";
          }, 50);
        }
        break;
    }
  },

  openLink: function (url, target, replace) {
    _mrmcp = (typeof _mrmcp == 'undefined') ? {} : _mrmcp;
    if (_mrmcp["destination_url"] && _mrmcp["destination_url"].indexOf('%DESTURL%') < 0)
      url = _mrmcp["destination_url"];

    if (!url)
      return;
    // 添加默认http头防止后端无法识别
    var checkNoHttp = function (url) {
      var isHttp = /^http:\/\/.*/i.test(url) || /^http%3A%2F%2F.*/i.test(url);
      var isHttps = /^https:\/\/.*/i.test(url) || /^https%3A%2F%2F.*/i.test(url);
      return !isHttp && !isHttps
    }
    var url_arr = url.split('?url=');
    if (url_arr[1] && checkNoHttp(url_arr[1])) {
      url_arr[1] = 'http://' + url_arr[1];
      url = url_arr[0] + '?url=' + url_arr[1];
    } else if (!url_arr[1] && checkNoHttp(url)) {
      url = 'http://' + url;
    }

    var rawUrl = url;
    var extraParams = "ts=" + (new Date()).getTime();
    extraParams += "&_moid=" + (_mrmcp["owner_id"] || "");
    extraParams += "&_mcid=" + (_mrmcp["creative_id"] || "");
    extraParams += "&_mw=" + (_mrmcp["width"] || "");
    extraParams += "&_mh=" + (_mrmcp["height"] || "");
    extraParams += "&_mtp=" + (_mrmcp["type"] || "");
    extraParams += "&_mtt=" + encodeURIComponent(_mrmcp["title"] || "");
    var custom = _mrmcp["custom_params"];
    if (custom && custom.indexOf('%CUSTOMPARAM%') < 0)
      extraParams += "&" + custom;

    var redir = _mrmcp["redirect_url"];
    if (redir) {
      if (redir.indexOf('%LINK%') < 0) {
        var pos = url.indexOf('?');
        var connector = pos < 0 ? '?' : '&';
        url = redir + ((redir.lastIndexOf('=') == redir.length - 1) ? encodeURIComponent(url + connector + extraParams) : "");
        rawUrl = url;
      }
    }

    var items = url.split('#');
    var anchor = '';
    if (items.length > 1) {
      anchor = items[1];
      url = items[0];
    }
    var pos = url.indexOf('?');
    var parTag = pos < 0 ? '?' : '&';
    var noParam = (pos == url.length - 1);
    var search = window.location.search;
    if (search) {
      var params = search.split('?')[1];
      var keyValues = params.split('&');
      var keyLen = keyValues.length;
      for (var i = 0; i < keyLen; i++) {
        var pairs = keyValues[i].split('=');
        if (pairs.length == 2) {
          var key = pairs[0];
          var value = pairs[1];
          if (key.toLowerCase() == "mugeda_click_link") {
            url = unescape(value);
            pos = url.indexOf('?');
            parTag = url < 0 ? '?' : '&';
            noParam = (pos == url.length - 1);
          }
        }
      }
      url += (noParam ? '' : parTag) + params;
      noParam = false;
      if (params.length)
        parTag = '&';
    }

    url += (noParam ? '' : parTag) + extraParams + (anchor ? '#' + anchor : '');

    // if(Mugeda.previewMode)
    //    url = 'preview_jump.html?jump='+encodeURIComponent(url);

    if (this.mraidReadyStatus == 1) {
      if (target == "internal")
        mraid.open(rawUrl);
      else if (target == "expand")
        this.expand(rawUrl, 0);
      else
        window.open(rawUrl);
    }
    else {
      if (target == "internal")
        if(replace) {
          window.location.replace(rawUrl)
        }
        else {
          window.location = rawUrl;
        }
      else if (target == "expand")
        this.expand(rawUrl);
      else
        window.open(rawUrl);
    }

    MugedaTracker.fireEvent({
      category: "link",
      action: target,
      label: url,
      value: 0
    });
  },

  expand: function (url, mode, params) {
    _mrmcp = (typeof _mrmcp == 'undefined') ? {} : _mrmcp;
    if (this.mraidReadyStatus != 1) {
      if (url && url.length) {
        var urlCurrent = document.URL;
        var isPreview = urlCurrent.match(/client.*preview.*id/);
        var docTop = null;
        var divExpand = null;
        try {
          var top = isPreview ? window : window.parent;
          docTop = top.document;
          divExpand = docTop.getElementById('mugeda_expanded') || docTop.createElement('div');
        } catch (e) {
          window.open(url);
          return;
        }

        var idx = url.match(/^(\/|http:|https:)/i);
        if (!idx)
          url = (_mrmcp['creative_path'] || '') + url;

        divExpand.id = "mugeda_expanded";
        divExpand.style.display = "block";
        divExpand.style.position = "fixed";
        divExpand.style.width = (docTop.defaultView.innerWidth || docTop.documentElement.clientWidth) + "px";
        divExpand.style.height = (docTop.defaultView.innerHeight || docTop.defaultView.innerHeight) + "px";
        divExpand.style.left = 0 + "px";
        divExpand.style.margin = "0";
        divExpand.style.padding = "0";
        divExpand.style.border = "none";
        divExpand.style.top = 0 + "px";
        divExpand.style.background = "#000";
        divExpand.innerHTML = "<iframe id='mugeda_expand_iframe' src='" + url + "' style='border:none;width:100%;height:100%;margin:0px;padding:0px;'></iframe>";
        docTop.body.appendChild(divExpand);
        MugedaBehavior.processCloseButton("expand", docTop);
      }
      return;
    }

    var params = params || {};
    var maxSize = mraid.getMaxSize();
    var w = parseInt(params.width) || maxSize.width;
    var h = parseInt(params.height) || maxSize.height;

    var url = url || params.url;
    var onePart = (!url || url.length == 0);

    if (mode == 1) {
      var offsetX = parseInt(params.left) || 0;
      var offsetY = parseInt(params.top) || 0;

      var left = w - 50;
      var top = 4;

      /*
            var div = document.createElement('div');
            div.id = "mugeda_mraid_close";
            div.align = "middle";

            div.style.display = "none";
            div.style.position = "absolute";
            div.style.color="white";
            div.style.width=38+"px";
            div.style.height=38+"px";
            div.style.left=left+"px";
            div.style.top=top+"px";
            div.style.cursor="pointer";
            div.style.background="rgba(0,0,0,0.5)";
            div.style.border="4px solid white"
            div.style.borderRadius="23px";
            div.style.fontSize="24px";
            div.style.fontFamily = "arial";
            div.style.lineHeight = 38 + "px";
            div.innerHTML = "&#10006;";
            document.body.appendChild(div);
            */
      MugedaBehavior.processCloseButton("resize");
      mraid.setResizeProperties({
        "width": w,
        "height": h,
        // "customClosePosition": "top-right",
        "offsetX": offsetX,
        "offsetY": offsetY,
        "allowOffscreen": false
      });

      mraid.resize();
    }
    else {
      /*
            if(!onePart)
            {
                var maxSize = mraid.getMaxSize();
                w = maxSize.width;
                h = maxSize.height;
            }
            */

      mraid.setExpandProperties({
        "width": w,
        "height": h,
        "isModal": true,
        "useCustomClose": _mrmcp['display_mode'] ? true : false
      });

      /*
            mraid.setOrientationProperties({
                "allowOrientationChange" : false,
                "forceOrientation" : "none"
            });
            */

      if (onePart) {
        mraid.expand();
        MugedaBehavior.processCloseButton();
      } else
        mraid.expand(url);
    }
  },

  sendEmail: function (param) {
    // mailto:dreamdu@163.com?subject=title&body=content
    window.open("mailto:" + param.email_addr + "?subject=" + param.email_title + "&body=" + param.email_body, "_self");
  },

  savePicture: function (param) {
    if (this.mraidReadyStatus == 1 && mraid.supports('storePicture')) {
      mraid.storePicture(param.url);
    }
  },

  addCalendarEvent: function (param) {
    if (this.mraidReadyStatus == 1 && mraid.supports('calendar')) {
      mraid.createCalendarEvent({
        summary: param.calendar_summary,
        description: param.calendar_desc,
        location: param.calendar_location,
        start: param.calendar_start_time,
        end: param.calendar_end_time
      }
      );
    }
  },

  createHTML5VideoTag: function (container, params) {
    if (!container) {
      // throw 'video container not found';
      return;
    }

    var video_id = '_' + +new Date;
    var hidePlayControls = 0;
    var continueAudio = 0;
    var clickStatus = 0;

    if (container.data) {
      video_id = '_' + container.data.guid;

      if (container.data.param) {
        hidePlayControls = container.data.param.hidePlayControls || 0;
        continueAudio = container.data.param.continueAudio || 0;
        clickStatus = container.data.param.clickStatus || 0;
      }
    }

    var video = G('mugeda_video' + video_id);

    if (video) {
      return video.parentNode;
    }

    div = document.createElement('div');
    div.className = "mugedaVideoHolder";
    div.style.margin = 0;
    div.style.padding = 0;
    div.style.backgroundColor = "rgba(0,0,0,0)";
    div.style.position = "absolute";
    div.style.top = 0;
    div.style.left = 0;
    div.style.width = 0;
    div.style.height = 0;
    div.style.zIndex = 1;
    div.style.display = "none";

    var stage = document.querySelector('[data-type="stage"]');
    var domClientWidth = document.documentElement.clientWidth;
    var domClientHeight = document.documentElement.clientHeight;
    var isRotate = function() {
      return (stage.clientWidth > stage.clientHeight) != (domClientWidth > domClientHeight)
    }
    var getRotateCss = function() {
      var cssText = '';
      // 判断实际显示与舞台显示是否发生rotate
      if (isRotate()) {
        cssText += 'transform-origin: center;'
        cssText += 'webkit-transform: rotate(90deg);'
        cssText += 'transform: rotate(90deg);'
        cssText += 'width:' + domClientHeight + 'px;'
        cssText += 'height:' + domClientWidth + 'px;'
        cssText += 'left:' + (domClientWidth - domClientHeight) / 2 + 'px;'
        cssText += 'top:' + (domClientHeight - domClientWidth) / 2 + 'px;'
      } else {
        cssText += 'width: 100%;'
        cssText += 'height: 100%;'
        cssText += 'left: 0;'
        cssText += 'top: 0;'
      }
      return cssText;
    }

    var iOS = navigator.userAgent.match(/iPhone/i) || navigator.userAgent.match(/iPad/i);
    var close = '<div id="mugeda_video_close' + video_id + '" align="middle" style="position: absolute;color:white;width:36px;height:36px;right:0px;top: ' + (isRotate() ? domClientHeight - 36 : 0 ) + 'px;cursor:pointer;background-image:url(' + close_img_url + ');z-index:3;"></div>';
    var content = '<video id="mugeda_video' + video_id + '" ' + (params.video_embed ? 'x5-video-player-type="h5" x5-video-player-fullscreen="true"' : '') + ' controls playsinline x-webkit-airplay webkit-playsinline x5-playsinline preload="auto" video-id="' + (params.id) + '"  video-mode="' + (params.mode) + '" video-name="' + (params.name)
    + '"  style="position:absolute;z-index:2;'
    + getRotateCss()
    +'"></video>' + close;

    div.innerHTML = content;
    //var video2 = div.firstChild;
    //div.firstChild.addEventListener('x5videoenterfullscreen', function(){alert('enterfullscreen')});
    //div.firstChild.addEventListener('x5videoexitfullscreen', function(){alert('exitfullscreen')});
    //video2.srcObject = new webkitMediaStream;
    //var str = []
    //for(var name in video2){
    //    str.push(name);
    //}
    //alert(str.join(',').substr(1500));
    //setTimeout(function(){
    //video2.src = video2.src;
    //video2.play();
    //}, 3000)
    //video2.addEventListener('ended', function() {
    //alert('ednd')
    //video2.srcObject = '';
    //    video2.parentNode.removeChild(video2);
    //this.srcObject = new webkitMediaStream;
    //this.srcObject = null;
    //});
    //alert(3)
    if (container.appendChild) {
      container.appendChild(div);
    } else if (container.dom) {
      container.dom.appendChild(div);
    }

    var video = G('mugeda_video' + video_id),
      videoCloseBtn = G('mugeda_video_close' + video_id);

    videoCloseBtn.style.display = params.close_button ? "block" : "none";
    if (params.close_button) {
      var evtName = isMobile() ? 'touchend' : 'click';
      videoCloseBtn.addEventListener(evtName, function (e) {
        e.stopPropagation();
        video.src = "";
        video.rawSrc = '';
        video.load();
        div.style.display = "none";
      }, false)
    }

    if (params.video_controls) {
      video.setAttribute("controls", "controls");
    } else {
      video.removeAttribute("controls");
    }

    video.rawPlay = video.play;
    video.rawPause = video.pause;
    video.play = function (event) {
      if (video.paused) {
        if ((video.src == '' || video.src == window.location.href) && video.backSrc)
          video.src = video.backSrc;
        if (video.rawSrc == '' && video.backRawSrc)
          video.rawSrc = video.backRawSrc;

        video.onplayed();
        video.rawPlay();

        Mugeda['DataStats']['entry']({
          'type': 'playVideo',
          'target': video,
          'id': video.getAttribute('video-id')
        });

        var parent = video.parentElement;
        while (parent) {
          if (parent.className == 'mugedaVideoHolder') {
            parent.style.display = 'block';
            break;
          }
          else
            parent = parent.parentElement;
        }
      }
    }

    video.pause = function (event) {
      video.onpaused();
      video.rawPause();

      Mugeda['DataStats']['entry']({
        'type': 'stopVideo',
        'id': video.getAttribute('video-id'),
        'target': video
      });
    }

    video.onplayed = function (event) {
      if (continueAudio == 0 && window.backgroundMusic) {
        backgroundMusic.prevPlayStatus = backgroundMusic['playStatus'];
        backgroundMusic.pause();
        backgroundMusic['playStatus'] = 0;
      }
    }

    video.onpaused = function (event) {
      if (continueAudio == 0 && window.backgroundMusic && backgroundMusic.prevPlayStatus == 1) {
        backgroundMusic.play();
        backgroundMusic['playStatus'] = 1;

        delete backgroundMusic.prevPlayStatus;
      }
    }

    video.onclick = function (event) {
      event.preventDefault();
      event.stopPropagation();
      if (clickStatus === 0) {
        this.paused ? this.play() : this.pause();
      } else {
        /*
                this.pause();
                this.currentTime = 0;
                this.play();
                */
        this.paused && this.play();
      }
    }

    return div;
  },

  loadUrl: function (params) {
    var id = params.id || (new Date).getTime();
    var url = params.url || "";
    var left = params.left || 0;
    var top = params.top || 0;
    var width = isNaN(params.width) ? (window.aniData ? window.aniData.width : 320) : Math.max(0, params.width);
    var height = isNaN(params.height) ? (window.aniData ? window.aniData.height : 240) : Math.max(0, params.height);
    var before = params.before || null;
    var style = params.style;
    var scroll = params.scroll;
    var callback = params.callback;
    var parent = params.parent;
    var onload = params.onload;
    var onclose = params.onclose;
    var position = params.position;
    var close_position = params.close_position;

    if (!before && !parent) {
      // If no parent is specified, use the canvas as the base for positioning.
      var cvs = ((typeof Mugeda != "undefined") && Mugeda.getCanvas) ? Mugeda.getCanvas() : this.getStage();
      if (typeof Mugeda != "undefined" && cvs) {
        var offset = getElementOffset(cvs);
        left += offset.left;
        top += offset.top;
      }
    }

    // Create Iframe holder
    var divIframe = G(id);
    if (!divIframe) {
      divIframe = document.createElement('div');
      if (parent)
        parent.appendChild(divIframe);
      else if (before)
        before.parentNode.insertBefore(divIframe, before);
      else
        document.body.appendChild(divIframe);
    }
    divIframe.id = id;
    divIframe.style.margin = 0;
    divIframe.style.padding = 0;
    divIframe.style.backgroundColor = "transparent";
    divIframe.style.position = position ? position : "fixed";
    divIframe.style.top = 0;
    divIframe.style.left = 0;
    divIframe.style.width = 0;
    divIframe.style.height = 0;

    var pos = "";

    switch (close_position) {
      case "leftTop": close_position = "left:4px;top:4px;"; break;
      case "leftbottom": close_position = "left:4px;bottom:4px;"; break;
      case "rightbottom": close_position = "right:4px;bottom:4px;"; break;
      default: close_position = "right: 4px;top: 4px;"; break;
    }
    var close = '<div id="' + id + '_iframe_close" align="middle" style="position: absolute;color:white;width: 24px;height: 24px; ' + close_position + 'cursor:pointer;background: rgba(0,0,0,0.5);border: 3px solid white;border-radius: 15px;font-family:arial;font-size: 16px;line-height:24px;">&#10006;</div>';
    var content = '<iframe ' + (scroll ? "" : "scrolling=no ") + 'id="' + id + '_iframe" style="border:none; width:100%;height:100%; ' + (scroll ? "" : "overflow:hidden;") + ' " ></iframe>' + close;
    divIframe.innerHTML = content;
    divIframe.style.display = "none";

    divIframe.style.top = top + "px";
    divIframe.style.left = left + "px";
    divIframe.style.width = width + "px";
    divIframe.style.height = height + "px";
    divIframe.style.display = "block";
    divIframe.style.cssText += style;

    G(id + '_iframe_close').style.display = params.close_button ? "block" : "none";

    setTimeout(function () {
      if (params.close_button) {
        G(id + '_iframe_close').onclick = function () {
          divIframe.style.display = "none";
          G(id + '_iframe').src = "about:blank";
          if (onclose)
            onclose(divIframe);
        }
      }
    }, 100);

    setTimeout(function () {
      var frm = G(id + '_iframe');
      frm.src = url;
      if (onload) {
        try {
          frm.onload = function () { onload(frm); frm.onload = null; };
        } catch (e) { }
      }
    }, 100);
    /*
    var isAndroid = navigator.userAgent.toLowerCase().indexOf("android") > -1;
      try{
        setTimeout(function(){
          frmDoc = frm.contentDocument || frm.contentWindow.document;

          if(isAndroid)
            frmDoc.addEventListener("DOMContentLoaded", function(){callback(frm)});
          else
            frmDoc.body.onload = function(){callback(frm)};
        }, isAndroid?100:1);
      }catch(e){};
    }
    */
    return divIframe;
  },

  playAudio: function (params, restart) {
    var played = false;
    if (!(params && params.audio_url && params.audio_url.length))
      return false;

    var audio = ((typeof Mugeda != "undefined") && Mugeda.getAudioCache) ? Mugeda.getAudioCache(params.audio_url, params.audioId) : MugedaBehavior.localCache[params.audio_url];

    if (!audio) {
      audio = new Audio;
      var source = document.createElement('source');
      var pos = params.audio_url.lastIndexOf(".");
      var ext = params.audio_url.substring(pos + 1);
      var valid = true;
      switch (ext) {
        case "ogg":
          source.type = 'audio/ogg';
          break;
        case 'mp3':
          source.type = 'audio/mpeg';
          break;
        default:
          valid = false;
          console.log('Audio extension (' + ext + ') not supported.');
          break;
      }

      if (valid) {
        source.src = params.audio_url;
        audio.appendChild(source);
        audio.autoplay = false;
        audio.preload = "auto";
        audio.load();
        var loading = document.getElementById('mugeda_resource_loading');
        if (!loading) {
          loading = document.createElement('img');
          loading.id = "mugeda_resource_loading";
          loading.style.position = "fixed";
          loading.style.right = "2px";
          loading.style.top = "2px";
          loading.style.display = "block";
          loading.src = creative_path + "images/loading.gif";
          document.body.appendChild(loading);
        }

        loading.style.display = "block";
        played = true;
        audio.addEventListener('canplay', function () {
          loading.style.display = "none";
          audio.play();
        }, false);

        // TODO: Register this audio in audio cache.
        MugedaBehavior.localCache[params.audio_url] = audio;
      }
    }
    else {
      audio.loop = parseInt(params.audio_loop) == 1 ? true : false;
      if (audio.play) {
        if (audio.webAudio)
          played = audio.play(params.event == "click" || restart ? true : false);
        else {
          if (params.event == "click") {
            try {
              audio.pause();
              audio.currentTime = 0;
            } catch (e) { }

            setTimeout(function () {
              audio.play();
            }, 5);
          }
          else {
            if (audio['playStatus'] != 1 || restart) {
              // audio.currentTime = 0;
              // Mugeda.log(Mugeda.log()+"<br />"+'play: '+audio.src.substr(audio.src.length-32)+','+audio.currentTime);
              setTimeout(function () {
                audio.play();
                audio['playStatus'] = 1;
                played = true;
              }, 10);
            }
          }

          /* [msm]注释之：防止每次行为发生都绑定一次事件，?????声音播放完了产生?????堆回???
          audio.addEventListener('ended', function(){
            this.currentTime = 0;
            this.pause();
          }, false);
          */
        }
      }
    }
    return played;
  },

  playHTML5Video: function (params) {
    var left = (params.left || 0);
    var top = (params.top || 0);
    var width = isNaN(params.width) ? "100%" : Math.max(0, params.width) + "px";
    var height = isNaN(params.height) ? "100%" : Math.max(0, params.height) + "px";
    var cvs = (window.Mugeda && Mugeda.getCanvas) ? Mugeda.getCanvas() : this.getStage();

    if (typeof Mugeda != "undefined" && cvs && !params.video_holder && !isNaN(params.left)) {
      var offset = getElementOffset(cvs);
      left += offset.left;
      top += offset.top;
    }

    var container = document.body;
    if (params.video_holder) {
      var mugeda = Mugeda.getMugedaObject ? Mugeda.getMugedaObject() : null;
      if (mugeda && mugeda.scene) {
        var name = params.video_holder;
        var items = name.split('/');
        var isVideoObj = params.video_object === 1;

        if (items.length === 2) {
          var instance = mugeda.scene.getObjectByName(isVideoObj ? items[1] : items[0]);

          if (isVideoObj) {
            container = instance ? instance.scene.objectHash[items[0]] : null;
            params.url = container ? container.data.param.videoUrl : params.url;
          } else {
            container = instance ? instance.scene.getObjectByName(items[1]) : null;
          }

        } else {
          if (isVideoObj) {
            container = mugeda.scene.objectHash[params.video_holder];
            if (!container)
              container = mugeda.scene.dom.querySelector('*[data-guid="' + params.video_holder + '"]');

            // params.url = container ? container.data.param.videoUrl : params.url;
            if (container && container.data)
              params.url = container.data.param.videoUrl;
          } else {
            container = mugeda.scene.getObjectByName(params.video_holder);
          }
        }

      } else if (window.mugedaCss && mugedaCss.magic) {
        var stageDom = document.getElementById(mugedaCss.magic + 'stage');
        if (stageDom) {
          var name = params.video_holder;
          var items = name.split('/').map(function (name) {
            return '.' + name;
          });
          var container = stageDom.querySelectorAll(items.join(' '));
          if (container && container.length) {
            container = container[0];
          }
        }
      }
    } else {
      container = document.body;
    }

    var div = this.createHTML5VideoTag(container, params);
    div.style.top = top + "px";
    div.style.left = left + "px";
    div.style.width = width;
    div.style.height = height;
    div.style.display = "block";

    var video = div.querySelector('video');
    video.src = params.url;
    video.rawSrc = params.url;
    video.load();
    setTimeout(function () {
      if (params.showLoading) {
        MugedaTools['message']['show'](null, {
          hideShade: true,
          parent: div,
          center: true
        });
        video.loadingShown = true;
        video.ontimeupdate = function () {
          if (video.loadingShown) {
            MugedaTools['message']['close']();
            video.loadingShown = false;
          }
        }
      }

      if (params.event == 'appear') {
        if (window.WeixinJSBridge) {
          WeixinJSBridge.invoke('getNetworkType', {}, function (e) {
            video.play();
            video.playing = true;
          }, false);
        } else {
          document.addEventListener("WeixinJSBridgeReady", function () {
            WeixinJSBridge.invoke('getNetworkType', {}, function (e) {
              video.play();
              video.playing = true;
            });
          }, false);
        }
      }

      video.play();
      video.playing = true;

    }, 10);
  },

  playVideo: function (param) {
    param = param || {};

    if (!param.video_url)
      return false;

    var processed = true;
    if (this.mraidReadyStatus != 1) {
      var videoObj = (param.dom || document.querySelector('video[video-id="' + param.video_id + '"]'));
      if (param.video_mode == 'object' && param.video_id && videoObj && videoObj.rawSrc == param.video_url) {
        // !videoObj.playing && videoObj.play();
        processed = false;
      }
      else {
        this.playHTML5Video({
          "url": param.video_url,
          "id": param.video_id || '',
          "name": param.video_name || '',
          "mode": param.video_mode || '',
          "video_object": parseInt(param.video_object, 10),
          "video_holder": param.video_holder,
          "left": parseInt(param.video_left, 10),
          "top": parseInt(param.video_top, 10),
          "width": parseInt(param.video_width, 10),
          "height": parseInt(param.video_height, 10),
          "close_button": parseInt(param.video_close, 10) == 1,
          "video_controls": parseInt(param.video_controls, 10) == 1,
          "video_embed": parseInt(param.video_embed, 10) == 1,
          "auto": parseInt(param.video_autoplay, 10) == 1,
          "event": param.event
        });
      }
    }
    else {
      mraid.playVideo(param.video_url);
    }
  },

  stopVideo: function (param) {
    var holders = document.querySelectorAll('div.mugedaVideoHolder');
    for (var i = 0, l = holders.length; i < l; i++) {
      var video = holders[i].querySelector('video');
      if (video) {
        video.backSrc = video.src;
        video.backRawSrc = video.rawSrc;

        video.src = '';
        video.rawSrc = '';
        video.load();
      }
      holders[i] && (holders[i].style.display = "none");
    }
  },

  controlVideo: function (id, control) {
    var vdo = document.querySelector('#mugeda_video_' + id);
    if (vdo) {
      if (control == 'play')
        vdo.play();
      else if (control == 'pause')
        vdo.pause();
      else if (control == 'stop') {
        vdo.pause();
        vdo.currentTime = 0;
      }
    } else {
      var mugeda = Mugeda.getMugedaObject ? Mugeda.getMugedaObject() : null;

      if (mugeda && mugeda.scene) {
        var videoObj = mugeda.scene.objectHash[id];
        if (!videoObj) return;

        var videoParam = videoObj.data.param;

        if (control === 'play') {
          var param = {
            auto: videoParam['videoAutoPlay'],
            clickStatus: videoParam['clickStatus'],
            event_name: "",
            hidePlayIcon: videoParam['hidePlayIcon'],
            video_close: 0,
            video_continue_audio: videoParam['continueAudio'],
            video_controls: videoParam['hidePlayControls'] == 1 ? 0 : 1,
            video_holder: videoObj.data.guid,
            video_left: 0,
            video_mode: "object",
            video_name: videoParam['name'],
            video_embed: videoParam['embedVideo'],
            video_object: 1,
            video_top: 0,
            video_url: videoParam['videoUrl']
          }

          MugedaMraid.playVideo(param);

          /*
          // setTimeout(function(){

                        if(isMobile()){
                            var evt = document.createEvent('TouchEvent');
                            evt.initUIEvent('touchstart', true, true);
                            videoObj.dom.dispatchEvent(evt);

                            var evt = document.createEvent('TouchEvent');
                            evt.initUIEvent('touchend', true, true);
                            videoObj.dom.dispatchEvent(evt);
                        }
                        else{
                            var evt = document.createEvent("MouseEvents");
                            evt.initMouseEvent("mousedown", true, false, window, 0,0,0,0,0, false, false, false, false, 0, null);
                            videoObj.dom.dispatchEvent(evt);

                            var evt = document.createEvent("MouseEvents");
                            evt.initMouseEvent("mouseup", true, false, window, 0,0,0,0,0, false, false, false, false, 0, null);
                            videoObj.dom.dispatchEvent(evt);
                        }

          // 由于Fastclick的限制，需要同时触发mousedown,mouseup, click三个事件才能生效。
                        Mugeda.log('clicked! '+new Date().getTime());
                        videoObj.dom.click();
          // },10);
          */
        }
      }
    }
  },

  sendShortMessage: function (param) {
    var url = "sms:" + param.phone_number;
    if (param.sms_body) {
      var isAndroid = navigator.userAgent.toLowerCase().indexOf("android") > -1;
      url += (isAndroid ? "?" : "&") + "body=" + param.sms_body;
    }

    window.open(url, "_self");
  },

  makePhoneCall: function (param) {
    window.open("tel:" + param.phone_number, "_self");
  }
}

Mugeda.getContentId = function () {
  var crid = '';
  var mode = 0;
  if (_mrmcp['creative_id']) {
    // 定义了crid就直接用
    crid = _mrmcp['creative_id'];
    if (_mrmcp['previewMode'])
      mode = 3;
  } else if (Mugeda && Mugeda.data && Mugeda.data.crid) {
    crid = Mugeda.data.crid;
    mode = 3;
  }

  if (crid == '' && /\/edit\/(\w+)\&?/.test(top.location.href)) {
    // 否则如果是在编辑窗口中，则直接获取编辑窗口的id。
    var id = RegExp.$1;

    // 这里取出来的可能是共享码
    if (id.length < 16) {
      // 尝试获取下父级crid
      if (parent && parent.crid) {
        crid = parent.crid;
        mode = 2;
      } else {
        crid = id;
        mode = 1;
      }
    }
    else {
      mode = 2;
      crid = id;
    }
  }
  else if (crid == '' && /id=(\w+)\&?/.test(window.location.search)) {
    mode = 3;
    crid = RegExp.$1;
  }

  return {
    "crid": crid,
    "mode": mode
  }
};




MugedaBehavior = {
  localCache: {},

  shakeHash: {},
  pause: function () {
    if ((typeof Mugeda != "undefined") && Mugeda.pause) Mugeda.pause();
  },

  resume: function (delta) {
    if ((typeof Mugeda != "undefined") && Mugeda.resume) Mugeda.resume(delta);
  },

  nextPage: function () {
    if ((typeof Mugeda != "undefined") && Mugeda.nextPage) Mugeda.nextPage();
  },
  prevPage: function () {
    if ((typeof Mugeda != "undefined") && Mugeda.prevPage) Mugeda.prevPage();
  },
  gotoPage: function (id) {
    if ((typeof Mugeda != "undefined") && Mugeda.gotoPage) Mugeda.gotoPage(id);
  },
  disablePage: function () {
    if ((typeof Mugeda != "undefined") && Mugeda.disablePage) Mugeda.disablePage();
  },
  disablePageForward: function () {
    if ((typeof Mugeda != "undefined") && Mugeda.disablePageForward) Mugeda.disablePageForward();
  },
  disablePageAfter: function () {
    if ((typeof Mugeda != "undefined") && Mugeda.disablePageAfter) Mugeda.disablePageAfter();
  },
  enablePage: function () {
    if ((typeof Mugeda != "undefined") && Mugeda.enablePage) Mugeda.enablePage();
  },
  enablePageForward: function () {
    if ((typeof Mugeda != "undefined") && Mugeda.enablePageForward) Mugeda.enablePageForward();
  },
  enablePageAfter: function () {
    if ((typeof Mugeda != "undefined") && Mugeda.enablePageAfter) Mugeda.enablePageAfter();
  },

  next: function () {
    if ((typeof Mugeda != "undefined") && Mugeda.next) Mugeda.next();
  },

  previous: function () {
    if ((typeof Mugeda != "undefined") && Mugeda.previous) Mugeda.previous();
  },

  gotoAndPlay: function (id) {
    if ((typeof Mugeda != "undefined") && Mugeda.gotoAndPlay) Mugeda.gotoAndPlay(id);
  },

  gotoAndStop: function (id) {
    gotoAndPause(id);
  },

  gotoAndPause: function (id) {
    if ((typeof Mugeda != "undefined") && Mugeda.gotoAndPause) Mugeda.gotoAndPause(id);
  },

  callback: function (object, param) {
    var mugedaInstance = Mugeda.getMugedaObject ? Mugeda.getMugedaObject() : null;
    var func = null;
    if (mugedaInstance) {
      func = mugedaInstance.getCallback(param.name);
    }

    if (!func && window && param.name && param.name.length && window[param.name])
      func = window[param.name];

    func && func(object, param.key, param.value);
  },

  map: function (param) {
    var key = param.map_key.replace(/(\n|\r)/g, "+");
    var addr = undefined;
    if (param.map_address) {
      addr = param.map_address.replace(/(\n|\r)/g, "+");
    } else {
      Mugeda.messageBox('未设置地址，请在行为里进行设置。', 'alert');
      return;
    }
    var isAndroid = navigator.userAgent.toLowerCase().indexOf("android") > -1;
    var type = parseInt(param.map_type, 10);

    var buildMapMask = function () {
      var holders = document.querySelectorAll('div.mugedaVideoHolder');
      for (var i = 0, l = holders.length; i < l; i++) {
        holders[i] && (holders[i].style.display = "none");
      }

      var mapMask = G('mugedaMap-mask');
      if (mapMask) {
        toggleShowMapMask(1);
        return;
      }

      var mapMask = document.createElement('div'),
        loadingSrc = creative_path + 'images/loading.gif';

      mapMask.id = 'mugedaMap-mask';
      mapMask.className = 'mugedaMapControl';
      mapMask.innerHTML = '<p id="mugedaMap-title"><a id="mugedaMap-back">返回</a>位置信息</p>' +
        '<div id="mugedaMap-con"></div>' +
        '<div id="mugedaMap-loading"><div class="spinner"></div>' +
        '<style>' +
        '.smnoprint {top: 70px!important;}' +
        '.BMap_stdMpCtrl {top: 70px!important;}' +
        '.BMap_stdMpCtrl.BMap_stdMpType1.BMap_noprint.anchorTR {top: 80px!important;}' +
        '.BMap_noprint.anchorTR {display: none!important;}' +
        '.amap-toolbar {right: 10px!important; bottom: 10px!important;left: auto!important; top: auto!important;}' +
        '.mugedaMapControl {position:absolute;left:0;top:0;height:100%;width:100%;z-index:999;}' +
        '.mugedaMapMaskVisible {-webkit-transition:transform 1s;transform:translate3d(-100%, 0, 0);-webkit-transform:translate3d(-100%, 0, 0);}' +
        '.mugedaMapControl #mugedaMap-title {position:fixed;height:44px;line-height:44px;width:100%;text-align:center;z-index:1;background:rgba(255,255,255,.8);margin:0;}' +
        '.mugedaMapControl #mugedaMap-con {height:100%;width:100%;}' +
        '.mugedaMapControl #mugedaMap-back {position:absolute;left:5px;display:inline-block;height:100%;width:40px;cursor:pointer;}' +
        '.mugedaMapControl #mugedaMap-loading {position:absolute;width:100%;height:100%;line-height:100%;left:0;top:44px;display:none;background:#fff;z-index:2;}' +
        '.mugedaMapControl .spinner {position:absolute;width:20px;height:30px;left:50%;top:50%;margin:-50px 0 0 -10px;background-image:url(' + loadingSrc + ');background-repeat:no-repeat;background-size:contain;}' +
        '.mugedaMapControl .spinner:after {content: "加载中 ...";position:absolute;width:80px;left:-25px;top:120%;}' +
        '</style>';

      document.body.appendChild(mapMask);

      var back = G('mugedaMap-back');
      back && back.addEventListener('click', function (e) {
        e.stopPropagation();
        toggleShowMapMask(0);
      }, false);
    }

    var toggleShowMapMask = function (flag) {
      var mapMask = G('mugedaMap-mask');

      if (!mapMask) return;

      mapMask.classList.toggle('mugedaMapMaskVisible', !flag);
    }

    var mapLoading = function (flag) {
      var loading = G('mugedaMap-loading');

      if (!loading) return;

      loading.style.display = flag ? 'block' : 'none';
    }

    var bMapInst, bMapLocalSearchInst;
    var buildMap = function (search, addr, city, callback) {
      if (!bMapInst) {
        bMapInst = new BMap.Map('mugedaMap-con');
      }

      city = city || '北京';
      bMapInst.addControl(new BMap.MapTypeControl({
        mapTypes: [
          BMAP_NORMAL_MAP,
          BMAP_HYBRID_MAP
        ]
      }));
      // var top_left_control = new BMap.ScaleControl({ anchor: BMAP_ANCHOR_TOP_LEFT });// 左上角，添加比例尺
      var top_left_navigation = new BMap.NavigationControl();  //左上角，添加默认缩放平移控件
      var top_right_navigation = new BMap.NavigationControl({ anchor: BMAP_ANCHOR_TOP_RIGHT, type: BMAP_NAVIGATION_CONTROL_SMALL }); //右上角，仅包含平移和缩放按钮
      // bMapInst.addControl(top_left_control);
      bMapInst.addControl(top_left_navigation);
      bMapInst.addControl(top_right_navigation);
      if (!bMapLocalSearchInst) {
        bMapLocalSearchInst = new BMap.LocalSearch(bMapInst, {
          renderOptions: {
            map: bMapInst,
            autoViewport: true
          },
          onSearchComplete: function (result) {
            if (typeof callback === 'function') {
              callback.call(bMapInst, result);
            }
          }
        });
      }

      if (addr && search) {
        bMapLocalSearchInst.searchNearby(addr, search);
      } else {
        bMapLocalSearchInst.search(addr);
      }
    }

    var aMapInst;
    var buildGaodeMap = function (key, search) {
      console.log(key, search)
      if (!aMapInst) {
        aMapInst = new AMap.Map('mugedaMap-con', {
          resizeEnable: true,
          zoom: 3
        });
      }

      AMap.plugin(['AMap.ToolBar', 'AMap.PlaceSearch', 'AMap.CitySearch'], function () {//异步同时加载多个插件
        // 工具条
        var toolbar = new AMap.ToolBar();
        aMapInst.addControl(toolbar);

        // 自动根据ip获取城市(不需要)

        // 默认自动搜索
        var placeSearch = new AMap.PlaceSearch({ city: key });
        placeSearch.search(search, function (status, result) {
          // 查询成功时，result即对应匹配的POI信息
          if(status ==='error') {
            Mugeda.messageBox('抱歉，获取地址出错', 'alert');
            if(result === 'USER_DAILY_QUERY_OVER_LIMIT') result = '服务使用超限'
            console.warn('[行为 - 地图] ' + result);
            return
          }

          console.log(result)
          if (!result.poiList.pois.length) {
            Mugeda.messageBox('抱歉，没有搜索到相关信息', 'alert');
          } else {
            var pois = result.poiList.pois;
            for (var i = 0; i < pois.length; i++) {
              var poi = pois[i];
              var marker = [];
              marker[i] = new AMap.Marker({
                position: poi.location,   // 经纬度对象，也可以是经纬度构成的一维数组[116.39, 39.9]
                title: poi.name
              });
              // 将创建的点标记添加到已有的地图实例：
              aMapInst.add(marker[i]);
            }
            aMapInst.setFitView();
          }
        })
      });
    }

    var tMapInst;
    var buildTengxunMap = function () {
      if (!tMapInst) {
        var center = new qq.maps.LatLng(39.916527, 116.397128);
        var tMapInst = new qq.maps.Map(document.getElementById("mugedaMap-con"), {
          center: center,
          zoom: 6,
          mapTypeControlOptions: {
            mapTypeIds: [
              qq.maps.MapTypeId.ROADMAP,
              qq.maps.MapTypeId.SATELLITE,
              qq.maps.MapTypeId.HYBRID
            ],
            //设置控件位置相对上方中间位置对齐
            position: qq.maps.ControlPosition.BOTTOM_CENTER
          }
        });
      }

      var latlngBounds = new qq.maps.LatLngBounds();
      //调用Poi检索类
      var markers = [];
      var searchService = new qq.maps.SearchService({
        complete: function (results) {
          var pois = results.detail.pois;
          for (var i = 0, l = pois.length; i < l; i++) {
            var poi = pois[i];
            latlngBounds.extend(poi.latLng);
            var marker = new qq.maps.Marker({
              map: tMapInst,
              position: poi.latLng
            });

            marker.setTitle(i + 1);

            markers.push(marker);
          }
          tMapInst.fitBounds(latlngBounds);
        }
      });
      searchService.setLocation(addr);
      searchService.search(decodeURIComponent(key));
    };
    window.buildTengxunMap = buildTengxunMap; // 由于腾讯地图组件无法手工导入静态的js, 只能通过script传回调, 这里把腾讯地图逻辑放在window下

    var goMap = function (search, addr, mode) {
      if (type === 0) { //baidu map
        // var baiduMapJsSrc = ['http://api.map.baidu.com/getscript?type=quick&file=api&ak=FOm6cLbES9zjrtvcDYndkwSR&v=1.0',
        //                      'http://api.map.baidu.com/getscript?type=quick&file=feature&ak=FOm6cLbES9zjrtvcDYndkwSR&v=1.0'];

        // var baiduMapJsSrc = ['//api.map.baidu.com/api?v=2.0&ak=FOm6cLbES9zjrtvcDYndkwSR',
        //   '//api.map.baidu.com/getscript?v=2.0&ak=FOm6cLbES9zjrtvcDYndkwSR'];
        var baiduMapJsSrc = [
          '//api.map.baidu.com/api?v=3.0&ak=FOm6cLbES9zjrtvcDYndkwSR',
          '//api.map.baidu.com/getscript?v=3.0&ak=FOm6cLbES9zjrtvcDYndkwSR'
        ];

        addr = decodeURIComponent(addr);
        search = decodeURIComponent(search);
        buildMapMask();
        mapLoading(1);

        var loaded = 0;
        for (var i = 0, l = baiduMapJsSrc.length; i < l; i++) {
          var scriptTag = document.createElement('script');
          scriptTag.src = baiduMapJsSrc[i];
          scriptTag.onload = function () {
            if (++loaded === l) {
              buildMap(search, addr, '', function (result) {
                if (result.getNumPois() === 0) {
                  Mugeda.messageBox('抱歉，没有搜索到相关信息', 'alert');
                }
                mapLoading(0);
              });
            }
          }
          document.head.appendChild(scriptTag);
        }
      } else if (type === 1) { //google map
        var q = search + "" + (addr.length ? ("+near+" + addr) : "");
        var mapURL = "https://maps.google.com/maps?q=" + q + "&z=12";
        var iOSVersion = parseFloat(
          ('' + (/CPU.*OS ([0-9_]{1,5})|(CPU like).*AppleWebKit.*Mobile/i.exec(navigator.userAgent) || [0, ''])[1])
            .replace('undefined', '3_2').replace('_', '.').replace('_', '')
        ) || false;

        if (mode == 1) {
          var aMap = document.getElementById('aMugedaGeoLocation');
          if (aMap) {
            aMap.href = mapURL;
            var dispatch = document.createEvent("HTMLEvents")
            dispatch.initEvent("click", true, true);
            aMap.dispatchEvent(dispatch);
          }
        } else if (iOSVersion && iOSVersion < 6) {
          window.location.href = (mapURL);
        } else {
          window.open(mapURL, "_blank");
        }
      } else if (type === 2) { //高德地图
        var gaodeSrc = [
          '//webapi.amap.com/maps?v=1.4.15&key=189d47fd622309f74807543767b6cf5f'
        ];

        buildMapMask();
        mapLoading(1);

        var loaded = 0;
        for (var i = 0, l = gaodeSrc.length; i < l; i++) {
          var scriptTag = document.createElement('script');
          scriptTag.src = gaodeSrc[i];
          scriptTag.onload = function () {
            if (++loaded === l) {
              buildGaodeMap(decodeURIComponent(addr), decodeURIComponent(search));
              mapLoading(0);
            }
          }
          document.head.appendChild(scriptTag);
        }
      } else if (type === 3) {  // 腾讯地图
        var gaodeSrc = [
          '//map.qq.com/api/js?v=2.exp&key=Q2XBZ-BQ56F-6DCJD-NIGR5-65MDQ-FCBJG&callback=buildTengxunMap'
        ];

        buildMapMask();
        mapLoading(1);

        var loaded = 0;
        for (var i = 0, l = gaodeSrc.length; i < l; i++) {
          var scriptTag = document.createElement('script');
          scriptTag.src = gaodeSrc[i];
          scriptTag.onload = function () {
            if (++loaded === l) {
              // buildTengxunMap(decodeURIComponent(addr), decodeURIComponent(search));
              mapLoading(0);
            }
          }
          document.head.appendChild(scriptTag);
        }
      }
    }

    // On Android, getCurrentPosition may not trigger popup window correctly.
    // So getCurrentPosition is disabled for now.
    if (!isAndroid && addr.length == 0 && navigator.geolocation) {
      var aMap = document.getElementById('aMugedaGeoLocation');
      if (!aMap) {
        aMap = document.createElement('a');
        aMap.id = "aMugedaGeoLocation";
        aMap.style.display = "none";
        aMap.href = "";
        aMap.target = "_blank";
        document.body.appendChild(aMap);
      }

      navigator.geolocation.getCurrentPosition(
        function (pos) {
          addr = pos.coords.latitude + ',' + pos.coords.longitude;
          goMap(key, addr, 1);
        }
      );
    }
    else
      goMap(key, addr);
  },

  popupForm: function (options, isel) {
    //isel：是否是表单元素，true代表是表单元素，false代表表单行为
    var defaultSubmit = options.openTarget == "default" || options.openTarget == "frame" || options.openTarget == "page";
    if (!options || (options.openTarget == "callback" && !options.callback)
      || (options.openTarget != "callback" && options.openTarget != "customizable" && !defaultSubmit && !options.url)) {
      return;
    }

    var docWidth = document.documentElement.clientWidth;
    var docHeight = document.documentElement.clientHeight;

    function GT(parentDom, id) {
      if (parentDom && id) {
        return parentDom.querySelector('#' + id);
      }
    }

    var mapCookies = [];
    function getStorageOrCookie(c_name) {
      if (window.localStorage && window.localStorage.getItem) {
        return unescape(localStorage.getItem(c_name) || '');
      }
      var i, x, y, ARRcookies = document.cookie.split(";");
      for (i = 0; i < ARRcookies.length; i++) {
        x = ARRcookies[i].substr(0, ARRcookies[i].indexOf("="));
        y = ARRcookies[i].substr(ARRcookies[i].indexOf("=") + 1);
        x = x.replace(/^\s+|\s+$/g, "");
        if (x == c_name.toLowerCase()) {
          return unescape(y);
        }
      }

      return '';
    }

    function setStorageOrCookie(c_name, value) {
      if (window.localStorage && window.localStorage.getItem) {
        try {
          localStorage.setItem(c_name, escape(value));
        }
        catch (e) {
          console.info('Oops, localStorage full');
          localStorage.clear();
          localStorage.setItem(c_name, escape(value));
        }
        return
      }
      var exdate = new Date();

      // Cache for one year. No! 3days
      exdate.setDate(exdate.getDate() + 3);
      var c_value = escape(value) + "; expires=" + exdate.toUTCString();
      document.cookie = c_name.toLowerCase() + "=" + c_value;
    }

    function toggleCanvas(flag) {

      var css3 = document.querySelector('.MugedaStage');
      var canvas = (css3 ? null : G('viewbox') || G('frame'));

      if (canvas)
        canvas.style.display = flag ? '' : 'none';

      return canvas ? true : false;
    }

    var dispatchFormEvent = function (eventName, event) {
      event = event || {};
      var item = event.detail;
      var form = event.form || (item ? item.form : null);
      var data = {
        item: item,
        form: form,
        title: options.title,
        hideItem: function (id) { form && form.elements[id] && (form.elements[id].parentNode.style.display = "none"); },
        showItem: function (id) { form && form.elements[id] && (form.elements[id].parentNode.style.display = "block"); }
      };

      var event = document.createEvent('Events');
      event.initEvent(eventName, true, true);
      event.detail = data;
      window.dispatchEvent(event);
    };

    window.addEventListener('_mugedaFormChanged', function (event) { dispatchFormEvent('mugedaFormChanged', event); });

    var fields = options.items || [];
    window.popupFormFields = fields;

    if (!options.html) {
      var html = '';
      if (!isel) {
        html += '<div align="center" class="popupFormTitle">';
        html += '<div class="title-col-2" align="center"><input type="button" value="' + options.cancelName + '" class="popupFormCancel" id="popupFormCancel"></div>';
        html += '<div class="title-col-6" align="center"><h2>' + (options.title || '&nbsp;') + '</h2></div>';
        html += '<div class="title-col-2" align="center"><input id="actionButton" type="button" value="' + options.submitName + '" class="popupFormSubmit"></div>';
        html += '</div>';
        html += '<div class="popupFormContent">';
      } else {
        html += '<div class="popupFormContent">';
        if (options.title) {
          html += '<div align="center" class="popupFormTitle"><h2>' + options.title + '</h2></div>';
        }
      }

      // Ugly trick to workaround android checkbox size issue.
      var ua = navigator.userAgent.toLowerCase();
      var isAndroid = ua.indexOf("android") > -1; //&& ua.indexOf("mobile");
      var androidVersion = parseFloat(ua.slice(ua.indexOf('android') + 8));
      var checkboxSizeStyle = '';
      var lblTop = 0;
      var typeMap = { 'phone': 'tel', 'input': 'text' };
      if (isAndroid && androidVersion < 3.0) {
        checkboxSizeStyle = "-webkit-transform: scale(2,2);-webkit-transform-origin:center center;";
        //lblTop = 6;
      }

      //var marginTop = 10;
      var quotStr = isel ? '' : ':';
      for (var i = 0; i < fields.length; i++) {
        var field = fields[i];
        var data = (field.value || '').trim();
        if (data) {
          data = data.split('\n');
          var ret = [];
          for (var j = 0; j < data.length; j++) {
            var arr = data[j].split('(')
            var text = arr[0];
            var value = (arr[1] || '').replace(/\)$/, '') || text;
            var id = ['FORMID', value, i, j].join('_');
            ret[j] = {
              id: id,
              text: text,
              value: value
            }
          }
          data = ret;
        }

        var eventString = "var event = document.createEvent('Events');event.initEvent('_mugedaFormChanged', true, true);event.detail = this;window.dispatchEvent(event);"

        var id = 'id="popupFormField_' + i + '"';
        switch (field.type) {
          case 'radio':
            html += '<div ' + id + ' class="popupFormRadioList">';
            if (field.description) {
              //lblTop = 6;
              html += '<label class="inputlabel">' + field.description + (field.required ? "*" : "") + quotStr + '</label>';
            }
            html += '<div class="mformradio">';
            for (var j = 0; j < data.length; j++) {
              var o = data[j];
              var checked = getStorageOrCookie(o.id);
              var borderStyle = j == (data.length - 1) ? "" : " style='border-right:1px solid " + options.background + "'";
              html += '<label><input onchange="' + eventString + '" type="radio" name="' + field.id + '" value="' + o.value + '" id="' + o.id + '" ' + (checked == "true" ? "checked=checked" : "") + ' ><span ' + borderStyle + '>' + o.text + '</span></label>';

              mapCookies[o.id] = o.id;
            }
            html += '</div></div>';

            break;
          case 'checkbox':
            html += '<div ' + id + ' class="popupFormCheckbox">';
            if (field.description) {
              //html += '<h3>' + field.description + (field.required ? "*" : "") +quotStr+ '</h3>';
              html += '<label class="inputlabel">' + field.description + (field.required ? "*" : "") + quotStr + '</label>';
            }
            html += '<div class="mformcheck">';
            html += field.rangeType === 'vertical' ? '<table>' : '';

            for (var j = 0; j < data.length; j++) {
              var o = data[j];
              var checked = getStorageOrCookie(o.id);

              if (field.rangeType === 'vertical') {
                html += '<tr><td><input type="checkbox" value="' + o.value + '" id="' + o.id + '" ' + (checked == "true" ? "checked=true" : "") + ' ></td><td><label for="' + o.id + '" >' + o.text + '</label></td></tr>';
              } else {
                html += '<input onchange="' + eventString + '" type="checkbox" name="' + field.id + '" value="' + o.value + '" id="' + o.id + '" ' + (checked == "true" ? "checked=true" : "") + ' ><label for="' + o.id + '" >' + o.text + '</label>';
              }

              mapCookies[o.id] = o.id;
            }

            if (isAndroid && androidVersion < 3.0 && field.rangeType != 'vertical')
              lblTop = 6;

            html += field.rangeType === 'vertical' ? '</table>' : '';
            html += '</div></div>';

            break;
          case 'select':
            html += '<div ' + id + ' class="popupFormSelectList">';
            if (field.description) {
              html += '<label class="inputlabel text">' + field.description + (field.required ? "*" : "") + quotStr + '</label>';
            }

            html += '<select class="text" onchange="' + eventString + '" name="' + field.id + '" id="' + ('_map_' + field.description) + '">';
            // if (field.required)
            {
              html += '<option value="">' + field.description + '</option>';
            }

            var val = getStorageOrCookie(field.description);
            for (var j = 0; j < data.length; j++) {
              var o = data[j];
              html += '<option value="' + o.value + '" ' + (val == o.value ? "selected=selected" : "") + '>' + o.text + '</option>';
            }
            html += '</select>';
            html += '</div>';

            mapCookies[field.description] = ('_map_' + field.description);
            break;
          case 'textarea':
            html += '<div ' + id + ' class="popupFormInputBox">';
            html += '<label class="inputlabel inputlabel_area">' + field.description + (field.required ? "*" : "") + quotStr + '</label><textarea name="' + field.id + '" id="_mcp_' + escape(field.description) + '" rows="4" onchange="' + eventString + '" style="resize:none; height:48px;">' + (field.value.length ? field.value : getStorageOrCookie(field.description)) + '</textarea>';
            html += '</div>';

            mapCookies[field.description] = "_mcp_" + escape(field.description);
            break;
          case 'phone':
          case 'number':
          case 'email':
          case 'date':
          case 'time':
          default:
            html += '<div ' + id + ' class="popupFormInputBox">';
            html += '<label class="inputlabel text">' + field.description + (field.required ? "*" : "") + quotStr + '</label><input class="text" name="' + field.id + '" id="_mcp_' + escape(field.description) + '" type="' + (typeMap[field.type] || field.type) + '" onchange="' + eventString + '" value="' + (getStorageOrCookie(field.description) || field.value) + '" ' + (isel ? 'placeholder="' + field.description + '"' : '') + '>';
            html += '</div>';

            mapCookies[field.description] = "_mcp_" + escape(field.description);
            break;
        }
      }

      if (isel) {
        html += '<div class="popupFormBtn"><input type="button" value="' + options.cancelName + '" class="popupFormCancel" id="popupFormCancel">';
        html += '<input id="actionButton" type="button" value="' + options.submitName + '" class="popupFormSubmit"></div>';
      }

      html += '</div>';

      options.html = html;
    }

    function removeForm(div) {
      if (isel) {
        function each(arr, callback) {
          Array.prototype.forEach.call(arr, function (item, index) {
            callback(item, index);
          });
        }
        each(div.querySelectorAll('.popupFormInputBox input,.popupFormInputBox textarea'), function (item) {
          item.value = '';
        });
        each(div.querySelectorAll('.popupFormRadioList input,.popupFormCheckbox input'), function (item) {
          item.checked = false;
        });
        each(div.querySelectorAll('.popupFormSelectList select'), function (item) {
          item.value = item.querySelector('option').getAttribute('value');
        });
      }
      else {
        var form = div.querySelector('form');
        form.style.bottom = -form.offsetHeight + 'px';
        div.style.background = 'rgba(0,0,0,0)';

        setTimeout(function () {
          div.parentNode && div.parentNode.removeChild(div);
        }, 500);

        var toggled = toggleCanvas(1);
        if (toggled) {
          //div.mask.style.display = 'none';
          document.body.style.overflowY = 'hidden';
          if (isMobile())
            document.body.style.height = '100%';
        }
      }
    }

    delete this.popupFormDiv;

    var div = this.popupFormDiv;
    if (div)
      // Still shown
      return;

    var getFormStyle = function (formClass) {
      formClass = formClass || '.popupForm';
      var opacity = 1;

      if (/^rgba\(\d+,\s\d+,\s\d+,\s([0-9.]+)\)$/.exec(options.background)) {
        opacity = RegExp.$1;
      }

      var style = '<style>'
        + formClass + ' {width:100%;font-size:' + options.fontSize + 'px;font-family:Tahoma,"微软雅黑",Arial, SimHei;}'
        + formClass + ' * {font-family:Tahoma,"微软雅黑",Arial, SimHei;}'
        + formClass + ' form{position:absolute;width:100%;background-color:' + options.background + ';}'
        + formClass + ' *{margin:0;box-sizing:border-box;-webkit-appearance: none; -moz-appearance: none; appearance: value;}'
        + formClass + ' .inputlabel{width:33%;height:28px;font-size:' + options.fontSize + 'px;line-height:28px;display:inline-block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;vertical-align:top;color:#000;}'
        + formClass + ' span{color:#333;}'
        + formClass + ' label{color:#000;}'
        + formClass + ' #popupFormField_0{padding-top:16px;}'
        + formClass + ' .popupFormMask {position:absolute;left:0;top:0;width:100%;height:100%;background-color: ' + options.background + '}'
        + formClass + ' .popupFormContent {padding-bottom:16px; background-color:#fff;opacity:' + opacity + ';}'
        + formClass + ' .popupFormTitle {width:100%;padding:20px 0;overflow:hidden;background-color: ' + options.background + '}'
        + formClass + ' h2 {font-weight:normal;font-size:' + (2 + parseInt(options.fontSize)) + 'px;color:' + options.color + ';}'
        + formClass + ' h3{text-align:left;font-size:' + options.fontSize + 'px; font-weight: normal;color:' + options.color + ';}'
        + formClass + ' .popupFormInputBox{padding:8px 16px;text-align:left;}'
        + formClass + ' .popupFormInputBox input, .popupFormInputBox textarea, .popupFormSelectList select{width:67%;height:28px;border:1px solid ' + options.background + ';font-size:' + options.fontSize + 'px;padding:0;padding-left:8px;vertical-align:top;border-radius:2px;}'
        + formClass + ' .popupFormSelectList{padding:8px 16px 0;}'
        + formClass + ' .popupFormRadioList{padding:8px 16px 0;}'
        + formClass + ' .popupFormCheckbox{padding:8px 16px 0;}'
        + formClass + ' .popupFormTitle input{border-width:0;cursor:pointer;font-size:' + options.fontSize + 'px;color:' + options.color + '}'
        + formClass + ' .popupFormSubmit{border:none;background:none}'
        + formClass + ' .popupFormCancel{background:none;border:none;}'
        + formClass + ' .popupFormRadioList input{margin:0 5px 0 8px;}'
        + formClass + ' .popupFormRadioList label{vertical-align:top;}'
        + formClass + ' .mformradio {background-color:#EFEFEF;border:1px solid ' + options.background + ';overflow:hidden;display:inline-block;}'
        + formClass + ' .mformradio label{float:left; min-width:48px;position:relative;}'
        + formClass + ' .mformradio label span{text-align:center;padding:6px 8px;display:block;}'
        + formClass + ' .mformradio label input{position:absolute;width:100%;height:100%;margin:0;border:0;opacity:0;}'
        + formClass + ' .mformradio input:checked + span{background-color:' + options.background + ';color:#F7F7F7;}'
        + formClass + ' .mformcheck{margin:0 0 8px;display:inline-block;}'
        + formClass + ' .mformcheck input{' + checkboxSizeStyle + 'width:24px;height:24px;background-color:#EFEFEF;border:1px solid ' + options.background + ';vertical-align:middle;margin:3px 2px;}'
        + formClass + ' .mformcheck input:checked{background-color:' + options.background + ';}'
        + formClass + ' .popupFormTitle .title-col-2 {float:left;width:20%;padding:0 ;text-align:center;}'
        + formClass + ' .popupFormTitle .title-col-6 {float:left;width:60%;padding:0 ;}'
        + formClass + ' .popupFormTitle .title-col-2 input {font-size:' + (2 + parseInt(options.fontSize)) + 'px;}'
        + formClass + ' .mformcheck label{vertical-align:' + lblTop + 'px;font-size:' + options.fontSize + 'px;padding-top:0;padding-left:4px;padding-right:8px;}'

      if (isel) {
        style += formClass + ' .popupFormBtn {width:100%;padding:20px 0 0 0;text-align:center;}';
        style += formClass + ' .popupFormSubmit {width:90px;height:30px;color:' + options.color + ';background-color:' + options.background + '}';
        style += formClass + ' .popupFormCancel {width:90px;height:30px;margin-right:15px;color:' + options.color + ';display:none;background-color:' + options.background + '}';
      }


      style += '</style>';

      return style;
    }

    if (!div) {
      //var mask = document.createElement('div');
      //mask.className = 'popupFormMask';
      //document.body.appendChild(mask);
      var target = options.openTarget == "backend" ? "popupFormIframe" : "_" + options.openTarget;
      div = document.createElement('div');
      div.style.display = 'none';
      //用两种一条的表单样式
      div.className = isel ? 'popupForm2' : 'popupForm';
      var styleText = ''
      if (!isel) {
        styleText = getFormStyle();
      }
      else {
        //实现表单元素lable与input的宽度自适应
        function getInputWH(items) {
          var obj = { l: 48, r: 200 };
          var max = 0;
          for (var i = 0, l = items.length; i < l; i++) {
            var item = items[i];
            var len = item.description.length;
            var size = 0;
            for (var j = 0; j < len; j++) {
              size += item.description[j].match(/[\u3400-\u9FBF]/) ? 2 : 1;
            }

            max = Math.max(max, size);
          }
          max = max > 8 ? 8 : max;
          var r = options.fontSize * (max - 4);
          if (max > 4 && max <= 8) {
            obj.l += r;
            obj.r -= r;
          }
          return obj;
        }
        //由于表单元素与表单行为的样式不同，下面是表单元素的样式
        var hwObj = getInputWH(fields);
        styleText = getFormStyle('.popupForm2');
      }

      div.innerHTML = ''
        + '<form method="' + options.method + '" target="' + target + '" autocomplete="on"></form>'
        + '<iframe name="popupFormIframe" id="popupFormIframe" style="display:none"></iframe>' + styleText;
      if (!isel && !options.isCss) {
        document.body.appendChild(div);
      }
      else {
        options.hwObj = hwObj;
        options.iframeDiv = div;

        if (options.parentDom) {
          options.parentDom.appendChild(options.iframeDiv);
        }
      }

      this.popupFormDiv = div;
      //div.mask = mask;
      div.form = div.childNodes[0];
      div.form.onclick = function (e) {
        // e.cancelBubble = false;
      }

      self = this;
      if (!isel) {
        div.addEventListener(isMobile() ? 'touchend' : 'mouseup', function (e) {
          if (window.cardFrame) return;

          // TODO: 这段逻辑需要重写。下面的写法是为了规避规避ios上一个未知bug而写。
          // 该bug导致表单无法输入。
          if (e.target == div) {
            removeForm(div);
            self.popupFormDiv = null;
            e.stopPropagation();
          }

          var nodeName = e.target.nodeName.toLowerCase();
          var type = (e.target.type || '').toLowerCase();
          // TODO: fix the issue where these inputs can't get focused.
          var exclusive = type != "checkbox" && type != "submit";

          if (['input', 'textarea', 'select'].indexOf(nodeName) >= 0 && exclusive) {
            e.target.focus();
            if (isAndroid) {
              setTimeout(function () {
                e.target.scrollIntoView();
                if (e.target.scrollIntoViewIfNeeded) {
                  e.target.scrollIntoViewIfNeeded();
                }
              }, 500);
            }

            // TODO: figure out when should we use this stopPropagation.
            e.stopPropagation();
          }

          if (type == "button")
            e.stopPropagation();
        });
      }

      var submitFormAction = function () {
        div.querySelector('#popupFormIframe').onload = null;

        function runSubmit() {
          var params = [];
          var arr = this.childNodes;
          var mfields = fields;
          if (!isel) {
            mfields = window.popupFormFields;
          }
          for (var i = 0; i < mfields.length; i++) {
            var field = mfields[i];
            var o = GT(div, 'popupFormField_' + i);
            var value = '';
            var inputs = o.querySelectorAll('select');
            if (inputs.length == 0) {
              inputs = o.querySelectorAll('textarea');
              if (inputs.length == 0) {
                inputs = o.querySelectorAll('input');
              }
            }
            if (inputs.length == 1) {
              value = (inputs[0].value) || '';
            }
            else if (inputs.length > 1) {
              var c,
                s = [];
              for (var j = 0; j < inputs.length; j++) {
                c = inputs[j];
                if (c.checked) {
                  s.push(c.value);
                  if (c.type == 'radio')
                    break;
                }
              }
              value = s.join(',');
            }
            if (field.required && !value) {
              Mugeda.messageBox((field.description || 'item') + ' required');
              inputs[0].focus();
              return;
            }
            if (value) {
              switch (field.type) {
                case 'phone':
                  if (!/^\d+$/.test(value)) {
                    Mugeda.messageBox((field.description || 'Phone number') + ' required');
                    inputs[0].focus();
                    return;
                  }
                  break;
                case 'email':
                  if (!/^\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/.test(value)) {
                    Mugeda.messageBox((field.description || 'Email') + ' required');
                    inputs[0].focus();
                    return;
                  }
                  break;
              }
            }
            if (options.openTarget === 'default') {
              params.push(encodeURIComponent(field.description + '(' + field.id + ')') + '=' + encodeURIComponent(value || ''));
            } else {
              params.push(encodeURIComponent(field.id) + '=' + encodeURIComponent(value || ''));
            }
          }

          if ('popupFormIframe' == target) {
            G('actionButton').value = options.pendingName;
          }

          params = params.join('&');
          var redirect = options.url + '?' + (params);
          options.loadFinished = function () {
            // 表单提交后，按钮名称恢复提交前状态
            if ('popupFormIframe' == target && options.submitName) {
              G('actionButton').value = options.submitName;
            }
            removeForm(div);
            self.popupFormDiv = null;
          }

          if (options.openTarget == 'customizable') {
            var evt = {
              callback: function (url) {
                if (options.msg) {
                  Mugeda.messageBox(options.msg, 'alert', function (confirmed) {
                    window.open(url, '_self');
                  });
                } else {
                  window.open(url, '_self');
                }
              },
              cancel: false
            }

            if (window.MugedaCard && MugedaCard.finalizeCustomParameters) {
              MugedaCard.finalizeCustomParameters(params, evt);
            }

            options.loadFinished();
          }
          else if (options.openTarget == 'default' || options.openTarget == 'page' || options.openTarget == 'frame' || options.openTarget == 'callback') {
            var mode = 0;
            var crid = _mrmcp['creative_id'] || '';
            if (_mrmcp['previewMode'])
              mode = 3;

            if (crid == '' && Mugeda && Mugeda.data && Mugeda.data.crid) {
              crid = Mugeda.data.crid;
            }

            if (crid == '' && /\/edit\/(\w+)\&?/.test(top.location.href)) {
              // 否则如果是在编辑窗口中，则直接获取编辑窗口的id。
              var id = RegExp.$1;

              // 这里取出来的可能是共享码
              if (id.length < 16) {
                // 尝试获取下父级crid
                if (parent && parent.crid) {
                  crid = parent.crid;
                  mode = 2;
                } else {
                  crid = id;
                  mode = 1;
                }
              }
              else {
                mode = 2;
                crid = id;
              }
            }
            else if (crid == '' && /id=(\w+)\&?/.test(window.location.search)) {
              mode = 3;
              crid = RegExp.$1;
            }

            if (!crid) {
              console.warn("没有获取到crid");
            }

            var post = function (path, params, method, callback) {
              method = method || 'post';

              var form = document.createElement('form'),
                iframe = document.createElement('iframe');

              form.setAttribute('method', method);
              form.setAttribute('action', path);

              var iframeId = '__iframe' + Math.random() * 10000;
              iframe.setAttribute('id', iframeId);
              iframe.setAttribute('name', iframeId);
              form.setAttribute('target', iframeId);
              iframe.style.width = 0;
              iframe.style.height = 0;
              iframe.style.display = 'none';

              iframe.addEventListener('load', function () {
                //TODO;
              });

              for (var i = 0, l = params.length; i < l; i++) {
                var param = params[i].split('='),
                  key = param[0], value = param[1];

                var field = document.createElement('input');

                field.setAttribute('type', 'hidden');
                field.setAttribute('name', key);
                field.setAttribute('value', value);
                form.appendChild(field);
              }

              document.body.appendChild(form);
              document.body.appendChild(iframe);
              form.submit();
            }

            if (crid && /^[a-zA-Z0-9\-\_\.]+\.(mugeda|mgd5|h5mc|h5mgd|imugeda|mgdh5|hubpd)\.com$/.test(window.location.hostname)) {
              //send form data to mugeda backend
              var url =   window.Mugine.Utils.Browser.getWeixinServerHost() + '/server/cards.php/saveform';

              if (/_mrcmc=(.*?)(\&|$|\#)/.test(location.search)) {
                  params += '&_mrcmc=' + RegExp.$1;
              }
              if (/_mrcsc=(.*?)(\&|$|\#)/.test(location.search)) {
                  params += '&_mrcsc=' + RegExp.$1;
              }

              params += '&_msuid=' + getMsuid();
              params += '&user_id=' + getOwnerid();

              // 如果是在课程内打开，加上学生id和课程id
              if (getUrlParam('is_course')) {
                  params += '&user_ref_id=' + getMsuid();
                  params += '&course_id=' + getUrlParam('course_id');
                  params += '&class_id=' + getUrlParam('class_id');
                  params += '&section_id=' + getUrlParam('section_id');
                  params += '&is_course=' + getUrlParam('is_course');
              }
              // 如果是在1+x中使用，需要以下参数
              if (getUrlParam('is_exam')) {
                  params += '&exam_id=' +  getUrlParam('exam_id');
                  params += '&subject_id=' + getUrlParam('subject_id');
                  params += '&is_exam=' + getUrlParam('is_exam');
              }
              // 如果是云课堂1+x使用，需要以下参数
              if (getUrlParam('is_course_exam')) {
                params += '&subject_id=' +  getUrlParam('subject_id');
                params += '&course_id=' + getUrlParam('course_id');
                params += '&class_id=' + getUrlParam('class_id');
                params += '&is_course_exam=' + getUrlParam('is_course_exam');
              }

              post(url, (params + '&crid=' + crid + '&mode=' + mode).split('&'));
              options.msg && Mugeda.messageBox(options.msg);
            } else if (crid) {
              var url =   window.Mugine.Utils.Browser.getWeixinServerHost() + '/server/cards.php/saveform';
              post(url, (params + '&crid=' + crid + '&mode=' + mode).split('&'));
              options.msg && Mugeda.messageBox(options.msg);
            }

            if (options.openTarget == "callback") {
              if (options.callback && window[options.callback]) {

                var evt = {
                  callback: function () {
                    options.msg && Mugeda.messageBox(options.msg);
                  },
                  cancel: false
                }

                window[options.callback](params, evt);

                MugedaTracker.fireEvent({
                  category: "interaction",
                  action: "form",
                  label: '',
                  value: options.id ? parseInt(options.id, 36) : 0
                });

                if (evt.cancel !== true) {
                  evt.callback();
                }

              }
              else {
                console.log("No callback function found. Skipping...");
              }
            }
            else if (options.openTarget == "frame") {
              options.callback && options.callback();
            }
            else if (options.openTarget == "page") {
              options.callback && options.callback();
            }

            options.loadFinished();
          }
          else {
            try {
              // Max 由于加入了默认的默认数据后台，要求必须上传crid
              if (options.url.indexOf('weika.mugeda.com/server/cards.php') != -1) {
                var crid = _mrmcp['creative_id'] || '';
                if (crid == '' && Mugeda && Mugeda.data && Mugeda.data.crid) {
                  crid = Mugeda.data.crid;
                }
                else if (crid == '' && parent && parent.crid) {
                  // 如果父级窗口有crid，直接使用编辑层crid
                  crid = parent.crid;
                }
                else if (crid == '' && /\/edit\/(\w+)\&?/.test(top.location.href)) {
                  // 否则如果是在编辑窗口中，则直接获取编辑窗口的id。
                  crid = RegExp.$1;
                }
                else if (crid == '' && /id=(\w+)\&?/.test(window.location.search)) {
                  crid = RegExp.$1;
                }
                redirect = redirect + "&crid=" + crid
              }
              // put the function in onload to avoid cross-domain errors.
              window.open(redirect, target);

              if ('popupFormIframe') {
                G('popupFormIframe').onload = function () {
                  options.loadFinished();

                  MugedaTracker.fireEvent({
                    category: "interaction",
                    action: "form",
                    label: '',
                    value: options.id ? parseInt(options.id, 36) : 0
                  });

                  options.msg && Mugeda.messageBox(options.msg);
                }
              }
              else {
                MugedaTracker.fireEvent({
                  category: "interaction",
                  action: "form",
                  label: '',
                  value: options.id ? parseInt(options.id, 36) : 0
                });
                options.msg && Mugeda.messageBox(options.msg);
              }
            }
            catch (e) {
              options.loadFinished();
              Mugeda.messageBox("Form submission failed. Please try again. ");
            }
          }
        }

        // put the function in onload to avoid cross-domain errors.
        //  G('popupFormIframe').onload=function()
        {
          for (field in mapCookies) {
            var elem = document.getElementById(mapCookies[field]);
            if (elem) {
              if (elem.type == "checkbox" || elem.type == "radio")
                setStorageOrCookie(field, elem.checked);
              else
                setStorageOrCookie(field, elem.value);
            }
          }

          if (androidVersion < 3.0)
            // On Android 2.3, a window open MUST be triggered by a click. setTimeout shadows any clicks.
            runSubmit();
          else
            setTimeout(runSubmit, 200);
        }

        return false;
      }
    }

    div.style.display = '';
    div.form.innerHTML = options.html;
    if (options.id) {
      div.form.id = options.id;
    }

    var eventName = isMobile() ? 'touchstart' : 'click';
    var submitBtn = div.form.querySelector('input[id=actionButton]');
    submitBtn.addEventListener(eventName, submitFormAction, false);

    div.style.display = '';
    div.style.visibility = "hidden";
    setTimeout(function () {
      dispatchFormEvent('mugedaFormInitialized', { 'form': div.form });
      div.style.visibility = "visible";
    }, 200);
    setTimeout(function () {
      GT(div, 'popupFormCancel').addEventListener(eventName, function () {
        removeForm(div);
        self.popupFormDiv = null;
      }, false);
    }, 500);

    var inputs = div.querySelectorAll('.popupFormInput');

    for (var i = 0; i < inputs.length; i++) {
      var input = inputs[i];
      input.onfocus = onInputFocus;
      input.onblur = onInputBlur;
    }

    var bound;

    if (options.target) {
      bound = options.target.getBoundingClientRect();
    } else {
      var mugeda = Mugeda.getMugedaObject ? Mugeda.getMugedaObject() : null;
      if (mugeda && options.isCss) {
        var adaption = mugeda.adaption;
        bound = {
          left: Math.max(0, (window.Mugine ? 1 : -1) * adaption.marginLeft),
          top: window.Mugine ? 0 : Math.max(0, (window.Mugine ? 1 : -1) * adaption.marginTop),
          width: Math.min(adaption.width, mugeda.width),
          height: Math.min(adaption.height, mugeda.height)
        }
      }
      else {
        bound = {
          left: 0,
          top: 0,
          width: docWidth,
          height: docHeight
        }
      }

    }

    document.body.style.overflowY = 'auto';
    var toggled = toggleCanvas();

    if (toggled) {
      div.style.marginLeft = Math.max(2, bound.left + document.documentElement.scrollLeft + (bound.width - div.offsetWidth) / 2) + 'px';
      div.style.marginTop = Math.max(2, bound.top + document.documentElement.scrollTop + (bound.height - div.offsetHeight) / 2) + 'px';
      div.style.marginBottom = 32 + 'px';
      if (div.offsetHeight + 32 > document.documentElement.scrollHeight) {
        div.style.marginTop = parseInt(window.getComputedStyle ? getComputedStyle(div).marginTop : div.currentStyle.marginTop) + 32 + 'px';

        if (isMobile()) {
          document.body.style.height = div.offsetHeight + 64 + 'px';
        }
      }
    }
    else {
      div.style.position = "relative";

      div.style.left = bound.left + 'px';
      div.style.top = bound.top + 'px';
      var padVer = Math.max(2, bound.top + (bound.height - div.offsetHeight) / 2) + 'px';
      var padHor = Math.max(2, bound.left + (bound.width - div.offsetWidth) / 2) + 'px';
      //div.style.paddingLeft = padHor;
      //div.style.paddingTop = padVer;
      //div.style.paddingRight = padHor;
      //div.style.paddingBottom = padVer;

      if (!isel) {
        var formDiv = div.querySelector('form');
        formDiv.style.bottom = "-9999px";
        div.style.overflow = 'hidden';
        setTimeout(function () {

          div.style.background = "rgba(0,0,0,0)"
          div.style.width = bound.width + 'px';
          div.style.height = '100%';

          formDiv.style.webkitTransition = 'none';
          formDiv.style.bottom = -formDiv.offsetHeight + 'px';

          setTimeout(function () {
            formDiv.style.webkitTransition = 'all 500ms';
            formDiv.style.bottom = 0 + 'px';
            formDiv.style.overflowY = 'auto';
            !isel && (div.style.background = "rgba(0,0,0,0.3)");
          }, 1);
        }, 1);
      }
    }
  },

  getPopupFormHeight: function (data) {
    var items = data.items;
    var h = 0;
    for (var i = 0, l = items.length; i < l; i++) {
      var item = items[i];
      switch (item.type) {
        case "input":
        case "phone":
        case "email":
          h += 44;
          break;
        case "textarea":
          h += 64;
          break;
        case "radio":
          h += 48;
          break;
        case "checkbox":
          var c = item.value.split('\n').length;
          h += 32 * c + 8;
          break;
        case "select":
          h += 36;
          break;
        default:
          h += 44;
          break;
      }
    }
    if (data.title) {
      h += 60;
    }

    // 第一个表单项上部留8像素
    h += 8;

    // 确定按钮区高50
    h += 50;

    // 表格最下方留16像素
    h += 16;
    return h;
  },

  processAction: function (behavior, event, track, callback) {
    var report = true;
    if (behavior.type == "pause")
      this.pause(behavior.param);
    else if (behavior.type == "play")
      this.resume(1);
    else if (behavior.type == "next")
      this.next();
    else if (behavior.type == "previous")
      this.previous();
    else if (behavior.type == "nextPage")
      this.nextPage();
    else if (behavior.type == "prevPage")
      this.prevPage();
    else if (behavior.type == "disablePage")
      this.disablePage();
    else if (behavior.type == "disablePageForward")
      this.disablePageForward();
    else if (behavior.type == "disablePageAfter")
      this.disablePageAfter();
    else if (behavior.type == "enablePage")
      this.enablePage();
    else if (behavior.type == "enablePageForward")
      this.enablePageForward();
    else if (behavior.type == "enablePageAfter")
      this.enablePageAfter();
    else if (behavior.type == "gotoPage") {
      var pageId = (behavior.param && behavior.param.page_number) ? behavior.param.page_number : behavior.param;
      var list = (typeof pageId == "string") ? pageId.split(';') : [];
      if (list.length > 1)
        pageId = list[Math.floor(Math.random() * list.length)];
      pageId = parseInt(pageId);

      this.gotoPage(pageId);
    }
    else if (behavior.type == "callback")
      this.callback(behavior.object, behavior.param);
    else if (behavior.type == "map")
      this.map(behavior.param);
    else if (behavior.type == "gotoAndPlay") {
      var frameId = (behavior.param && behavior.param.frame_number) ? behavior.param.frame_number : behavior.param;
      var list = (typeof frameId == "string") ? frameId.split(';') : [];
      if (list.length > 1)
        frameId = list[Math.floor(Math.random() * list.length)];
      frameId = parseInt(frameId);

      if (isNaN(frameId)) {
        var frameName = (behavior.param && behavior.param.frame_name) ? behavior.param.frame_name : '';
        frameId = Mugeda.mapFrameNameId[frameName];
        frameId = parseInt(frameId) + 1;
      }

      this.gotoAndPlay(frameId);

    } else if (behavior.type == "gotoAndPause" || behavior.type == "gotoAndStop") {
      var frameId = (behavior.param && behavior.param.frame_number) ? behavior.param.frame_number : behavior.param;
      var list = (typeof frameId == "string") ? frameId.split(';') : [];
      if (list.length > 1)
        frameId = list[Math.floor(Math.random() * list.length)];
      frameId = parseInt(frameId);

      if (isNaN(frameId)) {
        var frameName = (behavior.param && behavior.param.frame_name) ? behavior.param.frame_name : '';
        frameId = Mugeda.mapFrameNameId[frameName];
        frameId = parseInt(frameId) + 1;
      }

      this.gotoAndPause(frameId);
    }
    else if (behavior.type == "call")
      MugedaMraid.makePhoneCall(behavior.param);
    else if (behavior.type == "sms")
      MugedaMraid.sendShortMessage(behavior.param);
    else if (behavior.type == "email")
      MugedaMraid.sendEmail(behavior.param);
    else if (behavior.type == "video") {
      behavior.param.event = event;
      MugedaMraid.playVideo(behavior.param);
    }

    else if (behavior.type == "stopVideo")
      MugedaMraid.stopVideo(behavior.param);
    else if (behavior.type == "audio") {
      behavior.param.event = event;
      var restart = behavior.restart;
      if (window.Mugeda && Mugeda.getMugedaObject) {
        var mugeda = Mugeda.getMugedaObject();
        var currentId = Math.floor(mugeda.scene.currentId);
        if (behavior.unit && behavior.unit.frameStart == currentId)
          restart = true;
      }
      report = MugedaMraid.playAudio(behavior.param, restart);
    }
    else if (behavior.type == "picture")
      MugedaMraid.savePicture(behavior.param);
    else if (behavior.type == "calendar")
      MugedaMraid.addCalendarEvent(behavior.param);
    else if (behavior.type == "expand")
      MugedaMraid.expand(behavior.param.url, 0, behavior.param);
    else if (behavior.type == "resize")
      MugedaMraid.expand("", 1, behavior.param);
    else if (behavior.type == "stopAudio") {
      if (Mugeda.stopAudio) Mugeda.stopAudio(behavior.param);
    }
    else if (behavior.type == "stopAllAudio") {
      if (Mugeda.stopAudioAll) Mugeda.stopAudioAll();
    }
    else if (behavior.type == "submitForm" || behavior.type == "submitDefaultQuestion" || behavior.type === 'submitDynamicQuestion') {
        var param = behavior.param;
      var mugeda = Mugeda.getMugedaObject ? Mugeda.getMugedaObject() : null;
      var list = param.submit_object;
      var target = param.submit_target || 0;
      var meta = { version: 1, field: {} };

      if( behavior.type === 'submitDefaultQuestion') {
        if(behavior.object.displayObject.getChildByName && behavior.object.displayObject.getChildByName('kaojuan_submit_button_text_xddr911q8q').getText() === '查看成绩') {
          const resultMask = document.querySelector('.mugeda_tiku_mask')
          if(resultMask) {
            resultMask.style.display = ''
            return
          }

        }
      }


      // 测试
      var url = target == 0 ? (window.Mugine.Utils.Browser.getWeixinServerHost() + '/server/cards.php/saveform') : param.submit_url;
      var crid = '';
      var mode = 0;
      if (_mrmcp['creative_id']) {
        // 定义了crid就直接用
        crid = _mrmcp['creative_id'];
        if (_mrmcp['previewMode'])
          mode = 3;
      }
      else if (Mugeda && Mugeda.data && Mugeda.data.crid) {
        crid = Mugeda.data.crid;
        mode = 3;
      }

      if (crid == '' && /\/edit\/(\w+)\&?/.test(top.location.href)) {
        // 否则如果是在编辑窗口中，则直接获取编辑窗口的id。
        var id = RegExp.$1;

        // 这里取出来的可能是共享码
        if (id.length < 16) {
          // 尝试获取下父级crid
          if (parent && parent.crid) {
            crid = parent.crid;
            mode = 2;
          } else {
            crid = id;
            mode = 1;
          }
        }
        else {
          mode = 2;
          crid = id;
        }
      }
      else if (crid == '' && /id=(\w+)\&?/.test(window.location.search)) {
        mode = 3;
        crid = RegExp.$1;
      }

      // if (crid && /^[a-z\-]+\.mugeda\.com$/.test(window.location.hostname)) {
      // submitDefaultQuestion 没有 submit_target，以自己作为submit_target。
      if (behavior.type == "submitDefaultQuestion" || behavior.type === 'submitDynamicQuestion') {
        list = behavior.object.id || behavior.object._id
      }
      // 支持跨域，无需检查mugeda.com域名。
      if (crid && list) {
          if(typeof list === 'string') {
              var items = list.split(',');
          }
          else {
              items = Object.values(list); // 支持 name: aObjectName格式
          }

        var validNum = 0;

        // args和groupArgs都存储提交数据
        var args = 'crid=' + crid + '&mode=' + mode;
        var groupArgs = {};
        // 存储图片、音频的字段的promise数组
        var asyncDataList = [];
        var usePost = false;
        var showTikuEnd = false;

        for (var i = 0; i < items.length; i++) {
          var name = items[i] || '';
          var vals = name.split('_');
          var obj;

          if(typeof list === 'object') {
              var mapedName = Object.keys(list)[i];
          }

          if (vals && vals.length > 1) {
            var instance = mugeda.scene.getObjectByName(vals[0]);
            if (instance)
              obj = instance.scene.getObjectByName(vals[1]);
          }
          else if (behavior.type == "submitDefaultQuestion" || behavior.type === 'submitDynamicQuestion') {
            obj = mugeda.scene.getObjectById(name,'guid');
          }
          else
            obj = mugeda.scene.getObjectByName(name);

          // 清除校验失败时的提交记录
          var removeFailSubmitRecord = function(id) {
            try {
              var mugedaFormSubmitData = JSON.parse(localStorage.getItem('mugedaFormSubmitData'));
            }
            catch (e) {
              var  mugedaFormSubmitData = [];
            }
            mugedaFormSubmitData = mugedaFormSubmitData.filter(function(item){
                return item.id !== id
            });
            try {
              localStorage.setItem('mugedaFormSubmitData', JSON.stringify(mugedaFormSubmitData));
            }
            catch (e) {
                console.log("记录提交记录失败");
            }
          }

          if (obj) {
            // submitDefaultQuestion 时，behavior类型优先级高于object类型。判断在最前
            if (behavior.type == "submitDefaultQuestion") {
              let checkedNames
              let allScore
              if(param.submit_source && param.submit_source !== '$$kaojuan$$') {
                try {
                  const data = JSON.parse(mugeda.scene.getObjectByName(param.submit_source).data.param.question).data
                  checkedNames = data.checked
                  allScore = data.allScore
                } catch (e) {
                  console.error("获取题目数据失败", e);
                }
              } else if(mugeda.aniData.metadata.question && mugeda.aniData.metadata.question.checkedNames) {
                checkedNames = mugeda.aniData.metadata.question.checkedNames
                allScore = mugeda.aniData.metadata.question.allScore
              }

              if (checkedNames) {
                const uploadList = {} // 需要上传的文件列表
                const res = Mugine.Display.DisplayObjectTiku.prototype.getSubmitQuestion.call(obj.displayObject, checkedNames, allScore, {
                  transformVal: function(v, { type }) {
                    if(type === 'image' || type === 'audio') {
                      const { type: _type, mediaType } = checkFileTypeIncludeBase64Url(v)
                      if(type === mediaType) {
                        uploadList[v] = { type: _type, mediaType }
                        return v
                      }
                    }
                    return v;
                  }
                });

                if(Object.keys(uploadList).length > 0) {
                  asyncDataList.push(new Promise((resolve, reject) => {
                    let pros = []
                    for(const url in uploadList) {
                      const { type, mediaType } = uploadList[url];
                      pros.push(MugedaHelper.uploadImage({
                        type,
                        imgData: type === 'base64' ? url.split(',')[1] : undefined,
                        url: type === 'url' ? (new URL(url, location.origin)).href : undefined,
                      }).then(res => {
                        return new Promise((resolve, reject) => {
                          if(res.status !== 0) {
                            return reject(res.error || '上传文件失败，请重试');
                          }
                          uploadList[url].newUrl = res.info
                          resolve()
                        });
                      }))
                    }

                    return Promise.all(pros).then(() => {
                      resolve({
                        post: function() {
                          const res = Mugine.Display.DisplayObjectTiku.prototype.getSubmitQuestion.call(obj.displayObject, checkedNames, allScore, {
                            transformVal: function(v, { type }) {
                              if(type === 'image' || type === 'audio') {
                                const { type: _type, mediaType } = checkFileTypeIncludeBase64Url(v)
                                if(type === mediaType) {
                                  return uploadList[v].newUrl || v;
                                }
                              }
                              return v;
                            }
                          });
                          Object.keys(res).forEach(function(key){
                            groupArgs[key] = res[key];
                            data.set(key, res[key]);
                          })
                        }
                      })
                    }).catch(err => {
                      reject(err)
                    })
                  }))
                }


                if(!res) {
                  Mugeda.messageBox('请完成题目再提交');
                  return;
                }
                Object.keys(res).forEach(function(key){
                    groupArgs[key] = res[key];
                })
                validNum++
                usePost = true;
                showTikuEnd = true;
                args += '&operate=questions';
              }
            } else if (obj.data.type === 2041) { //radio
              var groupName = obj.data.param.name;
              if (!groupName) continue;

              var required = obj.data.param.required,
                selectRadio = obj.dom.querySelector('input:checked');

              if (required === 1 && !selectRadio) {
                Mugeda.messageBox('请选择【' + groupName + '】，该项不能为空。');
                removeFailSubmitRecord(behavior.id);
                return;
              } else {
                groupArgs[groupName] = selectRadio ? selectRadio.value : '';
                validNum++;
              }
            }
            else if (obj.data.type === 2038) { //checkbox
              var groupName = obj.data.param.name;
              if (!groupName) continue;

              var required = obj.data.param.required,
                selectedItems = document.querySelectorAll('input[name="' + groupName + '"]:checked');

              if (required === 1 && !selectedItems.length) {
                Mugeda.messageBox('请选择【' + groupName + '】，该项不能为空。');
                removeFailSubmitRecord(behavior.id);
                return;
              } else {
                var vals = [];
                for (var ii = 0, l = selectedItems.length; ii < l; ii++) {
                  vals.push(selectedItems[ii].value);
                }

                groupArgs[groupName] = vals.length ? vals.join(',') : '';
                validNum++;
              }
            }
            else if (obj.data.type === 2039) { // select
              var required = obj.data.param.required,
                textContent = unescape(obj.data.param.textContent),
                selectedOption = obj.dom.querySelector('option:checked');

              if (required === 1 && selectedOption && selectedOption.innerText === textContent) {
                // Mugeda.messageBox('请选择【' + textContent + '】，该项不能为空。');
                Mugeda.messageBox('请选择【' + (obj.data.param.name || "下拉列表") + '】，该项不能为空。');
                removeFailSubmitRecord(behavior.id);
                return;
              } else {
                name = name.replace(/#/g, '_');
                if (selectedOption) {
                  args += '&' + name + '=' + (selectedOption.value !== textContent ? selectedOption.value : '');
                } else {
                  args += '&' + name + '=' + '';
                }
                validNum++;
              }
            }
            else if (obj.data.type === 2080 || obj.data.type === 802083 || obj.data.type === 2054){ // 题库
                var res = obj.getSubmitData(name);
                Object.keys(res).forEach(function(key){
                    groupArgs[key] = res[key];
                })
                validNum++
                usePost = true;
                if(obj.data.type === 2054) {
                    showTikuEnd = true; // 动态题库
                    var tikuEndDom = obj.dom
                }
                args += '&operate=questions';
            }
            else if (isChooseFileData(obj.data)) {// 上传附件
              var required = obj.data.param && obj.data.param.required;
              var uploadState = obj.uploadState;
              var fileResult = obj.file;
              if (uploadState === 'uploading' || uploadState === 'error') {
                Mugeda.messageBox(uploadState === 'uploading' ? '附件正在上传，请稍后提交。' : '附件上传失败，请重新选择。');
                removeFailSubmitRecord(behavior.id);
                return;
              }
              if (required === 1 && !fileResult) {
                Mugeda.messageBox(
                  (obj.data.param && obj.data.param.errContent) ||
                  ('请上传【' + (obj.data.param && obj.data.param.name || '附件') + '】')
                );
                removeFailSubmitRecord(behavior.id);
                return;
              }
              if (fileResult) {
                (function () {
                  var objName = mapedName !== undefined ? mapedName : name;
                  asyncDataList.push(Promise.resolve({
                    name: objName,
                    value: encodeURIComponent(fileResult.url),
                    type: 'file',
                    original_filename: fileResult.original_filename,
                    length: fileResult.length
                  }));
                  validNum++;
                })();
              } else {
                validNum++;
              }
            }
            else if (
                obj.data.type === 2005 || // 图片
                obj.data.type === 2003 || // 矩形
                obj.data.type === 2004 || // 椭圆
                obj.data.type === 2006 || // 多边形
                obj.data.type === 2034
            ) {// 图片
              /*
              if (!obj.dom) {
                  continue;
              }*/
              //var imageSrc = obj.data.param.imageSrc || obj.data.param.fillInfo.fillImage;
              var imageSrc = obj.src
              if(!imageSrc) continue;

              var targetUrl = new URL(imageSrc, window.location.origin);
              // 已经上传到cdn的图片音频直接保存链接，
              // base64则上传
              // 外链则通过接口保存到cdn

              if(targetUrl.protocol === 'data:') {
                var imgBase64 = targetUrl.href;
                (function () {
                  var objName = mapedName !== undefined ? mapedName : name;
                  var uploadPromise = MugedaHelper.uploadImage({type:'base64',imgData:imgBase64}).then(function (data) {
                    return {
                      name: objName,
                      value: encodeURIComponent(data.info),
                      type: 'image'
                    };
                  });
                  asyncDataList.push(uploadPromise);
                  validNum++
                })();
              } else {
                (function () {
                  var objName = mapedName !== undefined ? mapedName : name;
                  var uploadPromise = MugedaHelper.uploadImage({type:'url',url:targetUrl.href}).then(function (data) {
                    return {
                      name: objName,
                      value: encodeURIComponent(data.info),
                      type: 'image'
                    };
                  });
                  asyncDataList.push(uploadPromise);
                  validNum++
                })();
              }
            }
            else if (obj.data.type === 2020) {// 声音
              if (!obj.audio) {
                  continue;
              }
              (function () {
                var objName = mapedName !== undefined ? mapedName : name;
                var uploadPromise = MugedaHelper.uploadImage({type:'url',url:obj.audio.src}).then(function (data) {
                  return {
                    name: objName,
                    value: encodeURIComponent(data.info),
                    type: 'audio'
                  };
                });
                asyncDataList.push(uploadPromise);
                validNum++
              })();
            }
            else {
              var value = obj ? obj.text || '' : '';

              //如果提交表单的信息中含有井号,则把井号删掉
              if (value.indexOf('#'))
                value = value.replace(/\#/g, '');

              var inputType = obj.data.param.inputType;
              var hashRegEx = {
                //   "tel": "^\\d+$",
                "tel": "^[1][3,4,5,6,7,8,9][0-9]{9}$",
                "email": '^(([^<>()\\[\\]\\\\.,;:\\s@"]+(\\.[^<>()\\[\\]\\\\.,;:\\s@"]+)*)|(".+"))@((\\[[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}])|(([a-zA-Z\\-0-9]+\\.)+[a-zA-Z]{2,}))$',
                "date": "",
                "time": "",
                "number": "^\\d+$",
                "idCard": "^(^[1-9]\\d{7}((0\\d)|(1[0-2]))(([0|1|2]\\d)|3[0-1])\\d{3}$)|(^[1-9]\\d{5}[1-9]\\d{3}((0\\d)|(1[0-2]))(([0|1|2]\\d)|3[0-1])((\\d{4})|\\d{3}[Xx])$)$"
              };

              var required = obj.data.param.required;
              if (required === 1 && !value.length) {
                Mugeda.messageBox(obj.data.param.errContent ||('请选择【' + obj.data.param.name + '】，该项不能为空。'));
                removeFailSubmitRecord(behavior.id);
                return;
              }
              else if (value.length) {
                // 正则校验需要特殊的处理和校验
                if (inputType == 'regExp') {
                  var inputRegExp = obj.data.param.inputRegExp;
                  if (inputRegExp) {
                    try {
                      var valid = new RegExp(inputRegExp).test(value);
                      if (!valid) {
                        if (obj.data.param.textContentError) {
                          Mugeda.messageBox(obj.data.param.textContentError);
                        } else {
                          Mugeda.messageBox('【' + obj.data.param.name + '】的内容（' + value + '）的正则校验不通过。请检查后重试。');
                        }
                        removeFailSubmitRecord(behavior.id);
                        return;
                      }
                    } catch(e) {
                      Mugeda.messageBox('正则校验规则有误。请检查后重试。');
                      return;
                    }
                  }
                } else {
                  var regEx = hashRegEx[inputType];
                  if (regEx) {
                    var valid = new RegExp(regEx).test(value);
                    if (!valid) {
                      if (obj.data.param.textContentError) {
                        Mugeda.messageBox(obj.data.param.textContentError);
                      } else {
                        Mugeda.messageBox('【' + obj.data.param.name + '】的内容（' + value + '）的正则校验不通过。请检查后重试。');
                      }
                      removeFailSubmitRecord(behavior.id);
                      return;
                    }
                  }
                }
              }

              if (name || mapedName) {

                name = (mapedName !== undefined ? mapedName : name).replace(/#/g, '_');
                args += '&' + name + '=' + value;
                validNum++;
              }
            }
          }
        }

        if (validNum == 0) return;
        url += '?' + args;

        var data = null;
        if (usePost) {
            var formData = new FormData();
            for (var groupName in groupArgs) {
                //如果key存在井号 则把井号转成下划线 否则报错
                formData.set(groupName, groupArgs[groupName]);
              }
            data = formData;
        } else if (Object.keys(groupArgs).length > 0) {
          for (var groupName in groupArgs) {
            //如果key存在井号 则把井号转成下划线 否则报错
            if (groupName.indexOf('#')) {
              var cacheValue = groupArgs[groupName];
              groupName = groupName.replace(/#/g, '_');
              url += '&' + groupName + '=' + cacheValue;
            } else {
              url += '&' + groupName + '=' + groupArgs[groupName];
            }
          }
        }

        //寻找是否存在抽奖附加信息，如果有则随表单一起提交
        if (behavior.extraData) {
          for (var key in behavior.extraData) {
            url += '&' + key + '=' + behavior.extraData[key];
          }
        }

        if (/_mrcmc=(.*?)(\&|$|\#)/.test(location.search)) {
            url += '&_mrcmc=' + RegExp.$1;
        }
        if (/_mrcsc=(.*?)(\&|$|\#)/.test(location.search)) {
            url += '&_mrcsc=' + RegExp.$1;
        }

        if(!/_msuid=[^&]+/.test(url)) {
            url += '&_msuid=' + getMsuid();
        }
        if(!/user_id=[^&]+/.test(url)) {
            url += '&user_id=' + getOwnerid();
        }

        // 如果是在课程内打开，加上学生id和课程id
        if (getUrlParam('is_course')) {
          url += '&msuid=' + getUrlParam('msuid');
          url += '&course_id=' + getUrlParam('course_id');
          url += '&class_id=' + getUrlParam('class_id');
          url += '&section_id=' + getUrlParam('section_id');
          url += '&chapter_id=' + getUrlParam('chapter_id');
          url += '&is_course=' + getUrlParam('is_course');
        }
        // 如果是在1+x中使用，需要以下参数
        if (getUrlParam('is_exam')) {
          url += '&exam_id=' + getUrlParam('exam_id');
          url += '&subject_id=' + getUrlParam('subject_id')
          url += '&is_exam=' + getUrlParam('is_exam')
        }
         // 如果是云课堂1+x使用，需要以下参数
         if (getUrlParam('is_course_exam')) {
          url += '&subject_id=' +  getUrlParam('subject_id');
          url += '&course_id=' + getUrlParam('course_id');
          url += '&class_id=' + getUrlParam('class_id');
          url += '&is_course_exam=' + getUrlParam('is_course_exam');
        }

        MugedaTools['message']['show']('正在提交');

         var uploadTiku = function(callback) {
             var crid;
             if (window['_mrmcp'] && window['_mrmcp']['creative_id']) {
                 crid = window['_mrmcp']['creative_id'];
             }
             if(!crid) {
                 alert('作品未保存，需要保存后才可提交考题');
                 return callback({ status: 101 })
             }
             if(!data) {
                 return callback(null)
             }
             var examData = data.get('examData');
             if(!examData) {
                 return callback(null)
             }
             try {
                 examData = JSON.parse(examData);
             } catch (err) {
                 alert('考题数据有误，请检查后重试');
                 return callback({ status: 101 })
             }
             var questions = examData.questions;
             if(questions.length === 0 || !questions) {
                 return callback(null)
             }
             if(questions.find(function(q){ return !q.id })) {
                 alert('考题未保存，请先保存后重试');
                 return callback({ status: 101 })
             }

             if((new URL(url)).searchParams.get('operate') === 'questions') {
                 ajaxHelper({
                    url: window.Mugine.Utils.Browser.getWeixinServerHost() + '/server/cards.php/save_question_form',
                     'type': 'jsonp',
                     "mode": 'postMessage',
                     "isPost": true,
                     "form": {
                         crid: crid,
                         msuid: getMsuid(),
                         exam_data: data.get('examData'),
                         course_id: getUrlParam('course_id'),
                         class_id: getUrlParam('class_id'),
                         exam_id: getUrlParam('exam_id'),
                         subject_id: getUrlParam('subject_id'),
                         is_exam: getUrlParam('is_exam'),
                         is_course: getUrlParam('is_course'),
                         is_course_exam: getUrlParam('is_course_exam')
                     },
                     'success': function(resp) {
                        if(resp.status !== 0) {
                            alert('提交考卷失败');
                            return callback(resp)
                        }
                        callback(null)
                     },
                     "error": function(err) {
                         callback({ status: 101 })
                        console.log(err)
                     }
                 })
             } else {
                 callback(null)
             }
         }

        Promise.all(asyncDataList)['catch'](function(msg) {
            MugedaTools['message']['close']();
            callback && callback({ 'status': -1 });

            Mugeda.messageBox(msg.desc || msg || '上传文件失败，请重试');
        }).then(function(datalist) {
            // 处理图片和音频的url
            datalist.forEach(function(data) {
                if(data.post) {
                  data.post()
                  return;
                }

                url += '&' + data.name.replace(/#/g, '_') + '=' + data.value;
                if(data.type) {
                    if (data.type === 'file') {
                        meta.field[data.name.replace(/#/g, '_')] = {
                            type: 'file',
                            name: data.original_filename || '',
                            length: data.length || 0
                        }
                    } else {
                        meta.field[data.name.replace(/#/g, '_')] = { type: data.type }
                    }
                }
            });

            if(Object.keys(meta.field).length) {
                url += '&meta=' + encodeURIComponent(JSON.stringify(meta));
            }

            var ajaxOption = {
                url: url,
                type: 'jsonp',
                type: 'fetch',
                mode : 'iframe',
                jsonp_callback: 'form_callback',

                success: function (data) {
                    uploadTiku(function(err) {
                        if(err) {
                            console.error(err)
                            MugedaTools['message']['close']();
                            callback && callback({ 'status': err.status });
                        } else {
                            MugedaTools['message']['close']();
                            if (showTikuEnd) {
                                MugedaTools['message']['showTikuEnd'](groupArgs, tikuEndDom, mugeda.aniData.metadata.question);
                                const submitButton =  behavior.object.displayObject.getChildByName && behavior.object.displayObject.getChildByName('kaojuan_submit_button_text_xddr911q8q')
                                if(submitButton) submitButton.setText('查看成绩');
                            }
                            callback && callback(data);
                        }
                    })
                },
                error: function (data) {
                  MugedaTools['message']['close']();
                  callback && callback({ 'status': data.status });
                }
            }

            // 目前对于测试题数据提交使用fetch的post请求
            if (usePost) {
                ajaxOption['type'] = 'fetch';
                ajaxOption['method'] = 'POST';
                ajaxOption['data'] = data;
                delete ajaxOption['mode'];
                delete ajaxOption['jsonp_callback'];
            }

            ajaxHelper(ajaxOption);
        })

      }
    }

    var params = 'actoin_type=' + behavior.type + '&refid=' + new Date().getTime();
    for (item in behavior.param) {
      params += '&' + item + '=' + behavior.param[item];
    }

    //if(event == "click" && window.event && window.event.stopPropagation)
    //    window.event.stopPropagation();
    if (report && track && typeof behavior.param !== 'undefined' && behavior.param['event_name'])
      MugedaTracker.fireEvent({
        category: "interaction",
        // Only fire named event. Otherwise the report will be flooded.
        action: behavior.param['event_name'], //  || behavior.type,
        label: params,
        value: 0
      });
  },
  processCloseButton: function (mode, doc) {
    _mrmcp = (typeof _mrmcp == 'undefined') ? {} : _mrmcp;
    var docHolder = doc;
    var winFrame = null;
    if (!docHolder) {
      try {
        if (window != window.parent) {
          docHolder = window.parent.document;
          winFrame = window.frameElement;
        }
        else
          docHolder = document;
      } catch (e) {
        docHolder = document;
      }
    }
    if (!docHolder)
      return;

    var docTop = null;
    var divExpand = null;
    try {
      var top = window.parent;
      docTop = top.document;
      divExpand = docTop.getElementById('mugeda_expanded') || docTop.createElement('div');
    } catch (e) {
      // window.open(url);
      return;
    }

    var displayMode = mode || _mrmcp['display_mode'];
    var placementType = (MugedaMraid.mraidReadyStatus == 1 ? mraid.getPlacementType() : "default");

    var imgClose = docHolder.getElementById('mugeda_close_button');
    if (!imgClose) {
      var imgClose = docHolder.createElement("img");
      imgClose.id = "mugeda_close_button";
      imgClose.style.cursor = "pointer";
      imgClose.style.zIndex = 99999;
      imgClose.style.display = "block";
      imgClose.style.position = "fixed";
      imgClose.style.right = "0";
      imgClose.style.top = "0";
      imgClose.addEventListener('click', function () {
        if (MugedaMraid.mraidReadyStatus != 1) {
          docHolder.body.removeChild(imgClose);
          if (displayMode == "interstitial") {
            if (winFrame)
              winFrame.parentNode.removeChild(winFrame);
            else {
              // TODO: Hide the ad unit.
            }
          }
          var divExpanded = docHolder.getElementById('mugeda_expanded');
          if (divExpanded)
            docHolder.body.removeChild(divExpanded);

        }
      });
      docHolder.body.appendChild(imgClose);
    }
    if ((placementType == "interstitial") ||
      (displayMode == "auto" || displayMode == "resize" || displayMode == "expand" || displayMode == "interstitial")) {
      imgClose.src = close_img_url;
      imgClose.onerror = function () {
        imgClose.style.display = 'none';
      }
      imgClose.onload = function () {
        imgClose.style.display = (placementType == "interstitial" || displayMode != "auto") ? "block" : "none";
      }
    }
  },

  setupMobileActionCallback: function (callback) {
    MugedaBehavior.actionCallback = callback;
  },

  setupMobileActions: function (object, behavior, callback) {
    var data = object.dataRef || object.aniData;

    var dom = object.dom ? object.dom : window;
    var inputStart = isMobile() ? 'touchstart' : 'mousedown';
    var inputEnd = isMobile() ? 'touchend' : 'mouseup';
    var inputMove = isMobile() ? 'touchmove' : 'mousemove';
    var actionInfo = {
      capturedObject: null,
      startInfo: { x: 0, y: 0, time: 0 },
      endInfo: { x: 0, y: 0, time: 0 }
    }
    /*
            var checkSlide = function(dom, object, needProcessed){
            var diffX = actionInfo.endInfo.x - actionInfo.startInfo.x;
            var diffY = actionInfo.endInfo.y - actionInfo.startInfo.y;
            var slideType = null;

            var diffTime = actionInfo.endInfo.time - actionInfo.startInfo.time;

            if(diffTime < 2000 && (Math.abs(diffX) > 32 || Math.abs(diffY) > 32 )){
                var angle = Math.atan2(-diffY, diffX) * 180 / Math.PI;
                if(-22.5 < angle  && angle <= 22.5){
                    slideType = 'slide_right';
                }
                else if(22.5 < angle && angle <= 67.5){
                    slideType = 'slide_right_up';
                }
                else if(67.5 < angle && angle <= 112.5){
                    slideType = 'slide_up';
                }
                else if(112.5 < angle && angle <= 157.5){
                    slideType = 'slide_left_up';
                }
                else if(157.5 < angle || angle <= -157.5){
                    slideType = 'slide_left';
                }
                else if(-157.5 < angle && angle <= -112.5){
                    slideType = 'slide_left_down';
                }
                else if(-112.5 < angle && angle <= -67.5){
                    slideType = 'slide_down';
                }
                else if(-67.5 < angle && angle <= -22.5){
                    slideType = 'slide_right_down';
                }
            }

            var hashedAction = object.slideHash ? (object.slideHash[slideType] || {}) : {};
            var hashedBehavior = hashedAction.behavior || {};
            var hashedCallback = hashedAction.callback;

            var processed = false;
            if(slideType && (hashedBehavior.event == slideType)){
                processed = true;
                MugedaBehavior.processAction(hashedBehavior, hashedBehavior.event, true);
                hashedCallback && hashedCallback();

                if(MugedaBehavior.actionCallback)
                    MugedaBehavior.actionCallback(data, hashedBehavior.event);
            }

            actionInfo.capturedObject = null;

            slideType = (processed || !needProcessed) ? slideType : null;

            return slideType;
        }*/

    /*if(behavior.event == "touch_start"){
            object.touchstartBehavior = behavior;
            object.touchStartCallback = callback;
        }*/
    /*
        if(!object.slideHooked){
            dom.addEventListener(inputStart, function(event){
                event.preventDefault();
                actionInfo.capturedObject = object;

                var touch = event.targetTouches ? event.targetTouches[0] : null;
                actionInfo.startInfo.x = touch ? touch.pageX : event.pageX;
                actionInfo.startInfo.y = touch ? touch.pageY : event.pageY;
                actionInfo.startInfo.time = (new Date()).getTime();

                if(object.touchstartBehavior && object.touchstartBehavior.event == "touch_start" && object.dom && object.dom.style.display != "none"){
                    MugedaBehavior.processAction(object.touchstartBehavior, object.touchstartBehavior.event, true);
                    object.touchStartCallback && object.touchStartCallback();

                    if(MugedaBehavior.actionCallback)
                        MugedaBehavior.actionCallback(data, object.touchstartBehavior.event);
                }
            });
        }*/

    /*if(behavior.event == "touch_end"){
            object.touchendBehavior = behavior;
            object.touchendCallback = callback;
        }*/

    /*if(behavior.event.indexOf('slide_') == 0){
            object.slideHash = object.slideHash || {};
            object.slideHash[behavior.event] = {
                behavior: behavior,
                callback: callback
            };
        }*/
    /*
        if(!object.slideHooked){
            dom.addEventListener(inputEnd, function(event){
                event.preventDefault();
                actionInfo.capturedObject = null;
                var touch = event.changedTouches ? event.changedTouches[0] : null;

                actionInfo.endInfo.x = touch ? touch.pageX : event.pageX;
                actionInfo.endInfo.y = touch ? touch.pageY : event.pageY;
                actionInfo.endInfo.time = (new Date()).getTime();

                var slideType = checkSlide(dom, object, true);
                if(slideType)
                    event.stopPropagation();

                if(object.touchendBehavior && object.touchendBehavior.event == "touch_end" && object.dom.style.display != "none"){
                    MugedaBehavior.processAction(object.touchendBehavior, object.touchendBehavior.event, true);
                    object.touchendCallback && object.touchendCallback();

                    if(MugedaBehavior.actionCallback)
                        MugedaBehavior.actionCallback(data, object.touchendBehavior.event);
                }

            });
        }

        !object.slideHooked && dom.addEventListener(inputMove, function(event){
        });

        !object.slideHooked && !isMobile() && window.addEventListener(inputEnd, function(event){
            if(actionInfo.capturedObject){
                actionInfo.endInfo.x = event.pageX;
                actionInfo.endInfo.y = event.pageY;
                actionInfo.endInfo.time = (new Date()).getTime();
                event.preventDefault();

                var slideType = checkSlide(dom, object);
                if(slideType)
                    event.stopPropagation();
            }
        });

        object.slideHooked = true;
        */

    var resetShake = function () {
      MugedaBehavior.shakeNum = 0;
      // MugedaBehavior.lastMax = null;
      // MugedaBehavior.lastHitTime = 0;
    }

    function deviceMotionHandler(event) {
      var getAngle = function (v1, v2) {
        var d1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y + v1.z * v1.z);
        var d2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y + v2.z * v2.z);
        var dot = (v1.x * v2.x + v1.y * v2.y + v1.z * v2.z);

        var angle = Math.acos(dot / (d1 * d2));

        return angle;
      }

      var isAndroid = navigator.userAgent.toLowerCase().indexOf("android") > -1;
      var shakeAccelerationIncludingGravity = isAndroid ? 15 : 20;
      var shakeAcceleration = isAndroid ? 5 : 10;
      var timeAddTh = 200;
      var timeResetTh = 1000;

      var triggerShake = function (x, y, z, withGravity) {
        var acceleration = Math.sqrt(x * x + y * y + z * z);

        if (acceleration >= (withGravity ? shakeAccelerationIncludingGravity : shakeAcceleration)) {
          var now = new Date().getTime();

          var diffTime = now - (MugedaBehavior.lastHitTime || 0);

          if (!MugedaBehavior.lastHitTime || diffTime > timeAddTh) {
            MugedaBehavior.shakeNum++;
            MugedaBehavior.lastHitTime = now;
          }
          else if (diffTime > timeResetTh)
            resetShake();
          /*
                    var vector = {x:x, y:y, z:z}
                    if(!MugedaBehavior.lastMax){
                        MugedaBehavior.lastMax = vector;
                        MugedaBehavior.lastMagnitude = acceleration;
                    }
                    else{
                        var angle = getAngle(MugedaBehavior.lastMax, vector);

                        if(angle > Math.PI*2/3){
                            MugedaBehavior.shakeNum++;
                            MugedaBehavior.lastMax = vector;
                            MugedaBehavior.lastMagnitude = acceleration;
                        }
                        else if(acceleration > MugedaBehavior.lastMagnitude){
                            MugedaBehavior.lastMax = vector;
                            MugedaBehavior.lastMagnitude = acceleration;
                        }
                    }
                    */


          if (MugedaBehavior.shakeNum >= (isAndroid ? 1 : 2)) {
            for (var id in MugedaBehavior.shakeHash) {
              var shakeInfo = MugedaBehavior.shakeHash[id];
              for (var idx = 0; idx < shakeInfo.length; idx++) {
                info = shakeInfo[idx];

                var shakeObject = info.object;
                var visible = shakeObject.displayObject ? shakeObject.displayObject.realVisible : true;

                if (info.callback && visible) {
                  MugedaBehavior.processAction(info.behavior, info.behavior.event, true);
                  info.callback();
                }
              }
            }

            if (MugedaBehavior.actionCallback)
              MugedaBehavior.actionCallback(data, behavior.event);

            resetShake();
          }

        }
      }

      var x = 0, y = 0, z = 0;
      if (event.acceleration === null || event.acceleration.x === undefined || event.acceleration.y === undefined || event.acceleration.z === undefined || event.acceleration.x === null || event.acceleration.y === null || event.acceleration.z === null) {
        if (event.accelerationIncludingGravity) {
          x = event.accelerationIncludingGravity.x;
          y = event.accelerationIncludingGravity.y;
          z = event.accelerationIncludingGravity.z;

          triggerShake(x, y, z, 1);
        }
      }
      else {
        x = event.acceleration.x;
        y = event.acceleration.y;
        z = event.acceleration.z;

        triggerShake(x, y, z, 0);
      }
    }

    if (behavior.event == "shake" && window.DeviceMotionEvent) {
      // resetShake();

      if (!window.mugedaShakeHooked) {
        resetShake();

        // MugedaBehavior.shakeObject = object;
        // MugedaBehavior.shakeCallback = callback;
        window.addEventListener('devicemotion', deviceMotionHandler, false);
        window.mugedaShakeHooked = true;
      }

      var guid = object.aniData ? object.aniData.guid : null;

      if (guid) {
        if (!MugedaBehavior.shakeHash[guid])
          MugedaBehavior.shakeHash[guid] = [];

        MugedaBehavior.shakeHash[guid].push({
          object: object,
          callback: callback,
          behavior: behavior
        });
      }

    }

    // TODO: when the object is invisible, remove the listener.
    // window.removeEventListener('devicemotion', deviceMotionHandler, false);
  }
}





/////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////

MugedaTracker = {
  fireEvent: function (event) {
    var isLocal = !window.location || !window.location.host;
    if (isLocal) {
      return;
      var track_bot = _mrmcp['track_bot'] || '//cdn.mugeda.com/media/pages/track/track_20131030.html'
      var track_url = track_bot + '?' + (typeof _mrmma_var1 === 'undefined' ? 'var1=none' : _mrmma_var1) + '&' + (typeof _mrmma_var2 === 'undefined' ? 'var2=none' : _mrmma_var2) + '&category=' + event.category + '&action=' + event.action + '&label=' + encodeURIComponent(event.label) + '&value=' + event.value + '&noninteraction=' + event.noninteraction;

      var tracker = document.createElement('iframe');
      tracker.id = _mrmcp['creative_id'];
      tracker.src = track_url;
      tracker.style.display = 'none';
      tracker.style.width = '1px';
      tracker.style.height = '1px';
      var s = document.body.appendChild(tracker);
    }
    else {
      this.fireGAEvent(
        event.category, event.action, event.label, event.value, event.noninteraction);
      this.fireMUEvent(event.category, event.action, event.label, event.value);

      if (window.mugedaGetCustomTracker) {
        var customTracker = window.mugedaGetCustomTracker();
        if (customTracker) {
          _mrmcp = (typeof _mrmcp == 'undefined') ? {} : _mrmcp;
          var custom = _mrmcp["custom_params"];
          var tags = _mrmma_tags;
          if (custom && custom.indexOf('%CUSTOMPARAM%') < 0) {
            tags += "&" + custom;
          }

          customTracker(tags, event.category, event.action, event.label, event.value);
        }
      }
    }
  },

  // _trackEvent(category, action, opt_label, opt_value, opt_noninteraction)
  // _gaq.push(['_trackEvent', 'Videos', 'Video Load Time', 'Gone With the Wind', 1]);
  fireGAEvent: function (category, action, label, value, noninteraction) {
    if (typeof _gaq != "undefined") {
      _gaq.push(['_trackEvent', category, action, label, value, noninteraction]);
      if (typeof _ga_mugeda_use_custom != "undefined")
        _gaq.push(['custom._trackEvent', category, action, label, value, noninteraction]);
    }
  },
  fireMUEvent: function (category, action, label, value) {
    if (typeof _mugeda_tracker != 'undefined') {
      _mugeda_tracker.trackEvent({
        'action': action,
        'category': category,
        'label': label,
        'value': value
      });
    }
  }
}
      /**
       * Primary entry point, listens for when MRAID is ready.
       *
       * Sets up an error event handler and populates initial screen data
       *
       * @requires mraid
       */




function mraidReady() {
  var ver = parseFloat(mraid.getVersion());
  if (ver - 0.999 > 0) {
    MugedaMraid.mraidReadyStatus = 1;
    _mrmcp = (typeof _mrmcp == 'undefined') ? {} : _mrmcp;
    var displayMode = _mrmcp['display_mode'];
    if (displayMode) {
      // If display mode is set manually, use custom rule to display/hide close indicator.
      mraid.useCustomClose(true);
      MugedaBehavior.processCloseButton();
    }
    mraid.addEventListener('error', function () {
      //TODO: add error handler
    });

    mraid.addEventListener('stateChange', function () {
      var state = mraid.getState();
      MugedaMraid.setMraidState(state);
    });

    mraid.addEventListener('sizeChange', function () {
      //TODO: add sizeChange handler
    });

  }
  else
    console.log('mraidReady is called, but with no correct version (>= 1.0) supported.');

}

var mraidReadyTimeout;
var mraidTimeOut = 100;
var mraidCounter = 0;
function readyListener() {
  if (typeof (mraid) === 'undefined') {
    // console.log('mraid not found yet');
    mraidCounter++;
    if (mraidCounter < mraidTimeOut)
      mraidReadyTimeout = setTimeout(readyListener, 100);
  } else {
    var state = mraid.getState();
    if (state === 'loading') {
      // console.log ('state is ' + state + '; register ready listener');
      // clearTimeout(mraidReadyTimeout);
      mraid.addEventListener('ready', mraidReady);
    } else {
      // console.log ('mraid state is already default before could register listener for ready')
      mraidReady();
    }
  }
}
readyListener();
// create random session id
try {
  var htmlDoc = document.getElementsByTagName('head').item(0);
  var js = document.createElement('script');
  var jsPath = (_mrmcp['script_sub_path'] || '.') + '/';
  var s = jsPath + 'mraid.js';

  js.setAttribute('type', 'text/javascript');
  js.setAttribute('src', s);
  htmlDoc.appendChild(js);

  js.onload = function () { };
  js.onerror = function () { };
} catch (e) {
  alert(e.toString());
}

// create random session id
function genSessionId(length) {
  var str = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'.split("");
  var time = Number(+new Date()).toString(36);

  for (var i = 0, id = "", len = str.length; i < length; i++) {
    id += str[Math.floor(Math.random() * len)];
  }

  return time + id.toLowerCase();
};

//===========================================
// Mugeda Tracker
//===========================================

Mugeda.playEmbeddedVideo = function (event) {
  var target = event.target;
  var parent = target.parentElement;
  parent.style.display = 'none';
  for (var i = 0; i < parent.parentElement.children.length; i++) {
    parent.parentElement.children[i].setAttribute('contenteditable', 'false');
  }
  var video = parent.previousSibling;
  video.play();

  video.onclick = function () {
    video.controls = video.paused ? false : true;
    video.paused ? video.play() : video.pause();
  }

  // MQQBrowser/6.2 TBS/036215 Safari/537.36 MicroMessenger/6.3.16.64_r75b3df2.780 NetTyp
  var isQQBrowser = navigator.userAgent.match(/mqqbrowser.*tbs/i);
  if (isQQBrowser) {
    var holder = null;
    while (true) {
      parent = parent.parentElement;
      if (parent.className.indexOf('mugeda_richText_content') >= 0) {
        holder = parent.parentElement;
        break;
      }
      else if (parent == document.body)
        break;
    }

    var startTop = holder.scrollTop;
    var div = document.createElement('div');
    div.className = 'qbrowser_workaround';
    div.style.position = 'absolute';
    div.style.width = "1px";
    div.style.height = "1px";
    div.style.left = 0;
    div.style.top = startTop + 'px';
    holder.appendChild(div);

    if (holder) {
      holder.onscroll = function () {
        div.style.top = holder.scrollTop + 'px';
      };
    }
  }
}

// hyx. 数据统计
Mugeda.DataStats = {
  'onEventCallback': null,
  'newsetData': {},
  'init': function (options) {
    // console.log('================entry=================')
    var that = this;
    that.isPreview = location.pathname === "/client/preview_css3.html" && /mugeda.com$/.test(location.host);
    if (that.isPreview) return;

    var guidGenHelper = function () {
      var usp = new URLSearchParams(location.search);
      if (usp.has('view_id')) {
        return usp.get('view_id');
      }

      var num = Math.random().toString().substr(2, 4) + '' + (new Date() - new Date('2012/1/1'));
      return Number(num).toString(36);
    }

    that.viewId = guidGenHelper();
    that.crid = _mrmcp['creative_id'] || Mugeda.data.crid || null;
    that.currentPageId = options.indexPageId;
    that.currentPageName = options.indexPageName;
    that.pageNum = options.indexPageNum;
    that.lockTime = false;
    // static为true的时候, 将不会自动上传数据, 为了避免用户忘记关网页导致一直上传数据, staticSecond用来记录静止的秒数
    that['static'] = false;
    that.staticSecond = 0;

    that.msuid = getMsuid();

    // 可能会被复用
    var startStat = function () {
      if (!that.crid)
        return;

      // 这里的videoHash可能已经存在, 如果开启了视频自动播放, 在执行init前就已经在playVideo里初始化了videoHash, 所以这里判断下
      if (that.isStart) {
        return;
      } else {
        that.isStart = true;
      }

      // 这里的videoHash可能已经存在, 如果开启了视频自动播放, 在执行init前就已经在playVideo里初始化了videoHash, 所以这里判断下
      if (!that.videoHash) {
        that.videoHash = {};
      }
      // 缓存数据, 当真正上传statData时会从这个缓存数据里拿到需要上传的数据
      that.statData = {
        'crid': that.crid,
        'viewId': that.viewId,
        'pages': [],
        'pageNum': that.pageNum
      }

      // 进入页面先单独上报加载时间, loadTime内的statData和this.statData是独立的两个数据
      that.entry({
          type: 'loadTime',
          indexPageId: options.indexPageId,
          indexPageName: options.indexPageName,
          totalPages: options.totalPages
        });

      that.bindTimer();
    }

    // Max 202101 优化localstorage再第二次打开后再进行上传的流程，改为sendBeacon，在页面销毁时自动上传，以试应后端脚本无法长时间保存viewId问题
    document.addEventListener('visibilitychange', function() {
        if (document.visibilityState === 'hidden') {
          that.logData();
        }
    });
    startStat();
  },
  'logData': function () {
    // 检索localstorage
    var that = this;
    var local;
    try {
      local = window.localStorage;
    } catch(e) {
      local = null
    }

    if (local) {
      // 先检索出遗留的key
      var leaveKey = [];
      for (var l = 0; l < local.length; l++) {
        var key = local.key(l);
        if (key.indexOf('leaveData_') > -1) {
          leaveKey.push(key);
        }
      }

      if (leaveKey.length) {
        // 上传遗留的数据, 且清理本地数据库
        for (var i = 0; i < leaveKey.length; i++) {
          var _key = leaveKey[i];
          var localData = localStorage.getItem(_key);
          if (localData) {
            localData = JSON.parse(localData);
            localData.isLeave = true;
            that.uploadData(localData, null, null, function () {
              local.removeItem(_key);
            },true);
          }
        }
      }
    }
  },
  'bindTimer': function () {
    var that = this;
    var startTime = new Date().getTime();
    var count = 0;

    that.second = 1;

    const isCourse = Boolean(getUrlParam('is_course'));

    // 课程内最大静止时间3600秒，其他页面最大静止时间60秒
    const maxStaticSecond = isCourse ? 3600 : 60;

    var fixed = function () {
      // 为了防止计时器误差, 计算出下次setTimeout的准确时间
      count++;
      var offset = new Date().getTime() - (startTime + count * 1000);
      var nextTime = 1000 - offset;
      if (nextTime < 0) nextTime = 0;
      setTimeout(fixed, nextTime);

      // 逻辑开始
      if (that.lockTime) return;
      var currentPage = that.getCurrentPage();
      if (that.staticSecond > maxStaticSecond) {
        that['static'] = true;
      } else {
        that['static'] = false;
      }
      // 如果到达规定时间,则上报数据, 否则每秒都更新数据
      if (that.second >= 10 && !that['static']) {
        if (that.legalTime(currentPage['stayTime'])) {
          currentPage['stayTime'] = currentPage['stayTime'] + 1000;
        }
        var statData = {
          'crid': that.crid,
          'viewId': that.viewId,
          'pages': [
            {
              'id': that.currentPageId,
              'name': that.currentPageName,
              'stayTime': currentPage['stayTime']
            }
          ]
        }

        that.second = 1;
        that.uploadData(statData);
      } else {
        if (that.legalTime(currentPage['stayTime'])) {
          currentPage['stayTime'] = currentPage['stayTime'] + 1000;
        }
        // localStorage.setItem(
        // 	'leaveData_' + that.crid,
        // 	JSON.stringify({
        // 		pages: currentPage,
        // 		crid: that.crid,
        // 		viewId: that.viewId
        // 	})
        // );
        that.updateNewsetData({
          pages: [currentPage],
          crid: that.crid,
          viewId: that.viewId
        });
        that.second++;
      }
      that.staticSecond++;
    }
    setTimeout(fixed, 1000);
  },
  'getCurrentPage': function () {
    var that = this;
    var currentPage;
    var pages = that.statData['pages'];
    for (var i = 0; i < pages.length; i++) {
      if (pages[i].id == that.currentPageId) {
        currentPage = pages[i];
      }
    }
    return currentPage;
  },
  'entry': function (options) {
    // console.log('================entry=================')
    options = options || {};
    if (this.isPreview) return;

    var that = this;
    if (options) {
      var type = options.type;
      // 每次发生行为时, 清空second, 表明用户已经取消静止
      that.staticSecond = 0;
      switch (type) {
        case 'loadTime':
          that.loadTime(options);
          break;
        case 'updatePageTime':
          that.updatePageTime(options);
          break;
        case 'interActions':
          that.interActions(options);
          break;
        case 'playVideo':
          that.playVideo(options);
          break;
        case 'stopVideo':
          that.stopVideo(options);
          break;
      }
    }

    if (options.event && that.onEventCallback) {
      that.onEventCallback({
        'event': options.event
      })
    }
  },
  'legalTime': function (time) {
    // 传入一个毫秒, 验证上传的时间是否合法
    if (time < 0 || time > 86400000) {
      return false;
    } else {
      return true;
    }
  },
  'loadTime': function (options) {
    var that = this;
    var loadTime = ((new Date()).valueOf()) - performance.timing.connectStart;
    var indexPageId = options.indexPageId;

    if (that.legalTime(loadTime)) {
      var statData = {
        'crid': that.crid,
        'viewId': that.viewId,
        'loadTime': loadTime,
        'totalPages': options.totalPages,
        'pages': [
          {
            'id': indexPageId,
            'name': options.indexPageName,
            'stayTime': 0
          }
        ]
      };

      that.uploadData(statData);
    }

    // 更新缓存数据中的首页数据
    that.statData.pages.push({
      'id': indexPageId,
      'name': options.indexPageName,
      'stayTime': 0
    });
  },
  'updatePageTime': function (options) {
    var that = this;
    if (!that.statData) return;
    var pages = that.statData.pages;
    var currentTime = (new Date()).valueOf();
    // 缓存所有statData数据
    if (pages.length) {
      // 判断statData内是否存在即将查看页的数据, 如果不存在则push一个干净的数据
      var isExist = false;
      for (var t = 0; t < pages.length; t++) {
        if (pages[t].id == options.toId) {
          isExist = true;
        }
      }
      if (!isExist) {
        pages.push({
          'name': options.toName,
          'id': options.toId,
          'stayTime': 0
        });
      }
    } else {
      console.log('逻辑错误');
    }

    // 从statData里取出需要上传的数据进行上传
    var uploadData = {
      'crid': that.crid,
      'viewId': that.viewId,
      'pages': [],
      'media': []
    };
    for (var c = 0; c < pages.length; c++) {
      if (pages[c].id == options.fromId || pages[c].id == options.toId) {
        uploadData.pages.push(pages[c]);
      }
    }

    // 更新时间戳标记
    // that.enterTime = (new Date()).valueOf();
    // 更新当前页id
    that.currentPageId = options.toId;

    that.uploadData(uploadData);
  },
  'interActions': function (options) {
    var that = this;

    if (!that.statData) return;
    var pages = that.statData.pages;
    var currentTime = (new Date()).valueOf();
    var uploadData = {
      'crid': that.crid,
      'viewId': that.viewId,
      'pages': [],
      'interactions': [],
      'media': []
    };
    // 交互行为发生时, 先拿到当前页的数据, 修改后插入至需要上传的数据中
    var currentPage = that.getCurrentPage();
    if (currentPage) {
      uploadData.pages.push(currentPage);
      uploadData.interactions = options.data;

      that.uploadData(uploadData)
      // 更新时间戳标记
      // that.enterTime = (new Date()).valueOf();
    } else {
      console.log('逻辑错误,没有拿到当前页数据.');
    }
  },
  'playVideo': function (options) {
    var that = this;
    var id = options.id;
    var videoHash = that.videoHash;

    // 这里判断一下videoHash这个对象存在不存在, 因为有可能视频开启自动播放，导致还没有调用init就调用了playVideo
    if (!videoHash) {
      that.videoHash = {};
      videoHash = that.videoHash;
    }

    if (!videoHash[id]) {
      videoHash[id] = {
        'id': id,
        'viewLength': 0,
        // 'startTime': (new Date()).valueOf(),
        'belong': that.currentPageId,
        'isUpdate': true,
        'video': options.target
      };
    } else {
      // videoHash[id]['startTime'] = (new Date()).valueOf();
      // 每次播放,说明观看时间会发生改变,为了防止不必要的上传, 通过isUpdate来判断
      videoHash[id]['isUpdate'] = true;
    }
  },
  'stopVideo': function (options) {
    var that = this;
    var id = options.id;
    var videoHash = that.videoHash;
    if (videoHash[id]) {
      // 这里直接取video的播放时长更为准确
      // 在视频停止播放的时候记录最终的播放时间。否则的话，视频对象会被销毁，无法获取最后的播放位置。
      var video = videoHash[id]['target'] || document.querySelector('[data-guid="' + (id) + '"] video');
      var pos = Math.floor((video ? video.currentTime : 0) * 1000);
      videoHash[id]['viewLength'] = pos;
    } else {
      console.log('逻辑错误,没有找到视频.');
    }
  },
  'updateNewsetData': function (data) {
    var that = this;
    var newsetData = that.newsetData;
    // dataA为本地拼接的数据, dataB是老的逻辑拦截下来的数据, 在这里对media、page、interactions进行拼接
    var manageData = function (dataA, dataB, mode) {
      var dataAHash = {};
      dataA[mode].map(function (data) {
        dataAHash[data.id] = data;
      });

      var isExist = false;
      for (var q = 0; q < dataB[mode].length; q++) {
        var bMode = dataB[mode][q];
        var data = dataAHash[bMode.id];
        if (data) {
          // 获取视频播放的最长时间
          if (mode == 'media' && data.viewLength !== undefined && bMode.viewLength !== undefined)
            data.viewLength = Math.max(bMode.viewLength, data.viewLength);

          // 获取页面停留的最长时间
          if (data.stayTime !== undefined && bMode.stayTime !== undefined)
            data.stayTime = Math.max(bMode.stayTime, data.stayTime);

          if (bMode.action == 'submitForm') {
            // 表单作为重要的交互行为，需要记录下来。
            data.formCount = (data.formCount || 0) + 1;
          }
        } else {

          dataA[mode].push(bMode);
          dataAHash[bMode.id] = bMode;
          if (bMode.action == 'submitForm') {
            // 表单作为重要的交互行为，需要记录下来。

            // 表单数据涉及数据安全，不应该和统计数据混放。与予删除。
            delete dataAHash[bMode.id].data;
            dataAHash[bMode.id].formCount = (dataAHash[bMode.id].formCount || 0) + 1;
          }
        }
      }
    };

    newsetData.reportTime = new Date().getTime();
    newsetData.mode = "full";
    newsetData.pageNum = that.pageNum;

    if (data.connectionType && !newsetData.connectionType) {
      newsetData.connectionType = data.connectionType;
    }

    if (data.forward && !newsetData.forward) {
      newsetData.forward = data.forward;
    }

    if (data.crid && !newsetData.crid) {
      newsetData.crid = data.crid;
    }

    if (data.msuid && !newsetData.msuid) {
      newsetData.msuid = data.msuid;
    }

    if (data.viewId && !newsetData.viewId) {
      newsetData.viewId = data.viewId;
    }

    if (data.loadTime && !newsetData.loadTime) {
      newsetData.loadTime = data.loadTime;
    }

    if (data.profile) {
      newsetData.profile = data.profile;
    }

    if (data.media && data.media.length) {
      if (newsetData.media && newsetData.media.length) {
        manageData(newsetData, data, 'media');
      } else {
        newsetData.media = data.media;
      }
    }

    if (data.totalPages && data.totalPages.length) {
        if (newsetData.totalPages && newsetData.totalPages.length) {
            manageData(newsetData, data, 'totalPages');
        } else {
            newsetData.totalPages = data.totalPages;
        }
    }

    if (data.pages && data.pages.length) {
      if (newsetData.pages && newsetData.pages.length) {
        manageData(newsetData, data, 'pages');
      } else {
        newsetData.pages = data.pages;
      }
    }

    if (data.interactions && data.interactions.length) {
      if (newsetData.interactions && data.interactions.length) {
        manageData(newsetData, data, 'interactions');
      } else {
        newsetData.interactions = data.interactions;
      }
    }

    // 如果是在课程内打开，加上学生id和课程id
    if (getUrlParam('is_course')) {
      newsetData.user_ref_id = data.msuid;
      newsetData.course_id = getUrlParam('course_id');
      newsetData.class_id = getUrlParam('class_id');
      newsetData.section_id = getUrlParam('section_id');
      newsetData.is_course = getUrlParam('is_course');
    }

    try {
      localStorage.setItem('leaveData_' + that.crid, JSON.stringify(newsetData));
    } catch(e) {
      console.log(e);
    }

    return newsetData;
  },
  'getQueryString': function (name) {
    var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
    var r = window.location.search.substr(1).match(reg);
    if (r != null) return decodeURIComponent(r[2]);
    return null;
  },
  'getNetworkType': function () {
    try {
      var ua = navigator.userAgent;
      var networkStr = ua.match(/NetType\/\w+/) ? ua.match(/NetType\/\w+/)[0] : 'NetType/other';
      networkStr = networkStr.toLowerCase().replace('nettype/', '');
      var networkType;

      if (navigator.connection && navigator.connection.type) {
        return navigator.connection.type;
      }
      ;

      switch (networkStr) {
        case 'wifi':
          networkType = 'wifi';
          break;
        case '4g':
          networkType = '4g';
          break;
        case '3g':
          networkType = '3g';
          break;
        case '3gnet':
          networkType = '3g';
          break;
        case '2g':
          networkType = '2g';
          break;
        default:
          networkType = 'other';
      }
      return networkType;
    } catch (error) {
      return 'other';
    }
  },
  'uploadData': function (data, loadCallback, errorCallback, beforeCallback, isSendBeacon) {
    // isSendBeacon用于页面关闭以后的数据上报
    isSendBeacon = isSendBeacon || false;
    // 预览地址不允许上报数据
    if (!window['_mrmcp']['publish_time']) {
      console.log('非发布作品, 不上报统计。')
      return;
    };
    var that = this;
    var _data = JSON.parse(JSON.stringify(data));
    beforeCallback && beforeCallback();

    that.lockTime = true;
    // var url = '//gitlab.mugeda.com/stats/c.gif';
    // var url = '//cn-stat.mugeda.com:81/stats/c.gif'
    // var url = '//ss.mugeda.com/stats/c.gif';
    var statHostUrl = _mrmcp.stat_host || '';

    var url = statHostUrl || ('//' + that['crid'] + '.stat.mugeda.com/stats/c.gif');

    // statHostUrl 自动带了协议
    if(!statHostUrl && location.protocol === 'file:') {
        url = 'https:' + url
    }

    if (_data.media && _data.media.length === 0) {
      delete data.media;
    }

    // 此处可以对需要上传的data做统一处理,例如所有data都需要添加某个字段
    _data.msuid = that.msuid;
    var profile = {};
    if (that.getQueryString('avatar')) (profile.avatar = that.getQueryString('avatar'));
    if (that.getQueryString('nickname')) (profile.nickname = that.getQueryString('nickname'));
    if (that.getQueryString('openid')) (profile.openid = that.getQueryString('openid'));
    _data.profile = profile;

    // 增加网络信息, 这个接口现在浏览器大部分都不支持, 不支持或报错的传
    _data.connectionType = that.getNetworkType();

    if(getUrlParam('prev')) {
      _data.forward = 'msuid=' + getUrlParam('prev') + '&time=' + getUrlParam('time');
    }

    // 如果是在课程内打开，加上学生id和课程id
    if (!_data.isLeave && getUrlParam('is_course')) {
      _data.user_ref_id = _data.msuid;
      _data.course_id =   getUrlParam('course_id');
      _data.class_id = getUrlParam('class_id');
      _data.section_id = getUrlParam('section_id');
      _data.is_course = getUrlParam('is_course');
    }

    if (_data.crid.length != 24) {
      var splitUrl = _data.crid.split('/');
      if (splitUrl.length) {
        splitUrl.forEach(function (val) {
          if (val.length == 24) {
            _data.crid = val;
          } else {
            return;
          }
        });
      } else {
        return;
      }
    }

    // 自动上报数据时顺便携带视频信息
    var videoHash = that.videoHash;
    if (videoHash) {
      for (key in videoHash) {
        var video = videoHash[key]['target'] || document.querySelector('[data-guid="' + (key) + '"] video');
        var pos = Math.floor(video ? (video.currentTime * 1000) : (videoHash[key].viewLength || 0));
        var videoName = video ? video.getAttribute('data-vname') : '';
        if (videoHash[key]['belong'] == that.currentPageId) {
          if (_data.media) {
             // 对media数据进行非重复校验
             if (_data.media.find(function(itm){ return itm.id === key })) {
              var _selectMediaData = _data.media.find(function(itm){ return itm.id === key })
              if (_selectMediaData.viewLength < pos) {
                _selectMediaData.viewLength = pos
              }
             } else {
              _data.media.push({
                'id': key,
                'viewLength': pos,
                'type': 'video',
                'name': videoName,
                'pageId': that.currentPageId
              })
             }
          } else {
            _data.media = [];
            _data.media.push({
              'id': key,
              'viewLength': pos,
              'type': 'video',
              'name': videoName,
              'pageId': that.currentPageId
            });
          }
        }
      }
    }

    // 这里把最终要上传的数据拦截下来, 本地做拼接处理
    if (!_data.isLeave) {
      _data = that.updateNewsetData(_data);
    }

    // console.log(_data)
    var stringData = JSON.stringify(_data);
    var base64Data = Base64.encode(encodeURIComponent(stringData));
    // console.log('-----------------h5-------------------------')
    console.log(JSON.parse(decodeURIComponent(Base64.decode(base64Data))));
    // cosole.log('--------------------------------------------')
    // var base64Data = encodeURIComponent(Base64.encode(stringData));
    // console.log(JSON.parse(decodeURIComponent(escape(window.atob(base64Data)))));

    var addData = '';
    if (_data.viewId) {
      addData += '&vi=' + _data.viewId;
    }
    if (_data.reportTime) {
      addData += '&tm=' + _data.reportTime;
    }
    if (_data.mode) {
      addData += '&md=' + _data.mode;
    }
    if (_data.crid) {
      addData += '&crid=' + _data.crid;
    }
    var imageUrl = url + '?random=' + Math.random() + '&data=' + base64Data + addData;

    delete _data.isLeave
    var sent = false
    if (isSendBeacon) {
      // sendBeacon 可以在页面关闭后发送请求
      try {
        // 如果已经排队，可以保证被发出去
        var ret = navigator.sendBeacon(imageUrl);
        sent = true
        if (ret) {
            loadCallback && loadCallback();
            that.lockTime = false;
        } else {
            errorCallback && errorCallback();
            that.lockTime = false;
        }
        that.second = 1;
      } catch(e) {

      }
    }

    if(!sent) {
      var image = new Image();
      image.src = imageUrl;
      image.onload = function () {
        loadCallback && loadCallback();
        that.lockTime = false;
      }
      image.onerror = function () {
        errorCallback && errorCallback();
        that.lockTime = false;
      }
      // console.log(data)
      //数据上传完毕后清空计数器, 不需要重复上传
      that.second = 1;
    }
  }
};

Mugeda.Analytics = function (impressionUrl, eventUrl, redirectUrl) {
  var account = '';
  var customVaribles = [];
  var timestamp = 0;
  var clientId = '';
  var pageUrl = window.location.href;
  var argIndex = 0;

  var mrmcpPixel = _mrmcp.impression_pixel ? (_mrmcp.impression_pixel.indexOf("%TRACKURL%") >= 0 ? '' : _mrmcp.impression_pixel) : '';
  window._mrmcp = window._mrmcp || {};
  var statHostUrl = _mrmcp.stat_host || '';

  // impressionUrl = impressionUrl || mrmcpPixel || "//cn-stat.mugeda.com/stats/c.gif";
  impressionUrl = impressionUrl || statHostUrl || mrmcpPixel || ('//' + _mrmcp['creative_id'] + '.stat.mugeda.com/stats/c.gif');
  eventUrl = eventUrl || _mrmcp.eventUrl || impressionUrl;
  redirectUrl = redirectUrl || _mrmcp.redirect_url || "//cn.mugeda.com/tracker.php";

  this.setAccount = function (value) {
    account = value;
  };

  this.setCustomVar = function (idx, key, value) {
    idx = idx || 0;
    value = value || '';

    if (customVaribles[idx])
      delete customVaribles[idx];

    customVaribles[idx] = {};
    customVaribles[idx][key] = value;
  };

  var getParams = function () {

    clientId = getCookie('clientId');
    var content = [];
    for (var i = 0; i < customVaribles.length; i++) {
      for (var j in customVaribles[i]) {
        content[i] = j + "=" + encodeURIComponent(customVaribles[i][j]);
      }
    }
    var cv = content.join("&");
    return cv;
  };

  var gettime = function () {
    return new Date().getTime();
  };

  var getpath = function (url) {
    return url.slice(url.indexOf("/", 8));
  };



  var inEnv = function () {
    var host = location.host,
      pathname = location.pathname,
      reg = /(?:\/animation\/edit)|(?:\/page\/edit)|(?:\/default\/preview\.html)|(?:\/client\/preview(?:_css3)?\.html)/;

    if (!host || reg.test(pathname)) {
      return false;
    }

    return true;
  }


  this.trackPageview = function (opt) {
    if (!inEnv()) {
      return;
    }

    this.startTime = gettime();

    var url = impressionUrl;
    var img = new Image();
    var hasParams = url.indexOf('?');
    var connector = (hasParams != -1) ? "&" : "?";

    var width = _mrmcp['width'] || window._mrmma_width || 0;
    var height = _mrmcp['height'] || window._mrmma_height || 0;
    var title = _mrmcp['title'] || window._mrmma_title;
    // var msct = window._mrmma_var1 ? _mrmma_var1.substring(_mrmma_var1.indexOf('time') + 5) : +new Date();
    var msct = +new Date();
    var host = window.location.host;
    var time = this.startTime;
    var msts = time;
    var msc = width + "x" + height;
    var msp = getpath(window.location.href);
    var mssr = screen.width + "x" + screen.height;
    var mscn = title;


    opt = opt || {};
    opt["msv"] = "0.1.0";
    opt["msa"] = "MU-A001";
    opt["msh"] = host;
    opt["mscs"] = msc;
    opt["msp"] = msp;
    opt["mssr"] = mssr;
    opt["mssi"] = genSessionId(16);
    opt["mscn"] = mscn;
    opt["msct"] = msct;
    opt['crid'] = _mrmcp['creative_id'] || '';

    if(getUrlParam('prev')) {
      opt['forword'] = 'msuid=' + getUrlParam('prev') + '&time=' +  getUrlParam('time');
    }


    for (var name in opt) {
      if (opt.hasOwnProperty(name)) {
        this.setCustomVar(argIndex, name, opt[name]);
        argIndex++;
      }
    }

	var that = this;
	getMsuid(function (msuid) {
		that.setCustomVar(argIndex++, 'msuid', getMsuid());

    var params = getParams();
    // Max 增加第三方存储判断 如果是第三方发布，导出时,
    if(window.mugedaOutsideStorage) {
      params = 'moss=1&' + params;
    }
		params = "md=pv&mst=1&" + params;
		img.src = url + connector + params;
	});
  };

  this.trackEvent = function (opt) {
    if (!inEnv()) {
      return;
    }

    var img = new Image();
    var url = eventUrl;
    var hasParams = url.indexOf('?');
    var connector = (hasParams != -1) ? "&" : "?";
    var params = getParams();
    opt = opt || {};

    var msts = gettime();
    //time diff
    var msetd = msts - this.startTime;
    var msen = encodeURIComponent(opt["action"] || 'submit');
    var msec = encodeURIComponent(opt["categroy"] || 'weika');
    var msel = encodeURIComponent(opt["label"] || '');
    var msev = parseInt(opt["value"]) || 0;

    img.src = url + connector + params + '&mst=2&msts=' + msts + '&msetd=' + msetd + '&msen=' + msen + '&msev=' + msev + '&msec=' + msec + '&msel=' + msel;
  }

};

try {
    // 仅对发布的内容做统计跟踪。
    if(window._mrmcp && window._mrmcp['publish_time']) {
        window._mugeda_tracker = new Mugeda.Analytics();
        _mugeda_tracker.trackPageview();
    }

} catch (e) { }

//===============================================
// create @font-face style to support cloud font
function createFontFaceStyle(fontFamily, fontRequestUrl, guid, requestType, callback, fontNotChanged, options) {
  if (!fontRequestUrl) {
    callback && callback(fontFamily, null);
    return fontFamily;
  };

  options = options || {};

  var id = 'cloudfont-' + fontRequestUrl;
  if (guid) {
    id += '-' + guid;
  }

  var styleNode = document.getElementById(id),
    isAsync = Object.prototype.toString.call(requestType) === '[object Array]'
      && typeof callback === 'function';

  // ==========
  // debug
  var urlParam = function (name) {
    var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
    return results ? results[1] : 0;
  }
  // ==========

  if (fontFamily.toLowerCase() == "simhei") {
    fontFamily = '"Microsoft YaHei", "微软雅黑", SimHei, sans-serif';
  } else if (guid) {
    fontFamily += '-' + guid;
  }

  if (styleNode) {
    var useBlob = isAsync && options.useBlob && styleNode.data;
    if (useBlob) {
      callback(fontFamily, styleNode.data);
      return fontFamily;
    }
    else if (!options.useBlob) {
      if (isAsync) {
        var match = styleNode.textContent.match(/src:url\((.*?)\)/);
        callback(fontFamily, match ? match[1] : null);
      }

      return fontFamily;
    }
  }
  /*
    else if(fontNotChanged)
        return null;
        */

  // ==============
  // debug
  var apiType = urlParam('fontApiType');
  apiType = apiType ? apiType : 3;
  // ==============

  var fontTypes = requestType || ['eot', 'eot', 'woff', 'ttf', 'svg'],
    connector = fontRequestUrl.indexOf('?') > -1 ? '&' : '?',
    v = window.bd_version || urlParam('v') || 0,
    arrTypes = [],
    loadedFlag = requestType && requestType.length,
    requested = 0,
    loaded = 0;

  var createFontFaceNode = function (fontFamily, data) {
    var style = document.querySelector('.cloudfont_' + guid);
    if (style)
      document.head.removeChild(style);
    var styleNode = document.createElement('style'), text;
    var _create = function (text) {
      styleNode.id = id;
      styleNode.className = 'cloudfont_' + guid;

      var textNode = document.createTextNode(text);
      styleNode.type = 'text/css';
      styleNode.data = data;
      styleNode.appendChild(textNode);
      document.head.appendChild(styleNode);
    }

    if (data && data.type != "text/html") {
      var src;
      var reader = new window.FileReader();
      reader.readAsDataURL(data);
      reader.onloadend = function () {
        src = reader.result;
        text = "@font-face {font-family:'" + fontFamily + "';\nsrc:url(" + src + ");}";
        _create(text);
      }
    }
    else if (fontFamily.indexOf('cloud-') != 0) {
      // TODO: 目前这么改就不支持同步云字体渲染了。这个需要再调研一下是否需要同步云字体渲染。
      // text = "@font-face {font-family:'" + fontFamily + "';\nsrc:" + arrTypes[0] + ";\nsrc:" + arrTypes.slice(1).join(",\n") + ";}";
      text = "@font-face {font-family:'" + fontFamily + "';}";
      _create(text);
    }
  }

  var requestFont = function (url) {
    var urlFormData = function (url) {
      var obj = new FormData;
      var arr = url.slice(url.indexOf('?') + 1).split('&');
      arr.forEach(function(item){
        var arr1 = item.split('=');
        if(arr1[0] === 'content') {
          arr1[1] = decodeURI(arr1[1]);
        }
        obj.append(arr1[0], arr1[1]);
      });
      return obj;
    }
    ajaxHelper({
      url: url.split('?')[0],
      cache_ok: true,
      type: 'data',
      method: 'POST',
      formData: urlFormData(url),
      success: function (data) {
        if (++loaded === loadedFlag) {
          if (typeof callback === 'function') {
            createFontFaceNode(fontFamily, data);
            callback(fontFamily, data);
          }
        }
      },
      error: function (re) {
        if (re.status == 414) {
          Mugeda.messageBox(Lang['M_TextTooLong'])
        }

        if (--loadedFlag === 0) {
          callback(false);
          throw 'request font failed';
        }
      }
    });
  }

  for (var i = 0, l = fontTypes.length; i < l; i++) {
    // var requestUrl = fontRequestUrl + connector + 'format=' + fontTypes[i] + '&api_type=' + apiType + '&v=' + v,
    var requestUrl = fontRequestUrl + connector + 'format=' + fontTypes[i] + '&api_type=' + apiType,
      url = 'url(' + requestUrl + ')';

    if (i > 0) {
      var format = fontTypes[i];

      if (fontTypes[i] === 'eot') {
        format = 'embedded-opentype';
      } else if (fontTypes[i] === 'ttf') {
        format = 'truetype';
      }

      url += ' ' + 'format(\'' + format + '\')';
    }

    arrTypes.push(url);

    if (isAsync) { // } && requestType.indexOf(format) > -1) {
      requested++;
      requestFont(requestUrl);
    }
  }

  if (!isAsync) {
    // TODO: 这个是否是drawText需要的？目前还需要吗？
    // createFontFaceNode(fontFamily);
  } else {
    if (requested === 0) {
      throw 'request type invalid';
    }
  }

  return isAsync ? null : fontFamily;
}

Mugeda.messageBox = function (msg, type, callback, options) {
  options = options || {};
  var messageHolder = document.createElement('div');
  messageHolder.id = 'message_holder_' + (new Date().getTime());
  messageHolder.style.display = 'block';
  messageHolder.style.position = 'absolute';


  messageHolder.style.zIndex = 200000;
  var stage = document.querySelector('[data-type="stage"]');
  if(!stage) {
      stage = document.querySelector('.mugedaArticleRoot')
  }
  var domClientWidth = document.documentElement.clientWidth;
  var domClientHeight = document.documentElement.clientHeight;
  var isHorizontal = domClientWidth > domClientHeight;
  // 判断实际显示与舞台显示是否发生rotate
  if ((stage.clientWidth > stage.clientHeight) != (domClientWidth > domClientHeight)  ) {
    messageHolder.style.transformOrigin = "center";
    messageHolder.style.webkitTransform = "rotate(90deg)";
    messageHolder.style.transform = "rotate(90deg)";
    messageHolder.style.width = domClientHeight + 'px';
    messageHolder.style.height = domClientWidth + 'px';
    messageHolder.style.left = (domClientWidth - domClientHeight) / 2  + 'px';
    messageHolder.style.top = (domClientHeight - domClientWidth) / 2  + 'px';
  } else {
    messageHolder.style.width = '100%';
    messageHolder.style.height = '100%';
    messageHolder.style.left = 0;
    messageHolder.style.top = 0;
  }

  var mask = document.createElement('div');
  mask.className = 'messageMask';
  mask.style.display = 'block';
  mask.style.position = 'absolute';
  mask.style.left = 0;
  mask.style.top = 0;
  mask.style.width = '100%';
  mask.style.height = '100%';
  mask.style.backgroundColor = 'rgba(0,0,0,0.5)'
  messageHolder.appendChild(mask);

  var onCancelMessage = function () {
    document.body.removeChild(messageHolder);
    callback && callback(false);
  }

  var onConfirmMessage = function () {
    document.body.removeChild(messageHolder);
    callback && callback(true);
  }

  type = type || 'alert';
  var info = document.createElement('div');
  info.className = 'messageInfo';
  info.style.display = 'block';
  info.style.position = 'absolute';
  if(options.width) {
      info.style.width = options.width + 'px';
  }

  info.innerHTML = '<div class="messageBody">' + msg + '</div><div align="center" class="messageConfirm ' + (type) + '" onclick="onConfirmMessage();">' + (options.okText || '确认') + '</div><div align="center" class="messageCancel ' + (type) + '" onclick="onCancelMessage();">' + (options.cancelText || '取消') + '</div>';
  messageHolder.appendChild(info);

  document.body.appendChild(messageHolder);
  messageHolder.querySelector('.messageConfirm').onclick = onConfirmMessage;
  messageHolder.querySelector('.messageCancel').onclick = onCancelMessage;
  messageHolder.querySelector('.messageMask').onclick = function () {
    info.className = 'messageInfo blinking';
    setTimeout(function () {
      info.className = 'messageInfo';
    }, 800);
  };

  var css = document.getElementById('mugeda_message_styles');
  if (!css) {
    css = document.createElement("style");
    css.type = "text/css";
    css.id = 'mugeda_message_styles';
    css.innerHTML = ".messageBody { padding:32px; background-color: #fff; border-top-left-radius: 4px; border-top-right-radius: 4px; }" +
      ".messageInfo { max-width: 512px; min-width: 256px; margin-left:50%; transform: translate(-50%, -50%); margin-top: "+ (isHorizontal ?domClientHeight/2 : domClientWidth/2) +"px; font-size:14px; border: 4px solid rgba(0,0,0,0); border-radius:8px; line-height: 20px; }" +
      ".messageConfirm, .messageCancel { width: 50%; display: inline-block; height: 48px; line-height: 48px; color: #fff; cursor: pointer; }" +
      ".messageConfirm.alert { width: 100%; }" +
      ".messageCancel.alert { display: none;}" +
      ".messageCancel:active, .messageConfirm:active {-webkit-filter: brightness(115%);}" +
      ".messageConfirm { background-color: #F36523; border-bottom-left-radius: 4px;}" +
      ".messageInfo.blinking{ -webkit-animation: blinking 200ms infinite step-end; animation: blinking 200ms infinite step-end; }" +
      "@-webkit-keyframes blinking {0% {border-color: rgba(255,0,0,0);} 50% {border-color: rgba(255,0,0,0.6);}}" +
      "@keyframes blinking {0% { border-color: rgba(255,0,0,0);} 50% { border-color: rgba(255,0,0,0.6);}}" +
      ".messageCancel { background-color: #999; border-bottom-right-radius: 4px;}";
    document.body.appendChild(css);
  }
}

Mugeda.InstantMessage = (function () {
  var msgDiv;

  function rotateElement(elem, time) {
    /*
        var domPrefixes = 'Webkit Moz O ms Khtml'.split(' '),
              animationstring = 'animation',
              keyframeprefix = '',
              pfx = '';

        for( var i = 0; i < domPrefixes.length; i++ ) {
            if( elem.style[ domPrefixes[i] + 'AnimationName' ] !== undefined ) {
                pfx = domPrefixes[ i ];
                animationstring = pfx + 'Animation';
                keyframeprefix = '-' + pfx.toLowerCase() + '-';
                break;
            }
        }

        elem.style[ animationstring ] = 'rotate '+time+'ms linear infinite';
        */
    /*
        var keyframes = '@' + keyframeprefix + 'keyframes rotate { '+
            'from {' + keyframeprefix + 'transform:rotate( 0deg ) }'+
            'to {' + keyframeprefix + 'transform:rotate( 360deg ) }'+
            '}';

        if( document.styleSheets && document.styleSheets.length ) {
            document.styleSheets[0].insertRule( keyframes, 0 );
        } else {
          var s = document.createElement( 'style' );
          s.innerHTML = keyframes;
          document.getElementsByTagName( 'head' )[ 0 ].appendChild( s );
        }*/
    var animationName = StyleSheetManager.insertKeyframes('from {' + Browser.prefix.css + 'transform:rotate( 0deg ) }' +
      'to {' + Browser.prefix.css + 'transform:rotate( 360deg ) }');
    elem.style.cssText += Browser.prefix.css + 'animation:' + animationName + ' ' + time + 'ms linear infinite;';
  }

  function show(msg) {
    var mask = document.createElement('div');
    var panel = mask.appendChild(document.createElement('div'));
    var spin = panel.appendChild(document.createElement('div'));
    var info = panel.appendChild(document.createElement('div'));

    mask.style.cssText = 'position:fixed;left:0;right:0;top:0;bottom:0;text-align:center;line-height:' + (document.body.clientHeight || document.documentElement.clientHeight) + 'px';
    panel.style.cssText = 'padding-top:10px; line-height:30px;display:inline-block;padding:8px; min-width: 80px; background-color:rgba(0,0,0,0.6);border-radius:4px;"';
    panel.align = 'center';
    spin.style.cssText = 'width: 24px; height: 24px; display: block; border-radius: 50%; border-left: 2px solid #F36523; border-top: 2px solid #F36523; border-right: 2px solid white; border-bottom: 2px solid white; margin: 16px;';
    info.style.cssText = 'text-align:center;color:#fff;font:normal 12px "microsoft yahei";';

    info.innerHTML = msg;
    msgDiv = document.body.appendChild(mask);

    rotateElement(spin, 1200);
  }

  function close() {
    if (msgDiv) {
      msgDiv.parentNode.removeChild(msgDiv);
      msgDiv = null;
    }
  }

  return {
    show: show,
    close: close
  };
})();
