/**
 * Header & Footer Data Mapper
 * header.html, footer.html 전용 매핑 함수들을 포함한 클래스
 * BaseDataMapper를 상속받아 header/footer 공통 기능 제공
 */
class HeaderFooterMapper extends BaseDataMapper {
    constructor() {
        super();
    }

    // ============================================================================
    // 🏠 HEADER MAPPINGS
    // ============================================================================

    /**
     * 로고 URL 추출 헬퍼 메서드
     * homepage.images[0].logo 또는 property.images[0].logo에서 isSelected인 이미지 URL 반환
     */
    _getLogoUrl() {
        let logoUrl = null;

        // 우선순위 1: homepage.images[0].logo 배열
        const homepageLogo = this.data?.homepage?.images?.[0]?.logo;
        if (homepageLogo && Array.isArray(homepageLogo) && homepageLogo.length > 0) {
            const selectedLogo = homepageLogo.find(img => img.isSelected) || homepageLogo[0];
            logoUrl = selectedLogo?.url;
        }

        // 우선순위 2: property.images[0].logo 배열 (fallback)
        if (!logoUrl) {
            const propertyLogo = this.data?.property?.images?.[0]?.logo;
            if (propertyLogo && Array.isArray(propertyLogo) && propertyLogo.length > 0) {
                const selectedLogo = propertyLogo.find(img => img.isSelected) || propertyLogo[0];
                logoUrl = selectedLogo?.url;
            }
        }

        return logoUrl;
    }

    /**
     * Favicon 매핑 (homepage.images[0].logo 데이터 사용)
     */
    mapFavicon() {
        if (!this.isDataLoaded) return;

        const logoUrl = this._getLogoUrl();

        if (logoUrl) {
            // 기존 favicon 링크 찾기
            let faviconLink = document.querySelector('link[rel="icon"]');

            // 없으면 새로 생성
            if (!faviconLink) {
                faviconLink = document.createElement('link');
                faviconLink.rel = 'icon';
                document.head.appendChild(faviconLink);
            }

            // favicon URL 설정
            faviconLink.href = logoUrl;
        }
    }

    /**
     * Header 로고 매핑 (텍스트 및 이미지)
     */
    mapHeaderLogo() {
        if (!this.isDataLoaded || !this.data.property) return;

        const property = this.data.property;

        // Header 로고 텍스트 매핑 (customFields 우선)
        const propertyNameEn = this.getPropertyNameEn();
        const logoTextElements = this.safeSelectAll('[data-logo-text]');
        logoTextElements.forEach(logoText => {
            if (logoText) {
                logoText.textContent = propertyNameEn;
            }
        });

        // Header 로고 이미지 매핑 (data-logo 속성 사용)
        const logoImage = this.safeSelect('[data-logo]');
        if (logoImage) {
            const logoUrl = this._getLogoUrl();

            if (logoUrl) {
                logoImage.onerror = () => {};
                logoImage.src = logoUrl;
                logoImage.alt = this.getPropertyName();
            }
        }
    }

    /**
     * Header 네비게이션 메뉴 동적 생성 (객실, 시설 메뉴 등)
     */
    mapHeaderNavigation() {
        if (!this.isDataLoaded) return;

        // 객실 메뉴 동적 생성
        this.mapRoomMenuItems();

        // 시설 메뉴 동적 생성
        this.mapFacilityMenuItems();

        // 예약 버튼에 realtimeBookingId 매핑
        this.mapReservationButtons();
    }

    /**
     * 예약 버튼에 realtimeBookingId 매핑 및 클릭 이벤트 설정
     */
    mapReservationButtons() {
        if (!this.isDataLoaded || !this.data.property) {
            return;
        }

        // realtimeBookingId 찾기 (전체 URL 형태로 저장됨)
        const realtimeBookingId = this.data.property.realtimeBookingId;

        if (realtimeBookingId) {
            // 모든 BOOK NOW 버튼에 클릭 이벤트 설정
            const reservationButtons = document.querySelectorAll('[data-booking-engine]');
            reservationButtons.forEach(button => {
                button.setAttribute('data-realtime-booking-id', realtimeBookingId);
                button.onclick = () => {
                    window.open(realtimeBookingId, '_blank');
                };
            });
        }

        // ybsId 찾기
        const ybsId = this.data.property.ybsId;
        const ybsButtons = document.querySelectorAll('[data-ybs-booking]');

        if (ybsId && ybsId.trim() !== '') {
            // YBS 예약 URL 생성
            const ybsUrl = `https://rev.yapen.co.kr/external?ypIdx=${ybsId}`;

            // 모든 YBS 버튼에 클릭 이벤트 설정 및 표시
            ybsButtons.forEach(button => {
                button.setAttribute('data-ybs-id', ybsId);
                // 데스크톱/모바일 모두 flex로 표시
                button.style.display = 'flex';
                button.onclick = () => {
                    window.open(ybsUrl, '_blank');
                };
            });
        } else {
            // ybsId가 없거나 빈 문자열이면 YBS 버튼 숨김 (CSS 기본값 유지)
            ybsButtons.forEach(button => {
                button.style.display = 'none';
            });
        }
    }

