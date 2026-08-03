/**
 * Layout Map Page Data Mapper
 * layout-map.html 전용 매핑 함수들을 포함한 클래스
 * BaseDataMapper를 상속받아 배치도 페이지 특화 기능 제공
 */
class LayoutMapMapper extends BaseDataMapper {
    constructor() {
        super();
    }

    // ============================================================================
    // 🏠 LAYOUT MAP PAGE SPECIFIC MAPPINGS
    // ============================================================================

    /**
     * Hero 이미지 매핑
     * homepage.customFields.layoutMap.sections[0].hero.images → [data-layout-map-hero-slider]
     */
    mapHeroSlider() {
        if (!this.isDataLoaded) return;

        const heroData = this.safeGet(this.data, 'homepage.customFields.pages.layoutMap.sections.0.hero');
        const sliderContainer = this.safeSelect('[data-layout-map-hero-slider]');
        if (!sliderContainer) return;

        const images = heroData?.images || [];
        let normalizedImages = [];

        if (images.length > 0) {
            if (typeof images[0] === 'string') {
                normalizedImages = images.map(url => ({ url, description: '' }));
            } else {
                normalizedImages = images
                    .filter(img => img.isSelected === true)
                    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
                    .map(img => ({ url: img.url, description: img.description || '' }));
            }
        }

        sliderContainer.innerHTML = '';

        if (normalizedImages.length === 0) {
            const slideDiv = document.createElement('div');
            slideDiv.className = 'main-slide';
            const imgEl = document.createElement('img');
            imgEl.src = ImageHelpers.EMPTY_IMAGE_WITH_ICON;
            imgEl.alt = '이미지 없음';
            imgEl.classList.add('empty-image-placeholder');
            slideDiv.appendChild(imgEl);
            sliderContainer.appendChild(slideDiv);
            return;
        }

        normalizedImages.forEach((img, index) => {
            const slideDiv = document.createElement('div');
            slideDiv.className = 'main-slide';
            const imgEl = document.createElement('img');
            imgEl.src = img.url;
            imgEl.alt = this.sanitizeText(img.description, '배치도 히어로 이미지');
            imgEl.loading = index === 0 ? 'eager' : 'lazy';
            slideDiv.appendChild(imgEl);
            sliderContainer.appendChild(slideDiv);
        });
    }

    /**
     * Hero 섹션 제목/설명 매핑
     * customFields.layoutMap.sections[0].hero.title → [data-layout-map-hero-title]
     * customFields.layoutMap.sections[0].hero.description → [data-layout-map-hero-description]
     */
    mapHeroContent() {
        if (!this.isDataLoaded) return;

        const heroData = this.safeGet(this.data, 'homepage.customFields.pages.layoutMap.sections.0.hero');

        // Hero 제목 매핑
        const heroTitle = this.safeSelect('[data-layout-map-hero-title]');
        if (heroTitle) {
            heroTitle.textContent = this.sanitizeText(heroData?.title, '배치도 히어로 타이틀');
        }

        // Hero 설명 매핑
        const heroDescription = this.safeSelect('[data-layout-map-hero-description]');
        if (heroDescription) {
            heroDescription.innerHTML = this._formatTextWithLineBreaks(heroData?.description, '배치도 히어로 설명');
        }
    }

    /**
     * About 섹션 매핑 (배치도 이미지 + 제목/설명)
     * homepage.customFields.layoutMap.sections[0].about → [data-layout-map-about]
     */
    mapAboutSection() {
        if (!this.isDataLoaded) return;

        const aboutData = this.safeGet(this.data, 'homepage.customFields.pages.layoutMap.sections.0.about');
        const aboutContainer = this.safeSelect('[data-layout-map-about]');
        const isDemo = this.dataSource === 'demo-filled.json';

        if (!aboutContainer) {
            return;
        }

        // 기존 내용 제거
        aboutContainer.innerHTML = '';

        // about 데이터가 없으면 더미 데이터 사용
        const layoutData = aboutData || (isDemo ? {
            title: '배치도',
            description: '배치도 설명',
            images: ['./images/room.jpg']
        } : {
            title: '배치도',
            description: '배치도 설명',
            images: [ImageHelpers.EMPTY_IMAGE_WITH_ICON],
            isEmpty: true
        });

        // layoutmap-block 생성
        const block = this.createLayoutMapBlock(layoutData, isDemo);
        aboutContainer.appendChild(block);
    }

