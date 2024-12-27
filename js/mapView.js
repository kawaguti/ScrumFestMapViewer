class MapView {
    constructor() {
        this.map = L.map('map');
        this.markers = L.layerGroup().addTo(this.map);
        this.eventGroups = new Map();

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(this.map);

        // 日本全体が見えるデフォルト表示
        this.map.setView([37.0, 137.0], 5);
    }

    isSameOrFutureDate(date) {
        const today = new Date();
        const eventDate = new Date(date);

        // 年月日のみを比較するため、時刻をリセット
        today.setHours(0, 0, 0, 0);
        eventDate.setHours(0, 0, 0, 0);

        // 当日または未来の日付の場合はtrue
        return eventDate >= today;
    }

    createMarkerIcon(count, isFutureOrToday) {
        // isFutureOrTodayがtrueの場合は青色（未来または当日のイベント）
        const eventClass = isFutureOrToday ? 'future-event' : 'past-event';
        return L.divIcon({
            className: 'marker-container',
            html: `
                <div class="marker-pin-google ${eventClass}">
                    <div class="marker-head">${count > 1 ? count : ''}</div>
                    <div class="marker-tail"></div>
                </div>`,
            iconSize: [30, 31],
            iconAnchor: [15, 31],
            popupAnchor: [0, -24]
        });
    }

    fitMapToMarkers() {
        const markers = this.markers.getLayers();
        if (markers.length > 0) {
            const group = L.featureGroup(markers);
            this.map.fitBounds(group.getBounds().pad(0.1));
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
            const isFutureOrToday = this.isSameOrFutureDate(event.date);

            const markerObj = L.marker(event.coordinates, {
                icon: this.createMarkerIcon(count, isFutureOrToday)
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
            const isFutureOrToday = this.isSameOrFutureDate(this.eventGroups.get(coordKey)[0].date);
            marker.setIcon(this.createMarkerIcon(count, isFutureOrToday));
        }
    }

    showGroupedEvents(coordKey) {
        const events = this.eventGroups.get(coordKey);
        if (!events || events.length === 0) return;

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

        const markerLatLng = L.latLng(events[0].coordinates);

        const popup = L.popup({
            closeButton: true,
            offset: L.point(0, -24),
            className: events.length > 1 ? 'multi-event-popup' : 'single-event-popup'
        })
            .setLatLng(markerLatLng)
            .setContent(content)
            .openOn(this.map);

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
        document.getElementById('eventHeader').classList.remove('d-none');
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

        if (event.summary && event.summary.trim()) {
            html += `<div class="mt-3">
                <h5>概要</h5>
                <div class="summary-content">${marked.parse(event.summary)}</div>
            </div>`;
        }

        if (event.description && event.description.trim()) {
            html += `<div class="mt-3">
                <h5>説明</h5>
                <div class="description-content">${marked.parse(event.description)}</div>
            </div>`;
        }

        content.innerHTML = html;

        if (event.coordinates && Array.isArray(event.coordinates)) {
            this.map.setView(event.coordinates, 6);
        }
    }

    selectEventMarker(event) {
        if (event.coordinates && Array.isArray(event.coordinates)) {
            this.map.setView(event.coordinates, 8);
            // マーカーを探して選択状態にする
            const markers = this.markers.getLayers();
            const marker = markers.find(m => 
                m.getLatLng().lat === event.coordinates[0] && 
                m.getLatLng().lng === event.coordinates[1]
            );
            if (marker) {
                marker.fire('click');
            }
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