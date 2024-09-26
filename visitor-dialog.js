import * as sciter from '@sciter';

let params = Window.this.parameters||{index: -1};

document.on('ready', () => {
    if (params.index >= 0) {
        document.$('#dialogTitle').textContent = 'Edit Visitor';
        loadVisitorData();
    } else {
        document.$('#dialogTitle').textContent = 'Add Visitor';
    }
});

function showHideXtcpConfig() {
    const xtcpConfig = document.querySelectorAll('.xtcp-config')
    xtcpConfig.forEach(config => {
        if (document.$('#type').value === 'xtcp') {
            config.classList.remove('hidden');
        } else {
            config.classList.add('hidden');
        }
    });
}

document.on('change', '#type', showHideXtcpConfig);

function loadVisitorData() {
    let visitor = params.data;
    document.$('#name').value = visitor.name;
    document.$('#type').value = visitor.type;
    document.$('#serverName').value = visitor.serverName;
    document.$('#serverUser').value = visitor.serverUser || '';
    document.$('#secretKey').value = visitor.secretKey || '';
    document.$('#bindAddr').value = visitor.bindAddr || '';
    document.$('#bindPort').value = visitor.bindPort;
    
    // Transport config
    document.$('#useEncryption').checked = visitor.transport?.useEncryption || false;
    document.$('#useCompression').checked = visitor.transport?.useCompression || false;

    // XTCP specific config
    if (visitor.type === 'xtcp') {
        document.$('#protocol').value = visitor.protocol || 'quic';
        document.$('#keepTunnelOpen').checked = visitor.keepTunnelOpen || false;
        document.$('#maxRetriesAnHour').value = visitor.maxRetriesAnHour || 8;
        document.$('#minRetryInterval').value = visitor.minRetryInterval || 90;
        document.$('#fallbackTo').value = visitor.fallbackTo || '';
        document.$('#fallbackTimeoutMs').value = visitor.fallbackTimeoutMs || '';
    }
    
    // Call showHideXtcpConfig after setting the type
    showHideXtcpConfig();
}

document.on('click', '#save', (event) => {
    const visitorData = {
        name: document.$('#name').value,
        type: document.$('#type').value,
        serverName: document.$('#serverName').value,
        serverUser: document.$('#serverUser').value || undefined,
        secretKey: document.$('#secretKey').value || undefined,
        bindAddr: document.$('#bindAddr').value || undefined,
        bindPort: parseInt(document.$('#bindPort').value),
        transport: {
            useEncryption: document.$('#useEncryption').checked,
            useCompression: document.$('#useCompression').checked
        }
    };

    if (visitorData.type === 'xtcp') {
        visitorData.protocol = document.$('#protocol').value;
        visitorData.keepTunnelOpen = document.$('#keepTunnelOpen').checked;
        visitorData.maxRetriesAnHour = parseInt(document.$('#maxRetriesAnHour').value);
        visitorData.minRetryInterval = parseInt(document.$('#minRetryInterval').value);
        visitorData.fallbackTo = document.$('#fallbackTo').value || undefined;
        visitorData.fallbackTimeoutMs = parseInt(document.$('#fallbackTimeoutMs').value) || undefined;
    }

    Window.this.close({index: params.index, data: visitorData});
});

document.on('click', '#cancel', (event) => {
    Window.this.close();
}); 
