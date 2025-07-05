/**
 * 浏览器兼容性检查和配置系统
 * 确保所有功能在不同浏览器中正常工作
 */

export interface BrowserInfo {
  name: string;
  version: string;
  engine: string;
  platform: string;
  mobile: boolean;
  supported: boolean;
  features: BrowserFeatures;
}

export interface BrowserFeatures {
  fetch: boolean;
  promises: boolean;
  es6: boolean;
  webSockets: boolean;
  localStorage: boolean;
  sessionStorage: boolean;
  indexedDB: boolean;
  serviceWorker: boolean;
  webWorkers: boolean;
  css3: boolean;
  flexbox: boolean;
  grid: boolean;
  customElements: boolean;
  shadowDOM: boolean;
}

export interface CompatibilityConfig {
  minVersions: {
    chrome: number;
    firefox: number;
    safari: number;
    edge: number;
    ie: number;
  };
  polyfills: string[];
  fallbacks: {
    [feature: string]: string;
  };
}

/**
 * 浏览器兼容性管理器
 */
export class BrowserCompatibilityManager {
  private config: CompatibilityConfig;
  private currentBrowser: BrowserInfo | null = null;

  constructor(config?: Partial<CompatibilityConfig>) {
    this.config = {
      minVersions: {
        chrome: 60,
        firefox: 55,
        safari: 12,
        edge: 79,
        ie: 11,
      },
      polyfills: [
        'core-js/stable',
        'regenerator-runtime/runtime',
      ],
      fallbacks: {
        fetch: 'XMLHttpRequest',
        promises: 'callbacks',
        es6: 'es5',
        webSockets: 'polling',
        flexbox: 'float',
        grid: 'flexbox',
      },
      ...config,
    };
  }

  /**
   * 检测当前浏览器信息
   */
  detectBrowser(): BrowserInfo {
    if (typeof window === 'undefined') {
      // 服务端环境
      return this.getServerSideBrowserInfo();
    }

    const userAgent = navigator.userAgent;
    const browserInfo = this.parseBrowserInfo(userAgent);
    const features = this.detectFeatures();
    
    const tempBrowser: BrowserInfo = {
      ...browserInfo,
      features,
      supported: false, // 临时值，稍后会被正确设置
    };
    
    this.currentBrowser = {
      ...tempBrowser,
      supported: this.isBrowserSupported(tempBrowser),
    };

    return this.currentBrowser;
  }

  /**
   * 检查浏览器是否支持
   */
  isBrowserSupported(browser?: BrowserInfo): boolean {
    const info = browser || this.currentBrowser;
    if (!info) {return false;}

    const minVersion = this.config.minVersions[info.name.toLowerCase() as keyof typeof this.config.minVersions];
    if (!minVersion) {return true;} // 未知浏览器默认支持

    return parseFloat(info.version) >= minVersion;
  }

  /**
   * 获取需要的polyfills
   */
  getRequiredPolyfills(): string[] {
    if (!this.currentBrowser) {
      this.detectBrowser();
    }

    const polyfills: string[] = [];
    const features = this.currentBrowser?.features;

    if (!features) {return this.config.polyfills;}

    // 根据缺失的功能添加polyfills
    if (!features.fetch) {
      polyfills.push('whatwg-fetch');
    }
    if (!features.promises) {
      polyfills.push('es6-promise');
    }
    if (!features.es6) {
      polyfills.push('core-js/stable');
    }
    if (!features.webSockets) {
      polyfills.push('sockjs-client');
    }

    return [...new Set([...polyfills, ...this.config.polyfills])];
  }

  /**
   * 获取功能回退方案
   */
  getFallbackStrategy(feature: string): string | null {
    return this.config.fallbacks[feature] || null;
  }

  /**
   * 生成兼容性报告
   */
  generateCompatibilityReport(): {
    browser: BrowserInfo;
    supported: boolean;
    missingFeatures: string[];
    recommendedPolyfills: string[];
    warnings: string[];
  } {
    if (!this.currentBrowser) {
      this.detectBrowser();
    }

    const browser = this.currentBrowser!;
    const missingFeatures = this.getMissingFeatures(browser.features);
    const warnings = this.generateWarnings(browser);

    return {
      browser,
      supported: browser.supported,
      missingFeatures,
      recommendedPolyfills: this.getRequiredPolyfills(),
      warnings,
    };
  }

  /**
   * 应用兼容性修复
   */
  applyCompatibilityFixes(): void {
    if (typeof window === 'undefined') {return;}

    const polyfills = this.getRequiredPolyfills();
    
    // 动态加载polyfills
    this.loadPolyfills(polyfills);
    
    // 应用CSS兼容性修复
    this.applyCSSFixes();
    
    // 应用JavaScript兼容性修复
    this.applyJSFixes();
  }

