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
        const isFutureEvents = document.getElementById('viewYear').classList.contains('active');
        const now = new Date();
        let filteredEvents = this.events;

        // Filter events based on whether they are past or future
        filteredEvents = this.events.filter(event => {
            if (!event.date) return false;
            return isFutureEvents ? event.date >= now : event.date < now;
        });

        // Sort events by date
        // For future events: ascending order (closest future date first)
        // For past events: descending order (most recent past first)
        filteredEvents.sort((a, b) => {
            if (!a.date) return 1;
            if (!b.date) return -1;
            return isFutureEvents
                ? a.date.getTime() - b.date.getTime()  // ascending for future events
                : b.date.getTime() - a.date.getTime(); // descending for past events
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
        
        // 日付で昇順ソート（過去が先）で、現在日時に最も近い未来のイベントを選択
        futureEvents.sort((a, b) => {
            if (!a.date) return 1;
            if (!b.date) return -1;
            return a.date.getTime() - b.date.getTime();
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
