/**
 * settings.js - 设置页面交互逻辑
 * ============================================================
 * 功能：
 *   - 开关切换
 *   - 各设置项点击反馈
 *   - 清理缓存
 *   - 退出登录确认
 * ============================================================
 */

(function (win, doc) {
  'use strict';

  var Settings = {

    /**
     * 初始化
     */
    init: function () {
      this.bindEvents();
    },

    /**
     * 绑定事件
     */
    bindEvents: function () {
      var self = this;

      // ========== 个人信息修改 ==========
      var btnProfile = doc.getElementById('btnProfile');
      if (btnProfile) {
        btnProfile.addEventListener('click', function () {
          Common.toast('修改头像功能开发中');
        });
      }

      var btnNickname = doc.getElementById('btnNickname');
      if (btnNickname) {
        btnNickname.addEventListener('click', function () {
          Common.toast('修改昵称功能开发中');
        });
      }

      // ========== 通用设置项点击 ==========
      var allItems = doc.querySelectorAll('.settings-item');
      allItems.forEach(function (item) {
        item.addEventListener('click', function (e) {
          // 如果点击的是开关内部则不触发行点击
          if (e.target.closest('.toggle-switch')) return;

          // 如果该行有开关则不弹Toast（开关自有行为）
          if (this.querySelector('.toggle-switch')) return;

          var label = this.querySelector('.item-label');
          if (label) {
            Common.toast(label.textContent + '功能开发中');
          }
        });
      });

      // ========== 清理缓存 ==========
      var btnClearCache = doc.getElementById('btnClearCache');
      if (btnClearCache) {
        btnClearCache.addEventListener('click', function (e) {
          e.stopPropagation();
          Common.toast('缓存清理中...');
          // 模拟清理
          setTimeout(function () {
            Common.toast('缓存已清理');
            var val = this.querySelector('.item-value');
            if (val) val.textContent = '0KB';
          }.bind(this), 1500);
        });
      }

      // ========== 关于我们 ==========
      var btnAbout = doc.getElementById('btnAbout');
      if (btnAbout) {
        btnAbout.addEventListener('click', function (e) {
          e.stopPropagation();
          Common.toast('校园商城 v1.0.0\n实训课教学项目');
        });
      }

      // ========== 退出登录 ==========
      var btnLogout = doc.getElementById('btnLogout');
      if (btnLogout) {
        btnLogout.addEventListener('click', function () {
          if (confirm('确定要退出登录吗？')) {
            Common.toast('已退出登录');
            // 延迟跳转到首页
            setTimeout(function () {
              win.location.href = 'index.html';
            }, 800);
          }
        });
      }
    }

  };

  // ==================== 页面加载完成后初始化 ====================

  doc.addEventListener('DOMContentLoaded', function () {
    Settings.init();
    // 搜索栏等其他通用功能在当前页不需要，不调用 initSearch
  });

})(window, document);