  /**
   * 获取CORS配置（兼容性优化）
   */
  getCompatibleCORSConfig(): {
    credentials: 'include' | 'same-origin' | 'omit';
    headers: string[];
    methods: string[];
  } {
    const browser = this.currentBrowser || this.detectBrowser();
    
    // 针对不同浏览器优化CORS配置
    if (browser.name.toLowerCase() === 'ie' && parseFloat(browser.version) < 12) {
      return {
        credentials: 'same-origin', // IE11不完全支持include
        headers: [
          'Content-Type',
          'Authorization',
          'X-Requested-With',
        ],
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
      };
    }

    return {
      credentials: 'include',
      headers: [
        'Content-Type',
        'Authorization',
        'X-Api-Key',
        'X-Request-ID',
        'X-Session-ID',
        'Accept',
        'Origin',
        'User-Agent',
      ],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    };
  }

  /**
   * 获取安全头部配置（兼容性优化）
   */
  getCompatibleSecurityHeaders(): Record<string, string> {
    const browser = this.currentBrowser || this.detectBrowser();
    const headers: Record<string, string> = {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    };

    // 根据浏览器版本调整CSP
    if (this.supportsCsp(browser)) {
      const cspDirectives = [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline'", // 为了兼容性允许内联脚本
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com", // 允许Google Fonts
        "img-src 'self' data: https:",
        "font-src 'self' data: https://fonts.gstatic.com", // 允许Google Fonts字体文件
        "connect-src 'self' https:",
        "media-src 'self' https://*.supabase.co https://commondatastorage.googleapis.com https://www.w3schools.com https://html5demos.com",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ];

      // 现代浏览器支持更多指令
      if (this.supportsModernCsp(browser)) {
        cspDirectives.push("frame-ancestors 'none'");
        cspDirectives.push('upgrade-insecure-requests');
      }

      headers['Content-Security-Policy'] = cspDirectives.join('; ');
    }

    // XSS保护（某些现代浏览器已弃用，但为了兼容性保留）
    if (browser.name.toLowerCase() !== 'chrome' || parseFloat(browser.version) < 78) {
      headers['X-XSS-Protection'] = '1; mode=block';
    }

    // HSTS（仅HTTPS环境）
    if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
      headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains';
    }

