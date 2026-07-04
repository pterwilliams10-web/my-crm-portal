const defaultRecords = [
    { id: 1, name: "Tom Brown", agent: "Agent Alice", status: "Cancelled" },
    { id: 2, name: "Priya Patel", agent: "Agent Bob", status: "Hold" },
    { id: 3, name: "Mike Lee", agent: "Agent Alice", status: "Pending" }
];

let records = JSON.parse(localStorage.getItem('crm_records')) || defaultRecords;
let currentUser = sessionStorage.getItem('crm_user') || null;

// Layout Selectors
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

// Private DM System Selectors
const chatWindow = document.getElementById('chatWindow');
const toggleChatBtn = document.getElementById('toggleChatBtn');
const closeChatBtn = document.getElementById('closeChatBtn');
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const sendChatBtn = document.getElementById('sendChatBtn');
const chatFileInput = document.getElementById('chatFileInput');
const fileAttachBtn = document.getElementById('fileAttachBtn');
const userSearchInput = document.getElementById('userSearchInput');
const userRosterList = document.getElementById('userRosterList');
const chatTargetHeader = document.getElementById('chatTargetHeader');
const chatInputArea = document.getElementById('chatInputArea');
const adminViewControls = document.getElementById('adminViewControls');
const adminViewIntermediary = document.getElementById('adminViewIntermediary');

// All available profiles in the company database
const companyUsers = ["Admin", "Agent Alice", "Agent Bob"];
let activeChatTarget = null; // The person you are chatting with

// Unified DM Database Structure
let messages = JSON.parse(localStorage.getItem('crm_private_messages')) || [
    { sender: "Admin", recipient: "Agent Alice", text: "Hey Alice, check out the new portal features!", isFile: false }
];

function checkAuth() {
    if (currentUser) {
        loginGate.style.display = 'none';
        userBadge.textContent = currentUser;
        renderTable();
        renderRoster();
    } else {
        loginGate.style.display = 'flex';
        chatWindow.style.display = 'none';
    }
}

