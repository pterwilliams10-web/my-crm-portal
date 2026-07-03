// 1. Starter mock data (Loads if the app is opened for the first time)
const defaultRecords = [
    { id: 1, name: "Tom Brown", agent: "Agent Alice", status: "Cancelled" },
    { id: 2, name: "Priya Patel", agent: "Agent Bob", status: "Hold" },
    { id: 3, name: "Mike Lee", agent: "Agent Alice", status: "Pending" }
];

// 2. Fetch records from browser memory, or use default mock data
let records = JSON.parse(localStorage.getItem('crm_records')) || defaultRecords;

// Elements from HTML
const tableBody = document.getElementById('tableBody');
const totalCount = document.getElementById('totalCount');
const roleSelector = document.getElementById('roleSelector');
const searchInput = document.getElementById('searchInput');
const addRecordBtn = document.getElementById('addRecordBtn');

// 3. Function to draw the table on your screen
function renderTable() {
    const currentRole = roleSelector.value;
    const searchTerm = searchInput.value.toLowerCase();
    
    tableBody.innerHTML = ''; // Clear previous elements
    let visibleCount = 0;

    records.forEach(record => {
        // ADMIN CONTROL FILTER: If an agent is selected, only show THEIR customers. Admins see everything!
        if (currentRole !== "Admin" && record.agent !== currentRole) return;

        // SEARCH FILTER
        if (!record.name.toLowerCase().includes(searchTerm) && !record.status.toLowerCase().includes(searchTerm)) return;

        visibleCount++;

        // Status Badge styling helper
        let statusColor = "bg-yellow-100 text-yellow-700";
        if (record.status === "Cancelled") statusColor = "bg-red-100 text-red-700";
        if (record.status === "Hold") statusColor = "bg-orange-100 text-orange-700";

        // Create table row HTML
        const row = `
            <tr class="hover:bg-gray-50 transition">
                <td class="p-4 font-semibold text-gray-900">${record.name}</td>
                <td class="p-4 text-gray-600">${record.agent}</td>
                <td class="p-4"><span class="px-2.5 py-1 rounded-full text-xs font-medium ${statusColor}">${record.status}</span></td>
                <td class="p-4">
                    <button onclick="deleteRecord(${record.id})" class="text-red-500 hover:text-red-700 font-medium text-xs cursor-pointer">Delete</button>
                </td>
            </tr>
        `;
        tableBody.insertAdjacentHTML('beforeend', row);
    });

    totalCount.textContent = visibleCount;
}

// 4. Feature: Add a New Record
addRecordBtn.addEventListener('click', () => {
    const newName = prompt("Enter Customer Name:");
    if (!newName) return;
    
    const newRecord = {
        id: Date.now(), // Unique ID
        name: newName,
        agent: roleSelector.value === "Admin" ? "Agent Alice" : roleSelector.value,
        status: "Pending"
    };

    records.push(newRecord);
    saveAndRefresh();
});

// 5. Feature: Delete a Record
window.deleteRecord = function(id) {
    records = records.filter(r => r.id !== id);
    saveAndRefresh();
}

// Helper to update storage and redraw screen
function saveAndRefresh() {
    localStorage.setItem('crm_records', JSON.stringify(records));
    renderTable();
}

// Listeners to redraw table automatically when changing values
roleSelector.addEventListener('change', renderTable);
searchInput.addEventListener('input', renderTable);

// Run on page startup
renderTable();