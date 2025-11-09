import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';

const Terms = () => {
  const [activeSection, setActiveSection] = useState<string>('');

  const _handleSectionClick = (sectionId: string) => {
    setActiveSection(activeSection === sectionId ? '' : sectionId);
  };

  return (
    <>
      <Head>
        <title>服务条款 - PromptHub</title>
        <meta name="description" content="PromptHub 服务条款和使用协议" />
      </Head>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* 页面标题 */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">服务条款</h1>
            <p className="text-lg text-gray-600">最后更新：2024年12月</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8">
            {/* 目录 */}
            <div className="mb-8 p-6 bg-blue-50 rounded-lg">
              <h2 className="text-xl font-semibold mb-4 text-blue-800">目录</h2>
              <ul className="space-y-2 text-blue-700">
                <li><a href="#acceptance" className="hover:underline">1. 接受条款</a></li>
                <li><a href="#description" className="hover:underline">2. 服务描述</a></li>
                <li><a href="#account" className="hover:underline">3. 账户使用</a></li>
                <li><a href="#content" className="hover:underline">4. 内容和知识产权</a></li>
                <li><a href="#conduct" className="hover:underline">5. 用户行为规范</a></li>
                <li><a href="#privacy" className="hover:underline">6. 隐私保护</a></li>
                <li><a href="#termination" className="hover:underline">7. 服务终止</a></li>
                <li><a href="#liability" className="hover:underline">8. 责任限制</a></li>
                <li><a href="#modification" className="hover:underline">9. 条款修改</a></li>
                <li><a href="#governing" className="hover:underline">10. 适用法律</a></li>
                <li><a href="#contact" className="hover:underline">11. 联系方式</a></li>
              </ul>
            </div>

            {/* 条款内容 */}
            <div className="space-y-8">
              {/* 1. 接受条款 */}
              <section id="acceptance" className="border-b border-gray-200 pb-6">
                <h2 className="text-2xl font-semibold mb-4 text-gray-800">1. 接受条款</h2>
                <div className="prose prose-lg text-gray-600">
                  <p>
                    欢迎使用 PromptHub！通过访问或使用我们的网站和服务，您同意受本服务条款（&quot;条款&quot;）的约束。如果您不同意这些条款，请不要使用我们的服务。
                  </p>
                  <p>
                    本条款构成您与 PromptHub（&quot;我们&quot;、&quot;我们的&quot;或&quot;平台&quot;）之间的法律协议。使用我们的服务表示您已阅读、理解并同意受这些条款的约束。
                  </p>
                </div>
              </section>

              {/* 2. 服务描述 */}
              <section id="description" className="border-b border-gray-200 pb-6">
                <h2 className="text-2xl font-semibold mb-4 text-gray-800">2. 服务描述</h2>
                <div className="prose prose-lg text-gray-600">
                  <p>
                    PromptHub 是一个AI提示管理和分享平台，为用户提供以下服务：
                  </p>
                  <ul>
                    <li>创建、编辑、存储和管理AI提示（Prompts）</li>
                    <li>浏览和搜索其他用户分享的提示</li>
                    <li>收藏和评价提示内容</li>
                    <li>用户账户管理和个人资料设置</li>
                    <li>社区交流和内容分享功能</li>
                  </ul>
                  <p>
                    我们保留随时修改、暂停或终止服务的权利，恕不另行通知。我们将努力提供稳定可靠的服务，但不保证服务的不间断性或完全无错误。
                  </p>
                </div>
              </section>

              {/* 3. 账户使用 */}
              <section id="account" className="border-b border-gray-200 pb-6">
                <h2 className="text-2xl font-semibold mb-4 text-gray-800">3. 账户使用</h2>
                <div className="prose prose-lg text-gray-600">
                  <h3 className="text-lg font-medium">3.1 账户注册</h3>
                  <p>
                    为了使用我们的某些功能，您需要创建一个账户。您必须提供准确、完整和最新的注册信息，并及时更新任何变更。
                  </p>
                  
                  <h3 className="text-lg font-medium">3.2 账户安全</h3>
                  <p>
                    您有责任维护账户密码的保密性，并对在您账户下发生的所有活动承担责任。如果您发现任何未经授权的使用，请立即通知我们。
                  </p>
                  
                  <h3 className="text-lg font-medium">3.3 账户要求</h3>
                  <ul>
                    <li>您必须年满13岁或达到您所在司法管辖区的最低年龄要求</li>
                    <li>一人只能拥有一个账户</li>
                    <li>不得与他人共享账户凭据</li>
                    <li>不得冒充他人或提供虚假身份信息</li>
                  </ul>
                </div>
              </section>

              {/* 4. 内容和知识产权 */}
              <section id="content" className="border-b border-gray-200 pb-6">
                <h2 className="text-2xl font-semibold mb-4 text-gray-800">4. 内容和知识产权</h2>
                <div className="prose prose-lg text-gray-600">
                  <h3 className="text-lg font-medium">4.1 用户内容</h3>
                  <p>
                    您保留对您创建和上传的内容（包括提示、评论、个人资料信息等）的所有权。通过在平台上发布内容，您授予我们非独占的、全球性的、免费的许可，用于：
                  </p>
                  <ul>
                    <li>在平台上显示、分发和推广您的内容</li>
                    <li>为改进服务而分析和使用内容</li>
                    <li>在法律要求时保存和备份内容</li>
                  </ul>
                  
                  <h3 className="text-lg font-medium">4.2 平台内容</h3>
                  <p>
                    PromptHub 平台的设计、功能、代码、商标和其他知识产权归我们所有，受知识产权法保护。
                  </p>
                  
                  <h3 className="text-lg font-medium">4.3 内容责任</h3>
                  <p>
                    您对您发布的所有内容承担完全责任，包括其合法性、可靠性、适当性等。您保证您的内容不会侵犯任何第三方的权利。
                  </p>
                </div>
              </section>

              {/* 5. 用户行为规范 */}
              <section id="conduct" className="border-b border-gray-200 pb-6">
                <h2 className="text-2xl font-semibold mb-4 text-gray-800">5. 用户行为规范</h2>
                <div className="prose prose-lg text-gray-600">
                  <p>使用我们的服务时，您同意不从事以下行为：</p>
                  
                  <h3 className="text-lg font-medium">5.1 禁止的内容</h3>
                  <ul>
                    <li>发布非法、有害、威胁性、辱骂性、骚扰性内容</li>
                    <li>发布侵犯他人知识产权的内容</li>
                    <li>发布虚假信息或误导性内容</li>
                    <li>发布垃圾信息、广告或未经请求的商业内容</li>
                    <li>发布恶意代码或病毒</li>
                  </ul>
                  
                  <h3 className="text-lg font-medium">5.2 禁止的行为</h3>
                  <ul>
                    <li>干扰或破坏服务的正常运行</li>
                    <li>尝试未经授权访问其他用户账户或系统</li>
                    <li>使用自动化工具进行数据抓取</li>
                    <li>创建虚假账户或进行欺诈活动</li>
                    <li>违反任何适用的法律法规</li>
                  </ul>
                </div>
              </section>

              {/* 6. 隐私保护 */}
              <section id="privacy" className="border-b border-gray-200 pb-6">
                <h2 className="text-2xl font-semibold mb-4 text-gray-800">6. 隐私保护</h2>
                <div className="prose prose-lg text-gray-600">
                  <p>
                    我们重视您的隐私，我们的隐私政策详细说明了我们如何收集、使用和保护您的个人信息。使用我们的服务即表示您同意我们按照隐私政策处理您的信息。
                  </p>
                  <p>
                    请查看我们的 <Link href="/privacy" className="text-blue-600 hover:underline">隐私政策</Link> 了解详细信息。
                  </p>
                </div>
              </section>

              {/* 7. 服务终止 */}
              <section id="termination" className="border-b border-gray-200 pb-6">
                <h2 className="text-2xl font-semibold mb-4 text-gray-800">7. 服务终止</h2>
                <div className="prose prose-lg text-gray-600">
                  <h3 className="text-lg font-medium">7.1 用户终止</h3>
                  <p>
                    您可以随时停止使用我们的服务并删除您的账户。账户删除后，我们将在合理时间内删除您的个人信息，但可能保留某些信息以符合法律要求。
                  </p>
                  
                  <h3 className="text-lg font-medium">7.2 平台终止</h3>
                  <p>
                    我们保留在以下情况下暂停或终止您的账户的权利：
                  </p>
                  <ul>
                    <li>违反本服务条款</li>
                    <li>从事非法或有害活动</li>
                    <li>长期不活跃的账户</li>
                    <li>技术或安全原因</li>
                  </ul>
                </div>
              </section>

              {/* 8. 责任限制 */}
              <section id="liability" className="border-b border-gray-200 pb-6">
                <h2 className="text-2xl font-semibold mb-4 text-gray-800">8. 责任限制</h2>
                <div className="prose prose-lg text-gray-600">
                  <h3 className="text-lg font-medium">8.1 服务保证</h3>
                  <p>
                    我们的服务按&quot;现状&quot;提供，不提供任何明示或暗示的保证。我们不保证服务将不间断、无错误或完全安全。
                  </p>
                  
                  <h3 className="text-lg font-medium">8.2 损害赔偿</h3>
                  <p>
                    在法律允许的最大范围内，我们不对任何间接、特殊、附带或后果性损害承担责任，包括但不限于利润损失、数据丢失等。
                  </p>
                  
                  <h3 className="text-lg font-medium">8.3 责任上限</h3>
                  <p>
                    我们对您的总责任（无论基于合同、侵权或其他法律理论）不超过您在过去12个月内向我们支付的金额。
                  </p>
                </div>
              </section>

              {/* 9. 条款修改 */}
              <section id="modification" className="border-b border-gray-200 pb-6">
                <h2 className="text-2xl font-semibold mb-4 text-gray-800">9. 条款修改</h2>
                <div className="prose prose-lg text-gray-600">
                  <p>
                    我们保留随时修改这些条款的权利。重大修改将通过以下方式通知您：
                  </p>
                  <ul>
                    <li>在网站上发布通知</li>
                    <li>通过电子邮件通知注册用户</li>
                    <li>在应用程序中显示通知</li>
                  </ul>
                  <p>
                    修改后的条款将在发布后30天生效。继续使用服务表示您接受修改后的条款。
                  </p>
                </div>
              </section>

              {/* 10. 适用法律 */}
              <section id="governing" className="border-b border-gray-200 pb-6">
                <h2 className="text-2xl font-semibold mb-4 text-gray-800">10. 适用法律</h2>
                <div className="prose prose-lg text-gray-600">
                  <p>
                    本条款受中华人民共和国法律管辖并按其解释。因本条款引起的任何争议应首先通过友好协商解决；协商不成的，应提交有管辖权的人民法院解决。
                  </p>
                  <p>
                    如果本条款的任何部分被认定为无效或不可执行，其余部分仍然有效。
                  </p>
                </div>
              </section>

              {/* 11. 联系方式 */}
              <section id="contact">
                <h2 className="text-2xl font-semibold mb-4 text-gray-800">11. 联系方式</h2>
                <div className="prose prose-lg text-gray-600">
                  <p>
                    如果您对本服务条款有任何问题或疑虑，请通过以下方式联系我们：
                  </p>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p><strong>邮箱：</strong> legal@prompthub.zouguojun.com</p>
                    <p><strong>网站：</strong> https://prompthub.zouguojun.com</p>
                    <p><strong>联系页面：</strong> <Link href="/contact" className="text-blue-600 hover:underline">/contact</Link></p>
                  </div>
                  <p className="text-sm text-gray-500 mt-4">
                    本服务条款于2024年12月生效，可能会不定期更新。请定期查看以了解最新版本。
                  </p>
                </div>
              </section>
            </div>
          </div>

          {/* 返回首页按钮 */}
          <div className="text-center mt-8">
            <Link
              href="/"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              返回首页
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default Terms; 