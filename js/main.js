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
            
            // URLクエリパラメータからイベントIDを取得
            const urlParams = new URLSearchParams(window.location.search);
            const eventId = urlParams.get('event');
            if (eventId) {
                const event = this.events.find(e => e.id === (isNaN(eventId) ? eventId : String(eventId)));
                if (event) {
                    // イベントの日付が過去の場合は「これまで」タブを選択
                    const now = new Date();
                    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                    const eventDate = new Date(event.date.getFullYear(), event.date.getMonth(), event.date.getDate());
                    if (eventDate < today) {
                        document.getElementById('viewYear').classList.remove('active');
                        document.getElementById('viewAll').classList.add('active');
                    } else {
                        document.getElementById('viewAll').classList.remove('active');
                        document.getElementById('viewYear').classList.add('active');
                    }
                    this.updateView();
                    // マーカーが配置されるのを待ってから表示位置を調整
                    setTimeout(() => {
                        this.mapView.showEventDetails(event);
                        if (event.coordinates && Array.isArray(event.coordinates)) {
                            this.mapView.map.setView(event.coordinates, 6);
                        }
                    }, 300);
                    return;
                }
            }
            
            // イベントIDがない場合は直近の未来イベントを表示
            this.selectUpcomingEvent();
        } catch (error) {
            console.error('イベントの読み込みに失敗しました:', error);
        }
    }

    setupEventListeners() {
        document.getElementById('viewAll').addEventListener('click', (e) => {
            if (!e.target.classList.contains('active')) {
                document.getElementById('viewYear').classList.remove('active');
                e.target.classList.add('active');
                // URLパラメータをクリアして基本パスに戻す
                window.history.pushState({}, '', window.location.pathname);
                this.updateView();
            }
        });

        document.getElementById('viewYear').addEventListener('click', (e) => {
            if (!e.target.classList.contains('active')) {
                document.getElementById('viewAll').classList.remove('active');
                e.target.classList.add('active');
                // URLパラメータをクリアして基本パスに戻す
                window.history.pushState({}, '', window.location.pathname);
                this.updateView();
            }
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

    isSameOrFutureDate(date1, date2) {
        return date1.getTime() >= date2.getTime();
    }

    updateView() {
        const isFutureEvents = document.getElementById('viewYear').classList.contains('active');
        const now = new Date();
        let filteredEvents = this.events;

        // Filter events based on whether they are past or future
        filteredEvents = this.events.filter(event => {
            if (!event.date) return false;
            // 当日は「これから」に分類されるように、日付の開始時刻で比較
            const eventDate = new Date(event.date.getFullYear(), event.date.getMonth(), event.date.getDate());
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            return isFutureEvents ? this.isSameOrFutureDate(eventDate, today) : !this.isSameOrFutureDate(eventDate, today);
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
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        // 未来のイベントを選択して表示
        const nextEvent = this.events
            .filter(event => {
                if (!event.date) return false;
                const eventDate = new Date(event.date.getFullYear(), event.date.getMonth(), event.date.getDate());
                return eventDate >= today;
            })
            .sort((a, b) => a.date.getTime() - b.date.getTime())[0];

        if (nextEvent) {
            this.mapView.showEventDetails(nextEvent, false);
        }
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new EventApp();
});
