// User Tracking System for Dipshade Arena
class UserTracker {
    constructor() {
        this.apiBase = 'https://dipshade-ks73.onrender.com';
        this.sessionId = this.generateSessionId();
        this.userId = this.getUserId();
        this.startTime = Date.now();
        this.events = [];
        this.init();
    }

    generateSessionId() {
        return 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    getUserId() {
        let userId = localStorage.getItem('dipshade_user_id');
        if (!userId) {
            userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('dipshade_user_id', userId);
        }
        return userId;
    }

    init() {
        this.trackPageView();
        this.setupEventListeners();
        this.startSessionTracking();
        this.trackUserAgent();
    }

    async track(eventType, data = {}) {
        const event = {
            event_type: eventType,
            session_id: this.sessionId,
            user_id: this.userId,
            timestamp: new Date().toISOString(),
            page_url: window.location.href,
            page_title: document.title,
            referrer: document.referrer,
            user_agent: navigator.userAgent,
            screen_resolution: `${screen.width}x${screen.height}`,
            viewport_size: `${window.innerWidth}x${window.innerHeight}`,
            ...data
        };

        this.events.push(event);

        try {
            await fetch(`${this.apiBase}/user-event`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(event)
            });
        } catch (error) {
            console.error('Tracking failed:', error);
        }
    }

    trackPageView() {
        this.track('page_view', {
            page_path: window.location.pathname,
            page_search: window.location.search,
            load_time: performance.now()
        });
    }

    setupEventListeners() {
        // Track clicks
        document.addEventListener('click', (e) => {
            const element = e.target.closest('a, button, [data-track]');
            if (element) {
                this.track('click', {
                    element_type: element.tagName.toLowerCase(),
                    element_text: element.textContent?.trim().substring(0, 100),
                    element_class: element.className,
                    element_id: element.id,
                    href: element.href,
                    x: e.clientX,
                    y: e.clientY
                });
            }
        });

        // Track scroll depth
        let maxScroll = 0;
        window.addEventListener('scroll', () => {
            const scrollPercent = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
            if (scrollPercent > maxScroll) {
                maxScroll = scrollPercent;
                if (maxScroll % 25 === 0) { // Track at 25%, 50%, 75%, 100%
                    this.track('scroll', { depth: maxScroll });
                }
            }
        });

        // Track time on page
        window.addEventListener('beforeunload', () => {
            const timeOnPage = Date.now() - this.startTime;
            this.track('page_exit', { 
                time_on_page: timeOnPage,
                max_scroll: maxScroll
            });
        });

        // Track form interactions
        document.addEventListener('focus', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                this.track('form_focus', {
                    field_name: e.target.name,
                    field_type: e.target.type
                });
            }
        }, true);
    }

    startSessionTracking() {
        // Track session every 30 seconds
        setInterval(() => {
            this.track('session_ping', {
                session_duration: Date.now() - this.startTime,
                events_count: this.events.length
            });
        }, 30000);
    }

    trackUserAgent() {
        const ua = navigator.userAgent;
        let device = 'desktop';
        if (/Mobile|Android|iPhone|iPad/.test(ua)) device = 'mobile';
        if (/Tablet|iPad/.test(ua)) device = 'tablet';

        this.track('user_info', {
            device_type: device,
            language: navigator.language,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            online: navigator.onLine,
            cookies_enabled: navigator.cookieEnabled
        });
    }

    // Conversion tracking
    trackDownload(buttonType) {
        this.track('download_click', {
            button_type: buttonType,
            conversion_event: true
        });
    }

    trackSignup() {
        this.track('signup_attempt', {
            conversion_event: true
        });
    }

    trackPurchase(amount) {
        this.track('purchase', {
            amount: amount,
            conversion_event: true
        });
    }
}

// Initialize tracker
const tracker = new UserTracker();

// Global functions for easy tracking
window.trackDownload = (buttonType) => tracker.trackDownload(buttonType);
window.trackSignup = () => tracker.trackSignup();
window.trackPurchase = (amount) => tracker.trackPurchase(amount);
