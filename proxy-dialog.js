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
    document.$('#customDomainsRow').classList.toggle('hidden', !['http', 'https'].includes(selectedType));
    document.$('#secretKeyRow').classList.toggle('hidden', !['stcp', 'xtcp'].includes(selectedType));
}

document.on('change', '#type', updateVisibleFields);

function loadProxyData() {
    let proxy = params.data;
    document.$('#name').value = proxy.name;
    document.$('#type').value = proxy.type;
    document.$('#localIP').value = proxy.localIP || '127.0.0.1';
    document.$('#localPort').value = proxy.localPort;
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

document.$('#toggleAdvanced').on('click', () => {
    const advancedSettings = document.$('#advancedSettings');
    advancedSettings.classList.toggle('hidden');
    document.$('#toggleAdvanced').textContent = advancedSettings.classList.contains('hidden') 
        ? 'Show Advanced Settings' 
        : 'Hide Advanced Settings';
});

document.on('click', '#save', (event) => {
    const proxyData = {
        name: document.$('#name').value,
        type: document.$('#type').value,
        localIP: document.$('#localIP').value,
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
        proxyData.customDomains = document.$('#customDomains').value.split(',').map(d => d.trim()).filter(Boolean);
    }

    if (['stcp', 'xtcp'].includes(proxyData.type)) {
        proxyData.secretKey = document.$('#secretKey').value || undefined;
    }

    Window.this.close({index: params.index, data: proxyData});
});

document.on('click', '#cancel', (event) => {
    Window.this.close();
});