class EventApp {
    constructor() {
        this.events = [];
        this.mapView = new MapView();
        this.listView = new ListView();
        
        this.setupEventListeners();
        this.loadEvents();
    }

    async loadEvents() {
        try {
            const data = await EventParser.loadEvents();
            this.events = data.events;
            document.querySelector('.navbar-brand').textContent = data.title;
            document.title = data.title;
            this.updateView();
            
            // 直近の未来イベントを自動選択
            this.selectUpcomingEvent();
        } catch (error) {
            console.error('イベントの読み込みに失敗しました:', error);
        }
    }

    setupEventListeners() {
        document.getElementById('viewAll').addEventListener('click', (e) => {
            document.getElementById('viewYear').classList.remove('active');
            e.target.classList.add('active');
            this.updateView();
        });

        document.getElementById('viewYear').addEventListener('click', (e) => {
            document.getElementById('viewAll').classList.remove('active');
            e.target.classList.add('active');
            this.updateView();
        });

        document.getElementById('viewMap').addEventListener('click', (e) => {
            document.getElementById('viewList').classList.remove('active');
            e.target.classList.add('active');
            this.mapView.show();
            this.listView.hide();
        });

        document.getElementById('viewList').addEventListener('click', (e) => {
            document.getElementById('viewMap').classList.remove('active');
            e.target.classList.add('active');
            this.listView.show();
            this.mapView.hide();
        });
    }

    updateView() {
        const showYearOnly = document.getElementById('viewYear').classList.contains('active');
        let filteredEvents = this.events;

        if (showYearOnly) {
            const now = new Date();
            const oneYearLater = new Date();
            oneYearLater.setFullYear(now.getFullYear() + 1);

            filteredEvents = this.events.filter(event => {
                if (!event.date) return false;
                return event.date >= now && event.date <= oneYearLater;
            });
        }

        // Sort events by date
        // For one year view: ascending order (past first)
        // For all events view: descending order (future first)
        filteredEvents.sort((a, b) => {
            if (!a.date) return 1;
            if (!b.date) return -1;
            return showYearOnly
                ? a.date.getTime() - b.date.getTime()  // ascending for one year view
                : b.date.getTime() - a.date.getTime(); // descending for all events
        });

        // Update map
        this.mapView.clearMarkers();
        filteredEvents.forEach(event => this.mapView.addMarker(event));
        this.mapView.fitMapToMarkers(); // 全マーカーが見えるように地図を調整

        // Update list
        this.listView.clearList();
        filteredEvents.forEach(event => this.listView.addEvent(event));
    }

    selectUpcomingEvent() {
        const now = new Date();
        
        // 未来のイベントをフィルタリング
        const futureEvents = this.events.filter(event => {
            if (!event.date) return false;
            return event.date >= now;
        });
        
        // 日付で降順ソート（未来が先）
        futureEvents.sort((a, b) => {
            if (!a.date) return 1;
            if (!b.date) return -1;
            return b.date.getTime() - a.date.getTime();
        });
        
        // 最も近い未来のイベントを選択
        if (futureEvents.length > 0) {
            const nextEvent = futureEvents[0];
            this.mapView.showEventDetails(nextEvent);
        }
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new EventApp();
});
