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
            this.events = await EventParser.loadEvents();
            this.updateView();
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
        this.listView.clearList();
        filteredEvents.forEach(event => this.listView.addEvent(event));
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new EventApp();
});
