/**
 * Utils.js - 공통 유틸리티 함수들
 * DOM 조작, 이벤트 처리, 데이터 변환 등의 헬퍼 함수 모음
 */

// DOM 유틸리티
const DOMUtils = {
    /**
     * 요소 선택
     */
    $(selector) {
        return document.querySelector(selector);
    },

    $$(selector) {
        return document.querySelectorAll(selector);
    },

    /**
     * 요소 생성
     */
    createElement(tag, attributes = {}, children = []) {
        const element = document.createElement(tag);
        
        Object.entries(attributes).forEach(([key, value]) => {
            if (key === 'className') {
                element.className = value;
            } else if (key === 'innerHTML') {
                element.innerHTML = value;
            } else if (key === 'textContent') {
                element.textContent = value;
            } else {
                element.setAttribute(key, value);
            }
        });

        children.forEach(child => {
            if (typeof child === 'string') {
                element.appendChild(document.createTextNode(child));
            } else if (child instanceof Element) {
                element.appendChild(child);
            }
        });

        return element;
    },

    /**
     * 클래스 조작
     */
    addClass(element, className) {
        if (element) element.classList.add(className);
    },

    removeClass(element, className) {
        if (element) element.classList.remove(className);
    },

    toggleClass(element, className) {
        if (element) element.classList.toggle(className);
    },

    hasClass(element, className) {
        return element ? element.classList.contains(className) : false;
    }
};

// 이벤트 유틸리티
const EventUtils = {
    /**
     * 이벤트 리스너 추가
     */
    on(element, event, handler, options = {}) {
        if (element) {
            element.addEventListener(event, handler, options);
        }
    },

    /**
     * 이벤트 리스너 제거
     */
    off(element, event, handler, options = {}) {
        if (element) {
            element.removeEventListener(event, handler, options);
        }
    },

    /**
     * 한 번만 실행되는 이벤트 리스너
     */
    once(element, event, handler) {
        this.on(element, event, handler, { once: true });
    },

    /**
     * 이벤트 위임
     */
    delegate(parent, selector, event, handler) {
        this.on(parent, event, (e) => {
            if (e.target.matches(selector) || e.target.closest(selector)) {
                handler.call(e.target.closest(selector), e);
            }
        });
    },

    /**
     * 커스텀 이벤트 발생
     */
    trigger(element, eventName, detail = {}) {
        if (element) {
            const event = new CustomEvent(eventName, { detail, bubbles: true });
            element.dispatchEvent(event);
        }
    }
};

// 애니메이션 유틸리티
const AnimationUtils = {
    /**
     * 페이드 인
     */
    fadeIn(element, duration = 300) {
        if (!element) return Promise.resolve();

        return new Promise(resolve => {
            element.style.opacity = '0';
            element.style.display = 'block';
            
            const start = performance.now();
            
            function animate(currentTime) {
                const elapsed = currentTime - start;
                const progress = Math.min(elapsed / duration, 1);
                
                element.style.opacity = progress.toString();
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    resolve();
                }
            }
            
            requestAnimationFrame(animate);
        });
    },

    /**
     * 페이드 아웃
     */
    fadeOut(element, duration = 300) {
        if (!element) return Promise.resolve();

        return new Promise(resolve => {
            const start = performance.now();
            const startOpacity = parseFloat(getComputedStyle(element).opacity);
            
            function animate(currentTime) {
                const elapsed = currentTime - start;
                const progress = Math.min(elapsed / duration, 1);
                
                element.style.opacity = (startOpacity * (1 - progress)).toString();
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    element.style.display = 'none';
                    resolve();
                }
            }
            
            requestAnimationFrame(animate);
        });
    },

    /**
     * 슬라이드 다운
     */
    slideDown(element, duration = 300) {
        if (!element) return Promise.resolve();

        return new Promise(resolve => {
            element.style.overflow = 'hidden';
            element.style.height = '0px';
            element.style.display = 'block';
            
            const fullHeight = element.scrollHeight + 'px';
            const start = performance.now();
            
            function animate(currentTime) {
                const elapsed = currentTime - start;
                const progress = Math.min(elapsed / duration, 1);
                
                element.style.height = (parseInt(fullHeight) * progress) + 'px';
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    element.style.height = '';
                    element.style.overflow = '';
                    resolve();
                }
            }
            
            requestAnimationFrame(animate);
        });
    },

    /**
     * 슬라이드 업
     */
    slideUp(element, duration = 300) {
        if (!element) return Promise.resolve();

        return new Promise(resolve => {
            const startHeight = element.offsetHeight;
            element.style.overflow = 'hidden';
            
            const start = performance.now();
            
            function animate(currentTime) {
                const elapsed = currentTime - start;
                const progress = Math.min(elapsed / duration, 1);
                
                element.style.height = (startHeight * (1 - progress)) + 'px';
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    element.style.display = 'none';
                    element.style.height = '';
                    element.style.overflow = '';
                    resolve();
                }
            }
            
            requestAnimationFrame(animate);
        });
    }
};

