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
        
        // 既存のイベントがある場合は追加しない
        if (!this.eventGroups.get(coordKey).some(e => e.id === event.id)) {
            this.eventGroups.get(coordKey).push(event);
        }

        if (this.eventGroups.get(coordKey).length === 1) {
            const count = this.eventGroups.get(coordKey).length;
            const icon = this.createMarkerIcon(count);
            const markerObj = L.marker(event.coordinates, {
                icon: icon,
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
                    if (!icon.classList.contains('selected-marker')) {
                        icon.style.removeProperty('filter');
                    }
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

        // ポップアップ表示前に全マーカーのスタイルをリセット
        this.markers.getLayers().forEach(marker => {
            if (marker._icon) {
                marker._icon.classList.remove('selected-marker');
                marker._icon.style.removeProperty('filter');
            }
        });

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

    showEventDetails(event, updateUrl = true) {
        // URLの更新（オプション）
        if (updateUrl) {
            const url = new URL(window.location);
            url.searchParams.set('event', event.id);
            window.history.pushState({}, '', url);
        }

        // 全マーカーのスタイルをリセット
        this.markers.getLayers().forEach(marker => {
            if (marker._icon) {
                marker._icon.classList.remove('selected-marker');
                marker._icon.style.removeProperty('filter');
            }
        });

        // 選択されたマーカーの状態を更新
        this.markers.getLayers().forEach(marker => {
            if (marker.options.event && marker.options.event.id === event.id) {
                marker._icon.classList.add('selected-marker');
                marker.setZIndexOffset(1000);
            } else {
                marker._icon.classList.remove('selected-marker');
                marker.setZIndexOffset(0);
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

    isSameOrFutureDate(date) {
        if (!date) return false;
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const eventDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        return eventDate >= today;
    }

    updateView() {
        // 既存のポップアップを完全にクリア
        this.map.closePopup();
        this.map._popup = null;
        if (window.eventDetailsMap) {
            window.eventDetailsMap.clear();
        }
        
        // タブ切り替え時はURLパラメータをクリア
        window.history.replaceState({}, '', '/');
        
        // イベント詳細をクリア
        document.getElementById('eventContent').innerHTML = 'イベントを選択してください';
        
        // 全マーカーのスタイルをリセット
        this.markers.getLayers().forEach(marker => {
            if (marker._icon) {
                marker._icon.classList.remove('selected-marker');
                marker._icon.style.removeProperty('filter');
                marker._icon.style.backgroundColor = '';
                marker.setZIndexOffset(0);
            }
        });

        const isFutureEvents = document.getElementById('viewYear').classList.contains('active');
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        // マーカーの表示を更新
        this.markers.getLayers().forEach(marker => {
            const event = marker.options.event;
            if (event && event.date) {
                const eventDate = new Date(event.date);
                const isEventVisible = isFutureEvents ? 
                    eventDate >= today : 
                    eventDate < today;
                
                if (isEventVisible) {
                    marker.getElement().style.display = '';
                } else {
                    marker.getElement().style.display = 'none';
                }
            }
        });
    }
}