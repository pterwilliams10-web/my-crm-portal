const defaultRecords = [
    { id: 1, name: "Tom Brown", agent: "Agent Alice", status: "Cancelled" },
    { id: 2, name: "Priya Patel", agent: "Agent Bob", status: "Hold" },
    { id: 3, name: "Mike Lee", agent: "Agent Alice", status: "Pending" }
];

// Seed the initial structural accounts if empty
const initialAccounts = [
    { name: "Admin", pass: "admin123" },
    { name: "Agent Alice", pass: "agent123" },
    { name: "Agent Bob", pass: "agent123" }
];

if (!localStorage.getItem('crm_profiles')) {
    localStorage.setItem('crm_profiles', JSON.stringify(initialAccounts));
}

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

// Team Management Selectors
const adminManagementPanel = document.getElementById('adminManagementPanel');
const newAgentName = document.getElementById('newAgentName');
const newAgentPassword = document.getElementById('newAgentPassword');
const saveAgentBtn = document.getElementById('saveAgentBtn');
const adminRosterManagementContainer = document.getElementById('adminRosterManagementContainer');

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

let messages = JSON.parse(localStorage.getItem('crm_private_messages')) || [];

function getProfiles() {
    return JSON.parse(localStorage.getItem('crm_profiles')) || initialAccounts;
}

// Renders the selector drop-down container elements on the login page dynamically
function populateLoginOptions() {
    if (!loginRole) return;
    loginRole.innerHTML = '';
    const profiles = getProfiles();
    profiles.forEach(p => {
        const option = document.createElement('option');
        option.value = p.name;
        option.textContent = p.name === "Admin" ? "System Administrator (Peter)" : p.name;
        loginRole.appendChild(option);
    });
}

function checkAuth() {
    populateLoginOptions();
    const profiles = getProfiles();
    
    if (currentUser && profiles.some(p => p.name === currentUser)) {
        if (loginGate) loginGate.style.display = 'none';
        if (userBadge) userBadge.textContent = currentUser;
        
        // Show/Hide Administrative Panel base clearances
        if (currentUser === "Admin") {
            if (adminManagementPanel) adminManagementPanel.classList.remove('hidden');
            renderAdminManagementRoster();
        } else {
            if (adminManagementPanel) adminManagementPanel.classList.add('hidden');
        }
        
        renderTable();
        renderRoster();
    } else {
        currentUser = null;
        sessionStorage.removeItem('crm_user');
        if (loginGate) loginGate.style.display = 'flex';
        if (chatWindow) chatWindow.style.display = 'none';
        if (adminManagementPanel) adminManagementPanel.classList.add('hidden');
    }
}

if (submitLoginBtn) {
    submitLoginBtn.onclick = function() {
        const selectedRole = loginRole ? loginRole.value : "";
        const enteredPassword = loginPassword ? loginPassword.value : "";
        const profiles = getProfiles();

        const targetedUser = profiles.find(p => p.name === selectedRole);

        if (targetedUser && targetedUser.pass === enteredPassword) {
            currentUser = selectedRole;
            sessionStorage.setItem('crm_user', selectedRole);
            if (loginError) loginError.classList.add('hidden');
            if (loginPassword) loginPassword.value = '';
            activeChatTarget = null;
            if (chatTargetHeader) chatTargetHeader.textContent = "Select a colleague";
            if (chatInputArea) chatInputArea.classList.add('hidden');
            checkAuth();
        } else {
            if (loginError) loginError.classList.remove('hidden');
        }
    };
}

if (logoutBtn) {
    logoutBtn.onclick = function() {
        currentUser = null;
        sessionStorage.removeItem('crm_user');
        checkAuth();
    };
}

// --- ⚙️ ADMIN PROFILE WRITING & WIPING SYSTEM ENGINES ---
if (saveAgentBtn) {
    saveAgentBtn.onclick = function() {
        const nameClean = newAgentName.value.trim();
        const passClean = newAgentPassword.value.trim();

        if (!nameClean || !passClean) {
            alert("Error: All profile entry cells require parameters.");
            return;
        }

        let currentProfiles = getProfiles();

        if (currentProfiles.some(p => p.name.toLowerCase() === nameClean.toLowerCase())) {
            alert("Error: Profile identifier matches existing credentials.");
            return;
        }

        currentProfiles.push({ name: nameClean, pass: passClean });
        localStorage.setItem('crm_profiles', JSON.stringify(currentProfiles));

        newAgentName.value = '';
        newAgentPassword.value = '';
        
        renderAdminManagementRoster();
        populateLoginOptions();
        renderRoster();
        alert(`Account created successfully for ${nameClean}!`);
    };
}

