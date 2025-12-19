/**
 * JCI Sanxia - Contact Page
 * jci-contact.js
 * 
 * 效能優化：
 * 1. DOM Ready 後才執行
 * 2. 事件委派減少監聽器
 * 3. 防抖處理表單提交
 */

(function () {
    'use strict';

    // ===== 表單驗證模組 =====
    const ContactForm = {
        form: null,
        overlay: null,
        errorMsg: null,
        simpleMsg: null,
        isSubmitting: false,

        init: function () {
            this.form = document.getElementById('contact-form');
            this.overlay = document.getElementById('form-overlay');
            this.errorMsg = document.getElementById('error-msg');
            this.simpleMsg = document.getElementById('simple-msg');

            if (!this.form) return;

            this.bindEvents();
        },

        bindEvents: function () {
            const self = this;

            // 表單提交
            this.form.addEventListener('submit', function (e) {
                e.preventDefault();
                self.handleSubmit();
            });

            // 輸入時清除錯誤訊息
            const inputs = this.form.querySelectorAll('input, textarea');
            inputs.forEach(function (input) {
                input.addEventListener('input', function () {
                    self.clearMessages();
                });
            });
        },

        clearMessages: function () {
            if (this.errorMsg) this.errorMsg.innerHTML = '';
        },

        showError: function (message) {
            if (this.errorMsg) {
                this.errorMsg.innerHTML = message;
            }
        },

        showSuccess: function (message) {
            if (this.simpleMsg) {
                this.simpleMsg.innerHTML = '<div class="alert alert-success">🎉 ' + message + '</div>';
            }
        },

        showFailure: function (message) {
            if (this.simpleMsg) {
                this.simpleMsg.innerHTML = '<div class="alert alert-danger">⚠️ ' + message + '</div>';
            }
        },

        showLoading: function () {
            if (this.overlay) {
                this.overlay.classList.add('active');
            }
        },

        hideLoading: function () {
            if (this.overlay) {
                this.overlay.classList.remove('active');
            }
        },

        validateEmail: function (email) {
            const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return regex.test(email);
        },

        validate: function (data) {
            // 必填欄位檢查
            if (!data.name || !data.email || !data.comments) {
                this.showError('請完整填寫必填欄位！');
                return false;
            }

            // 姓名長度檢查
            if (data.name.length < 2) {
                this.showError('姓名至少需要 2 個字元！');
                return false;
            }

            // Email 格式檢查
            if (!this.validateEmail(data.email)) {
                this.showError('請輸入有效的電子郵件地址！');
                return false;
            }

            // 內容長度檢查
            if (data.comments.length < 10) {
                this.showError('信件內容至少需要 10 個字元！');
                return false;
            }

            return true;
        },

        getFormData: function () {
            return {
                name: (document.getElementById('name').value || '').trim(),
                email: (document.getElementById('email').value || '').trim(),
                subject: (document.getElementById('subject').value || '').trim(),
                comments: (document.getElementById('comments').value || '').trim()
            };
        },

        handleSubmit: function () {
            const self = this;

            // 防止重複提交
            if (this.isSubmitting) return;

            // 清除訊息
            this.clearMessages();
            if (this.simpleMsg) this.simpleMsg.innerHTML = '';

            // 取得表單資料
            const data = this.getFormData();

            // 驗證
            if (!this.validate(data)) {
                return;
            }

            // 開始提交
            this.isSubmitting = true;
            this.showLoading();

            // 發送請求
            fetch('/Home/SendEmail', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: data.name,
                    email: data.email,
                    subject: data.subject,
                    message: data.comments
                })
            })
                .then(function (response) {
                    return response.json().then(function (json) {
                        return { ok: response.ok, data: json };
                    });
                })
                .then(function (result) {
                    self.hideLoading();
                    self.isSubmitting = false;

                    if (result.ok) {
                        self.showSuccess(result.data.message || '郵件寄送成功！我們會盡快回覆您。');
                        self.form.reset();
                    } else {
                        self.showFailure('郵件寄送失敗：' + (result.data.message || '請稍後再試。'));
                    }
                })
                .catch(function (error) {
                    self.hideLoading();
                    self.isSubmitting = false;
                    self.showFailure('郵件寄送失敗：請檢查網路連線後再試。');
                    console.error('Contact form error:', error);
                });
        }
    };

    // ===== AOS 初始化 =====
    const AOSInit = {
        init: function () {
            if (typeof AOS === 'undefined') return;

            AOS.init({
                duration: 800,
                once: true,
                offset: 80,
                easing: 'ease-out-cubic'
            });
        }
    };

    // ===== 平滑滾動到表單 =====
    const SmoothScroll = {
        init: function () {
            // 如果 URL 有 #contact-form，平滑滾動到表單
            if (window.location.hash === '#contact-form') {
                setTimeout(function () {
                    const form = document.getElementById('contact-form');
                    if (form) {
                        form.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                }, 500);
            }
        }
    };

    // ===== Header 高度自適應 =====
    const HeaderAdapter = {
        header: null,
        contactHero: null,

        init: function () {
            this.header = document.getElementById('topnav');
            this.contactHero = document.querySelector('.contact-hero');

            if (!this.header) return;

            // 初始計算
            this.updateHeaderHeight();

            // 監聽視窗大小變化
            window.addEventListener('resize', this.throttle(() => {
                this.updateHeaderHeight();
            }, 100));

            // 監聽字體載入完成
            if (document.fonts && document.fonts.ready) {
                document.fonts.ready.then(() => {
                    this.updateHeaderHeight();
                });
            }

            // 延遲再次檢查
            setTimeout(() => this.updateHeaderHeight(), 300);
            setTimeout(() => this.updateHeaderHeight(), 1000);
        },

        throttle: function (func, limit) {
            let inThrottle;
            return function () {
                const args = arguments;
                const context = this;
                if (!inThrottle) {
                    func.apply(context, args);
                    inThrottle = true;
                    setTimeout(function () {
                        inThrottle = false;
                    }, limit);
                }
            };
        },

        isMobile: function () {
            return window.innerWidth <= 768;
        },

        updateHeaderHeight: function () {
            if (!this.header) return;

            const headerHeight = this.header.offsetHeight;
            const safeMargin = 20;
            const totalOffset = headerHeight + safeMargin;

            // 設定 CSS 變數
            document.documentElement.style.setProperty('--header-height', headerHeight + 'px');
            document.documentElement.style.setProperty('--header-offset', totalOffset + 'px');

            // 只在手機版時調整
            if (this.isMobile()) {
                if (this.contactHero) {
                    this.contactHero.style.paddingTop = totalOffset + 'px';
                }
            } else {
                if (this.contactHero) {
                    this.contactHero.style.paddingTop = '';
                }
            }
        }
    };

    // ===== 主程式初始化 =====
    function init() {
        // 最優先：Header 高度自適應
        HeaderAdapter.init();

        ContactForm.init();
        AOSInit.init();
        SmoothScroll.init();
    }

    // DOM Ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();