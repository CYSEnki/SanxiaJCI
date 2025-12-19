"use strict";

/**
 * Magazine Reader
 * Sanxia JCI Digital Magazine Viewer
 */

class MagazineReader {
    constructor(options = {}) {
        this.pages = options.pages || [];
        this.coverImage = options.coverImage || this.pages[0];

        this.currentPage = 0;
        this.totalPages = this.pages.length;
        this.isAnimating = false;
        this.showControls = true;
        this.hideControlsTimer = null;
        this.isReaderActive = false;

        // Image loading tracking
        this.loadedImages = new Map();
        this.loadingImages = new Set();
        this.loadingProgress = 0;

        // Tutorial
        this.tutorialShown = localStorage.getItem('magazineTutorialShown') === 'true';

        // Touch
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.touchStartTime = 0;
        this.minSwipeDistance = 50;

        // DOM elements
        this.heroSection = document.getElementById('heroSection');
        this.tutorialOverlay = document.getElementById('tutorialOverlay');
        this.wrapper = document.getElementById('magazineWrapper');
        this.pagesWrapper = document.getElementById('pagesWrapper');
        this.prevArrow = document.getElementById('prevArrow');
        this.nextArrow = document.getElementById('nextArrow');
        this.currentPageEl = document.getElementById('currentPage');
        this.totalPagesEl = document.getElementById('totalPages');
        this.progressFill = document.getElementById('progressFill');
        this.thumbnailStrip = document.getElementById('thumbnailStrip');
        this.toolbar = document.getElementById('toolbar');
        this.bottomControls = document.getElementById('bottomControls');
        this.initialLoading = document.getElementById('initialLoading');
        this.loadingStatusText = document.getElementById('loadingStatusText');
        this.loadingProgressRing = document.getElementById('loadingProgressRing');

        this.init();
    }

    init() {
        this.bindHeroEvents();
        this.bindEvents();
        this.updateTotalPages();
        this.preloadInitialImages();
    }

    preloadInitialImages() {
        var self = this;
        var initialCount = Math.min(5, this.totalPages);
        var loadedCount = 0;

        for (var i = 0; i < initialCount; i++) {
            this.loadImage(this.pages[i], true).then(function () {
                loadedCount++;
                self.loadingProgress = Math.round((loadedCount / initialCount) * 100);
                self.updateLoadingStatus();
            });
        }
    }

    loadImage(src, highPriority) {
        var self = this;
        return new Promise(function (resolve) {
            if (self.loadedImages.has(src)) {
                resolve(true);
                return;
            }

            if (self.loadingImages.has(src)) {
                var checkLoaded = setInterval(function () {
                    if (self.loadedImages.has(src)) {
                        clearInterval(checkLoaded);
                        resolve(true);
                    }
                }, 50);
                return;
            }

            self.loadingImages.add(src);

            var img = new Image();

            img.onload = function () {
                self.loadedImages.set(src, true);
                self.loadingImages.delete(src);
                resolve(true);
            };

            img.onerror = function () {
                self.loadedImages.set(src, false);
                self.loadingImages.delete(src);
                resolve(false);
            };

            img.src = src;
        });
    }

    smartPreload(centerPage) {
        var self = this;
        var loadOrder = [0, 1, -1, 2, -2, 3, -3, 4, -4, 5, -5];

        loadOrder.forEach(function (offset, priority) {
            var pageIndex = centerPage + offset;
            if (pageIndex >= 0 && pageIndex < self.totalPages) {
                var src = self.pages[pageIndex];

                setTimeout(function () {
                    self.loadImage(src, priority < 3).then(function () {
                        self.updatePageImage(pageIndex);
                    });
                }, priority * 30);
            }
        });
    }

    updatePageImage(pageIndex) {
        if (!this.pagesWrapper) return;

        var container = this.pagesWrapper.children[pageIndex];
        if (!container) return;

        var img = container.querySelector('.page-image');
        var loading = container.querySelector('.page-loading');
        var src = this.pages[pageIndex];

        if (img && this.loadedImages.get(src) && (!img.src || img.src === '' || img.src === window.location.href)) {
            img.src = src;
            if (loading) loading.style.display = 'none';
        }
    }

