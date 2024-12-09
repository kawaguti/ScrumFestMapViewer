class ListView {
    constructor() {
        this.container = document.getElementById('listContainer');
        this.tbody = document.getElementById('eventList');
    }

    clearList() {
        this.tbody.innerHTML = '';
    }

    addEvent(event) {
        if (!event || !event.title) return;
        
        const row = document.createElement('tr');
        const dateStr = event.date ? event.date.toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            weekday: 'short'
        }) : '';
        
        row.innerHTML = `
            <td>${event.title}</td>
            <td>${event.location || ''}</td>
            <td>${dateStr}</td>
            <td>
                <button class="btn btn-sm btn-outline-info show-details">詳細</button>
            </td>
        `;

        row.querySelector('.show-details').addEventListener('click', () => {
            const content = document.getElementById('eventContent');
            let html = `
                <h4>${event.title}</h4>
                <p><strong>開催地:</strong> ${event.location || ''}</p>
                <p><strong>開催日:</strong> ${dateStr}</p>
            `;

            if (event.description) {
                html += `<p><strong>説明:</strong><br>${marked.parse(event.description)}</p>`;
            }

            if (event.website) {
                html += `<p><strong>Webサイト:</strong><br><a href="${event.website}" target="_blank">${event.website}</a></p>`;
            }

            content.innerHTML = html;
        });

        this.tbody.appendChild(row);
    }

    show() {
        this.container.classList.remove('d-none');
        document.getElementById('mapContainer').classList.add('d-none');
    }

    hide() {
        this.container.classList.add('d-none');
    }
}
