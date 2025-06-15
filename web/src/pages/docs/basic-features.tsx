import React from 'react';
import Link from 'next/link';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';

const BasicFeaturesPage: React.FC = () => {
  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="container-custom">
        {/* 返回按钮 */}
        <div className="mb-6">
          <Link href="/docs" className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-700">
            <ChevronLeftIcon className="h-5 w-5 mr-1" />
            返回文档首页
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">基础功能</h1>
          <p className="mt-2 text-gray-600">
            掌握 Prompt Hub 的核心功能，快速上手提示词管理和使用
          </p>
        </div>

        {/* 提示词管理 */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">提示词管理</h2>
            <p className="text-gray-600 mb-6">
              Prompt Hub提供全面的提示词管理功能，帮助您创建、更新、查询和删除提示词。
            </p>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">创建提示词</h3>
                <p className="text-gray-600 mb-4">
                  通过多种方式创建和管理您的提示词：
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-800 mb-2">🖥️ Web界面</h4>
                    <ul className="text-blue-700 text-sm space-y-1">
                      <li>• 直观的图形界面</li>
                      <li>• 实时预览功能</li>
                      <li>• 智能分析和建议</li>
                      <li>• 拖拽排序和分类</li>
                    </ul>
                  </div>
                  
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-medium text-green-800 mb-2">🔌 API接口</h4>
                    <ul className="text-green-700 text-sm space-y-1">
                      <li>• RESTful API设计</li>
                      <li>• 批量操作支持</li>
                      <li>• 自动化集成</li>
                      <li>• 第三方工具连接</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">编辑和更新</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-800 mb-3">编辑流程</h4>
                  <ol className="text-gray-600 text-sm space-y-2">
                    <li><strong>1. 选择提示词</strong> - 在提示词列表中找到需要编辑的提示词</li>
                    <li><strong>2. 进入编辑页面</strong> - 点击编辑按钮或提示词名称</li>
                    <li><strong>3. 修改内容</strong> - 编辑名称、描述、内容、标签等</li>
                    <li><strong>4. 保存更改</strong> - 系统自动创建新版本并保存</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 搜索和查询 */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">搜索和查询</h2>
            <p className="text-gray-600 mb-6">
              强大的搜索功能帮助您快速找到需要的提示词。
            </p>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">搜索方式</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-800 mb-2">🔍 关键词搜索</h4>
                    <ul className="text-gray-600 text-sm space-y-1">
                      <li>• 名称搜索</li>
                      <li>• 描述内容搜索</li>
                      <li>• 标签匹配</li>
                      <li>• 模糊匹配</li>
                    </ul>
                  </div>
                  
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-800 mb-2">🏷️ 分类筛选</h4>
                    <ul className="text-gray-600 text-sm space-y-1">
                      <li>• 按类别过滤</li>
                      <li>• 多标签组合</li>
                      <li>• 创建时间排序</li>
                      <li>• 使用频率排序</li>
                    </ul>
                  </div>
                  
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-800 mb-2">⚡ 快速获取</h4>
                    <ul className="text-gray-600 text-sm space-y-1">
                      <li>• 精确名称查询</li>
                      <li>• 收藏夹快速访问</li>
                      <li>• 最近使用记录</li>
                      <li>• 推荐算法</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">搜索技巧</h3>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-medium text-yellow-800 mb-3">💡 搜索优化建议</h4>
                  <ul className="text-yellow-700 text-sm space-y-2">
                    <li>• 使用具体关键词而非通用词汇</li>
                    <li>• 结合多个筛选条件缩小范围</li>
                    <li>• 善用标签系统进行分类查找</li>
                    <li>• 定期整理和更新提示词标签</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 版本控制 */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">版本控制</h2>
            <p className="text-gray-600 mb-6">
              Prompt Hub 提供完整的版本控制功能，确保您的提示词修改历史安全可追溯。
            </p>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">自动版本管理</h3>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-3">版本创建机制</h4>
                  <ul className="text-blue-700 text-sm space-y-2">
                    <li>• 每次编辑保存时自动创建新版本</li>
                    <li>• 保留完整的修改历史记录</li>
                    <li>• 记录修改时间和修改者信息</li>
                    <li>• 支持版本间的对比查看</li>
                  </ul>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">版本操作</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-800 mb-3">查看历史</h4>
                    <ul className="text-gray-600 text-sm space-y-1">
                      <li>• 时间线展示</li>
                      <li>• 版本详情查看</li>
                      <li>• 修改内容对比</li>
                      <li>• 版本标注说明</li>
                    </ul>
                  </div>
                  
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-800 mb-3">版本恢复</h4>
                    <ul className="text-gray-600 text-sm space-y-1">
                      <li>• 一键回滚到指定版本</li>
                      <li>• 版本间内容合并</li>
                      <li>• 安全确认机制</li>
                      <li>• 恢复后新版本创建</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* AI辅助功能 */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">AI智能辅助</h2>
            <p className="text-gray-600 mb-6">
              利用AI技术提升提示词创作效率和质量。
            </p>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">智能分析功能</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <h4 className="font-medium text-purple-800 mb-2">🤖 一键智能分析</h4>
                    <ul className="text-purple-700 text-sm space-y-1">
                      <li>• 自动分类和标签提取</li>
                      <li>• 模板变量识别</li>
                      <li>• 版本号建议</li>
                      <li>• 改进建议生成</li>
                    </ul>
                  </div>
                  
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-medium text-green-800 mb-2">⚡ 快速优化</h4>
                    <ul className="text-green-700 text-sm space-y-1">
                      <li>• 智能分类建议</li>
                      <li>• 标签自动提取</li>
                      <li>• 变量模式识别</li>
                      <li>• 使用场景分析</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">智能提取功能</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-800 mb-3">从文本提取提示词</h4>
                  <p className="text-gray-600 text-sm mb-3">
                    将自然语言描述转换为结构化的提示词，适用于：
                  </p>
                  <ul className="text-gray-600 text-sm space-y-1">
                    <li>• 聊天记录整理</li>
                    <li>• 创意想法转换</li>
                    <li>• 需求文档提取</li>
                    <li>• 批量内容处理</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 导入导出 */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">导入导出</h2>
            <p className="text-gray-600 mb-6">
              灵活的数据迁移和备份功能，支持多种格式。
            </p>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">支持格式</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-800 mb-2">📄 JSON格式</h4>
                    <ul className="text-gray-600 text-sm space-y-1">
                      <li>• 完整数据保留</li>
                      <li>• 程序化处理</li>
                      <li>• API集成友好</li>
                      <li>• 版本信息完整</li>
                    </ul>
                  </div>
                  
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-800 mb-2">📝 Markdown格式</h4>
                    <ul className="text-gray-600 text-sm space-y-1">
                      <li>• 人类可读</li>
                      <li>• 文档生成</li>
                      <li>• 版本控制友好</li>
                      <li>• 跨平台兼容</li>
                    </ul>
                  </div>
                  
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-800 mb-2">📊 CSV格式</h4>
                    <ul className="text-gray-600 text-sm space-y-1">
                      <li>• 表格化展示</li>
                      <li>• Excel兼容</li>
                      <li>• 统计分析</li>
                      <li>• 批量编辑</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">操作指南</h3>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-medium text-green-800 mb-3">📤 导出流程</h4>
                  <ol className="text-green-700 text-sm space-y-2">
                    <li><strong>1. 选择范围</strong> - 单个提示词或批量选择</li>
                    <li><strong>2. 选择格式</strong> - JSON、Markdown或CSV</li>
                    <li><strong>3. 配置选项</strong> - 包含版本历史、性能数据等</li>
                    <li><strong>4. 开始导出</strong> - 系统生成文件并提供下载</li>
                  </ol>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                  <h4 className="font-medium text-blue-800 mb-3">📥 导入流程</h4>
                  <ol className="text-blue-700 text-sm space-y-2">
                    <li><strong>1. 准备文件</strong> - 确保格式符合标准</li>
                    <li><strong>2. 上传文件</strong> - 拖拽或选择文件上传</li>
                    <li><strong>3. 预览检查</strong> - 查看解析结果和冲突检测</li>
                    <li><strong>4. 确认导入</strong> - 选择处理冲突的方式</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 快速入门链接 */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">快速开始</h2>
          <p className="text-gray-600 mb-6">
            现在就开始使用 Prompt Hub 的强大功能：
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/docs/getting-started/first-prompt" className="block bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <h3 className="font-medium text-gray-900 mb-2">📝 创建第一个提示词</h3>
              <p className="text-gray-600 text-sm">详细的步骤指南，帮助您快速创建第一个提示词</p>
            </Link>
            
            <Link href="/docs/getting-started/template-variables" className="block bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <h3 className="font-medium text-gray-900 mb-2">🔧 使用模板变量</h3>
              <p className="text-gray-600 text-sm">学习如何使用变量让提示词更加灵活和强大</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BasicFeaturesPage;