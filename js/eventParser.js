class EventParser {
    static async loadEvents() {
        const timestamp = new Date().getTime();
        const response = await fetch(`all-events.md?t=${timestamp}`);
        let text = await response.text();

        // デバッグ用：マークダウンの内容を確認
        console.log('Loaded markdown:', text);

        // 改行コードを LF に統一
        text = text.replace(/\r\n/g, '\n');

        const result = {
            title: this.parseTitle(text),
            events: this.parseMarkdown(text)
        };

        // デバッグ用：パース結果を確認
        console.log('Parsed events:', result);

        return result;
    }

    static parseTitle(markdown) {
        // Split the markdown into sections and get the first section
        const sections = markdown.split('---').map(section => section.trim()).filter(Boolean);

        if (sections.length === 0) {
            return 'イベント一覧';
        }

        // Get the first section and look for the title
        const firstSection = sections[0];
        const lines = firstSection.split('\n');
        const titleLine = lines.find(line => line.startsWith('# '));

        return titleLine ? titleLine.replace('# ', '').trim() : 'イベント一覧';
    }

    static parseMarkdown(markdown) {
        const events = [];

        // Split by horizontal rule and filter out empty sections
        const sections = markdown.split('---').map(section => section.trim()).filter(Boolean);

        // デバッグ用：セクション数を確認
        console.log('Number of sections:', sections.length);

        // Skip the first section (metadata) and process the rest
        for (let i = 1; i < sections.length; i++) {
            const section = sections[i];
            const lines = section.split('\n');

            // Check if this is an event section (starts with ## )
            const titleLine = lines.find(line => line.trim().startsWith('## '));
            if (titleLine) {
                const event = this.parseEventSection(section);
                // デバッグ用：各イベントのパース結果を確認
                console.log('Parsed event:', event);
                if (event && event.title && event.coordinates && event.location && event.date) {
                    events.push(event);
                }
            }
        }

        return events;
    }

    static parseEventSection(section) {
        const lines = section.trim().split('\n');
        let title = '';

        // デバッグ用：セクションの内容を確認
        console.log('Parsing section:', section);

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
            summary: '',
            description: '',
            website: '',
            recordingUrl: ''
        };

        let isProcessingSummary = false;
        let isProcessingDescription = false;
        let summaryLines = [];
        let descriptionLines = [];
        let previousLineWasEmpty = false;

        // デバッグ用：各行の処理を確認
        console.log('Processing lines for event:', title);

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            console.log('Processing line:', line, 
                       'isProcessingSummary:', isProcessingSummary, 
                       'isProcessingDescription:', isProcessingDescription);

            if (line === '') {
                previousLineWasEmpty = true;
                continue;
            }

            if (line.startsWith('- ')) {
                isProcessingSummary = false;
                isProcessingDescription = false;

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
                } else if (line.startsWith('- 録画一覧:')) {
                    event.recordingUrl = line.replace('- 録画一覧:', '').trim();
                } else if (line === '- 概要:') {
                    isProcessingSummary = true;
                    isProcessingDescription = false;
                } else if (line === '- 説明:') {
                    isProcessingDescription = true;
                    isProcessingSummary = false;
                }
            } else if (line !== '') {
                // インデントされたテキストの処理（概要または説明）
                const textContent = line.replace(/^\s{2}/, ''); // 先頭の2スペースを削除

                if (isProcessingSummary && !line.startsWith('- ')) {
                    if (previousLineWasEmpty && summaryLines.length > 0) {
                        summaryLines.push('');
                    }
                    summaryLines.push(textContent);
                } else if (isProcessingDescription && !line.startsWith('- ')) {
                    if (previousLineWasEmpty && descriptionLines.length > 0) {
                        descriptionLines.push('');
                    }
                    descriptionLines.push(textContent);
                }
            }
            previousLineWasEmpty = false;
        }

        event.summary = summaryLines.join('\n').trim();
        event.description = descriptionLines.join('\n').trim();

        // デバッグ用：最終的なイベントオブジェクトを確認
        console.log('Final event object:', event);

        return event;
    }
}