/**
 * Facility Page Data Mapper
 * facility.html 전용 매핑 함수들을 포함한 클래스
 * BaseDataMapper를 상속받아 시설 페이지 전용 기능 제공
 * URL 파라미터로 ?index=0,1,2...를 받아서 동적으로 시설 정보 표시
 */
class FacilityMapper extends BaseDataMapper {
    constructor() {
        super();
        this.currentFacility = null;
        this.currentFacilityIndex = null;
        this.currentFacilityPageData = null;
    }

    // ============================================================================
    // 🏢 FACILITY PAGE SPECIFIC MAPPINGS
    // ============================================================================

    /**
     * 현재 시설 정보 가져오기 (URL 파라미터 기반)
     */
    getCurrentFacility() {
        if (!this.isDataLoaded || !this.data.property?.facilities) {
            console.error('Data not loaded or no facilities data available');
            return null;
        }

        // URL에서 facility id 추출
        const urlParams = new URLSearchParams(window.location.search);
        const facilityId = urlParams.get('id');

        if (!facilityId) {
            console.error('Facility id not specified in URL');
            return null;
        }

        // facilities 배열에서 해당 id의 시설 찾기
        const facilityIndex = this.data.property.facilities.findIndex(facility => facility.id === facilityId);

        if (facilityIndex === -1) {
            console.error(`Facility with id ${facilityId} not found`);
            return null;
        }

        const facility = this.data.property.facilities[facilityIndex];
        this.currentFacility = facility;
        this.currentFacilityIndex = facilityIndex; // 인덱스도 저장 (페이지 데이터 접근용)
        return facility;
    }

    /**
     * 현재 시설 인덱스 가져오기
     */
    getCurrentFacilityIndex() {
        if (this.currentFacilityIndex !== null) {
            return this.currentFacilityIndex;
        }

        // getCurrentFacility()가 호출되지 않았을 경우를 위한 fallback
        const urlParams = new URLSearchParams(window.location.search);
        const facilityId = urlParams.get('id');

        if (facilityId && this.data.property?.facilities) {
            const index = this.data.property.facilities.findIndex(facility => facility.id === facilityId);
            if (index !== -1) {
                this.currentFacilityIndex = index;
                return index;
            }
        }

        return null;
    }

    /**
     * Hero 섹션 매핑
     */
    mapHeroSection() {
        const facility = this.getCurrentFacility();
        if (!facility) return;

        // Hero 이미지 매핑
        const heroImage = this.safeSelect('[data-facility-hero-image]');
        if (heroImage) {
            // facility.images 배열에서 이미지 가져오기 (isSelected: true만 필터링 후 sortOrder로 정렬)
            const mainImages = facility.images || [];
            const selectedImages = mainImages
                .filter(img => img.isSelected)
                .sort((a, b) => a.sortOrder - b.sortOrder);

            if (selectedImages.length > 0 && selectedImages[0]?.url) {
                heroImage.src = selectedImages[0].url;
                heroImage.alt = selectedImages[0].description || facility.name;
                heroImage.classList.remove('empty-image-placeholder');
            } else {
                ImageHelpers.applyPlaceholder(heroImage);
            }
        }

        // Hero 제목/설명 매핑
        const heroSubtitle = this.safeSelect('[data-facility-hero-subtitle]');
        if (heroSubtitle) {
            heroSubtitle.textContent = '특별한 부가서비스';
        }

        const heroTitle = this.safeSelect('[data-facility-hero-title]');
        if (heroTitle) {
            heroTitle.textContent = facility.name;
        }

        const heroDescription = this.safeSelect('[data-facility-hero-description]');
        if (heroDescription) {
            // hero.title 사용 - id로 매칭
            const facilityPages = this.safeGet(this.data, 'homepage.customFields.pages.facility');
            const facilityPageData = facilityPages?.find(page => page.id === facility.id);
            const description = facilityPageData?.sections?.[0]?.hero?.title || facility.description || `${facility.name}을 이용해보세요.`;
            heroDescription.innerHTML = this._formatTextWithLineBreaks(description);
        }
    }