// 스크롤 유틸리티
const ScrollUtils = {
    /**
     * 부드러운 스크롤
     */
    smoothScrollTo(target, duration = 1000) {
        const targetElement = typeof target === 'string' ? DOMUtils.$(target) : target;
        if (!targetElement) return;

        const targetPosition = targetElement.offsetTop;
        const startPosition = window.pageYOffset;
        const distance = targetPosition - startPosition;
        const startTime = performance.now();

        function animation(currentTime) {
            const timeElapsed = currentTime - startTime;
            const progress = Math.min(timeElapsed / duration, 1);
            
            // Easing function (ease-in-out)
            const easedProgress = progress < 0.5 
                ? 2 * progress * progress 
                : -1 + (4 - 2 * progress) * progress;

            window.scrollTo(0, startPosition + distance * easedProgress);

            if (progress < 1) {
                requestAnimationFrame(animation);
            }
        }

        requestAnimationFrame(animation);
    },

    /**
     * 스크롤 위치 확인
     */
    isInViewport(element) {
        if (!element) return false;

        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    },

    /**
     * 스크롤 방향 감지
     */
    getScrollDirection() {
        let lastScrollTop = 0;
        
        return function() {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const direction = scrollTop > lastScrollTop ? 'down' : 'up';
            lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
            return direction;
        };
    }
};

// 데이터 유틸리티
const DataUtils = {
    /**
     * 로컬 스토리지
     */
    setLocal(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.warn('localStorage not available:', e);
        }
    },

    getLocal(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (e) {
            console.warn('localStorage not available:', e);
            return defaultValue;
        }
    },

    removeLocal(key) {
        try {
            localStorage.removeItem(key);
        } catch (e) {
            console.warn('localStorage not available:', e);
        }
    },

    /**
     * 세션 스토리지
     */
    setSession(key, value) {
        try {
            sessionStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.warn('sessionStorage not available:', e);
        }
    },

    getSession(key, defaultValue = null) {
        try {
            const item = sessionStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (e) {
            console.warn('sessionStorage not available:', e);
            return defaultValue;
        }
    },

    /**
     * 딥 클론
     */
    deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj.getTime());
        if (obj instanceof Array) return obj.map(item => this.deepClone(item));
        if (typeof obj === 'object') {
            const copy = {};
            Object.keys(obj).forEach(key => {
                copy[key] = this.deepClone(obj[key]);
            });
            return copy;
        }
    }
};

// 디바운스 및 스로틀
const PerformanceUtils = {
    /**
     * 디바운스 함수
     */
    debounce(func, delay = 300) {
        let timeoutId;
        return function (...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    },

    /**
     * 스로틀 함수
     */
    throttle(func, limit = 100) {
        let inThrottle;
        return function (...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
};

// 유효성 검사
const ValidationUtils = {
    /**
     * 이메일 유효성 검사
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    /**
     * 전화번호 유효성 검사 (한국)
     */
    isValidPhone(phone) {
        const phoneRegex = /^01([0|1|6|7|8|9])-?([0-9]{3,4})-?([0-9]{4})$/;
        return phoneRegex.test(phone);
    },

    /**
     * URL 유효성 검사
     */
    isValidUrl(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }
};

// 전역 네임스페이스에 유틸리티 함수들 추가
window.Utils = {
    DOM: DOMUtils,
    Event: EventUtils,
    Animation: AnimationUtils,
    Scroll: ScrollUtils,
    Data: DataUtils,
    Performance: PerformanceUtils,
    Validation: ValidationUtils
};

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        DOMUtils,
        EventUtils,
        AnimationUtils,
        ScrollUtils,
        DataUtils,
        PerformanceUtils,
        ValidationUtils
    };
}