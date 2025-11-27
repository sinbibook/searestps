/**
 * Image Helper Utilities
 * 모든 페이지 mapper에서 공통으로 사용하는 이미지 관련 헬퍼 함수
 */
const ImageHelpers = {
    EMPTY_IMAGE_SVG: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"%3E%3Crect fill="%23d1d5db" width="800" height="600"/%3E%3Cg transform="translate(400, 300)"%3E%3Crect x="-48" y="-48" width="96" height="96" rx="8" ry="8" fill="none" stroke="%23374151" stroke-width="3"/%3E%3Ccircle cx="-20" cy="-20" r="6" fill="%23374151"/%3E%3Cpolyline points="48,-12 20,-40 -48,28" fill="none" stroke="%23374151" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/%3E%3C/g%3E%3C/svg%3E',

    /**
     * 공통 이미지 처리 헬퍼 함수 (에러 처리 포함)
     */
    applyImageOrPlaceholder(imageElement, imagesData, overlayElement = null) {
        if (!imageElement) {
            console.warn('⚠️ ImageHelpers: imageElement is null or undefined');
            return;
        }

        if (!imagesData || imagesData.length === 0) {
            this.applyPlaceholder(imageElement, overlayElement);
            return;
        }

        try {
            const selectedImages = imagesData
                .filter(img => img.isSelected)
                .sort((a, b) => a.sortOrder - b.sortOrder);

            if (selectedImages.length > 0 && selectedImages[0].url) {
                const firstImage = selectedImages[0];

                // 이미지 로드 에러 처리
                imageElement.onerror = () => {
                    console.warn('⚠️ 이미지 로드 실패, placeholder 적용:', firstImage.url);
                    this.applyPlaceholder(imageElement, overlayElement);
                };

                imageElement.src = firstImage.url;
                imageElement.alt = firstImage.description || '';
                imageElement.classList.remove('empty-image-placeholder');
                imageElement.style.opacity = '1';
                if (overlayElement) overlayElement.style.display = '';
            } else {
                this.applyPlaceholder(imageElement, overlayElement);
            }
        } catch (error) {
            console.error('❌ ImageHelpers 에러:', error);
            this.applyPlaceholder(imageElement, overlayElement);
        }
    },

    /**
     * 플레이스홀더 적용
     */
    applyPlaceholder(imageElement, overlayElement = null) {
        if (!imageElement) return;
        imageElement.src = this.EMPTY_IMAGE_SVG;
        imageElement.alt = '이미지 없음';
        imageElement.classList.add('empty-image-placeholder');
        imageElement.style.opacity = '1';
        if (overlayElement) overlayElement.style.display = 'none';
    },

    /**
     * 로고 URL 추출 헬퍼 (header-footer-mapper에서 이동)
     * isSelected가 true인 로고를 우선 선택, 없으면 sortOrder 0번째 선택
     */
    extractLogoUrl(data) {
        if (!data) return null;

        const imagesArray = data.homepage?.images;
        if (!imagesArray || !Array.isArray(imagesArray)) return null;

        for (const imageItem of imagesArray) {
            if (imageItem.logo && Array.isArray(imageItem.logo) && imageItem.logo.length > 0) {
                // 1. isSelected가 true인 로고 찾기
                const selectedLogo = imageItem.logo.find(logo => logo.isSelected === true);
                if (selectedLogo && selectedLogo.url) {
                    return selectedLogo.url;
                }

                // 2. 없으면 sortOrder 기준으로 정렬해서 0번째 선택 (fallback)
                const sortedLogos = imageItem.logo.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
                return sortedLogos[0].url;
            }
        }
        return null;
    }
};

// ES6 모듈 및 글로벌 노출
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ImageHelpers;
} else {
    window.ImageHelpers = ImageHelpers;
}
