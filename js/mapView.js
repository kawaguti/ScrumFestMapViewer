class MapView {
    constructor() {
        this.map = L.map('map').setView([35.0, 137.0], 4);
        this.markers = L.layerGroup();
        this.eventGroups = new Map(); // 座標ごとのイベントグループを管理
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.map);
        
        this.markers.addTo(this.map);
    }

    clearMarkers() {
        this.markers.clearLayers();
        this.eventGroups.clear();
    }

    addMarker(event) {
        if (!Array.isArray(event.coordinates)) return;

        const coordKey = event.coordinates.join(',');
        if (!this.eventGroups.has(coordKey)) {
            this.eventGroups.set(coordKey, []);
        }
        this.eventGroups.get(coordKey).push(event);

        // 同じ座標のイベントが既にマーカーとして存在する場合はスキップ
        if (this.eventGroups.get(coordKey).length === 1) {
            const marker = L.divIcon({
                className: 'event-marker',
                html: `<div style="width: 20px; height: 20px; line-height: 20px;">${this.eventGroups.get(coordKey).length}</div>`,
                iconSize: [20, 20]
            });

            const markerObj = L.marker(event.coordinates, { icon: marker })
                .on('click', () => {
                    this.showGroupedEvents(coordKey);
                });

            this.markers.addLayer(markerObj);
        } else {
            // マーカーの数字を更新
            this.updateMarkerCount(coordKey);
        }
    }

    updateMarkerCount(coordKey) {
        const markers = this.markers.getLayers();
        const marker = markers.find(m => m.getLatLng().lat === parseFloat(coordKey.split(',')[0]) && 
                                       m.getLatLng().lng === parseFloat(coordKey.split(',')[1]));
        if (marker) {
            const count = this.eventGroups.get(coordKey).length;
            marker.setIcon(L.divIcon({
                className: 'event-marker',
                html: `<div style="width: 20px; height: 20px; line-height: 20px;">${count}</div>`,
                iconSize: [20, 20]
            }));
        }
    }

    showGroupedEvents(coordKey) {
        const events = this.eventGroups.get(coordKey);
        if (!events || events.length === 0) return;

        // イベントデータをグローバルに保存
        if (!window.eventDetailsMap) {
            window.eventDetailsMap = new Map();
        }

        let content = '<div class="list-group">';
        events.forEach((event, index) => {
            const eventId = `${coordKey}-${index}`;
            window.eventDetailsMap.set(eventId, event);
            
            content += `
                <a href="javascript:void(0)" class="list-group-item list-group-item-action" data-event-id="${eventId}">
                    <div class="d-flex w-100 justify-content-between">
                        <h6 class="mb-1">${event.title}</h6>
                        <small>${event.date ? new Date(event.date).toLocaleDateString('ja-JP') : ''}</small>
                    </div>
                    <small>${event.location}</small>
                </a>`;
        });
        content += '</div>';

        const popup = L.popup()
            .setLatLng(events[0].coordinates)
            .setContent(content)
            .openOn(this.map);

        // ポップアップが開いた後にイベントリスナーを追加
        setTimeout(() => {
            const links = document.querySelectorAll('.leaflet-popup-content .list-group-item');
            links.forEach(link => {
                link.addEventListener('click', (e) => {
                    const eventId = e.currentTarget.dataset.eventId;
                    const event = window.eventDetailsMap.get(eventId);
                    if (event) {
                        this.showEventDetails(event);
                    }
                });
            });
        }, 0);
    }

    showEventDetails(event) {
        const content = document.getElementById('eventContent');
        let html = `
            <h4>${event.title}</h4>
            <p><strong>開催地:</strong> ${event.location}</p>
            <p><strong>開催日:</strong> ${event.date.toLocaleDateString('ja-JP')}</p>
        `;

        if (event.description) {
            html += `<p><strong>説明:</strong><br>${marked.parse(event.description)}</p>`;
        }

        if (event.website) {
            html += `<p><strong>Webサイト:</strong><br><a href="${event.website}" target="_blank">${event.website}</a></p>`;
        }

        content.innerHTML = html;

        // 選択されたイベントの位置に地図を移動
        if (event.coordinates && Array.isArray(event.coordinates)) {
            this.map.setView(event.coordinates, 6);
        }
    }

    show() {
        document.getElementById('mapView').classList.remove('d-none');
        document.getElementById('listView').classList.add('d-none');
        this.map.invalidateSize();
    }

    hide() {
        document.getElementById('mapView').classList.add('d-none');
    }
}