    updateLoadingStatus() {
        if (!this.loadingStatusText || !this.loadingProgressRing) return;

        if (this.loadingProgress >= 100) {
            this.loadingStatusText.textContent = '\u2713 \u5DF2\u6E96\u5099\u5C31\u7DD2';
            this.loadingStatusText.classList.add('complete');
            this.loadingProgressRing.classList.add('complete');
        } else {
            this.loadingStatusText.textContent = '\u8F09\u5165\u4E2D... ' + this.loadingProgress + '%';
        }
    }

    updateTotalPages() {
        var heroPageCount = document.querySelector('.pages-stat-value');
        if (heroPageCount) {
            heroPageCount.textContent = this.totalPages;
        }

        if (this.totalPagesEl) {
            this.totalPagesEl.textContent = this.totalPages;
        }
    }

    bindHeroEvents() {
        var self = this;

        var openBtn = document.getElementById('openMagazineBtn');
        if (openBtn) {
            openBtn.addEventListener('click', function () { self.openMagazine(); });
        }

        var backBtn = document.getElementById('backToHeroBtn');
        if (backBtn) {
            backBtn.addEventListener('click', function () { self.backToHero(); });
        }

        var startBtn = document.getElementById('startReadingBtn');
        if (startBtn) {
            startBtn.addEventListener('click', function () { self.closeTutorial(); });
        }

        var skipBtn = document.getElementById('skipTutorial');
        if (skipBtn) {
            skipBtn.addEventListener('click', function () { self.closeTutorial(true); });
        }

        var helpBtn = document.getElementById('helpBtn');
        if (helpBtn) {
            helpBtn.addEventListener('click', function () { self.showTutorial(); });
        }
    }

    openMagazine() {
        var self = this;
        this.heroSection.classList.add('hidden');

        setTimeout(function () {
            self.createPages();
            self.createThumbnails();
            self.updateDisplay();

            self.wrapper.classList.add('visible');
            self.isReaderActive = true;
            self.initialLoading.classList.add('hidden');

            self.smartPreload(0);

            if (!self.tutorialShown) {
                setTimeout(function () { self.showTutorial(); }, 500);
            }
        }, 400);
    }

    backToHero() {
        var self = this;
        this.wrapper.classList.remove('visible');
        this.isReaderActive = false;

        setTimeout(function () {
            self.heroSection.classList.remove('hidden');
        }, 300);
    }

    showTutorial() {
        this.tutorialOverlay.classList.add('active');
    }

    closeTutorial(skipFuture) {
        this.tutorialOverlay.classList.remove('active');
        this.tutorialShown = true;

        if (skipFuture) {
            localStorage.setItem('magazineTutorialShown', 'true');
        }
    }

    createPages() {
        var self = this;
        if (!this.pagesWrapper) return;
        this.pagesWrapper.innerHTML = '';

        this.pages.forEach(function (src, index) {
            var container = document.createElement('div');
            container.className = 'page-container' + (index === 0 ? ' active' : '');
            container.dataset.page = index;

            var isLoaded = self.loadedImages.get(src);

            container.innerHTML =
                '<div class="page-image-wrapper">' +
                '<div class="page-loading" id="loading-' + index + '" style="' + (isLoaded ? 'display:none;' : '') + '">' +
                '<div class="loading-spinner"></div>' +
                '</div>' +
                '<img src="' + (isLoaded ? src : '') + '"' +
                ' data-src="' + src + '"' +
                ' data-index="' + index + '"' +
                ' alt="\u7B2C' + (index + 1) + '\u9801"' +
                ' class="page-image"' +
                ' draggable="false">' +
                '</div>';

            self.pagesWrapper.appendChild(container);

            var img = container.querySelector('.page-image');
            var loading = container.querySelector('.page-loading');

            img.onload = function () {
                if (loading) loading.style.display = 'none';
            };

            img.onerror = function () {
                if (loading) loading.innerHTML = '<span style="color: #ff6b6b;">\u8F09\u5165\u5931\u6557</span>';
            };
        });
    }

