import * as sys from '@sys';
import * as env from '@env';
import * as sciter from '@sciter';
import { xt } from "./xterm";
import { ProxyDialog } from "./proxy-dialog";
import { VisitorDialog } from "./visitor-dialog";

const EOL = "\n"
const CONFIG_FILE = URL.toPath(env.home("frpc.json"))

var processFrpc = null;
let config = {};
const terminal = document.$("#log").terminal;

export async function pipeReader(pipe, name, fnNewLine) {
    try {
        var cline = "";
        reading: while (pipe.fileno()) {
            var text = await pipe.read();
            text = sciter.decode(text);
            while (text) {
                var eolpos = text.indexOf(EOL);
                if (eolpos < 0) { cline += text; continue reading; }
                cline += text.substr(0, eolpos);
                text = text.substr(eolpos + EOL.length)
                if (fnNewLine) fnNewLine(cline, "msg")
                cline = "";
            }
        }
    } catch (e) {
        // Ignore errors during shutdown
    }
}

function fnNewLine(cline, cls){
    let txt=""
    switch(cls) {
        case 'msg':
            txt = xt.white(cline)
            break;
        case 'info':
            txt = xt.yellow(cline)
            break;
        case 'error':
            txt = xt.red(cline)
            break;
    }
    terminal.write(txt+"\r\n");
}

function loadConfig() {
    try {
        config = JSON.parse(sciter.decode(sys.fs.sync.readfile(CONFIG_FILE)));
    } catch (error) {
        // If file doesn't exist, create default config
        config.webServer = { port: 8888 };
        config.start = [];
        config.proxies = [];
        config.visitors = [];
        updateUI();
    }
    config.auth = config.auth || {}
    config.transport = config.transport || {}

    updateUI();
}

function saveConfig() {
    config.serverAddr = document.$('#serverAddr').value;
    config.serverPort = parseInt(document.$('#serverPort').value);
    config.user = document.$('#user').value;
    config.webServer.port = parseInt(document.$('#webServerPort').value);
    config.auth.token = document.$('#token').value||undefined;
    config.transport.protocol = document.$('#transProtocol').value||undefined;
    let file = sys.fs.sync.open(CONFIG_FILE, 'w');
    file.write(sciter.encode(JSON.stringify(config, null, 2)));
    file.close();
}

function updateUI() {
    document.$('#serverAddr').value = config.serverAddr || '';
    document.$('#serverPort').value = config.serverPort || '';
    document.$('#token').value = config.auth?.token || '';
    document.$('#user').value = config.user || '';
    document.$('#webServerPort').value = config.webServer?.port || '';
    document.$('#transProtocol').value = config.transport?.protocol || 'tcp';
    updateVisitorList();
    updateProxyList();
    updateCounts();
}

// @jsx

function updateVisitorList() {
    const visitorList = document.$('#visitorList');
    visitorList.innerHTML = '';

    if (config.visitors.length === 0) {
        visitorList.append(
            <div class="empty-state">
                <div class="icon">○</div>
                <div>No visitors configured</div>
            </div>
        );
        return;
    }

    config.visitors.forEach((visitor, index) => {
        const isEnabled = config.start.includes(visitor.name);
        visitorList.append(
            <div class="card">
                <div class="card-header">
                    <span class="card-title">{visitor.name}</span>
                    <div class="card-actions">
                        <button id="editVisitor" class="icon-btn edit" title="Edit" data-index={index}><icon|edit /></button>
                        <button id="deleteVisitor" class="icon-btn delete" title="Delete" data-index={index}><icon|delete /></button>
                    </div>
                </div>
                <div class="card-row">
                    <span class="label">Type</span>
                    <span class="value badge {visitor.type}">{visitor.type}</span>
                </div>
                <div class="card-row">
                    <span class="label">Server</span>
                    <span class="value">{visitor.serverName}</span>
                </div>
                <div class="card-row">
                    <span class="label">Bind</span>
                    <span class="value">{visitor.bindAddr || '0.0.0.0'}:{visitor.bindPort}</span>
                </div>
                <toggle id="toggleVisitor"
                        data-index={index}
                        checked={isEnabled}>
                </toggle>
            </div>
        );
    });
}

function updateProxyList() {
    const proxyList = document.$('#proxyList');
    proxyList.innerHTML = '';

    if (config.proxies.length === 0) {
        proxyList.append(
            <div class="empty-state">
                <div class="icon">○</div>
                <div>No proxies configured</div>
            </div>
        );
        return;
    }

    config.proxies.forEach((proxy, index) => {
        const isEnabled = config.start.includes(proxy.name);
        proxyList.append(
            <div class="card">
                <div class="card-header">
                    <span class="card-title">{proxy.name}</span>
                    <div class="card-actions">
                        <button id="editProxy" class="icon-btn edit" title="Edit" data-index={index}><icon|edit /></button>
                        <button id="deleteProxy" class="icon-btn delete" title="Delete" data-index={index}><icon|delete /></button>
                    </div>
                </div>
                <div class="card-row">
                    <span class="label">Type</span>
                    <span class="value badge {proxy.type}">{proxy.type}</span>
                </div>
                <div class="card-row">
                    <span class="label">Local</span>
                    <span class="value">{proxy.localIP || '127.0.0.1'}:{proxy.localPort}</span>
                </div>
                {proxy.remotePort && <div class="card-row">
                    <span class="label">Remote</span>
                    <span class="value">:{proxy.remotePort}</span>
                </div>}
                {proxy.customDomains && <div class="card-row">
                    <span class="label">Domain</span>
                    <span class="value">{proxy.customDomains[0]}</span>
                </div>}
                <toggle id="toggleProxy"
                        data-index={index}
                        checked={isEnabled}>
                </toggle>
            </div>
        );
    });
}

