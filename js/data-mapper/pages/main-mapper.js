/**
 * Main Page Data Mapper
 * main.html 전용 매핑 함수들을 포함한 클래스
 * BaseDataMapper를 상속받아 main 페이지 특화 기능 제공
 */
class MainMapper extends BaseDataMapper {
    constructor() {
        super();
    }

    // ============================================================================
    // 🏠 MAIN PAGE SPECIFIC MAPPINGS
    // ============================================================================

    /**
     * Main 페이지 Hero 섹션 매핑 (텍스트 + 슬라이더)
     */
    mapMainHeroSection() {
        if (!this.isDataLoaded || !this.data.property) return;

        // Hero 텍스트 매핑
        this.mapMainHeroText();

        // Hero 슬라이더 이미지 매핑
        this.mapMainHeroSlider();
    }

    /**
     * Main 페이지 Hero 텍스트만 매핑 (제목, 설명)
     */
    mapMainHeroText() {
        if (!this.isDataLoaded || !this.data.property) return;


        // main 페이지의 hero 데이터 가져오기
        const mainHeroData = this.safeGet(this.data, 'homepage.customFields.pages.main.sections.0.hero');

        // 펜션 이름 매핑 - main 페이지의 hero.title 사용
        const propertyNameElement = this.safeSelect('[data-main-property-name]');
        if (propertyNameElement && mainHeroData) {
            propertyNameElement.textContent = this.sanitizeText(mainHeroData.title, '소개 페이지 히어로 타이틀');
        }

        // Hero 설명 매핑 - main 페이지의 hero.description 사용
        const heroDescriptionElement = this.safeSelect('[data-main-hero-description]');
        if (heroDescriptionElement && mainHeroData) {
            heroDescriptionElement.innerHTML = this._formatTextWithLineBreaks(mainHeroData.description, '소개 페이지 히어로 설명');
        }
    }

    /**
     * Main 페이지 Hero 슬라이더 매핑
     */
    mapMainHeroSlider() {
        if (!this.isDataLoaded) return;

        // main.html 페이지의 hero_section 데이터 가져오기
        const heroData = this.safeGet(this.data, 'homepage.customFields.pages.main.sections.0.hero');
        const heroContainer = document.getElementById('hero-slides-container');

        if (!heroContainer) return;

        // 이미지 데이터 확인 및 필터링
        const hasImages = heroData && heroData.images && heroData.images.length > 0;
        const selectedImages = hasImages
            ? heroData.images.filter(img => img.isSelected).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
            : [];

        // 선택된 이미지가 없으면 빈 상태 표시
        if (selectedImages.length === 0) {
            heroContainer.innerHTML = `
                <div class="hero-slide active">
                    <img class="hero-image" alt="이미지 없음" loading="eager">
                </div>
            `;
            const img = heroContainer.querySelector('img');
            ImageHelpers.applyPlaceholder(img);

            // indicator 업데이트
            const indicatorTotal = document.getElementById('indicator-total');
            if (indicatorTotal) {
                indicatorTotal.textContent = '01';
            }
            return;
        }

        // Hero Slides Container에 슬라이드들 생성
        heroContainer.innerHTML = '';

        selectedImages.forEach((image, index) => {
            const heroSlideDiv = document.createElement('div');
            heroSlideDiv.className = `hero-slide ${index === 0 ? 'active' : ''}`;

            const img = document.createElement('img');
            img.setAttribute('data-image-fallback', '');
            img.src = image.url;
            img.alt = image.description || '';
            img.className = 'hero-image';
            img.loading = index === 0 ? 'eager' : 'lazy';

            heroSlideDiv.appendChild(img);
            heroContainer.appendChild(heroSlideDiv);
        });

        // indicator-total에 총 이미지 개수 표시
        const indicatorTotal = document.getElementById('indicator-total');
        if (indicatorTotal) {
            indicatorTotal.textContent = String(selectedImages.length).padStart(2, '0');
        }

        // 슬라이더 초기화 - DOM이 완전히 로드된 후 실행
        setTimeout(() => {
            // 모든 기존 타이머 정리
            if (typeof window.autoSlideTimer !== 'undefined' && window.autoSlideTimer) {
                clearInterval(window.autoSlideTimer);
                window.autoSlideTimer = null;
            }

            // 전역 currentSlide를 0으로 리셋
            window.currentSlide = 0;

            // 슬라이더 함수들 호출
            if (typeof window.updateSlider === 'function') {
                window.updateSlider();
            }

            if (typeof window.startAutoSlide === 'function') {
                window.startAutoSlide();
            }
        }, 100);
    }