    ensureCurrentPageLoaded(pageIndex) {
        var self = this;
        if (!this.pagesWrapper || pageIndex < 0 || pageIndex >= this.totalPages) return;

        var container = this.pagesWrapper.children[pageIndex];
        if (!container) return;

        var img = container.querySelector('.page-image');
        var loading = container.querySelector('.page-loading');
        var src = this.pages[pageIndex];

        if (img && (!img.src || img.src === '' || img.src === window.location.href)) {
            if (loading) loading.style.display = 'flex';

            this.loadImage(src, true).then(function (success) {
                if (success) {
                    img.src = src;
                    if (loading) loading.style.display = 'none';
                }
            });
        }
    }

    createThumbnails() {
        var self = this;
        if (!this.thumbnailStrip) return;
        this.thumbnailStrip.innerHTML = '';

        this.pages.forEach(function (src, index) {
            var thumb = document.createElement('div');
            thumb.className = 'thumbnail-item' + (index === 0 ? ' active' : '');
            thumb.dataset.page = index;
            thumb.innerHTML = '<img src="' + src + '" alt="\u7B2C' + (index + 1) + '\u9801" loading="lazy">';
            thumb.addEventListener('click', function () { self.goToPage(index); });
            self.thumbnailStrip.appendChild(thumb);
        });
    }

    bindEvents() {
        var self = this;

        if (this.prevArrow) {
            this.prevArrow.addEventListener('click', function () { self.prevPage(); });
        }
        if (this.nextArrow) {
            this.nextArrow.addEventListener('click', function () { self.nextPage(); });
        }

        // Keyboard events
        document.addEventListener('keydown', function (e) {
            if (!self.isReaderActive) return;
            if (self.tutorialOverlay && self.tutorialOverlay.classList.contains('active')) {
                if (e.key === 'Escape' || e.key === 'Enter') self.closeTutorial();
                return;
            }

            if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') self.prevPage();
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') self.nextPage();
            if (e.key === 'Home') self.goToPage(0);
            if (e.key === 'End') self.goToPage(self.totalPages - 1);
            if (e.key === 'Escape') self.backToHero();
        });

        var reader = document.getElementById('readerContainer');
        if (reader) {
            // Touch start
            reader.addEventListener('touchstart', function (e) {
                self.touchStartX = e.touches[0].clientX;
                self.touchStartY = e.touches[0].clientY;
                self.touchStartTime = Date.now();
            }, { passive: true });

            // Touch end - swipe navigation
            reader.addEventListener('touchend', function (e) {
                var touchEndX = e.changedTouches[0].clientX;
                var touchEndY = e.changedTouches[0].clientY;

                var diffX = self.touchStartX - touchEndX;
                var diffY = Math.abs(self.touchStartY - touchEndY);

                if (Math.abs(diffX) > self.minSwipeDistance && Math.abs(diffX) > diffY * 1.5) {
                    if (diffX > 0) self.nextPage();
                    else self.prevPage();
                }
            }, { passive: true });

            // Click to toggle controls
            reader.addEventListener('click', function (e) {
                if (e.target.closest('.nav-arrow, .thumbnail-item, .toolbar-btn')) return;
                self.toggleControls();
            });

            // Mouse drag
            var mouseDown = false;
            var mouseStartX = 0;

            reader.addEventListener('mousedown', function (e) {
                mouseDown = true;
                mouseStartX = e.clientX;
            });

            document.addEventListener('mouseup', function (e) {
                if (mouseDown) {
                    var diff = mouseStartX - e.clientX;
                    if (Math.abs(diff) > self.minSwipeDistance) {
                        if (diff > 0) self.nextPage();
                        else self.prevPage();
                    }
                    mouseDown = false;
                }
            });
        }

        // Mouse move to show controls
        if (this.wrapper) {
            this.wrapper.addEventListener('mousemove', function () {
                self.showControlsTemporarily();
            });
        }
    }

