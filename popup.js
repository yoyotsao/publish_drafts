document.addEventListener('DOMContentLoaded', function() {
    chrome.storage.sync.get(['batch'], async function(result) {
        var batchValue = result.batch;
        document.getElementById('batch').value = batchValue;
    });
    chrome.storage.sync.get(['date'], async function(result) {
        var dateValue = result.date;
        document.getElementById('startDate').value = dateValue;
    });
});

document.getElementById('batch').addEventListener('change', async function() {
    var newBatch = document.getElementById('batch').value;
    await chrome.storage.sync.set({ batch: newBatch });
    console.log("set batch: " + newBatch);
});

document.getElementById('startDate').addEventListener('change', async function() {
    var newDate = document.getElementById('startDate').value;
    await chrome.storage.sync.set({ date: String(newDate) });
    console.log("set date: " + newDate);
});

async function send(message) {
    const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    const response = await chrome.tabs.sendMessage(tab.id, message);
}

document.getElementById('publishDrafts').addEventListener('click', () => {
    send({ 
        action: 'publishDrafts',
        batch: document.getElementById('batch').value,
        startDate: document.getElementById('startDate').value
    });
});
  