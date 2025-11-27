/**
 * Reservation Page Data Mapper
 * reservation.html 전용 매핑 함수들을 포함한 클래스
 * BaseDataMapper를 상속받아 예약 페이지 전용 기능 제공
 */
class ReservationMapper extends BaseDataMapper {
    constructor() {
        super();
    }

    // ============================================================================
    // 🔧 HELPER METHODS
    // ============================================================================


    /**
     * 규칙 텍스트를 파싱하여 DOM 요소로 변환하는 헬퍼 메서드
     * @param {string} containerSelector - 규칙을 추가할 컨테이너 선택자
     * @param {string} rulesText - 줄바꿈으로 구분된 규칙 텍스트
     */
    _populateRules(containerSelector, rulesText) {
        const container = this.safeSelect(containerSelector);
        if (!container || !rulesText) return;

        container.innerHTML = '';
        const rules = rulesText.split('\n').filter(rule => rule.trim());
        rules.forEach(rule => {
            const ruleElement = document.createElement('p');
            ruleElement.textContent = rule;
            container.appendChild(ruleElement);
        });
    }

    // ============================================================================
    // 📅 RESERVATION PAGE SPECIFIC MAPPINGS
    // ============================================================================

    /**
     * Hero 섹션 매핑
     */
    mapHeroSection() {
        if (!this.isDataLoaded || !this.data.property) return;

        const reservationData = this.safeGet(this.data, 'homepage.customFields.pages.reservation.sections.0');
        if (!reservationData) return;

        // Hero 이미지 매핑
        const heroImage = this.safeSelect('[data-reservation-hero-image]');
        if (heroImage) {
            const heroImages = reservationData.hero?.images;

            // isSelected가 true인 이미지만 필터링하고 sortOrder로 정렬
            const selectedImages = this._getSortedSelectedImages(heroImages);

            if (selectedImages.length === 0 || !selectedImages[0]?.url) {
                ImageHelpers.applyPlaceholder(heroImage);
            } else {
                heroImage.src = selectedImages[0].url;
                heroImage.alt = selectedImages[0].description || '예약안내';
                heroImage.classList.remove('empty-image-placeholder');
            }
        }

        // Hero 제목 매핑
        const heroTitle = this.safeSelect('[data-reservation-hero-title]');
        if (heroTitle) {
            heroTitle.textContent = this.sanitizeText(reservationData.hero?.title, '예약안내 히어로 타이틀');
        }
    }

    /**
     * 예약 정보 섹션 매핑
     */
    mapReservationInfoSection() {
        if (!this.isDataLoaded || !this.data.property) return;

        const property = this.data.property;
        const businessInfo = property.businessInfo;
        const reservationData = this.safeGet(this.data, 'homepage.customFields.pages.reservation.sections.0');

        // 예약 정보 이미지 매핑
        const infoImage = this.safeSelect('[data-reservation-info-image]');
        if (infoImage) {
            const infoImages = reservationData?.about?.images;

            // isSelected가 true인 이미지만 필터링하고 sortOrder로 정렬
            const selectedImages = this._getSortedSelectedImages(infoImages);

            if (selectedImages.length === 0 || !selectedImages[0]?.url) {
                ImageHelpers.applyPlaceholder(infoImage);
            } else {
                infoImage.src = selectedImages[0].url;
                infoImage.alt = selectedImages[0].description || '예약 안내 이미지';
                infoImage.classList.remove('empty-image-placeholder');
            }
        }

        // 예약 정보 제목 매핑
        const infoTitle = this.safeSelect('[data-reservation-info-title]');
        if (infoTitle) {
            infoTitle.textContent = this.sanitizeText(reservationData?.about?.title, '예약정보 타이틀');
        }

        // 예약 정보 설명 매핑
        const infoDescription = this.safeSelect('[data-reservation-info-description]');
        if (infoDescription) {
            infoDescription.innerHTML = this._formatTextWithLineBreaks(reservationData?.about?.description, '예약정보 설명');
        }

        // 연락처 정보 매핑
        this.mapContactInfo(businessInfo);
    }

