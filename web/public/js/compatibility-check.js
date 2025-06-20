/**
 * 客户端浏览器兼容性检测脚本
 * 在页面加载时自动检测浏览器兼容性并应用必要的修复
 */

(function() {
  'use strict';

  // 兼容性检测结果
  var compatibilityResult = {
    browser: {},
    features: {},
    supported: true,
    warnings: [],
    polyfillsNeeded: []
  };

  /**
   * 检测浏览器信息
   */
  function detectBrowser() {
    var userAgent = navigator.userAgent;
    var browser = {
      name: 'Unknown',
      version: '0',
      mobile: /Mobile|Android|iPhone|iPad/.test(userAgent)
    };

    // Chrome
    var chromeMatch = userAgent.match(/Chrome\/(\d+)/);
    if (chromeMatch) {
      browser.name = 'Chrome';
      browser.version = chromeMatch[1];
    }
    // Firefox
    else if (userAgent.indexOf('Firefox') > -1) {
      var firefoxMatch = userAgent.match(/Firefox\/(\d+)/);
      browser.name = 'Firefox';
      browser.version = firefoxMatch ? firefoxMatch[1] : '0';
    }
    // Safari
    else if (userAgent.indexOf('Safari') > -1 && userAgent.indexOf('Chrome') === -1) {
      var safariMatch = userAgent.match(/Version\/(\d+)/);
      browser.name = 'Safari';
      browser.version = safariMatch ? safariMatch[1] : '0';
    }
    // Edge
    else if (userAgent.indexOf('Edg') > -1) {
      var edgeMatch = userAgent.match(/Edg\/(\d+)/);
      browser.name = 'Edge';
      browser.version = edgeMatch ? edgeMatch[1] : '0';
    }
    // IE
    else if (userAgent.indexOf('MSIE') > -1 || userAgent.indexOf('Trident') > -1) {
      var ieMatch = userAgent.match(/MSIE (\d+)|rv:(\d+)/);
      browser.name = 'IE';
      browser.version = ieMatch ? (ieMatch[1] || ieMatch[2]) : '0';
    }

    return browser;
  }

  /**
   * 检测浏览器功能支持
   */
  function detectFeatures() {
    var features = {};

    // 基础功能检测
    features.fetch = typeof fetch !== 'undefined';
    features.promises = typeof Promise !== 'undefined';
    features.localStorage = (function() {
      try {
        var test = 'test';
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        return true;
      } catch(e) {
        return false;
      }
    })();
    features.sessionStorage = (function() {
      try {
        var test = 'test';
        sessionStorage.setItem(test, test);
        sessionStorage.removeItem(test);
        return true;
      } catch(e) {
        return false;
      }
    })();
    features.webSockets = typeof WebSocket !== 'undefined';
    features.webWorkers = typeof Worker !== 'undefined';
    features.serviceWorker = 'serviceWorker' in navigator;
    features.indexedDB = typeof indexedDB !== 'undefined';

    // ES6功能检测
    features.es6 = (function() {
      try {
        return typeof Symbol !== 'undefined' && 
               typeof Map !== 'undefined' && 
               typeof Set !== 'undefined';
      } catch(e) {
        return false;
      }
    })();

    // CSS功能检测
    features.flexbox = (function() {
      var div = document.createElement('div');
      return 'flexBasis' in div.style || 'webkitFlexBasis' in div.style;
    })();

    features.grid = (function() {
      var div = document.createElement('div');
      return 'gridTemplateColumns' in div.style;
    })();

    features.css3 = (function() {
      var div = document.createElement('div');
      return 'borderRadius' in div.style;
    })();

    return features;
  }

  /**
   * 检查浏览器是否受支持
   */
  function isBrowserSupported(browser) {
    var minVersions = {
      'Chrome': 60,
      'Firefox': 55,
      'Safari': 12,
      'Edge': 79,
      'IE': 11
    };

    var minVersion = minVersions[browser.name];
    if (!minVersion) return true; // 未知浏览器默认支持

    return parseInt(browser.version) >= minVersion;
  }

  /**
   * 生成警告信息
   */
  function generateWarnings(browser, features) {
    var warnings = [];

    if (!isBrowserSupported(browser)) {
      warnings.push('浏览器版本过低，可能影响功能正常使用');
    }

    if (browser.name === 'IE') {
      warnings.push('Internet Explorer支持有限，建议使用现代浏览器');
    }

    if (!features.fetch) {
      warnings.push('不支持Fetch API，将使用XMLHttpRequest');
    }

    if (!features.promises) {
      warnings.push('不支持Promise，某些功能可能无法正常工作');
    }

    if (!features.localStorage) {
      warnings.push('不支持本地存储，无法保存用户设置');
    }

    if (!features.flexbox) {
      warnings.push('不支持Flexbox布局，页面样式可能异常');
    }

    return warnings;
  }

  /**
   * 应用兼容性修复
   */
  function applyCompatibilityFixes(browser, features) {
    // CSS兼容性修复
    if (!features.flexbox) {
      addCSSFallback();
    }

    // JavaScript兼容性修复
    if (!features.promises && typeof Promise === 'undefined') {
      loadPolyfill('https://cdn.jsdelivr.net/npm/es6-promise@4/dist/es6-promise.auto.min.js');
    }

    if (!features.fetch && typeof fetch === 'undefined') {
      loadPolyfill('https://cdn.jsdelivr.net/npm/whatwg-fetch@3/dist/fetch.umd.js');
    }

    // IE特殊处理
    if (browser.name === 'IE') {
      applyIEFixes();
    }
  }

  /**
   * 添加CSS回退样式
   */
  function addCSSFallback() {
    var style = document.createElement('style');
    style.textContent = [
      '/* Flexbox 回退 */',
      '.flex-fallback { display: table; width: 100%; }',
      '.flex-fallback > * { display: table-cell; vertical-align: top; }',
      '',
      '/* Grid 回退 */',
      '.grid-fallback { display: block; }',
      '.grid-fallback::after { content: ""; display: table; clear: both; }',
      '.grid-fallback > * { float: left; }'
    ].join('\n');
    
    document.head.appendChild(style);
  }

  /**
   * 加载polyfill
   */
  function loadPolyfill(url) {
    var script = document.createElement('script');
    script.src = url;
    script.async = true;
    document.head.appendChild(script);
  }

  /**
   * IE特殊修复
   */
  function applyIEFixes() {
    // 添加IE兼容性样式
    var ieStyle = document.createElement('style');
    ieStyle.textContent = [
      '/* IE兼容性修复 */',
      'main { display: block; }',
      'article, aside, details, figcaption, figure, footer, header, hgroup, nav, section { display: block; }',
      'audio, canvas, video { display: inline-block; *display: inline; *zoom: 1; }'
    ].join('\n');
    
    document.head.appendChild(ieStyle);

    // 加载IE polyfills
    loadPolyfill('https://cdn.jsdelivr.net/npm/html5shiv@3/dist/html5shiv.min.js');
  }

  /**
   * 显示兼容性警告
   */
  function showCompatibilityWarning(warnings) {
    if (warnings.length === 0) return;

    var warningDiv = document.createElement('div');
    warningDiv.id = 'browser-compatibility-warning';
    warningDiv.style.cssText = [
      'position: fixed',
      'top: 0',
      'left: 0',
      'right: 0',
      'background: #fff3cd',
      'border-bottom: 1px solid #ffeaa7',
      'padding: 10px',
      'text-align: center',
      'z-index: 9999',
      'font-family: Arial, sans-serif',
      'font-size: 14px',
      'color: #856404'
    ].join(';');

    var message = '浏览器兼容性提醒：' + warnings.join('；');
    var closeButton = '<button onclick="this.parentNode.style.display=\'none\'" style="float: right; background: none; border: none; font-size: 16px; cursor: pointer;">&times;</button>';
    
    warningDiv.innerHTML = closeButton + message;
    document.body.insertBefore(warningDiv, document.body.firstChild);

    // 5秒后自动隐藏
    setTimeout(function() {
      if (warningDiv.parentNode) {
        warningDiv.style.display = 'none';
      }
    }, 5000);
  }

  /**
   * 主检测函数
   */
  function performCompatibilityCheck() {
    var browser = detectBrowser();
    var features = detectFeatures();
    var supported = isBrowserSupported(browser);
    var warnings = generateWarnings(browser, features);

    compatibilityResult = {
      browser: browser,
      features: features,
      supported: supported,
      warnings: warnings
    };

    // 应用兼容性修复
    applyCompatibilityFixes(browser, features);

    // 显示警告（如果需要）
    if (warnings.length > 0) {
      showCompatibilityWarning(warnings);
    }

    // 在控制台输出检测结果
    console.log('浏览器兼容性检测结果:', compatibilityResult);

    return compatibilityResult;
  }

  /**
   * 导出到全局
   */
  window.BrowserCompatibility = {
    check: performCompatibilityCheck,
    getResult: function() { return compatibilityResult; },
    isSupported: function() { return compatibilityResult.supported; },
    getWarnings: function() { return compatibilityResult.warnings; }
  };

  // 页面加载完成后自动执行检测
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', performCompatibilityCheck);
  } else {
    performCompatibilityCheck();
  }

})();
