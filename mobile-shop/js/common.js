/**
 * common.js - 通用交互功能
 * ============================================================
 * 用途：封装项目中通用的UI交互逻辑，包括：
 *   - Toast 提示弹层
 *   - 底部Tab导航切换
 *   - 轮播图自动播放
 *   - 秒杀倒计时
 *   - 购物车按钮点击反馈
 *
 * 所有函数均以全局 Common 对象暴露，方便各页面调用
 * ============================================================
 */

(function (win) {
  'use strict';

  /**
   * Common 全局工具对象
   * 所有通用功能挂载在此对象下，避免全局变量污染
   */
  var Common = {

    // ==================== Toast 提示功能 ====================

    /**
     * 显示Toast提示消息
     * @param {string} message - 要显示的提示文字
     * @param {number} duration - 显示时长（毫秒），默认1500ms
     *
     * 原理：动态创建/复用Toast DOM元素，通过CSS transition实现淡入淡出
     */
    toast: function (message, duration) {
      duration = duration || 1500;

      // 尝试复用已有的toast元素，避免重复创建DOM
      var toastEl = document.querySelector('.toast');
      if (!toastEl) {
        // 首次使用时创建Toast元素
        toastEl = document.createElement('div');
        toastEl.className = 'toast';
        document.body.appendChild(toastEl);
      }

      // 设置提示文字
      toastEl.textContent = message;

      // 强制回流后再添加show类，确保transition动画生效
      toastEl.offsetHeight; // 触发布局重排（回流）
      toastEl.classList.add('show');

      // 定时隐藏Toast
      clearTimeout(toastEl._timer);
      toastEl._timer = setTimeout(function () {
        toastEl.classList.remove('show');
      }, duration);
    },

    // ==================== 底部Tab导航切换 ====================

    /**
     * 初始化底部Tab导航的点击切换行为
     * 点击非当前页Tab时跳转到对应页面
     *
     * 说明：此函数在三个页面中分别调用，
     *       当前页对应的Tab通过HTML中预设的 active 类名高亮
     */
    initTabbar: function () {
      var tabItems = document.querySelectorAll('.tabbar .tab-item');

      // 为每个Tab绑定点击事件
      for (var i = 0; i < tabItems.length; i++) {
        (function (item) {
          item.addEventListener('click', function () {
            // 获取目标页面链接（通过data-link属性）
            var link = this.getAttribute('data-link');

            // 如果已经是当前页，提示用户
            if (this.classList.contains('active')) {
              Common.toast('当前已是该页面');
              return;
            }

            // 跳转到目标页面
            if (link) {
              win.location.href = link;
            }
          });
        })(tabItems[i]);
      }
    },

    // ==================== 轮播图功能 ====================

    /**
     * 初始化轮播图
     * @param {string} containerSelector - 轮播图容器选择器，默认 '.banner-section'
     * @param {number} interval - 自动播放间隔（毫秒），默认3000ms
     *
     * 功能说明：
     * - 自动循环播放
     * - 触摸滑动支持（移动端手势）
     * - 指示器圆点同步更新
     */
    initBanner: function (containerSelector, interval) {
      var container = document.querySelector(containerSelector || '.banner-section');
      if (!container) return;

      var track = container.querySelector('.banner-track');
      var slides = container.querySelectorAll('.banner-slide');
      var dotsContainer = container.querySelector('.banner-dots');

      if (!track || !slides.length) return;

      var slideCount = slides.length;      // 幻灯片总数
      var currentIndex = 0;                // 当前显示索引
      var autoTimer = null;                // 自动播放定时器
      var touchStartX = 0;                 // 触摸起始X坐标
      var touchMoveX = 0;                  // 触摸移动X坐标
      var isSwiping = false;              // 是否正在滑动
      var playInterval = interval || 3000; // 自动播放间隔

      // ---------- 动态创建指示器圆点 ----------
      if (!dotsContainer) {
        dotsContainer = document.createElement('div');
        dotsContainer.className = 'banner-dots';
        container.appendChild(dotsContainer);

        // 根据幻灯片数量创建对应圆点
        for (var i = 0; i < slideCount; i++) {
          var dot = document.createElement('span');
          dot.className = 'dot' + (i === 0 ? ' active' : '');
          dot.setAttribute('data-index', i);

          // 点击圆点切换幻灯片
          (function (index) {
            dot.addEventListener('click', function () {
              goToSlide(index);
              resetAutoPlay();
            });
          })(i);

          dotsContainer.appendChild(dot);
        }
      }

      /**
       * 切换到指定索引的幻灯片
       * @param {number} index - 目标幻灯片索引
       */
      function goToSlide(index) {
        // 边界检查
        if (index < 0) { index = slideCount - 1; }
        if (index >= slideCount) { index = 0; }

        currentIndex = index;

        // 使用CSS transform移动轮播轨道
        // translateX(-100% * 当前索引)，每张幻灯片宽100%
        track.style.transform = 'translateX(-' + (currentIndex * 100) + '%)';

        // 更新指示器圆点状态
        var dots = dotsContainer.querySelectorAll('.dot');
        for (var i = 0; i < dots.length; i++) {
          dots[i].classList.remove('active');
          if (i === currentIndex) {
            dots[i].classList.add('active');
          }
        }
      }

      /**
       * 自动播放下一张
       */
      function autoPlay() {
        goToSlide(currentIndex + 1);
      }

      /**
       * 启动自动播放
       */
      function startAutoPlay() {
        stopAutoPlay();
        if (slideCount > 1) {
          autoTimer = setInterval(autoPlay, playInterval);
        }
      }

      /**
       * 停止自动播放
       */
      function stopAutoPlay() {
        if (autoTimer) {
          clearInterval(autoTimer);
          autoTimer = null;
        }
      }

      /**
       * 重置自动播放计时（用户手动切换后重新计时）
       */
      function resetAutoPlay() {
        stopAutoPlay();
        startAutoPlay();
      }

      // ---------- 触摸滑动事件（移动端手势） ----------
      track.addEventListener('touchstart', function (e) {
        // 记录触摸起始位置
        touchStartX = e.touches[0].clientX;
        isSwiping = true;
        stopAutoPlay(); // 用户触摸时暂停自动播放
        track.style.transition = 'none'; // 暂时取消过渡动画
      }, { passive: true });

      track.addEventListener('touchmove', function (e) {
        if (!isSwiping) return;
        touchMoveX = e.touches[0].clientX;
        // 计算滑动偏移量并实时更新轨道位置
        var offset = touchMoveX - touchStartX;
        track.style.transform = 'translateX(' + (offset - currentIndex * 100) + '%)';
      }, { passive: true });

      track.addEventListener('touchend', function (e) {
        if (!isSwiping) return;
        isSwiping = false;

        // 恢复过渡动画
        track.style.transition = 'transform 0.3s ease';

        // 计算滑动距离，判断是否切换幻灯片
        var offset = touchMoveX - touchStartX;
        var threshold = 50; // 最小滑动阈值（px）

        if (Math.abs(offset) > threshold) {
          // 左滑（下一张）：offset为负
          // 右滑（上一张）：offset为正
          var direction = offset > 0 ? -1 : 1;
          goToSlide(currentIndex + direction);
        } else {
          // 滑动距离不够，回弹到当前幻灯片
          goToSlide(currentIndex);
        }

        // 重置触摸变量
        touchStartX = 0;
        touchMoveX = 0;

        // 重新启动自动播放
        startAutoPlay();
      });

      // ---------- 启动自动播放 ----------
      startAutoPlay();
    },

    // ==================== 秒杀倒计时功能 ====================

    /**
     * 初始化秒杀倒计时
     * @param {string} selector - 倒计时容器的选择器，默认 '.flash-sale .countdown'
     *
     * 说明：实时显示距离当天24:00的倒计时（模拟秒杀结束时间）
     */
    initCountdown: function (selector) {
      var container = document.querySelector(selector || '.flash-sale .countdown');
      if (!container) return;

      // 存储倒计时数字元素的引用
      var hourEl = container.querySelector('.hour');
      var minEl = container.querySelector('.min');
      var secEl = container.querySelector('.sec');

      if (!hourEl || !minEl || !secEl) return;

      /**
       * 更新倒计时显示
       */
      function update() {
        var now = new Date();
        // 计算距离当天24:00的剩余时间（毫秒）
        var endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        var remaining = endOfDay - now;

        // 如果当天已过23:59:59，重置为明天的倒计时
        if (remaining <= 0) {
          remaining = 0;
        }

        // 将毫秒转换为时、分、秒
        var hours = Math.floor(remaining / (1000 * 60 * 60));
        var minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
        var seconds = Math.floor((remaining % (1000 * 60)) / 1000);

        // 补零显示（个位数前加"0"）
        hourEl.textContent = padZero(hours);
        minEl.textContent = padZero(minutes);
        secEl.textContent = padZero(seconds);
      }

      /**
       * 数字补零
       * @param {number} num - 原始数字
       * @returns {string} 补零后的字符串
       */
      function padZero(num) {
        return num < 10 ? '0' + num : '' + num;
      }

      // 立即更新一次
      update();
      // 每秒更新倒计时
      setInterval(update, 1000);
    },

    // ==================== 加入购物车点击反馈 ====================

    /**
     * 为所有"加入购物车"按钮绑定点击提示
     * 在首页、列表页、详情页均可使用
     */
    initAddCartButtons: function () {
      // 使用事件委托，在document上监听点击事件
      // 这样无需为每个按钮单独绑定，性能更好
      document.addEventListener('click', function (e) {
        // 向上查找最近的 .btn-cart 或 .btn-add-cart 元素
        var target = e.target.closest('.btn-cart, .btn-add-cart');
        if (target) {
          // 阻止事件冒泡（防止触发卡片点击）
          e.preventDefault();
          // 显示加入购物车提示
          Common.toast('已加入购物车');
        }
      });
    },

    // ==================== 搜索栏交互 ====================

    /**
     * 初始化搜索栏
     * 按回车键时，跳转到列表页并带上搜索关键词
     */
    initSearch: function () {
      var searchInput = document.querySelector('.search-box input');
      if (!searchInput) return;

      // 监听回车键搜索
      searchInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.keyCode === 13) {
          var keyword = this.value.trim();
          if (keyword) {
            // 跳转到列表页，通过URL参数传递搜索关键词
            win.location.href = 'list.html?keyword=' + encodeURIComponent(keyword);
          } else {
            Common.toast('请输入搜索关键词');
          }
        }
      });
    }

  };

  // 将 Common 对象挂载到全局 window 下
  win.Common = Common;

})(window);