function renderAdminManagementRoster() {
    if (!adminRosterManagementContainer) return;
    adminRosterManagementContainer.innerHTML = '';
    const profiles = getProfiles();

    profiles.forEach(p => {
        // Safe lock checking configuration block—preventing admin automated removal hooks
        const isSelf = p.name === "Admin";
        const deleteButtonHtml = isSelf 
            ? `<span class="text-[10px] text-gray-400 font-bold italic bg-gray-100 px-2 py-1 rounded-lg">System Lock</span>`
            : `<button onclick="deleteAgentProfile('${p.name}')" class="bg-red-100 hover:bg-red-200 text-red-700 font-bold text-[11px] px-2 py-1 rounded-lg transition">Remove</button>`;

        const userItemHtml = `
            <div class="flex justify-between items-center bg-white border border-gray-200 p-2.5 rounded-lg shadow-xs">
                <div class="flex flex-col">
                    <span class="text-xs font-bold text-gray-800">${p.name}</span>
                    <span class="text-[10px] text-gray-400 font-mono">Pass: ${p.pass}</span>
                </div>
                ${deleteButtonHtml}
            </div>
        `;
        adminRosterManagementContainer.insertAdjacentHTML('beforeend', userItemHtml);
    });
}

window.deleteAgentProfile = function(profileName) {
    if (profileName === "Admin") return;
    if (!confirm(`Are you sure you want to permanently remove ${profileName} from the organization?`)) return;

    let currentProfiles = getProfiles();
    currentProfiles = currentProfiles.filter(p => p.name !== profileName);
    localStorage.setItem('crm_profiles', JSON.stringify(currentProfiles));

    // Reset targeted chats if currently observing deleted user channel lines
    if (activeChatTarget === profileName) {
        activeChatTarget = null;
        if (chatTargetHeader) chatTargetHeader.textContent = "Select a colleague";
        if (chatInputArea) chatInputArea.classList.add('hidden');
    }

    renderAdminManagementRoster();
    populateLoginOptions();
    renderRoster();
};

