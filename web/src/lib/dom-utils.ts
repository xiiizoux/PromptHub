/**
 * DOM安全访问工具
 * 防止在服务端渲染时访问DOM对象导致的错误
 */

// 安全地检查是否在浏览器环境
export const isBrowser = (): boolean => {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
};

// 安全地获取localStorage
export const safeLocalStorage = {
  getItem: (key: string): string | null => {
    try {
      if (!isBrowser()) return null;
      return localStorage.getItem(key);
    } catch (error) {
      console.warn('无法访问localStorage:', error);
      return null;
    }
  },
  
  setItem: (key: string, value: string): boolean => {
    try {
      if (!isBrowser()) return false;
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.warn('无法写入localStorage:', error);
      return false;
    }
  },
  
  removeItem: (key: string): boolean => {
    try {
      if (!isBrowser()) return false;
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.warn('无法删除localStorage项:', error);
      return false;
    }
  }
};

// 安全地访问document
export const safeDocument = {
  querySelector: (selector: string): Element | null => {
    try {
      if (!isBrowser()) return null;
      return document.querySelector(selector);
    } catch (error) {
      console.warn('无法查询DOM元素:', error);
      return null;
    }
  },
  
  addEventListener: (type: string, listener: any): boolean => {
    try {
      if (!isBrowser()) return false;
      document.addEventListener(type, listener);
      return true;
    } catch (error) {
      console.warn('无法添加事件监听器:', error);
      return false;
    }
  },
  
  removeEventListener: (type: string, listener: any): boolean => {
    try {
      if (!isBrowser()) return false;
      document.removeEventListener(type, listener);
      return true;
    } catch (error) {
      console.warn('无法移除事件监听器:', error);
      return false;
    }
  }
};

// 安全地访问window对象的属性
export const safeWindow = {
  getProperty: (property: string): any => {
    try {
      if (!isBrowser()) return undefined;
      return (window as any)[property];
    } catch (error) {
      console.warn(`无法访问window.${property}:`, error);
      return undefined;
    }
  }
};

// 延迟执行，确保DOM已加载
export const afterDOMReady = (callback: () => void, delay: number = 100): void => {
  if (!isBrowser()) return;
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(callback, delay);
    });
  } else {
    setTimeout(callback, delay);
  }
}; 