    prevPage() {
        var self = this;
        if (this.isAnimating || this.currentPage === 0 || !this.pagesWrapper) return;
        this.isAnimating = true;

        var currentContainer = this.pagesWrapper.children[this.currentPage];
        var prevContainer = this.pagesWrapper.children[this.currentPage - 1];

        currentContainer.classList.remove('active');
        currentContainer.classList.add('exit-right');
        prevContainer.classList.remove('prev');
        prevContainer.classList.add('active');

        this.currentPage--;

        this.ensureCurrentPageLoaded(this.currentPage);
        this.smartPreload(this.currentPage);

        setTimeout(function () {
            currentContainer.classList.remove('exit-right');
            self.isAnimating = false;
            self.updateDisplay();
        }, 400);
    }

    nextPage() {
        var self = this;
        if (this.isAnimating || this.currentPage >= this.totalPages - 1 || !this.pagesWrapper) return;
        this.isAnimating = true;

        var currentContainer = this.pagesWrapper.children[this.currentPage];
        var nextContainer = this.pagesWrapper.children[this.currentPage + 1];

        currentContainer.classList.remove('active');
        currentContainer.classList.add('exit-left');
        nextContainer.classList.add('active');

        this.currentPage++;

        this.ensureCurrentPageLoaded(this.currentPage);
        this.smartPreload(this.currentPage);

        setTimeout(function () {
            currentContainer.classList.remove('exit-left');
            currentContainer.classList.add('prev');
            self.isAnimating = false;
            self.updateDisplay();
        }, 400);
    }

    goToPage(index) {
        var self = this;
        if (this.isAnimating || index === this.currentPage || !this.pagesWrapper) return;
        if (index < 0 || index >= this.totalPages) return;

        this.isAnimating = true;

        this.ensureCurrentPageLoaded(index);

        Array.from(this.pagesWrapper.children).forEach(function (container, i) {
            container.classList.remove('active', 'prev', 'exit-left', 'exit-right');
            if (i < index) {
                container.classList.add('prev');
            }
        });

        var targetContainer = this.pagesWrapper.children[index];
        targetContainer.classList.add('active');

        this.currentPage = index;

        this.smartPreload(index);

        setTimeout(function () {
            self.isAnimating = false;
            self.updateDisplay();
        }, 400);
    }

    updateDisplay() {
        if (this.currentPageEl) {
            this.currentPageEl.textContent = this.currentPage + 1;
        }
        if (this.totalPagesEl) {
            this.totalPagesEl.textContent = this.totalPages;
        }

        if (this.progressFill) {
            var progress = ((this.currentPage + 1) / this.totalPages) * 100;
            this.progressFill.style.width = progress + '%';
        }

        if (this.prevArrow) {
            this.prevArrow.disabled = this.currentPage === 0;
        }
        if (this.nextArrow) {
            this.nextArrow.disabled = this.currentPage >= this.totalPages - 1;
        }

        if (this.thumbnailStrip) {
            var self = this;
            var thumbnails = this.thumbnailStrip.querySelectorAll('.thumbnail-item');
            thumbnails.forEach(function (thumb, index) {
                thumb.classList.toggle('active', index === self.currentPage);
            });

            var activeThumbnail = thumbnails[this.currentPage];
            if (activeThumbnail) {
                activeThumbnail.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest',
                    inline: 'center'
                });
            }
        }
    }

    toggleControls() {
        this.showControls = !this.showControls;
        if (this.toolbar) {
            this.toolbar.classList.toggle('hidden', !this.showControls);
        }
        if (this.bottomControls) {
            this.bottomControls.classList.toggle('hidden', !this.showControls);
        }

        if (this.showControls) {
            this.startHideControlsTimer();
        }
    }

    showControlsTemporarily() {
        if (!this.showControls) {
            this.showControls = true;
            if (this.toolbar) this.toolbar.classList.remove('hidden');
            if (this.bottomControls) this.bottomControls.classList.remove('hidden');
        }
        this.startHideControlsTimer();
    }

    startHideControlsTimer() {
        var self = this;
        clearTimeout(this.hideControlsTimer);
        this.hideControlsTimer = setTimeout(function () {
            if (!('ontouchstart' in window)) {
                self.showControls = false;
                if (self.toolbar) self.toolbar.classList.add('hidden');
                if (self.bottomControls) self.bottomControls.classList.add('hidden');
            }
        }, 4000);
    }
}

window.MagazineReader = MagazineReader;