    return headers;
  }

  // 私有方法

  private parseBrowserInfo(userAgent: string): Omit<BrowserInfo, 'features' | 'supported'> {
    // 简化的浏览器检测
    const browsers = [
      { name: 'Chrome', pattern: /Chrome\/(\d+)/ },
      { name: 'Firefox', pattern: /Firefox\/(\d+)/ },
      { name: 'Safari', pattern: /Version\/(\d+).*Safari/ },
      { name: 'Edge', pattern: /Edg\/(\d+)/ },
      { name: 'IE', pattern: /MSIE (\d+)|Trident.*rv:(\d+)/ },
    ];

    for (const browser of browsers) {
      const match = userAgent.match(browser.pattern);
      if (match) {
        return {
          name: browser.name,
          version: match[1] || match[2] || '0',
          engine: this.getEngine(browser.name),
          platform: this.getPlatform(userAgent),
          mobile: /Mobile|Android|iPhone|iPad/.test(userAgent),
        };
      }
    }

    return {
      name: 'Unknown',
      version: '0',
      engine: 'Unknown',
      platform: 'Unknown',
      mobile: false,
    };
  }

  private detectFeatures(): BrowserFeatures {
    if (typeof window === 'undefined') {
      return this.getDefaultFeatures();
    }

    return {
      fetch: typeof fetch !== 'undefined',
      promises: typeof Promise !== 'undefined',
      es6: this.supportsES6(),
      webSockets: typeof WebSocket !== 'undefined',
      localStorage: this.supportsLocalStorage(),
      sessionStorage: this.supportsSessionStorage(),
      indexedDB: typeof indexedDB !== 'undefined',
      serviceWorker: 'serviceWorker' in navigator,
      webWorkers: typeof Worker !== 'undefined',
      css3: this.supportsCSS3(),
      flexbox: this.supportsFlexbox(),
      grid: this.supportsGrid(),
      customElements: typeof customElements !== 'undefined',
      shadowDOM: typeof ShadowRoot !== 'undefined',
    };
  }

  private supportsES6(): boolean {
    try {
      return typeof Symbol !== 'undefined' && 
             typeof Map !== 'undefined' && 
             typeof Set !== 'undefined';
    } catch {
      return false;
    }
  }

  private supportsLocalStorage(): boolean {
    try {
      const test = 'test';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  private supportsSessionStorage(): boolean {
    try {
      const test = 'test';
      sessionStorage.setItem(test, test);
      sessionStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  private supportsCSS3(): boolean {
    if (typeof document === 'undefined') {return false;}
    const div = document.createElement('div');
    return 'borderRadius' in div.style;
  }

  private supportsFlexbox(): boolean {
    if (typeof document === 'undefined') {return false;}
    const div = document.createElement('div');
    return 'flexBasis' in div.style || 'webkitFlexBasis' in div.style;
  }

  private supportsGrid(): boolean {
    if (typeof document === 'undefined') {return false;}
    const div = document.createElement('div');
    return 'gridTemplateColumns' in div.style;
  }

  private supportsCsp(browser: BrowserInfo): boolean {
    const name = browser.name.toLowerCase();
    const version = parseFloat(browser.version);
    
    if (name === 'chrome') {return version >= 25;}
    if (name === 'firefox') {return version >= 23;}
    if (name === 'safari') {return version >= 7;}
    if (name === 'edge') {return version >= 12;}
    if (name === 'ie') {return false;} // IE不支持CSP
    
    return true; // 默认支持
  }

  private supportsModernCsp(browser: BrowserInfo): boolean {
    const name = browser.name.toLowerCase();
    const version = parseFloat(browser.version);
    
    if (name === 'chrome') {return version >= 40;}
    if (name === 'firefox') {return version >= 31;}
    if (name === 'safari') {return version >= 10;}
    if (name === 'edge') {return version >= 15;}
    
    return false;
  }

  private getEngine(browserName: string): string {
    const engines: Record<string, string> = {
      'Chrome': 'Blink',
      'Firefox': 'Gecko',
      'Safari': 'WebKit',
      'Edge': 'Blink',
      'IE': 'Trident',
    };
    return engines[browserName] || 'Unknown';
  }

  private getPlatform(userAgent: string): string {
    if (/Windows/.test(userAgent)) {return 'Windows';}
    if (/Mac/.test(userAgent)) {return 'macOS';}
    if (/Linux/.test(userAgent)) {return 'Linux';}
    if (/Android/.test(userAgent)) {return 'Android';}
    if (/iPhone|iPad/.test(userAgent)) {return 'iOS';}
    return 'Unknown';
  }

  private getServerSideBrowserInfo(): BrowserInfo {
    return {
      name: 'Server',
      version: '1.0',
      engine: 'Node.js',
      platform: 'Server',
      mobile: false,
      supported: true,
      features: this.getDefaultFeatures(),
    };
  }

  private getDefaultFeatures(): BrowserFeatures {
    return {
      fetch: true,
      promises: true,
      es6: true,
      webSockets: true,
      localStorage: true,
      sessionStorage: true,
      indexedDB: true,
      serviceWorker: false,
      webWorkers: true,
      css3: true,
      flexbox: true,
      grid: true,
      customElements: false,
      shadowDOM: false,
    };
  }

  private getMissingFeatures(features: BrowserFeatures): string[] {
    const missing: string[] = [];
    
    Object.entries(features).forEach(([feature, supported]) => {
      if (!supported) {
        missing.push(feature);
      }
    });
    
    return missing;
  }

  private generateWarnings(browser: BrowserInfo): string[] {
    const warnings: string[] = [];
    
    if (!browser.supported) {
      warnings.push(`浏览器版本过低：${browser.name} ${browser.version}`);
    }
    
    if (browser.name.toLowerCase() === 'ie') {
      warnings.push('Internet Explorer支持有限，建议使用现代浏览器');
    }
    
    if (!browser.features.fetch) {
      warnings.push('不支持Fetch API，将使用XMLHttpRequest');
    }
    
    if (!browser.features.promises) {
      warnings.push('不支持Promise，将使用回调函数');
    }
    
    return warnings;
  }

  private loadPolyfills(polyfills: string[]): void {
    // 在实际应用中，这里会动态加载polyfills
    console.log('需要加载的polyfills:', polyfills);
  }

  private applyCSSFixes(): void {
    if (typeof document === 'undefined') {return;}
    
    // 添加CSS兼容性修复
    const style = document.createElement('style');
    style.textContent = `
      /* Flexbox兼容性 */
      .flex {
        display: -webkit-box;
        display: -webkit-flex;
        display: -ms-flexbox;
        display: flex;
      }
      
      /* Grid兼容性 */
      .grid {
        display: -ms-grid;
        display: grid;
      }
    `;
    document.head.appendChild(style);
  }

  private applyJSFixes(): void {
    // JavaScript兼容性修复
    if (typeof window === 'undefined') {return;}
    
    // 添加必要的polyfills和修复
    if (!window.fetch) {
      console.warn('Fetch API不可用，请添加polyfill');
    }
  }
}

// 全局浏览器兼容性管理器实例
export const browserCompatibility = new BrowserCompatibilityManager();
