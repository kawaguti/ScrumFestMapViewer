class ListView {
    constructor() {
        this.container = document.getElementById('listContainer');
        this.tbody = document.getElementById('eventList');
    }

    clearList() {
        this.tbody.innerHTML = '';
    }

    addEvent(event) {
        if (!event || !event.title || !event.location || !event.date) return;
        
        const row = document.createElement('tr');
        const dateStr = event.date.toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            weekday: 'short'
        });
        
        row.innerHTML = `
            <td>${event.title}</td>
            <td>${event.location || ''}</td>
            <td>${dateStr}</td>
            <td>
                ${event.website ? 
                    `<a href="${event.website}" target="_blank" class="btn btn-sm btn-outline-primary">サイト</a>` : 
                    ''}
            </td>
            <td>
                ${event.recordingUrl ? 
                    `<a href="${event.recordingUrl}" target="_blank" class="btn btn-sm btn-outline-success">録画</a>` : 
                    ''}
            </td>
            <td>
                <button class="btn btn-sm btn-outline-info show-details">詳細</button>
            </td>
        `;

        row.querySelector('.show-details').addEventListener('click', () => {
            const content = document.getElementById('listEventContent');
            const modalTitle = document.getElementById('eventDetailModalLabel');
            modalTitle.textContent = event.title;
            
            let html = `
                <p><strong>開催地:</strong> ${event.location || ''}</p>
                <p><strong>開催日:</strong> ${dateStr}</p>
            `;

            if (event.description) {
                html += `<p><strong>説明:</strong><br>${marked.parse(event.description)}</p>`;
            }

            if (event.website) {
                html += `<p><strong>Webサイト:</strong><br><a href="${event.website}" target="_blank">${event.website}</a></p>`;
            }

            if (event.recordingUrl) {
                html += `<p><strong>録画一覧:</strong><br><a href="${event.recordingUrl}" target="_blank">${event.recordingUrl}</a></p>`;
            }

            content.innerHTML = html;
            
            const modal = new bootstrap.Modal(document.getElementById('eventDetailModal'));
            modal.show();
        });

        this.tbody.appendChild(row);
    }

    show() {
        document.getElementById('mapView').classList.add('d-none');
        document.getElementById('listView').classList.remove('d-none');
    }

    hide() {
        document.getElementById('listView').classList.add('d-none');
        document.getElementById('mapView').classList.remove('d-none');
    }
}