    /**
     * 연락처 정보 매핑
     */
    mapContactInfo(businessInfo) {
        if (!businessInfo) return;

        // 전화번호 매핑
        const phoneValue = document.querySelector('.contact-item:nth-child(2) .contact-value');
        if (phoneValue && businessInfo.businessPhone) {
            phoneValue.textContent = businessInfo.businessPhone;
        }

        // 계좌 정보 매핑
        const accountValue = document.querySelector('.contact-item:nth-child(3) .contact-value');
        if (accountValue && businessInfo.bankAccount) {
            const { bankName, accountNumber, accountHolder } = businessInfo.bankAccount;
            accountValue.textContent = `${bankName} ${accountNumber} (예금주 ${accountHolder})`;
        }
    }

    /**
     * 예약안내 섹션 매핑 (새로 추가)
     */
    mapReservationGuideSection() {
        if (!this.isDataLoaded || !this.data.property) return;

        const property = this.data.property;

        // 예약안내 제목 매핑
        const guideTitle = this.safeSelect('[data-reservation-guide-title]');
        if (guideTitle) {
            guideTitle.textContent = '예약안내';
        }

        // property.reservationGuide를 예약안내 규칙으로 매핑
        if (property.reservationGuide) {
            this.mapReservationGuideRules(property.reservationGuide);
        }
    }

    /**
     * 예약안내 규칙 매핑
     */
    mapReservationGuideRules(reservationGuide) {
        this._populateRules('.reservation-guide-rules', reservationGuide);
    }

    /**
     * 이용안내 섹션 매핑
     */
    mapUsageSection() {
        if (!this.isDataLoaded || !this.data.property) return;

        const property = this.data.property;

        // 이용안내 제목 매핑
        const usageTitle = this.safeSelect('[data-reservation-usage-title]');
        if (usageTitle) {
            usageTitle.textContent = '이용안내';
        }

        // property.usageGuide를 이용안내 규칙으로 매핑
        if (property.usageGuide) {
            this.mapUsageRules(property.usageGuide);
        }
    }

    /**
     * 체크인/체크아웃 섹션 매핑
     */
    mapCheckinCheckoutSection() {
        if (!this.isDataLoaded || !this.data.property) return;

        const property = this.data.property;

        // 체크인/체크아웃 제목 매핑
        const checkinTitle = this.safeSelect('[data-reservation-checkin-title]');
        if (checkinTitle) {
            checkinTitle.textContent = '입/퇴실 안내';
        }

        // property.checkInOutInfo를 체크인/체크아웃 안내로 매핑
        if (property.checkInOutInfo) {
            this.mapCheckinCheckout(property.checkInOutInfo);
        }
    }

    /**
     * 이용안내 규칙 매핑
     */
    mapUsageRules(usageGuide) {
        this._populateRules('.usage-rules', usageGuide);
    }

    /**
     * 체크인/체크아웃 안내 매핑
     */
    mapCheckinCheckout(checkInOutInfo) {
        const checkinSection = this.safeSelect('.checkin-checkout-section');
        if (!checkinSection || !checkInOutInfo) return;

        checkinSection.style.display = 'block';
        this._populateRules('.checkin-checkout-rules', checkInOutInfo);
    }