submitLoginBtn.onclick = function() {
    const role = loginRole.value;
    const pass = loginPassword.value;

    if ((role === "Admin" && pass === "admin123") || (role.startsWith("Agent") && pass === "agent123")) {
        currentUser = role;
        sessionStorage.setItem('crm_user', role);
        loginError.classList.add('hidden');
        loginPassword.value = '';
        activeChatTarget = null;
        chatTargetHeader.textContent = "Select a colleague";
        chatInputArea.classList.add('hidden');
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
    const newRecord = { id: Date.now(), name: newName, agent: currentUser === "Admin" ? "Agent Alice" : currentUser, status: "Pending" };
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

// --- 👥 ROSTER GENERATION & TARGET SELECTION ---
function renderRoster() {
    const searchFilter = userSearchInput.value.toLowerCase();
    userRosterList.innerHTML = '';

    companyUsers.forEach(user => {
        // Employees do not display themselves in their own sidebar roster
        if (user === currentUser) return;
        if (!user.toLowerCase().includes(searchFilter)) return;

        const isSelected = activeChatTarget === user;
        const userRow = `
            <div onclick="selectChatTarget('${user}')" class="p-3 cursor-pointer transition font-medium ${isSelected ? 'bg-blue-50 border-l-4 border-blue-600 text-blue-900' : 'hover:bg-gray-100 text-gray-700'}">
                👤 ${user} ${user === "Admin" ? "(Peter)" : ""}
            </div>
        `;
        userRosterList.insertAdjacentHTML('beforeend', userRow);
    });
}

window.selectChatTarget = function(targetUser) {
    activeChatTarget = targetUser;
    renderRoster();
    chatInputArea.classList.remove('hidden');
    
    // --- 🛡️ EXCLUSIVE ADMIN MONITORING PRIVILEGES ---
    if (currentUser === "Admin") {
        adminViewControls.classList.remove('hidden');
        chatTargetHeader.textContent = `Monitoring: ${targetUser}`;
        
        // Populate specific target's other active links
        adminViewIntermediary.innerHTML = '';
        companyUsers.forEach(u => {
            if (u !== "Admin" && u !== targetUser) {
                adminViewIntermediary.insertAdjacentHTML('beforeend', `<option value="${u}">Chat with ${u}</option>`);
            }
        });
        adminViewIntermediary.onchange = renderMessages;
    } else {
        adminViewControls.classList.add('hidden');
        chatTargetHeader.textContent = `Conversation with ${targetUser}`;
    }
    
    renderMessages();
};

// --- 💬 PRIVATE DIRECT MESSAGE RENDERING ENGINE ---
function renderMessages() {
    chatMessages.innerHTML = '';
    if (!activeChatTarget) return;

    let viewer = currentUser;
    let peer = activeChatTarget;

    // Admin surveillance path override redirect
    if (currentUser === "Admin") {
        viewer = activeChatTarget;
        peer = adminViewIntermediary.value;
    }

    messages.forEach(msg => {
        // Filter out everything except the specific dialogue path between selected users
        const matchNormalPath = (msg.sender === viewer && msg.recipient === peer);
        const matchReversePath = (msg.sender === peer && msg.recipient === viewer);
        if (!matchNormalPath && !matchReversePath) return;

        // Visual orientation context alignment tags
        const isMe = msg.sender === currentUser;

        let displayContent = '';
        if (msg.isFile) {
            displayContent = `
                <div class="mt-1 border-t border-white/20 pt-1.5 flex flex-col gap-1 text-[11px]">
                    <span class="font-bold">📄 File: ${msg.fileName}</span>
                    <a href="${msg.fileData}" download="${msg.fileName}" class="inline-block text-center bg-white text-blue-700 px-2 py-0.5 rounded font-bold mt-1 shadow-sm">Download</a>
                </div>`;
        } else {
            // URL Link Finder Regex Match
            const urlPattern = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
            displayContent = msg.text.replace(urlPattern, '<a href="$1" target="_blank" class="underline text-yellow-200 font-bold">$1 🔗</a>');
        }

        const msgHtml = `
            <div class="flex flex-col ${isMe ? 'items-end' : 'items-start'}">
                <span class="text-[9px] text-gray-400 font-semibold">${msg.sender}</span>
                <div class="p-2 rounded-xl text-white ${isMe ? 'bg-blue-600' : 'bg-gray-600'} max-w-[85%] break-words">
                    ${displayContent}
                </div>
            </div>
        `;
        chatMessages.insertAdjacentHTML('beforeend', msgHtml);
    });
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

sendChatBtn.onclick = function() {
    const text = chatInput.value.trim();
    if (!text || !activeChatTarget) return;

    messages.push({
        sender: currentUser,
        recipient: activeChatTarget,
        text: text,
        isFile: false
    });

    localStorage.setItem('crm_private_messages', JSON.stringify(messages));
    chatInput.value = '';
    renderMessages();
};

fileAttachBtn.onclick = () => chatFileInput.click();

chatFileInput.onchange = function(e) {
    const file = e.target.files[0];
    if (!file || !activeChatTarget) return;

    if (file.size > 10 * 1024 * 1024) {
        alert("File Rejected: Max size limit is 10MB.");
        chatFileInput.value = '';
        return;
    }

    const reader = new FileReader();
    reader.onload = function(event) {
        messages.push({
            sender: currentUser,
            recipient: activeChatTarget,
            isFile: true,
            fileName: file.name,
            fileData: event.target.result
        });
        localStorage.setItem('crm_private_messages', JSON.stringify(messages));
        chatFileInput.value = '';
        renderMessages();
    };
    reader.readAsDataURL(file);
};

toggleChatBtn.onclick = function() {
    chatWindow.style.display = (chatWindow.style.display === 'none' || chatWindow.style.display === '') ? 'flex' : 'none';
    if (chatWindow.style.display === 'flex') {
        renderRoster();
        renderMessages();
    }
};

closeChatBtn.onclick = () => chatWindow.style.display = 'none';
userSearchInput.oninput = renderRoster;
if (searchInput) searchInput.oninput = renderTable;
chatInput.onkeypress = (e) => { if (e.key === 'Enter') sendChatBtn.onclick(); };

checkAuth();