    /**
     * Main 페이지 콘텐츠 섹션 동적 생성
     */
    mapMainContentSections() {
        if (!this.isDataLoaded) return;

        // JSON의 about 섹션 데이터 가져오기
        let aboutSections = this.safeGet(this.data, 'homepage.customFields.pages.main.sections.0.about');

        // 데이터가 없으면 빈 섹션 2개 기본 표시
        if (!aboutSections || !Array.isArray(aboutSections) || aboutSections.length === 0) {
            aboutSections = [
                {
                    title: '블록 생성 후 제목을 입력해주세요.',
                    description: '블록 생성 후 설명을 입력해주세요.',
                    images: []
                },
                {
                    title: '블록 생성 후 제목을 입력해주세요.',
                    description: '블록 생성 후 설명을 입력해주세요.',
                    images: []
                }
            ];
        }

        // 동적 콘텐츠 섹션 컨테이너 찾기 (또는 생성)
        let contentContainer = document.getElementById('dynamic-content-sections');
        if (!contentContainer) {
            // Hero 섹션 다음에 동적 컨테이너 삽입
            const heroSection = document.querySelector('section'); // 첫 번째 section이 hero
            if (heroSection) {
                contentContainer = document.createElement('div');
                contentContainer.id = 'dynamic-content-sections';
                heroSection.parentNode.insertBefore(contentContainer, heroSection.nextSibling);

                // 기존 하드코딩된 content-section들 제거
                const existingSections = document.querySelectorAll('.content-section');
                existingSections.forEach(section => section.remove());
            }
        } else {
            // 기존 동적 섹션들 제거
            contentContainer.innerHTML = '';
        }

        // about 배열의 각 항목에 대해 섹션 생성
        aboutSections.forEach((aboutSection, index) => {
            const section = this.createContentSection(aboutSection, index);

            // 홀수 인덱스 섹션은 reverse 클래스 추가 (이미지와 텍스트 순서 바뀜)
            if (index % 2 === 1) {
                const sectionContainer = section.querySelector('.section-container');
                if (sectionContainer) {
                    sectionContainer.classList.add('reverse');
                }
            }

            contentContainer.appendChild(section);
        });
    }




    /**
     * 콘텐츠 섹션 생성 헬퍼 함수
     */
    createContentSection(aboutSection, index) {
        const section = document.createElement('section');
        section.className = 'content-section';

        // title과 description이 비어있으면 기본 placeholder 문구 사용
        const title = this.sanitizeText(aboutSection.title, '블록 생성 후 제목을 입력해주세요.');
        const description = this._formatTextWithLineBreaks(aboutSection.description, '블록 생성 후 설명을 입력해주세요.');

        section.innerHTML = `
            <div class="section-container">
                <!-- Text Content -->
                <div class="text-content">
                    <h2>${title}</h2>
                    <div class="text-description">
                        <p>${description}</p>
                    </div>
                </div>

                <!-- Image Grid -->
                <div class="image-grid" data-dynamic-images="${index}">
                    <!-- 이미지들이 동적으로 삽입됨 -->
                </div>
            </div>
        `;

        // 이미지 그리드 채우기 (이미지가 없어도 빈 이미지 표시)
        const imageGrid = section.querySelector(`[data-dynamic-images="${index}"]`);
        if (imageGrid) {
            this.populateImageGrid(imageGrid, aboutSection.images);
        }

        return section;
    }

