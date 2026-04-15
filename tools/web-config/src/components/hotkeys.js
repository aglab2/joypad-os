/** Hotkeys Page — Button combo remapping */
import { BUTTON_NAMES, BUTTON_LABELS } from './profiles.js';

export class HotkeysCard {
    constructor(container, protocol, log) {
        this.protocol = protocol;
        this.log = log;
        this.el = container;
        this.visible = false;
        this.currentConfig = null;
    }

    render() {
        const comboRows = [0, 1, 2, 3].map(i => `
            <div class="combo-row" id="comboRow${i}" style="margin-bottom: 12px;">
                <div class="pad-form-row" style="margin-bottom: 4px;">
                    <span class="label">Combo ${i + 1}</span>
                </div>
                <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
                    <div style="flex: 1; min-width: 120px;">
                        <div class="hint" style="margin-bottom: 4px;">Input (hold together)</div>
                        <div class="combo-buttons" id="comboIn${i}">
                            ${this.buildCheckboxes(`ci${i}`, true)}
                        </div>
                    </div>
                    <span style="color: var(--text-muted); font-size: 18px;">→</span>
                    <div style="flex: 1; min-width: 120px;">
                        <div class="hint" style="margin-bottom: 4px;">Output</div>
                        <div class="combo-buttons" id="comboOut${i}">
                            ${this.buildCheckboxes(`co${i}`, false)}
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

        this.el.innerHTML = `
            <div class="card" id="hotkeysCard" style="display:none;">
                <h2>Hotkeys</h2>
                <div class="card-content">
                    <p class="hint">Map button combos to different buttons. When all input buttons are held, they are replaced with the output buttons.</p>
                    ${comboRows}
                    <div class="buttons" style="margin-top: 12px;">
                        <button id="hotkeysSaveBtn">Save &amp; Reboot</button>
                    </div>
                    <p class="hint" style="margin-top: 8px;">Device will reboot to apply changes.</p>
                </div>
            </div>`;

        this.el.querySelector('#hotkeysSaveBtn').addEventListener('click', () => this.save());
    }

    buildCheckboxes(prefix, isInput) {
        // For input: show common combo buttons (S1, S2, L1, R1, etc.)
        // For output: show all buttons
        const buttons = BUTTON_NAMES;

        return buttons.map((name, idx) => {
            const bitIdx = BUTTON_NAMES.indexOf(name);
            const label = BUTTON_LABELS[name] || name;
            return `<label class="combo-btn" title="${label}">
                <input type="checkbox" data-bit="${bitIdx}" id="${prefix}_${bitIdx}">
                <span>${name}</span>
            </label>`;
        }).join('');
    }

    maskToChecks(prefix, mask) {
        for (let i = 0; i < 22; i++) {
            const cb = this.el.querySelector(`#${prefix}_${i}`);
            if (cb) cb.checked = (mask & (1 << i)) !== 0;
        }
    }

    checksToMask(prefix) {
        let mask = 0;
        for (let i = 0; i < 22; i++) {
            const cb = this.el.querySelector(`#${prefix}_${i}`);
            if (cb && cb.checked) mask |= (1 << i);
        }
        return mask;
    }

    async load() {
        const card = this.el.querySelector('#hotkeysCard');
        try {
            const config = await this.protocol.getPadConfig();
            if (!config.ok) {
                card.style.display = 'none';
                this.visible = false;
                return;
            }
            card.style.display = '';
            this.visible = true;
            this.currentConfig = config;

            const combos = config.combos || [];
            for (let i = 0; i < 4; i++) {
                const combo = combos[i] || [0, 0];
                this.maskToChecks(`ci${i}`, combo[0]);
                this.maskToChecks(`co${i}`, combo[1]);
            }
        } catch (e) {
            card.style.display = 'none';
            this.visible = false;
        }
    }

    async save() {
        if (!confirm('Save hotkey configuration? The device will reboot.')) return;
        if (!this.currentConfig) return;

        const config = {
            name: this.currentConfig.name || 'Custom',
            active_high: this.currentConfig.active_high || false,
            i2c_sda: this.currentConfig.i2c_sda !== undefined ? this.currentConfig.i2c_sda : -1,
            i2c_scl: this.currentConfig.i2c_scl !== undefined ? this.currentConfig.i2c_scl : -1,
            deadzone: this.currentConfig.deadzone || 10,
            buttons: this.currentConfig.buttons || [],
            adc: this.currentConfig.adc || [-1, -1, -1, -1, -1, -1],
            invert_lx: this.currentConfig.invert_lx || false,
            invert_ly: this.currentConfig.invert_ly || false,
            invert_rx: this.currentConfig.invert_rx || false,
            invert_ry: this.currentConfig.invert_ry || false,
            sinput_rgb: this.currentConfig.sinput_rgb || false,
            led_pin: this.currentConfig.led_pin !== undefined ? this.currentConfig.led_pin : -1,
            led_count: this.currentConfig.led_count || 0,
            speaker_pin: this.currentConfig.speaker_pin !== undefined ? this.currentConfig.speaker_pin : -1,
            speaker_enable_pin: this.currentConfig.speaker_enable_pin !== undefined ? this.currentConfig.speaker_enable_pin : -1,
            usb_host_dp: this.currentConfig.usb_host_dp !== undefined ? this.currentConfig.usb_host_dp : -1,
            ...(() => {
                const tg = {};
                const toggles = this.currentConfig.toggles || [];
                for (let i = 0; i < 2; i++) {
                    const t = toggles[i] || [-1, 0, 0];
                    tg[`toggle${i}_pin`] = t[0];
                    tg[`toggle${i}_func`] = t[1];
                    tg[`toggle${i}_inv`] = t[2];
                }
                return tg;
            })(),
            ...(() => {
                const jw = {};
                const joywing = this.currentConfig.joywing || [];
                for (let i = 0; i < 2; i++) {
                    const slot = joywing[i] || [0, -1, -1, 0x49];
                    jw[`joywing${i}_bus`] = slot[0];
                    jw[`joywing${i}_sda`] = slot[1];
                    jw[`joywing${i}_scl`] = slot[2];
                    jw[`joywing${i}_addr`] = slot[3];
                }
                return jw;
            })(),
        };

        // Add combo remaps
        for (let i = 0; i < 4; i++) {
            config[`combo${i}_in`] = this.checksToMask(`ci${i}`);
            config[`combo${i}_out`] = this.checksToMask(`co${i}`);
        }

        try {
            this.log('Saving hotkey config...');
            const result = await this.protocol.setPadConfig(config);
            this.log(result.reboot ? 'Config saved. Device rebooting...' : 'Config saved.', 'success');
        } catch (e) {
            this.log(`Failed to save config: ${e.message}`, 'error');
        }
    }

    isAvailable() { return this.visible; }
}
