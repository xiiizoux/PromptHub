import React from 'react';
import Link from 'next/link';
import { ChevronLeftIcon, SparklesIcon, ChatBubbleLeftRightIcon, DocumentDuplicateIcon, CodeBracketIcon } from '@heroicons/react/24/outline';

const ExamplesLibraryPage: React.FC = () => {
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
          <h1 className="text-3xl font-bold text-gray-900">提示词示例库</h1>
          <p className="mt-2 text-gray-600">
            精选的实际应用示例，展示如何在不同场景中有效使用提示词，帮助您快速掌握最佳实践
          </p>
        </div>

        {/* 示例分类 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center mb-2">
              <SparklesIcon className="h-5 w-5 text-purple-600 mr-2" />
              <h3 className="font-medium text-gray-900">创意写作</h3>
            </div>
            <p className="text-sm text-gray-600">故事创作、文案写作等创意内容</p>
          </div>
          
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center mb-2">
              <ChatBubbleLeftRightIcon className="h-5 w-5 text-blue-600 mr-2" />
              <h3 className="font-medium text-gray-900">对话助手</h3>
            </div>
            <p className="text-sm text-gray-600">客服、咨询、问答等对话场景</p>
          </div>
          
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center mb-2">
              <DocumentDuplicateIcon className="h-5 w-5 text-green-600 mr-2" />
              <h3 className="font-medium text-gray-900">文档处理</h3>
            </div>
            <p className="text-sm text-gray-600">总结、翻译、格式转换等</p>
          </div>
          
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center mb-2">
              <CodeBracketIcon className="h-5 w-5 text-orange-600 mr-2" />
              <h3 className="font-medium text-gray-900">技术应用</h3>
            </div>
            <p className="text-sm text-gray-600">代码生成、调试、文档编写</p>
          </div>
        </div>

        {/* 创意写作示例 */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <SparklesIcon className="h-6 w-6 text-purple-600 mr-2" />
              创意写作示例
            </h2>
            
            <div className="space-y-8">
              {/* 故事生成器示例 */}
              <div className="border border-gray-200 rounded-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">创意故事生成器</h3>
                    <p className="text-sm text-gray-600 mt-1">根据关键词和主题生成引人入胜的故事</p>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    创意
                  </span>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">提示词：</h4>
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap">
{`你是一个富有创造力的故事创作者。请根据以下要素创作一个引人入胜的短故事：

故事主题：科幻冒险
主要角色：年轻的太空探险家艾莉
关键元素：神秘星球、古老文明遗迹、能量水晶
故事风格：充满悬念和想象力
目标长度：800-1000字

故事要求：
1. 开头要立即抓住读者注意力
2. 包含意外的情节转折
3. 描述生动，让读者身临其境
4. 结尾要有深度和启发性
5. 语言流畅，适合青少年阅读

请开始创作这个故事：`}
                  </pre>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg mb-4">
                  <h4 className="text-sm font-medium text-blue-700 mb-2">AI输出示例：</h4>
                  <div className="text-sm text-blue-800">
                    <p className="mb-2"><strong>《水晶之谜》</strong></p>
                    <p className="mb-2">
                      艾莉的飞船刚刚穿越虫洞，眼前出现的景象让她屏住了呼吸。这颗星球的表面闪烁着奇异的蓝光，
                      仿佛整个世界都在脉动着生命的节拍...
                    </p>
                    <p className="text-xs text-blue-600">[故事继续，展示完整的创作过程]</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">关键技巧：</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• 明确指定故事元素和风格</li>
                      <li>• 设定具体的长度要求</li>
                      <li>• 提供结构化的创作指导</li>
                      <li>• 强调目标读者群体</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">应用场景：</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• 儿童读物创作</li>
                      <li>• 创意写作练习</li>
                      <li>• 内容营销故事</li>
                      <li>• 教育材料编写</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* 营销文案示例 */}
              <div className="border border-gray-200 rounded-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">产品营销文案生成器</h3>
                    <p className="text-sm text-gray-600 mt-1">为产品创作吸引人的营销文案</p>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    营销
                  </span>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">提示词：</h4>
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap">
{`你是一个专业的营销文案撰写专家。请为以下产品创作吸引人的营销文案：

产品名称：智能健康手环 FitPro X1
目标客户：25-40岁的健康意识人群
产品特点：
- 24小时心率监测
- 睡眠质量分析
- 50米防水设计
- 15天超长续航
- AI健康建议

文案要求：
1. 标题要有冲击力，能立即抓住注意力
2. 突出产品的核心价值和差异化优势
3. 使用情感化语言，引起共鸣
4. 包含明确的行动号召
5. 长度控制在200字以内

请按以下格式输出：
【主标题】
【副标题】
【正文内容】
【行动号召】`}
                  </pre>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg mb-4">
                  <h4 className="text-sm font-medium text-blue-700 mb-2">AI输出示例：</h4>
                  <div className="text-sm text-blue-800">
                    <p className="mb-2"><strong>【主标题】</strong> 重新定义健康生活，从手腕开始</p>
                    <p className="mb-2"><strong>【副标题】</strong> FitPro X1智能手环，您的24小时健康守护者</p>
                    <p className="mb-2"><strong>【正文内容】</strong> 
                      忙碌的生活让您忽略了身体的声音？FitPro X1用科技的力量，让健康管理变得简单而精准。
                      24小时不间断心率监测，深度睡眠分析，AI智能健康建议...
                    </p>
                    <p><strong>【行动号召】</strong> 立即下单，开启您的智能健康之旅！</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">关键技巧：</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• 明确目标客户群体</li>
                      <li>• 突出产品核心卖点</li>
                      <li>• 使用结构化输出格式</li>
                      <li>• 强调情感连接</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">应用场景：</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• 电商产品描述</li>
                      <li>• 广告文案创作</li>
                      <li>• 社交媒体推广</li>
                      <li>• 邮件营销内容</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 对话助手示例 */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <ChatBubbleLeftRightIcon className="h-6 w-6 text-blue-600 mr-2" />
              对话助手示例
            </h2>
            
            <div className="space-y-8">
              {/* 客服助手示例 */}
              <div className="border border-gray-200 rounded-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">智能客服助手</h3>
                    <p className="text-sm text-gray-600 mt-1">处理客户咨询和问题解答</p>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    客服
                  </span>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">提示词：</h4>
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap">
{`你是TechStore电商平台的专业客服代表，名字叫小智。你的任务是帮助客户解决问题并提供优质服务。

服务原则：
1. 始终保持友好、耐心和专业的态度
2. 快速理解客户需求，提供准确信息
3. 主动提供解决方案，而不仅仅是回答问题
4. 如果无法解决问题，及时转接人工客服
5. 记住客户是我们最宝贵的资产

常见问题处理：
- 订单查询：引导客户提供订单号，查询订单状态
- 退换货：说明退换货政策，协助处理流程
- 产品咨询：提供详细产品信息和使用建议
- 支付问题：协助解决支付异常，推荐安全支付方式
- 物流查询：提供物流跟踪信息和预计到达时间

回复格式：
- 称呼客户为"亲爱的客户"
- 表达理解和关心
- 提供具体解决方案
- 询问是否还有其他需要帮助的地方

现在客户说："我昨天下的订单还没有发货，什么时候能收到？"

请作为小智回复：`}
                  </pre>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg mb-4">
                  <h4 className="text-sm font-medium text-blue-700 mb-2">AI输出示例：</h4>
                  <div className="text-sm text-blue-800">
                    <p className="mb-2">
                      亲爱的客户，您好！我是小智，很高兴为您服务。
                    </p>
                    <p className="mb-2">
                      我完全理解您对订单进度的关心。为了更好地帮助您查询订单状态，
                      请您提供一下订单号，我会立即为您查询详细的物流信息。
                    </p>
                    <p className="mb-2">
                      一般情况下，我们会在24-48小时内安排发货，具体时间可能因商品库存和地区而有所不同。
                      查询到您的订单信息后，我会为您提供准确的发货时间和预计到达时间。
                    </p>
                    <p>
                      请问您还有其他需要我帮助的地方吗？我随时为您服务！
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">关键技巧：</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• 设定明确的角色和个性</li>
                      <li>• 提供详细的服务原则</li>
                      <li>• 列出常见问题处理方式</li>
                      <li>• 规范回复格式和语调</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">应用场景：</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• 电商客服系统</li>
                      <li>• 在线咨询平台</li>
                      <li>• 企业服务热线</li>
                      <li>• 社区问答助手</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 技术应用示例 */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <CodeBracketIcon className="h-6 w-6 text-orange-600 mr-2" />
              技术应用示例
            </h2>
            
            <div className="space-y-8">
              {/* 代码生成示例 */}
              <div className="border border-gray-200 rounded-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">智能代码生成器</h3>
                    <p className="text-sm text-gray-600 mt-1">根据需求生成高质量的代码</p>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                    编程
                  </span>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">提示词：</h4>
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap">
{`你是一个经验丰富的Python开发工程师。请根据以下需求编写高质量的代码：

需求描述：创建一个用户管理系统的API接口
功能要求：
1. 用户注册（包含邮箱验证）
2. 用户登录（JWT认证）
3. 获取用户信息
4. 更新用户资料
5. 密码重置功能

技术要求：
- 使用Flask框架
- 数据库使用SQLAlchemy ORM
- 密码加密存储
- 输入数据验证
- 错误处理和日志记录
- RESTful API设计

代码要求：
1. 代码结构清晰，遵循PEP8规范
2. 添加详细的注释和文档字符串
3. 包含适当的错误处理
4. 考虑安全性最佳实践
5. 提供使用示例

请提供完整的实现代码：`}
                  </pre>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg mb-4">
                  <h4 className="text-sm font-medium text-blue-700 mb-2">AI输出示例：</h4>
                  <div className="text-sm text-blue-800">
                    <pre className="whitespace-pre-wrap">
{`# user_management.py
from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
import datetime
import re

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///users.db'

db = SQLAlchemy(app)

class User(db.Model):
    """用户模型类"""
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    # ... 更多字段和方法`}
                    </pre>
                    <p className="text-xs text-blue-600 mt-2">[代码继续，展示完整的实现]</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">关键技巧：</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• 明确技术栈和框架</li>
                      <li>• 详细描述功能需求</li>
                      <li>• 强调代码质量要求</li>
                      <li>• 包含安全性考虑</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">应用场景：</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• 快速原型开发</li>
                      <li>• 代码模板生成</li>
                      <li>• 学习参考代码</li>
                      <li>• 项目脚手架创建</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 最佳实践总结 */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-green-900 mb-4">💡 示例设计最佳实践</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-green-900 mb-3">提示词设计原则</h3>
              <ul className="space-y-2 text-green-800">
                <li>• 明确角色定位和专业背景</li>
                <li>• 提供具体详细的任务描述</li>
                <li>• 设定清晰的输出格式要求</li>
                <li>• 包含质量标准和约束条件</li>
                <li>• 添加相关的上下文信息</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-medium text-green-900 mb-3">效果优化技巧</h3>
              <ul className="space-y-2 text-green-800">
                <li>• 使用具体的示例和模板</li>
                <li>• 分步骤引导AI思考过程</li>
                <li>• 设置多层次的验证机制</li>
                <li>• 根据反馈持续优化提示词</li>
                <li>• 测试不同场景下的表现</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 下一步 */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">下一步</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link href="/docs/templates" className="block p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:shadow-md transition-all">
                <h3 className="font-medium text-gray-900 mb-2">查看模板库</h3>
                <p className="text-sm text-gray-600">浏览可复用的提示词模板</p>
              </Link>
              
              <Link href="/docs/best-practices/examples" className="block p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:shadow-md transition-all">
                <h3 className="font-medium text-gray-900 mb-2">学习示例技巧</h3>
                <p className="text-sm text-gray-600">深入了解示例设计方法</p>
              </Link>
              
              <ProtectedLink href="/create" className="block p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:shadow-md transition-all">
                <h3 className="font-medium text-gray-900 mb-2">开始创建</h3>
                <p className="text-sm text-gray-600">基于示例创建您的提示词</p>
              </ProtectedLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamplesLibraryPage; 