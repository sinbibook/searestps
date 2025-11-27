/**
 * Touch Swipe Handler Utility
 * 터치 스와이프 제스처를 감지하고 처리하는 유틸리티
 */

/**
 * 터치 스와이프 핸들러 초기화
 * @param {HTMLElement} element - 스와이프를 감지할 요소
 * @param {Function} onSwipeLeft - 왼쪽 스와이프 시 실행할 콜백
 * @param {Function} onSwipeRight - 오른쪽 스와이프 시 실행할 콜백
 * @param {number} threshold - 스와이프 감지 임계값 (기본: 50px)
 * @returns {Object} cleanup 함수를 포함한 객체
 */
export function initSwipeHandler(element, onSwipeLeft, onSwipeRight, threshold = 50) {
  if (!element) {
    console.warn('SwipeHandler: element is required');
    return { cleanup: () => {} };
  }

  // 클로저로 터치 좌표 캡슐화 (전역 스코프 오염 방지)
  let touchStartX = 0;
  let touchEndX = 0;
  let touchStartY = 0;
  let touchEndY = 0;

  function handleSwipe() {
    const horizontalDistance = touchEndX - touchStartX;
    const verticalDistance = Math.abs(touchEndY - touchStartY);

    // 수평 스와이프가 수직 스와이프보다 클 때만 처리
    if (Math.abs(horizontalDistance) > verticalDistance) {
      if (horizontalDistance > threshold) {
        // 오른쪽으로 스와이프
        onSwipeRight?.();
      } else if (horizontalDistance < -threshold) {
        // 왼쪽으로 스와이프
        onSwipeLeft?.();
      }
    }
  }

  // 이벤트 핸들러 정의
  const handleTouchStart = (e) => {
    if (!e.changedTouches.length) return;
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
  };

  const handleTouchEnd = (e) => {
    if (!e.changedTouches.length) return;
    touchEndX = e.changedTouches[0].screenX;
    touchEndY = e.changedTouches[0].screenY;
    handleSwipe();
  };

  // 이벤트 리스너 등록
  element.addEventListener('touchstart', handleTouchStart, { passive: true });
  element.addEventListener('touchend', handleTouchEnd, { passive: true });

  // cleanup 함수 반환 (필요 시 이벤트 리스너 제거)
  return {
    cleanup: () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);
    }
  };
}