    /**
     * 환불규정 섹션 매핑
     */
    mapRefundSection() {
        if (!this.isDataLoaded || !this.data.property) return;

        const property = this.data.property;

        // 환불규정 제목 매핑
        const refundTitle = this.safeSelect('[data-reservation-refund-title]');
        if (refundTitle) {
            refundTitle.textContent = '환불규정';
        }

        // property.refundSettings.customerRefundNotice를 환불 규칙으로 매핑
        if (property.refundSettings?.customerRefundNotice) {
            this.mapRefundRules(property.refundSettings.customerRefundNotice);
        }

        // 테이블 제목 매핑
        const tableTitle = this.safeSelect('[data-reservation-table-title]');
        if (tableTitle) {
            tableTitle.textContent = '취소 수수료 안내';
        }

        // property.refundPolicies를 취소 수수료 테이블로 매핑
        if (property.refundPolicies) {
            this.mapRefundPolicies(property.refundPolicies);
        }
    }

    /**
     * 환불 규칙 매핑 (customerRefundNotice)
     */
    mapRefundRules(customerRefundNotice) {
        this._populateRules('.refund-rules', customerRefundNotice);
    }

    /**
     * 환불 정책 테이블 매핑
     */
    mapRefundPolicies(refundPolicies) {
        const tableBody = this.safeSelect('.refund-table-body');
        if (!tableBody || !refundPolicies || !Array.isArray(refundPolicies)) return;

        tableBody.innerHTML = '';
        refundPolicies.forEach(policy => {
            const row = document.createElement('tr');

            // refundProcessingDays를 기반으로 취소 시점 텍스트 생성
            let period;
            if (policy.refundProcessingDays === 0) {
                period = '이용일 당일';
            } else if (policy.refundProcessingDays === 1) {
                period = '이용일 1일 전';
            } else {
                period = `이용일 ${policy.refundProcessingDays}일 전`;
            }

            // refundRate를 기반으로 환불율 텍스트 생성
            const refundRateText = policy.refundRate === 0 ? '환불 불가' : `${policy.refundRate}% 환불`;

            row.innerHTML = `
                <td>${period}</td>
                <td class="${policy.refundRate === 0 ? 'no-refund' : ''}">${refundRateText}</td>
            `;
            tableBody.appendChild(row);
        });
    }

    // ============================================================================
    // 🔄 TEMPLATE METHODS IMPLEMENTATION
    // ============================================================================

    /**
     * Reservation 페이지 전체 매핑 실행
     */
    async mapPage() {
        if (!this.isDataLoaded) {
            console.error('Cannot map reservation page: data not loaded');
            return;
        }

        // 순차적으로 각 섹션 매핑
        this.mapHeroSection();
        this.mapReservationInfoSection();
        this.mapReservationGuideSection();
        this.mapUsageSection();
        this.mapCheckinCheckoutSection();
        this.mapRefundSection();

        // 메타 태그 업데이트 (페이지별 SEO 적용)
        const property = this.data.property;
        const pageSEO = property?.name ? { title: `예약안내 - ${property.name}` } : null;
        this.updateMetaTags(pageSEO);

        // Open Graph 메타 태그 매핑
        const reservationData = this.safeGet(this.data, 'homepage.customFields.pages.reservation.sections.0');
        const ogTitle = pageSEO?.title || this.data?.seo?.title || '';
        const ogDescription = reservationData?.hero?.description || this.data?.seo?.description || '';
        // isSelected가 true인 이미지 중 첫 번째 이미지 사용
        const selectedImages = this._getSortedSelectedImages(reservationData?.hero?.images);
        const ogImage = selectedImages?.[0]?.url || '';
        this.mapOpenGraphTags(ogTitle, ogDescription, ogImage);

        // E-commerce registration 매핑
        this.mapEcommerceRegistration();
    }

    /**
     * Reservation 페이지 텍스트만 업데이트
     */
    mapReservationText() {
        if (!this.isDataLoaded) return;

        // 순차적으로 각 섹션 텍스트 매핑
        this.mapHeroSection();
        this.mapReservationInfoSection();
        this.mapReservationGuideSection();
        this.mapUsageSection();
        this.mapCheckinCheckoutSection();
        this.mapRefundSection();
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
    module.exports = ReservationMapper;
} else {
    window.ReservationMapper = ReservationMapper;
}
