/** Bluetooth Host (Input) — Wiimote orientation + BT bonds */
export class BtHostCard {
    constructor(container, protocol, log) {
        this.protocol = protocol;
        this.log = log;
        this.el = container;
        this.visible = false;
    }

    render() {
        this.el.innerHTML = `
            <div class="card" id="btHostCard" style="display:none;">
                <h2>Bluetooth Host</h2>
                <div class="card-content">
                    <div class="row">
                        <span class="label">Wiimote Orientation</span>
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

        this.el.querySelector('#wiimoteOrientSelect').addEventListener('change', (e) => this.setWiimoteOrient(e.target.value));
        this.el.querySelector('#clearBtBtn').addEventListener('click', () => this.clearBtBonds());
    }

    async load() {
        await this.loadWiimoteOrient();
        await this.loadBtStatus();
    }

    async loadWiimoteOrient() {
        const card = this.el.querySelector('#btHostCard');
        try {
            const result = await this.protocol.getWiimoteOrient();
            this.el.querySelector('#wiimoteOrientSelect').value = result.mode;
            card.style.display = '';
            this.visible = true;
            this.log(`Wiimote orientation: ${result.name}`);
        } catch (e) {
            card.style.display = 'none';
        }
    }

    async loadBtStatus() {
        const card = this.el.querySelector('#btBondsCard');
        try {
            await this.protocol.getBtStatus();
            card.style.display = '';
            this.visible = true;
        } catch (e) {
            card.style.display = 'none';
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

    isAvailable() { return this.visible; }
}