    /**
     * 이미지 그리드 채우기 헬퍼 함수 (isSelected: true인 이미지만 최대 2개까지 표시)
     */
    populateImageGrid(container, images) {
        if (!container) return;

        container.innerHTML = '';

        // 이미지가 없거나 빈 배열인 경우 빈 이미지 2개 표시
        if (!images || !Array.isArray(images) || images.length === 0) {
            for (let i = 0; i < 2; i++) {
                const imageItemDiv = document.createElement('div');
                imageItemDiv.className = 'image-item';

                const imageElement = document.createElement('img');
                imageElement.src = ImageHelpers.EMPTY_IMAGE_SVG;
                imageElement.alt = '이미지 없음';
                imageElement.loading = 'lazy';
                imageElement.classList.add('empty-image-placeholder');

                imageItemDiv.appendChild(imageElement);
                container.appendChild(imageItemDiv);
            }
            return;
        }

        // isSelected: true인 이미지만 필터링하고 sortOrder로 정렬한 후 최대 2개까지만 표시
        const selectedImages = images
            .filter(img => img.isSelected)
            .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
            .slice(0, 2);

        const limitedImages = selectedImages;

        limitedImages.forEach((image, index) => {
            // 기존 HTML 구조와 동일하게 .image-item div로 래핑
            const imageItemDiv = document.createElement('div');
            imageItemDiv.className = 'image-item';

            const imageElement = document.createElement('img');
            imageElement.src = image.url || image;
            imageElement.alt = image.description || `이미지 ${index + 1}`;
            imageElement.loading = 'lazy';

            // data-image-fallback 속성 추가 (기존 이미지 폴백 시스템 활용)
            imageElement.setAttribute('data-image-fallback', '');

            imageItemDiv.appendChild(imageElement);
            container.appendChild(imageItemDiv);
        });

        // 이미지가 1개만 있으면 나머지 1개는 빈 이미지로 채우기
        if (limitedImages.length < 2) {
            for (let i = limitedImages.length; i < 2; i++) {
                const imageItemDiv = document.createElement('div');
                imageItemDiv.className = 'image-item';

                const imageElement = document.createElement('img');
                imageElement.src = ImageHelpers.EMPTY_IMAGE_SVG;
                imageElement.alt = '이미지 없음';
                imageElement.loading = 'lazy';
                imageElement.classList.add('empty-image-placeholder');

                imageItemDiv.appendChild(imageElement);
                container.appendChild(imageItemDiv);
            }
        }
    }

    /**
     * Main 페이지 이미지 그리드 매핑 (기존 매퍼 호환성)
     */
    mapMainImageGrids() {
        // 이미지 폴백 시스템 재초기화 (기존 시스템과 호환성)
        if (typeof initImageFallback === 'function') {
            initImageFallback();
        }
    }

    // ============================================================================
    // 🔄 TEMPLATE METHODS IMPLEMENTATION
    // ============================================================================

    /**
     * Main 페이지 전체 매핑 실행
     */
    async mapPage() {
        if (!this.isDataLoaded) {
            console.error('Cannot map main page: data not loaded');
            return;
        }

        // Main 페이지 섹션들 순차 매핑
        this.mapMainHeroSection(); // 텍스트 + 슬라이더 모두 처리
        this.mapMainContentSections();
        this.mapMainImageGrids();

        // 메타 태그 업데이트
        this.updateMetaTags();

        // Open Graph 메타 태그 매핑
        const mainData = this.safeGet(this.data, 'homepage.customFields.pages.main.sections.0');
        const ogTitle = this.data?.seo?.title || this.data?.property?.name || '';
        const ogDescription = mainData?.hero?.description || this.data?.seo?.description || '';
        // Hero 슬라이더 선택 로직과 동일: isSelected 및 sortOrder 고려
        const selectedImages = mainData?.hero?.images?.filter(img => img.isSelected).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)) ?? [];
        const ogImage = selectedImages[0]?.url || '';
        this.mapOpenGraphTags(ogTitle, ogDescription, ogImage);

        // E-commerce registration 매핑
        this.mapEcommerceRegistration();

        // 애니메이션 재초기화
        this.reinitializeScrollAnimations();
    }
}

// ES6 모듈 및 글로벌 노출
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MainMapper;
} else {
    window.MainMapper = MainMapper;
}
