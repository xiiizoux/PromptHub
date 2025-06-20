/**
 * 浏览器兼容性检查API端点
 * 提供浏览器兼容性检测和建议
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { browserCompatibility } from '../../lib/browser-compatibility';
import { withSecurity } from '../../middleware/security';

interface CompatibilityCheckRequest {
  userAgent?: string;
  features?: string[];
}

interface CompatibilityCheckResponse {
  success: boolean;
  data?: {
    browser: any;
    supported: boolean;
    missingFeatures: string[];
    recommendedPolyfills: string[];
    warnings: string[];
    corsConfig: any;
    securityHeaders: Record<string, string>;
    recommendations: string[];
  };
  message?: string;
  timestamp: string;
}

async function handler(req: NextApiRequest, res: NextApiResponse<CompatibilityCheckResponse>) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: '方法不被允许',
      timestamp: new Date().toISOString()
    });
  }

  try {
    // 获取用户代理字符串
    const userAgent = req.headers['user-agent'] || 'unknown';
    
    // 模拟浏览器检测（在服务端环境中）
    const mockWindow = {
      navigator: { userAgent },
      location: { protocol: 'https:' }
    };
    
    // 检测浏览器信息
    const report = browserCompatibility.generateCompatibilityReport();
    const corsConfig = browserCompatibility.getCompatibleCORSConfig();
    const securityHeaders = browserCompatibility.getCompatibleSecurityHeaders();
    
    // 生成建议
    const recommendations = generateRecommendations(report);

    return res.status(200).json({
      success: true,
      data: {
        browser: report.browser,
        supported: report.supported,
        missingFeatures: report.missingFeatures,
        recommendedPolyfills: report.recommendedPolyfills,
        warnings: report.warnings,
        corsConfig,
        securityHeaders,
        recommendations
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('兼容性检查失败:', error);
    return res.status(500).json({
      success: false,
      message: '兼容性检查失败',
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * 生成兼容性建议
 */
function generateRecommendations(report: any): string[] {
  const recommendations: string[] = [];
  
  if (!report.supported) {
    recommendations.push('建议升级到支持的浏览器版本');
    recommendations.push('或者使用现代浏览器如Chrome、Firefox、Safari或Edge');
  }
  
  if (report.missingFeatures.includes('fetch')) {
    recommendations.push('添加fetch polyfill以支持现代HTTP请求');
  }
  
  if (report.missingFeatures.includes('promises')) {
    recommendations.push('添加Promise polyfill以支持异步操作');
  }
  
  if (report.missingFeatures.includes('es6')) {
    recommendations.push('使用Babel转译ES6+代码以提高兼容性');
  }
  
  if (report.missingFeatures.includes('flexbox')) {
    recommendations.push('使用CSS Grid或float布局作为flexbox的回退方案');
  }
  
  if (report.missingFeatures.includes('webSockets')) {
    recommendations.push('使用Socket.IO或SockJS作为WebSocket的回退方案');
  }
  
  if (report.browser.name.toLowerCase() === 'ie') {
    recommendations.push('Internet Explorer支持有限，建议提示用户升级浏览器');
    recommendations.push('考虑使用专门的IE兼容性库');
  }
  
  if (report.browser.mobile) {
    recommendations.push('确保移动端触摸事件和视口配置正确');
    recommendations.push('优化移动端性能和用户体验');
  }
  
  return recommendations;
}

export default withSecurity(handler);
