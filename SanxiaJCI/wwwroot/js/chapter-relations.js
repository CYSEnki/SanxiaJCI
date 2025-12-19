/**
 * Chapter Relations Map - Leaflet Version
 * Uses real coordinates for accurate positioning
 */

(function () {
    'use strict';

    // ===== Configuration =====
    var isMobile = window.innerWidth <= 768;

    var CONFIG = {
        // Taiwan center
        taiwanCenter: [24.35, 120.95],
        taiwanZoom: isMobile ? 7 : 8,

        // East Asia view (Taiwan + Korea)
        asiaCenter: [31.5, 124],
        asiaZoom: isMobile ? 4 : 5,

        // Animation duration (seconds)
        flyDuration: 3
    };

    // ===== Marker Data =====
    var MARKERS = {
        taiwan: [
            {
                id: 'sanxia',
                name: '三峽分會',
                type: '我們的分會',
                latlng: [24.9339, 121.3686],
                markerClass: 'marker-main',
                labelPos: 'left'
            },
            {
                id: 'tucheng',
                name: '土城分會',
                type: '母會',
                latlng: [24.9722, 121.4508],
                markerClass: 'marker-mother',
                labelPos: 'top'
            },
            {
                id: 'sanchong',
                name: '三重分會',
                type: '友好會',
                latlng: [25.0617, 121.4874],
                markerClass: 'marker-friend',
                labelPos: 'right'
            },
            {
                id: 'daya',
                name: '大雅分會',
                type: '兄弟會',
                latlng: [24.2200, 120.6478],
                markerClass: 'marker-brother',
                labelPos: 'left'
            },
            {
                id: 'fengyuan',
                name: '豐原分會',
                type: '友好會',
                latlng: [24.2542, 120.7183],
                markerClass: 'marker-friend',
                labelPos: 'right'
            },
            {
                id: 'minxiong',
                name: '民雄分會',
                type: '兄弟會',
                latlng: [23.5514, 120.4283],
                markerClass: 'marker-brother',
                labelPos: 'right'
            }
        ],
        korea: {
            id: 'paju',
            name: '韓國坡州青年會議所',
            nameKr: '파주청년회의소',
            type: '韓國坡州姐妹會',
            latlng: [37.7589, 126.7803],
            markerClass: 'marker-sister',
            labelPos: isMobile ? 'left' : 'right'  // PC右邊，手機左邊
        }
    };

    // ===== Global Variables =====
    var map;
    var markers = {};
    var connectionLine = null;
    var timers = [];
    var skipped = false;

    // ===== DOM Elements =====
    var loadingScreen = document.getElementById('loadingScreen');
    var pageTitle = document.getElementById('pageTitle');
    var legend = document.getElementById('legend');
    var legendSister = document.getElementById('legendSister');
    var skipBtn = document.getElementById('skipBtn');
    var enterBtn = document.getElementById('enterBtn');

    /**
     * Create custom marker HTML
     */
    function createMarkerHTML(data) {
        var labelPos = data.labelPos || 'bottom';
        // 韓國 marker 添加特殊 class
        var isKorea = data.id === 'paju';
        var labelClass = 'marker-label label-pos-' + labelPos + (isKorea ? ' korea-label' : ' taiwan-label');

        var labelHTML = '<div class="' + labelClass + '">' +
            '<div class="marker-name">' + data.name + '</div>';

        if (data.nameKr) {
            labelHTML += '<div class="marker-name-kr">' + data.nameKr + '</div>';
        }

        labelHTML += '<div class="marker-type">' + data.type + '</div></div>';

        var pinHTML = '<div class="marker-pin">' +
            '<svg viewBox="0 0 24 36"><path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24c0-6.6-5.4-12-12-12zm0 18c-3.3 0-6-2.7-6-6s2.7-6 6-6 6 2.7 6 6-2.7 6-6 6z"/></svg>' +
            '</div>';

        return '<div class="custom-marker ' + data.markerClass + ' marker-hidden">' +
            pinHTML +
            labelHTML +
            '</div>';
    }

    /**
     * Create Leaflet marker
     */
    function createMarker(data) {
        var icon = L.divIcon({
            className: 'marker-icon-wrapper',
            html: createMarkerHTML(data),
            iconSize: [28, 36],
            iconAnchor: [14, 36]
        });

        var marker = L.marker(data.latlng, { icon: icon });
        return marker;
    }

    /**
     * Show marker with animation
     */
    function showMarker(markerId) {
        var marker = markers[markerId];
        if (!marker) return;

        var el = marker.getElement();
        if (!el) return;

        var markerDiv = el.querySelector('.custom-marker');
        if (markerDiv) {
            markerDiv.classList.remove('marker-hidden');
            markerDiv.classList.add('marker-dropping');

            setTimeout(function () {
                markerDiv.classList.remove('marker-dropping');
                markerDiv.classList.add('marker-visible');
            }, 800);
        }
    }

    /**
     * Draw connection line between Taiwan and Korea
     */
    function drawConnectionLine() {
        var sanxiaPos = MARKERS.taiwan[0].latlng;
        var pajuPos = MARKERS.korea.latlng;

        var midLat = (sanxiaPos[0] + pajuPos[0]) / 2;
        var midLng = (sanxiaPos[1] + pajuPos[1]) / 2 + 2;

        var latlngs = [
            sanxiaPos,
            [midLat - 3, midLng],
            [midLat + 3, midLng],
            pajuPos
        ];

        var svgGradient = '<svg width="0" height="0"><defs>' +
            '<linearGradient id="lineGradient" x1="0%" y1="100%" x2="0%" y2="0%">' +
            '<stop offset="0%" style="stop-color:#ffc857;stop-opacity:0.9"/>' +
            '<stop offset="100%" style="stop-color:#ec4899;stop-opacity:0.9"/>' +
            '</linearGradient></defs></svg>';

        if (!document.getElementById('lineGradient')) {
            document.body.insertAdjacentHTML('beforeend', svgGradient);
        }

        connectionLine = L.polyline(latlngs, {
            className: 'connection-line',
            weight: 3,
            opacity: 0,
            smoothFactor: 1
        }).addTo(map);

        setTimeout(function () {
            var path = document.querySelector('.connection-line');
            if (path) {
                path.style.transition = 'opacity 1s ease';
                path.style.opacity = '1';
            }
        }, 100);
    }

    /**
     * Initialize map
     */
    function initMap() {
        map = L.map('map', {
            center: CONFIG.taiwanCenter,
            zoom: CONFIG.taiwanZoom,
            zoomControl: false,
            attributionControl: false,
            dragging: false,
            scrollWheelZoom: false,
            doubleClickZoom: false,
            touchZoom: false
            // 保持預設的動畫設定，讓 flyTo 可以正常運作
        });

        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png', {
            maxZoom: 19
        }).addTo(map);

        // Create all markers
        MARKERS.taiwan.forEach(function (data) {
            markers[data.id] = createMarker(data);
            markers[data.id].addTo(map);
        });

        markers[MARKERS.korea.id] = createMarker(MARKERS.korea);
        markers[MARKERS.korea.id].addTo(map);
    }

    /**
     * Fly to Asia view - 使用原生 Leaflet flyTo
     */
    function flyToAsiaView() {
        // 開始隱藏台灣的標籤
        document.body.classList.add('asia-view-active');

        // 使用 Leaflet 原生 flyTo 動畫
        map.flyTo(CONFIG.asiaCenter, CONFIG.asiaZoom, {
            duration: CONFIG.flyDuration,
            easeLinearity: 0.25
        });

        // 動畫完成後顯示側邊列表
        map.once('moveend', function () {
            var sideList = document.getElementById('sideListContainer');
            if (sideList) {
                sideList.classList.add('visible');
            }
        });
    }

    /**
     * Clear timers
     */
    function clearTimers() {
        timers.forEach(function (t) { clearTimeout(t); });
        timers = [];
    }

    /**
     * Run animation sequence
     */
    function runAnimation() {
        loadingScreen.classList.add('hidden');

        // 0.5s - Title
        timers.push(setTimeout(function () {
            if (skipped) return;
            pageTitle.classList.add('visible');
        }, 500));

        // 1.5s - Sanxia
        timers.push(setTimeout(function () {
            if (skipped) return;
            showMarker('sanxia');
        }, 1500));

        // 2.5s - Tucheng
        timers.push(setTimeout(function () {
            if (skipped) return;
            showMarker('tucheng');
        }, 2500));

        // 3.3s - Daya
        timers.push(setTimeout(function () {
            if (skipped) return;
            showMarker('daya');
        }, 3300));

        // 4.0s - Minxiong
        timers.push(setTimeout(function () {
            if (skipped) return;
            showMarker('minxiong');
        }, 4000));

        // 4.7s - Sanchong
        timers.push(setTimeout(function () {
            if (skipped) return;
            showMarker('sanchong');
        }, 4700));

        // 5.4s - Fengyuan
        timers.push(setTimeout(function () {
            if (skipped) return;
            showMarker('fengyuan');
        }, 5400));

        // 6.2s - Legend
        timers.push(setTimeout(function () {
            if (skipped) return;
            legend.classList.add('visible');
        }, 6200));

        // 7.5s - Fly to Asia
        timers.push(setTimeout(function () {
            if (skipped) return;
            flyToAsiaView();
        }, 7500));

        // 11s - Paju
        timers.push(setTimeout(function () {
            if (skipped) return;
            showMarker('paju');
            if (legendSister) legendSister.style.display = 'flex';
        }, 11000));

        // 12s - Connection line
        timers.push(setTimeout(function () {
            if (skipped) return;
            drawConnectionLine();
        }, 12000));

        // 13.5s - Enter button
        timers.push(setTimeout(function () {
            if (skipped) return;
            enterBtn.classList.add('visible');
            skipBtn.style.display = 'none';
        }, 13500));
    }

    /**
     * Skip animation
     */
    function skipAnimation() {
        skipped = true;
        clearTimers();

        loadingScreen.classList.add('hidden');
        pageTitle.classList.add('visible');

        // Show all markers
        Object.keys(markers).forEach(function (id) {
            var el = markers[id].getElement();
            if (el) {
                var markerDiv = el.querySelector('.custom-marker');
                if (markerDiv) {
                    markerDiv.classList.remove('marker-hidden');
                    markerDiv.classList.add('marker-visible');
                }
            }
        });

        // Go to Asia view
        map.setView(CONFIG.asiaCenter, CONFIG.asiaZoom, { animate: false });

        document.body.classList.add('asia-view-active');
        var sideList = document.getElementById('sideListContainer');
        if (sideList) {
            sideList.classList.add('visible');
        }

        legend.classList.add('visible');
        if (legendSister) legendSister.style.display = 'flex';

        drawConnectionLine();

        enterBtn.classList.add('visible');
        skipBtn.style.display = 'none';
    }

    /**
     * Enter site - 導向 44、45屆交接典禮
     */
    function enterSite() {
        window.location.href = '/Home/Book_2026';
    }

    /**
     * Initialize
     */
    function init() {
        initMap();

        if (skipBtn) skipBtn.addEventListener('click', skipAnimation);
        if (enterBtn) enterBtn.addEventListener('click', enterSite);

        map.whenReady(function () {
            setTimeout(runAnimation, 500);
        });
    }

    // Start
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