    /**
     * 메인 콘텐츠 섹션 매핑
     */
    mapMainContentSection() {
        const facility = this.getCurrentFacility();
        if (!facility) return;

        // 로딩/에러 상태 숨기기
        const loadingMessage = this.safeSelect('[data-facility-loading-message]');
        const errorMessage = this.safeSelect('[data-facility-error-message]');
        const mainContent = this.safeSelect('[data-facility-main-content]');

        if (loadingMessage) loadingMessage.style.display = 'none';
        if (errorMessage) errorMessage.style.display = 'none';
        if (mainContent) mainContent.style.display = 'block';

        // 콘텐츠 제목/부제목 매핑
        const contentSubtitle = this.safeSelect('[data-facility-content-subtitle]');
        if (contentSubtitle) {
            contentSubtitle.textContent = '특별한 부가서비스';
        }

        const contentTitle = this.safeSelect('[data-facility-content-title]');
        if (contentTitle) {
            contentTitle.textContent = facility.name;
        }

        // 이미지 매핑
        this.mapFacilityImages(facility);

        // 시설 설명 매핑
        const facilityContent = this.safeSelect('[data-facility-content]');
        if (facilityContent) {
            // facility.about.title 사용 - id로 매칭
            const facilityPages = this.safeGet(this.data, 'homepage.customFields.pages.facility');
            const facilityPageData = facilityPages?.find(page => page.id === facility.id);
            const description = facilityPageData?.sections?.[0]?.about?.title || facility.description || `${facility.name}에 대한 설명입니다.`;
            facilityContent.innerHTML = this._formatTextWithLineBreaks(description);
        }

        // 이용안내 매핑
        const usageGuideContent = this.safeSelect('[data-facility-usage-guide]');
        if (usageGuideContent && facility.usageGuide) {
            usageGuideContent.innerHTML = this._formatTextWithLineBreaks(facility.usageGuide);
        }
    }

    /**
     * 시설 이미지 매핑
     */
    mapFacilityImages(facility) {
        // facility.images 배열에서 이미지 가져오기 (isSelected: true만 필터링 후 sortOrder로 정렬)
        const mainImages = facility.images || [];
        const selectedImages = mainImages
            .filter(img => img.isSelected)
            .sort((a, b) => a.sortOrder - b.sortOrder);

        // 이미지 적용 헬퍼 함수
        const applyImage = (element, image) => {
            if (element) {
                if (image?.url) {
                    element.src = image.url;
                    element.alt = image.description || facility.name;
                    element.classList.remove('empty-image-placeholder');
                } else {
                    ImageHelpers.applyPlaceholder(element);
                }
            }
        };

        // Small image (두 번째 이미지 또는 첫 번째)
        const smallImage = this.safeSelect('[data-facility-small-image]');
        applyImage(smallImage, selectedImages.length > 1 ? selectedImages[1] : selectedImages[0]);

        // Large image (세 번째 이미지 또는 첫 번째)
        const largeImage = this.safeSelect('[data-facility-large-image]');
        applyImage(largeImage, selectedImages.length > 2 ? selectedImages[2] : selectedImages[0]);
    }

