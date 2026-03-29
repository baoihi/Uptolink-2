// ==UserScript==
// @name         AUTO CLICK FULL - FIXED OPEN TAB
// @namespace    http://tampermonkey.net/
// @version      26.0
// @description  Auto click Thực Hiện + STEP + Xác nhận + Chuyển hướng tuần tự (lien-he → gioi-thieu)
// @author       You
// @match        *://*/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    // ==========================================
    // KIỂM TRA TAB ĐANG ACTIVE
    // ==========================================

    let isTabActive = true;

    // Lắng nghe sự kiện focus/blur của tab
    window.addEventListener('focus', function() {
        isTabActive = true;
        console.log('Tab đang active - Script sẽ chạy');
        setTimeout(mainProcess, 500);
    });

    window.addEventListener('blur', function() {
        isTabActive = false;
        console.log('Tab không active - Tạm dừng script');
    });

    // ==========================================
    // TẮT CONSOLE LOG (GIỮ LẠI ĐỂ DEBUG CÓ THỂ BẬT LẠI)
    // ==========================================

    // Để debug, comment dòng dưới và bỏ comment console.log
    // console.log = function() {};
    // console.info = function() {};
    // console.warn = function() {};
    // console.error = function() {};

    // Xóa dấu hiệu tự động hóa
    try {
        Object.defineProperty(navigator, 'webdriver', { get: () => false });
        delete window.__Tampermonkey;
        delete window.__tampermonkey;
    } catch(e) {}

    // ==========================================
    // CẤU HÌNH
    // ==========================================

    const stepButtonTexts = [
        'LẤY MÃ STEP 1',
        'LẤY MÃ STEP 2',
        'LẤY MÃ STEP 3',
        'NHẤN ĐỂ TIẾP TỤC',
        'NHẤN ĐẾ TIẾP TỤC'
    ];

    const notificationTexts = [
        'NHẤN LINK BẤT KỲ ĐẾ TIẾP TỤC',
        'NHẤN LINK BẤT KỲ ĐỂ TIẾP TỤC'
    ];

    let isProcessing = false;
    let lastThucHienClickTime = 0;
    let isThucHienClicking = false;
    const THUC_HIEN_COOLDOWN = 5000;

    // ==========================================
    // TÍNH NĂNG MỚI: CHUYỂN HƯỚNG TUẦN TỰ
    // ==========================================

    function handleSequentialRedirect() {
        const currentUrl = window.location.href;
        const domain = window.location.protocol + '//' + window.location.hostname;
        
        // Kiểm tra nếu đang ở trang chủ (chỉ domain, không có path hoặc chỉ có /)
        const isHomePage = currentUrl === domain || 
                          currentUrl === domain + '/' || 
                          currentUrl === domain + '/#' ||
                          currentUrl === domain + '/index.html' ||
                          /^https?:\/\/[^\/]+\/?$/.test(currentUrl);
        
        // Kiểm tra nếu đang ở trang lien-he (có chứa /lien-he)
        const isLienHePage = currentUrl.includes('/lien-he');
        
        if (isHomePage) {
            console.log('🏠 Phát hiện trang chủ, chuyển hướng đến:', domain + '/lien-he');
            setTimeout(() => {
                window.location.href = domain + '/lien-he';
            }, 1000);
            return true;
        }
        
        if (isLienHePage) {
            console.log('📞 Phát hiện trang lien-he, chuyển hướng đến:', domain + '/gioi-thieu');
            setTimeout(() => {
                window.location.href = domain + '/gioi-thieu';
            }, 1000);
            return true;
        }
        
        return false;
    }

    // ==========================================
    // HÀM TÌM NÚT THỰC HIỆN
    // ==========================================

    function findThucHienButton() {
        const cards = document.querySelectorAll('.group.relative.overflow-hidden.rounded-2xl');

        for (let card of cards) {
            const cardText = (card.textContent || '').toLowerCase();
            if (cardText.includes('uptolink')) {
                const button = card.querySelector('button.btn-thuchien-gradient, button');
                if (button) {
                    const buttonText = (button.textContent || '').trim();
                    if (buttonText.includes('Thực Hiện') || buttonText.includes('Thực hiện')) {
                        return button;
                    }
                }
            }
        }

        const buttons = document.querySelectorAll('button.btn-thuchien-gradient');
        for (let btn of buttons) {
            let parent = btn.parentElement;
            while (parent) {
                const parentText = (parent.textContent || '').toLowerCase();
                if (parentText.includes('uptolink')) {
                    return btn;
                }
                parent = parent.parentElement;
            }
        }

        return null;
    }

    // ==========================================
    // HÀM CLICK NÚT THỰC HIỆN (CÓ COOLDOWN VÀ DELAY)
    // ==========================================

    async function clickThucHienButton(button) {
        if (isThucHienClicking) {
            console.log('Đang trong quá trình click nút Thực Hiện, bỏ qua');
            return false;
        }

        const now = Date.now();

        if (now - lastThucHienClickTime < THUC_HIEN_COOLDOWN) {
            const remainingTime = Math.ceil((THUC_HIEN_COOLDOWN - (now - lastThucHienClickTime)) / 1000);
            console.log(`Nút Thực Hiện đang trong thời gian chờ (${remainingTime}s), bỏ qua click`);
            return false;
        }

        isThucHienClicking = true;

        return new Promise((resolve) => {
            button.scrollIntoView({ behavior: 'smooth', block: 'center' });

            setTimeout(() => {
                if (!button.isConnected) {
                    console.log('Nút Thực Hiện đã bị xóa khỏi DOM, bỏ qua click');
                    isThucHienClicking = false;
                    resolve(false);
                    return;
                }

                if (button.disabled || button.hasAttribute('disabled')) {
                    console.log('Nút Thực Hiện đang bị disabled, bỏ qua click');
                    isThucHienClicking = false;
                    resolve(false);
                    return;
                }

                const clickEvent = new MouseEvent('click', {
                    view: window,
                    bubbles: true,
                    cancelable: true
                });
                button.dispatchEvent(clickEvent);

                if (typeof button.click === 'function') {
                    button.click();
                }

                lastThucHienClickTime = Date.now();
                console.log('✅ Đã click nút Thực Hiện (sẽ chờ 5s mới được click lại)');

                setTimeout(() => {
                    isThucHienClicking = false;
                    resolve(true);
                }, 500);
            }, 1000);
        });
    }

    // ==========================================
    // XỬ LÝ THỰC HIỆN
    // ==========================================

    async function processThucHien() {
        const thucHienButton = findThucHienButton();
        if (!thucHienButton) return false;
        const clicked = await clickThucHienButton(thucHienButton);
        return clicked;
    }

    // ==========================================
    // HÀM TÌM VÀ CLICK STEP
    // ==========================================

    function findCountdownButton() {
        const spans = document.querySelectorAll('span.countdown');
        for (let span of spans) {
            const text = (span.textContent || '').trim().toUpperCase();
            for (let btnText of stepButtonTexts) {
                if (text.includes(btnText.toUpperCase())) {
                    return span;
                }
            }
        }
        return null;
    }

    async function clickStepButton(button) {
        return new Promise((resolve) => {
            button.scrollIntoView({ behavior: 'smooth', block: 'center' });

            setTimeout(() => {
                const clickEvent = new MouseEvent('click', {
                    view: window,
                    bubbles: true,
                    cancelable: true
                });
                button.dispatchEvent(clickEvent);

                if (typeof button.click === 'function') {
                    button.click();
                }

                console.log('Đã click nút:', button.textContent.trim());
                resolve(true);
            }, 500);
        });
    }

    // ==========================================
    // KIỂM TRA THÔNG BÁO
    // ==========================================

    function checkForNotification() {
        const spans = document.querySelectorAll('span.countdown');
        for (let span of spans) {
            const text = (span.textContent || '').trim().toUpperCase();
            for (let notiText of notificationTexts) {
                if (text.includes(notiText.toUpperCase())) {
                    return true;
                }
            }
        }
        return false;
    }

    function goToHomePage() {
        const currentDomain = window.location.protocol + '//' + window.location.hostname;
        console.log('Chuyển hướng về trang chủ:', currentDomain);
        setTimeout(() => {
            window.location.href = currentDomain;
        }, 1000);
        return true;
    }

    // ==========================================
    // AUTO CLICK NÚT XÁC NHẬN TRÊN MONEYTASK.TOP
    // ==========================================

    function isMoneytaskFinishPage() {
        const url = window.location.href;
        return url.includes('moneytask.top/finish') && url.includes('?code=') && url.includes('?qq=earn');
    }

    function findConfirmButton() {
        const buttons = document.querySelectorAll('button[type="submit"]');
        for (let button of buttons) {
            const buttonText = (button.textContent || '').trim();
            if (buttonText === 'Xác nhận') {
                return button;
            }
        }

        const allButtons = document.querySelectorAll('button');
        for (let button of allButtons) {
            const buttonText = (button.textContent || '').trim();
            if (buttonText === 'Xác nhận') {
                return button;
            }
        }

        return null;
    }

    async function clickConfirmButton(button) {
        return new Promise((resolve) => {
            button.scrollIntoView({ behavior: 'smooth', block: 'center' });

            setTimeout(() => {
                const clickEvent = new MouseEvent('click', {
                    view: window,
                    bubbles: true,
                    cancelable: true
                });
                button.dispatchEvent(clickEvent);

                if (typeof button.click === 'function') {
                    button.click();
                }

                console.log('Đã click nút Xác nhận trên moneytask.top');
                resolve(true);
            }, 500);
        });
    }

    async function processMoneytaskConfirm() {
        if (!isMoneytaskFinishPage()) {
            return false;
        }

        console.log('Phát hiện trang moneytask.top/finish, đang tìm nút Xác nhận...');

        const confirmButton = findConfirmButton();
        if (confirmButton) {
            const isDisabled = confirmButton.disabled || confirmButton.hasAttribute('disabled');

            if (!isDisabled) {
                console.log('Tìm thấy nút Xác nhận và đang hoạt động, tiến hành click');
                await clickConfirmButton(confirmButton);
                return true;
            } else {
                console.log('Nút Xác nhận đang bị disabled, chờ kích hoạt...');

                return new Promise((resolve) => {
                    let timeoutId = setTimeout(() => {
                        if (observer) observer.disconnect();
                        console.log('Hết thời gian chờ, nút Xác nhận vẫn bị disabled');
                        resolve(false);
                    }, 10000);

                    const observer = new MutationObserver(() => {
                        const button = findConfirmButton();
                        if (button && (!button.disabled && !button.hasAttribute('disabled'))) {
                            console.log('Nút Xác nhận đã được kích hoạt');
                            clearTimeout(timeoutId);
                            observer.disconnect();
                            clickConfirmButton(button).then(() => resolve(true));
                        }
                    });

                    observer.observe(document.body, {
                        childList: true,
                        subtree: true,
                        attributes: true,
                        attributeFilter: ['disabled', 'class']
                    });
                });
            }
        } else {
            console.log('Không tìm thấy nút Xác nhận trên trang này');
            return false;
        }
    }

    // ==========================================
    // XỬ LÝ CHÍNH
    // ==========================================

    async function mainProcess() {
        if (!isTabActive) {
            console.log('Tab không active, bỏ qua xử lý');
            return;
        }

        if (isProcessing) return;
        isProcessing = true;

        try {
            // 1. KIỂM TRA VÀ XỬ LÝ CHUYỂN HƯỚNG TUẦN TỰ (ƯU TIÊN CAO NHẤT)
            const redirected = handleSequentialRedirect();
            if (redirected) {
                isProcessing = false;
                return;
            }

            // 2. Kiểm tra thông báo chuyển trang - Chuyển về trang chủ
            if (checkForNotification()) {
                goToHomePage();
                isProcessing = false;
                return;
            }

            // 3. Xử lý nút Thực Hiện
            await processThucHien();

            // 4. Xử lý nút Xác nhận trên moneytask.top
            await processMoneytaskConfirm();

            // 5. Xử lý STEP
            const stepButton = findCountdownButton();
            if (stepButton) {
                await clickStepButton(stepButton);
            }

        } catch(e) {
            console.error('Lỗi mainProcess:', e);
        }

        isProcessing = false;
    }

    // ==========================================
    // KHỞI ĐỘNG
    // ==========================================

    console.log('Script đã khởi động - Đang chạy trên:', window.location.hostname);
    console.log('Chức năng:');
    console.log('  - Chuyển hướng tuần tự: trang chủ → /lien-he → /gioi-thieu');
    console.log('  - Auto click Thực Hiện (cooldown 5s + delay 1s)');
    console.log('  - Auto click STEP');
    console.log('  - Auto click Xác nhận (moneytask.top)');
    console.log('  - Chuyển hướng trang chủ khi có thông báo');

    setTimeout(mainProcess, 2000);
    setInterval(mainProcess, 5000);

    const observer = new MutationObserver(() => {
        setTimeout(mainProcess, 500);
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

})();