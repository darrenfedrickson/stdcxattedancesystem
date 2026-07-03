document.addEventListener('DOMContentLoaded', () => {

    const filterBatch = document.getElementById('filter-batch');
    const filterStudent = document.getElementById('filter-student');
    const filterStartDate = document.getElementById('filter-start-date');
    const filterEndDate = document.getElementById('filter-end-date');
    const filterAction = document.getElementById('filter-action');
    const btnApplyFilters = document.getElementById('btn-apply-filters');
    
    const logsTbody = document.getElementById('logs-tbody');
    const logsTimeline = document.getElementById('logs-timeline');
    
    const viewTable = document.getElementById('view-table');
    const viewTimeline = document.getElementById('view-timeline');
    const viewGrid = document.getElementById('view-grid');
    const viewPerformance = document.getElementById('view-performance');
    
    const tableContainer = document.getElementById('table-container');
    const timelineContainer = document.getElementById('timeline-container');
    const gridContainer = document.getElementById('grid-container');
    const performanceContainer = document.getElementById('performance-container');
    
    const logsGrid = document.getElementById('logs-grid');
    const performanceSummary = document.getElementById('performance-summary');
    const performanceTbody = document.getElementById('performance-tbody');

    // 1. Fetch Dashboard Filters
    function fetchDashboardFilters() {
        Promise.all([
            fetch('../api/admin/get_batches.php').then(r => r.json()),
            fetch('../api/admin/get_students.php').then(r => r.json())
        ]).then(([batchRes, studentRes]) => {
            if (batchRes.success) allBatches = batchRes.data;
            if (studentRes.success) allStudents = studentRes.data;

            // Save current selections
            const currentBatch = filterBatch.value;
            const currentStudent = filterStudent.value;

            // Populate Batch dropdown
            filterBatch.innerHTML = '<option value="">All Batches</option>';
            allBatches.forEach(b => {
                filterBatch.innerHTML += `<option value="${b.id}" ${currentBatch == b.id ? 'selected' : ''}>${b.name}</option>`;
            });

            // Populate Student dropdown based on selected batch
            const populateStudents = () => {
                const selectedBatch = filterBatch.value;
                filterStudent.innerHTML = '<option value="">All Students</option>';
                allStudents.forEach(s => {
                    if (!selectedBatch || s.batch_id == selectedBatch) {
                        filterStudent.innerHTML += `<option value="${s.id}">${s.full_name}</option>`;
                    }
                });
                if (currentStudent && Array.from(filterStudent.options).some(o => o.value == currentStudent)) {
                    filterStudent.value = currentStudent;
                }
            };

            populateStudents();

            filterBatch.onchange = () => {
                populateStudents();
            };

            // Call initial fetchLogs only after allStudents is loaded
            fetchLogs();
        });
    }

    // --- Registry Modal Logic (Folders) ---
    const btnOpenRegistry = document.getElementById('btn-open-registry');
    const btnCloseRegistry = document.getElementById('btn-close-registry');
    const btnCloseRegistryRight = document.getElementById('btn-close-registry-right');
    const registryOverlay = document.getElementById('registry-overlay');
    const registryModal = document.getElementById('registry-modal');
    
    const batchListContainer = document.getElementById('batch-list-container');
    const studentListContainer = document.getElementById('student-list-container');
    
    const btnAddBatch = document.getElementById('btn-add-batch');
    const newBatchName = document.getElementById('new-batch-name');
    
    const currentBatchTitle = document.getElementById('current-batch-title');
    const btnDeleteBatch = document.getElementById('btn-delete-batch');
    
    const addStudentBar = document.getElementById('add-student-bar');
    const newStudentName = document.getElementById('new-student-name');
    const btnAddStudent = document.getElementById('btn-add-student');
    
    const bulkActionBar = document.getElementById('bulk-action-bar');
    const bulkCountSpan = document.getElementById('bulk-count');
    const bulkMoveSelect = document.getElementById('bulk-move-select');
    const btnBulkMove = document.getElementById('btn-bulk-move');
    const btnViewTrash = document.getElementById('btn-view-trash');

    let allBatches = [];
    let allStudents = [];
    let attendanceChartInstance = null;
    let allTrashedBatches = [];
    let activeBatchId = null;
    let selectedStudentIds = new Set();
    let viewMode = 'batches'; // 'batches' or 'trash'

    // Custom Glassy Confirm
    function customConfirm(title, message, onConfirm) {
        const confirmOverlay = document.getElementById('confirm-overlay');
        const confirmModal = document.getElementById('confirm-modal');
        document.getElementById('confirm-title').textContent = title;
        document.getElementById('confirm-message').textContent = message;
        
        confirmOverlay.classList.remove('opacity-0', 'pointer-events-none');
        confirmModal.classList.remove('scale-95', 'opacity-0');
        confirmModal.classList.add('scale-100', 'opacity-100');

        const close = () => {
            confirmOverlay.classList.add('opacity-0', 'pointer-events-none');
            confirmModal.classList.remove('scale-100', 'opacity-100');
            confirmModal.classList.add('scale-95', 'opacity-0');
        };

        document.getElementById('btn-confirm-cancel').onclick = close;
        document.getElementById('btn-confirm-ok').onclick = () => {
            close();
            onConfirm();
        };
    }

    function openRegistry() {
        registryOverlay.classList.remove('opacity-0', 'pointer-events-none');
        registryModal.classList.remove('scale-95', 'opacity-0');
        registryModal.classList.add('scale-100', 'opacity-100');
        viewMode = 'batches';
        fetchRegistryData();
    }

    function closeRegistry() {
        registryOverlay.classList.add('opacity-0', 'pointer-events-none');
        registryModal.classList.remove('scale-100', 'opacity-100');
        registryModal.classList.add('scale-95', 'opacity-0');
        activeBatchId = null;
        selectedStudentIds.clear();
        viewMode = 'batches';
        updateStudentPane();
    }

    function fetchRegistryData() {
        // Auto empty old trash
        fetch('../api/admin/empty_trash.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'auto' })
        }).then(() => {
            Promise.all([
                fetch('../api/admin/get_batches.php').then(r => r.json()),
                fetch('../api/admin/get_students.php').then(r => r.json()),
                fetch('../api/admin/get_trashed_batches.php').then(r => r.json())
            ]).then(([batchRes, studentRes, trashRes]) => {
                if (batchRes.success) allBatches = batchRes.data;
                if (studentRes.success) allStudents = studentRes.data;
                if (trashRes.success) allTrashedBatches = trashRes.data;
                
                if (viewMode === 'batches') {
                    renderBatchList();
                    updateStudentPane();
                } else {
                    renderTrashList();
                }
                
                updateBulkSelect();
                fetchDashboardFilters(); // Also keep the dashboard filters updated
            });
        });
    }

    if (btnViewTrash) {
        btnViewTrash.addEventListener('click', () => {
            viewMode = viewMode === 'batches' ? 'trash' : 'batches';
            btnViewTrash.innerHTML = viewMode === 'trash' ? 
                '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg><span>Back to Folders</span>' : 
                '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg><span>View Trash</span>';
            activeBatchId = null;
            selectedStudentIds.clear();
            fetchRegistryData();
        });
    }

    function renderTrashList() {
        batchListContainer.innerHTML = '';
        currentBatchTitle.innerHTML = `<svg class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg><span>Trash Bin</span>`;
        btnDeleteBatch.classList.add('hidden');
        addStudentBar.classList.add('hidden');
        updateBulkActionBar();

        studentListContainer.innerHTML = `
            <div class="mb-4 flex justify-end">
                <button id="btn-empty-trash" class="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors focus:outline-none shadow-sm flex items-center gap-2">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    Empty Trash
                </button>
            </div>
            <ul class="space-y-3 pb-20" id="trash-ul"></ul>
        `;

        const trashUl = document.getElementById('trash-ul');

        if (allTrashedBatches.length === 0) {
            trashUl.innerHTML = '<div class="h-full flex flex-col items-center justify-center text-neutral-400 text-sm py-10"><p>Trash is empty.</p></div>';
            document.getElementById('btn-empty-trash').classList.add('hidden');
            return;
        }

        allTrashedBatches.forEach(b => {
            const li = document.createElement('li');
            li.className = 'bg-white border border-red-200 rounded-xl p-4 flex items-center justify-between shadow-sm';
            li.innerHTML = `
                <div>
                    <h4 class="font-medium text-neutral-900">${b.name}</h4>
                    <p class="text-xs text-red-600 mt-1">Deleted: ${new Date(b.deleted_at).toLocaleDateString()} &bull; ${b.student_count} students hidden</p>
                </div>
                <div class="flex gap-2">
                    <button class="bg-neutral-100 text-neutral-700 hover:bg-neutral-200 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors btn-restore-batch">Restore</button>
                    <button class="bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors btn-purge-batch">Delete Permanently</button>
                </div>
            `;

            li.querySelector('.btn-restore-batch').addEventListener('click', () => {
                customConfirm('Restore Folder?', `Restore "${b.name}" from trash?`, () => {
                    fetch('../api/admin/restore_batch.php', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id: b.id })
                    }).then(r => r.json()).then(d => {
                        if (d.success) fetchRegistryData();
                    });
                });
            });

            li.querySelector('.btn-purge-batch').addEventListener('click', () => {
                customConfirm('Permanent Delete', `Are you absolutely sure you want to permanently delete "${b.name}"? This cannot be undone.`, () => {
                    fetch('../api/admin/empty_trash.php', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'single', id: b.id })
                    }).then(r => r.json()).then(d => {
                        if (d.success) fetchRegistryData();
                    });
                });
            });

            trashUl.appendChild(li);
        });

        document.getElementById('btn-empty-trash').addEventListener('click', () => {
            customConfirm('Empty Trash?', "Are you sure you want to empty the trash? ALL folders and students inside will be permanently deleted!", () => {
                fetch('../api/admin/empty_trash.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'all' })
                }).then(r => r.json()).then(d => {
                    if (d.success) fetchRegistryData();
                });
            });
        });
    }

    function renderBatchList() {
        batchListContainer.innerHTML = '';
        allBatches.forEach(b => {
            const div = document.createElement('div');
            div.className = `p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-colors ${activeBatchId == b.id ? 'bg-blue-50 border-blue-200 text-blue-900' : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50'}`;
            div.innerHTML = `
                <svg class="w-5 h-5 ${activeBatchId == b.id ? 'text-blue-500' : 'text-neutral-400'}" fill="${activeBatchId == b.id ? 'currentColor' : 'none'}" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path></svg>
                <div class="flex-1 overflow-hidden">
                    <input type="text" class="text-sm font-medium text-neutral-900 bg-transparent border-none p-0 focus:ring-0 w-full truncate ${activeBatchId == b.id ? 'text-blue-900' : 'text-neutral-900'}" value="${b.name}" readonly title="Double click to rename">
                    <p class="text-xs ${activeBatchId == b.id ? 'text-blue-600' : 'text-neutral-500'}">${b.student_count} students</p>
                </div>
            `;
            
            const nameInput = div.querySelector('input[type="text"]');

            // Inline Edit Logic for Batch Name
            nameInput.addEventListener('dblclick', (e) => {
                e.stopPropagation(); // prevent clicking div
                nameInput.removeAttribute('readonly');
                nameInput.className = "text-sm font-medium text-neutral-900 bg-white border border-blue-500 px-2 py-1 rounded focus:outline-none w-full";
                nameInput.focus();
            });
            nameInput.addEventListener('blur', () => {
                if (nameInput.value !== b.name) {
                    saveBatchEdit(b.id, nameInput.value);
                } else {
                    renderBatchList(); // reset view
                }
            });
            nameInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') nameInput.blur();
            });

            div.addEventListener('click', () => {
                if (!nameInput.hasAttribute('readonly')) return; // Don't trigger batch change while renaming
                if (activeBatchId === b.id) return; // Prevent re-render so double-click works!
                
                activeBatchId = b.id;
                selectedStudentIds.clear();
                renderBatchList();
                updateStudentPane();
            });
            batchListContainer.appendChild(div);
        });
    }

    function saveBatchEdit(id, newName) {
        fetch('../api/admin/edit_batch.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, name: newName })
        }).then(r => r.json()).then(d => {
            if (d.success) fetchRegistryData();
            else {
                alert(d.error);
                fetchRegistryData(); // revert
            }
        });
    }

    function updateStudentPane() {
        if (!activeBatchId) {
            currentBatchTitle.innerHTML = `<svg class="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path></svg><span>Select a Batch</span>`;
            btnDeleteBatch.classList.add('hidden');
            addStudentBar.classList.add('hidden');
            studentListContainer.innerHTML = '<div class="h-full flex items-center justify-center text-neutral-400 text-sm">Select a folder on the left to view students.</div>';
            updateBulkActionBar();
            return;
        }

        const batch = allBatches.find(b => b.id == activeBatchId);
        currentBatchTitle.innerHTML = `<svg class="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 24 24"><path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path></svg><span>${batch.name}</span>`;
        btnDeleteBatch.classList.remove('hidden');
        addStudentBar.classList.remove('hidden');

        const studentsInBatch = allStudents.filter(s => s.batch_id == activeBatchId);
        studentListContainer.innerHTML = '';

        if (studentsInBatch.length === 0) {
            studentListContainer.innerHTML = '<div class="h-full flex items-center justify-center text-neutral-400 text-sm">This folder is empty.</div>';
        } else {
            const ul = document.createElement('ul');
            ul.className = 'space-y-2 pb-20';
            studentsInBatch.forEach(s => {
                const li = document.createElement('li');
                const isSelected = selectedStudentIds.has(s.id);
                li.className = `border rounded-xl p-3 flex items-center justify-between transition-colors ${isSelected ? 'bg-blue-50 border-blue-200' : 'bg-white border-neutral-200 hover:border-neutral-300'}`;
                
                li.innerHTML = `
                    <div class="flex items-center gap-3 flex-1 overflow-hidden">
                        <input type="checkbox" class="w-4 h-4 flex-shrink-0 rounded border-neutral-300 text-blue-600 focus:ring-blue-600 cursor-pointer" ${isSelected ? 'checked' : ''}>
                        <input type="text" class="text-sm font-medium text-neutral-900 bg-transparent border-none p-0 focus:ring-0 w-full truncate ${isSelected ? '' : ''}" value="${s.full_name}" readonly title="Double click to edit">
                    </div>
                    <div class="flex flex-col sm:flex-row items-end sm:items-center mt-2 sm:mt-0 gap-2">
                        <button class="text-xs font-medium px-2 py-1 rounded-md border ${s.has_face ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100'} flex items-center justify-center btn-enroll-face focus:outline-none" title="${s.has_face ? 'Re-enroll Face' : 'Enroll Face'}">
                            <svg class="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            ${s.has_face ? 'Face Enrolled' : 'Add Face'}
                        </button>
                        <button class="text-neutral-400 hover:text-red-600 focus:outline-none p-1 flex-shrink-0 btn-del-student" title="Delete Student">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                    </div>
                `;

                const checkbox = li.querySelector('input[type="checkbox"]');
                const nameInput = li.querySelector('input[type="text"]');
                const btnEnrollFace = li.querySelector('.btn-enroll-face');
                const delBtn = li.querySelector('.btn-del-student');

                btnEnrollFace.addEventListener('click', (e) => {
                    e.stopPropagation();
                    openFaceEnrollment(s.id, s.full_name);
                });

                checkbox.addEventListener('change', (e) => {
                    if (e.target.checked) selectedStudentIds.add(s.id);
                    else selectedStudentIds.delete(s.id);
                    updateStudentPane();
                });

                // Inline Edit Logic
                nameInput.addEventListener('dblclick', () => {
                    nameInput.removeAttribute('readonly');
                    nameInput.className = "text-sm font-medium text-neutral-900 bg-white border border-blue-500 px-2 py-1 rounded focus:outline-none w-full";
                    nameInput.focus();
                });
                nameInput.addEventListener('blur', () => {
                    saveNameEdit(s.id, nameInput.value, s.batch_id);
                });
                nameInput.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') nameInput.blur();
                });

                delBtn.addEventListener('click', () => {
                    if (confirm(`Remove ${s.full_name}?`)) {
                        fetch('../api/admin/delete_student.php', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ id: s.id })
                        }).then(r => r.json()).then(d => {
                            if (d.success) fetchRegistryData();
                        });
                    }
                });

                ul.appendChild(li);
            });
            studentListContainer.appendChild(ul);
        }

        updateBulkActionBar();
    }

    function saveNameEdit(id, newName, batchId) {
        fetch('../api/admin/edit_student.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, full_name: newName, batch_id: batchId })
        }).then(r => r.json()).then(d => {
            if (d.success) fetchRegistryData();
            else alert(d.error);
        });
    }

    function updateBulkSelect() {
        bulkMoveSelect.innerHTML = '<option value="">Move to folder...</option>';
        allBatches.forEach(b => {
            // Don't show current batch in move list
            if (b.id != activeBatchId) {
                bulkMoveSelect.innerHTML += `<option value="${b.id}">${b.name}</option>`;
            }
        });
    }

    function updateBulkActionBar() {
        if (selectedStudentIds.size > 0) {
            bulkActionBar.classList.remove('hidden');
            bulkCountSpan.textContent = selectedStudentIds.size;
            btnBulkMove.classList.remove('hidden');
        } else {
            bulkActionBar.classList.add('hidden');
        }
        updateBulkSelect();
    }

    // Add Batch
    if (btnAddBatch) {
        btnAddBatch.addEventListener('click', () => {
            const name = newBatchName.value.trim();
            if (!name) return;
            fetch('../api/admin/add_batch.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name })
            }).then(r => r.json()).then(d => {
                if (d.success) {
                    newBatchName.value = '';
                    fetchRegistryData();
                } else alert(d.error);
            });
        });
    }

    // Delete Batch
    if (btnDeleteBatch) {
        btnDeleteBatch.addEventListener('click', () => {
            const batch = allBatches.find(b => b.id == activeBatchId);
            customConfirm('Delete Folder?', `Move folder "${batch.name}" to the Trash? It will be automatically deleted after 30 days.`, () => {
                fetch('../api/admin/delete_batch.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: activeBatchId })
                }).then(r => r.json()).then(d => {
                    if (d.success) {
                        activeBatchId = null;
                        fetchRegistryData();
                    } else alert(d.error);
                });
            });
        });
    }

    // Add Student to Active Batch
    if (btnAddStudent) {
        btnAddStudent.addEventListener('click', () => {
            const name = newStudentName.value.trim();
            if (!name || !activeBatchId) return;
            fetch('../api/admin/add_student.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ full_name: name, batch_id: activeBatchId })
            }).then(r => r.json()).then(d => {
                if (d.success) {
                    newStudentName.value = '';
                    fetchRegistryData();
                } else alert(d.error);
            });
        });
    }

    // Bulk Move Students
    if (btnBulkMove) {
        btnBulkMove.addEventListener('click', () => {
            const targetBatchId = bulkMoveSelect.value;
            if (!targetBatchId || selectedStudentIds.size === 0) return;
            
            fetch('../api/admin/bulk_move_students.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ student_ids: Array.from(selectedStudentIds), target_batch_id: targetBatchId })
            }).then(r => r.json()).then(d => {
                if (d.success) {
                    selectedStudentIds.clear();
                    fetchRegistryData();
                } else alert(d.error);
            });
        });
    }

    if (btnOpenRegistry) btnOpenRegistry.addEventListener('click', openRegistry);
    if (btnCloseRegistry) btnCloseRegistry.addEventListener('click', closeRegistry);
    if (btnCloseRegistryRight) btnCloseRegistryRight.addEventListener('click', closeRegistry);
    // --- End Registry Modal Logic (Folders) ---

    // 3. View toggles
    function updateViewToggles(active) {
        const activeClass = "px-3 py-1 text-sm font-medium rounded-md bg-white shadow-sm text-neutral-900 transition-all flex items-center gap-1";
        const inactiveClass = "px-3 py-1 text-sm font-medium rounded-md text-neutral-500 hover:text-neutral-900 transition-all flex items-center gap-1";
        
        viewTable.className = active === 'table' ? activeClass : inactiveClass;
        viewTimeline.className = active === 'timeline' ? activeClass : inactiveClass;
        viewGrid.className = active === 'grid' ? activeClass : inactiveClass;
        if (viewPerformance) viewPerformance.className = active === 'performance' ? activeClass : inactiveClass;
        
        tableContainer.classList.toggle('hidden', active !== 'table');
        timelineContainer.classList.toggle('hidden', active !== 'timeline');
        gridContainer.classList.toggle('hidden', active !== 'grid');
        performanceContainer.classList.toggle('hidden', active !== 'performance');
        
        // if (active === 'timeline' || active === 'grid') setTimeout(() => map.invalidateSize(), 100);
        
        if (active === 'performance') {
            fetchPerformanceAnalytics();
        }
    }

    viewTable.addEventListener('click', () => updateViewToggles('table'));
    viewTimeline.addEventListener('click', () => updateViewToggles('timeline'));
    viewGrid.addEventListener('click', () => updateViewToggles('grid'));
    if (viewPerformance) viewPerformance.addEventListener('click', () => updateViewToggles('performance'));

    // --- Performance Analytics Logic ---
    function fetchPerformanceAnalytics() {
        const bid = filterBatch.value;
        const sid = filterStudent.value;
        const sdt = filterStartDate.value;
        const edt = filterEndDate.value;

        const queryParams = new URLSearchParams();
        if (bid) queryParams.append('batch_id', bid);
        if (sid) queryParams.append('student_id', sid);
        if (sdt) queryParams.append('start_date', sdt);
        if (edt) queryParams.append('end_date', edt);

        performanceTbody.innerHTML = `<tr><td colspan="7" class="text-center py-10 text-neutral-400">Calculating performance metrics...</td></tr>`;
        performanceSummary.innerHTML = '';

        fetch(`../api/admin/get_performance.php?${queryParams.toString()}`)
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    renderPerformance(data.data, data.total_days);
                } else {
                    performanceTbody.innerHTML = `<tr><td colspan="7" class="text-center py-10 text-red-500">Error: ${data.error}</td></tr>`;
                }
            }).catch(err => {
                performanceTbody.innerHTML = `<tr><td colspan="7" class="text-center py-10 text-red-500">Network error fetching analytics.</td></tr>`;
            });
    }

    function renderPerformance(students, totalDays) {
        performanceTbody.innerHTML = '';
        performanceSummary.innerHTML = '';
        
        if (!students || students.length === 0) {
            performanceTbody.innerHTML = `<tr><td colspan="7" class="text-center py-10 text-neutral-400">No performance data found for this month.</td></tr>`;
            return;
        }

        let totalScore = 0;
        let cemerlang = 0, baik = 0, sederhana = 0, lemah = 0;

        students.forEach(s => {
            totalScore += s.skor;
            if (s.status === 'Cemerlang') cemerlang++;
            else if (s.status === 'Baik') baik++;
            else if (s.status === 'Sederhana') sederhana++;
            else lemah++;

            let statusClass = 'bg-neutral-100 text-neutral-700';
            if (s.status === 'Cemerlang') statusClass = 'bg-blue-50 text-blue-700 border-blue-200';
            else if (s.status === 'Baik') statusClass = 'bg-green-50 text-green-700 border-green-200';
            else if (s.status === 'Sederhana') statusClass = 'bg-yellow-50 text-yellow-700 border-yellow-200';
            else if (s.status === 'Lemah') statusClass = 'bg-red-50 text-red-700 border-red-200';

            const tr = document.createElement('tr');
            tr.className = 'border-b border-neutral-100 hover:bg-neutral-50/50 transition-colors';
            
            let penaltyStr = [];
            if (s.lewat > 0) penaltyStr.push(`${s.lewat} Lewat`);
            if (s.pulang_awal > 0) penaltyStr.push(`${s.pulang_awal} Awal`);
            if (s.isu_data) penaltyStr.push(`Data Tak Lengkap`);
            let penaltyHtml = penaltyStr.length > 0 
                ? `<span class="text-xs text-red-600 font-medium">${penaltyStr.join(', ')}</span>`
                : `<span class="text-xs text-green-600 font-medium">Tiada Isu</span>`;

            tr.innerHTML = `
                <td class="p-3 text-sm font-medium text-neutral-900">${s.name}</td>
                <td class="p-3 text-sm text-center font-bold text-neutral-900">${s.skor.toFixed(1)}</td>
                <td class="p-3 text-sm text-center">
                    <span class="inline-flex px-2 py-1 rounded text-[11px] font-bold uppercase tracking-wide border ${statusClass}">${s.status}</span>
                </td>
                <td class="p-3 text-sm text-center font-medium">${s.skor_kehadiran.toFixed(1)} <span class="text-xs text-neutral-400 font-normal">/ 40</span></td>
                <td class="p-3 text-sm text-center font-medium">${s.skor_ketepatan.toFixed(1)} <span class="text-xs text-neutral-400 font-normal">/ 30</span></td>
                <td class="p-3 text-sm text-center font-medium">${s.skor_data.toFixed(1)} <span class="text-xs text-neutral-400 font-normal">/ 30</span></td>
                <td class="p-3 text-sm text-center">${penaltyHtml}</td>
            `;
            performanceTbody.appendChild(tr);
        });

        const avgScore = (totalScore / students.length).toFixed(1);

        performanceSummary.innerHTML = `
            <div class="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm">
                <p class="text-xs text-neutral-500 uppercase tracking-wider mb-1">Avg Score</p>
                <h3 class="text-2xl font-bold text-neutral-900">${avgScore}</h3>
            </div>
            <div class="bg-blue-50 p-4 rounded-xl border border-blue-100 shadow-sm">
                <p class="text-xs text-blue-600 uppercase tracking-wider mb-1">Cemerlang</p>
                <h3 class="text-2xl font-bold text-blue-900">${cemerlang} <span class="text-sm font-medium opacity-70">/ ${students.length}</span></h3>
            </div>
            <div class="bg-green-50 p-4 rounded-xl border border-green-100 shadow-sm">
                <p class="text-xs text-green-600 uppercase tracking-wider mb-1">Baik</p>
                <h3 class="text-2xl font-bold text-green-900">${baik} <span class="text-sm font-medium opacity-70">/ ${students.length}</span></h3>
            </div>
            <div class="bg-red-50 p-4 rounded-xl border border-red-100 shadow-sm">
                <p class="text-xs text-red-600 uppercase tracking-wider mb-1">Isu Data / Lemah</p>
                <h3 class="text-2xl font-bold text-red-900">${sederhana + lemah} <span class="text-sm font-medium opacity-70">/ ${students.length}</span></h3>
            </div>
        `;
    }

    // 4. Fetch Logs
    function fetchLogs() {
        const bid = filterBatch.value;
        const sid = filterStudent.value;
        const sdt = filterStartDate.value;
        const edt = filterEndDate.value;
        const act = filterAction.value;

        const queryParams = new URLSearchParams();
        if (bid) queryParams.append('batch_id', bid);
        if (sid) queryParams.append('student_id', sid);
        if (sdt) queryParams.append('start_date', sdt);
        if (edt) queryParams.append('end_date', edt);
        if (act) queryParams.append('action_type', act);

        fetch(`../api/admin/get_logs.php?${queryParams.toString()}`)
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    renderLogs(data.data);
                    renderChart(data.data);
                }
            });
    }

    function renderChart(logs) {
        const ctx = document.getElementById('attendanceChart');
        if (!ctx) return;
        
        if (attendanceChartInstance) {
            attendanceChartInstance.destroy();
        }

        if (logs.length === 0) {
            return;
        }

        let totalStudents = allStudents.length;
        const selectedBatch = filterBatch.value;
        const selectedStudent = filterStudent.value;

        if (selectedStudent) {
            totalStudents = 1;
        } else if (selectedBatch) {
            totalStudents = allStudents.filter(s => s.batch_id == selectedBatch).length;
        }

        if (totalStudents === 0) return;

        let totalClockIn = 0;
        let totalClockOut = 0;
        let totalLate = 0;
        let totalAbsence = 0;

        let clockInStudents = new Set();
        let clockOutStudents = new Set();
        let lateStudents = new Set();
        let absentStudents = new Set();

        let activeStudentsPeriod = new Set();

        logs.forEach(log => {
            activeStudentsPeriod.add(log.student_id);

            const ts = new Date(log.timestamp);
            const hours = ts.getHours();
            const minutes = ts.getMinutes();
            const timeInMinutes = hours * 60 + minutes;
            
            if (log.action_type === 'clock_in') {
                totalClockIn++;
                clockInStudents.add(log.student_id);
                if (timeInMinutes > 540) { // 09:00
                    totalLate++;
                    lateStudents.add(log.student_id);
                }
            } else if (log.action_type === 'clock_out') {
                totalClockOut++;
                clockOutStudents.add(log.student_id);
                if (timeInMinutes < 1020) { // 17:00
                    totalLate++;
                    lateStudents.add(log.student_id);
                }
            }
        });

        // Calculate Absences for the entire selected period
        const now = new Date();
        const todayStr = now.getFullYear() + '-' + String(now.getMonth()+1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
        let isPeriodOver = true;
        let endDateStr = filterEndDate.value;
        if (!endDateStr || endDateStr >= todayStr) {
            if (now.getHours() < 17) {
                isPeriodOver = false;
            }
        }

        if (isPeriodOver) {
            allStudents.forEach(s => {
                if (filterBatch.value && s.batch_id != filterBatch.value) return;
                if (filterStudent.value && s.id != filterStudent.value) return;

                if (!activeStudentsPeriod.has(s.id)) {
                    totalAbsence++;
                    absentStudents.add(s.id);
                }
            });
        }

        let sdt = filterStartDate.value || 'All Time';
        let edt = filterEndDate.value || 'All Time';
        if (sdt === edt && sdt !== 'All Time') edt = ''; // Clean up label if same day
        const periodLabel = sdt === 'All Time' ? 'All Time Total' : (edt ? `${sdt} to ${edt}` : sdt);

        const labels = [periodLabel];
        const dataClockIn = [totalClockIn];
        const dataClockOut = [totalClockOut];
        const dataLate = [totalLate];
        const dataAbsence = [totalAbsence];

        const periodData = {
            clockIn: clockInStudents,
            clockOut: clockOutStudents,
            late: lateStudents,
            absence: absentStudents,
            rawLogs: logs
        };

        attendanceChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Clock In',
                        data: dataClockIn,
                        backgroundColor: '#10b981', // green-500
                        borderRadius: 4
                    },
                    {
                        label: 'Clock Out',
                        data: dataClockOut,
                        backgroundColor: '#f97316', // orange-500
                        borderRadius: 4
                    },
                    {
                        label: 'Late / Early Penalty',
                        data: dataLate,
                        backgroundColor: '#ef4444', // red
                        borderRadius: 4
                    },
                    {
                        label: 'Absent/Not Submitted',
                        data: dataAbsence,
                        backgroundColor: '#9ca3af', // gray-400
                        borderRadius: 4
                    }
                ]
            },
            options: {
                onClick: (e, activeEls) => {
                    if (activeEls.length > 0) {
                        const datasetIndex = activeEls[0].datasetIndex;
                        let metric = 'clockIn';
                        if (datasetIndex === 1) metric = 'clockOut';
                        else if (datasetIndex === 2) metric = 'late';
                        else if (datasetIndex === 3) metric = 'absence';
                        
                        showChartDrilldown(periodLabel, metric, periodData);
                    }
                },
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { 
                        display: true,
                        position: 'top',
                        labels: {
                            font: { family: "'Inter', sans-serif", size: 12 }
                        }
                    },
                    title: {
                        display: true,
                        text: 'Total Attendance Activity',
                        font: { family: "'Inter', sans-serif", size: 16, weight: 'bold' },
                        color: '#171717',
                        padding: { top: 0, bottom: 20 }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return ` ${context.dataset.label}: ${context.parsed.y} logs`;
                            }
                        }
                    }
                },
                layout: {
                    padding: { top: 20 }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grace: '20%',
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            },
            plugins: [{
                id: 'barLabels',
                afterDatasetsDraw(chart, args, options) {
                    const { ctx } = chart;
                    chart.data.datasets.forEach((dataset, i) => {
                        const meta = chart.getDatasetMeta(i);
                        meta.data.forEach((bar, index) => {
                            const data = dataset.data[index];
                            if (data > 0) {
                                ctx.save();
                                ctx.fillStyle = '#171717';
                                ctx.font = 'bold 12px Inter, sans-serif';
                                ctx.textAlign = 'center';
                                ctx.textBaseline = 'bottom';
                                ctx.fillText(data, bar.x, bar.y - 5);
                                ctx.restore();
                            }
                        });
                    });
                }
            }]
        });
    }

    function renderLogs(logs) {
        logsTbody.innerHTML = '';
        logsTimeline.innerHTML = '';
        logsGrid.innerHTML = '';
        
        if (logs.length === 0) {
            logsTbody.innerHTML = `<tr><td colspan="8" class="text-center py-10 text-neutral-400">No logs found</td></tr>`;
            logsTimeline.innerHTML = `<div class="text-center py-10 text-neutral-400">No logs found</div>`;
            logsGrid.innerHTML = `<div class="col-span-1 sm:col-span-2 md:col-span-3 text-center py-10 text-neutral-400">No photos found</div>`;
            return;
        }

        // --- Render Grouped Table ---
        const grouped = {};
        logs.forEach(log => {
            const dateStr = new Date(log.timestamp).toLocaleDateString();
            const key = `${log.student_id}_${dateStr}`;
            
            if (!grouped[key]) {
                grouped[key] = {
                    student_name: log.full_name,
                    dateStr: dateStr,
                    raw_date: new Date(log.timestamp).setHours(0,0,0,0),
                    clock_in: null,
                    clock_out: null
                };
            }
            
            if (log.action_type === 'clock_in') {
                if (!grouped[key].clock_in || log.timestamp < grouped[key].clock_in.timestamp) {
                    grouped[key].clock_in = log;
                }
            } else if (log.action_type === 'clock_out') {
                if (!grouped[key].clock_out || log.timestamp > grouped[key].clock_out.timestamp) {
                    grouped[key].clock_out = log;
                }
            }
        });

        // Convert to array and sort by date desc
        const groupedArr = Object.values(grouped).sort((a, b) => b.raw_date - a.raw_date);

        // Render Table Rows (Grouped)
        groupedArr.forEach(g => {
            let statusText = '--';
            let statusColor = 'bg-neutral-100 text-neutral-500 border-transparent';
            let inColorClass = 'bg-neutral-100 text-neutral-900 border-transparent';
            let outColorClass = 'bg-neutral-100 text-neutral-900 border-transparent';
            let totalHrsText = '--';

            if (g.clock_in) {
                const inDate = new Date(g.clock_in.timestamp);
                const inHour = inDate.getHours();
                const inMin = inDate.getMinutes();
                const isLate = (inHour > 8) || (inHour === 8 && inMin > 30);
                inColorClass = isLate ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200';
                
                if (!g.clock_out) {
                    statusText = isLate ? 'Late' : 'Pending Out';
                    statusColor = isLate ? 'bg-red-50 text-red-700 border-red-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200';
                } else {
                    const outDate = new Date(g.clock_out.timestamp);
                    
                    const durationMs = outDate - inDate;
                    const totalMins = Math.floor(durationMs / (1000 * 60));
                    totalHrsText = `${Math.floor(totalMins / 60)}h ${totalMins % 60}m`;
                    
                    // Calculate expected clock out time (9 hours after effective start)
                    let effectiveStartDate = new Date(inDate);
                    if (inDate.getHours() < 8) {
                        effectiveStartDate.setHours(8, 0, 0, 0); // If early, shift starts at 8:00 AM
                    }
                    const expectedOutDate = new Date(effectiveStartDate.getTime() + (9 * 60 * 60 * 1000));
                    
                    const isEarlyLeave = outDate < expectedOutDate;
                    outColorClass = isEarlyLeave ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200';
                    
                    if (isLate && isEarlyLeave) {
                        statusText = 'Late & Early Leave';
                        statusColor = 'bg-red-50 text-red-700 border-red-200';
                    } else if (isLate) {
                        statusText = 'Late';
                        statusColor = 'bg-orange-50 text-orange-700 border-orange-200';
                    } else if (isEarlyLeave) {
                        statusText = 'Early Leave';
                        statusColor = 'bg-red-50 text-red-700 border-red-200';
                    } else {
                        statusText = 'On Time';
                        statusColor = 'bg-green-50 text-green-700 border-green-200';
                    }
                }
            }

            const inTimeStr = g.clock_in ? new Date(g.clock_in.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--';
            const outTimeStr = g.clock_out ? new Date(g.clock_out.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--';

            // Determine Photo Status logic for table
            let inPhotoBadge = '';
            if (g.clock_in) {
                const imgPath = g.clock_in.image_path ? `../${g.clock_in.image_path}` : '';
                let bgClass = g.clock_in.photo_status === 'approved' ? 'bg-green-100 text-green-700' : (g.clock_in.photo_status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700');
                let txt = g.clock_in.photo_status === 'approved' ? 'IN: OK' : (g.clock_in.photo_status === 'rejected' ? 'IN: REJ' : 'IN: PEND');
                inPhotoBadge = `<span class="inline-flex px-1.5 py-0.5 ml-1 rounded text-[10px] font-bold ${bgClass} cursor-pointer hover:opacity-80 whitespace-nowrap" onclick="showPhoto('${imgPath}', '${g.clock_in.photo_status}', ${g.clock_in.id}, 'clock_in')">${txt}</span>`;
            }

            let outPhotoBadge = '';
            if (g.clock_out) {
                const imgPath = g.clock_out.image_path ? `../${g.clock_out.image_path}` : '';
                let bgClass = g.clock_out.photo_status === 'approved' ? 'bg-green-100 text-green-700' : (g.clock_out.photo_status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700');
                let txt = g.clock_out.photo_status === 'approved' ? 'OUT: OK' : (g.clock_out.photo_status === 'rejected' ? 'OUT: REJ' : 'OUT: PEND');
                outPhotoBadge = `<span class="inline-flex px-1.5 py-0.5 ml-1 rounded text-[10px] font-bold ${bgClass} cursor-pointer hover:opacity-80 whitespace-nowrap" onclick="showPhoto('${imgPath}', '${g.clock_out.photo_status}', ${g.clock_out.id}, 'clock_out')">${txt}</span>`;
            }

            const tr = document.createElement('tr');
            tr.className = 'border-b border-neutral-100 hover:bg-neutral-50/50 transition-colors';
            
            tr.innerHTML = `
                <td class="p-3 text-sm font-medium text-neutral-900">${g.dateStr}</td>
                <td class="p-3 text-sm text-neutral-900 font-medium">${g.student_name}</td>
                <td class="p-3 text-sm">
                    ${g.clock_in ? `<span class="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${inColorClass} whitespace-nowrap">${inTimeStr}</span>` : '<span class="text-neutral-400">--</span>'}
                </td>
                <td class="p-3 text-sm">
                    ${g.clock_out ? `<span class="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${outColorClass} whitespace-nowrap">${outTimeStr}</span>` : '<span class="text-neutral-400">--</span>'}
                </td>
                <td class="p-3 text-sm font-medium text-neutral-700 whitespace-nowrap">${totalHrsText}</td>
                <td class="p-3 text-sm">
                    <span class="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${statusColor} ${statusText !== 'On Time' && statusText !== 'Pending Out' ? 'cursor-pointer hover:opacity-80' : ''} whitespace-nowrap" ${statusText !== 'On Time' && statusText !== 'Pending Out' ? `onclick="showReason('${encodeURIComponent(g.clock_in?.reason || '')}', '${encodeURIComponent(g.clock_out?.reason || '')}')"` : ''}>${statusText} ${statusText !== 'On Time' && statusText !== 'Pending Out' ? '<svg class="w-3 h-3 ml-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>' : ''}</span>
                </td>
                <td class="p-3 text-sm">
                    <div class="flex flex-col gap-1 items-start">
                        ${inPhotoBadge}
                        ${outPhotoBadge}
                    </div>
                </td>
            `;
            logsTbody.appendChild(tr);
        });

        // --- Render Absent Students in Table ---
        let activeStudentsPeriod = new Set();
        logs.forEach(log => activeStudentsPeriod.add(log.student_id));
        
        let sdt = filterStartDate.value || 'All Time';
        let edt = filterEndDate.value || 'All Time';
        if (sdt === edt && sdt !== 'All Time') edt = '';
        const periodLabel = sdt === 'All Time' ? 'All Time Total' : (edt ? `${sdt} to ${edt}` : sdt);

        const now = new Date();
        const todayStr = now.getFullYear() + '-' + String(now.getMonth()+1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
        let isPeriodOver = true;
        let endDateStr = filterEndDate.value;
        if (!endDateStr || endDateStr >= todayStr) {
            if (now.getHours() < 17) {
                isPeriodOver = false;
            }
        }

        if (isPeriodOver) {
            allStudents.forEach(student => {
                if (filterBatch.value && student.batch_id != filterBatch.value) return;
                if (filterStudent.value && student.id != filterStudent.value) return;

                if (!activeStudentsPeriod.has(student.id)) {
                    const tr = document.createElement('tr');
                    tr.className = 'border-b border-neutral-100 bg-neutral-50/70 grayscale opacity-75';
                    
                    tr.innerHTML = `
                        <td class="p-3 text-sm font-medium text-neutral-500">${periodLabel}</td>
                        <td class="p-3 text-sm font-medium text-neutral-600 line-through">${student.full_name}</td>
                        <td class="p-3 text-sm text-neutral-400">
                            <span class="text-neutral-400">--</span>
                        </td>
                        <td class="p-3 text-sm text-neutral-400">
                            <span class="text-neutral-400">--</span>
                        </td>
                        <td class="p-3 text-sm font-medium text-neutral-400 whitespace-nowrap">0h 0m</td>
                        <td class="p-3 text-sm">
                            <span class="inline-flex items-center px-2 py-1 rounded-md text-xs font-bold border bg-neutral-200 text-neutral-600 border-transparent whitespace-nowrap">Absent/Not Submitted</span>
                        </td>
                        <td class="p-3 text-sm">
                            <span class="text-xs text-neutral-400 italic whitespace-nowrap">No Logs Recorded</span>
                        </td>
                    `;
                    logsTbody.appendChild(tr);
                }
            });
        }

        // --- Render Timeline ---
        logs.forEach(log => {
            const timeObj = new Date(log.timestamp);
            const dateStr = timeObj.toLocaleDateString();
            const timeStr = timeObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            
            const div = document.createElement('div');
            div.className = "relative cursor-default";
            div.innerHTML = `
                <span class="absolute -left-1.5 top-1 h-3 w-3 rounded-full border-2 border-white ${log.action_type === 'clock_in' ? 'bg-neutral-900' : 'bg-neutral-400'}"></span>
                <div class="pl-6">
                    <p class="text-sm font-medium text-neutral-900">${log.full_name} ${log.action_type === 'clock_in' ? 'clocked in' : 'clocked out'}</p>
                    <p class="text-xs text-neutral-500">${dateStr} at ${timeStr}</p>
                </div>
            `;
            logsTimeline.appendChild(div);
        });

        // --- Render Photo Grid ---
        logsGrid.innerHTML = '';
        logs.forEach(log => {
            const timeObj = new Date(log.timestamp);
            const dateStr = timeObj.toLocaleDateString();
            const timeStr = timeObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            
            const card = document.createElement('div');
            card.className = "bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col";
            
            let photoStatusBadge = '';
            if (log.photo_status === 'approved') photoStatusBadge = `<span class="absolute top-2 right-2 bg-green-500 text-white p-1 rounded-full shadow-sm"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg></span>`;
            else if (log.photo_status === 'rejected') photoStatusBadge = `<span class="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full shadow-sm"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></span>`;
            else photoStatusBadge = `<span class="absolute top-2 right-2 bg-yellow-500 text-white px-2 py-0.5 rounded-full shadow-sm text-[10px] font-bold">PENDING</span>`;

            const imageHtml = log.image_path 
                ? `<div class="aspect-video w-full bg-neutral-100 relative group">
                     <img src="../${log.image_path}" class="w-full h-full object-cover" alt="Clock In Photo">
                     ${photoStatusBadge}
                   </div>` 
                : `<div class="aspect-video w-full bg-neutral-100 flex items-center justify-center text-neutral-400 text-xs uppercase tracking-wider relative group">
                     No Photo
                     ${photoStatusBadge}
                   </div>`;
            
            card.innerHTML = `
                ${imageHtml}
                <div class="p-4 flex-1 flex flex-col justify-between gap-3 relative">
                    <div>
                        <div class="flex items-center justify-between mb-1">
                            <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${log.action_type === 'clock_in' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-orange-50 text-orange-700 border-orange-200'}">${log.action_type === 'clock_in' ? 'Clocked In' : 'Clocked Out'}</span>
                            <span class="text-xs font-medium text-neutral-500">${timeStr}</span>
                        </div>
                        <h4 class="text-sm font-semibold text-neutral-900 leading-tight pr-16">${log.full_name}</h4>
                        <p class="text-xs text-neutral-500 mt-1">${dateStr}</p>
                    </div>
                    <div class="absolute bottom-4 right-4 flex gap-1.5">
                        <button class="p-1.5 bg-green-50 text-green-600 hover:bg-green-500 hover:text-white rounded-full shadow-sm transition-all btn-approve" data-id="${log.id}" title="Approve">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>
                        </button>
                        <button class="p-1.5 bg-red-50 text-red-600 hover:bg-red-500 hover:text-white rounded-full shadow-sm transition-all btn-reject" data-id="${log.id}" title="Reject">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                    </div>
                </div>
            `;
            
            // Add event listeners
            card.querySelector('.btn-approve').addEventListener('click', () => updatePhotoStatus(log.id, 'approved'));
            card.querySelector('.btn-reject').addEventListener('click', () => updatePhotoStatus(log.id, 'rejected'));

            logsGrid.appendChild(card);
        });
    }

    window.updatePhotoStatus = function(logId, status) {
        fetch('../api/admin/update_photo_status.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ log_id: logId, status: status })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                fetchLogs(); // Reload logs to reflect new status
            } else {
                alert("Failed to update status: " + data.error);
            }
        });
    };

    // --- Face Enrollment Modal Logic ---
    const enrollOverlay = document.getElementById('enroll-overlay');
    const enrollModal = document.getElementById('enroll-modal');
    const btnCloseEnroll = document.getElementById('btn-close-enroll');
    const enrollTitle = document.getElementById('enroll-title');
    const enrollVideo = document.getElementById('enroll-video');
    const enrollCanvas = document.getElementById('enroll-canvas');
    const btnCaptureFace = document.getElementById('btn-capture-face');
    const enrollBtnText = document.getElementById('enroll-btn-text');

    let isFaceApiLoaded = false;
    let enrollmentStream = null;
    let currentEnrollStudentId = null;
    let faceDetectionInterval = null;

    async function loadFaceApi() {
        if (isFaceApiLoaded) return;
        try {
            await Promise.all([
                faceapi.nets.tinyFaceDetector.loadFromUri('../models'),
                faceapi.nets.faceLandmark68Net.loadFromUri('../models'),
                faceapi.nets.faceRecognitionNet.loadFromUri('../models')
            ]);
            isFaceApiLoaded = true;
            btnCaptureFace.disabled = false;
            enrollBtnText.textContent = "Capture Face";
        } catch (e) {
            console.error("Error loading face-api models:", e);
            enrollBtnText.textContent = "Error loading AI";
        }
    }

    async function openFaceEnrollment(studentId, studentName) {
        currentEnrollStudentId = studentId;
        enrollTitle.textContent = `Enroll Face: ${studentName}`;
        
        enrollOverlay.classList.remove('opacity-0', 'pointer-events-none');
        enrollModal.classList.remove('scale-95', 'opacity-0');
        
        btnCaptureFace.disabled = true;
        enrollBtnText.textContent = isFaceApiLoaded ? "Starting Camera..." : "Initializing AI...";

        try {
            enrollmentStream = await navigator.mediaDevices.getUserMedia({ video: true });
            enrollVideo.srcObject = enrollmentStream;
        } catch (err) {
            alert("Could not access webcam: " + err.message);
            closeFaceEnrollment();
            return;
        }

        if (!isFaceApiLoaded) {
            await loadFaceApi();
        } else {
            btnCaptureFace.disabled = false;
            enrollBtnText.textContent = "Capture Face";
        }

        // Draw detection overlay
        enrollVideo.addEventListener('play', () => {
            const displaySize = { width: enrollVideo.clientWidth, height: enrollVideo.clientHeight };
            faceapi.matchDimensions(enrollCanvas, displaySize);
            
            if (faceDetectionInterval) clearInterval(faceDetectionInterval);
            
            faceDetectionInterval = setInterval(async () => {
                if (enrollVideo.paused || enrollVideo.ended) return;
                const detections = await faceapi.detectAllFaces(enrollVideo, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks();
                const resizedDetections = faceapi.resizeResults(detections, displaySize);
                
                const ctx = enrollCanvas.getContext('2d');
                ctx.clearRect(0, 0, enrollCanvas.width, enrollCanvas.height);
                
                // Note: video is flipped horizontally, so canvas drawing might misalign unless we flip ctx
                ctx.save();
                ctx.translate(enrollCanvas.width, 0);
                ctx.scale(-1, 1);
                faceapi.draw.drawDetections(enrollCanvas, resizedDetections);
                faceapi.draw.drawFaceLandmarks(enrollCanvas, resizedDetections);
                ctx.restore();
                
            }, 100);
        });
    }

    function closeFaceEnrollment() {
        enrollOverlay.classList.add('opacity-0', 'pointer-events-none');
        enrollModal.classList.add('scale-95', 'opacity-0');
        if (enrollmentStream) {
            enrollmentStream.getTracks().forEach(track => track.stop());
            enrollmentStream = null;
        }
        if (faceDetectionInterval) {
            clearInterval(faceDetectionInterval);
            faceDetectionInterval = null;
        }
        const ctx = enrollCanvas.getContext('2d');
        ctx.clearRect(0, 0, enrollCanvas.width, enrollCanvas.height);
    }

    btnCloseEnroll.addEventListener('click', closeFaceEnrollment);

    btnCaptureFace.addEventListener('click', async () => {
        enrollBtnText.textContent = "Extracting...";
        btnCaptureFace.disabled = true;

        const detection = await faceapi.detectSingleFace(enrollVideo, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptor();
        
        if (!detection) {
            alert("No face detected. Please ensure your face is clearly visible.");
            enrollBtnText.textContent = "Capture Face";
            btnCaptureFace.disabled = false;
            return;
        }

        const descriptorArray = Array.from(detection.descriptor);

        fetch('../api/admin/enroll_face.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: currentEnrollStudentId,
                descriptor: descriptorArray
            })
        }).then(r => r.json()).then(d => {
            if (d.success) {
                alert("Face enrolled successfully!");
                closeFaceEnrollment();
                fetchRegistryData(); // refresh list to show "Face Enrolled" badge
            } else {
                alert("Error: " + d.error);
                enrollBtnText.textContent = "Capture Face";
                btnCaptureFace.disabled = false;
            }
        }).catch(err => {
            alert("Network error.");
            enrollBtnText.textContent = "Capture Face";
            btnCaptureFace.disabled = false;
        });
    });

    // --- View Reason Modal Logic ---
    const viewReasonOverlay = document.getElementById('view-reason-overlay');
    const viewReasonModal = document.getElementById('view-reason-modal');
    const btnCloseViewReason = document.getElementById('btn-close-view-reason');
    const btnDoneViewReason = document.getElementById('btn-done-view-reason');
    const viewReasonText = document.getElementById('view-reason-text');

    window.showReason = function(inReasonEnc, outReasonEnc) {
        const inReason = decodeURIComponent(inReasonEnc);
        const outReason = decodeURIComponent(outReasonEnc);
        
        let text = '';
        if (inReason && outReason) {
            text = `<strong>Clock In Reason:</strong><br>${inReason}<br><br><strong>Clock Out Reason:</strong><br>${outReason}`;
        } else if (inReason) {
            text = `<strong>Clock In Reason:</strong><br>${inReason}`;
        } else if (outReason) {
            text = `<strong>Clock Out Reason:</strong><br>${outReason}`;
        } else {
            text = "No reason provided by the student.";
        }
        
        viewReasonText.innerHTML = text;
        
        viewReasonOverlay.classList.remove('opacity-0', 'pointer-events-none');
        setTimeout(() => {
            viewReasonModal.classList.remove('scale-95', 'opacity-0');
        }, 50);
    };

    function hideViewReason() {
        viewReasonModal.classList.add('scale-95', 'opacity-0');
        setTimeout(() => {
            viewReasonOverlay.classList.add('opacity-0', 'pointer-events-none');
        }, 300);
    }

    if (btnCloseViewReason) btnCloseViewReason.addEventListener('click', hideViewReason);
    if (btnDoneViewReason) btnDoneViewReason.addEventListener('click', hideViewReason);

    // --- View Photo Modal Logic ---
    const viewPhotoOverlay = document.getElementById('view-photo-overlay');
    const viewPhotoModal = document.getElementById('view-photo-modal');
    const btnCloseViewPhoto = document.getElementById('btn-close-view-photo');
    const viewPhotoImg = document.getElementById('view-photo-img');
    const viewPhotoEmpty = document.getElementById('view-photo-empty');
    const viewPhotoBadge = document.getElementById('view-photo-badge');
    const viewPhotoActions = document.getElementById('view-photo-actions');

    window.showPhoto = function(imgPath, status, logId, actionType) {
        if (imgPath && imgPath !== '') {
            viewPhotoImg.src = imgPath;
            viewPhotoImg.classList.remove('hidden');
            viewPhotoEmpty.classList.add('hidden');
        } else {
            viewPhotoImg.src = '';
            viewPhotoImg.classList.add('hidden');
            viewPhotoEmpty.classList.remove('hidden');
        }

        // Set Badge
        viewPhotoBadge.textContent = status === 'approved' ? 'Approved' : (status === 'rejected' ? 'Rejected' : 'Pending');
        viewPhotoBadge.className = 'px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ' + 
            (status === 'approved' ? 'bg-green-100 text-green-700' : (status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'));

        // Action Buttons
        viewPhotoActions.innerHTML = `
            <button class="px-4 py-2 bg-green-50 text-green-600 rounded-lg text-sm font-medium hover:bg-green-500 hover:text-white transition-colors focus:outline-none" onclick="updatePhotoStatus(${logId}, 'approved'); hideViewPhoto();">Approve</button>
            <button class="px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-500 hover:text-white transition-colors focus:outline-none" onclick="updatePhotoStatus(${logId}, 'rejected'); hideViewPhoto();">Reject</button>
        `;

        viewPhotoOverlay.classList.remove('opacity-0', 'pointer-events-none');
        setTimeout(() => {
            viewPhotoModal.classList.remove('scale-95', 'opacity-0');
        }, 50);
    };

    window.hideViewPhoto = function() {
        viewPhotoModal.classList.add('scale-95', 'opacity-0');
        setTimeout(() => {
            viewPhotoOverlay.classList.add('opacity-0', 'pointer-events-none');
            viewPhotoImg.src = '';
        }, 300);
    }

    if (btnCloseViewPhoto) btnCloseViewPhoto.addEventListener('click', hideViewPhoto);

    btnApplyFilters.addEventListener('click', () => {
        if (!performanceContainer.classList.contains('hidden')) {
            fetchPerformanceAnalytics();
        } else {
            fetchLogs();
        }
    });

    // 5. Export Logs to CSV
    const btnExportCsv = document.getElementById('btn-export-csv');
    btnExportCsv.addEventListener('click', () => {
        const bid = filterBatch.value;
        const sid = filterStudent.value;
        const sdt = filterStartDate.value;
        const edt = filterEndDate.value;
        const act = filterAction.value;

        const queryParams = new URLSearchParams();
        if (bid) queryParams.append('batch_id', bid);
        if (sid) queryParams.append('student_id', sid);
        if (sdt) queryParams.append('start_date', sdt);
        if (edt) queryParams.append('end_date', edt);
        if (act) queryParams.append('action_type', act);

        window.location.href = `../api/admin/export_logs.php?${queryParams.toString()}`;
    });

    // 6. Chart Interactions
    const btnExpandChart = document.getElementById('btn-expand-chart');
    const chartWrapper = document.getElementById('chart-wrapper');
    if (btnExpandChart && chartWrapper) {
        btnExpandChart.addEventListener('click', () => {
            const isExpanded = chartWrapper.classList.contains('fixed');
            if (!isExpanded) {
                // Create glass backdrop
                const backdrop = document.createElement('div');
                backdrop.id = 'chart-backdrop';
                backdrop.className = 'fixed inset-0 z-[95] bg-black/40 backdrop-blur-sm transition-opacity opacity-0 duration-300';
                document.body.appendChild(backdrop);
                
                // Create a placeholder to prevent page jump
                const placeholder = document.createElement('div');
                placeholder.id = 'chart-placeholder';
                placeholder.className = 'h-96 bg-transparent';
                chartWrapper.parentNode.insertBefore(placeholder, chartWrapper);

                // Setup layout
                chartWrapper.classList.remove('h-96', 'relative', 'group', 'fade-in');
                chartWrapper.classList.add('fixed', 'top-1/2', 'left-1/2', '-translate-x-1/2', '-translate-y-1/2', 'w-[90vw]', 'h-[80vh]', 'max-w-6xl', 'z-[100]', 'shadow-2xl');
                
                btnExpandChart.classList.remove('opacity-0', 'group-hover:opacity-100');
                btnExpandChart.classList.add('bg-neutral-200', 'text-neutral-900', 'hover:bg-red-100', 'hover:text-red-600', 'shadow-md');
                btnExpandChart.innerHTML = `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>`;

                // Show backdrop instantly
                backdrop.classList.remove('opacity-0');
            } else {
                // Remove backdrop
                const backdrop = document.getElementById('chart-backdrop');
                if (backdrop) {
                    backdrop.classList.add('opacity-0');
                    setTimeout(() => backdrop.remove(), 500);
                }

                // Close instantly
                chartWrapper.classList.remove('fixed', 'top-1/2', 'left-1/2', '-translate-x-1/2', '-translate-y-1/2', 'w-[90vw]', 'h-[80vh]', 'max-w-6xl', 'z-[100]', 'shadow-2xl');
                chartWrapper.classList.add('h-96', 'relative', 'group'); 
                
                btnExpandChart.classList.add('opacity-0', 'group-hover:opacity-100');
                btnExpandChart.classList.remove('bg-neutral-200', 'text-neutral-900', 'hover:bg-red-100', 'hover:text-red-600', 'shadow-md');
                btnExpandChart.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"></path></svg>`;
                
                const placeholder = document.getElementById('chart-placeholder');
                if (placeholder) placeholder.remove();
            }
        });
    }

    function showChartDrilldown(dateStr, metric, data) {
        const title = document.getElementById('chart-drilldown-title');
        const subtitle = document.getElementById('chart-drilldown-subtitle');
        const tbody = document.getElementById('chart-drilldown-tbody');
        const overlay = document.getElementById('chart-drilldown-overlay');
        const modal = document.getElementById('chart-drilldown-modal');

        let studentIds = Array.from(data[metric] || []);
        
        let label = metric === 'clockIn' ? 'Clock In' : (metric === 'clockOut' ? 'Clock Out' : (metric === 'absence' ? 'Absent/Not Submitted' : 'Late / Early Penalties'));
        title.textContent = label + ' Details';
        subtitle.textContent = dateStr;

        tbody.innerHTML = '';
        if (studentIds.length === 0) {
            tbody.innerHTML = `<tr><td colspan="3" class="text-center py-6 text-neutral-400">No data found</td></tr>`;
        } else {
            studentIds.forEach(sid => {
                const student = allStudents.find(s => s.id == sid);
                const batch = allBatches.find(b => b.id == (student ? student.batch_id : null));
                
                let statusBadge = '';
                if (metric === 'clockIn') statusBadge = '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700">Clock In</span>';
                else if (metric === 'clockOut') statusBadge = '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-700">Clock Out</span>';
                else if (metric === 'absence') statusBadge = '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-700">Absent/Not Submitted</span>';
                else {
                    let penaltyStrings = new Set();
                    if (data.rawLogs) {
                        data.rawLogs.filter(log => log.student_id == sid).forEach(log => {
                            const ts = new Date(log.timestamp);
                            const timeInMinutes = ts.getHours() * 60 + ts.getMinutes();
                            if (log.action_type === 'clock_in' && timeInMinutes > 540) {
                                penaltyStrings.add('Late Clock In');
                            }
                            if (log.action_type === 'clock_out' && timeInMinutes < 1020) {
                                penaltyStrings.add('Early Clock Out');
                            }
                        });
                    }
                    if (penaltyStrings.size > 0) {
                        statusBadge = Array.from(penaltyStrings).map(p => `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700">${p}</span>`).join(' ');
                    } else {
                        statusBadge = '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700">Penalty</span>';
                    }
                }

                tbody.innerHTML += `
                    <tr class="hover:bg-neutral-50 transition-colors">
                        <td class="p-3 text-sm font-medium text-neutral-900">${student ? student.full_name : 'Unknown'}</td>
                        <td class="p-3 text-sm text-neutral-500">${batch ? batch.name : '-'}</td>
                        <td class="p-3">${statusBadge}</td>
                    </tr>
                `;
            });
        }

        overlay.classList.remove('opacity-0', 'pointer-events-none');
        setTimeout(() => {
            modal.classList.remove('scale-95', 'opacity-0');
        }, 50);
    }

    window.hideChartDrilldown = function() {
        const overlay = document.getElementById('chart-drilldown-overlay');
        const modal = document.getElementById('chart-drilldown-modal');
        modal.classList.add('scale-95', 'opacity-0');
        setTimeout(() => {
            overlay.classList.add('opacity-0', 'pointer-events-none');
        }, 300);
    }

    const btnCloseDrilldown = document.getElementById('btn-close-chart-drilldown');
    const btnDoneDrilldown = document.getElementById('btn-done-chart-drilldown');
    if (btnCloseDrilldown) btnCloseDrilldown.addEventListener('click', hideChartDrilldown);
    if (btnDoneDrilldown) btnDoneDrilldown.addEventListener('click', hideChartDrilldown);

    // Initial Data Fetch
    // fetchLogs() is now called inside fetchDashboardFilters after allStudents loads to avoid race condition
    fetchDashboardFilters();
});