    /**
     * layoutmap-block 생성 헬퍼 함수
     */
    createLayoutMapBlock(layoutData, isDemo = true) {
        const defaultImage = './images/room.jpg';
        const emptyImage = ImageHelpers.EMPTY_IMAGE_WITH_ICON;

        // layoutmap-block
        const block = document.createElement('div');
        block.className = 'layoutmap-block';

        // 캡션 부분 (제목 + 설명) - 위에 배치
        const caption = document.createElement('div');
        caption.className = 'layoutmap-caption';

        const title = document.createElement('h2');
        title.className = 'layoutmap-title';
        title.textContent = this.sanitizeText(layoutData.title, '배치도 제목');

        const description = document.createElement('p');
        description.className = 'layoutmap-desc';
        description.innerHTML = this._formatTextWithLineBreaks(layoutData.description, '배치도 설명');

        caption.appendChild(title);
        caption.appendChild(description);
        block.appendChild(caption);

        // 이미지 갤러리 부분 (여러 이미지)
        const imgGallery = document.createElement('div');

        // isSelected true인 이미지 필터링
        let selectedImages = layoutData.images && Array.isArray(layoutData.images) ? layoutData.images : [];
        if (selectedImages.length > 0 && typeof selectedImages[0] === 'object') {
            selectedImages = selectedImages.filter(img => img.isSelected === true);
        }

        // 이미지가 없으면 기본 이미지 추가
        if (selectedImages.length === 0) {
            if (layoutData.isEmpty) {
                selectedImages = [{ url: emptyImage, description: '', isPlaceholder: true }];
            } else {
                selectedImages = [{ url: isDemo ? defaultImage : emptyImage, description: '', isPlaceholder: !isDemo }];
            }
        }

        // 이미지 개수에 따른 클래스 추가 (최대 6개까지만 표시, 7개 이상은 숨김)
        const imageCount = Math.min(selectedImages.length, 6);
        imgGallery.className = `layoutmap-images-gallery layoutmap-images-gallery--count-${imageCount}`;

        // 각 이미지 생성 (최대 6개까지만)
        selectedImages.slice(0, 6).forEach((imageData, index) => {
            const imgContainer = document.createElement('div');
            imgContainer.className = 'layoutmap-image-item';

            // 이미지
            const imgWrapper = document.createElement('div');
            imgWrapper.className = 'layoutmap-image';

            const img = document.createElement('img');
            const imageUrl = typeof imageData === 'string' ? imageData : imageData.url;

            if (imageUrl) {
                img.src = imageUrl;
                img.alt = this.sanitizeText(layoutData.title, `배치도 이미지 ${index + 1}`);
            }

            if (imageData.isPlaceholder) {
                img.classList.add('empty-image-placeholder');
            }

            imgWrapper.appendChild(img);
            imgContainer.appendChild(imgWrapper);

            // 이미지 설명
            if (imageData.description) {
                const imageDesc = document.createElement('div');
                imageDesc.className = 'layoutmap-image-desc';

                const imageDescText = document.createElement('p');
                imageDescText.className = 'layoutmap-image-desc-text';
                imageDescText.innerHTML = this._formatTextWithLineBreaks(imageData.description, '배치도 이미지 설명');

                imageDesc.appendChild(imageDescText);
                imgContainer.appendChild(imageDesc);
            }

            imgGallery.appendChild(imgContainer);
        });

        block.appendChild(imgGallery);

        return block;
    }

    /**
     * Closing Section 매핑 (마무리 섹션)
     * homepage.customFields.pages.index.sections[0].closing → [data-closing-image], [data-closing-title], [data-closing-description]
     */
    mapClosingSection() {
        if (!this.isDataLoaded) return;

        const closingData = this.safeGet(this.data, 'homepage.customFields.pages.index.sections.0.closing');

        // 배경 이미지 매핑
        const bgEl = this.safeSelect('[data-closing-image]');
        if (bgEl) {
            const selectedImages = (closingData?.images || [])
                .filter(img => img.isSelected === true)
                .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

            if (selectedImages.length > 0) {
                bgEl.style.backgroundImage = `url('${selectedImages[0].url}')`;
                bgEl.classList.remove('empty-image-placeholder');
            } else {
                bgEl.style.backgroundImage = `url('${ImageHelpers.EMPTY_IMAGE_WITH_ICON}')`;
                bgEl.classList.add('empty-image-placeholder');
            }
        }

        // 타이틀 매핑
        const closingTitle = this.safeSelect('[data-closing-title]');
        if (closingTitle) {
            closingTitle.textContent = this.sanitizeText(closingData?.title, '마무리 섹션 타이틀');
        }

        // 설명 매핑
        const descElement = this.safeSelect('[data-closing-description]');
        if (descElement) {
            descElement.innerHTML = this._formatTextWithLineBreaks(closingData?.description, '마무리 섹션 설명');
        }
    }

    // ============================================================================
    // 🔄 TEMPLATE METHODS IMPLEMENTATION
    // ============================================================================

    /**
     * Layout Map 페이지 전체 매핑 실행
     */
    async mapPage() {
        if (!this.isDataLoaded) {
            return;
        }

        // enabled 체크 — false면 404로 리다이렉트
        const pageData = this.safeGet(this.data, 'homepage.customFields.pages.layoutMap.sections.0');
        if (pageData?.enabled === false) {
            window.location.href = '404.html';
            return;
        }

        // Layout Map 페이지 섹션들 순차 매핑
        this.mapHeroSlider();
        this.mapHeroContent();
        this.mapAboutSection();
        this.mapClosingSection();

        // 슬라이더 재초기화
        if (typeof window.initHeroSlider === 'function') {
            window.initHeroSlider();
        }

        // 스크롤 애니메이션 초기화 (mapper가 .layoutmap-block을 동적 생성한 후)
        if (typeof window.setupLayoutMapAnimations === 'function') {
            window.setupLayoutMapAnimations();
        }

        // 메타 태그 업데이트
        this.updateMetaTags();
    }
}

// ============================================================================
// 🚀 INITIALIZATION
// ============================================================================

// 페이지 로드 시 자동 초기화 (로컬 환경용, iframe 아닐 때만)
if (typeof window !== 'undefined' && window.parent === window) {
    window.addEventListener('DOMContentLoaded', async () => {
        const mapper = new LayoutMapMapper();
        await mapper.initialize();
    });
}

// ES6 모듈 및 글로벌 노출
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LayoutMapMapper;
} else {
    window.LayoutMapMapper = LayoutMapMapper;
}
