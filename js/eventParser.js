class EventParser {
    static async loadEvents() {
        const timestamp = new Date().getTime();
        const response = await fetch(`all-events.md?t=${timestamp}`);
        let text = await response.text();
        
        let debugInfo = [];
        debugInfo.push('=== Start Processing ===');
        
        // 改行コードを LF に統一
        text = text.replace(/\r\n/g, '\n');
        debugInfo.push('1. Normalized line endings');
        
        const result = {
            title: this.parseTitle(text, debugInfo),
            events: this.parseMarkdown(text, debugInfo)
        };
        
        // デバッグ情報をポップアップ表示
        alert(debugInfo.join('\n'));
        
        return result;
    }

    static parseTitle(markdown, debugInfo) {
        // Split the markdown into sections and get the first section
        const sections = markdown.split('---').map(section => section.trim()).filter(Boolean);
        debugInfo.push(`2. Split into sections: ${sections.length} sections found`);
        
        if (sections.length === 0) {
            debugInfo.push('No sections found, using default title');
            return 'イベント一覧';
        }
        
        // Get the first section and look for the title
        const firstSection = sections[0];
        const lines = firstSection.split('\n');
        const titleLine = lines.find(line => line.startsWith('# '));
        
        debugInfo.push(`3. Found title: ${titleLine ? titleLine : 'No title found'}`);
        return titleLine ? titleLine.replace('# ', '').trim() : 'イベント一覧';
    }

    static parseMarkdown(markdown, debugInfo) {
        const events = [];
        
        // Split by horizontal rule and filter out empty sections
        const sections = markdown.split('---').map(section => section.trim()).filter(Boolean);
        
        debugInfo.push(`4. Total sections found: ${sections.length}`);
        
        // Skip the first section (metadata) and process the rest
        for (let i = 1; i < sections.length; i++) {
            const section = sections[i];
            const lines = section.split('\n');
            
            // Check if this is an event section (starts with ## )
            const titleLine = lines.find(line => line.trim().startsWith('## '));
            if (titleLine) {
                debugInfo.push(`5. Processing event section: ${titleLine.trim()}`);
                const event = this.parseEventSection(section);
                if (event && event.title && event.coordinates && event.location && event.date) {
                    events.push(event);
                    debugInfo.push(`   - Added event: ${event.title}`);
                } else {
                    debugInfo.push(`   - Skipped event due to missing required fields: ${event ? event.title : 'Unknown'}`);
                }
            } else {
                debugInfo.push(`5. Skipping non-event section: ${section.substring(0, 50)}...`);
            }
        }
        
        debugInfo.push(`6. Total events parsed: ${events.length}`);
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
