class MapView {
    constructor() {
        this.map = L.map('map');
        this.markers = L.layerGroup();
        this.eventGroups = new Map(); // 座標ごとのイベントグループを管理
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.map);
        
        this.markers.addTo(this.map);

        // 日本全体が見えるデフォルト表示
        this.map.setView([37.0, 137.0], 5);
    }

    createMarkerIcon(count, isPastEvent) {
        const eventClass = isPastEvent ? 'past-event' : 'future-event';
        return L.divIcon({
            className: 'marker-container',
            html: `
                <div class="marker-pin-google ${eventClass}">
                    <div class="marker-head">${count > 1 ? count : ''}</div>
                    <div class="marker-tail"></div>
                </div>`,
            iconSize: [30, 42],
            iconAnchor: [15, 42],    // テールの底部が開催位置を指すように調整
            popupAnchor: [0, -35]    // サークルから吹き出しが表示されるように調整
        });
    }

    fitMapToMarkers() {
        const markers = this.markers.getLayers();
        if (markers.length > 0) {
            const group = L.featureGroup(markers);
            this.map.fitBounds(group.getBounds().pad(0.1)); // 10%のパディングを追加
        }
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
            const count = this.eventGroups.get(coordKey).length;
            const isPastEvent = new Date() > this.eventGroups.get(coordKey)[0].date;
            
            const markerObj = L.marker(event.coordinates, { 
                icon: this.createMarkerIcon(count, isPastEvent)
            }).on('click', () => {
                this.showGroupedEvents(coordKey);
                if (this.eventGroups.get(coordKey).length === 1) {
                    this.showEventDetails(this.eventGroups.get(coordKey)[0]);
                }
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
            const isPastEvent = new Date() > this.eventGroups.get(coordKey)[0].date;
            marker.setIcon(this.createMarkerIcon(count, isPastEvent));
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
                    <div class="mb-1">
                        <h6 class="mb-0">${event.title}</h6>
                        <div class="mt-1">
                            <small class="me-2">${event.date ? new Date(event.date).toLocaleDateString('ja-JP') : ''}</small>
                            <small>${event.location}</small>
                        </div>
                    </div>
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
            <p>${event.location}</p>
            <p>${event.date.toLocaleDateString('ja-JP')}</p>
            <div class="mt-2">
                ${event.website ? 
                    `<a href="${event.website}" target="_blank" class="btn btn-sm btn-outline-primary me-2">サイト</a>` : 
                    ''}
                ${event.recordingUrl ? 
                    `<a href="${event.recordingUrl}" target="_blank" class="btn btn-sm btn-outline-success">録画</a>` : 
                    ''}
            </div>
        `;

        if (event.description) {
            html += `<p class="mt-3">${marked.parse(event.description)}</p>`;
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