    /**
     * 객실 메뉴 아이템 동적 생성
     */
    mapRoomMenuItems() {
        const roomData = this.safeGet(this.data, 'rooms');
        if (!roomData || !Array.isArray(roomData)) return;

        const sortedRooms = [...roomData].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

        // 메가 드롭다운 + nav 서브메뉴 모두 처리
        const containers = [
            document.querySelector('[data-rooms-list]'),
            document.querySelector('[data-rooms-sub]')
        ].filter(Boolean);

        containers.forEach(container => {
            container.innerHTML = '';
            sortedRooms.forEach(room => {
                const a = document.createElement('a');
                a.textContent = this.getRoomName(room);
                a.style.cursor = 'pointer';
                a.addEventListener('click', () => {
                    navigateTo('room', room.id);
                });
                container.appendChild(a);
            });
        });
    }

    /**
     * 시설 메뉴 아이템 동적 생성
     */
    mapFacilityMenuItems() {
        const facilityData = this.safeGet(this.data, 'property.facilities');
        if (!facilityData || !Array.isArray(facilityData)) return;

        const sortedFacilities = [...facilityData].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

        // 메가 드롭다운 + nav 서브메뉴 모두 처리
        const containers = [
            document.querySelector('[data-facilities-list]'),
            document.querySelector('[data-facilities-sub]')
        ].filter(Boolean);

        containers.forEach(container => {
            container.innerHTML = '';
            sortedFacilities.forEach(facility => {
                const a = document.createElement('a');
                a.textContent = this.sanitizeText(facility.name, '시설');
                a.href = `facility.html?id=${facility.id}`;
                container.appendChild(a);
            });
        });
    }

    // ============================================================================
    // 🦶 FOOTER MAPPINGS
    // ============================================================================

    /**
     * Footer 로고 매핑 (customFields 우선)
     */
    mapFooterLogo() {
        if (!this.isDataLoaded || !this.data.property) return;

        // Footer 로고 이미지 매핑 (data-footer-logo 속성 사용)
        const footerLogoImage = this.safeSelect('[data-footer-logo]');
        if (footerLogoImage) {
            const logoUrl = this._getLogoUrl();

            if (logoUrl) {
                footerLogoImage.onerror = () => {};
                footerLogoImage.src = logoUrl;
                footerLogoImage.alt = this.getPropertyName();
            }
        }

        // Footer 로고 텍스트 매핑 (customFields 우선)
        const footerLogoText = this.safeSelect('[data-footer-logo-text]');
        if (footerLogoText) {
            footerLogoText.textContent = this.getPropertyNameEn();
        }
    }

