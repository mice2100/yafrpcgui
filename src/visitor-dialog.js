// Visitor Dialog Component
export class VisitorDialog extends Element {

  // Props passed when showing dialog
  this(props) {
    this.index = props.index==undefined? -1 : props.index;
    this.data = props.data || null;
    this.saveCallback = props.saveCallback || null;
  }

  // Render the dialog UI
  render(props, kids) {
    const isEdit = this.index >= 0;
    const title = isEdit ? "Edit Visitor" : "Add Visitor";

    return (
      <div class="dialog-content">
        <div class="dialog-header">
          <h1>{title}</h1>
        </div>

        <div class="dialog-form-row">
          <div class="form-field flex">
            <label class="form-label" for="name">Name</label>
            <input|text id="name" placeholder="ssh-tunnel" />
          </div>
          <div class="form-field medium">
            <label class="form-label" for="type">Type</label>
            <select id="type">
              <option value="stcp">STCP</option>
              <option value="sudp">SUDP</option>
              <option value="xtcp">XTCP</option>
            </select>
          </div>
          <div class="form-field fixed">
            <label class="form-label" for="bindPort">Port</label>
            <input|text filter="0~9" id="bindPort" placeholder="2200" />
          </div>
        </div>

        <div class="form-field">
          <label class="form-label" for="serverName">Server Name</label>
          <input|text id="serverName" placeholder="Name of proxy to visit" />
        </div>

        <div class="dialog-form-row">
          <div class="form-field fixed-lg">
            <label class="form-label" for="serverUser">User</label>
            <input|text id="serverUser" placeholder="Opt" />
          </div>
          <div class="form-field fixed-lg">
            <label class="form-label" for="bindAddr">Bind Addr</label>
            <input|text id="bindAddr" placeholder="0.0.0.0" />
          </div>
        </div>

        <div class="form-field">
          <label class="form-label" for="secretKey">Secret Key</label>
          <input|password id="secretKey" placeholder="Shared secret" />
        </div>

        <div class="dialog-form-section">
          <div class="section-title">Transport Options</div>
          <div class="dialog-form-row mt-5">
            <div class="checkbox-row">
              <input|checkbox id="useEncryption" />
              <label for="useEncryption">Encryption</label>
            </div>
            <div class="checkbox-row">
              <input|checkbox id="useCompression" />
              <label for="useCompression">Compression</label>
            </div>
          </div>
        </div>

        <div class="dialog-form-section hidden" id="xtcpSection">
          <div class="section-title">XTCP Configuration</div>
          <div class="dialog-form-row mt-5">
            <div class="form-field medium">
              <label class="form-label" for="protocol">Protocol</label>
              <select id="protocol">
                <option value="quic">QUIC</option>
                <option value="kcp">KCP</option>
              </select>
            </div>
            <div class="form-field fixed">
              <label class="form-label" for="maxRetriesAnHour">Max/Hr</label>
              <input|text filter="0~9" id="maxRetriesAnHour" value="8" placeholder="8" />
            </div>
            <div class="form-field fixed">
              <label class="form-label" for="minRetryInterval">Min/s</label>
              <input|text filter="0~9" id="minRetryInterval" value="90" placeholder="90" />
            </div>
          </div>
          <div class="checkbox-row mt-4">
            <input|checkbox id="keepTunnelOpen" />
            <label for="keepTunnelOpen">Keep Tunnel Open</label>
          </div>
          <div class="dialog-form-row mt-5">
            <div class="form-field flex">
              <label class="form-label" for="fallbackTo">Fallback</label>
              <input|text id="fallbackTo" placeholder="e.g., stcp" />
            </div>
            <div class="form-field fixed">
              <label class="form-label" for="fallbackTimeoutMs">Timeout</label>
              <input|text filter="0~9" id="fallbackTimeoutMs" placeholder="Ms" />
            </div>
          </div>
        </div>

        <div class="dialog-button-bar">
          <div></div>
          <button id="cancel">Cancel</button>
          <button id="save" class="primary">Save</button>
          <div></div>
        </div>
      </div>
    );
  }

  // Called after component is mounted
  componentDidMount() {
    // Load data if editing
    if (this.index >= 0 && this.data) {
      this.$("#name").value = this.data.name || '';
      this.$("#type").value = this.data.type || 'stcp';
      this.$("#serverName").value = this.data.serverName || '';
      this.$("#serverUser").value = this.data.serverUser || '';
      this.$("#secretKey").value = this.data.secretKey || '';
      this.$("#bindAddr").value = this.data.bindAddr || '';
      this.$("#bindPort").value = this.data.bindPort || '';
      this.$("#useEncryption").checked = this.data.transport?.useEncryption || false;
      this.$("#useCompression").checked = this.data.transport?.useCompression || false;
      this.$("#protocol").value = this.data.protocol || 'quic';
      this.$("#keepTunnelOpen").checked = this.data.keepTunnelOpen || false;
      this.$("#maxRetriesAnHour").value = this.data.maxRetriesAnHour || 8;
      this.$("#minRetryInterval").value = this.data.minRetryInterval || 90;
      this.$("#fallbackTo").value = this.data.fallbackTo || '';
      this.$("#fallbackTimeoutMs").value = this.data.fallbackTimeoutMs || '';
    }

    // Setup event handlers
    this.updateVisibleFields();

    this.on("change", "#type", () => this.updateVisibleFields());
    this.on("click", "#cancel", () => this.closeDialog());
    this.on("click", "#save", () => this.saveDialog());
  }

  // Update XTCP section visibility
  updateVisibleFields() {
    const xtcpSection = this.$("#xtcpSection");
    if (xtcpSection) {
      if (this.$("#type").value === 'xtcp') {
        xtcpSection.classList.remove('hidden');
      } else {
        xtcpSection.classList.add('hidden');
      }
    }
  }

  // Save dialog data
  saveDialog() {
    const visitorData = {
      name: this.$("#name").value,
      type: this.$("#type").value,
      serverName: this.$("#serverName").value,
      serverUser: this.$("#serverUser").value || undefined,
      secretKey: this.$("#secretKey").value || undefined,
      bindAddr: this.$("#bindAddr").value || undefined,
      bindPort: parseInt(this.$("#bindPort").value) || undefined,
      transport: {
        useEncryption: this.$("#useEncryption").checked,
        useCompression: this.$("#useCompression").checked
      }
    };

    if (visitorData.type === 'xtcp') {
      visitorData.protocol = this.$("#protocol").value;
      visitorData.keepTunnelOpen = this.$("#keepTunnelOpen").checked;
      visitorData.maxRetriesAnHour = parseInt(this.$("#maxRetriesAnHour").value) || 8;
      visitorData.minRetryInterval = parseInt(this.$("#minRetryInterval").value) || 90;
      visitorData.fallbackTo = this.$("#fallbackTo").value || undefined;
      visitorData.fallbackTimeoutMs = parseInt(this.$("#fallbackTimeoutMs").value) || undefined;
    }

    // Call save callback if provided
    if (this.saveCallback) {
      this.saveCallback(this.index, visitorData);
    }

    // Close dialog
    this.closeDialog();
  }

  // Close dialog
  closeDialog() {
    this.state.popup = false;
  }
}
