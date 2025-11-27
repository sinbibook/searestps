/**
 * Index Page Data Mapper
 * index.html 전용 매핑 함수들을 포함한 클래스
 * BaseDataMapper를 상속받아 index 페이지 특화 기능 제공
 */
class IndexMapper extends BaseDataMapper {
    // 애니메이션 상수
    static ANIMATION_BASE_DELAY = 100;      // 기본 지연 시간 (ms)
    static ANIMATION_STAGGER_DELAY = 100;   // 항목 간 지연 간격 (ms)

    constructor() {
        super();
    }

    // ============================================================================
    // 🏠 INDEX PAGE SPECIFIC MAPPINGS
    // ============================================================================

    /**
     * Hero 섹션 매핑 (index.html 전용)
     */
    async mapHeroSection() {
        if (!this.isDataLoaded || !this.data.property) return;

        const property = this.data.property;

        // index.html 스타일 hero 섹션 매핑 (data 속성 사용)
        const brandTitle = this.safeSelect('[data-index-property-name]');
        if (brandTitle && property.name) {
            brandTitle.textContent = property.name;
        }

        const brandSubtitle = this.safeSelect('[data-index-property-name-en]');
        if (brandSubtitle && property.nameEn) {
            brandSubtitle.textContent = property.nameEn.toUpperCase();
        }

        // 새로운 구조: homepage.customFields.pages.index.sections[0].hero
        const heroData = this.safeGet(this.data, 'homepage.customFields.pages.index.sections.0.hero');

        const taglineMain = this.safeSelect('[data-index-hero-title]');
        if (taglineMain && heroData) {
            taglineMain.textContent = this.sanitizeText(heroData.title, '메인 히어로 타이틀');
        }

        const taglineSub = this.safeSelect('[data-index-property-description]');
        if (taglineSub && heroData) {
            taglineSub.innerHTML = this._formatTextWithLineBreaks(heroData.description, '메인 히어로 설명');
        }

        // Hero 배경 이미지 매핑
        const heroImage = this.safeSelect('[data-index-hero-image]');
        ImageHelpers.applyImageOrPlaceholder(heroImage, heroData?.images);
    }

    /**
     * Essence 섹션 매핑 (index.html 전용)
     */
    mapEssenceSection() {
        if (!this.isDataLoaded) return;

        // 새로운 구조: homepage.customFields.pages.index.sections[0].essence
        const essenceData = this.safeGet(this.data, 'homepage.customFields.pages.index.sections.0.essence');

        if (essenceData) {
            // 이미지 매핑
            const essenceImg = this.safeSelect('[data-index-essence-image]');
            const essenceOverlay = this.safeSelect('.essence-image-overlay');
            ImageHelpers.applyImageOrPlaceholder(essenceImg, essenceData.images, essenceOverlay);

            // 제목 매핑
            const sectionTitle = this.safeSelect('[data-index-essence-title]');
            if (sectionTitle) {
                sectionTitle.textContent = this.sanitizeText(essenceData.title, '특징 섹션 타이틀');
            }

            // 설명 매핑
            const sectionDescription = this.safeSelect('[data-index-essence-description]');
            if (sectionDescription) {
                const description = essenceData.description ||
                                 (essenceData.images && essenceData.images[0]?.description);
                sectionDescription.innerHTML = this._formatTextWithLineBreaks(description, '특징 섹션 설명');
            }
        }
    }

    /**
     * Gallery 섹션 매핑 (index.html 전용)
     */
    mapGallerySection() {
        if (!this.isDataLoaded) return;

        // 갤러리 섹션 제목과 설명, 아이템 요소 (data 속성 사용)
        const galleryTitle = this.safeSelect('[data-index-gallery-title]');
        const galleryDescription = this.safeSelect('[data-index-gallery-description]');
        const galleryItems = this.safeSelect('[data-index-gallery-items]');

        if (!galleryItems) return;

        // 새로운 구조: homepage.customFields.pages.index.sections[0].gallery
        const galleryData = this.safeGet(this.data, 'homepage.customFields.pages.index.sections.0.gallery');

        if (!galleryData) return;

        // 제목 매핑
        if (galleryTitle) {
            galleryTitle.textContent = this.sanitizeText(galleryData.title, '갤러리 섹션 타이틀');
        }

        // 설명 매핑
        if (galleryDescription) {
            galleryDescription.innerHTML = this._formatTextWithLineBreaks(galleryData.description, '갤러리 섹션 설명');
        }

        // 기존 갤러리 아이템 제거
        galleryItems.innerHTML = '';

        // 이미지 데이터가 있으면 처리
        if (galleryData.images && galleryData.images.length > 0) {
            // isSelected가 true인 이미지만 필터링하고 sortOrder로 정렬
            const selectedImages = galleryData.images
                .filter(img => img.isSelected)
                .sort((a, b) => a.sortOrder - b.sortOrder);

            // 선택된 이미지가 없으면 2x2 그리드로 4개의 빈 placeholder 생성
            if (selectedImages.length === 0) {
                this._createPlaceholderGrid(galleryItems, 4, this.createGalleryItem.bind(this));
                return;
            }

            // 갤러리 아이템들 생성
            selectedImages.forEach((image, index) => {
                const galleryItem = this.createGalleryItem(image.url, image.description);
                this._addAnimatedItem(galleryItems, galleryItem, index);
            });
        } else {
            // 이미지가 없으면 2x2 그리드로 4개의 빈 placeholder 생성
            this._createPlaceholderGrid(galleryItems, 4, this.createGalleryItem.bind(this));
        }

        // gallery-grid-animated 애니메이션 트리거
        if (galleryItems.classList.contains('gallery-grid-animated')) {
            setTimeout(() => {
                galleryItems.classList.add('animate');
            }, 100);
        }
    }