// --- CRM Tables Render Core Engine ---
function renderTable() {
    if (!tableBody) return;
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : "";
    tableBody.innerHTML = '';
    let visibleCount = 0;

    records.forEach(record => {
        if (currentUser !== "Admin" && record.agent !== currentUser) return;
        if (searchTerm && !record.name.toLowerCase().includes(searchTerm) && !record.status.toLowerCase().includes(searchTerm)) return;

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
    if (totalCount) totalCount.textContent = visibleCount;
}

if (addRecordBtn) {
    addRecordBtn.onclick = function() {
        const newName = prompt("Enter Customer Name:");
        if (!newName) return;
        const newRecord = { id: Date.now(), name: newName, agent: currentUser === "Admin" ? "Agent Alice" : currentUser, status: "Pending" };
        records.push(newRecord);
        localStorage.setItem('crm_records', JSON.stringify(records));
        renderTable();
    };
}

window.deleteRecord = function(id) {
    if (currentUser !== "Admin") return;
    records = records.filter(r => r.id !== id);
    localStorage.setItem('crm_records', JSON.stringify(records));
    renderTable();
};

function renderRoster() {
    if (!userRosterList) return;
    const searchFilter = userSearchInput ? userSearchInput.value.toLowerCase() : "";
    userRosterList.innerHTML = '';
    
    const profiles = getProfiles();

    profiles.forEach(p => {
        if (p.name === currentUser) return;
        if (searchFilter && !p.name.toLowerCase().includes(searchFilter)) return;

        const isSelected = activeChatTarget === p.name;
        const userRow = `
            <div onclick="selectChatTarget('${p.name}')" class="p-3 cursor-pointer transition font-medium ${isSelected ? 'bg-blue-50 border-l-4 border-blue-600 text-blue-900' : 'hover:bg-gray-100 text-gray-700'}">
                👤 ${p.name} ${p.name === "Admin" ? "(Peter)" : ""}
            </div>
        `;
        userRosterList.insertAdjacentHTML('beforeend', userRow);
    });
}

window.selectChatTarget = function(targetUser) {
    activeChatTarget = targetUser;
    renderRoster();
    if (chatInputArea) chatInputArea.classList.remove('hidden');
    
    const profiles = getProfiles();

    if (currentUser === "Admin") {
        if (adminViewControls) adminViewControls.classList.remove('hidden');
        if (chatTargetHeader) chatTargetHeader.textContent = `Monitoring: ${targetUser}`;
        
        if (adminViewIntermediary) {
            adminViewIntermediary.innerHTML = '';
            profiles.forEach(p => {
                if (p.name !== "Admin" && p.name !== targetUser) {
                    adminViewIntermediary.insertAdjacentHTML('beforeend', `<option value="${p.name}">Chat with ${p.name}</option>`);
                }
            });
            adminViewIntermediary.onchange = renderMessages;
        }
    } else {
        if (adminViewControls) adminViewControls.classList.add('hidden');
        if (chatTargetHeader) chatTargetHeader.textContent = `Conversation with ${targetUser}`;
    }
    
    renderMessages();
};

function formatTimestamp(timestampStr) {
    if (!timestampStr) return "";
    const date = new Date(timestampStr);
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ', ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function renderMessages() {
    if (!chatMessages || !activeChatTarget) return;
    const isScrolledToBottom = chatMessages.scrollHeight - chatMessages.clientHeight <= chatMessages.scrollTop + 30;
    chatMessages.innerHTML = '';

    let viewer = currentUser;
    let peer = activeChatTarget;

    if (currentUser === "Admin" && adminViewIntermediary && adminViewIntermediary.value) {
        viewer = activeChatTarget;
        peer = adminViewIntermediary.value;
    }

    messages.forEach(msg => {
        const matchNormalPath = (msg.sender === viewer && msg.recipient === peer);
        const matchReversePath = (msg.sender === peer && msg.recipient === viewer);
        if (!matchNormalPath && !matchReversePath) return;

        const isMe = msg.sender === currentUser;
        const displayTime = formatTimestamp(msg.timestamp);

        let displayContent = '';
        if (msg.isFile) {
            displayContent = `
                <div class="mt-1 border-t border-white/20 pt-1.5 flex flex-col gap-1 text-[11px]">
                    <span class="font-bold">📄 File: ${msg.fileName}</span>
                    <a href="${msg.fileData}" download="${msg.fileName}" class="inline-block text-center bg-white text-blue-700 px-2 py-0.5 rounded font-bold mt-1 shadow-sm">Download</a>
                </div>`;
        } else {
            const urlPattern = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
            displayContent = msg.text.replace(urlPattern, '<a href="$1" target="_blank" class="underline text-yellow-200 font-bold">$1 🔗</a>');
        }

        const msgHtml = `
            <div class="flex flex-col ${isMe ? 'items-end' : 'items-start'}">
                <span class="text-[9px] text-gray-400 font-semibold">${msg.sender}</span>
                <div class="p-2 rounded-xl text-white ${isMe ? 'bg-blue-600' : 'bg-gray-600'} max-w-[85%] break-words">
                    ${displayContent}
                </div>
                <span class="text-[8px] text-gray-400 mt-0.5 px-1">${displayTime}</span>
            </div>
        `;
        chatMessages.insertAdjacentHTML('beforeend', msgHtml);
    });

    if (isScrolledToBottom) chatMessages.scrollTop = chatMessages.scrollHeight;
}

if (sendChatBtn) {
    sendChatBtn.onclick = function() {
        if (!chatInput) return;
        const text = chatInput.value.trim();
        if (!text || !activeChatTarget) return;

        messages.push({
            sender: currentUser,
            recipient: activeChatTarget,
            text: text,
            isFile: false,
            timestamp: new Date().toISOString()
        });

        localStorage.setItem('crm_private_messages', JSON.stringify(messages));
        chatInput.value = '';
        renderMessages();
    };
}

if (fileAttachBtn) fileAttachBtn.onclick = () => { if (chatFileInput) chatFileInput.click(); };

if (chatFileInput) {
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
                fileData: event.target.result,
                timestamp: new Date().toISOString()
            });
            localStorage.setItem('crm_private_messages', JSON.stringify(messages));
            chatFileInput.value = '';
            renderMessages();
        };
        reader.readAsDataURL(file);
    };
}

if (toggleChatBtn) {
    toggleChatBtn.onclick = function() {
        if (!chatWindow) return;
        chatWindow.style.display = (chatWindow.style.display === 'none' || chatWindow.style.display === '') ? 'flex' : 'none';
        if (chatWindow.style.display === 'flex') {
            renderRoster();
            renderMessages();
        }
    };
}

if (closeChatBtn) closeChatBtn.onclick = () => { if (chatWindow) chatWindow.style.display = 'none'; };
if (userSearchInput) userSearchInput.oninput = renderRoster;
if (searchInput) searchInput.oninput = renderTable;
if (chatInput) {
    chatInput.onkeypress = (e) => { 
        if (e.key === 'Enter' && sendChatBtn) sendChatBtn.onclick(); 
    };
}

// Polling interval sync checks
setInterval(function() {
    if (chatWindow && chatWindow.style.display === 'flex' && activeChatTarget) {
        const localStoreMessages = JSON.parse(localStorage.getItem('crm_private_messages')) || [];
        if (localStoreMessages.length !== messages.length) {
            messages = localStoreMessages;
            renderMessages();
        }
    }
}, 1000);

checkAuth();