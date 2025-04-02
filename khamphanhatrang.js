"use strict";

document.addEventListener('DOMContentLoaded', () => {

    // --- Setup & Helpers ---

    const select = (selector, parent = document) => parent.querySelector(selector);
    const selectAll = (selector, parent = document) => parent.querySelectorAll(selector);
    const body = document.body;

    // Remove 'no-js' class to enable JS-dependent styles/animations
    body.classList.remove('no-js');

    // --- Smooth Scroll ---
    selectAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            const targetElement = href && href.length > 1 ? select(href) : null;
            if (targetElement) {
                e.preventDefault();
                targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                if (window.innerWidth <= 1100 && select('#toc')?.classList.contains('expanded')) {
                    toggleToc(false); // Force close TOC on mobile after click
                }
            }
        });
    });

    // --- Header Animation & Typing ---
    const headerImg = select('.header-background img');
    const typingTextElement = select('.typing');

    if (headerImg) {
        setTimeout(() => { headerImg.style.transform = 'scale(1.1)'; }, 100); // Trigger zoom in
    }

    if (typingTextElement) {
        const textToType = typingTextElement.dataset.text || "Khám Phá Nha Trang"; // Use data-text if available
        typingTextElement.textContent = '';
        let charIndex = 0;

        const typeCharacter = () => {
            if (charIndex < textToType.length) {
                typingTextElement.textContent += textToType.charAt(charIndex);
                charIndex++;
                setTimeout(typeCharacter, Math.random() * 80 + 40); // Slightly faster typing
            } else {
                typingTextElement.classList.add('typing-finished');
            }
        };
        setTimeout(typeCharacter, 1500); // Start after header content likely visible
    }

    // --- Intersection Observer for Animations ---
    const observerOptions = { threshold: 0.15, rootMargin: '0px 0px -50px 0px' };
    const sectionObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
                observer.unobserve(entry.target); // Unobserve after animation
            }
        });
    }, observerOptions);
    selectAll('.section, .planning-grid, .tips-grid, .gallery-grid, .card-container').forEach(el => sectionObserver.observe(el));


    // --- Progress Bar ---
    const progressBar = select('#progress-bar');
    const calculateProgress = () => {
        if (!progressBar) return;
        const scrollY = window.scrollY;
        const docHeight = document.documentElement.scrollHeight;
        const winHeight = window.innerHeight;
        const height = docHeight - winHeight;
        const scrolled = height > 0 ? (scrollY / height) * 100 : 0;
        progressBar.style.width = `${scrolled}%`;
    };
    window.addEventListener('scroll', calculateProgress, { passive: true });
    calculateProgress();


    // --- Active Link Highlighting (Nav & TOC) ---
    const navLinks = selectAll('nav a[href^="#"]');
    const tocElementForHighlight = select('#toc'); // Need TOC element ref here
    let tocLinks = []; // Will be populated after TOC generation
    const allSectionTargets = selectAll('section[id]');

    const highlightActiveLink = () => {
        let currentSectionId = '';
        const scrollPosition = window.scrollY;
        const offset = window.innerHeight * 0.4;

        allSectionTargets.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            if (scrollPosition >= sectionTop - offset && scrollPosition < sectionTop + sectionHeight - offset) {
                currentSectionId = section.getAttribute('id');
            }
        });

        if ((window.innerHeight + scrollPosition) >= document.documentElement.scrollHeight - 50) {
            currentSectionId = allSectionTargets[allSectionTargets.length - 1]?.getAttribute('id') || currentSectionId;
        }

        [...navLinks, ...tocLinks].forEach(link => {
            const linkHref = link.getAttribute('href');
            if (linkHref && linkHref.length > 1) {
                link.classList.toggle('active', linkHref === `#${currentSectionId}`);
            }
        });
    };
    window.addEventListener('scroll', highlightActiveLink, { passive: true });


    // --- Table of Contents (TOC) ---
    const tocList = select('#toc-list');
    const tocElement = select('#toc');
    const tocToggleBtn = select('#toc-toggle');
    const mainContainer = select('.container'); // Assuming .container is the main content area

    const generateToc = () => {
        if (!tocList || !allSectionTargets.length) return;
        tocList.innerHTML = '';
        allSectionTargets.forEach(section => {
            const id = section.getAttribute('id');
            // Find h2 directly within the section, avoiding nested ones if possible
            const titleElement = section.querySelector(':scope > h2, :scope > .section-content > h2, :scope > .introductory-section > .section-content > h2');
            if (id && titleElement) {
                const title = titleElement.textContent;
                const li = document.createElement('li');
                const a = document.createElement('a');
                a.href = `#${id}`;
                a.textContent = title;
                li.appendChild(a);
                tocList.appendChild(li);
            }
        });
        // Update tocLinks array after generation
        tocLinks = selectAll('#toc a[href^="#"]');
        highlightActiveLink(); // Initial highlight after generation
    };

    const toggleToc = (forceState = null) => {
        if (!tocElement || !tocToggleBtn) return;
        const shouldBeCollapsed = forceState === false ? false : (forceState === true ? true : tocElement.classList.contains('expanded'));
        tocElement.classList.toggle('collapsed', shouldBeCollapsed);
        tocElement.classList.toggle('expanded', !shouldBeCollapsed);

        const icon = tocToggleBtn.querySelector('i');
        if (icon) {
            icon.className = `fas ${shouldBeCollapsed ? 'fa-chevron-right' : 'fa-chevron-left'}`;
        }
        tocToggleBtn.setAttribute('aria-expanded', !shouldBeCollapsed);
        tocToggleBtn.setAttribute('aria-label', shouldBeCollapsed ? 'Mở mục lục' : 'Đóng mục lục');

        // Adjust main container margin based on TOC state and screen size
        if (mainContainer) {
             const tocWidth = tocElement.offsetWidth; // Get actual width
             const isMobile = window.innerWidth <= 1100;
             if (!isMobile) {
                 mainContainer.style.marginLeft = shouldBeCollapsed ? '30px' : `${tocWidth + 20}px`; // Add some gap
             } else {
                 mainContainer.style.marginLeft = '30px'; // Fixed margin on mobile regardless of TOC state
             }
         }
    };

    if (tocToggleBtn) {
        tocToggleBtn.addEventListener('click', () => toggleToc());
    }

    generateToc();
    // Set initial TOC state based on screen width
     const initialTocCollapsed = window.innerWidth <= 1100;
     toggleToc(initialTocCollapsed);
     // Adjust container margin on load
     if (mainContainer) {
         const tocWidth = tocElement.offsetWidth;
         if (!initialTocCollapsed) {
              mainContainer.style.marginLeft = `${tocWidth + 20}px`;
         } else {
             mainContainer.style.marginLeft = '30px';
         }
     }
    // Add resize listener to handle TOC state and margin adjustments
     window.addEventListener('resize', () => {
         const shouldBeCollapsed = window.innerWidth <= 1100;
         toggleToc(shouldBeCollapsed);
     }, { passive: true });


    // --- Image Modal ---
    const modal = select('#imageModal');
    const modalImg = select('#modalImage');
    const modalCloseBtn = select('.modal .close');
    // Updated selector to include gallery images
    const clickableImages = selectAll('.section:not(#home) img, .card img, .gallery-item img');

    const openModal = (imgElement) => {
        if (!modal || !modalImg || !imgElement) return;
        modalImg.src = imgElement.src;
        modalImg.alt = imgElement.alt || "Hình ảnh Nha Trang";
        modal.classList.add('active');
        body.style.overflow = 'hidden';
    };

    const closeModal = () => {
        if (!modal) return;
        modal.classList.remove('active');
        body.style.overflow = '';
    };

    if (modal && modalImg && modalCloseBtn) {
        clickableImages.forEach(img => {
            if (!img.closest('a')) {
                img.style.cursor = 'pointer';
                img.addEventListener('click', (e) => {
                     e.stopPropagation(); // Prevent potential parent clicks
                     openModal(img);
                });
            }
        });
        modalCloseBtn.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
        window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && modal.classList.contains('active')) closeModal(); });
    }


    // --- Chat Functionality ---
    const chatBox = select('#chat-box');
    const chatToggleBtn = select('#chat-toggle'); // Renamed for clarity
    const chatOpenBtn = select('#chat-open-btn');
    const sendMessageBtn = select('#send-message');
    const chatInput = select('#chat-input');
    const chatMessagesContainer = select('#chat-messages');
    const chatTypingIndicator = select('#chat-typing');
    const chatNotificationDot = select('.chat-notification-dot');
    let isChatOpen = false;
    let hasUnread = true; // Assume new message initially

    const updateUnreadStatus = (state) => {
        hasUnread = state;
        if (chatNotificationDot) {
            chatNotificationDot.style.display = hasUnread && !isChatOpen ? 'block' : 'none';
        }
    };

    const toggleChat = (show) => {
        if (!chatBox || !chatOpenBtn) return;
        isChatOpen = typeof show === 'boolean' ? show : !chatBox.classList.contains('active');
        chatBox.classList.toggle('active', isChatOpen);
        chatOpenBtn.classList.toggle('hidden', isChatOpen);
        if (isChatOpen) {
            chatInput?.focus();
            updateUnreadStatus(false);
            chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight; // Scroll down on open
        }
    };

    const appendMessage = (text, type) => {
        if (!chatMessagesContainer) return;
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', type === 'user' ? 'user-message' : 'bot-message');
        messageDiv.textContent = text;
        chatMessagesContainer.appendChild(messageDiv);
        chatMessagesContainer.scrollTo({ top: chatMessagesContainer.scrollHeight, behavior: 'smooth' });
    };

    const showTypingIndicator = (show) => {
        if (chatTypingIndicator) {
            chatTypingIndicator.style.display = show ? 'flex' : 'none';
            if (show) {
                chatMessagesContainer.scrollTo({ top: chatMessagesContainer.scrollHeight, behavior: 'smooth' });
            }
        }
    };

    // Enhanced Bot Responses
    const getBotResponse = (userMessage) => {
        const msg = userMessage.toLowerCase().trim().replace(/[.,!?]/g, ''); // Basic normalization
        let responses = [];

        // Greetings & Basic Info
        if (/\b(chào|hello|hi|hey)\b/.test(msg)) responses.push("Xin chào! Bạn muốn biết thông tin gì về Nha Trang hôm nay?");
        if (/\b(nha trang)\b/.test(msg) && !responses.length) responses.push("Nha Trang là một thành phố biển xinh đẹp nổi tiếng với vịnh biển, đảo và di tích Chăm Pa. Bạn quan tâm đến khía cạnh nào?");

        // Activities & Sightseeing
        if (/\b(chơi gì|làm gì|tham quan|đi đâu|địa điểm|vui chơi|hoạt động)\b/.test(msg)) responses.push("Nha Trang có rất nhiều hoạt động! Bạn thích khám phá đảo (Hòn Mun, Hòn Tằm), vui chơi ở VinWonders, tham quan di tích (Tháp Bà), tắm bùn, hay lặn biển?");
        if (/\b(đảo|hòn)\b/.test(msg)) responses.push("Các hòn đảo nổi tiếng gồm Hòn Mun (lặn biển), Hòn Tằm (nghỉ dưỡng, tắm bùn), Đảo Yến (tham quan theo tour), Hòn Tre (VinWonders)... Bạn muốn biết thêm về đảo nào?");
        if (/\b(lặn biển|snorkeling|san hô)\b/.test(msg)) responses.push("Hòn Mun là địa điểm tuyệt vời nhất để lặn biển ngắm san hô ở Nha Trang!");
        if (/\b(tắm bùn|mud bath)\b/.test(msg)) responses.push("Bạn có thể trải nghiệm tắm bùn khoáng nóng thư giãn tại Tháp Bà hoặc I-Resort.");
        if (/\b(vinwonder|vinpearl)\b/.test(msg)) responses.push("VinWonders trên đảo Hòn Tre là khu vui chơi giải trí lớn với nhiều trò chơi, công viên nước và show diễn.");
        if (/\b(tháp bà|ponagar)\b/.test(msg)) responses.push("Tháp Bà Ponagar là di tích Chăm Pa cổ kính và linh thiêng, một điểm tham quan văn hóa quan trọng.");

        // Food
        if (/\b(ăn gì|ẩm thực|đặc sản|món ngon)\b/.test(msg)) responses.push("Ẩm thực Nha Trang rất đặc sắc! Bạn nên thử hải sản tươi sống, bún chả cá, bún sứa, nem nướng Ninh Hòa, bánh căn, gỏi cá mai...");

        // Planning & Logistics
        if (/\b(thời tiết|mùa nào|khi nào đi)\b/.test(msg)) responses.push("Thời gian đẹp nhất để đi Nha Trang là từ tháng 1 đến tháng 8, trời nắng đẹp, biển êm. Mùa mưa thường từ tháng 9 đến tháng 12.");
        if (/\b(di chuyển|đến nha trang|sân bay|tàu|xe)\b/.test(msg)) responses.push("Bạn có thể đến Nha Trang bằng máy bay (sân bay Cam Ranh), tàu hỏa hoặc xe khách. Tại Nha Trang, có thể thuê xe máy, đi taxi/Grab hoặc xe buýt.");
        if (/\b(ở đâu|khách sạn|resort|lưu trú)\b/.test(msg)) responses.push("Nha Trang có đủ loại hình lưu trú từ resort cao cấp, khách sạn tiện nghi đến homestay. Khu vực đường Trần Phú hoặc các resort ở Bãi Dài là lựa chọn phổ biến.");

        // Pricing & Booking
        if (/\b(giá|bao nhiêu|chi phí|đặt tour|booking)\b/.test(msg)) responses.push("Về giá cả và đặt dịch vụ cụ thể, tôi chưa thể cung cấp chi tiết. Bạn vui lòng tham khảo các công ty du lịch hoặc để lại thông tin để được tư vấn nhé!");

        // General Chit-chat & Closing
        if (/\b(đẹp|thích|tuyệt)\b/.test(msg)) responses.push("Tuyệt vời! Nha Trang chắc chắn sẽ không làm bạn thất vọng. 😊");
        if (/\b(cảm ơn|thank you|cám ơn)\b/.test(msg)) responses.push("Rất vui được hỗ trợ bạn! Chúc bạn có chuyến đi vui vẻ!");
        if (/\b(tạm biệt|bye)\b/.test(msg)) responses.push("Tạm biệt! Hẹn gặp lại bạn ở Nha Trang!");

        // Default response
        if (responses.length === 0) responses.push("Xin lỗi, tôi chưa hiểu rõ câu hỏi của bạn. Bạn có thể hỏi về địa điểm tham quan, ăn uống, hoặc thời tiết ở Nha Trang không?");

        return responses[Math.floor(Math.random() * responses.length)]; // Return a random relevant response
    };

    const handleSendMessage = () => {
        if (!chatInput || !sendMessageBtn || !chatMessagesContainer) return;
        const messageText = chatInput.value.trim();
        if (!messageText) return;

        appendMessage(messageText, 'user');
        chatInput.value = '';
        chatInput.disabled = true;
        sendMessageBtn.disabled = true;
        showTypingIndicator(true);

        setTimeout(() => {
            const botText = getBotResponse(messageText);
            appendMessage(botText, 'bot');
            showTypingIndicator(false);
            chatInput.disabled = false;
            sendMessageBtn.disabled = false;
            chatInput.focus();
            if (!isChatOpen) { updateUnreadStatus(true); }
        }, 1000 + Math.random() * 1000); // Slightly longer, more variable delay
    };

    if (chatOpenBtn) chatOpenBtn.addEventListener('click', () => toggleChat(true));
    if (chatToggleBtn) chatToggleBtn.addEventListener('click', () => toggleChat(false));
    if (sendMessageBtn) sendMessageBtn.addEventListener('click', handleSendMessage);
    if (chatInput) {
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
            }
        });
    }
    updateUnreadStatus(hasUnread); // Init dot


    // --- Dark Mode ---
    const darkModeToggleBtn = select('.dark-mode-toggle');
    const initializeDarkMode = () => {
        let prefersDark = false;
        try {
            const savedPreference = localStorage.getItem('darkMode');
            if (savedPreference !== null) {
                prefersDark = savedPreference === 'true';
            } else {
                prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
            }
        } catch (e) { console.warn("Could not access dark mode preference."); }

        body.classList.toggle('dark-mode', prefersDark);
        if (darkModeToggleBtn) {
            darkModeToggleBtn.innerHTML = prefersDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
            darkModeToggleBtn.setAttribute('aria-label', prefersDark ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối');
        }
    };

    const toggleDarkMode = () => {
        if (!darkModeToggleBtn) return;
        const isDark = body.classList.toggle('dark-mode');
        darkModeToggleBtn.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
        darkModeToggleBtn.setAttribute('aria-label', isDark ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối');
        try { localStorage.setItem('darkMode', isDark ? 'true' : 'false'); }
        catch (e) { console.warn("Could not save dark mode preference."); }
    };

    if (darkModeToggleBtn) darkModeToggleBtn.addEventListener('click', toggleDarkMode);
    initializeDarkMode();


    // --- Filter Functionality ---
    const filterButtons = selectAll('#destinations .filter-btn, #places .filter-btn'); // Combine filters if needed, or keep separate
    const filterableCards = selectAll('.destinations-container .place-card[data-category]'); // Target specific cards

    if (filterButtons.length > 0 && filterableCards.length > 0) {
        filterButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                if (btn.classList.contains('active')) return;
                filterButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const filterValue = btn.getAttribute('data-filter');

                filterableCards.forEach(card => {
                    const category = card.getAttribute('data-category');
                    const matchesFilter = (filterValue === 'all' || category === filterValue);
                    card.style.transition = 'opacity 0.4s ease, transform 0.4s ease, display 0s ease 0.4s'; // Adjust timing
                    if (matchesFilter) {
                         card.style.removeProperty('display');
                         requestAnimationFrame(() => { // Force reflow before animation
                             card.style.opacity = '1';
                             card.style.transform = 'scale(1)';
                         });
                    } else {
                        card.style.opacity = '0';
                        card.style.transform = 'scale(0.95)';
                        card.style.display = 'none'; // Hide after transition using timing function
                    }
                });
            });
        });
    }


    // --- Rating and Comment ---
    selectAll('.interactive-card').forEach(card => {
        const stars = selectAll('.rating .star', card);
        const submitBtn = select('.submit-comment', card);
        const commentBox = select('.comment-box', card);
        let currentRating = 0;

        if (stars.length > 0) {
            const ratingContainer = stars[0].parentElement;
            const resetStars = () => {
                stars.forEach(s => s.classList.remove('active', 'hover'));
                stars.forEach(s => { if (parseInt(s.getAttribute('data-value')) <= currentRating) s.classList.add('active'); });
            };
            stars.forEach(star => {
                const starValue = parseInt(star.getAttribute('data-value'));
                star.addEventListener('click', () => { currentRating = starValue; resetStars(); });
                star.addEventListener('mouseover', () => {
                    stars.forEach(s => { s.classList.toggle('hover', parseInt(s.getAttribute('data-value')) <= starValue); });
                });
            });
            ratingContainer.addEventListener('mouseleave', resetStars);
        }

        if (submitBtn && commentBox) {
            submitBtn.addEventListener('click', () => {
                const commentText = commentBox.value.trim();
                if (!commentText && currentRating === 0) {
                    alert("Vui lòng nhập bình luận hoặc chọn điểm đánh giá."); return;
                }
                let msg = "Đã gửi đánh giá:\n";
                if (currentRating > 0) msg += `Điểm: ${currentRating} sao\n`;
                if (commentText) msg += `Bình luận: ${commentText}`;
                alert(msg);
                commentBox.value = ''; currentRating = 0;
                stars.forEach(s => s.classList.remove('active', 'hover'));
            });
        }
    });


    // --- Back to Top Button ---
    const backToTopButton = select('#back-to-top');
    if (backToTopButton) {
        const scrollFunction = () => {
            backToTopButton.classList.toggle('visible', window.scrollY > 300);
        };
        window.addEventListener('scroll', scrollFunction, { passive: true });
        backToTopButton.addEventListener('click', () => { window.scrollTo({ top: 0, behavior: 'smooth' }); });
    }

    // --- Update Footer Year ---
    const yearSpan = select('#current-year');
    if (yearSpan) yearSpan.textContent = new Date().getFullYear();

}); // End DOMContentLoaded