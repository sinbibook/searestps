// Header and Footer Dynamic Loader
class HeaderFooterLoader {
    constructor() {
        this.headerLoaded = false;
        this.footerLoaded = false;
    }
    
    // Extract content from header.html
    async loadHeader() {
        if (this.headerLoaded) return;

        try {
            const response = await fetch('./common/header.html');
            const html = await response.text();
            
            // Parse the HTML and extract the header element and mobile menu
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const headerElement = doc.querySelector('header');
            const mobileMenuElement = doc.querySelector('.mobile-menu');
            const fixedBookingBtn = doc.querySelector('.fixed-mobile-booking-btn');
            const styleElements = doc.querySelectorAll('head style');
            const linkElements = doc.querySelectorAll('head link[rel="stylesheet"]');
            const scriptElements = doc.querySelectorAll('script');

            if (headerElement) {
                // Create header container at the top of body
                const headerContainer = document.createElement('div');
                headerContainer.id = 'header-container';
                headerContainer.style.position = 'fixed';
                headerContainer.style.top = '0';
                headerContainer.style.left = '0';
                headerContainer.style.right = '0';
                headerContainer.style.zIndex = '1000';
                headerContainer.innerHTML = headerElement.outerHTML;

                // Insert header at the beginning of body
                document.body.insertBefore(headerContainer, document.body.firstChild);

                // mobile-menu가 header 밖에 별도로 있으면 body에 직접 추가
                if (mobileMenuElement && !headerElement.contains(mobileMenuElement)) {
                    const mobileMenuClone = mobileMenuElement.cloneNode(true);
                    document.body.appendChild(mobileMenuClone);
                }

                // Add fixed mobile booking button
                if (fixedBookingBtn) {
                    const bookingBtnClone = fixedBookingBtn.cloneNode(true);
                    document.body.appendChild(bookingBtnClone);
                }
                
                // Add styles to head
                styleElements.forEach(style => {
                    const newStyle = document.createElement('style');
                    newStyle.textContent = style.textContent;
                    document.head.appendChild(newStyle);
                });

                // Add CSS links to head
                linkElements.forEach(link => {
                    const newLink = document.createElement('link');
                    newLink.rel = 'stylesheet';
                    newLink.href = link.href;
                    document.head.appendChild(newLink);
                });
                
                // Add scripts to body and wait for them to load
                const scriptPromises = Array.from(scriptElements).map(script => {
                    return new Promise((resolve, reject) => {
                        const newScript = document.createElement('script');

                        // Handle external script files (src attribute)
                        if (script.src) {
                            newScript.src = script.src;
                            newScript.onload = resolve;
                            newScript.onerror = reject;
                        } else {
                            // Handle inline scripts (execute immediately)
                            newScript.textContent = script.textContent;
                            resolve();
                        }

                        document.body.appendChild(newScript);
                    });
                });

                // Wait for all scripts to load before setting up event listeners
                const results = await Promise.allSettled(scriptPromises);
                results.forEach(result => {
                    if (result.status === 'rejected') {
                        console.error('A script failed to load:', result.reason);
                    }
                });

                // Set up event listeners after scripts are loaded
                this.setupHeaderEventListeners();

                // Header 매핑은 즉시 실행 (FOUC 방지)
                this.applyHeaderFooterMapping();
                
                // Dynamically calculate and adjust body padding to account for fixed header
                this.adjustBodyPadding();
                
                this.headerLoaded = true;
            }
        } catch (error) {
            console.error('Failed to load header:', error);
        }
    }
    
    // Extract content from footer.html
    async loadFooter() {
        if (this.footerLoaded) return;

        try {
            const response = await fetch('./common/footer.html');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const html = await response.text();
            
            // Parse the HTML and extract the footer element
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const parsedFooterElement = doc.querySelector('footer');
            const styleElements = doc.querySelectorAll('head style');
            const linkElements = doc.querySelectorAll('head link[rel="stylesheet"]');
            
            if (parsedFooterElement) {
                // Create footer container at the bottom of body
                const footerContainer = document.createElement('div');
                footerContainer.id = 'footer-container';
                footerContainer.innerHTML = parsedFooterElement.outerHTML;
                
                // Force immediate style application BEFORE appending
                footerContainer.style.display = 'block';
                footerContainer.style.width = '100%';
                footerContainer.style.position = 'relative';
                footerContainer.style.zIndex = '10'; // mobile-menu(1001) 아래로
                footerContainer.style.clear = 'both';
                
                // Ensure footer appears at the very end of body
                document.body.appendChild(footerContainer);
                
                // Add styles to head
                styleElements.forEach(style => {
                    const newStyle = document.createElement('style');
                    newStyle.id = 'footer-styles';
                    newStyle.textContent = style.textContent;
                    document.head.appendChild(newStyle);
                });

                // Add CSS links to head
                linkElements.forEach(link => {
                    const newLink = document.createElement('link');
                    newLink.rel = 'stylesheet';
                    newLink.href = link.href;
                    document.head.appendChild(newLink);
                });
                
                // Ensure proper footer positioning
                this.ensureFooterPositioning();
                
                this.footerLoaded = true;
            }
        } catch (error) {
            console.error('Failed to load footer:', error);
        }
    }
    
