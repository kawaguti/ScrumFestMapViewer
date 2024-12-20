class EventParser {
    static async loadEvents() {
        const timestamp = new Date().getTime();
        const response = await fetch(`all-events.md?t=${timestamp}`);
        let text = await response.text();

        // 改行コードを LF に統一
        text = text.replace(/\r\n/g, '\n');

        return {
            title: this.parseTitle(text),
            events: this.parseMarkdown(text)
        };
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

        // Skip the first section (metadata) and process the rest
        for (let i = 1; i < sections.length; i++) {
            const section = sections[i];
            const lines = section.split('\n');

            // Check if this is an event section (starts with ## )
            const titleLine = lines.find(line => line.trim().startsWith('## '));
            if (titleLine) {
                const event = this.parseEventSection(section);
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

        // 前の行が空行だったかどうかを追跡
        let previousLineWasEmpty = false;

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();

            // 空行の処理
            if (line === '') {
                previousLineWasEmpty = true;
                continue;
            }

            // リスト項目の開始を検出
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
                } else if (line.startsWith('- 概要:')) {
                    isProcessingSummary = true;
                    isProcessingDescription = false;
                    continue;
                } else if (line.startsWith('- 説明:')) {
                    isProcessingDescription = true;
                    isProcessingSummary = false;
                    continue;
                }
            } else if (line !== '') {
                // 概要またはステートメントの内容を処理
                if (isProcessingSummary) {
                    // 空行の後の新しい段落の場合は、改行を追加
                    if (previousLineWasEmpty && summaryLines.length > 0) {
                        summaryLines.push('');
                    }
                    // インデントを削除して追加（先頭の2スペースを削除）
                    summaryLines.push(line.replace(/^\s{2}/, ''));
                } else if (isProcessingDescription) {
                    // 空行の後の新しい段落の場合は、改行を追加
                    if (previousLineWasEmpty && descriptionLines.length > 0) {
                        descriptionLines.push('');
                    }
                    // インデントを削除して追加（先頭の2スペースを削除）
                    descriptionLines.push(line.replace(/^\s{2}/, ''));
                }
            }
            previousLineWasEmpty = false;
        }

        event.summary = summaryLines.join('\n').trim();
        event.description = descriptionLines.join('\n').trim();

        return event;
    }
}