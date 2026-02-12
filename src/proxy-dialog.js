import * as sciter from '@sciter';

let params = Window.this.parameters || {index: -1};

document.on('ready', () => {
    if (params.index >= 0) {
        document.$('#dialogTitle').textContent = 'Edit Proxy';
        loadProxyData();
    } else {
        document.$('#dialogTitle').textContent = 'Add Proxy';
    }
});

function updateVisibleFields() {
    const selectedType = document.$('#type').value;

    // Show/hide custom domains (for HTTP/HTTPS)
    const customDomainsGroup = document.$('#customDomainsGroup');
    if (customDomainsGroup) {
        if (['http', 'https'].includes(selectedType)) {
            customDomainsGroup.classList.remove('hidden');
        } else {
            customDomainsGroup.classList.add('hidden');
        }
    }

    // Show/hide secret key (for STCP/XTCP)
    const secretKeyGroup = document.$('#secretKeyGroup');
    if (secretKeyGroup) {
        if (['stcp', 'xtcp'].includes(selectedType)) {
            secretKeyGroup.classList.remove('hidden');
        } else {
            secretKeyGroup.classList.add('hidden');
        }
    }
}

document.on('change', '#type', updateVisibleFields);

function loadProxyData() {
    let proxy = params.data;
    document.$('#name').value = proxy.name || '';
    document.$('#type').value = proxy.type || 'tcp';
    document.$('#localIP').value = proxy.localIP || '127.0.0.1';
    document.$('#localPort').value = proxy.localPort || '';
    document.$('#remotePort').value = proxy.remotePort || '';
    document.$('#customDomains').value = proxy.customDomains?.join(',') || '';
    document.$('#secretKey').value = proxy.secretKey || '';

    // Transport config
    document.$('#useEncryption').checked = proxy.transport?.useEncryption || false;
    document.$('#useCompression').checked = proxy.transport?.useCompression || false;
    document.$('#bandwidthLimit').value = proxy.transport?.bandwidthLimit || '';
    document.$('#bandwidthLimitMode').value = proxy.transport?.bandwidthLimitMode || 'client';

    updateVisibleFields();
}

document.on('click', '#save', (event) => {
    const proxyData = {
        name: document.$('#name').value,
        type: document.$('#type').value,
        localIP: document.$('#localIP').value || '127.0.0.1',
        localPort: parseInt(document.$('#localPort').value),
        remotePort: parseInt(document.$('#remotePort').value) || undefined,
        transport: {
            useEncryption: document.$('#useEncryption').checked,
            useCompression: document.$('#useCompression').checked,
            bandwidthLimit: document.$('#bandwidthLimit').value || undefined,
            bandwidthLimitMode: document.$('#bandwidthLimitMode').value
        }
    };

    if (['http', 'https'].includes(proxyData.type)) {
        const domains = document.$('#customDomains').value;
        if (domains && domains.trim()) {
            proxyData.customDomains = domains.split(',').map(d => d.trim()).filter(Boolean);
        }
    }

    if (['stcp', 'xtcp'].includes(proxyData.type)) {
        proxyData.secretKey = document.$('#secretKey').value || undefined;
    }

    Window.this.close({index: params.index, data: proxyData});
});

document.on('click', '#cancel', (event) => {
    Window.this.close();
});
