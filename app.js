const defaultRecords = [
    { id: 1, name: "Tom Brown", agent: "Agent Alice", status: "Cancelled" },
    { id: 2, name: "Priya Patel", agent: "Agent Bob", status: "Hold" },
    { id: 3, name: "Mike Lee", agent: "Agent Alice", status: "Pending" }
];

let records = JSON.parse(localStorage.getItem('crm_records')) || defaultRecords;
let currentUser = sessionStorage.getItem('crm_user') || null;

// Grab layout elements
const loginGate = document.getElementById('loginGate');
const loginRole = document.getElementById('loginRole');
const loginPassword = document.getElementById('loginPassword');
const submitLoginBtn = document.getElementById('submitLoginBtn');
const loginError = document.getElementById('loginError');
const userBadge = document.getElementById('userBadge');
const logoutBtn = document.getElementById('logoutBtn');
const tableBody = document.getElementById('tableBody');
const totalCount = document.getElementById('totalCount');
const searchInput = document.getElementById('searchInput');
const addRecordBtn = document.getElementById('addRecordBtn');

// Chat UI Selectors
const chatWindow = document.getElementById('chatWindow');
const toggleChatBtn = document.getElementById('toggleChatBtn');
const closeChatBtn = document.getElementById('closeChatBtn');
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const sendChatBtn = document.getElementById('sendChatBtn');

let messages = JSON.parse(localStorage.getItem('crm_messages')) || [
    { sender: "Agent Alice", text: "Welcome to the portal!" }
];

function checkAuth() {
    if (currentUser) {
        loginGate.style.display = 'none';
        userBadge.textContent = currentUser;
        renderTable();
    } else {
        loginGate.style.display = 'flex';
    }
}

submitLoginBtn.onclick = function() {
    const role = loginRole.value;
    const pass = loginPassword.value;

    if ((role === "Admin" && pass === "admin123") || 
        (role.startsWith("Agent") && pass === "agent123")) {
        currentUser = role;
        sessionStorage.setItem('crm_user', role);
        loginError.classList.add('hidden');
        loginPassword.value = '';
        checkAuth();
    } else {
        loginError.classList.remove('hidden');
    }
};

logoutBtn.onclick = function() {
    currentUser = null;
    sessionStorage.removeItem('crm_user');
    checkAuth();
};

function renderTable() {
    const searchTerm = searchInput.value.toLowerCase();
    tableBody.innerHTML = '';
    let visibleCount = 0;

    records.forEach(record => {
        if (currentUser !== "Admin" && record.agent !== currentUser) return;
        if (!record.name.toLowerCase().includes(searchTerm) && !record.status.toLowerCase().includes(searchTerm)) return;

        visibleCount++;

        const deleteActionHtml = currentUser === "Admin" 
            ? `<button onclick="deleteRecord(${record.id})" class="text-red-500 font-bold text-xs bg-red-50 px-2 py-1 rounded">Delete</button>` 
            : `<span class="text-gray-400 text-xs italic">Locked</span>`;

        const row = `
            <tr class="hover:bg-gray-50">
                <td class="p-4 font-semibold text-gray-900">${record.name}</td>
                <td class="p-4 text-gray-600">${record.agent}</td>
                <td class="p-4"><span class="px-2 py-1 rounded text-xs bg-yellow-100 text-yellow-800">${record.status}</span></td>
                <td class="p-4">${deleteActionHtml}</td>
            </tr>
        `;
        tableBody.insertAdjacentHTML('beforeend', row);
    });

    totalCount.textContent = visibleCount;
}

addRecordBtn.onclick = function() {
    const newName = prompt("Enter Customer Name:");
    if (!newName) return;
    
    const newRecord = {
        id: Date.now(),
        name: newName,
        agent: currentUser === "Admin" ? "Agent Alice" : currentUser,
        status: "Pending"
    };

    records.push(newRecord);
    localStorage.setItem('crm_records', JSON.stringify(records));
    renderTable();
};

window.deleteRecord = function(id) {
    if (currentUser !== "Admin") return;
    records = records.filter(r => r.id !== id);
    localStorage.setItem('crm_records', JSON.stringify(records));
    renderTable();
};

// --- CHAT LOGIC MODES ---
toggleChatBtn.onclick = function() {
    if (chatWindow.style.display === 'none' || chatWindow.style.display === '') {
        chatWindow.style.display = 'flex';
        renderMessages();
    } else {
        chatWindow.style.display = 'none';
    }
};

closeChatBtn.onclick = function() {
    chatWindow.style.display = 'none';
};

function renderMessages() {
    chatMessages.innerHTML = '';
    messages.forEach(msg => {
        const isMe = msg.sender === currentUser;
        const msgHtml = `
            <div class="flex flex-col ${isMe ? 'items-end' : 'items-start'}">
                <span class="text-[9px] text-gray-500">${msg.sender}</span>
                <div class="p-2 rounded text-white ${isMe ? 'bg-blue-600' : 'bg-gray-400'} max-w-[80%]">
                    ${msg.text}
                </div>
            </div>
        `;
        chatMessages.insertAdjacentHTML('beforeend', msgHtml);
    });
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

sendChatBtn.onclick = function() {
    const text = chatInput.value.trim();
    if (!text) return;

    messages.push({ sender: currentUser, text: text });
    localStorage.setItem('crm_messages', JSON.stringify(messages));
    chatInput.value = '';
    renderMessages();
};

if (searchInput) searchInput.oninput = renderTable;

checkAuth();