import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import winston from 'winston';

// 密钥管理日志
const keyLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/key-management.log' }),
    new winston.transports.Console({ level: 'warn' })
  ]
});

interface KeyInfo {
  name: string;
  value: string;
  createdAt?: Date;
  lastChecked?: Date;
  strength: 'weak' | 'medium' | 'strong';
  recommendation?: string;
}

class KeyManager {
  private keyInfoFile = path.join(process.cwd(), 'key-info.json');
  private keyInfo: Record<string, KeyInfo> = {};

  constructor() {
    this.loadKeyInfo();
  }

  // 加载密钥信息
  private loadKeyInfo() {
    try {
      if (fs.existsSync(this.keyInfoFile)) {
        const data = fs.readFileSync(this.keyInfoFile, 'utf8');
        this.keyInfo = JSON.parse(data);
      }
    } catch (error) {
      keyLogger.warn('Failed to load key info', { error: error.message });
    }
  }

  // 保存密钥信息
  private saveKeyInfo() {
    try {
      fs.writeFileSync(this.keyInfoFile, JSON.stringify(this.keyInfo, null, 2));
    } catch (error) {
      keyLogger.error('Failed to save key info', { error: error.message });
    }
  }

  // 检查密钥强度
  private checkKeyStrength(key: string): { strength: 'weak' | 'medium' | 'strong', recommendation?: string } {
    if (!key || key.length < 16) {
      return { 
        strength: 'weak', 
        recommendation: '密钥长度应至少16个字符，建议使用32个字符以上的随机字符串' 
      };
    }

    if (key.length < 32) {
      return { 
        strength: 'medium', 
        recommendation: '建议使用32个字符以上的密钥以提高安全性' 
      };
    }

    // 检查是否为常见的弱密钥
    const weakPatterns = [
      'secret', 'password', '123456', 'default', 'admin',
      'your-secret-key', 'your-jwt-secret', 'change-me'
    ];

    if (weakPatterns.some(pattern => key.toLowerCase().includes(pattern))) {
      return { 
        strength: 'weak', 
        recommendation: '检测到可能的默认或常见密钥，建议生成新的随机密钥' 
      };
    }

    return { strength: 'strong' };
  }

  // 注册密钥（首次使用或更新时调用）
  public registerKey(name: string, value: string): void {
    const { strength, recommendation } = this.checkKeyStrength(value);
    
    this.keyInfo[name] = {
      name,
      value: value.substring(0, 8) + '***', // 只存储前8位用于识别
      createdAt: this.keyInfo[name]?.createdAt || new Date(),
      lastChecked: new Date(),
      strength,
      recommendation
    };

    this.saveKeyInfo();

    if (strength === 'weak') {
      keyLogger.warn('Weak key detected', { keyName: name, recommendation });
    }
  }

  // 检查所有密钥状态
  public checkAllKeys(): { hasWeakKeys: boolean; recommendations: string[] } {
    const recommendations: string[] = [];
    let hasWeakKeys = false;

    // 检查环境变量中的关键密钥
    const criticalKeys = [
      'JWT_SECRET',
      'JWT_REFRESH_SECRET', 
      'API_SECRET_KEY',
      'ENCRYPTION_KEY',
      'SESSION_SECRET'
    ];

    criticalKeys.forEach(keyName => {
      const keyValue = process.env[keyName];
      if (keyValue) {
        this.registerKey(keyName, keyValue);
        const keyInfo = this.keyInfo[keyName];
        
        if (keyInfo.strength === 'weak') {
          hasWeakKeys = true;
          recommendations.push(`${keyName}: ${keyInfo.recommendation}`);
        } else if (keyInfo.strength === 'medium') {
          recommendations.push(`${keyName}: ${keyInfo.recommendation}`);
        }
      } else {
        recommendations.push(`${keyName}: 未设置，请在环境变量中配置此密钥`);
      }
    });

    return { hasWeakKeys, recommendations };
  }