    /**
     * Placeholder 그리드 생성 헬퍼
     * @param {HTMLElement} container - 아이템을 추가할 컨테이너
     * @param {number} count - 생성할 placeholder 개수
     * @param {Function} itemCreator - 아이템 생성 함수
     */
    _createPlaceholderGrid(container, count, itemCreator) {
        if (!container) return;

        for (let i = 0; i < count; i++) {
            const emptyItem = itemCreator('', '이미지 설명을 입력해주세요.');
            const img = emptyItem.querySelector('img');
            img.src = ImageHelpers.EMPTY_IMAGE_SVG;
            img.alt = '이미지 없음';
            img.classList.add('empty-image-placeholder');

            // overlay 숨기기
            const overlay = emptyItem.querySelector('.signature-item-overlay');
            if (overlay) overlay.style.display = 'none';

            container.appendChild(emptyItem);
        }
    }

    /**
     * 아이템을 컨테이너에 추가하고 애니메이션을 적용하는 헬퍼 함수
     * CSS transition-delay를 사용하여 메모리 누수 방지
     * @param {HTMLElement} container - 아이템을 추가할 컨테이너
     * @param {HTMLElement} item - 추가할 아이템
     * @param {number} index - 애니메이션 지연 계산용 인덱스
     */
    _addAnimatedItem(container, item, index) {
        const delay = IndexMapper.ANIMATION_BASE_DELAY + (index * IndexMapper.ANIMATION_STAGGER_DELAY);
        item.style.transitionDelay = `${delay}ms`;
        container.appendChild(item);
        // DOM에 요소가 추가된 후 트랜지션이 안정적으로 시작되도록 다음 이벤트 루프에서 클래스를 추가합니다.
        setTimeout(() => {
            item.classList.add('animate');
        }, 0);
    }

    /**
     * Gallery 아이템 생성 헬퍼
     */
    createGalleryItem(imageUrl, title) {
        const div = document.createElement('div');
        div.className = 'signature-item';
        const sanitizedTitle = this.sanitizeText(title);
        div.innerHTML = `
            <img data-image-fallback src="${imageUrl}" alt="${sanitizedTitle}" loading="lazy">
            <div class="signature-item-overlay"></div>
            <div class="signature-item-text">
                <h5 class="signature-item-title${sanitizedTitle ? ' has-text' : ''}">${sanitizedTitle}</h5>
            </div>
        `;
        return div;
    }