    /**
     * Experience 섹션 매핑 - 조건부 표시
     */
    mapExperienceSection() {
        const facility = this.getCurrentFacility();
        if (!facility) return;

        const experienceSection = this.safeSelect('[data-facility-experience-section]');
        if (!experienceSection) return;

        // id로 매칭
        const facilityPages = this.safeGet(this.data, 'homepage.customFields.pages.facility');
        const facilityPageData = facilityPages?.find(page => page.id === facility.id);
        const experienceData = facilityPageData?.sections?.[0]?.experience;

        // 각 섹션별 유효 데이터 체크 및 매핑
        const hasFeatures = this.mapFacilityFeatures(experienceData?.features);
        const hasSidebarInfo = this.mapFacilitySidebarInfo(experienceData?.additionalInfos);
        const hasBenefits = this.mapFacilityBenefits(experienceData?.benefits);

        // 조건부 제목 표시 로직
        const additionalInfoTitle = this.safeSelect('[data-additional-info-title]');
        const benefitsTitle = this.safeSelect('[data-benefits-title]');
        const sidebarCard = this.safeSelect('.sidebar-card');

        if (additionalInfoTitle) {
            additionalInfoTitle.style.display = hasSidebarInfo ? 'block' : 'none';
        }
        if (benefitsTitle) {
            benefitsTitle.style.display = hasBenefits ? 'block' : 'none';
        }
        if (sidebarCard) {
            sidebarCard.style.display = (hasSidebarInfo || hasBenefits) ? 'block' : 'none';
        }

        // sidebar-info의 margin-bottom 조정
        const sidebarInfo = this.safeSelect('[data-facility-sidebar-info]');
        if (sidebarInfo) {
            // additionalInfos만 있고 benefits가 없을 때만 margin-bottom 제거
            sidebarInfo.style.marginBottom = (hasSidebarInfo && !hasBenefits) ? '0' : '';
        }

        // Experience Grid 레이아웃 조정
        const experienceGrid = this.safeSelect('.experience-grid');

        if (experienceGrid && !hasFeatures && (hasSidebarInfo || hasBenefits)) {
            // features가 없고 sidebar 데이터가 있을 때: single column 레이아웃
            experienceGrid.style.gridTemplateColumns = '1fr';
            experienceGrid.style.gap = '2rem';
            experienceGrid.style.maxWidth = '600px'; // 박스 크기 제한
        } else if (experienceGrid) {
            // 기본: two column 레이아웃
            experienceGrid.style.gridTemplateColumns = '';
            experienceGrid.style.gap = '';
            experienceGrid.style.maxWidth = '';
        }

        // features만 있는 경우에도 섹션은 표시 (주요특징만 보임)
        // additionalInfos나 benefits가 있으면 추가정보 제목도 표시
        if (hasFeatures || hasSidebarInfo || hasBenefits) {
            experienceSection.style.display = 'block';
        } else {
            experienceSection.style.display = 'none';
        }
    }

    /**
     * 유효한 데이터 필터링 헬퍼
     */
    _filterValidItems(items) {
        if (!items || !Array.isArray(items)) {
            return [];
        }
        return items.filter(item =>
            (item.title && item.title.trim()) ||
            (item.description && item.description.trim())
        );
    }

    /**
     * Placeholder 아이템 생성 헬퍼
     */
    _createPlaceholderItem(container, className, innerHTML, tagName = 'div') {
        if (!container) return;
        container.innerHTML = '';
        const item = document.createElement(tagName);
        item.className = className;
        item.innerHTML = innerHTML;
        container.appendChild(item);
    }

    /**
     * 동적 아이템 생성 헬퍼
     */
    _createDynamicItems(container, items, className, htmlGenerator, tagName = 'div') {
        if (!container) return;
        container.innerHTML = '';
        items.forEach(item => {
            const element = document.createElement(tagName);
            element.className = className;
            element.innerHTML = htmlGenerator(item);
            container.appendChild(element);
        });
    }

    /**
     * 시설 특징 매핑 - 유효한 데이터가 있을 때만 표시
     */
    mapFacilityFeatures(features) {
        const featuresGrid = this.safeSelect('[data-facility-features-grid]');
        if (!featuresGrid) return false;

        // 의미있는 데이터 필터링
        const validFeatures = this._filterValidItems(features);

        if (validFeatures.length === 0) {
            // features main content div 숨김
            const mainContent = this.safeSelect('[data-features-main-content]');
            if (mainContent) {
                mainContent.style.display = 'none';
            }
            return false;
        }

        // 유효한 데이터가 있으면 렌더링
        this._createDynamicItems(
            featuresGrid,
            validFeatures,
            'feature-item',
            feature => `
                <h4>${feature.title || ''}</h4>
                <p>${this._formatTextWithLineBreaks(feature.description || '')}</p>
            `
        );

        // features main content div 표시
        const mainContent = this.safeSelect('[data-features-main-content]');
        if (mainContent) {
            mainContent.style.display = 'block';
        }

        return true;
    }

