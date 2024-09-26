import * as sys from '@sys';
import * as env from '@env';
import * as sciter from '@sciter';
import {xt} from "./xterm";

const EOL = "\n"
const CONFIG_FILE = URL.toPath(__DIR__) + "frpc.json"

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
        // if (e.message != "socket is not connected")
            // if (fnNewLine) fnNewLine(e.message, "error")
        // out.append(<text class="error">{e.message}</text>);
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
    
    updateUI();
}

function saveConfig() {
    config.serverAddr = document.$('#serverAddr').value;
    config.serverPort = parseInt(document.$('#serverPort').value);
    config.user = document.$('#user').value;
    config.webServer.port = parseInt(document.$('#webServerPort').value);

    let file = sys.fs.sync.open(CONFIG_FILE, 'w');
    file.write(sciter.encode(JSON.stringify(config, null, 2)));
    file.close();
}

function updateUI() {
    document.$('#serverAddr').value = config.serverAddr;
    document.$('#serverPort').value = config.serverPort;
    document.$('#user').value = config.user;
    document.$('#webServerPort').value = config.webServer.port;

    updateVisitorList();
    updateProxyList();
}

// @jsx

function updateVisitorList() {
    const visitorList = document.$('#visitorList');
    visitorList.innerHTML = '';
    config.visitors.forEach((visitor, index) => {
        const isEnabled = config.start.includes(visitor.name);
        visitorList.append(
            <div class="item">
                <h3>
                    <span>{visitor.name}</span>
                    <button id="editVisitor" class="icon-button edit" title="Edit" data-index={index}><icon|edit /></button>
                    <button id="deleteVisitor" class="icon-button delete" title="Delete" data-index={index}><icon|delete /></button>
                </h3>
                <p>Type: {visitor.type}</p>
                <p>Bind Port: {visitor.bindPort}</p>
                <toggle id="toggleVisitor" 
                        data-index={index} 
                        checked={isEnabled}>
                    {isEnabled ? 'Enabled' : 'Disabled'}
                </toggle>
            </div>
        );
    });
}

function updateProxyList() {
    const proxyList = document.$('#proxyList');
    proxyList.innerHTML = '';
    config.proxies.forEach((proxy, index) => {
        const isEnabled = config.start.includes(proxy.name);
        proxyList.append(
            <div class="item">
                <h3>
                    <span>{proxy.name}</span>
                    <button id="editProxy" class="icon-button edit" title="Edit" data-index={index}><icon|edit /></button>
                    <button id="deleteProxy" class="icon-button delete" title="Delete" data-index={index}><icon|delete /></button>
                </h3>
                <p>Type: {proxy.type}</p>
                <p>Local: {proxy.localIP}:{proxy.localPort}</p>
                {proxy.remotePort && <p>Remote Port: {proxy.remotePort}</p>}
                <toggle id="toggleProxy" 
                        data-index={index} 
                        checked={isEnabled}>
                    {isEnabled ? 'Enabled' : 'Disabled'}
                </toggle>
            </div>
        );
    });
}

function addProxy() {
    let result = Window.this.modal({ url: __DIR__ + "proxy-dialog.htm", parameters: { index: -1 } });
    if (result) {
        saveProxyData(-1, result.data);
    }
}

function addVisitor() {
    let result = Window.this.modal({ url: __DIR__ + "visitor-dialog.htm", parameters: { index: -1 } });
    if (result) {
        saveVisitorData(-1, result.data);
    }
}

function saveProxyData(index, proxyData) {
    if (index >= 0) {
        config.proxies[index] = proxyData;
    } else {
        config.proxies.push(proxyData);
    }
    updateProxyList();
}

function saveVisitorData(index, visitorData) {
    if (index >= 0) {
        config.visitors[index] = visitorData;
    } else {
        config.visitors.push(visitorData);
    }
    updateVisitorList();
}

document.on('ready', loadConfig);
document.on("click", "#addProxy", addProxy);
document.on("click", "#addVisitor", addVisitor);

// Use event delegation for dynamically created elements
document.on("click", "#editProxy", function(evt, elt) {
    const index = elt.getAttribute("data-index");
    const params = { index: index, data: config.proxies[index] };
    let result = Window.this.modal({ url: __DIR__ + "proxy-dialog.htm", parameters: params });
    if (result) {
        config.proxies[index] = result.data;
        updateProxyList();
    }
});

document.on("click", "#deleteProxy", function(evt, elt) {
    const index = elt.getAttribute("data-index");
    let result = Window.this.modal(<question>{`Are you sure you want to delete the proxy "${config.proxies[index].name}"?`}</question>);
    if (result=='yes') {
        config.proxies.splice(index, 1);
        updateProxyList();
    }
});

document.on("click", "#editVisitor", function(evt, elt) {
    const index = elt.getAttribute("data-index");
    const params = { index: index, data: config.visitors[index] };
    let result = Window.this.modal({ url: __DIR__ + "visitor-dialog.htm", parameters: params });
    if (result) {
        config.visitors[index] = result.data;
        updateVisitorList();
    }
});

document.on("click", "#deleteVisitor", function(evt, elt) {
    const index = elt.getAttribute("data-index");
    let result = Window.this.modal(<question>{`Are you sure you want to delete the visitor "${config.visitors[index].name}"?`}</question>);
    if (result=='yes') {
        config.visitors.splice(index, 1);
        updateVisitorList();
    }
});

// Add these event listeners
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
        // Visitor is not in start array, so enable it
        config.start.push(visitor.name);
    } else {
        // Visitor is in start array, so disable it
        config.start.splice(startIndex, 1);
    }
    updateVisitorList();
}

function toggleProxy(index) {
    const proxy = config.proxies[index];
    const startIndex = config.start.indexOf(proxy.name);
    if (startIndex === -1) {
        // Proxy is not in start array, so enable it
        config.start.push(proxy.name);
    } else {
        // Proxy is in start array, so disable it
        config.start.splice(startIndex, 1);
    }
    updateProxyList();
}

document.on("click", "#startStopButton", async(event) => {
    if (processFrpc) {
        processFrpc.kill();
        document.$("#startStopButton").textContent = "Start";
        processFrpc = null;
        fnNewLine("FRPC Stopped", "info");
    } else {
        document.$("#startStopButton").textContent = "Stop";
        let path = URL.toPath(__DIR__);
        const args = [path + "wfrpc.exe", "-c", CONFIG_FILE];
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
        processFrpc = null;
    }
});

document.on("click", "#applyButton", async (event) => {
    saveConfig();
    if (processFrpc) {
        let path = URL.toPath(__DIR__);
        const args = [path + "wfrpc.exe", "reload", "-c", CONFIG_FILE];
        sys.spawn(args);
    }
});
