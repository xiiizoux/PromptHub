/**
 * 依赖注入容器
 * 管理服务的创建、注册和依赖关系
 */

/**
 * 服务生命周期
 */
export enum ServiceLifetime {
  Singleton = 'singleton',    // 单例
  Transient = 'transient',    // 每次创建新实例
  Scoped = 'scoped'          // 作用域内单例
}

/**
 * 服务描述符
 */
export interface ServiceDescriptor<T = any> {
  key: string;
  factory: (...args: any[]) => T;
  lifetime: ServiceLifetime;
  dependencies?: string[];
}

/**
 * 依赖注入容器
 */
export class DIContainer {
  private services = new Map<string, ServiceDescriptor>();
  private instances = new Map<string, any>();
  private scopedInstances = new Map<string, any>();

  /**
   * 注册单例服务
   */
  registerSingleton<T>(key: string, factory: () => T): DIContainer {
    return this.register(key, factory, ServiceLifetime.Singleton);
  }

  /**
   * 注册瞬态服务
   */
  registerTransient<T>(key: string, factory: (...args: any[]) => T): DIContainer {
    return this.register(key, factory, ServiceLifetime.Transient);
  }

  /**
   * 注册作用域服务
   */
  registerScoped<T>(key: string, factory: (...args: any[]) => T): DIContainer {
    return this.register(key, factory, ServiceLifetime.Scoped);
  }

  /**
   * 注册服务
   */
  register<T>(
    key: string, 
    factory: (...args: any[]) => T, 
    lifetime: ServiceLifetime = ServiceLifetime.Singleton,
    dependencies: string[] = []
  ): DIContainer {
    this.services.set(key, {
      key,
      factory,
      lifetime,
      dependencies
    });
    return this;
  }

  /**
   * 获取服务实例
   */
  get<T>(key: string): T {
    const descriptor = this.services.get(key);
    if (!descriptor) {
      throw new Error(`服务未注册: ${key}`);
    }

    // 根据生命周期返回不同的实例
    switch (descriptor.lifetime) {
      case ServiceLifetime.Singleton:
        return this.getSingleton<T>(descriptor);
      
      case ServiceLifetime.Scoped:
        return this.getScoped<T>(descriptor);
      
      case ServiceLifetime.Transient:
        return this.createInstance<T>(descriptor);
      
      default:
        throw new Error(`不支持的服务生命周期: ${descriptor.lifetime}`);
    }
  }

  /**
   * 获取单例实例
   */
  private getSingleton<T>(descriptor: ServiceDescriptor<T>): T {
    if (!this.instances.has(descriptor.key)) {
      const instance = this.createInstance<T>(descriptor);
      this.instances.set(descriptor.key, instance);
    }
    return this.instances.get(descriptor.key);
  }

  /**
   * 获取作用域实例
   */
  private getScoped<T>(descriptor: ServiceDescriptor<T>): T {
    if (!this.scopedInstances.has(descriptor.key)) {
      const instance = this.createInstance<T>(descriptor);
      this.scopedInstances.set(descriptor.key, instance);
    }
    return this.scopedInstances.get(descriptor.key);
  }

  /**
   * 创建新实例
   */
  private createInstance<T>(descriptor: ServiceDescriptor<T>): T {
    try {
      // 解析依赖
      const dependencies = descriptor.dependencies?.map(dep => this.get(dep)) || [];
      
      // 调用工厂函数创建实例
      const instance = descriptor.factory(...dependencies);
      
      console.log(`[DI容器] 创建服务实例: ${descriptor.key} (${descriptor.lifetime})`);
      return instance;
    } catch (error) {
      throw new Error(`创建服务实例失败 ${descriptor.key}: ${error}`);
    }
  }

  /**
   * 检查服务是否已注册
   */
  has(key: string): boolean {
    return this.services.has(key);
  }

  /**
   * 获取所有注册的服务键
   */
  getServiceKeys(): string[] {
    return Array.from(this.services.keys());
  }

  /**
   * 清除作用域实例
   */
  clearScope(): void {
    this.scopedInstances.clear();
    console.log('[DI容器] 已清除作用域实例');
  }

  /**
   * 销毁容器
   */
  dispose(): void {
    this.instances.clear();
    this.scopedInstances.clear();
    this.services.clear();
    console.log('[DI容器] 容器已销毁');
  }

  /**
   * 获取服务依赖图
   */
  getDependencyGraph(): { [key: string]: string[] } {
    const graph: { [key: string]: string[] } = {};
    
    for (const [key, descriptor] of this.services) {
      graph[key] = descriptor.dependencies || [];
    }
    
    return graph;
  }

  /**
   * 验证依赖关系（检测循环依赖）
   */
  validateDependencies(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const checkCyclicDependency = (key: string): boolean => {
      if (recursionStack.has(key)) {
        errors.push(`检测到循环依赖: ${key}`);
        return false;
      }

      if (visited.has(key)) {
        return true;
      }

      visited.add(key);
      recursionStack.add(key);

      const descriptor = this.services.get(key);
      if (descriptor?.dependencies) {
        for (const dep of descriptor.dependencies) {
          if (!this.services.has(dep)) {
            errors.push(`依赖服务未注册: ${key} -> ${dep}`);
            continue;
          }

          if (!checkCyclicDependency(dep)) {
            return false;
          }
        }
      }

      recursionStack.delete(key);
      return true;
    };

    // 检查所有服务
    for (const key of this.services.keys()) {
      if (!visited.has(key)) {
        checkCyclicDependency(key);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

/**
 * 全局依赖注入容器实例
 */
export const container = new DIContainer();

/**
 * 注册默认服务
 */
export function registerDefaultServices(): void {
  // 在这里注册基础服务
  console.log('[DI容器] 注册默认服务...');
  
  // 验证依赖关系
  const validation = container.validateDependencies();
  if (!validation.isValid) {
    console.error('[DI容器] 依赖验证失败:', validation.errors);
    throw new Error(`依赖注入配置错误: ${validation.errors.join(', ')}`);
  }
  
  console.log('[DI容器] 默认服务注册完成');
} 