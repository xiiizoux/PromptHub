import Head from 'next/head';
import { useState } from 'react';

const Privacy = () => {
  const [activeSection, setActiveSection] = useState<string>('');

  const handleSectionClick = (sectionId: string) => {
    setActiveSection(activeSection === sectionId ? '' : sectionId);
  };

  return (
    <>
      <Head>
        <title>隐私政策 - PromptHub</title>
        <meta name="description" content="PromptHub 隐私政策和个人信息保护说明" />
      </Head>
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* 页面标题 */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">隐私政策</h1>
            <p className="text-lg text-gray-600">最后更新：2024年12月</p>
            <div className="mt-4 p-4 bg-blue-100 rounded-lg">
              <p className="text-blue-800 font-medium">
                我们重视并承诺保护您的个人隐私。本政策详细说明了我们如何收集、使用、存储和保护您的个人信息。
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8">
            {/* 目录 */}
            <div className="mb-8 p-6 bg-green-50 rounded-lg">
              <h2 className="text-xl font-semibold mb-4 text-green-800">目录</h2>
              <ul className="space-y-2 text-green-700">
                <li><a href="#overview" className="hover:underline">1. 概述</a></li>
                <li><a href="#collection" className="hover:underline">2. 信息收集</a></li>
                <li><a href="#usage" className="hover:underline">3. 信息使用</a></li>
                <li><a href="#sharing" className="hover:underline">4. 信息共享</a></li>
                <li><a href="#storage" className="hover:underline">5. 数据存储和安全</a></li>
                <li><a href="#retention" className="hover:underline">6. 数据保留</a></li>
                <li><a href="#rights" className="hover:underline">7. 您的权利</a></li>
                <li><a href="#cookies" className="hover:underline">8. Cookie和追踪技术</a></li>
                <li><a href="#children" className="hover:underline">9. 儿童隐私</a></li>
                <li><a href="#international" className="hover:underline">10. 国际数据传输</a></li>
                <li><a href="#updates" className="hover:underline">11. 政策更新</a></li>
                <li><a href="#contact" className="hover:underline">12. 联系我们</a></li>
              </ul>
            </div>

            {/* 政策内容 */}
            <div className="space-y-8">
              {/* 1. 概述 */}
              <section id="overview" className="border-b border-gray-200 pb-6">
                <h2 className="text-2xl font-semibold mb-4 text-gray-800">1. 概述</h2>
                <div className="prose prose-lg text-gray-600">
                  <p>
                    PromptHub（"我们"、"我们的"或"平台"）致力于保护您的隐私和个人信息。本隐私政策解释了我们如何在您使用我们的AI提示管理和分享平台时收集、使用、披露和保护您的信息。
                  </p>
                  <p>
                    通过使用我们的服务，您同意本隐私政策中描述的信息收集和使用做法。如果您不同意本政策，请不要使用我们的服务。
                  </p>
                  <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-400">
                    <p className="text-yellow-800 font-medium">
                      <strong>重要提示：</strong> 我们严格遵守适用的数据保护法律，包括GDPR、CCPA等相关法规。
                    </p>
                  </div>
                </div>
              </section>

              {/* 2. 信息收集 */}
              <section id="collection" className="border-b border-gray-200 pb-6">
                <h2 className="text-2xl font-semibold mb-4 text-gray-800">2. 信息收集</h2>
                <div className="prose prose-lg text-gray-600">
                  <h3 className="text-lg font-medium">2.1 您主动提供的信息</h3>
                  <p>当您使用我们的服务时，您可能会主动向我们提供以下信息：</p>
                  <ul>
                    <li><strong>账户信息：</strong> 用户名、电子邮箱地址、密码（加密存储）</li>
                    <li><strong>个人资料：</strong> 头像、个人简介、联系信息</li>
                    <li><strong>内容数据：</strong> 您创建的提示、评论、收藏等</li>
                    <li><strong>通信信息：</strong> 您与我们的客服或其他用户的通信记录</li>
                  </ul>

                  <h3 className="text-lg font-medium">2.2 自动收集的信息</h3>
                  <p>我们可能自动收集以下技术信息：</p>
                  <ul>
                    <li><strong>设备信息：</strong> IP地址、浏览器类型和版本、操作系统</li>
                    <li><strong>使用数据：</strong> 页面访问记录、点击行为、停留时间</li>
                    <li><strong>位置信息：</strong> 基于IP地址的大致地理位置（不精确定位）</li>
                    <li><strong>性能数据：</strong> 页面加载时间、错误报告等技术诊断信息</li>
                  </ul>

                  <h3 className="text-lg font-medium">2.3 第三方来源信息</h3>
                  <p>我们可能从以下第三方获得信息：</p>
                  <ul>
                    <li><strong>社交媒体登录：</strong> 如果您选择通过社交媒体账户登录</li>
                    <li><strong>分析服务：</strong> 来自Google Analytics等服务的汇总数据</li>
                    <li><strong>安全服务：</strong> 来自安全和反欺诈服务的信息</li>
                  </ul>
                </div>
              </section>

              {/* 3. 信息使用 */}
              <section id="usage" className="border-b border-gray-200 pb-6">
                <h2 className="text-2xl font-semibold mb-4 text-gray-800">3. 信息使用</h2>
                <div className="prose prose-lg text-gray-600">
                  <p>我们使用收集的信息用于以下目的：</p>
                  
                  <h3 className="text-lg font-medium">3.1 服务提供和改进</h3>
                  <ul>
                    <li>创建和管理您的账户</li>
                    <li>提供个性化的内容推荐</li>
                    <li>处理您的请求和交易</li>
                    <li>改进我们的服务功能和用户体验</li>
                    <li>开发新功能和产品</li>
                  </ul>

                  <h3 className="text-lg font-medium">3.2 沟通和支持</h3>
                  <ul>
                    <li>发送服务相关通知和更新</li>
                    <li>回应您的询问和提供客户支持</li>
                    <li>发送重要的安全和隐私通知</li>
                  </ul>

                  <h3 className="text-lg font-medium">3.3 安全和合规</h3>
                  <ul>
                    <li>检测和预防欺诈、滥用和安全威胁</li>
                    <li>执行我们的服务条款和政策</li>
                    <li>遵守法律义务和监管要求</li>
                    <li>保护用户和平台的安全</li>
                  </ul>

                  <h3 className="text-lg font-medium">3.4 分析和营销</h3>
                  <ul>
                    <li>分析平台使用情况和趋势</li>
                    <li>进行市场研究和用户调研</li>
                    <li>发送相关的产品和服务信息（需获得同意）</li>
                  </ul>
                </div>
              </section>

              {/* 4. 信息共享 */}
              <section id="sharing" className="border-b border-gray-200 pb-6">
                <h2 className="text-2xl font-semibold mb-4 text-gray-800">4. 信息共享</h2>
                <div className="prose prose-lg text-gray-600">
                  <p>我们不会出售您的个人信息。我们只在以下情况下共享您的信息：</p>

                  <h3 className="text-lg font-medium">4.1 经您同意</h3>
                  <p>在获得您明确同意的情况下，我们可能与第三方共享您的信息。</p>

                  <h3 className="text-lg font-medium">4.2 服务提供商</h3>
                  <p>我们可能与以下类型的服务提供商共享信息：</p>
                  <ul>
                    <li><strong>云服务提供商：</strong> 用于数据存储和计算服务</li>
                    <li><strong>分析服务：</strong> 用于网站分析和性能监控</li>
                    <li><strong>支付处理商：</strong> 用于处理付费服务（如适用）</li>
                    <li><strong>客服工具：</strong> 用于提供客户支持服务</li>
                  </ul>

                  <h3 className="text-lg font-medium">4.3 法律要求</h3>
                  <p>在以下情况下，我们可能被要求披露您的信息：</p>
                  <ul>
                    <li>遵守法律、法规或法院命令</li>
                    <li>响应政府或执法部门的合法请求</li>
                    <li>保护我们的权利、财产或安全</li>
                    <li>保护用户或公众的安全</li>
                  </ul>

                  <h3 className="text-lg font-medium">4.4 业务转让</h3>
                  <p>如果我们参与合并、收购或出售，您的信息可能作为交易的一部分被转让。</p>
                </div>
              </section>

              {/* 5. 数据存储和安全 */}
              <section id="storage" className="border-b border-gray-200 pb-6">
                <h2 className="text-2xl font-semibold mb-4 text-gray-800">5. 数据存储和安全</h2>
                <div className="prose prose-lg text-gray-600">
                  <h3 className="text-lg font-medium">5.1 安全措施</h3>
                  <p>我们实施了多层安全措施来保护您的信息：</p>
                  <ul>
                    <li><strong>加密：</strong> 数据传输使用TLS/SSL加密，敏感数据存储加密</li>
                    <li><strong>访问控制：</strong> 严格限制对个人数据的访问权限</li>
                    <li><strong>安全监控：</strong> 持续监控系统安全和异常活动</li>
                    <li><strong>定期审计：</strong> 定期进行安全评估和漏洞测试</li>
                    <li><strong>员工培训：</strong> 对员工进行数据保护和安全培训</li>
                  </ul>

                  <h3 className="text-lg font-medium">5.2 数据位置</h3>
                  <p>
                    您的数据主要存储在安全的云服务器上，可能位于中国大陆或其他地区。我们选择符合国际安全标准的数据中心。
                  </p>

                  <h3 className="text-lg font-medium">5.3 数据备份</h3>
                  <p>
                    我们定期备份数据以防止数据丢失，备份数据同样受到严格的安全保护。
                  </p>
                </div>
              </section>

              {/* 6. 数据保留 */}
              <section id="retention" className="border-b border-gray-200 pb-6">
                <h2 className="text-2xl font-semibold mb-4 text-gray-800">6. 数据保留</h2>
                <div className="prose prose-lg text-gray-600">
                  <h3 className="text-lg font-medium">6.1 保留期限</h3>
                  <p>我们根据不同类型的数据设定不同的保留期限：</p>
                  <ul>
                    <li><strong>账户信息：</strong> 账户活跃期间及删除后30天</li>
                    <li><strong>内容数据：</strong> 用户主动删除前一直保留</li>
                    <li><strong>使用日志：</strong> 通常保留12-24个月</li>
                    <li><strong>安全日志：</strong> 保留3-7年（法律要求）</li>
                  </ul>

                  <h3 className="text-lg font-medium">6.2 删除标准</h3>
                  <p>我们在以下情况下删除数据：</p>
                  <ul>
                    <li>达到预定的保留期限</li>
                    <li>用户主动删除账户或内容</li>
                    <li>法律不再要求保留</li>
                    <li>数据对服务提供不再必要</li>
                  </ul>
                </div>
              </section>

              {/* 7. 您的权利 */}
              <section id="rights" className="border-b border-gray-200 pb-6">
                <h2 className="text-2xl font-semibold mb-4 text-gray-800">7. 您的权利</h2>
                <div className="prose prose-lg text-gray-600">
                  <p>根据适用的数据保护法律，您对您的个人信息享有以下权利：</p>

                  <h3 className="text-lg font-medium">7.1 访问权</h3>
                  <p>您有权了解我们收集的关于您的个人信息，包括数据类型、使用目的等。</p>

                  <h3 className="text-lg font-medium">7.2 更正权</h3>
                  <p>您可以更新或更正不准确或不完整的个人信息。</p>

                  <h3 className="text-lg font-medium">7.3 删除权</h3>
                  <p>在特定情况下，您可以要求删除您的个人信息（"被遗忘权"）。</p>

                  <h3 className="text-lg font-medium">7.4 限制处理权</h3>
                  <p>在某些情况下，您可以要求限制我们对您个人信息的处理。</p>

                  <h3 className="text-lg font-medium">7.5 数据可携权</h3>
                  <p>您有权以结构化、常用和机器可读的格式获取您的数据。</p>

                  <h3 className="text-lg font-medium">7.6 反对权</h3>
                  <p>您可以反对基于合法利益的数据处理或直接营销。</p>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-blue-800">
                      <strong>如何行使权利：</strong> 要行使这些权利，请通过 privacy@prompthub.zouguojun.com 联系我们，我们将在30天内回复您的请求。
                    </p>
                  </div>
                </div>
              </section>

              {/* 8. Cookie和追踪技术 */}
              <section id="cookies" className="border-b border-gray-200 pb-6">
                <h2 className="text-2xl font-semibold mb-4 text-gray-800">8. Cookie和追踪技术</h2>
                <div className="prose prose-lg text-gray-600">
                  <h3 className="text-lg font-medium">8.1 Cookie使用</h3>
                  <p>我们使用以下类型的Cookie：</p>
                  <ul>
                    <li><strong>必要Cookie：</strong> 网站正常运行所必需的</li>
                    <li><strong>功能Cookie：</strong> 记住您的偏好设置</li>
                    <li><strong>性能Cookie：</strong> 分析网站使用情况</li>
                    <li><strong>营销Cookie：</strong> 提供个性化广告（需要同意）</li>
                  </ul>

                  <h3 className="text-lg font-medium">8.2 Cookie管理</h3>
                  <p>
                    您可以通过浏览器设置控制Cookie。请注意，禁用某些Cookie可能影响网站功能。
                  </p>

                  <h3 className="text-lg font-medium">8.3 其他追踪技术</h3>
                  <p>我们还可能使用网络信标、像素标签等技术来收集使用信息。</p>
                </div>
              </section>

              {/* 9. 儿童隐私 */}
              <section id="children" className="border-b border-gray-200 pb-6">
                <h2 className="text-2xl font-semibold mb-4 text-gray-800">9. 儿童隐私</h2>
                <div className="prose prose-lg text-gray-600">
                  <p>
                    我们的服务不面向13岁以下的儿童。我们不会故意收集13岁以下儿童的个人信息。如果我们发现收集了此类信息，我们将立即删除。
                  </p>
                  <p>
                    如果您是家长或监护人，发现您的孩子向我们提供了个人信息，请联系我们，我们将采取措施删除此类信息。
                  </p>
                </div>
              </section>

              {/* 10. 国际数据传输 */}
              <section id="international" className="border-b border-gray-200 pb-6">
                <h2 className="text-2xl font-semibold mb-4 text-gray-800">10. 国际数据传输</h2>
                <div className="prose prose-lg text-gray-600">
                  <p>
                    由于我们使用国际云服务提供商，您的数据可能被传输到您所在国家/地区以外的地方进行处理和存储。
                  </p>
                  <p>
                    当我们跨境传输数据时，我们确保：
                  </p>
                  <ul>
                    <li>目标国家/地区具有充分的数据保护水平</li>
                    <li>通过合同条款确保数据保护</li>
                    <li>采用标准合同条款或其他合法传输机制</li>
                  </ul>
                </div>
              </section>

              {/* 11. 政策更新 */}
              <section id="updates" className="border-b border-gray-200 pb-6">
                <h2 className="text-2xl font-semibold mb-4 text-gray-800">11. 政策更新</h2>
                <div className="prose prose-lg text-gray-600">
                  <p>
                    我们可能会不时更新本隐私政策以反映我们做法的变化或法律要求的变更。重大变更将通过以下方式通知您：
                  </p>
                  <ul>
                    <li>在网站上发布显著通知</li>
                    <li>向注册用户发送电子邮件通知</li>
                    <li>在应用程序中显示更新提醒</li>
                  </ul>
                  <p>
                    更新后的政策将在发布30天后生效。继续使用服务表示您接受更新后的政策。
                  </p>
                </div>
              </section>

              {/* 12. 联系我们 */}
              <section id="contact">
                <h2 className="text-2xl font-semibold mb-4 text-gray-800">12. 联系我们</h2>
                <div className="prose prose-lg text-gray-600">
                  <p>
                    如果您对本隐私政策有任何问题、疑虑或要求，请通过以下方式联系我们：
                  </p>
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <p><strong>隐私事务邮箱：</strong></p>
                        <p>privacy@prompthub.zouguojun.com</p>
                      </div>
                      <div>
                        <p><strong>一般咨询邮箱：</strong></p>
                        <p>support@prompthub.zouguojun.com</p>
                      </div>
                      <div>
                        <p><strong>网站：</strong></p>
                        <p>https://prompthub.zouguojun.com</p>
                      </div>
                      <div>
                        <p><strong>联系页面：</strong></p>
                        <p><a href="/contact" className="text-blue-600 hover:underline">/contact</a></p>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-6">
                    我们承诺在收到您的隐私相关请求后30天内回复。对于复杂的请求，我们可能需要额外的时间，但会及时通知您延期原因。
                  </p>
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200 mt-4">
                    <p className="text-green-800 font-medium">
                      <strong>数据保护承诺：</strong> 我们致力于保护您的隐私权，并持续改进我们的数据保护做法以符合最高标准。
                    </p>
                  </div>
                </div>
              </section>
            </div>
          </div>

          {/* 快速链接 */}
          <div className="mt-8 grid md:grid-cols-2 gap-4">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-2">相关链接</h3>
              <ul className="space-y-2">
                <li><a href="/terms" className="text-blue-600 hover:underline">服务条款</a></li>
                <li><a href="/contact" className="text-blue-600 hover:underline">联系我们</a></li>
                <li><a href="/about" className="text-blue-600 hover:underline">关于我们</a></li>
              </ul>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-2">您的权利</h3>
              <p className="text-gray-600 text-sm">
                如需行使您的数据保护权利或有任何隐私相关问题，请随时联系我们的隐私团队。
              </p>
            </div>
          </div>

          {/* 返回首页按钮 */}
          <div className="text-center mt-8">
            <a
              href="/"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors"
            >
              返回首页
            </a>
          </div>
        </div>
      </div>
    </>
  );
};

export default Privacy; 