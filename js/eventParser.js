class EventParser {
    static async loadEvents() {
        const timestamp = new Date().getTime();
        const response = await fetch(`all-events.md?t=${timestamp}`);
        const text = await response.text();
        return this.parseMarkdown(text);
    }

    static parseMarkdown(markdown) {
        const events = [];
        const sections = markdown.split('---').filter(section => section.trim());
        
        for (const section of sections) {
            const event = this.parseEventSection(section);
            if (event.title && event.coordinates !== '未設定') {
                events.push(event);
            }
        }
        
        return events;
    }

    static parseEventSection(section) {
        const lines = section.trim().split('\n');
        const title = lines[0].replace('# ', '').trim();
        
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
                event.date = new Date(line.replace('- 開催日:', '').trim());
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
