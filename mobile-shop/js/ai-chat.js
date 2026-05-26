/**
 * ai-chat.js - AI智能导购功能
 * ============================================================
 * 用途：实现商品详情页的AI导购对话框功能，包括：
 *   - 悬浮按钮点击弹窗
 *   - 聊天消息渲染
 *   - Coze API调用（fetch请求）
 *
 * 核心依赖：无（纯原生JavaScript）
 *
 * Coze API说明：
 * - 接口地址: POST https://api.coze.cn/v1/chat/completions
 * - 认证方式: Bearer Token
 * - 请求体: { bot_id, user_id, stream, messages }
 *
 * 学生使用步骤：
 * 1. 登录 coze.cn 创建Bot
 * 2. 获取Bot ID和API Token
 * 3. 替换下方 COZE_CONFIG 中的占位符
 * ============================================================
 */

(function (win, doc) {
  'use strict';

  // ==================== Coze API 配置 ====================
  // TODO: 替换为你自己的Bot ID和API Token
  var COZE_CONFIG = {
    bot_id: 'YOUR_BOT_ID',          // 替换为你的Coze Bot ID
    token: 'YOUR_API_TOKEN',        // 替换为你的Coze API Token
    api_url: 'https://api.coze.cn/v1/chat/completions',
    user_id: 'student_demo_user'    // 用户标识（教学用固定值）
  };

  // ==================== AI导购主对象 ====================

  var AIChat = {

    // DOM元素引用
    overlay: null,       // 遮罩层
    dialog: null,        // 对话框
    messagesArea: null,  // 消息列表区域
    inputArea: null,     // 输入框
    sendBtn: null,       // 发送按钮
    floatBtn: null,      // 悬浮按钮

    // 消息历史记录（用于保持对话上下文）
    messageHistory: [],

    // 是否正在等待AI回复
    isLoading: false,

    /**
     * 初始化AI导购功能
     * 创建DOM结构、绑定事件
     */
    init: function () {
      var isDetailPage = doc.querySelector('.detail-content') !== null;

      // 非详情页不初始化
      if (!isDetailPage) return;

      this.createFloatButton();
      this.createDialog();
      this.cacheElements();
      this.bindEvents();
    },

    /**
     * 创建右下角悬浮圆形按钮
     */
    createFloatButton: function () {
      var btn = doc.createElement('div');
      btn.className = 'ai-float-btn';
      btn.innerHTML = '<i class="iconfont ri-customer-service-2-line"></i>';
      btn.setAttribute('title', 'AI智能导购');
      btn.addEventListener('click', function () {
        window.location.href = 'ai-chat.html';
      });
      doc.body.appendChild(btn);
    },

    /**
     * 创建AI导购对话框的完整HTML结构
     * 结构：遮罩层 > 对话框 > 标题栏 + 消息区 + 输入区
     */
    createDialog: function () {
      var html = '';
      html += '<div class="ai-overlay">';
      html += '  <div class="ai-dialog">';
      // 标题栏
      html += '    <div class="ai-dialog-header">';
      html += '      <span class="ai-title">';
      html += '        <i class="iconfont ri-customer-service-2-line"></i>';
      html += '        AI导购助手';
      html += '      </span>';
      html += '      <span class="btn-close">';
      html += '        <i class="iconfont ri-close-line"></i>';
      html += '      </span>';
      html += '    </div>';
      // 消息列表区域
      html += '    <div class="ai-messages"></div>';
      // 输入区域
      html += '    <div class="ai-input-area">';
      html += '      <input type="text" placeholder="输入你想咨询的问题..." />';
      html += '      <button class="btn-send">';
      html += '        <i class="iconfont ri-send-plane-line"></i>';
      html += '      </button>';
      html += '    </div>';
      html += '  </div>';
      html += '</div>';

      // 将HTML字符串插入到body末尾
      doc.body.insertAdjacentHTML('beforeend', html);
    },

    /**
     * 缓存DOM元素引用，避免重复查询
     */
    cacheElements: function () {
      this.overlay = doc.querySelector('.ai-overlay');
      this.dialog = doc.querySelector('.ai-dialog');
      this.messagesArea = doc.querySelector('.ai-messages');
      this.inputArea = doc.querySelector('.ai-input-area input');
      this.sendBtn = doc.querySelector('.ai-input-area .btn-send');
      this.floatBtn = doc.querySelector('.ai-float-btn');
    },

    /**
     * 绑定各种交互事件
     */
    bindEvents: function () {
      var self = this;

      // 遮罩层点击 -> 关闭对话框
      this.overlay.addEventListener('click', function (e) {
        if (e.target === self.overlay) {
          self.close();
        }
      });

      // 关闭按钮点击
      var closeBtn = this.overlay.querySelector('.btn-close');
      closeBtn.addEventListener('click', function () {
        self.close();
      });

      // 发送按钮点击 -> 发送消息
      this.sendBtn.addEventListener('click', function () {
        self.sendMessage();
      });

      // 输入框回车键 -> 发送消息
      this.inputArea.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.keyCode === 13) {
          e.preventDefault();
          self.sendMessage();
        }
      });
    },

    /**
     * 打开对话框
     * 添加open类触发CSS过渡动画
     */
    open: function () {
      this.overlay.classList.add('open');
      // 自动聚焦输入框
      setTimeout(function (self) {
        self.inputArea.focus();
      }, 300, this);
    },

    /**
     * 关闭对话框
     * 移除open类
     */
    close: function () {
      this.overlay.classList.remove('open');
    },

    /**
     * 发送用户消息并获取AI回复
     */
    sendMessage: function () {
      var text = this.inputArea.value.trim();
      if (!text) {
        // 输入为空，显示提示
        this.showToast('请输入您的问题');
        return;
      }

      // 如果正在等待回复，禁止重复发送
      if (this.isLoading) {
        this.showToast('请等待AI回复后再发送');
        return;
      }

      // 清空输入框
      this.inputArea.value = '';

      // 添加用户消息到聊天区
      this.appendMessage('user', text);

      // 调用AI接口获取回复
      this.requestAI(text);
    },

    /**
     * 向聊天区添加一条消息
     * @param {string} role - 消息角色: 'user'（用户） 或 'ai'（AI助手）
     * @param {string} text - 消息文本内容
     * @param {boolean} isTyping - 是否为AI正在输入的动画（可选）
     */
    appendMessage: function (role, text, isTyping) {
      var msgDiv = doc.createElement('div');
      msgDiv.className = 'ai-message ' + (role === 'user' ? 'user-msg' : 'ai-msg');

      if (isTyping) {
        // AI正在输入提示
        msgDiv.classList.add('ai-typing');
        msgDiv.innerHTML = '<div class="msg-avatar">' +
                           '<i class="iconfont ri-customer-service-2-line"></i>' +
                           '</div>' +
                           '<div class="msg-bubble">' +
                           '<span class="typing-dot"></span>' +
                           '<span class="typing-dot"></span>' +
                           '<span class="typing-dot"></span>' +
                           '</div>';
      } else if (role === 'user') {
        // 用户消息（右侧紫色气泡）
        msgDiv.innerHTML = '<div class="msg-bubble">' + escapeHTML(text) + '</div>';
      } else {
        // AI助手消息（左侧白色气泡，带头像）
        msgDiv.innerHTML = '<div class="msg-avatar">' +
                           '<i class="iconfont ri-customer-service-2-line"></i>' +
                           '</div>' +
                           '<div class="msg-bubble">' + escapeHTML(text) + '</div>';
      }

      this.messagesArea.appendChild(msgDiv);

      // 滚动到最新消息
      this.scrollToBottom();
    },

    /**
     * 移除AI正在输入的动画消息
     */
    removeTyping: function () {
      var typingMsg = this.messagesArea.querySelector('.ai-typing');
      if (typingMsg) {
        typingMsg.remove();
      }
    },

    /**
     * 滚动消息列表到最底部
     */
    scrollToBottom: function () {
      var self = this;
      // 使用requestAnimationFrame确保DOM更新后再滚动
      requestAnimationFrame(function () {
        self.messagesArea.scrollTop = self.messagesArea.scrollHeight;
      });
    },

    /**
     * 调用Coze API获取AI回复
     * @param {string} question - 用户问题
     *
     * Coze Chat API 文档参考：
     * https://www.coze.cn/docs/developer_guides/chat_v3
     *
     * 请求参数说明：
     * - bot_id:    (必填) Bot的ID
     * - user_id:   (必填) 用户的唯一标识
     * - stream:    (可选) 是否流式返回，默认false
     * - messages:  (必填) 对话消息数组，
     *              包含 [{role: "user", content: "问题"}]
     */
    requestAI: function (question) {
      // 检查API配置是否已替换
      if (COZE_CONFIG.bot_id === 'YOUR_BOT_ID' ||
          COZE_CONFIG.token === 'YOUR_API_TOKEN') {
        // 未替换配置时使用模拟回复
        this.simulateReply(question);
        return;
      }

      var self = this;

      // 标记为加载中状态
      self.isLoading = true;

      // 显示AI正在输入动画
      self.appendMessage('ai', '', true);

      // 构建请求参数
      var requestBody = {
        bot_id: COZE_CONFIG.bot_id,
        user_id: COZE_CONFIG.user_id,
        stream: false,
        messages: [
          {
            role: 'user',
            content: question
          }
        ]
      };

      // 发起fetch请求
      fetch(COZE_CONFIG.api_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + COZE_CONFIG.token
        },
        body: JSON.stringify(requestBody)
      })
        .then(function (response) {
          // 检查HTTP状态码
          if (!response.ok) {
            throw new Error('网络请求失败，状态码：' + response.status);
          }
          return response.json();
        })
        .then(function (data) {
          // 移除正在输入动画
          self.removeTyping();
          self.isLoading = false;

          // 解析Coze返回数据
          // 标准返回格式: { code: 0, data: { messages: [...] } }
          if (data.code === 0 && data.data && data.data.messages) {
            var messages = data.data.messages;
            // 找到最后一条assistant角色的消息
            var assistantMsg = null;
            for (var i = messages.length - 1; i >= 0; i--) {
              if (messages[i].role === 'assistant') {
                assistantMsg = messages[i];
                break;
              }
            }

            if (assistantMsg && assistantMsg.content) {
              // 渲染AI回复内容
              self.appendMessage('ai', assistantMsg.content);
            } else {
              self.appendMessage('ai', '抱歉，我暂时无法回答这个问题，请稍后再试。');
            }
          } else {
            // API返回错误信息
            var errorMsg = (data.msg) || '请求失败，请检查API配置。';
            self.appendMessage('ai', '错误：' + errorMsg);
          }
        })
        .catch(function (error) {
          // 网络错误或请求异常
          self.removeTyping();
          self.isLoading = false;

          console.error('AI导购请求失败：', error);
          self.appendMessage('ai', '抱歉，网络连接失败，请检查网络后重试。\n错误信息：' + error.message);
        });
    },

    /**
     * 模拟AI回复（演示模式）
     * 当学生未配置Coze API时，使用预设回复模拟对话效果
     * @param {string} question - 用户问题
     */
    simulateReply: function (question) {
      var self = this;

      // 标记加载中
      self.isLoading = true;

      // 显示正在输入动画
      self.appendMessage('ai', '', true);

      // 模拟网络延迟（1-2秒随机，更真实）
      var delay = 800 + Math.random() * 1200;

      setTimeout(function () {
        // 移除正在输入动画
        self.removeTyping();
        self.isLoading = false;

        // 根据关键词匹配不同回复（简单的匹配逻辑）
        var reply = self.getSimulatedReply(question);
        self.appendMessage('ai', reply);
      }, delay);
    },

    /**
     * 根据问题关键词匹配模拟回复
     * @param {string} question - 用户问题
     * @returns {string} 模拟的AI回复
     */
    getSimulatedReply: function (question) {
      var q = question.toLowerCase();

      // 价格相关
      if (q.indexOf('价格') !== -1 || q.indexOf('多少钱') !== -1 || q.indexOf('便宜') !== -1) {
        return '这款商品目前正在促销活动中，领券后到手价更优惠哦！\n\n当前页面显示的是最新价格，建议加入购物车后查看是否有额外优惠券。如果有任何疑问，可以随时联系客服确认。';
      }

      // 质量相关
      if (q.indexOf('质量') !== -1 || q.indexOf('好用') !== -1 || q.indexOf('怎么样') !== -1) {
        return '这款商品口碑非常好！\n\n我们精选优质商品，已有很多用户购买并给出好评。商品详情页展示了规格参数和实物图片，您可以仔细查看。如有质量问题支持7天无理由退换。';
      }

      // 颜色/规格相关
      if (q.indexOf('颜色') !== -1 || q.indexOf('规格') !== -1 || q.indexOf('尺寸') !== -1) {
        return '请在上方的规格选择区域查看可选颜色和尺寸哦~\n\n点击对应规格按钮即可切换查看，不同规格的价格可能略有差异。如果有需要，我可以帮您推荐最热门的规格。';
      }

      // 发货/物流相关
      if (q.indexOf('发货') !== -1 || q.indexOf('快递') !== -1 || q.indexOf('物流') !== -1) {
        return '下单后通常24小时内发货，合作的快递包括中通、圆通、顺丰等。\n\n一般情况下，大部分地区3-5天可以收到。具体到货时间以物流信息为准，您下单后可以在订单详情中实时追踪物流状态。';
      }

      // 优惠/折扣相关
      if (q.indexOf('优惠') !== -1 || q.indexOf('折扣') !== -1 || q.indexOf('券') !== -1) {
        return '目前有以下优惠活动可以选择：\n1. 新人专享券 - 满99减15\n2. 店铺满减 - 满199减30\n3. 限时秒杀 - 部分商品直降\n\n点击"立即购买"时系统会自动匹配最优优惠方案。';
      }

      // 售后相关
      if (q.indexOf('售后') !== -1 || q.indexOf('退') !== -1 || q.indexOf('换') !== -1) {
        return '我们提供完善的售后服务保障：\n• 7天无理由退换货\n• 质量问题包退包换\n• 24小时在线客服\n\n如果遇到任何问题，请及时联系客服处理，我们会在第一时间为您解决！';
      }

      // 推荐/建议相关
      if (q.indexOf('推荐') !== -1 || q.indexOf('建议') !== -1 || q.indexOf('哪个好') !== -1) {
        return '根据热销数据和用户评价，我为您推荐以下几点：\n1. 商品的评分和好评率\n2. 性价比最高的规格\n3. 近期购买的优惠活动\n\n您可以根据自己的预算和需求来选择，如果有具体偏好可以告诉我哦~';
      }

      // 默认通用回复
      var replies = [
        '您好！我是AI导购助手，很高兴为您服务！\n\n关于这款商品，您想了解哪方面的信息呢？比如价格、规格、发货时间等，我都可以帮您解答。',
        '感谢您的咨询！\n\n我们的商品都是正品保证，支持验货。如果您对当前商品有疑问，可以查看商品详情或联系客服确认哦~',
        '好的，我收到了您的问题！\n\n建议您先看看商品详情页的描述和用户评价，如果还有疑问，随时告诉我，我会尽力帮您解决！'
      ];

      // 随机返回一条通用回复
      return replies[Math.floor(Math.random() * replies.length)];
    },

    /**
     * 在对话框内显示提示信息（简单的Toast）
     * @param {string} msg - 提示文字
     */
    showToast: function (msg) {
      // 复用 Common 全局对象的 toast 方法
      if (win.Common && win.Common.toast) {
        win.Common.toast(msg);
      } else {
        // 降级方案：alert提示
        alert(msg);
      }
    }

  };

  // ==================== HTML转义工具函数 ====================

  /**
   * 将特殊字符转义为HTML实体，防止XSS攻击
   * @param {string} str - 原始字符串
   * @returns {string} 转义后的安全字符串
   */
  function escapeHTML(str) {
    if (!str) return '';
    var div = doc.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ==================== 页面加载完成后初始化 ====================

  // 使用DOMContentLoaded确保DOM完全加载后初始化
  if (doc.readyState === 'loading') {
    doc.addEventListener('DOMContentLoaded', function () {
      AIChat.init();
    });
  } else {
    // DOM已经加载完毕，直接初始化
    AIChat.init();
  }

})(window, document);
