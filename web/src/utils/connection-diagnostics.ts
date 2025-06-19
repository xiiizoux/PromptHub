/**
 * 连接诊断工具
 * 用于诊断网络连接和Supabase连接问题
 */

interface DiagnosticResult {
  test: string;
  success: boolean;
  duration: number;
  error?: string;
  details?: any;
}

interface DiagnosticReport {
  timestamp: string;
  overall: 'pass' | 'warning' | 'fail';
  results: DiagnosticResult[];
  recommendations: string[];
}

export class ConnectionDiagnostics {
  
  /**
   * 运行完整的连接诊断
   */
  static async runFullDiagnostics(): Promise<DiagnosticReport> {
    console.log('🔍 开始运行连接诊断...');
    
    const results: DiagnosticResult[] = [];
    const recommendations: string[] = [];
    
    // 测试1: 基础网络连接
    results.push(await this.testBasicNetworkConnection());
    
    // 测试2: API健康检查
    results.push(await this.testAPIHealthCheck());
    
    // 测试3: Supabase连接
    results.push(await this.testSupabaseConnection());
    
    // 测试4: 认证token获取
    results.push(await this.testAuthTokenRetrieval());
    
    // 测试5: 创建提示词API
    results.push(await this.testCreatePromptAPI());
    
    // 分析结果并生成建议
    const failedTests = results.filter(r => !r.success);
    const slowTests = results.filter(r => r.success && r.duration > 5000);
    
    let overall: 'pass' | 'warning' | 'fail' = 'pass';
    
    if (failedTests.length > 0) {
      overall = 'fail';
      recommendations.push('发现连接问题，请检查网络状态');
      
      if (failedTests.some(t => t.test.includes('网络'))) {
        recommendations.push('基础网络连接失败，请检查网络设置');
      }
      
      if (failedTests.some(t => t.test.includes('Supabase'))) {
        recommendations.push('Supabase连接失败，请检查数据库配置');
      }
      
      if (failedTests.some(t => t.test.includes('认证'))) {
        recommendations.push('认证token获取失败，请重新登录');
      }
    } else if (slowTests.length > 0) {
      overall = 'warning';
      recommendations.push('连接较慢，可能影响用户体验');
    }
    
    if (slowTests.length === 0 && failedTests.length === 0) {
      recommendations.push('所有连接测试正常');
    }
    
    const report: DiagnosticReport = {
      timestamp: new Date().toISOString(),
      overall,
      results,
      recommendations
    };
    
    console.log('🔍 诊断完成:', report);
    return report;
  }
  
  /**
   * 测试基础网络连接
   */
  private static async testBasicNetworkConnection(): Promise<DiagnosticResult> {
    const startTime = Date.now();
    
    try {
      // 检查navigator.onLine
      if (typeof window !== 'undefined' && !navigator.onLine) {
        return {
          test: '基础网络连接',
          success: false,
          duration: Date.now() - startTime,
          error: '浏览器报告网络离线'
        };
      }
      
      // 尝试连接到一个可靠的外部服务
      const response = await fetch('https://httpbin.org/get', {
        method: 'GET',
        signal: AbortSignal.timeout(10000)
      });
      
      return {
        test: '基础网络连接',
        success: response.ok,
        duration: Date.now() - startTime,
        details: { status: response.status }
      };
    } catch (error: any) {
      return {
        test: '基础网络连接',
        success: false,
        duration: Date.now() - startTime,
        error: error.message
      };
    }
  }
  
  /**
   * 测试API健康检查
   */
  private static async testAPIHealthCheck(): Promise<DiagnosticResult> {
    const startTime = Date.now();
    
    try {
      const response = await fetch('/api/health', {
        method: 'GET',
        signal: AbortSignal.timeout(10000)
      });
      
      const data = await response.json();
      
      return {
        test: 'API健康检查',
        success: response.ok && data.status === 'ok',
        duration: Date.now() - startTime,
        details: data
      };
    } catch (error: any) {
      return {
        test: 'API健康检查',
        success: false,
        duration: Date.now() - startTime,
        error: error.message
      };
    }
  }
  
  /**
   * 测试Supabase连接
   */
  private static async testSupabaseConnection(): Promise<DiagnosticResult> {
    const startTime = Date.now();
    
    try {
      const { supabase } = await import('@/lib/supabase');
      
      // 简单的查询测试
      const { data, error } = await supabase
        .from('categories')
        .select('count')
        .limit(1);
      
      if (error && !error.message.includes('permission')) {
        throw error;
      }
      
      return {
        test: 'Supabase连接',
        success: true,
        duration: Date.now() - startTime,
        details: { hasData: !!data }
      };
    } catch (error: any) {
      return {
        test: 'Supabase连接',
        success: false,
        duration: Date.now() - startTime,
        error: error.message
      };
    }
  }
  
  /**
   * 测试认证token获取
   */
  private static async testAuthTokenRetrieval(): Promise<DiagnosticResult> {
    const startTime = Date.now();
    
    try {
      let token = null;
      
      if (typeof window !== 'undefined') {
        // 检查localStorage
        token = localStorage.getItem('auth.token');
        
        if (!token) {
          // 检查Supabase session
          const { supabase } = await import('@/lib/supabase');
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error) {
            throw error;
          }
          
          token = session?.access_token;
        }
      }
      
      return {
        test: '认证token获取',
        success: !!token,
        duration: Date.now() - startTime,
        details: { 
          hasToken: !!token,
          tokenLength: token?.length || 0
        }
      };
    } catch (error: any) {
      return {
        test: '认证token获取',
        success: false,
        duration: Date.now() - startTime,
        error: error.message
      };
    }
  }
  
  /**
   * 测试创建提示词API（不实际创建）
   */
  private static async testCreatePromptAPI(): Promise<DiagnosticResult> {
    const startTime = Date.now();
    
    try {
      // 获取token
      let token = null;
      if (typeof window !== 'undefined') {
        token = localStorage.getItem('auth.token');
        
        if (!token) {
          const { supabase } = await import('@/lib/supabase');
          const { data: { session } } = await supabase.auth.getSession();
          token = session?.access_token;
        }
      }
      
      if (!token) {
        throw new Error('无法获取认证token');
      }
      
      // 发送一个HEAD请求测试API可达性
      const response = await fetch('/api/prompts', {
        method: 'HEAD',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        signal: AbortSignal.timeout(15000)
      });
      
      return {
        test: '创建提示词API',
        success: response.status !== 500, // 允许401、403等认证相关错误
        duration: Date.now() - startTime,
        details: { 
          status: response.status,
          statusText: response.statusText
        }
      };
    } catch (error: any) {
      return {
        test: '创建提示词API',
        success: false,
        duration: Date.now() - startTime,
        error: error.message
      };
    }
  }
  
  /**
   * 快速连接测试（只测试关键项目）
   */
  static async quickConnectionTest(): Promise<boolean> {
    try {
      // 检查基础网络
      if (typeof window !== 'undefined' && !navigator.onLine) {
        return false;
      }
      
      // 快速API测试
      const response = await fetch('/api/health', {
        signal: AbortSignal.timeout(5000)
      });
      
      return response.ok;
    } catch {
      return false;
    }
  }
}

// 导出便捷函数
export const runDiagnostics = ConnectionDiagnostics.runFullDiagnostics;
export const quickTest = ConnectionDiagnostics.quickConnectionTest; 