  // 检查密钥是否应该轮换（基于时间）
  public checkKeyRotation(): { shouldRotate: string[]; overdue: string[] } {
    const now = new Date();
    const shouldRotate: string[] = [];
    const overdue: string[] = [];

    Object.values(this.keyInfo).forEach(keyInfo => {
      if (keyInfo.createdAt) {
        const daysSinceCreation = Math.floor((now.getTime() - keyInfo.createdAt.getTime()) / (1000 * 60 * 60 * 24));
        
        // 建议90天轮换一次
        if (daysSinceCreation > 90) {
          shouldRotate.push(keyInfo.name);
        }
        
        // 180天未轮换视为过期
        if (daysSinceCreation > 180) {
          overdue.push(keyInfo.name);
        }
      }
    });

    return { shouldRotate, overdue };
  }

  // 生成新密钥建议
  public generateKeyRecommendation(keyName: string): string {
    const newKey = crypto.randomBytes(32).toString('hex');
    return `建议将 ${keyName} 更新为: ${newKey}`;
  }

  // 发送友好的安全提醒
  public getSecurityReminders(): {
    level: 'info' | 'warning' | 'error';
    title: string;
    message: string;
    action?: string;
  }[] {
    const reminders = [];
    const { hasWeakKeys, recommendations } = this.checkAllKeys();
    const { shouldRotate, overdue } = this.checkKeyRotation();

    // 弱密钥警告
    if (hasWeakKeys) {
      reminders.push({
        level: 'warning' as const,
        title: '密钥安全提醒',
        message: '检测到一些密钥强度较弱，建议增强以提高安全性：\n' + recommendations.slice(0, 3).join('\n'),
        action: '可在系统空闲时更新这些密钥，不会影响当前服务'
      });
    }

    // 密钥轮换提醒
    if (shouldRotate.length > 0 && overdue.length === 0) {
      reminders.push({
        level: 'info' as const,
        title: '密钥轮换建议',
        message: `以下密钥建议定期轮换：${shouldRotate.join(', ')}`,
        action: '建议在维护窗口期间更新这些密钥'
      });
    }

    // 过期密钥警告
    if (overdue.length > 0) {
      reminders.push({
        level: 'error' as const,
        title: '密钥过期警告',
        message: `以下密钥已超过建议使用期限：${overdue.join(', ')}`,
        action: '建议尽快安排密钥轮换以确保安全性'
      });
    }

    // 记录提醒
    if (reminders.length > 0) {
      keyLogger.info('Security reminders generated', {
        reminderCount: reminders.length,
        levels: reminders.map(r => r.level)
      });
    }

    return reminders;
  }

  // 标记密钥已查看提醒
  public markReminderSeen(keyName: string): void {
    if (this.keyInfo[keyName]) {
      this.keyInfo[keyName].lastChecked = new Date();
      this.saveKeyInfo();
    }
  }
}

// 导出单例实例
export const keyManager = new KeyManager();

// 中间件：在应用启动时检查密钥
export const initializeKeyCheck = () => {
  const reminders = keyManager.getSecurityReminders();
  
  if (reminders.length > 0) {
    console.log('\n=== 密钥安全提醒 ===');
    reminders.forEach(reminder => {
      const prefix = reminder.level === 'error' ? '❌' : reminder.level === 'warning' ? '⚠️' : 'ℹ️';
      console.log(`${prefix} ${reminder.title}`);
      console.log(`   ${reminder.message}`);
      if (reminder.action) {
        console.log(`   建议行动：${reminder.action}`);
      }
      console.log('');
    });
    console.log('===================\n');
  }
};

// API端点：获取密钥状态（管理员用）
export const getKeyStatus = () => {
  const { hasWeakKeys, recommendations } = keyManager.checkAllKeys();
  const { shouldRotate, overdue } = keyManager.checkKeyRotation();
  const reminders = keyManager.getSecurityReminders();

  return {
    status: hasWeakKeys ? 'warning' : overdue.length > 0 ? 'error' : 'ok',
    summary: {
      totalKeys: Object.keys(keyManager['keyInfo']).length,
      weakKeys: hasWeakKeys ? recommendations.filter(r => r.includes('弱')).length : 0,
      shouldRotate: shouldRotate.length,
      overdue: overdue.length
    },
    reminders,
    lastCheck: new Date().toISOString()
  };
}; 