function saveProxyData(index, proxyData) {
    if (index >= 0) {
        config.proxies[index] = proxyData;
    } else {
        config.proxies.push(proxyData);
    }
    updateProxyList();
    updateCounts();
}

function saveVisitorData(index, visitorData) {
    if (index >= 0) {
        config.visitors[index] = visitorData;
    } else {
        config.visitors.push(visitorData);
    }
    updateVisitorList();
    updateCounts();
}

// Dialog functions
function addProxy() {
  document.popup(<ProxyDialog index={-1} saveCallback={saveProxyData} />, {anchorAt: 5});
}

function addVisitor() {
    document.popup(<VisitorDialog index={-1} saveCallback={saveVisitorData} />, {anchorAt: 5});
}

function editProxy(index) {
    document.popup(<ProxyDialog index={index} data={config.proxies[index]} saveCallback={(i, data) => {
        config.proxies[i] = data;
        updateProxyList();
        updateCounts();
    }} />, {anchorAt: 5});
}

function editVisitor(index) {
    document.body.popup(<VisitorDialog index={index} data={config.visitors[index]} saveCallback={(i, data) => {
        config.visitors[i] = data;
        updateVisitorList();
        updateCounts();
    }} />, {anchorAt: 5});
}

document.on('ready', loadConfig);
document.on("click", "#addProxy", addProxy);
document.on("click", "#addVisitor", addVisitor);

// Event delegation for dynamically created elements
document.on("click", "#editProxy", function(evt, elt) {
    const index = parseInt(elt.getAttribute("data-index"));
    editProxy(index);
});

document.on("click", "#deleteProxy", function(evt, elt) {
    const index = parseInt(elt.getAttribute("data-index"));
    let result = document.body.popup(
        <question>{`Are you sure you want to delete the proxy "${config.proxies[index].name}"?`}</question>
    );
    if (result == 'yes') {
        config.proxies.splice(index, 1);
        updateProxyList();
        updateCounts();
    }
});

document.on("click", "#editVisitor", function(evt, elt) {
    const index = parseInt(elt.getAttribute("data-index"));
    editVisitor(index);
});

document.on("click", "#deleteVisitor", function(evt, elt) {
    const index = parseInt(elt.getAttribute("data-index"));
    let result = document.body.popup(
        <question>{`Are you sure you want to delete the visitor "${config.visitors[index].name}"?`}</question>
    );
    if (result == 'yes') {
        config.visitors.splice(index, 1);
        updateVisitorList();
        updateCounts();
    }
});

// Toggle handlers
document.on("change", "#toggleVisitor", function(evt, elt) {
    const index = parseInt(elt.getAttribute("data-index"));
    toggleVisitor(index);
});

document.on("change", "#toggleProxy", function(evt, elt) {
    const index = parseInt(elt.getAttribute("data-index"));
    toggleProxy(index);
});

function toggleVisitor(index) {
    const visitor = config.visitors[index];
    const startIndex = config.start.indexOf(visitor.name);
    if (startIndex === -1) {
        config.start.push(visitor.name);
    } else {
        config.start.splice(startIndex, 1);
    }
    updateVisitorList();
}

function toggleProxy(index) {
    const proxy = config.proxies[index];
    const startIndex = config.start.indexOf(proxy.name);
    if (startIndex === -1) {
        config.start.push(proxy.name);
    } else {
        config.start.splice(startIndex, 1);
    }
    updateProxyList();
}

function updateCounts() {
    const proxyCount = document.$('#proxyCount');
    const visitorCount = document.$('#visitorCount');
    if (proxyCount) proxyCount.textContent = config.proxies.length.toString();
    if (visitorCount) visitorCount.textContent = config.visitors.length.toString();
}

function updateStatusIndicator(isRunning) {
    const statusIndicator = document.$('#statusIndicator');
    if (statusIndicator) {
        if (isRunning) {
            statusIndicator.classList.remove('stopped');
            statusIndicator.classList.add('running');
            statusIndicator.textContent = '● Running';
        } else {
            statusIndicator.classList.remove('running');
            statusIndicator.classList.add('stopped');
            statusIndicator.textContent = '● Stopped';
        }
    }
}

document.on("click", "#startStopButton", async(event) => {
    if (processFrpc) {
        processFrpc.kill();
        document.$("#startStopButton").textContent = "Start";
        document.$('#webServerPort').state.disabled = false;
        processFrpc = null;
        fnNewLine("FRPC Stopped", "info");
        updateStatusIndicator(false);
    } else {
        document.$("#startStopButton").textContent = "Stop";
        document.$('#webServerPort').state.disabled = true;
        saveConfig();
        let path = URL.toPath(env.home("wfrpc.exe"));
        const args = [path, "-c", CONFIG_FILE];
        processFrpc = sys.spawn(args, { stdout: "pipe", stderr: "pipe" });
        let pout = pipeReader(processFrpc.stdout, "stdout", fnNewLine);
        let perr = pipeReader(processFrpc.stderr, "stderr", fnNewLine);

        var r = await processFrpc.wait()
        processFrpc.stderr.close()
        processFrpc.stdout.close()
        await pout
        await perr
        document.$("#startStopButton").textContent = "Start";
        fnNewLine("FRPC Stopped", "info");
        updateStatusIndicator(false);
        processFrpc = null;
    }
});

document.on("click", "#applyButton", async (event) => {
    saveConfig();
    if (processFrpc) {
        let path = URL.toPath(env.home("wfrpc.exe"));
        const args = [path, "reload", "-c", CONFIG_FILE];
        sys.spawn(args);
    }
});
