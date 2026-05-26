/**
 * cart.js - 购物车页面交互逻辑
 * ============================================================
 * 功能：
 *   - 勾选框（单选/全选）切换
 *   - 数量步进器（+/-）
 *   - 实时合计金额计算
 *   - 编辑模式（显示删除按钮）
 *   - 删除确认弹窗
 * ============================================================
 */

(function (win, doc) {
  'use strict';

  var Cart = {

    items: null,       // 所有购物车项
    checkAll: null,    // 全选勾选框
    totalPrice: null,  // 合计金额元素
    btnSettle: null,   // 结算按钮
    btnEdit: null,     // 编辑按钮
    cartList: null,    // 购物车列表容器
    dialog: null,      // 删除确认弹窗
    isEditMode: false, // 是否编辑模式
    pendingDelItems: [], // 待删除项

    /**
     * 初始化
     */
    init: function () {
      this.cacheElements();
      this.bindEvents();
      this.updateTotal();
    },

    /**
     * 缓存DOM元素
     */
    cacheElements: function () {
      this.items = doc.querySelectorAll('.cart-list .cart-item');
      this.checkAll = doc.getElementById('checkAll');
      this.totalPrice = doc.getElementById('totalPrice');
      this.btnSettle = doc.getElementById('btnSettle');
      this.btnEdit = doc.getElementById('btnEdit');
      this.cartList = doc.getElementById('cartList');
      this.dialog = doc.getElementById('delDialog');
    },

    /**
     * 绑定事件
     */
    bindEvents: function () {
      var self = this;

      // ========== 单个勾选框 ==========
      this.items.forEach(function (item) {
        var checkBox = item.querySelector('.check-box');
        checkBox.addEventListener('click', function () {
          this.classList.toggle('checked');
          self.updateTotal();
          self.updateCheckAll();
        });
      });

      // ========== 全选勾选框 ==========
      this.checkAll.addEventListener('click', function () {
        var isAllChecked = this.classList.contains('checked');
        self.items.forEach(function (item) {
          var cb = item.querySelector('.check-box');
          if (isAllChecked) {
            cb.classList.remove('checked');
          } else {
            cb.classList.add('checked');
          }
        });
        this.classList.toggle('checked');
        self.updateTotal();
      });

      // ========== 数量步进器 ==========
      this.items.forEach(function (item) {
        var btnMinus = item.querySelector('.btn-minus');
        var btnPlus = item.querySelector('.btn-plus');
        var qtyNum = item.querySelector('.qty-num');
        var checkBox = item.querySelector('.check-box');

        btnMinus.addEventListener('click', function () {
          var num = parseInt(qtyNum.textContent, 10);
          if (num <= 1) {
            Common.toast('数量不能少于1');
            return;
          }
          qtyNum.textContent = num - 1;
          self.updateTotal();
        });

        btnPlus.addEventListener('click', function () {
          var num = parseInt(qtyNum.textContent, 10);
          if (num >= 99) {
            Common.toast('数量不能超过99');
            return;
          }
          qtyNum.textContent = num + 1;
          self.updateTotal();
        });
      });

      // ========== 编辑按钮 ==========
      this.btnEdit.addEventListener('click', function () {
        self.toggleEditMode();
      });

      // ========== 删除确认弹窗 ==========
      doc.getElementById('btnCancel').addEventListener('click', function () {
        self.hideDialog();
      });

      doc.getElementById('btnConfirm').addEventListener('click', function () {
        self.confirmDelete();
      });

      // ========== 结算按钮 ==========
      this.btnSettle.addEventListener('click', function () {
        if (self.isEditMode) {
          // 编辑模式：删除选中项
          self.showDeleteDialog();
        } else {
          // 正常模式：去结算
          var checkedItems = self.getCheckedItems();
          if (checkedItems.length === 0) {
            Common.toast('请选择要结算的商品');
            return;
          }
          Common.toast('正在跳转支付...');
        }
      });
    },

    /**
     * 切换编辑模式
     */
    toggleEditMode: function () {
      this.isEditMode = !this.isEditMode;

      if (this.isEditMode) {
        this.cartList.classList.add('edit-mode');
        this.btnEdit.textContent = '完成';
        this.btnSettle.textContent = '删除选中';
        this.btnSettle.style.background = '#ff0036';
      } else {
        this.cartList.classList.remove('edit-mode');
        this.btnEdit.textContent = '编辑';
        this.btnSettle.textContent = this.getSettleText();
        this.btnSettle.style.background = 'linear-gradient(135deg, #ff7840, #ff5000)';
      }
    },

    /**
     * 显示删除确认弹窗
     */
    showDeleteDialog: function () {
      var checkedItems = this.getCheckedItems();
      if (checkedItems.length === 0) {
        Common.toast('请先选择要删除的商品');
        return;
      }
      this.pendingDelItems = checkedItems;
      this.dialog.style.display = 'flex';
    },

    /**
     * 隐藏弹窗
     */
    hideDialog: function () {
      this.dialog.style.display = 'none';
      this.pendingDelItems = [];
    },

    /**
     * 确认删除
     */
    confirmDelete: function () {
      var self = this;
      this.pendingDelItems.forEach(function (item) {
        item.remove();
      });
      this.hideDialog();

      // 重新缓存商品项（有些可能被删了）
      this.items = doc.querySelectorAll('.cart-list .cart-item');

      // 全部删完 → 显示空状态
      if (this.items.length === 0) {
        this.showEmptyCart();
      }

      this.updateTotal();
      this.updateCheckAll();

      // 退出编辑模式
      if (this.isEditMode) {
        this.toggleEditMode();
      }

      Common.toast('已删除');
    },

    /**
     * 显示空购物车状态
     */
    showEmptyCart: function () {
      this.cartList.style.display = 'none';
      doc.getElementById('emptyCart').style.display = 'flex';
      doc.querySelector('.recommend-section').style.display = 'none';
    },

    /**
     * 更新合计金额
     */
    updateTotal: function () {
      var total = 0;
      var checkedCount = 0;

      this.items.forEach(function (item) {
        var checkBox = item.querySelector('.check-box');
        if (checkBox.classList.contains('checked')) {
          var price = parseFloat(item.getAttribute('data-price'));
          var qty = parseInt(item.querySelector('.qty-num').textContent, 10);
          total += price * qty;
          checkedCount++;
        }
      });

      this.totalPrice.textContent = total.toFixed(1);
      this.btnSettle.textContent = this.getSettleText(checkedCount);
    },

    /**
     * 获取结算按钮文案
     */
    getSettleText: function (count) {
      if (typeof count === 'undefined') {
        count = this.getCheckedItems().length;
      }
      if (this.isEditMode) {
        return '删除选中';
      }
      return count > 0 ? '结算(' + count + ')' : '结算';
    },

    /**
     * 更新全选状态
     */
    updateCheckAll: function () {
      if (this.items.length === 0) return;

      var allChecked = true;
      this.items.forEach(function (item) {
        if (!item.querySelector('.check-box').classList.contains('checked')) {
          allChecked = false;
        }
      });

      if (allChecked) {
        this.checkAll.classList.add('checked');
      } else {
        this.checkAll.classList.remove('checked');
      }
    },

    /**
     * 获取所有勾选的商品项
     */
    getCheckedItems: function () {
      var checked = [];
      this.items.forEach(function (item) {
        if (item.querySelector('.check-box').classList.contains('checked')) {
          checked.push(item);
        }
      });
      return checked;
    }

  };

  // ==================== 页面加载完成后初始化 ====================

  doc.addEventListener('DOMContentLoaded', function () {
    // 初始化购物车功能
    Cart.init();

    // 初始化底部Tab切换
    Common.initTabbar();
  });

})(window, document);
