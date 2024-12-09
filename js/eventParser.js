class EventParser {
    static async loadEvents() {
        const timestamp = new Date().getTime();
        const response = await fetch(`all-events.md?t=${timestamp}`);
        const text = await response.text();
        return {
            title: this.parseTitle(text),
            events: this.parseMarkdown(text)
        };
    }

    static parseTitle(markdown) {
        const lines = markdown.split('\n');
        const titleLine = lines.find(line => line.startsWith('# '));
        return titleLine ? titleLine.replace('# ', '').trim() : 'イベント一覧';
    }

    static parseMarkdown(markdown) {
        const events = [];
        
        // Find the first event section using regex to handle both LF and CRLF
        const firstEventMatch = markdown.match(/\r?\n## /);
        if (!firstEventMatch) {
            return events; // No events found
        }
        
        // Remove everything before the first event
        const eventsContent = markdown.substring(firstEventMatch.index);
        
        // Split by horizontal rule and filter out empty sections
        const sections = eventsContent.split('---').map(section => section.trim()).filter(Boolean);
        
        for (const section of sections) {
            const event = this.parseEventSection(section);
            if (event && event.title && event.coordinates) {
                events.push(event);
            }
        }
        
        return events;
    }

    static parseEventSection(section) {
        const lines = section.trim().split('\n');
        let title = '';
        
        // Find the event title (line starting with '## ')
        const titleLine = lines.find(line => line.startsWith('## '));
        if (!titleLine) {
            return null; // Skip sections without a proper title
        }
        
        title = titleLine.replace('## ', '').trim();
        if (!title) {
            return null; // Skip if title is empty after trimming
        }
        
        const event = {
            title: title,
            location: '',
            coordinates: '',
            date: '',
            description: '',
            website: ''
        };

        let descriptionLines = [];
        
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line.startsWith('- 開催地:')) {
                event.location = line.replace('- 開催地:', '').trim();
            } else if (line.startsWith('- 座標:')) {
                const coordStr = line.match(/\[(.*?)\]/);
                if (coordStr) {
                    const [lng, lat] = coordStr[1].split(',').map(n => parseFloat(n.trim()));
                    event.coordinates = [lat, lng];
                }
            } else if (line.startsWith('- 開催日:')) {
                const dateStr = line.replace('- 開催日:', '').trim();
                const match = dateStr.match(/(\d{4})年(\d{2})月(\d{2})日/);
                if (match) {
                    const [_, year, month, day] = match;
                    event.date = new Date(year, month - 1, day);
                }
            } else if (line.startsWith('- Webサイト:')) {
                event.website = line.replace('- Webサイト:', '').trim();
            } else if (line.startsWith('- 説明:')) {
                i++;
                while (i < lines.length && !lines[i].trim().startsWith('-')) {
                    if (lines[i].trim()) {
                        descriptionLines.push(lines[i].trim());
                    }
                    i++;
                }
                i--;
            }
        }

        event.description = descriptionLines.join('\n');
        return event;
    }
}
