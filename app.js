// --- ⚙️ LIVE SUPABASE PRODUCTION CREDENTIALS ---
const supabaseUrl = 'https://ekebygvsqaetiqkdnvwd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVrZWJ5Z3ZzcWFldGlxa2RudndkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMxMDM5NzMsImV4cCI6MjA5ODY3OTk3M30.Hwb3kObgb5NCEQN0-khGzdY-LjWlqDkL8pNNenXpkOk';

// FIX: Changed 'supabase.createClient' to 'supabaseJS.createClient' to stop the double-declaration crash
const supabaseClientEngine = supabase.createClient(supabaseUrl, supabaseKey);
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

// --- 📋 APPLICATION DATA STATES ---
let records = [];
let profiles = [];
let messages = [];
let currentUser = sessionStorage.getItem('crm_user') || null;
let activeChatTarget = null;

// --- 🌐 ELEMENT IDENTIFIERS INTERACTION SELECTIONS ---
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

// Team Selectors
const adminManagementPanel = document.getElementById('adminManagementPanel');
const newAgentName = document.getElementById('newAgentName');
const newAgentPassword = document.getElementById('newAgentPassword');
const saveAgentBtn = document.getElementById('saveAgentBtn');
const adminRosterManagementContainer = document.getElementById('adminRosterManagementContainer');

// Chat Selectors
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

// --- 🛠️ SYNCHRONIZED APP LOGIC CONTROLLERS ---

// Pull data immediately upon boot up from live cloud tables
async function loadCloudData() {
    let { data: fetchedProfiles } = await supabase.from('crm_profiles').select('*');
    profiles = fetchedProfiles || [];

    let { data: fetchedMessages } = await supabase.from('crm_private_messages').select('*').order('timestamp', { ascending: true });
    messages = fetchedMessages || [];

    // LocalStorage tracking for Deal Pipeline Table rows
    records = JSON.parse(localStorage.getItem('crm_records')) || [
        { id: 1, name: "Tom Brown", agent: "Agent Alice", status: "Cancelled" },
        { id: 2, name: "Priya Patel", agent: "Agent Bob", status: "Hold" },
        { id: 3, name: "Mike Lee", agent: "Agent Alice", status: "Pending" }
    ];

    populateLoginOptions();
    checkAuth();
}

function populateLoginOptions() {
    if (!loginRole) return;
    const currentSelection = loginRole.value;
    loginRole.innerHTML = '';
    
    profiles.forEach(p => {
        const option = document.createElement('option');
        option.value = p.name;
        option.textContent = p.name === "Admin" ? "System Administrator (Peter)" : p.name;
        loginRole.appendChild(option);
    });
    if (currentSelection) loginRole.value = currentSelection;
}

