import React from 'react';
import Link from 'next/link';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';

const VersioningPage: React.FC = () => {
  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="container-custom">
        {/* 返回按钮 */}
        <div className="mb-6">
          <Link href="/docs/advanced" className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-700">
            <ChevronLeftIcon className="h-5 w-5 mr-1" />
            返回高级功能
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">版本控制</h1>
          <p className="mt-2 text-gray-600">
            学习如何有效管理提示词的版本、变更历史和发布流程
          </p>
        </div>

        {/* 版本控制概述 */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">为什么需要版本控制？</h2>
            <p className="text-gray-600 mb-6">
              提示词版本控制帮助团队跟踪变更、回滚问题版本、协作开发，并确保生产环境的稳定性。
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-blue-800 mb-3">🔄 变更追踪</h3>
                <ul className="space-y-2 text-blue-700 text-sm">
                  <li>• 记录每次修改</li>
                  <li>• 标识修改原因</li>
                  <li>• 追踪性能影响</li>
                  <li>• 维护变更日志</li>
                </ul>
              </div>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-green-800 mb-3">👥 团队协作</h3>
                <ul className="space-y-2 text-green-700 text-sm">
                  <li>• 多人并行开发</li>
                  <li>• 冲突解决机制</li>
                  <li>• 代码审查流程</li>
                  <li>• 权限管理</li>
                </ul>
              </div>
              
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-purple-800 mb-3">🚀 发布管理</h3>
                <ul className="space-y-2 text-purple-700 text-sm">
                  <li>• 分阶段发布</li>
                  <li>• 快速回滚</li>
                  <li>• A/B测试支持</li>
                  <li>• 环境隔离</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* 版本命名规范 */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">版本命名规范</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">语义化版本控制 (SemVer)</h3>
                <p className="text-gray-600 mb-4">
                  采用 MAJOR.MINOR.PATCH 格式，清晰表达变更的影响范围。
                </p>
                
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600 mb-2">MAJOR</div>
                      <div className="text-gray-700">
                        <p className="font-medium mb-1">重大变更</p>
                        <p>不兼容的API修改</p>
                        <p>输出格式重大调整</p>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600 mb-2">MINOR</div>
                      <div className="text-gray-700">
                        <p className="font-medium mb-1">功能更新</p>
                        <p>向后兼容的新功能</p>
                        <p>性能优化</p>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600 mb-2">PATCH</div>
                      <div className="text-gray-700">
                        <p className="font-medium mb-1">问题修复</p>
                        <p>错误修正</p>
                        <p>小幅改进</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-md font-medium text-blue-800 mb-2">版本示例：</h4>
                  <ul className="text-blue-700 text-sm space-y-1">
                    <li>• <code>1.0.0</code> - 初始发布版本</li>
                    <li>• <code>1.0.1</code> - 修复小错误</li>
                    <li>• <code>1.1.0</code> - 添加新功能</li>
                    <li>• <code>2.0.0</code> - 重大架构调整</li>
                  </ul>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">预发布版本</h3>
                <p className="text-gray-600 mb-4">
                  用于测试和验证的预发布版本标识。
                </p>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <h4 className="font-medium text-gray-800 mb-2">开发版本</h4>
                      <ul className="text-gray-600 space-y-1">
                        <li>• <code>1.1.0-alpha.1</code> - 内部测试</li>
                        <li>• <code>1.1.0-beta.1</code> - 公开测试</li>
                        <li>• <code>1.1.0-rc.1</code> - 发布候选</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-800 mb-2">特殊标识</h4>
                      <ul className="text-gray-600 space-y-1">
                        <li>• <code>dev</code> - 开发分支</li>
                        <li>• <code>staging</code> - 预发布环境</li>
                        <li>• <code>hotfix</code> - 紧急修复</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 分支策略 */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">分支管理策略</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Git Flow 模型</h3>
                <p className="text-gray-600 mb-4">
                  适用于有明确发布周期的项目，提供完整的分支管理流程。
                </p>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-3 h-3 bg-blue-500 rounded-full mt-1"></div>
                      <div>
                        <h4 className="font-medium text-gray-900">main/master</h4>
                        <p className="text-sm text-gray-600">生产环境稳定版本，只接受来自release和hotfix的合并</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full mt-1"></div>
                      <div>
                        <h4 className="font-medium text-gray-900">develop</h4>
                        <p className="text-sm text-gray-600">开发主分支，集成所有新功能，准备下次发布</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="w-3 h-3 bg-purple-500 rounded-full mt-1"></div>
                      <div>
                        <h4 className="font-medium text-gray-900">feature/*</h4>
                        <p className="text-sm text-gray-600">功能开发分支，从develop分出，完成后合并回develop</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="w-3 h-3 bg-orange-500 rounded-full mt-1"></div>
                      <div>
                        <h4 className="font-medium text-gray-900">release/*</h4>
                        <p className="text-sm text-gray-600">发布准备分支，从develop分出，测试完成后合并到main和develop</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="w-3 h-3 bg-red-500 rounded-full mt-1"></div>
                      <div>
                        <h4 className="font-medium text-gray-900">hotfix/*</h4>
                        <p className="text-sm text-gray-600">紧急修复分支，从main分出，修复后合并到main和develop</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">GitHub Flow 模型</h3>
                <p className="text-gray-600 mb-4">
                  适用于持续部署的项目，流程简单，发布频繁。
                </p>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2 text-sm">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">1</span>
                      <span>从main分支创建功能分支</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">2</span>
                      <span>在功能分支上开发和测试</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">3</span>
                      <span>创建Pull Request进行代码审查</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">4</span>
                      <span>审查通过后合并到main分支</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">5</span>
                      <span>自动部署到生产环境</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 变更管理 */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">变更管理流程</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">提交信息规范</h3>
                <p className="text-gray-600 mb-4">
                  使用结构化的提交信息，便于自动生成变更日志和版本发布。
                </p>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-md font-medium text-gray-900 mb-2">Conventional Commits 格式：</h4>
                  <pre className="text-sm text-gray-700 mb-4">
{`<type>[optional scope]: <description>

[optional body]

[optional footer(s)]`}
                  </pre>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <h5 className="font-medium text-gray-800 mb-2">常用类型：</h5>
                      <ul className="text-gray-600 space-y-1">
                        <li>• <code>feat</code> - 新功能</li>
                        <li>• <code>fix</code> - 错误修复</li>
                        <li>• <code>docs</code> - 文档更新</li>
                        <li>• <code>style</code> - 格式调整</li>
                        <li>• <code>refactor</code> - 重构</li>
                        <li>• <code>test</code> - 测试相关</li>
                        <li>• <code>chore</code> - 构建/工具</li>
                      </ul>
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-800 mb-2">示例：</h5>
                      <ul className="text-gray-600 space-y-1">
                        <li><code>feat: 添加代码审查提示词</code></li>
                        <li><code>fix: 修复输出格式错误</code></li>
                        <li><code>docs: 更新API文档</code></li>
                        <li><code>refactor: 优化提示词结构</code></li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">代码审查清单</h3>
                <p className="text-gray-600 mb-4">
                  确保每次变更都经过充分的审查和测试。
                </p>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-gray-800 mb-3">功能审查</h4>
                      <ul className="text-sm text-gray-600 space-y-2">
                        <li className="flex items-start space-x-2">
                          <input type="checkbox" className="mt-1" disabled />
                          <span>提示词逻辑正确</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <input type="checkbox" className="mt-1" disabled />
                          <span>输出格式符合规范</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <input type="checkbox" className="mt-1" disabled />
                          <span>示例质量良好</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <input type="checkbox" className="mt-1" disabled />
                          <span>边界情况处理</span>
                        </li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-800 mb-3">质量审查</h4>
                      <ul className="text-sm text-gray-600 space-y-2">
                        <li className="flex items-start space-x-2">
                          <input type="checkbox" className="mt-1" disabled />
                          <span>性能测试通过</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <input type="checkbox" className="mt-1" disabled />
                          <span>A/B测试结果良好</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <input type="checkbox" className="mt-1" disabled />
                          <span>文档已更新</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <input type="checkbox" className="mt-1" disabled />
                          <span>变更日志已记录</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 发布流程 */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">发布流程</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">分阶段发布</h3>
                <p className="text-gray-600 mb-4">
                  通过多个环境逐步验证，降低生产环境风险。
                </p>
                
                <div className="space-y-4">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-medium text-sm">1</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">开发环境 (Development)</h4>
                      <p className="text-sm text-gray-600 mt-1">开发者本地测试，快速迭代和调试</p>
                      <div className="mt-2 text-xs text-gray-500">
                        • 自动化单元测试 • 基础功能验证 • 快速反馈循环
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600 font-medium text-sm">2</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">测试环境 (Staging)</h4>
                      <p className="text-sm text-gray-600 mt-1">模拟生产环境，全面功能测试</p>
                      <div className="mt-2 text-xs text-gray-500">
                        • 集成测试 • 性能测试 • 用户验收测试
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                      <span className="text-orange-600 font-medium text-sm">3</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">预发布环境 (Pre-production)</h4>
                      <p className="text-sm text-gray-600 mt-1">生产环境的完全副本，最终验证</p>
                      <div className="mt-2 text-xs text-gray-500">
                        • 生产数据测试 • 负载测试 • 安全扫描
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                      <span className="text-red-600 font-medium text-sm">4</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">生产环境 (Production)</h4>
                      <p className="text-sm text-gray-600 mt-1">正式发布，服务真实用户</p>
                      <div className="mt-2 text-xs text-gray-500">
                        • 灰度发布 • 实时监控 • 快速回滚准备
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">自动化发布</h3>
                <p className="text-gray-600 mb-4">
                  使用CI/CD流水线自动化发布流程，减少人为错误。
                </p>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap">
{`# GitHub Actions 示例
name: Release Workflow

on:
  push:
    tags:
      - 'v*'

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run Tests
        run: npm test
      
  deploy-staging:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Staging
        run: ./deploy-staging.sh
      
  deploy-production:
    needs: deploy-staging
    runs-on: ubuntu-latest
    if: startsWith(github.ref, 'refs/tags/v')
    steps:
      - name: Deploy to Production
        run: ./deploy-production.sh`}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 回滚策略 */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">回滚策略</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">快速回滚机制</h3>
                <p className="text-gray-600 mb-4">
                  当发现问题时，能够快速恢复到稳定版本。
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h4 className="text-lg font-medium text-red-800 mb-3">紧急回滚</h4>
                    <ul className="text-red-700 text-sm space-y-2">
                      <li>• 立即切换到上一个稳定版本</li>
                      <li>• 通知相关团队和用户</li>
                      <li>• 记录问题和回滚原因</li>
                      <li>• 启动问题调查流程</li>
                    </ul>
                  </div>
                  
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="text-lg font-medium text-yellow-800 mb-3">计划回滚</h4>
                    <ul className="text-yellow-700 text-sm space-y-2">
                      <li>• 评估回滚影响范围</li>
                      <li>• 制定回滚计划和时间表</li>
                      <li>• 准备数据迁移方案</li>
                      <li>• 协调各团队配合</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">版本兼容性</h3>
                <p className="text-gray-600 mb-4">
                  确保不同版本之间的兼容性，支持平滑升级和降级。
                </p>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-800 mb-2">向后兼容</h4>
                      <p className="text-sm text-gray-600">新版本能够处理旧版本的输入格式和参数</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-800 mb-2">向前兼容</h4>
                      <p className="text-sm text-gray-600">旧版本能够忽略新版本的扩展字段</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-800 mb-2">渐进式迁移</h4>
                      <p className="text-sm text-gray-600">提供迁移工具和指南，帮助用户平滑升级</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 最佳实践总结 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-blue-900 mb-4">📋 版本控制最佳实践</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-blue-900 mb-3">核心原则</h3>
              <ul className="space-y-2 text-blue-800">
                <li>• 使用语义化版本号</li>
                <li>• 保持清晰的分支策略</li>
                <li>• 强制代码审查流程</li>
                <li>• 自动化测试和部署</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-medium text-blue-900 mb-3">关键技巧</h3>
              <ul className="space-y-2 text-blue-800">
                <li>• 详细记录变更历史</li>
                <li>• 分阶段发布验证</li>
                <li>• 准备快速回滚方案</li>
                <li>• 监控版本性能表现</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 工具推荐 */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">推荐工具</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">版本控制</h3>
                <ul className="space-y-2 text-gray-600 text-sm">
                  <li>• <strong>Git</strong> - 分布式版本控制</li>
                  <li>• <strong>GitHub/GitLab</strong> - 代码托管平台</li>
                  <li>• <strong>Semantic Release</strong> - 自动版本发布</li>
                  <li>• <strong>Conventional Commits</strong> - 提交规范</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">CI/CD</h3>
                <ul className="space-y-2 text-gray-600 text-sm">
                  <li>• <strong>GitHub Actions</strong> - 自动化工作流</li>
                  <li>• <strong>Jenkins</strong> - 持续集成服务器</li>
                  <li>• <strong>Docker</strong> - 容器化部署</li>
                  <li>• <strong>Kubernetes</strong> - 容器编排</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* 下一步 */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">下一步学习</h2>
            <p className="text-gray-600 mb-4">
              现在您已经了解了版本控制的重要性，可以继续学习：
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link href="/docs/advanced/performance-tracking" className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100">
                <h3 className="text-md font-medium text-gray-900 mb-1">性能追踪与分析</h3>
                <p className="text-sm text-gray-600">学习如何监控和分析提示词性能</p>
              </Link>
              
              <Link href="/docs/advanced/integration" className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100">
                <h3 className="text-md font-medium text-gray-900 mb-1">系统集成</h3>
                <p className="text-sm text-gray-600">了解如何将提示词集成到现有系统</p>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VersioningPage; 