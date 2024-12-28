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
        const icon = new L.Icon.Default();
        icon.options.shadowSize = [41, 41];
        return icon;
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

        if (this.eventGroups.get(coordKey).length === 1) {
            const count = this.eventGroups.get(coordKey).length;
            const isFutureOrToday = this.isSameOrFutureDate(event.date);

            const icon = this.createMarkerIcon(count);
            const markerObj = L.marker(event.coordinates, {
                icon: icon,
                isFuture: isFutureOrToday,
                event: event
            });

            // マーカーのホバー動作を追加
            markerObj.on('mouseover', function(e) {
                const icon = e.target._icon;
                if (icon) {
                    icon.style.filter = 'hue-rotate(180deg) brightness(1.2)';
                }
            }).on('mouseout', function(e) {
                const icon = e.target._icon;
                if (icon) {
                    icon.style.filter = '';
                }
            }).on('click', (e) => {
                const latlng = e.latlng || e.target.getLatLng();
                this.showGroupedEvents(coordKey, latlng);
                if (this.eventGroups.get(coordKey).length === 1) {
                    this.showEventDetails(this.eventGroups.get(coordKey)[0]);
                }
            });

            this.markers.addLayer(markerObj);
        } else {
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

    showGroupedEvents(coordKey, latlng) {
        const events = this.eventGroups.get(coordKey);
        if (!events || events.length === 0) return;

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

        const popup = L.popup({
            closeButton: true,
            offset: L.point(0, -24),
            className: events.length > 1 ? 'multi-event-popup' : 'single-event-popup'
        })
            .setLatLng(latlng)
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