function checkAuth() {
    if (currentUser && profiles.some(p => p.name === currentUser)) {
        if (loginGate) loginGate.style.display = 'none';
        if (userBadge) userBadge.textContent = currentUser;
        
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

if (saveAgentBtn) {
    saveAgentBtn.onclick = async function() {
        const nameClean = newAgentName.value.trim();
        const passClean = newAgentPassword.value.trim();

        if (!nameClean || !passClean) {
            alert("Error: All fields are required.");
            return;
        }

        if (profiles.some(p => p.name.toLowerCase() === nameClean.toLowerCase())) {
            alert("Error: Profile already exists.");
            return;
        }

        const { error } = await supabase.from('crm_profiles').insert([{ name: nameClean, pass: passClean }]);

        if (error) {
            alert("Database error: " + error.message);
        } else {
            newAgentName.value = '';
            newAgentPassword.value = '';
            alert(`Account created successfully for ${nameClean}!`);
        }
    };
}

function renderAdminManagementRoster() {
    if (!adminRosterManagementContainer) return;
    adminRosterManagementContainer.innerHTML = '';

    profiles.forEach(p => {
        const isSelf = p.name === "Admin";
        const deleteButtonHtml = isSelf 
            ? `<span class="text-[10px] text-gray-400 font-bold italic bg-gray-100 px-2 py-1 rounded-lg">System Lock</span>`
            : `<button onclick="deleteAgentProfile('${p.id}', '${p.name}')" class="bg-red-100 hover:bg-red-200 text-red-700 font-bold text-[11px] px-2 py-1 rounded-lg transition">Remove</button>`;

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

window.deleteAgentProfile = async function(id, profileName) {
    if (profileName === "Admin") return;
    if (!confirm(`Are you sure you want to permanently remove ${profileName}?`)) return;

    await supabase.from('crm_profiles').delete().eq('id', id);

    if (activeChatTarget === profileName) {
        activeChatTarget = null;
        if (chatTargetHeader) chatTargetHeader.textContent = "Select a colleague";
        if (chatInputArea) chatInputArea.classList.add('hidden');
    }
};

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
        if (msg.is_file) {
            displayContent = `
                <div class="mt-1 border-t border-white/20 pt-1.5 flex flex-col gap-1 text-[11px]">
                    <span class="font-bold">📄 File: ${msg.file_name}</span>
                    <a href="${msg.file_data}" download="${msg.file_name}" class="inline-block text-center bg-white text-blue-700 px-2 py-0.5 rounded font-bold mt-1 shadow-sm">Download</a>
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
    sendChatBtn.onclick = async function() {
        if (!chatInput) return;
        const text = chatInput.value.trim();
        if (!text || !activeChatTarget) return;

        const outgoingPayload = {
            sender: currentUser,
            recipient: activeChatTarget,
            text: text,
            is_file: false,
            timestamp: new Date().toISOString()
        };

        chatInput.value = '';
        await supabase.from('crm_private_messages').insert([outgoingPayload]);
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
        reader.onload = async function(event) {
            const filePayload = {
                sender: currentUser,
                recipient: activeChatTarget,
                is_file: true,
                file_name: file.name,
                file_data: event.target.result,
                timestamp: new Date().toISOString()
            };
            chatFileInput.value = '';
            await supabase.from('crm_private_messages').insert([filePayload]);
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

// --- ⚡ INSTANT CROSS-COMPUTER NETWORK BROADCAST WEBSOCKET ENGINE ---

// Listen for incoming message insertions globally
supabase
    .channel('messages-live-channel')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'crm_private_messages' }, payload => {
        messages.push(payload.new);
        renderMessages();
    })
    .subscribe();

// Listen for profile adjustments across the office roster
supabase
    .channel('profiles-live-channel')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'crm_profiles' }, payload => {
        profiles.push(payload.new);
        populateLoginOptions();
        renderRoster();
        if (currentUser === "Admin") renderAdminManagementRoster();
    })
    .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'crm_profiles' }, payload => {
        profiles = profiles.filter(p => p.id !== payload.old.id);
        populateLoginOptions();
        checkAuth();
        renderRoster();
        if (currentUser === "Admin") renderAdminManagementRoster();
    })
    .subscribe();

// Run startup engine execution sequence
loadCloudData();
// --- ⚡ INSTANT CROSS-COMPUTER NETWORK BROADCAST WEBSOCKET ENGINE ---

// A. Update this line to use 'supabaseClientEngine'
supabaseClientEngine
    .channel('messages-live-channel')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'crm_private_messages' }, payload => {
        messages.push(payload.new);
        renderMessages();
    })
    .subscribe();

// B. Update this line to use 'supabaseClientEngine'
supabaseClientEngine
    .channel('profiles-live-channel')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'crm_profiles' }, payload => {
        profiles.push(payload.new);
        populateLoginOptions();
        renderRoster();
        if (currentUser === "Admin") renderAdminManagementRoster();
    })
    .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'crm_profiles' }, payload => {
        profiles = profiles.filter(p => p.id !== payload.old.id);
        populateLoginOptions();
        checkAuth();
        renderRoster();
        if (currentUser === "Admin") renderAdminManagementRoster();
    })
    .subscribe();