    /**
     * 추가 정보 매핑 - 유효한 데이터가 있을 때만 표시
     */
    mapFacilitySidebarInfo(additionalInfos) {
        const sidebarInfo = this.safeSelect('[data-facility-sidebar-info]');
        if (!sidebarInfo) return false;

        // 의미있는 데이터 필터링
        const validInfos = this._filterValidItems(additionalInfos);

        if (validInfos.length === 0) {
            // 유효한 데이터가 없으면 추가 정보 섹션만 숨김 (title은 유지)
            sidebarInfo.innerHTML = '';
            sidebarInfo.style.display = 'none';
            return false;
        }

        // 유효한 데이터가 있으면 렌더링
        this._createDynamicItems(
            sidebarInfo,
            validInfos,
            'sidebar-item',
            info => `
                <div>
                    <strong>${info.title || ''}:</strong> ${this._formatTextWithLineBreaks(info.description || '')}
                </div>
            `
        );

        // sidebar-info 섹션 표시
        sidebarInfo.style.display = 'block';

        return true;
    }

    /**
     * 특별 혜택 매핑 - 유효한 데이터가 있을 때만 표시
     */
    mapFacilityBenefits(benefits) {
        const benefitsList = this.safeSelect('[data-facility-benefits-list]');
        if (!benefitsList) return false;

        // 의미있는 데이터 필터링
        const validBenefits = this._filterValidItems(benefits);

        if (validBenefits.length === 0) {
            // 유효한 데이터가 없으면 컨테이너 숨김
            benefitsList.innerHTML = '';
            const benefitsContainer = benefitsList.parentElement; // <div> 컨테이너
            if (benefitsContainer) {
                benefitsContainer.style.display = 'none';
            }
            return false;
        }

        // 유효한 데이터가 있으면 렌더링
        this._createDynamicItems(
            benefitsList,
            validBenefits,
            '',
            benefit => `<strong>${benefit.title || ''}:</strong> ${this._formatTextWithLineBreaks(benefit.description || '')}`,
            'li'
        );

        // 컨테이너 표시
        const benefitsContainer = benefitsList.parentElement; // <div> 컨테이너
        if (benefitsContainer) {
            benefitsContainer.style.display = 'block';
        }

        return true;
    }

    /**
     * 갤러리 섹션 매핑 (현재는 숨김 처리)
     */
    mapGallerySection() {
        const gallerySection = this.safeSelect('[data-facility-gallery-section]');
        if (gallerySection) {
            gallerySection.style.display = 'none';
        }
    }

    /**
     * 슬라이더 섹션 매핑 (데이터만 매핑)
     */
    mapSliderSection() {
        const facility = this.getCurrentFacility();
        const sliderSection = this.safeSelect('[data-facility-slider-section]');

        if (!facility || !sliderSection) {
            return;
        }

        // facility.images 배열에서 이미지 가져오기 (isSelected: true만 필터링 후 sortOrder로 역순 정렬)
        const mainImages = facility.images || [];
        const selectedImages = mainImages
            .filter(img => img.isSelected)
            .sort((a, b) => b.sortOrder - a.sortOrder);

        if (selectedImages.length === 0) {
            // 선택된 이미지가 없으면 빈 슬라이드 1개 표시
            sliderSection.style.display = 'block';
            this.createEmptySlide();
            return;
        }

        sliderSection.style.display = 'block';

        this.createSlides(selectedImages, facility.name);
        this.createIndicators(selectedImages);

        window.facilityTotalSlides = selectedImages.length;
    }

    /**
     * 빈 슬라이드 생성
     */
    createEmptySlide() {
        const slidesContainer = this.safeSelect('[data-facility-slides-container]');
        if (!slidesContainer) return;

        slidesContainer.innerHTML = '';
        const slide = document.createElement('div');
        slide.className = 'facility-slide active';

        const img = document.createElement('img');
        img.src = ImageHelpers.EMPTY_IMAGE_SVG;
        img.alt = '이미지 없음';
        img.className = 'empty-image-placeholder';
        img.loading = 'eager';

        slide.appendChild(img);
        slidesContainer.appendChild(slide);

        // 인디케이터 숨기기
        const indicatorsContainer = this.safeSelect('[data-facility-slide-indicators]');
        if (indicatorsContainer) {
            indicatorsContainer.innerHTML = '';
        }

        window.facilityTotalSlides = 1;
    }

