/** Bluetooth Output Page — BLE mode, bonds, Wiimote */
export class BtOutputCard {
    constructor(container, protocol, log) {
        this.protocol = protocol;
        this.log = log;
        this.el = container;
        this.hasBle = false;
    }

    render() {
        this.el.innerHTML = `
            <div class="card" id="bleModeCard" style="display:none;">
                <h2>BLE Output Mode</h2>
                <div class="card-content">
                    <div class="row">
                        <span class="label">Current Mode</span>
                        <select id="bleModeSelect"><option value="">Loading...</option></select>
                    </div>
                    <p class="hint">Changing mode will reboot the device.</p>
                </div>
            </div>
            <div class="card" id="wiimoteCard" style="display:none;">
                <h2>Wiimote</h2>
                <div class="card-content">
                    <div class="row">
                        <span class="label">Orientation</span>
                        <select id="wiimoteOrientSelect">
                            <option value="0">Auto</option>
                            <option value="1">Horizontal</option>
                            <option value="2">Vertical</option>
                        </select>
                    </div>
                    <p class="hint">Controls D-pad mapping when using Wiimote alone (no extension).</p>
                </div>
            </div>
            <div class="card" id="btBondsCard" style="display:none;">
                <h2>Bluetooth Bonds</h2>
                <div class="card-content">
                    <p class="hint">Clear all saved Bluetooth pairings. Devices will need to re-pair.</p>
                    <div>
                        <button class="secondary" id="clearBtBtn">Clear All Bonds</button>
                    </div>
                </div>
            </div>`;

        this.el.querySelector('#bleModeSelect').addEventListener('change', (e) => this.setBleMode(e.target.value));
        this.el.querySelector('#wiimoteOrientSelect').addEventListener('change', (e) => this.setWiimoteOrient(e.target.value));
        this.el.querySelector('#clearBtBtn').addEventListener('click', () => this.clearBtBonds());
    }

    async load() {
        await this.loadBleModes();
        await this.loadWiimoteOrient();
    }

    async loadBleModes() {
        const card = this.el.querySelector('#bleModeCard');
        const bondsCard = this.el.querySelector('#btBondsCard');
        try {
            const result = await this.protocol.listBleModes();
            const select = this.el.querySelector('#bleModeSelect');
            select.innerHTML = '';
            for (const mode of result.modes) {
                const opt = document.createElement('option');
                opt.value = mode.id;
                opt.textContent = mode.name;
                opt.selected = mode.id === result.current;
                select.appendChild(opt);
            }
            card.style.display = '';
            bondsCard.style.display = '';
            this.hasBle = true;
            this.log(`Loaded ${result.modes.length} BLE modes, current: ${result.current}`);
        } catch (e) {
            // No BLE support — check if BT bonds still available (BT host without BLE output)
            card.style.display = 'none';
            try {
                await this.protocol.getBtStatus();
                bondsCard.style.display = '';
                this.hasBle = true;
            } catch (e2) {
                bondsCard.style.display = 'none';
            }
        }
    }

    async loadWiimoteOrient() {
        const card = this.el.querySelector('#wiimoteCard');
        try {
            const result = await this.protocol.getWiimoteOrient();
            this.el.querySelector('#wiimoteOrientSelect').value = result.mode;
            card.style.display = '';
            this.log(`Wiimote orientation: ${result.name}`);
        } catch (e) {
            card.style.display = 'none';
        }
    }

    async setBleMode(modeId) {
        try {
            this.log(`Setting BLE mode to ${modeId}...`);
            const result = await this.protocol.setBleMode(parseInt(modeId));
            this.log(`BLE mode set to ${result.name}`, 'success');
            if (result.reboot) this.log('Device will reboot...', 'warning');
        } catch (e) {
            this.log(`Failed to set BLE mode: ${e.message}`, 'error');
        }
    }

    async setWiimoteOrient(mode) {
        try {
            this.log(`Setting Wiimote orientation to ${mode}...`);
            const result = await this.protocol.setWiimoteOrient(parseInt(mode));
            this.log(`Wiimote orientation set to ${result.name}`, 'success');
        } catch (e) {
            this.log(`Failed to set Wiimote orientation: ${e.message}`, 'error');
        }
    }

    async clearBtBonds() {
        if (!confirm('Clear all Bluetooth bonds? Devices will need to re-pair.')) return;
        try {
            await this.protocol.clearBtBonds();
            this.log('Bluetooth bonds cleared', 'success');
        } catch (e) {
            this.log(`Failed to clear bonds: ${e.message}`, 'error');
        }
    }

    /** Returns true if any BT features are available */
    isAvailable() { return this.hasBle; }
}
