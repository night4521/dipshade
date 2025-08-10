// Click Heatmap Tracking
class HeatmapTracker {
    constructor() {
        this.clicks = [];
        this.init();
    }

    init() {
        document.addEventListener('click', (e) => {
            this.recordClick(e);
        });
        
        // Send heatmap data every 60 seconds
        setInterval(() => {
            this.sendHeatmapData();
        }, 60000);
    }

    recordClick(event) {
        const click = {
            x: event.clientX,
            y: event.clientY,
            pageX: event.pageX,
            pageY: event.pageY,
            timestamp: Date.now(),
            element: event.target.tagName,
            className: event.target.className,
            id: event.target.id,
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            },
            scroll: {
                x: window.scrollX,
                y: window.scrollY
            }
        };
        
        this.clicks.push(click);
        
        // Limit stored clicks to prevent memory issues
        if (this.clicks.length > 100) {
            this.clicks = this.clicks.slice(-50);
        }
    }

    async sendHeatmapData() {
        if (this.clicks.length === 0) return;
        
        try {
            await fetch('https://dipshade-ks73.onrender.com/heatmap', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    clicks: this.clicks,
                    page_url: window.location.href,
                    user_id: localStorage.getItem('dipshade_user_id'),
                    timestamp: new Date().toISOString()
                })
            });
            
            // Clear sent clicks
            this.clicks = [];
        } catch (error) {
            console.error('Heatmap tracking failed:', error);
        }
    }
}

// Initialize heatmap tracker
new HeatmapTracker();