    /**
     * 슬라이드 생성
     */
    createSlides(sortedImages, facilityName) {
        const slidesContainer = this.safeSelect('[data-facility-slides-container]');
        if (!slidesContainer) return;

        slidesContainer.innerHTML = '';
        sortedImages.forEach((image, index) => {
            const slide = document.createElement('div');
            slide.className = `facility-slide ${index === 0 ? 'active' : ''}`;

            const img = document.createElement('img');
            img.src = image.url;
            img.alt = image.description || facilityName;
            img.loading = 'lazy';

            slide.appendChild(img);
            slidesContainer.appendChild(slide);
        });
    }

    /**
     * 인디케이터 생성
     */
    createIndicators(sortedImages) {
        const indicatorsContainer = this.safeSelect('[data-facility-slide-indicators]');
        if (!indicatorsContainer || sortedImages.length <= 1) return;

        indicatorsContainer.innerHTML = '';
        sortedImages.forEach((_, index) => {
            const indicator = document.createElement('div');
            indicator.className = `facility-indicator ${index === 0 ? 'active' : ''}`;
            indicator.onclick = () => window.goToFacilitySlide(index);
            indicatorsContainer.appendChild(indicator);
        });
    }

    // ============================================================================
    // 🔄 TEMPLATE METHODS IMPLEMENTATION
    // ============================================================================

    /**
     * Facility 페이지 전체 매핑 실행
     */
    async mapPage() {
        if (!this.isDataLoaded) {
            console.error('Cannot map facility page: data not loaded');
            return;
        }

        const facility = this.getCurrentFacility();
        if (!facility) {
            console.error('Cannot map facility page: facility not found');
            // 에러 메시지 표시
            const errorMessage = this.safeSelect('[data-facility-error-message]');
            const loadingMessage = this.safeSelect('[data-facility-loading-message]');
            if (errorMessage) errorMessage.style.display = 'block';
            if (loadingMessage) loadingMessage.style.display = 'none';
            return;
        }

        // 순차적으로 각 섹션 매핑
        this.mapHeroSection();
        this.mapMainContentSection();
        this.mapExperienceSection();
        this.mapGallerySection();
        this.mapSliderSection();

        // 메타 태그 업데이트 (페이지별 SEO 적용)
        const property = this.data.property;
        const pageSEO = (facility?.name && property?.name) ? { title: `${facility.name} - ${property.name}` } : null;
        this.updateMetaTags(pageSEO);

        // Open Graph 메타 태그 매핑
        const ogTitle = pageSEO?.title || this.data?.seo?.title || '';
        const ogDescription = facility?.description || this.data?.seo?.description || '';
        // Hero 이미지 선택 로직과 동일: isSelected 및 sortOrder 고려
        const selectedImages = facility?.images?.filter(img => img.isSelected).sort((a, b) => a.sortOrder - b.sortOrder) ?? [];
        const ogImage = selectedImages[0]?.url || '';
        this.mapOpenGraphTags(ogTitle, ogDescription, ogImage);

        // E-commerce registration 매핑
        this.mapEcommerceRegistration();
    }

    /**
     * Facility 페이지 텍스트만 업데이트
     */
    mapFacilityText() {
        if (!this.isDataLoaded) return;

        const facility = this.getCurrentFacility();
        if (!facility) return;

        // 텍스트 관련 섹션들만 업데이트
        this.mapHeroSection();
        this.mapMainContentSection();
        this.mapExperienceSection();
    }

    /**
     * 네비게이션 함수 설정
     */
    setupNavigation() {
        // 홈으로 이동 함수 설정
        window.navigateToHome = () => {
            window.location.href = './index.html';
        };
    }
}

// ES6 모듈 및 글로벌 노출
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FacilityMapper;
} else {
    window.FacilityMapper = FacilityMapper;
}
