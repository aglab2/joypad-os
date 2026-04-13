/** Device Info — header bar summary + full detail page */
export class DeviceInfoCard {
    constructor(headerEl, cardEl, protocol, log) {
        this.protocol = protocol;
        this.log = log;
        this.headerEl = headerEl;   // .header-info element
        this.cardEl = cardEl;       // #cardDeviceInfo container
    }

    render() {
        this.cardEl.innerHTML = `
            <div class="card">
                <h2>Device Information</h2>
                <div class="card-content">
                    <div class="device-info">
                        <div class="row"><span class="label">App</span><span class="value" id="deviceApp">-</span></div>
                        <div class="row"><span class="label">Version</span><span class="value" id="deviceVersion">-</span></div>
                        <div class="row"><span class="label">Board</span><span class="value" id="deviceBoard">-</span></div>
                        <div class="row"><span class="label">Serial</span><span class="value" id="deviceSerial">-</span></div>
                        <div class="row"><span class="label">Commit</span><span class="value" id="deviceCommit">-</span></div>
                        <div class="row"><span class="label">Build</span><span class="value" id="deviceBuild">-</span></div>
                    </div>
                </div>
            </div>`;
    }

    async load() {
        try {
            const info = await this.protocol.getInfo();

            // Header bar (compact)
            const headerApp = document.getElementById('headerApp');
            const headerBoard = document.getElementById('headerBoard');
            if (headerApp) headerApp.textContent = `${info.app || 'Joypad'} v${info.version || '?'}`;
            if (headerBoard) headerBoard.textContent = info.board || '-';
            const headerCommit = document.getElementById('headerCommit');
            if (headerCommit) {
                const hash = (info.commit || '-').substring(0, 7);
                headerCommit.textContent = hash;
                headerCommit.href = `https://github.com/joypad-ai/joypad-os/commit/${info.commit}`;
            }

            // Full detail card
            this.setText('deviceApp', info.app);
            this.setText('deviceVersion', info.version);
            this.setText('deviceBoard', info.board);
            this.setText('deviceSerial', info.serial);
            this.setText('deviceCommit', info.commit);
            this.setText('deviceBuild', info.build);

            this.log(`Device: ${info.app} v${info.version} (${info.board}, ${info.commit})`);
        } catch (e) {
            this.log(`Failed to get device info: ${e.message}`, 'error');
        }
    }

    setText(id, value) {
        const el = document.getElementById(id);
        if (el) el.textContent = value || '-';
    }
}