    // Dynamically calculate header height and adjust body padding
    adjustBodyPadding() {
        const headerContainer = document.getElementById('header-container');
        if (headerContainer) {
            // Remove existing padding style if it exists
            const existingStyle = document.getElementById('header-padding-style');
            if (existingStyle) {
                existingStyle.remove();
            }
            
            // Wait for DOM to be fully rendered before calculating height
            setTimeout(() => {
                // Apply padding using CSS with ID for easy removal/replacement
                const style = document.createElement('style');
                style.id = 'header-padding-style';
                style.textContent = `
                    body {
                        box-sizing: border-box !important;
                        transition: padding-top 0.3s ease-out !important;
                    }
                    
                    /* Ensure scroll indicator stays visible */
                    .scroll-indicator {
                        bottom: 2rem !important;
                    }
                `;
                document.head.appendChild(style);
            }, 150);
        }
    }
    
    // Ensure footer stays at bottom and requires scroll
    ensureFooterPositioning() {
        // Get the footer container
        const footerContainer = document.getElementById('footer-container');
        if (!footerContainer) return;

        // Apply minimal styling to ensure footer appears
        footerContainer.style.display = 'block';
        footerContainer.style.width = '100%';
        footerContainer.style.clear = 'both';
    }
    
    // Load both header and footer
    async loadAll() {
        await Promise.all([
            this.loadHeader(),
            this.loadFooter()
        ]);
    }
    
    // Initialize with proper timing
    init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.loadAll();
                this.setupResizeHandler();
            });
        } else {
            this.loadAll();
            this.setupResizeHandler();
        }
    }
    
    // Setup header event listeners after dynamic loading
    setupHeaderEventListeners() {
        // Ensure menu functions are properly attached
        const navContainer = document.querySelector('.nav-container');
        if (navContainer) {
            // Remove existing event listeners and re-attach
            navContainer.onmouseenter = null;
            navContainer.onmouseleave = null;
            
            navContainer.addEventListener('mouseenter', function() {
                if (window.showSubMenus) {
                    window.showSubMenus();
                }
            });
            
            navContainer.addEventListener('mouseleave', function() {
                if (window.hideSubMenus) {
                    window.hideSubMenus();
                }
            });
        }
        
        // Ensure mobile menu toggle is working
        const mobileToggle = document.querySelector('.mobile-toggle');
        if (mobileToggle) {
            mobileToggle.onclick = null; // Remove inline handler
            mobileToggle.addEventListener('click', function() {
                if (window.toggleMobileMenu) {
                    window.toggleMobileMenu();
                }
            });
        }
        
        // Ensure logo navigation is working
        const logoContainer = document.querySelector('.logo-container');
        if (logoContainer) {
            logoContainer.onclick = null; // Remove inline handler
            logoContainer.addEventListener('click', function() {
                if (window.navigateTo) {
                    window.navigateTo('home');
                }
            });
        }
        
        // Ensure all menu item clicks work
        const menuItems = document.querySelectorAll('.menu-item, .sub-menu-item, .mobile-sub-item');
        menuItems.forEach(item => {
            const onclickAttr = item.getAttribute('onclick');
            if (onclickAttr) {
                item.onclick = null; // Remove inline handler

                // navigateTo 함수 호출이 아닌 경우 건너뛰기
                if (!onclickAttr.includes('navigateTo(')) {
                    return;
                }

                const match = onclickAttr.match(/navigateTo\(['"]([^'"]+)['"]\)/);
                if (match && match[1]) {
                    const page = match[1];
                    item.addEventListener('click', function() {
                        if (window.navigateTo) {
                            window.navigateTo(page);
                        }
                    });
                }
            }
        });
        
        // Add click support for main menu items to show submenus
        const mainMenuItems = document.querySelectorAll('.menu-item');
        mainMenuItems.forEach(item => {
            // Add click handler for submenu toggle (in addition to navigation)
            item.addEventListener('click', function(e) {
                // If submenus are not visible, show them and prevent navigation
                const subMenus = document.getElementById('sub-menus');
                if (subMenus && !subMenus.classList.contains('show')) {
                    e.preventDefault();
                    e.stopPropagation();
                    if (window.showSubMenus) {
                        window.showSubMenus();
                    }
                    return false;
                }
            });
        });
        
        // HeaderFooterMapper는 header 로드 후에 실행됨
    }

    // Apply HeaderFooterMapper for dynamic content mapping
    async applyHeaderFooterMapping() {
        // iframe 환경에서는 PreviewHandler가 담당하므로 여기서 실행하지 않음
        if (window.parent !== window) {
            return;
        }

        // HeaderFooterMapper가 로드되어 있는지 확인
        if (typeof HeaderFooterMapper === 'undefined') {
            console.warn('⚠️ HeaderFooterMapper not loaded, skipping header/footer mapping');
            return;
        }

        try {
            // HeaderFooterMapper 인스턴스 생성 및 초기화
            const headerFooterMapper = new HeaderFooterMapper();
            await headerFooterMapper.initialize();

            // Header와 Footer 매핑 실행
            await headerFooterMapper.mapHeaderFooter();
        } catch (error) {
            console.error('❌ Header/Footer mapping failed:', error);
        }
    }

    // Setup resize handler to recalculate header padding
    setupResizeHandler() {
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                if (this.headerLoaded) {
                    this.adjustBodyPadding();
                }
            }, 250); // Debounce resize events
        });
    }
}

// Global instance
window.headerFooterLoader = new HeaderFooterLoader();

// Auto-initialize if not manually controlled
if (!window.MANUAL_HEADER_FOOTER_INIT) {
    window.headerFooterLoader.init();
}

// Provide manual control functions
window.loadHeaderFooter = () => window.headerFooterLoader.loadAll();
window.loadHeader = () => window.headerFooterLoader.loadHeader();
window.loadFooter = () => window.headerFooterLoader.loadFooter();