document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const form = document.getElementById('script-form');
    const submitBtn = document.getElementById('submit-btn');
    const btnText = submitBtn.querySelector('.btn-text');
    const loader = submitBtn.querySelector('.loader');
    
    // Result Elements
    const resultSection = document.getElementById('result-section');
    const hookContent = document.getElementById('hook-content');
    const scriptTableBody = document.querySelector('#script-table tbody');
    const captionList = document.getElementById('caption-list');
    const hashtagList = document.getElementById('hashtag-list');
    const bgmBox = document.getElementById('bgm-recommendation');
    const ctaContent = document.getElementById('cta-content');
    const errorBox = document.getElementById('api-error');

    // Custom Style Elements
    const styleOtherCheckbox = document.getElementById('style-other-checkbox');
    const customStyleContainer = document.getElementById('custom-style-container');
    const customStyleInput = document.getElementById('custom-style-input');

    // Custom Audience Elements
    const audienceOtherCheckbox = document.getElementById('audience-other-checkbox');
    const customAudienceContainer = document.getElementById('custom-audience-container');
    const customAudienceInput = document.getElementById('custom-audience-input');

    // UI Steps & Inputs
    const steps = [
        { 
            stepNum: 1, 
            id: 'product', 
            element: document.getElementById('product'),
            validate: (val) => val.trim().length > 0,
            errId: 'error-product',
            errMsg: 'Vui lòng nhập sản phẩm/dịch vụ'
        },
        { 
            stepNum: 2, 
            id: 'message', 
            element: document.getElementById('message'),
            validate: (val) => val.trim().length > 0,
            errId: 'error-message',
            errMsg: 'Vui lòng nhập thông điệp'
        },
        { 
            stepNum: 3, 
            id: 'audience', 
            element: document.getElementById('audience-group'),
            validate: () => {
                const audiences = getSelectedAudiences();
                if (audiences.length === 0 && !audienceOtherCheckbox.checked) {
                    steps[2].errMsg = 'Vui lòng chọn ít nhất 1 đối tượng khán giả';
                    return false;
                }
                
                if (audienceOtherCheckbox.checked) {
                    const customVal = customAudienceInput.value.trim();
                    if (!customVal) {
                        steps[2].errMsg = 'Vui lòng nhập đối tượng khán giả';
                        return false;
                    }
                    if (/\d/.test(customVal)) {
                        steps[2].errMsg = 'Vui lòng chỉ nhập chữ cho đối tượng khán giả';
                        return false;
                    }
                }
                steps[2].errMsg = 'Vui lòng chọn ít nhất 1 đối tượng khán giả';
                return true;
            },
            errId: 'error-audience',
            errMsg: 'Vui lòng chọn ít nhất 1 đối tượng khán giả'
        },
        { 
            stepNum: 4, 
            id: 'duration', 
            element: document.getElementById('duration'),
            validate: (val) => val !== '' && !isNaN(val) && Number(val) >= 5 && Number(val) <= 600,
            errId: 'error-duration',
            errMsg: 'Thời lượng phải từ 5 đến 600 giây theo tiêu chuẩn TikTok'
        },
        { 
            stepNum: 5, 
            id: 'actors', 
            element: document.getElementById('actors'),
            validate: (val) => val !== '' && !isNaN(val) && Number.isInteger(Number(val)),
            errId: 'error-actors',
            errMsg: 'Số lượng diễn viên phải là số'
        },
        { 
            stepNum: 6, 
            id: 'style',
            element: document.getElementById('style-group'), // Parent container for checkboxes
            validate: () => {
                const styles = getSelectedStyles();
                if (styles.length === 0 && !styleOtherCheckbox.checked) return false;
                
                if (styleOtherCheckbox.checked) {
                    const customVal = customStyleInput.value.trim();
                    if (!customVal) {
                        steps[5].errMsg = 'Vui lòng nhập phong cách video';
                        return false;
                    }
                }
                steps[5].errMsg = 'Vui lòng chọn ít nhất 1 phong cách';
                return true;
            },
            errId: 'error-style',
            errMsg: 'Vui lòng chọn ít nhất 1 phong cách'
        }
    ];

    const styleCheckboxes = document.querySelectorAll('input[name="style"]');
    const audienceCheckboxes = document.querySelectorAll('input[name="audience"]');
    const presetBtns = document.querySelectorAll('.preset-btn');
    
    // Validation State Tracking
    let currentValidStep = 0; // 0 to 5
    let isSubmitting = false; // Throttling state
    let lastSubmitTime = 0; // Delay tracking

    // Initialize
    bindEvents();
    updateProgress();

    /**
     * Bind all event listeners
     */
    function bindEvents() {
        // Form Inputs (Realtime Validation & Strict Order Check)
        steps.forEach((step, index) => {
            if (step.id !== 'style' && step.id !== 'audience') { // Input fields (text, textarea, number)
                step.element.addEventListener('input', () => handleInputChange(index));
                step.element.addEventListener('focus', (e) => enforceSequentialFocus(index, e));
            }
        });

        // Audience Checkboxes (Step 3)
        audienceCheckboxes.forEach(cb => {
            cb.addEventListener('change', () => handleInputChange(2));
            cb.addEventListener('click', (e) => enforceSequentialFocus(2, e));
        });

        // Custom Audience events
        audienceOtherCheckbox.addEventListener('change', () => {
            if (audienceOtherCheckbox.checked) {
                customAudienceContainer.classList.remove('hidden');
                customAudienceInput.focus();
            } else {
                customAudienceContainer.classList.add('hidden');
                customAudienceInput.value = '';
                clearInputError(2); // clear custom audience error if it was showing
            }
            handleInputChange(2);
        });
        audienceOtherCheckbox.addEventListener('click', (e) => enforceSequentialFocus(2, e));

        customAudienceInput.addEventListener('input', () => {
            const val = customAudienceInput.value.trim();
            if (val && !/\d/.test(val)) {
                document.getElementById('error-custom-audience').classList.add('hidden');
                customAudienceInput.classList.remove('is-invalid');
                customAudienceInput.classList.add('is-valid');
                document.getElementById('error-audience').classList.add('hidden');
            } else {
                customAudienceInput.classList.add('is-invalid');
                customAudienceInput.classList.remove('is-valid');
            }
            handleInputChange(2);
        });
        customAudienceInput.addEventListener('focus', (e) => enforceSequentialFocus(2, e));
        customAudienceInput.addEventListener('blur', () => {
            customAudienceInput.value = customAudienceInput.value.trim();
            handleInputChange(2);
        });

        // Style Checkboxes (Step 6)
        styleCheckboxes.forEach(cb => {
            cb.addEventListener('change', () => handleInputChange(5));
            cb.addEventListener('click', (e) => enforceSequentialFocus(5, e));
        });

        // Custom Style events
        styleOtherCheckbox.addEventListener('change', () => {
            if (styleOtherCheckbox.checked) {
                customStyleContainer.classList.remove('hidden');
                customStyleInput.focus();
            } else {
                customStyleContainer.classList.add('hidden');
                customStyleInput.value = '';
                clearInputError(5); // clear custom style error if it was showing
            }
            handleInputChange(5);
        });
        styleOtherCheckbox.addEventListener('click', (e) => enforceSequentialFocus(5, e));

        customStyleInput.addEventListener('input', () => {
            // Remove error if typing
            const val = customStyleInput.value.trim();
            if (val) {
                document.getElementById('error-custom-style').classList.add('hidden');
                customStyleInput.classList.remove('is-invalid');
                customStyleInput.classList.add('is-valid');
                document.getElementById('error-style').classList.add('hidden');
            } else {
                customStyleInput.classList.add('is-invalid');
                customStyleInput.classList.remove('is-valid');
            }
            handleInputChange(5);
        });
        customStyleInput.addEventListener('focus', (e) => enforceSequentialFocus(5, e));
        customStyleInput.addEventListener('blur', () => {
            customStyleInput.value = customStyleInput.value.trim();
            handleInputChange(5);
        });

        // Preset buttons for Actors
        presetBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const isValidBefore = enforceSequentialFocus(4, e);
                if(isValidBefore) {
                    const val = btn.getAttribute('data-val');
                    steps[4].element.value = val;
                    handleInputChange(4);
                }
            });
        });

        // Form Submit
        form.addEventListener('submit', handleFormSubmit);
    }

    /**
     * Lấy danh sách audience đã chọn
     */
    function getSelectedAudiences() {
        const audiences = Array.from(audienceCheckboxes).filter(cb => cb.checked).map(cb => cb.value);
        if (audienceOtherCheckbox.checked) {
            const customVal = customAudienceInput.value.trim();
            if (customVal && !/\d/.test(customVal)) audiences.push(customVal);
        }
        return audiences;
    }

    /**
     * Lấy danh sách style đã chọn
     */
    function getSelectedStyles() {
        const styles = Array.from(styleCheckboxes).filter(cb => cb.checked).map(cb => cb.value);
        if (styleOtherCheckbox.checked) {
            const customVal = customStyleInput.value.trim();
            if (customVal) styles.push(customVal);
        }
        return styles;
    }

    /**
     * Hiển thị cảnh báo lỗi trên một input cụ thể
     */
    function showInputError(stepIndex, customMsg = null) {
        const step = steps[stepIndex];
        
        // Handle special custom style case
        if (step.id === 'style' && styleOtherCheckbox.checked && !customStyleInput.value.trim()) {
            const customErrorEl = document.getElementById('error-custom-style');
            customErrorEl.textContent = customMsg || step.errMsg;
            customErrorEl.classList.remove('hidden');
            customStyleInput.classList.add('is-invalid');
            customStyleInput.classList.remove('is-valid');
            
            // hide main style error to avoid duplicate messages
            document.getElementById(step.errId).classList.add('hidden');
            return;
        }

        // Handle special custom audience case
        if (step.id === 'audience' && audienceOtherCheckbox.checked && (!customAudienceInput.value.trim() || /\d/.test(customAudienceInput.value.trim()))) {
            const customErrorEl = document.getElementById('error-custom-audience');
            customErrorEl.textContent = customMsg || step.errMsg;
            customErrorEl.classList.remove('hidden');
            customAudienceInput.classList.add('is-invalid');
            customAudienceInput.classList.remove('is-valid');
            
            document.getElementById(step.errId).classList.add('hidden');
            return;
        }

        const errorEl = document.getElementById(step.errId);
        errorEl.textContent = customMsg || step.errMsg;
        errorEl.classList.remove('hidden');
        
        if (step.id !== 'style' && step.id !== 'audience') {
            step.element.classList.add('is-invalid');
            step.element.classList.remove('is-valid');
        }
    }

    /**
     * Xóa cảnh báo lỗi trên một input
     */
    function clearInputError(stepIndex) {
        const step = steps[stepIndex];
        
        if (step.id === 'style') {
            document.getElementById('error-custom-style').classList.add('hidden');
            customStyleInput.classList.remove('is-invalid');
            if (styleOtherCheckbox.checked) {
                customStyleInput.classList.add('is-valid');
            }
        }

        if (step.id === 'audience') {
            document.getElementById('error-custom-audience').classList.add('hidden');
            customAudienceInput.classList.remove('is-invalid');
            if (audienceOtherCheckbox.checked) {
                customAudienceInput.classList.add('is-valid');
            }
        }

        const errorEl = document.getElementById(step.errId);
        errorEl.classList.add('hidden');
        
        if (step.id !== 'style' && step.id !== 'audience') {
            step.element.classList.remove('is-invalid');
            step.element.classList.add('is-valid');
        }
    }

    /**
     * Đảm bảo người dùng điền theo thứ tự. 
     * Nếu field trước đó chưa hợp lệ -> Focus lại field đó và báo lỗi.
     * @returns boolean - true if allowed to proceed, false if blocked
     */
    function enforceSequentialFocus(clickedStepIndex, event) {
        // Duyệt từ step 1 đến step trước step hiện tại đang click
        for (let i = 0; i < clickedStepIndex; i++) {
            const step = steps[i];
            const val = (step.id === 'style' || step.id === 'audience') ? null : step.element.value;
            const isValid = step.validate(val);
            
            if (!isValid) {
                // Prevent check/click if it's checkbox or button
                if(event && event.preventDefault) event.preventDefault();
                
                // Show tooltip message
                showInputError(i, 'Vui lòng hoàn thành trường này trước khi tiếp tục');
                
                // Blur current, focus the invalid one smoothly
                setTimeout(() => {
                    if(document.activeElement) document.activeElement.blur();
                    if(step.id !== 'style' && step.id !== 'audience') {
                        step.element.focus();
                        // Scroll slightly to view 
                        step.element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                }, 10);
                
                return false;
            }
        }
        return true;
    }

    /**
     * Xử lý Realtime Validation khi đang gõ/chọn
     */
    function handleInputChange(stepIndex) {
        const step = steps[stepIndex];
        const val = (step.id === 'style' || step.id === 'audience') ? null : step.element.value;
        const isValid = step.validate(val);

        if (isValid) {
            clearInputError(stepIndex);
        } else {
            showInputError(stepIndex);
        }

        updateProgress();
    }

    /**
     * Tính toán tiến độ form và cập nhật UI (Nút Submit)
     */
    function updateProgress() {
        let validStepsCount = 0;
        
        steps.forEach((step, i) => {
            const val = (step.id === 'style' || step.id === 'audience') ? null : step.element.value;
            const isValid = step.validate(val);
            if (isValid) {
                validStepsCount++;
            }
        });

        // Điểm dừng hợp lệ lớn nhất
        currentValidStep = validStepsCount;
        
        // Enable / Disable Submit
        submitBtn.disabled = validStepsCount !== 6;
    }

    /**
     * Submit Form & Call API
     */
    async function handleFormSubmit(e) {
        e.preventDefault();
        
        // Final Double Check Validation
        let allValid = true;
        for (let i = 0; i < steps.length; i++) {
            const val = (steps[i].id === 'style' || steps[i].id === 'audience') ? null : steps[i].element.value;
            if(!steps[i].validate(val)) {
                showInputError(i);
                allValid = false;
                if(steps[i].id !== 'style' && steps[i].id !== 'audience') steps[i].element.focus();
                else if (steps[i].id === 'style' && styleOtherCheckbox.checked) customStyleInput.focus();
                else if (steps[i].id === 'audience' && audienceOtherCheckbox.checked) customAudienceInput.focus();
                break;
            }
        }

        if (!allValid) return;

        // Retrieve Cleaned Values
        const product = steps[0].element.value.trim();
        const message = steps[1].element.value.trim();
        const audience = getSelectedAudiences().join(', ');
        const duration = steps[3].element.value + 's';
        const actors = steps[4].element.value + ' người';
        const style = getSelectedStyles().join(', ');

        const now = Date.now();
        if (isSubmitting || now - lastSubmitTime < 3000) {
            errorBox.innerHTML = `⚠️ Vui lòng đợi 3 giây trước tạo kịch bản mới.`;
            errorBox.classList.remove('hidden');
            return;
        }

        isSubmitting = true;
        lastSubmitTime = now;

        // Reset & Show Loading
        errorBox.classList.add('hidden');
        resultSection.classList.add('hidden');
        hookContent.innerHTML = '';
        scriptTableBody.innerHTML = '';
        captionList.innerHTML = '';
        hashtagList.innerHTML = '';
        bgmBox.innerHTML = '';
        ctaContent.innerHTML = '';

        submitBtn.disabled = true;
        btnText.textContent = "ĐANG TẠO KỊCH BẢN...";
        loader.classList.remove('hidden');

        try {
            const result = await generateScriptAPI(product, message, audience, duration, actors, style);
            if (result) {
                renderResult(result);
            }
        } catch (error) {
            console.error("API Error:", error);
            errorBox.innerHTML = `❌ ${error.message || "Lỗi khi gọi AI. Hãy thử lại."}`;
            errorBox.classList.remove('hidden');
        } finally {
            isSubmitting = false;
            submitBtn.disabled = false;
            btnText.textContent = "🚀 TẠO KỊCH BẢN NGAY (Hoàn thành form)";
            loader.classList.add('hidden');
        }
    }

    /**
     * Gọi API nội bộ để tạo script
     */
    async function generateScriptAPI(product, message, audience, duration, actors, style) {
        const requestBody = {
            product,
            message,
            audience,
            duration,
            actors,
            style
        };

        const maxRetries = 2; // Thử lại tối đa 2 lần thêm (tổng 3 lần gọi)
        let attempt = 0;

        while (attempt <= maxRetries) {
            try {
                const response = await fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(requestBody)
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    let errorMsg = `Lỗi HTTP ${response.status}: `;

                    if (response.status === 404) {
                        errorMsg += "Không tìm thấy endpoint /api/chat (Lỗi 404 - Vercel chưa nhận diện được Serverless Function).";
                    } else if (response.status === 500) {
                        errorMsg += "Lỗi Internal Server Error (Lỗi 500 - API Key sai hoặc server chat.js gặp lỗi xử lý).";
                    } else {
                        errorMsg += "Chi tiết lỗi nằm ở console.log.";
                    }

                    try {
                        const errorJson = JSON.parse(errorText);
                        if (errorJson.error && errorJson.error.message) {
                            errorMsg += ` - ${errorJson.error.message}`;
                        } else if (errorJson.error) {
                            errorMsg += ` - ${errorJson.error}`;
                        } else if (errorJson.message) {
                            errorMsg += ` - ${errorJson.message}`;
                        }
                    } catch (e) {
                        // Không parse được JSON, in thêm nguyên văn text nếu có
                        if (errorText) errorMsg += ` - RAW: ${errorText}`;
                    }

                    if (response.status === 429) {
                        if (attempt < maxRetries) {
                            attempt++;
                            console.warn(`⏳ Quota exceeded (429). Retrying attempt ${attempt} in 3 seconds...`);
                            btnText.textContent = `ĐANG THỬ LẠI LẦN ${attempt}...`;
                            await new Promise(r => setTimeout(r, 3000)); // 3 giây delay
                            continue; // Retry lại vòng lặp
                        }
                    }

                    throw new Error(errorMsg);
                }

                const result = await response.json();
                return result;

            } catch (err) {
                // If it's the last attempt, or it's not a quota error handled inside the loop, throw it.
                if (attempt >= maxRetries || !err.message.includes('Quota')) {
                    throw err; 
                }
            }
        }
    }

    /**
     * Render DOM with block by block delay for UX optimization
     */
    function renderResult(data) {
        resultSection.classList.remove('hidden');
        resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

        // Populate elements but hide them initially or stagger them
        const blocks = document.querySelectorAll('.result-block');
        blocks.forEach(b => b.style.opacity = '0'); // Reset opacity

        // Hook
        if(data.hook) hookContent.innerHTML = `<p>🚀 <strong>${data.hook}</strong></p>`;

        // Timeline (Scene, Visual, Dialogue)
        if (data.timeline && data.timeline.length > 0) {
            data.timeline.forEach(scene => {
                const tr = document.createElement('tr');
                tr.innerHTML = `<td>${scene.time}</td><td>${scene.visual}</td><td>"${scene.dialogue}"</td>`;
                scriptTableBody.appendChild(tr);
            });
        }

        // Caption
        if (data.captions) data.captions.forEach(c => {
            const d = document.createElement('div'); d.className = 'caption-item'; d.textContent = c; captionList.appendChild(d);
        });

        // Hashtags
        if (data.hashtags) data.hashtags.forEach(h => {
            const s = document.createElement('span'); s.className = 'hashtag'; s.textContent = h.startsWith('#')?h:`#${h}`; hashtagList.appendChild(s);
        });

        // BGM
        if (data.bgm) bgmBox.innerHTML = `<p>🎧 <strong>${data.bgm}</strong></p>`;

        // CTA
        if (data.cta) ctaContent.innerHTML = `<p>🎯 <strong>${data.cta}</strong></p>`;

        // Staggered reveal for blocks
        blocks.forEach((block, index) => {
            setTimeout(() => {
                block.style.transition = 'opacity 0.5s ease-in-out, transform 0.5s ease';
                block.style.opacity = '1';
                block.style.transform = 'translateY(0)';
            }, index * 200 + 100);
        });
    }

    // --- COPY UTILS ---
    function copyToClipboard(text, btnElement) {
        navigator.clipboard.writeText(text).then(() => {
            const originalText = btnElement.textContent;
            btnElement.textContent = '✔️ Đã Copy'; btnElement.classList.add('copied');
            setTimeout(() => { btnElement.textContent = originalText; btnElement.classList.remove('copied'); }, 2000);
        });
    }

    // --- ĐẶT HÀM COPY RA GLOBAL ĐỂ GỌI TỪ OUTSIDE (ONCLICK EVENT HTML) ---
    window.copyBlock = function(containerId, btnElement) {
        const container = document.getElementById(containerId);
        let textToCopy = '';

        if (!container) return;

        // Xử lý Table
        if (container.tagName.toLowerCase() === 'div' && container.querySelector('table')) {
            textToCopy = "=== PHÂN CẢNH CHI TIẾT & LỜI THOẠI ===\n\n";
            container.querySelectorAll('tbody tr').forEach(row => {
                const cells = row.querySelectorAll('td');
                if (cells.length === 3) textToCopy += `[${cells[0].innerText}]\n- Bối cảnh: ${cells[1].innerText}\n- Lời thoại: ${cells[2].innerText}\n\n`;
            });
        } 
        // Xử lý Caption Container chứa List & Hashtags
        else if (containerId === 'caption-container') {
            const caps = container.querySelectorAll('.caption-item');
            const htags = container.querySelectorAll('.hashtag');
            textToCopy = "=== GỢI Ý CAPTIONS ===\n" + Array.from(caps).map(c => c.innerText).join("\n") + "\n\n=== HASHTAGS ===\n" + Array.from(htags).map(h => h.innerText).join(" ");
        }
        // Xử lý text thường (Hook, CTA, BGM)
        else {
            textToCopy = container.innerText;
        }

        // Thực hiện lệnh Copy
        navigator.clipboard.writeText(textToCopy).then(() => {
            const originalText = btnElement.textContent;
            btnElement.textContent = '✔️ Đã Copy'; 
            btnElement.classList.add('copied');
            setTimeout(() => { 
                btnElement.textContent = originalText; 
                btnElement.classList.remove('copied'); 
            }, 2000);
        });
    }
});