    /**
     * Footer 사업자 정보 매핑
     */
    mapFooterInfo() {
        if (!this.isDataLoaded || !this.data.property) return;

        const property = this.data.property;
        const businessInfo = property.businessInfo;
        // 전화번호 매핑 - property.contactPhone 사용
        const footerPhone = this.safeSelect('[data-footer-phone]');
        if (footerPhone) {
            const phoneNumber = this.safeGet(this.data, 'property.contactPhone');
            if (phoneNumber) {
                footerPhone.textContent = phoneNumber;
            }
        }

        // 대표자명 매핑 - property.businessInfo.representativeName 사용
        const representativeNameElement = this.safeSelect('[data-footer-representative-name]');
        if (representativeNameElement) {
            const representative = businessInfo && businessInfo.representativeName;
            if (representative) {
                representativeNameElement.textContent = `대표자명 : ${representative}`;
            }
        }

        // 주소 매핑 - property.address 사용
        const addressElement = this.safeSelect('[data-footer-address]');
        if (addressElement) {
            const address = this.safeGet(this.data, 'property.address');
            if (address) {
                addressElement.textContent = `주소 : ${address}`;
            }
        }

        // 사업자번호 매핑 - property.businessInfo.businessNumber 사용
        const businessNumberElement = this.safeSelect('[data-footer-business-number]');
        if (businessNumberElement) {
            const businessNumber = businessInfo && businessInfo.businessNumber;
            if (businessNumber) {
                businessNumberElement.textContent = `사업자번호 : ${businessNumber}`;
            }
        }

        // 통신판매업신고번호 - property.businessInfo.eCommerceRegistrationNumber 사용
        const ecommerceElement = this.safeSelect('[data-footer-ecommerce]');
        if (ecommerceElement) {
            if (businessInfo && businessInfo.eCommerceRegistrationNumber) {
                ecommerceElement.textContent = `통신판매업신고번호 : ${businessInfo.eCommerceRegistrationNumber}`;
            } else {
                // 통신판매업신고번호가 없으면 부모 라인 전체 숨김
                const parentLine = ecommerceElement.closest('.footer-info-line');
                if (parentLine) {
                    parentLine.style.display = 'none';
                }
            }
        }

        // 저작권 정보 매핑 - 자동 생성 (현재년도 + 신비서 하드코딩)
        const copyrightElement = this.safeSelect('[data-footer-copyright]');
        if (copyrightElement) {
            const currentYear = new Date().getFullYear();

            // 링크 요소 생성
            const copyrightLink = document.createElement('a');
            copyrightLink.href = 'https://www.sinbibook.com/';
            copyrightLink.target = '_blank';
            copyrightLink.textContent = `© ${currentYear} 신비서. All rights reserved.`;
            copyrightLink.style.color = 'inherit';
            copyrightLink.style.textDecoration = 'none';

            // 기존 내용을 링크로 교체
            copyrightElement.innerHTML = '';
            copyrightElement.appendChild(copyrightLink);
        }
    }

    /**
     * Footer 소셜 링크 매핑
     * socialLinks가 빈 객체면 전체 섹션 숨김
     * 값이 있는 링크만 표시
     */
    mapSocialLinks() {
        if (!this.isDataLoaded) return;

        const socialLinks = this.safeGet(this.data, 'homepage.socialLinks') || {};
        const socialSection = this.safeSelect('[data-social-links-section]');

        // socialLinks가 빈 객체인지 체크
        const hasSocialLinks = Object.keys(socialLinks).length > 0;

        if (!hasSocialLinks) {
            // 빈 객체면 전체 섹션 숨김
            if (socialSection) {
                socialSection.style.display = 'none';
            }
            return;
        }

        // 소셜 링크가 있으면 섹션 표시
        if (socialSection) {
            socialSection.style.display = 'block';
        }

        // 소셜 링크 설정 객체와 루프를 사용한 매핑 (instagram, facebook, blog 지원)
        const socialLinkConfig = [
            { type: 'instagram', selector: '[data-social-instagram]' },
            { type: 'facebook', selector: '[data-social-facebook]' },
            { type: 'blog', selector: '[data-social-blog]' }
        ];

        socialLinkConfig.forEach(({ type, selector }) => {
            const linkElement = this.safeSelect(selector);
            if (linkElement) {
                if (socialLinks[type]) {
                    linkElement.href = socialLinks[type];
                    linkElement.style.display = 'flex';
                } else {
                    linkElement.style.display = 'none';
                }
            }
        });
    }

    // ============================================================================
    // 🔄 TEMPLATE METHODS IMPLEMENTATION
    // ============================================================================

    /**
     * Header 전체 매핑 실행
     */
    async mapHeader() {
        if (!this.isDataLoaded) {
            return;
        }

        // Favicon 매핑
        this.mapFavicon();

        // Header 매핑
        this.mapHeaderLogo();
        this.mapHeaderNavigation();

    }

    /**
     * Footer 전체 매핑 실행
     */
    async mapFooter() {
        if (!this.isDataLoaded) {
            return;
        }

        // Footer 매핑
        this.mapFooterLogo();
        this.mapFooterInfo();
        this.mapSocialLinks();

    }

    /**
     * Header & Footer 전체 매핑 실행
     */
    async mapHeaderFooter() {
        if (!this.isDataLoaded) {
            return;
        }

        // 동시에 실행
        await Promise.all([
            this.mapHeader(),
            this.mapFooter()
        ]);
    }

    /**
     * BaseMapper에서 요구하는 mapPage 메서드 구현
     */
    async mapPage() {
        return this.mapHeaderFooter();
    }
}

// ES6 모듈 및 글로벌 노출
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HeaderFooterMapper;
} else {
    window.HeaderFooterMapper = HeaderFooterMapper;
}