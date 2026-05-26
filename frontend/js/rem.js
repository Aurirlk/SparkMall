/**
 * rem.js - rem自适应脚本
 * ============================================================
 * 用途：根据屏幕宽度动态设置HTML根元素的字体大小，
 *       实现移动端rem适配方案。
 *
 * 原理：以设计稿宽度375px为基准，将屏幕分为10等份，
 *       每份作为1rem的大小。
 *       例如：iPhone 6/7/8 (375px) -> 1rem = 37.5px
 *             iPhone 6/7/8 Plus (414px) -> 1rem = 41.4px
 *
 * 使用方法：在HTML的<head>标签中优先引入此文件
 *   <script src="js/rem.js"></script>
 * ============================================================
 */

(function (doc, win) {
  'use strict';

  // 设计稿基准宽度（与UI设计稿保持一致）
  var BASE_WIDTH = 375;
  // 等分份数，设计稿宽 / 份数 = 1rem像素值
  var DIVIDE_PARTS = 10;
  // 页面最大宽度限制（防止在平板上过度拉伸）
  var MAX_WIDTH = 640;

  // 获取HTML根元素
  var docEl = doc.documentElement;
  // 用于监听屏幕方向变化或尺寸变化的事件名
  var resizeEvent = 'orientationchange' in win ? 'orientationchange' : 'resize';

  /**
   * 重新计算并设置根字体大小
   * 核心公式：fontSize = 屏幕宽度 / 等分份数
   * 当屏幕宽度超过最大限制时，使用最大宽度计算
   */
  function recalculate() {
    // 获取当前视口宽度
    var clientWidth = docEl.clientWidth;

    // 如果视口宽度为0（极少数情况），直接返回
    if (!clientWidth) return;

    // 限制最大宽度，超过MAX_WIDTH时使用MAX_WIDTH
    if (clientWidth > MAX_WIDTH) {
      clientWidth = MAX_WIDTH;
    }

    // 计算并设置根字体大小
    // 公式：fontSize = clientWidth / DIVIDE_PARTS
    // 例如：375 / 10 = 37.5px，即 1rem = 37.5px
    var fontSize = clientWidth / DIVIDE_PARTS;
    docEl.style.fontSize = fontSize + 'px';

    // 在控制台输出调试信息（教学时可取消注释）
    // console.log('当前视口宽度：' + clientWidth + 'px，1rem = ' + fontSize + 'px');
  }

  // 页面加载完成后立即执行一次计算
  // 使用 DOMContentLoaded 确保DOM已就绪
  if (doc.readyState === 'loading') {
    doc.addEventListener('DOMContentLoaded', recalculate);
  } else {
    recalculate();
  }

  // 监听窗口尺寸变化和屏幕旋转，实时更新
  // 使用防抖优化，避免频繁触发引起性能问题
  var timer = null;
  win.addEventListener(resizeEvent, function () {
    clearTimeout(timer);
    timer = setTimeout(recalculate, 100); // 100ms防抖延迟
  }, false);

  // 页面完全加载后再次校准（防止某些浏览器在加载时计算不准确）
  win.addEventListener('load', function () {
    recalculate();
    // 延迟300ms再校准一次，兼容部分安卓机型
    setTimeout(recalculate, 300);
  }, false);

})(document, window);
