/**
 * JCI Sanxia - Christmas Handover 2025
 * jci-christmas.js
 * 
 * 效能優化策略：
 * 1. DOM Ready 後才執行
 * 2. 使用 requestAnimationFrame 優化動畫
 * 3. 延遲載入非關鍵效果（雪花在 2 秒後才開始）
 * 4. 使用 throttle 處理高頻事件
 * 5. 使用 IntersectionObserver 取代 scroll 監聽
 * 6. 批次 DOM 操作，減少重排
 */

(function () {
    'use strict';

    // ===== 工具函數 =====

    /**
     * Throttle 函數 - 限制執行頻率
     */
    function throttle(func, limit) {
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
    }

    /**
     * 檢查是否為行動裝置
     */
    function isMobile() {
        return window.innerWidth <= 768;
    }

    /**
     * 檢查使用者是否偏好減少動畫
     */
    function prefersReducedMotion() {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    // ===== Header 高度自適應 =====
    const HeaderAdapter = {
        header: null,
        heroContent: null,
        christmasLights: null,

        init: function () {
            this.header = document.getElementById('topnav');
            this.heroContent = document.querySelector('.hero-content');
            this.christmasLights = document.querySelector('.christmas-lights');

            if (!this.header) return;

            // 初始計算
            this.updateHeaderHeight();

            // 監聽視窗大小變化
            window.addEventListener('resize', throttle(() => {
                this.updateHeaderHeight();
            }, 100));

            // 監聽字體載入完成（字體可能影響高度）
            if (document.fonts && document.fonts.ready) {
                document.fonts.ready.then(() => {
                    this.updateHeaderHeight();
                });
            }

            // 延遲再次檢查（確保所有元素都載入完成）
            setTimeout(() => this.updateHeaderHeight(), 300);
            setTimeout(() => this.updateHeaderHeight(), 1000);
        },

        updateHeaderHeight: function () {
            if (!this.header) return;

            const headerHeight = this.header.offsetHeight;
            const safeMargin = 20; // 額外安全邊距
            const totalOffset = headerHeight + safeMargin;

            // 設定 CSS 變數供其他樣式使用
            document.documentElement.style.setProperty('--header-height', headerHeight + 'px');
            document.documentElement.style.setProperty('--header-offset', totalOffset + 'px');

            // 只在手機版時調整
            if (isMobile()) {
                if (this.heroContent) {
                    this.heroContent.style.paddingTop = totalOffset + 'px';
                }
                if (this.christmasLights) {
                    this.christmasLights.style.top = headerHeight + 'px';
                }
            } else {
                // 桌面版重置為 CSS 預設值
                if (this.heroContent) {
                    this.heroContent.style.paddingTop = '';
                }
                if (this.christmasLights) {
                    this.christmasLights.style.top = '';
                }
            }
        }
    };

    // ===== 打字機效果 =====
    const TypeWriter = {
        element: null,
        phrases: [
            '綠色・傳承・熱情',
            '三峽青商',
            '正在改變世界的一群人'
        ],
        phraseIndex: 0,
        charIndex: 0,
        isDeleting: false,
        typeSpeed: 100,
        deleteSpeed: 50,
        pauseTime: 2000,

        init: function () {
            this.element = document.querySelector('.typed-jci');
            if (!this.element) return;

            // 添加游標
            const cursor = document.createElement('span');
            cursor.className = 'typing-cursor';
            this.element.parentNode.insertBefore(cursor, this.element.nextSibling);

            // 延遲開始打字
            setTimeout(() => this.type(), 1200);
        },

        type: function () {
            if (!this.element) return;

            const currentPhrase = this.phrases[this.phraseIndex];

            if (this.isDeleting) {
                this.charIndex--;
                this.element.textContent = currentPhrase.substring(0, this.charIndex);
            } else {
                this.charIndex++;
                this.element.textContent = currentPhrase.substring(0, this.charIndex);
            }

            let nextDelay = this.isDeleting ? this.deleteSpeed : this.typeSpeed;

            // 完成輸入
            if (!this.isDeleting && this.charIndex === currentPhrase.length) {
                nextDelay = this.pauseTime;
                this.isDeleting = true;
            }
            // 完成刪除
            else if (this.isDeleting && this.charIndex === 0) {
                this.isDeleting = false;
                this.phraseIndex = (this.phraseIndex + 1) % this.phrases.length;
                nextDelay = 500;
            }

            setTimeout(() => this.type(), nextDelay);
        }
    };

    // ===== 倒數計時器 =====
    const Countdown = {
        targetDate: new Date('2025-12-25T18:00:00').getTime(),
        elements: {},
        intervalId: null,

        init: function () {
            this.elements = {
                days: document.getElementById('countdown-days'),
                hours: document.getElementById('countdown-hours'),
                minutes: document.getElementById('countdown-minutes'),
                seconds: document.getElementById('countdown-seconds')
            };

            // 檢查元素是否存在
            if (!this.elements.days) return;

            this.update();
            this.intervalId = setInterval(() => this.update(), 1000);
        },

        update: function () {
            const now = Date.now();
            const distance = this.targetDate - now;

            if (distance <= 0) {
                this.setValues(0, 0, 0, 0);
                if (this.intervalId) {
                    clearInterval(this.intervalId);
                }
                return;
            }

            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            this.setValues(days, hours, minutes, seconds);
        },

        setValues: function (days, hours, minutes, seconds) {
            if (this.elements.days) this.elements.days.textContent = String(days).padStart(2, '0');
            if (this.elements.hours) this.elements.hours.textContent = String(hours).padStart(2, '0');
            if (this.elements.minutes) this.elements.minutes.textContent = String(minutes).padStart(2, '0');
            if (this.elements.seconds) this.elements.seconds.textContent = String(seconds).padStart(2, '0');
        }
    };

    // ===== 雪花效果 =====
    const Snowflakes = {
        container: null,
        chars: ['❄', '❅', '❆', '✻', '✼'],
        maxSnowflakes: 25,
        currentCount: 0,
        intervalId: null,
        isActive: false,

        init: function () {
            // 如果使用者偏好減少動畫，則不啟動
            if (prefersReducedMotion()) return;

            this.container = document.getElementById('snowflakes-container');
            if (!this.container) return;

            // 行動裝置減少雪花數量
            if (isMobile()) {
                this.maxSnowflakes = 12;
            }

            this.isActive = true;

            // 延遲 2 秒後開始產生雪花（優先渲染其他內容）
            setTimeout(() => {
                if (!this.isActive) return;
                this.createInitialSnowflakes();
                this.startInterval();
            }, 2000);

            // 頁面不可見時停止
            document.addEventListener('visibilitychange', () => {
                if (document.hidden) {
                    this.stop();
                } else {
                    this.start();
                }
            });
        },

        createInitialSnowflakes: function () {
            // 批次建立初始雪花
            const fragment = document.createDocumentFragment();
            const initialCount = Math.min(10, this.maxSnowflakes);

            for (let i = 0; i < initialCount; i++) {
                const snowflake = this.createSnowflake();
                snowflake.style.animationDelay = (i * 0.3) + 's';
                fragment.appendChild(snowflake);
            }

            this.container.appendChild(fragment);
            this.currentCount = initialCount;
        },

        createSnowflake: function () {
            const snowflake = document.createElement('div');
            snowflake.className = 'snowflake';
            snowflake.textContent = this.chars[Math.floor(Math.random() * this.chars.length)];
            snowflake.style.left = Math.random() * 100 + '%';
            snowflake.style.fontSize = (Math.random() * 0.8 + 0.6) + 'rem';
            snowflake.style.animationDuration = (Math.random() * 4 + 8) + 's';
            snowflake.style.opacity = Math.random() * 0.5 + 0.4;

            // 動畫結束後移除
            snowflake.addEventListener('animationend', () => {
                snowflake.remove();
                this.currentCount--;
            }, { once: true });

            return snowflake;
        },

        startInterval: function () {
            if (this.intervalId) return;

            this.intervalId = setInterval(() => {
                if (this.currentCount < this.maxSnowflakes && this.isActive) {
                    this.container.appendChild(this.createSnowflake());
                    this.currentCount++;
                }
            }, 600);
        },

        stop: function () {
            if (this.intervalId) {
                clearInterval(this.intervalId);
                this.intervalId = null;
            }
        },

        start: function () {
            if (this.isActive && !this.intervalId) {
                this.startInterval();
            }
        }
    };

    // ===== 聖誕燈串 =====
    const ChristmasLights = {
        container: null,

        init: function () {
            this.container = document.getElementById('christmas-lights');
            if (!this.container) return;

            const lightCount = Math.floor(window.innerWidth / (isMobile() ? 30 : 40));
            const fragment = document.createDocumentFragment();

            for (let i = 0; i < lightCount; i++) {
                const light = document.createElement('div');
                light.className = 'light-bulb';
                fragment.appendChild(light);
            }

            this.container.appendChild(fragment);
        }
    };

    // ===== 滾動效果 =====
    const ScrollEffects = {
        heroContent: null,
        scrollIndicator: null,
        lastScrollY: 0,
        ticking: false,

        init: function () {
            this.heroContent = document.querySelector('.hero-content');
            this.scrollIndicator = document.querySelector('.scroll-indicator');

            if (!this.heroContent && !this.scrollIndicator) return;

            // 使用 throttle 的滾動監聽
            window.addEventListener('scroll', throttle(() => {
                if (!this.ticking) {
                    requestAnimationFrame(() => {
                        this.handleScroll();
                        this.ticking = false;
                    });
                    this.ticking = true;
                }
            }, 16), { passive: true });
        },

        handleScroll: function () {
            const scrollY = window.pageYOffset;

            // 只在 Hero 區域內處理
            if (scrollY > window.innerHeight) return;

            const opacity = Math.max(0, 1 - (scrollY / 400));
            const translateY = scrollY * 0.3;

            if (this.heroContent) {
                this.heroContent.style.opacity = opacity;
                this.heroContent.style.transform = `translateY(${translateY}px)`;
            }

            if (this.scrollIndicator) {
                this.scrollIndicator.style.opacity = Math.max(0, 1 - (scrollY / 150));
            }
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
                easing: 'ease-out-cubic',
                disable: prefersReducedMotion() ? true : false
            });
        }
    };

    // ===== 主程式初始化 =====
    function init() {
        // 最優先：Header 高度自適應
        HeaderAdapter.init();

        // 關鍵功能優先
        TypeWriter.init();
        Countdown.init();
        ChristmasLights.init();

        // 滾動效果
        ScrollEffects.init();

        // AOS 動畫
        AOSInit.init();

        // 非關鍵效果延遲載入
        Snowflakes.init();
    }

    // DOM Ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();