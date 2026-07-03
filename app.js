// Mock Database Records
const defaultRecords = [
    { id: 1, name: "Tom Brown", agent: "Agent Alice", status: "Cancelled" },
    { id: 2, name: "Priya Patel", agent: "Agent Bob", status: "Hold" },
    { id: 3, name: "Mike Lee", agent: "Agent Alice", status: "Pending" }
];

let records = JSON.parse(localStorage.getItem('crm_records')) || defaultRecords;
let currentUser = sessionStorage.getItem('crm_user') || null;

// HTML Element Selectors
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

// --- 🔒 LOGIN SECURITY FUNCTIONALITY ---
function checkAuth() {
    if (currentUser) {
        loginGate.classList.add('hidden');
        userBadge.textContent = currentUser;
        renderTable();
    } else {
        loginGate.classList.remove('hidden');
    }
}

submitLoginBtn.addEventListener('click', () => {
    const role = loginRole.value;
    const pass = loginPassword.value;

    // Secure authentication check conditions
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
});

logoutBtn.addEventListener('click', () => {
    currentUser = null;
    sessionStorage.removeItem('crm_user');
    checkAuth();
});

// --- 📊 CORE CRM TABLE & ADMIN CONTROL RIGHTS ---
function renderTable() {
    const searchTerm = searchInput.value.toLowerCase();
    tableBody.innerHTML = '';
    let visibleCount = 0;

    records.forEach(record => {
        // 🔒 ADMIN RIGHTS CONTROL: Agents are restricted. They can only see records assigned to them!
        if (currentUser !== "Admin" && record.agent !== currentUser) return;

        // Search Filter Engine
        if (!record.name.toLowerCase().includes(searchTerm) && !record.status.toLowerCase().includes(searchTerm)) return;

        visibleCount++;

        let statusColor = "bg-yellow-100 text-yellow-700";
        if (record.status === "Cancelled") statusColor = "bg-red-100 text-red-700";
        if (record.status === "Hold") statusColor = "bg-orange-100 text-orange-700";

        // 🔒 ADMIN RIGHTS CONTROL: Show 'Delete' button ONLY if the logged in user is the Admin!
        const deleteActionHtml = currentUser === "Admin" 
            ? `<button onclick="deleteRecord(${record.id})" class="text-red-500 hover:text-red-700 font-bold text-xs cursor-pointer bg-red-50 px-2 py-1 rounded-md">Delete</button>` 
            : `<span class="text-gray-400 text-xs italic">Locked</span>`;

        const row = `
            <tr class="hover:bg-gray-50/80 transition">
                <td class="p-4 font-semibold text-gray-900">${record.name}</td>
                <td class="p-4 text-gray-600 font-medium">${record.agent}</td>
                <td class="p-4"><span class="px-2.5 py-1 rounded-full text-xs font-semibold ${statusColor}">${record.status}</span></td>
                <td class="p-4">${deleteActionHtml}</td>
            </tr>
        `;
        tableBody.insertAdjacentHTML('beforeend', row);
    });

    totalCount.textContent = visibleCount;
}

// Add Records Action
addRecordBtn.addEventListener('click', () => {
    const newName = prompt("Enter Customer Name:");
    if (!newName) return;
    
    const newRecord = {
        id: Date.now(),
        name: newName,
        agent: currentUser === "Admin" ? "Agent Alice" : currentUser, // Default assign to self if agent
        status: "Pending"
    };

    records.push(newRecord);
    saveAndRefresh();
});

window.deleteRecord = function(id) {
    if (currentUser !== "Admin") {
        alert("Access Denied: Only Admin (Peter) can remove client files.");
        return;
    }
    records = records.filter(r => r.id !== id);
    saveAndRefresh();
}

function saveAndRefresh() {
    localStorage.setItem('crm_records', JSON.stringify(records));
    renderTable();
}

// --- 💬 FLOATING CHAT OPERATIONS ---
const chatWindow = document.getElementById('chatWindow');
const toggleChatBtn = document.getElementById('toggleChatBtn');
const closeChatBtn = document.getElementById('closeChatBtn');
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const sendChatBtn = document.getElementById('sendChatBtn');

let messages = JSON.parse(localStorage.getItem('crm_messages')) || [
    { sender: "Agent Alice", text: "Welcome to the central CRM feed! Updates post here.", time: "12:00 PM" }
];

toggleChatBtn.addEventListener('click', () => {
    chatWindow.classList.toggle('hidden');
    renderMessages();
});
closeChatBtn.addEventListener('click', () => chatWindow.classList.add('hidden'));

function renderMessages() {
    chatMessages.innerHTML = '';
    messages.forEach(msg => {
        const isMe = msg.sender === currentUser;
        const msgHtml = `
            <div class="flex flex-col ${isMe ? 'items-end' : 'items-start'}">
                <span class="text-[10px] text-gray-500 mb-0.5 font-medium">${msg.sender}</span>
                <div class="p-2.5 rounded-2xl max-w-[85%] font-medium ${isMe ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-gray-200 text-gray-800 rounded-tl-none'}">
                    ${msg.text}
                </div>
            </div>
        `;
        chatMessages.insertAdjacentHTML('beforeend', msgHtml);
    });
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function sendMessage() {
    const text = chatInput.value.trim();
    if (!text || !currentUser) return;

    const newMessage = {
        sender: currentUser,
        text: text,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    messages.push(newMessage);
    localStorage.setItem('crm_messages', JSON.stringify(messages));
    chatInput.value = '';
    renderMessages();
}

sendChatBtn.addEventListener('click', sendMessage);
chatInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendMessage(); });

searchInput.addEventListener('input', renderTable);
checkAuth(); // Instantiate security gate check on initial bootup