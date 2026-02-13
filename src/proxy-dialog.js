// Proxy Dialog Component
export class ProxyDialog extends Element {

  // Props passed when showing dialog
  this(props) {
    this.index = props.index==undefined? -1:props.index;
    this.data = props.data || null;
    this.saveCallback = props.saveCallback || null;
  }

  // Called after component is mounted
  componentDidMount() {
    // Load data if editing
    if (this.index >= 0 && this.data) {
      this.$("#name").value = this.data.name || '';
      this.$("#type").value = this.data.type || 'tcp';
      this.$("#localIP").value = this.data.localIP || '127.0.0.1';
      this.$("#localPort").value = this.data.localPort || '';
      this.$("#remotePort").value = this.data.remotePort || '';
      this.$("#customDomains").value = this.data.customDomains?.join(',') || '';
      this.$("#secretKey").value = this.data.secretKey || '';
      this.$("#useEncryption").checked = this.data.transport?.useEncryption || false;
      this.$("#useCompression").checked = this.data.transport?.useCompression || false;
      this.$("#bandwidthLimit").value = this.data.transport?.bandwidthLimit || '';
      this.$("#bandwidthLimitMode").value = this.data.transport?.bandwidthLimitMode || 'client';
    }

    // Setup event handlers
    this.updateVisibleFields();

    this.on("change", "#type", () => this.updateVisibleFields());
    this.on("click", "#cancel", () => this.closeDialog());
    this.on("click", "#save", () => this.saveDialog());
  }

  // Render the dialog UI
  render(props, kids) {
    const isEdit = this.index >= 0;
    const title = isEdit ? "Edit Proxy" : "Add Proxy";

    return (
      <div class="dialog-content">
        <div class="dialog-header">
          <h1>{title}</h1>
        </div>

        <div class="dialog-form-row">
          <div class="form-field flex">
            <label class="form-label" for="name">Name</label>
            <input|text id="name" placeholder="web-server" />
          </div>
          <div class="form-field medium">
            <label class="form-label" for="type">Type</label>
            <select id="type">
              <option value="tcp">TCP</option>
              <option value="udp">UDP</option>
              <option value="http">HTTP</option>
              <option value="https">HTTPS</option>
              <option value="stcp">STCP</option>
              <option value="xtcp">XTCP</option>
              <option value="tcpmux">TCPMUX</option>
              <option value="sudp">SUDP</option>
            </select>
          </div>
          <div class="form-field fixed">
            <label class="form-label" for="remotePort">Remote</label>
            <input|text filter="0~9" id="remotePort" placeholder="Opt" />
          </div>
        </div>

        <div class="dialog-form-row">
          <div class="form-field fixed-lg">
            <label class="form-label" for="localIP">Local IP</label>
            <input|text id="localIP" placeholder="127.0.0.1" />
          </div>
          <div class="form-field fixed">
            <label class="form-label" for="localPort">Port</label>
            <input|text filter="0~9" id="localPort" placeholder="8080" />
          </div>
        </div>

        <div class="form-field hidden" id="customDomainsGroup">
          <label class="form-label" for="customDomains">Domains</label>
          <input|text id="customDomains" placeholder="www.example.com, app.example.com" />
          <div class="hint">Comma-separated for multiple</div>
        </div>

        <div class="form-field hidden" id="secretKeyGroup">
          <label class="form-label" for="secretKey">Secret Key</label>
          <input|password id="secretKey" placeholder="Shared secret" />
        </div>

        <div class="dialog-form-section">
          <div class="section-title">Transport Options</div>
          <div class="dialog-form-row mt-5">
            <div class="checkbox-row">
              <input type="checkbox" id="useEncryption" />
              <label for="useEncryption">Encryption</label>
            </div>
            <div class="checkbox-row">
              <input type="checkbox" id="useCompression" />
              <label for="useCompression">Compression</label>
            </div>
          </div>
          <div class="dialog-form-row mt-5">
            <div class="form-field flex">
              <label class="form-label" for="bandwidthLimit">Bandwidth Limit</label>
              <input|text id="bandwidthLimit" placeholder="e.g., 1MB" />
            </div>
            <div class="form-field medium">
              <label class="form-label" for="bandwidthLimitMode">Mode</label>
              <select id="bandwidthLimitMode">
                <option value="client">Client</option>
                <option value="server">Server</option>
              </select>
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

  // Update field visibility based on type
  updateVisibleFields() {
    const selectedType = this.$("#type").value;

    const customDomainsGroup = this.$("#customDomainsGroup");
    if (customDomainsGroup) {
      if (['http', 'https'].includes(selectedType)) {
        customDomainsGroup.classList.remove('hidden');
      } else {
        customDomainsGroup.classList.add('hidden');
      }
    }

    const secretKeyGroup = this.$("#secretKeyGroup");
    if (secretKeyGroup) {
      if (['stcp', 'xtcp'].includes(selectedType)) {
        secretKeyGroup.classList.remove('hidden');
      } else {
        secretKeyGroup.classList.add('hidden');
      }
    }
  }

  // Save dialog data
  saveDialog() {
    const proxyData = {
      name: this.$("#name").value,
      type: this.$("#type").value,
      localIP: this.$("#localIP").value || '127.0.0.1',
      localPort: parseInt(this.$("#localPort").value) || undefined,
      remotePort: parseInt(this.$("#remotePort").value) || undefined,
      transport: {
        useEncryption: this.$("#useEncryption").checked,
        useCompression: this.$("#useCompression").checked,
        bandwidthLimit: this.$("#bandwidthLimit").value || undefined,
        bandwidthLimitMode: this.$("#bandwidthLimitMode").value
      }
    };

    if (['http', 'https'].includes(proxyData.type)) {
      const domains = this.$("#customDomains").value;
      if (domains && domains.trim()) {
        proxyData.customDomains = domains.split(',').map(d => d.trim()).filter(Boolean);
      }
    }

    if (['stcp', 'xtcp'].includes(proxyData.type)) {
      proxyData.secretKey = this.$("#secretKey").value || undefined;
    }

    // Call save callback if provided
    if (this.saveCallback) {
      this.saveCallback(this.index, proxyData);
    }

    this.closeDialog();
  }

  // Close dialog
  closeDialog() {
    this.state.popup = false;
  }
}