    /**
     * Signature 섹션 매핑 (index.html 전용)
     */
    mapSignatureSection() {
        if (!this.isDataLoaded) return;

        // 시그니처 섹션 제목과 설명 매핑 (data 속성 사용)
        const signatureTitle = this.safeSelect('[data-index-signature-title]');
        const signatureDescription = this.safeSelect('[data-index-signature-description]');
        const signatureItems = this.safeSelect('[data-index-signature-items]');

        if (!signatureItems) return;

        // 새로운 구조: homepage.customFields.pages.index.sections[0].signature
        const signatureData = this.safeGet(this.data, 'homepage.customFields.pages.index.sections.0.signature');

        if (!signatureData) return;

        // 제목 매핑
        if (signatureTitle) {
            signatureTitle.textContent = this.sanitizeText(signatureData.title, '시그니처 섹션 타이틀');
        }

        // 설명 매핑
        if (signatureDescription) {
            signatureDescription.innerHTML = this._formatTextWithLineBreaks(signatureData.description, '시그니처 섹션 설명');
        }

        // 기존 시그니처 아이템 제거
        signatureItems.innerHTML = '';

        // 이미지 데이터가 있으면 이미지를 사용, 없으면 experiences 사용
        if (signatureData.images && signatureData.images.length > 0) {
            // isSelected가 true인 이미지만 필터링하고 sortOrder로 정렬
            const selectedImages = signatureData.images
                .filter(img => img.isSelected)
                .sort((a, b) => a.sortOrder - b.sortOrder);

            // 선택된 이미지가 없으면 2x2 그리드로 4개의 빈 placeholder 생성
            if (selectedImages.length === 0) {
                this._createPlaceholderGrid(signatureItems, 4, () => this.createSignatureItem({
                    title: '이미지 설명을 입력해주세요.',
                    image: { url: '', description: '이미지 설명을 입력해주세요.' }
                }));
                return;
            }

            // 이미지 기반 시그니처 아이템들 생성
            selectedImages.forEach((image, index) => {
                const experience = {
                    title: image.description,
                    description: image.description,
                    image: {
                        url: image.url,
                        description: image.description
                    }
                };
                const signatureItem = this.createSignatureItem(experience);
                this._addAnimatedItem(signatureItems, signatureItem, index);
            });
        } else if (signatureData.experiences) {
            // experience 기반 시그니처 아이템들 생성
            signatureData.experiences.forEach((experience, index) => {
                const signatureItem = this.createSignatureItem(experience);
                this._addAnimatedItem(signatureItems, signatureItem, index);
            });
        } else {
            // 이미지도 없고 experiences도 없으면 2x2 그리드로 4개의 빈 placeholder 생성
            this._createPlaceholderGrid(signatureItems, 4, () => this.createSignatureItem({
                title: '이미지 설명을 입력해주세요.',
                image: { url: '', description: '이미지 설명을 입력해주세요.' }
            }));
        }
    }


    /**
     * Signature 아이템 생성 헬퍼 (기존 CSS 구조와 호환)
     */
    createSignatureItem(experience) {
        const div = document.createElement('div');
        div.className = 'signature-item';
        const sanitizedTitle = this.sanitizeText(experience.title);
        div.innerHTML = `
            <img data-image-fallback
                 src="${experience.image.url}"
                 alt="${experience.image.description}"
                 loading="lazy">
            <div class="signature-item-overlay"></div>
            <div class="signature-item-text">
                <h5 class="signature-item-title${sanitizedTitle ? ' has-text' : ''}">${sanitizedTitle}</h5>
            </div>
        `;
        return div;
    }

    /**
     * Closing 섹션 매핑 (index.html 전용)
     */
    mapClosingSection() {
        if (!this.isDataLoaded) return;

        // 새로운 구조: homepage.customFields.pages.index.sections[0].closing
        const closingData = this.safeGet(this.data, 'homepage.customFields.pages.index.sections.0.closing');

        if (!closingData) return;

        // 섹션 제목 매핑 (data 속성 사용)
        const closingTitle = this.safeSelect('[data-index-closing-title]');
        if (closingTitle) {
            closingTitle.textContent = this.sanitizeText(closingData.title, '마무리 섹션 타이틀');
        }

        // 섹션 설명 매핑 (closingData.description 우선, 없으면 첫 번째 이미지의 description 사용)
        const closingDescription = this.safeSelect('[data-index-closing-description]');
        if (closingDescription) {
            const description = closingData.description ||
                             (closingData.images && closingData.images[0]?.description) ||
                             '마무리 섹션 설명';
            closingDescription.innerHTML = this._formatTextWithLineBreaks(description);
        }

        // 배경 이미지 매핑 (오버레이는 텍스트 포함하므로 숨기지 않음)
        const closingImage = this.safeSelect('[data-index-closing-image]');
        ImageHelpers.applyImageOrPlaceholder(closingImage, closingData?.images);
    }


    // ============================================================================
    // 🔄 TEMPLATE METHODS IMPLEMENTATION
    // ============================================================================

    /**
     * Index 페이지 전체 매핑 실행
     */
    async mapPage() {
        if (!this.isDataLoaded) {
            console.error('Cannot map index page: data not loaded');
            return;
        }

        // Index 페이지 섹션들 순차 매핑
        this.mapHeroSection();
        this.mapEssenceSection();
        this.mapGallerySection();
        this.mapSignatureSection();
        this.mapClosingSection();

        // 메타 태그 업데이트
        this.updateMetaTags();

        // 애니메이션 재초기화
        this.reinitializeScrollAnimations();

        // E-commerce registration 매핑
        this.mapEcommerceRegistration();
    }
}

// ES6 모듈 및 글로벌 노출
if (typeof module !== 'undefined' && module.exports) {
    module.exports = IndexMapper;
} else {
    window.IndexMapper = IndexMapper;
}
