class MapView {
    constructor() {
        this.map = L.map('map').setView([38.0, 137.0], 5);
        this.markers = L.layerGroup();
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.map);
        
        this.markers.addTo(this.map);
    }

    clearMarkers() {
        this.markers.clearLayers();
    }

    addMarker(event) {
        if (!Array.isArray(event.coordinates)) return;

        const marker = L.marker(event.coordinates)
            .bindPopup(event.title);

        marker.on('click', () => {
            this.showEventDetails(event);
        });

        this.markers.addLayer(marker);
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
