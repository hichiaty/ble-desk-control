const connectButton = document.getElementById('connectButton');
const disconnectButton = document.getElementById('disconnectButton');
const upButton = document.getElementById('upButton');
const downButton = document.getElementById('downButton');
const controlsDiv = document.getElementById('controls');
const statusMessages = document.getElementById('statusMessages');

let bluetoothDevice;
let nusTxCharacteristic; // To send data to the nRF52
let nusRxCharacteristic; // To receive data from the nRF52 (optional for this use case for now)

const NUS_SERVICE_UUID = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
const NUS_RX_CHARACTERISTIC_UUID = '6e400002-b5a3-f393-e0a9-e50e24dcca9e'; // The one we write to
const NUS_TX_CHARACTERISTIC_UUID = '6e400003-b5a3-f393-e0a9-e50e24dcca9e'; // The one we can read/notify from

// Define command strings - customize as needed
const CMD_UP = 'UP';
const CMD_DOWN = 'DOWN';
const CMD_STOP = 'STOP';

function log(message) {
    const p = document.createElement('p');
    p.textContent = message;
    statusMessages.innerHTML = ''; // Clear previous messages
    statusMessages.appendChild(p);
    console.log(message);
}

async function connect() {
    log('Requesting Bluetooth Device...');
    try {
        bluetoothDevice = await navigator.bluetooth.requestDevice({
            filters: [{ services: [NUS_SERVICE_UUID] }],
            // optionalServices: [NUS_SERVICE_UUID] // Alternative if NUS is not primary
        });

        log('Connecting to GATT Server...');
        if (!bluetoothDevice.gatt) {
            log('Error: GATT server not available on this device.');
            return;
        }
        const server = await bluetoothDevice.gatt.connect();
        log('Connected to GATT Server.');

        log('Getting NUS Service...');
        const service = await server.getPrimaryService(NUS_SERVICE_UUID);
        log('NUS Service Obtained.');

        log('Getting NUS RX Characteristic (for sending data)...');
        nusRxCharacteristic = await service.getCharacteristic(NUS_RX_CHARACTERISTIC_UUID);
        log('NUS RX Characteristic Obtained.');

        // Optional: Get TX characteristic if you need to receive data/notifications
        // log('Getting NUS TX Characteristic (for receiving data)...');
        // nusTxCharacteristic = await service.getCharacteristic(NUS_TX_CHARACTERISTIC_UUID);
        // log('NUS TX Characteristic Obtained.');
        // await nusTxCharacteristic.startNotifications();
        // nusTxCharacteristic.addEventListener('characteristicvaluechanged', handleNotifications);
        // log('Notifications started on TX characteristic.');


        log('Connected to ' + bluetoothDevice.name);
        connectButton.disabled = true;
        disconnectButton.disabled = false;
        controlsDiv.style.display = 'block';

        bluetoothDevice.addEventListener('gattserverdisconnected', onDisconnected);

    } catch (error) {
        log('Connection failed: ' + error);
        if (bluetoothDevice) {
            // Attempt to disconnect if partially connected
            if (bluetoothDevice.gatt && bluetoothDevice.gatt.connected) {
                bluetoothDevice.gatt.disconnect();
            }
        }
        connectButton.disabled = false;
        disconnectButton.disabled = true;
        controlsDiv.style.display = 'none';
    }
}

function onDisconnected() {
    log('Device disconnected.');
    connectButton.disabled = false;
    disconnectButton.disabled = true;
    controlsDiv.style.display = 'none';
    nusRxCharacteristic = null;
    // nusTxCharacteristic = null; // if used
    bluetoothDevice = null;
}

async function disconnect() {
    if (!bluetoothDevice) {
        log('No device connected.');
        return;
    }
    if (bluetoothDevice.gatt && bluetoothDevice.gatt.connected) {
        log('Disconnecting from device...');
        bluetoothDevice.gatt.disconnect();
    } else {
        log('Device already disconnected.');
        onDisconnected(); // Ensure UI is updated
    }
}

// function handleNotifications(event) {
//     let value = event.target.value;
//     let a = [];
//     for (let i = 0; i < value.byteLength; i++) {
//         a.push(String.fromCharCode(value.getUint8(i)));
//     }
//     log('Received: ' + a.join(''));
// }

async function sendCommand(command) {
    if (!nusRxCharacteristic) {
        log('Not connected or RX characteristic not found.');
        return;
    }
    try {
        log(`Sending: ${command}`);
        // Ensure the command is followed by a newline if your device expects it
        const commandToSend = command + '\n';
        const encoder = new TextEncoder();
        await nusRxCharacteristic.writeValueWithoutResponse(encoder.encode(commandToSend));
        // Or use writeValueWithResponse if your device acknowledges writes
        // await nusRxCharacteristic.writeValueWithResponse(encoder.encode(commandToSend));
        log('Command sent.');
    } catch (error) {
        log('Send failed: ' + error);
    }
}

connectButton.addEventListener('click', connect);
disconnectButton.addEventListener('click', disconnect);

// Event listeners for Up button
upButton.addEventListener('mousedown', () => {
    // sendCommand(CMD_UP);
    log('Up Button: Mouse Down');
});
upButton.addEventListener('mouseup', () => {
    // sendCommand(CMD_STOP);
    log('Up Button: Mouse Up');
});
upButton.addEventListener('mouseleave', () => {
    if (bluetoothDevice && bluetoothDevice.gatt && bluetoothDevice.gatt.connected) {
        // sendCommand(CMD_STOP);
        log('Up Button: Mouse Leave (STOP would be sent)');
    } else {
        log('Up Button: Mouse Leave (not connected)');
    }
});

// Event listeners for Down button
downButton.addEventListener('mousedown', () => {
    // sendCommand(CMD_DOWN);
    log('Down Button: Mouse Down');
});
downButton.addEventListener('mouseup', () => {
    // sendCommand(CMD_STOP);
    log('Down Button: Mouse Up');
});
downButton.addEventListener('mouseleave', () => {
    if (bluetoothDevice && bluetoothDevice.gatt && bluetoothDevice.gatt.connected) {
        // sendCommand(CMD_STOP);
        log('Down Button: Mouse Leave (STOP would be sent)');
    } else {
        log('Down Button: Mouse Leave (not connected)');
    }
});

log('Page loaded. Ready to connect. Command sending is currently disabled for logging mouse events.');
