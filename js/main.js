/**
 * Main.js - 모든 JavaScript 파일을 로드하는 메인 파일
 * 순서대로 필요한 스크립트들을 로드하고 초기화
 */

(function() {
    'use strict';

    // 스크립트 로드 순서 정의
    const scriptsToLoad = [
        '../js/utils.js',
        '../js/image-with-fallback.js',
        '../js/animated-fade-gallery.js',
        '../js/app.js'
    ];

    let loadedScripts = 0;
    const totalScripts = scriptsToLoad.length;

    /**
     * 스크립트 동적 로드 함수 (성능 최적화)
     */
    function loadScript(src, callback) {
        // 이미 로드된 스크립트 확인
        const existingScript = document.querySelector(`script[src="${src}"]`);
        if (existingScript) {
            if (callback) callback();
            return;
        }

        const script = document.createElement('script');
        script.src = src;
        script.async = false; // 순서 보장
        script.defer = true;
        
        // 프리로딩 최적화
        script.setAttribute('rel', 'preload');
        script.setAttribute('as', 'script');

        const onComplete = () => {
            loadedScripts++;
            if (callback) callback();
            
            // 모든 스크립트가 로드되었는지 확인
            if (loadedScripts === totalScripts) {
                onAllScriptsLoaded();
            }
        };

        script.onload = onComplete;
        script.onerror = function() {
            console.warn(`⚠️ Script load failed, continuing: ${src}`);
            onComplete(); // 실패해도 계속 진행
        };

        document.head.appendChild(script);
    }

    /**
     * 스크립트들을 순차적으로 로드
     */
    function loadScriptsSequentially(scripts, index = 0) {
        if (index >= scripts.length) {
            return;
        }

        loadScript(scripts[index], function() {
            // 다음 스크립트 로드
            loadScriptsSequentially(scripts, index + 1);
        });
    }

    /**
     * 모든 스크립트 로드 완료 후 실행
     */
    function onAllScriptsLoaded() {
        // 커스텀 이벤트 발생
        if (typeof CustomEvent !== 'undefined') {
            const event = new CustomEvent('scriptsLoaded', {
                detail: { loadedCount: loadedScripts, totalCount: totalScripts }
            });
            document.dispatchEvent(event);
        }

        // 추가 초기화 작업이 있다면 여기에 추가
        initializeAfterScriptsLoaded();
    }

    /**
     * 스크립트 로드 후 추가 초기화
     */
    function initializeAfterScriptsLoaded() {
        // 모든 갤러리/슬라이더 컴포넌트가 로드된 후 실행할 초기화 작업들

        // 이미지 preloader 초기화
        if (typeof window.ImagePreloader !== 'undefined') {
            window.ImagePreloader.preloadCriticalImages();
        }

        // 성능 모니터링
        if (typeof window.performance !== 'undefined' && performance.mark) {
            performance.mark('scripts-loaded');
            performance.measure('script-loading-time', 'navigationStart', 'scripts-loaded');
        }

        // 사용자 정의 초기화 이벤트 리스너들 실행
        const initEvents = document.querySelectorAll('[data-init-after-scripts]');
        initEvents.forEach(element => {
            const eventName = element.dataset.initAfterScripts;
            if (eventName && typeof window[eventName] === 'function') {
                window[eventName]();
            }
        });
    }

    /**
     * CSS 파일 로드 함수
     */
    function loadCSS(href) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        link.type = 'text/css';

        document.head.appendChild(link);
    }

    /**
     * 메인 CSS 파일 로드 (아직 로드되지 않은 경우)
     */
    function loadMainCSS() {
        const existingCSS = document.querySelector('link[href*="main.css"]');
        if (!existingCSS) {
            loadCSS('../styles/main.css');
        }
    }

    /**
     * 브라우저 지원 확인 (최적화된 버전)
     */
    function checkBrowserSupport() {
        // 성능을 위해 한 번에 모든 검사 수행
        const support = {
            requestAnimationFrame: !!window.requestAnimationFrame,
            intersectionObserver: !!window.IntersectionObserver,
            customEvent: !!window.CustomEvent,
            arrayForEach: !!Array.prototype.forEach,
            es6Features: typeof Symbol !== 'undefined' && typeof Map !== 'undefined'
        };

        const unsupported = Object.keys(support).filter(feature => !support[feature]);
        
        if (unsupported.length > 0) {
            console.warn('⚠️ Unsupported features:', unsupported);
            
            // 중요한 기능이 없으면 폴백 모드 활성화
            if (!support.intersectionObserver) {
                window.FALLBACK_MODE = true;
                console.info('🔄 Fallback mode enabled for animations');
            }
        }

        return unsupported.length === 0;
    }

    /**
     * 초기화 시작
     */
    function init() {
        // 브라우저 지원 확인
        const isSupported = checkBrowserSupport();
        
        if (!isSupported) {
            console.warn('⚠️ Browser may not fully support all features');
        }

        // CSS 로드
        loadMainCSS();

        // 스크립트 순차 로드 시작
        loadScriptsSequentially(scriptsToLoad);
    }

    /**
     * DOM 준비 확인 후 초기화
     */
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // 전역 유틸리티 함수들 노출
    window.PensionTemplate = {
        version: '1.0.0',
        loadedScripts: () => loadedScripts,
        totalScripts: () => totalScripts,
        isAllLoaded: () => loadedScripts === totalScripts,
        
        // 수동으로 스크립트 로드하는 함수
        loadScript: loadScript,
        
        // 추가 CSS 로드 함수
        loadCSS: loadCSS
    };

})();