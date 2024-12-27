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

    createMarkerIcon(count) {
        return L.divIcon({
            className: `marker-container`,
            html: `
                <div class="marker-pin-google">
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
        
        // 都道府県名をキーとして使用
        const locationKey = event.location;
        if (!this.eventGroups.has(locationKey)) {
            this.eventGroups.set(locationKey, {
                events: [],
                coordinates: event.coordinates // 最初のイベントの座標を代表値として使用
            });
        }
        this.eventGroups.get(locationKey).events.push(event);

        // 同じ都道府県のイベントが既にマーカーとして存在する場合はスキップ
        if (this.eventGroups.get(locationKey).events.length === 1) {
            const count = this.eventGroups.get(locationKey).events.length;
            const isFutureOrToday = this.isSameOrFutureDate(event.date);

            const icon = this.createMarkerIcon(count);
            const markerObj = L.marker(this.eventGroups.get(locationKey).coordinates, {
                icon: icon,
                isFuture: isFutureOrToday,
                event: event
            });
            
            // DOMエレメントが作成された後にdata属性を設定
            markerObj.on('add', function(e) {
                const element = e.target.getElement();
                if (element) {
                    element.setAttribute('data-future', isFutureOrToday);
                    // 初期色を設定
                    const color = isFutureOrToday ? '#0d6efd' : '#757575';
                    element.querySelector('.marker-head').style.backgroundColor = color;
                    element.querySelector('.marker-tail').style.backgroundColor = color;
                }
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

    updateMarkerCount(locationKey) {
        const markers = this.markers.getLayers();
        const groupData = this.eventGroups.get(locationKey);
        const marker = markers.find(m => 
            m.getLatLng().lat === groupData.coordinates[0] &&
            m.getLatLng().lng === groupData.coordinates[1]);
        if (marker) {
            const count = groupData.events.length;
            const isFutureOrToday = this.isSameOrFutureDate(groupData.events[0].date);
            marker.setIcon(this.createMarkerIcon(count, isFutureOrToday));
        }
    }

    showGroupedEvents(locationKey) {
        const groupData = this.eventGroups.get(locationKey);
        if (!groupData || groupData.events.length === 0) return;

        // すべてのマーカーを元の色に戻す
        this.markers.getLayers().forEach(marker => {
            const element = marker.getElement();
            if (element) {
                const isFuture = element.getAttribute('data-future') === 'true';
                const color = isFuture ? '#0d6efd' : '#757575';
                element.querySelector('.marker-head').style.backgroundColor = color;
                element.querySelector('.marker-tail').style.backgroundColor = color;
            }
        });

        // 選択されたマーカーをオレンジ色に変更
        const selectedMarker = this.markers.getLayers().find(m => 
            m.getLatLng().lat === parseFloat(coordKey.split(',')[0]) &&
            m.getLatLng().lng === parseFloat(coordKey.split(',')[1])
        );
        if (selectedMarker) {
            const element = selectedMarker.getElement();
            if (element) {
                element.querySelector('.marker-head').style.backgroundColor = '#FF9800';
                element.querySelector('.marker-tail').style.backgroundColor = '#FF9800';
            }
        }

        if (!window.eventDetailsMap) {
            window.eventDetailsMap = new Map();
        }

        let content = '<div class="list-group">';
        groupData.events.forEach((event, index) => {
            const eventId = `${locationKey}-${index}`;
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
        // URLを更新
        const url = new URL(window.location);
        url.searchParams.set('event', event.id);
        window.history.pushState({}, '', url);

        // マーカーの状態を更新
        this.markers.getLayers().forEach(marker => {
            if (marker.options.event && marker.options.event.id === event.id) {
                const element = marker.getElement();
                if (element) {
                    element.querySelector('.marker-head').style.backgroundColor = '#FF9800';
                    element.querySelector('.marker-tail').style.backgroundColor = '#FF9800';
                    marker.setZIndexOffset(1000);
                }
            } else {
                const element = marker.getElement();
                if (element) {
                    element.querySelector('.marker-head').style.backgroundColor = '';
                    element.querySelector('.marker-tail').style.backgroundColor = '';
                    marker.setZIndexOffset(0);
                }
            }
        });

        const content = document.getElementById('eventContent');
        let html = `
            <h4>${event.title}</h4>
            <p><strong>ID:</strong> ${event.id}</p>
            <p><strong>開催地:</strong> ${event.location}</p>
            <p><strong>開催日:</strong> ${event.date.toLocaleDateString('ja-JP')}</p>
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