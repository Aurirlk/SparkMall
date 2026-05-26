/**
 * my.js - 个人中心页面交互逻辑
 * ============================================================
 * 功能：
 *   - 底部Tab导航
 *   - 订单模块点击
 *   - 菜单项点击
 *   - 退出登录确认
 * ============================================================
 */

(function (win, doc) {
  'use strict';

  var MyPage = {

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

      // ========== 设置按钮 ==========
      var btnSettings = doc.querySelector('.btn-settings');
      if (btnSettings) {
        btnSettings.addEventListener('click', function () {
          win.location.href = 'settings.html';
        });
      }

      // ========== 编辑资料按钮 ==========
      var btnEdit = doc.querySelector('.btn-edit-profile');
      if (btnEdit) {
        btnEdit.addEventListener('click', function () {
          Common.toast('编辑资料页面开发中');
        });
      }

      // ========== 订单模块入口 ==========
      var orderItems = doc.querySelectorAll('.order-item');
      orderItems.forEach(function (item) {
        item.addEventListener('click', function () {
          var label = this.querySelector('.order-label').textContent;
          Common.toast(label + '页面开发中');
        });
      });

      // ========== 查看全部订单 ==========
      var allOrders = doc.querySelector('.order-section .section-more');
      if (allOrders) {
        allOrders.addEventListener('click', function () {
          Common.toast('全部订单页面开发中');
        });
      }

      // ========== 菜单项点击 ==========
      var menuItems = doc.querySelectorAll('.menu-item');
      menuItems.forEach(function (item) {
        item.addEventListener('click', function () {
          var label = this.querySelector('.menu-label');
          if (label) {
            Common.toast(label.textContent + '页面开发中');
          }
        });
      });

      // ========== 退出登录 ==========
      var btnLogout = doc.querySelector('.btn-logout');
      if (btnLogout) {
        btnLogout.addEventListener('click', function () {
          if (confirm('确定要退出登录吗？')) {
            Common.toast('已退出登录');
          }
        });
      }
    }

  };

  // ==================== 页面加载完成后初始化 ====================

  doc.addEventListener('DOMContentLoaded', function () {
    MyPage.init();
    Common.initTabbar();
  });

})(window, document);
