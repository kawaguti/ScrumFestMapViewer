class EventApp {
    constructor() {
        this.mapView = new MapView();
        this.listView = new ListView();
        this.events = [];
        
        this.initializeViewControls();
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

    initializeViewControls() {
        // 期間切り替え
        document.getElementById('viewAll').addEventListener('click', () => {
            document.getElementById('viewAll').classList.add('active');
            document.getElementById('viewYear').classList.remove('active');
            this.updateView();
        });

        document.getElementById('viewYear').addEventListener('click', () => {
            document.getElementById('viewYear').classList.add('active');
            document.getElementById('viewAll').classList.remove('active');
            this.updateView();
        });

        // 表示方法切り替え
        document.getElementById('viewMap').addEventListener('click', () => {
            document.getElementById('viewMap').classList.add('active');
            document.getElementById('viewList').classList.remove('active');
            this.mapView.show();
        });

        document.getElementById('viewList').addEventListener('click', () => {
            document.getElementById('viewList').classList.add('active');
            document.getElementById('viewMap').classList.remove('active');
            this.updateView();
            this.listView.show();
        });
    }

    updateView() {
        const showYearOnly = document.getElementById('viewYear').classList.contains('active');
        const now = new Date();
        const oneYearLater = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());

        const filteredEvents = this.events.filter(event => {
            if (!event.date) return false;
            
            if (showYearOnly) {
                const eventDate = new Date(event.date);
                return eventDate >= now && eventDate <= oneYearLater;
            }
            return true;
        });

        // Sort events by date
        filteredEvents.sort((a, b) => {
            if (!a.date) return 1;
            if (!b.date) return -1;
            return a.date.getTime() - b.date.getTime();
        });

        // Update map
        this.mapView.clearMarkers();
        filteredEvents.forEach(event => this.mapView.addMarker(event));

        // Update list
    selectUpcomingEvent() {
        const now = new Date();
        
        // 未来のイベントをフィルタリング
        const futureEvents = this.events.filter(event => {
            if (!event.date) return false;
            return event.date >= now;
        });
        
        // 日付で昇順ソート
        futureEvents.sort((a, b) => {
            if (!a.date) return 1;
            if (!b.date) return -1;
            return a.date.getTime() - b.date.getTime();
        });
        
        // 最も近い未来のイベントを選択
        if (futureEvents.length > 0) {
            const nextEvent = futureEvents[0];
            // 地図表示の場合
            if (!document.getElementById('listView').classList.contains('active')) {
                this.mapView.showEventDetails(nextEvent);
            }
        }
    }

        this.listView.clearList();
        filteredEvents.forEach(event => this.listView.addEvent(event));
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new EventApp();
});
