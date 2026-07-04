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
const chatFileInput = document.getElementById('chatFileInput');
const fileAttachBtn = document.getElementById('fileAttachBtn');

let messages = JSON.parse(localStorage.getItem('crm_messages')) || [
    { sender: "System", text: "Welcome to the corporate portal! Feel free to share links or drop files up to 10MB.", isFile: false }
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

// --- 🌐 LINK DETECTOR HELPER ENGINE ---
function formatTextMessage(text) {
    // Regex that automatically finds URLs beginning with http:// or https://
    const urlPattern = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
    return text.replace(urlPattern, '<a href="$1" target="_blank" class="underline text-yellow-200 font-bold hover:text-white">$1 🔗</a>');
}

// --- 💬 CHAT LOGIC MODES WITH FILE TRANSFERS ---
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
        
        let displayContent = '';
        if (msg.isFile) {
            // Renders a stylized download module container for shared team files
            displayContent = `
                <div class="mt-1 border-t border-white/20 pt-1.5 flex flex-col gap-1 text-[11px]">
                    <span class="font-bold">📄 Shared File: ${msg.fileName}</span>
                    <a href="${msg.fileData}" download="${msg.fileName}" class="inline-block text-center bg-white text-blue-700 px-2 py-1 rounded font-bold mt-1 shadow-sm hover:bg-gray-100">⬇️ Download File</a>
                </div>`;
        } else {
            displayContent = formatTextMessage(msg.text);
        }

        const msgHtml = `
            <div class="flex flex-col ${isMe ? 'items-end' : 'items-start'}">
                <span class="text-[9px] text-gray-500 font-semibold">${msg.sender}</span>
                <div class="p-2.5 rounded-xl text-white ${isMe ? 'bg-blue-600' : 'bg-gray-600'} max-w-[85%] break-words">
                    ${displayContent}
                </div>
            </div>
        `;
        chatMessages.insertAdjacentHTML('beforeend', msgHtml);
    });
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Sending plain text messages
sendChatBtn.onclick = function() {
    const text = chatInput.value.trim();
    if (!text) return;

    messages.push({ sender: currentUser, text: text, isFile: false });
    localStorage.setItem('crm_messages', JSON.stringify(messages));
    chatInput.value = '';
    renderMessages();
};

// 📎 Clicking the clip icon fires open the system file chooser window
fileAttachBtn.onclick = function() {
    chatFileInput.click();
};

// File Upload Handler (Enforces 10MB Threshold limit)
chatFileInput.onchange = function(e) {
    const file = e.target.files[0];
    if (!file) return;

    const maxSizeBytes = 10 * 1024 * 1024; // 10MB calculation metric threshold
    if (file.size > maxSizeBytes) {
        alert("File Rejected: System blocks operations passing 10MB size limits.");
        chatFileInput.value = ''; // Reset slot
        return;
    }

    // Convert file into a link using JS FileReader
    const reader = new FileReader();
    reader.onload = function(event) {
        messages.push({
            sender: currentUser,
            isFile: true,
            fileName: file.name,
            fileData: event.target.result // Base64 data link stream
        });
        
        localStorage.setItem('crm_messages', JSON.stringify(messages));
        chatFileInput.value = ''; // Reset
        renderMessages();
    };
    reader.readAsDataURL(file);
};

if (searchInput) searchInput.oninput = renderTable;
chatInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendChatBtn.onclick(); });

checkAuth();