<?php
session_start();
if (!isset($_SESSION['admin_logged_in']) || $_SESSION['admin_logged_in'] !== true) {
    header('Location: login.php');
    exit;
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Settings</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="../assets/css/style.css">
</head>
<body class="bg-neutral-50 text-neutral-900 min-h-screen p-8">
    <div class="max-w-2xl mx-auto fade-in-up">
        <div class="flex justify-between items-center mb-8">
            <h1 class="text-2xl font-semibold tracking-tight">Settings</h1>
            <a href="index.php" class="text-sm font-medium text-neutral-500 hover:text-neutral-900 transition-colors">&larr; Back to Dashboard</a>
        </div>

        <div class="bg-white rounded-2xl shadow-sm border border-neutral-200 p-8">
            <h2 class="text-lg font-medium tracking-tight mb-6">Change Admin Password</h2>
            
            <div class="space-y-4">
                <div>
                    <label class="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2">Current Password</label>
                    <input type="password" id="current-pass" class="w-full bg-neutral-50 border border-neutral-200 text-neutral-900 rounded-lg px-4 py-2 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-all">
                </div>
                <div>
                    <label class="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2">New Password</label>
                    <input type="password" id="new-pass" class="w-full bg-neutral-50 border border-neutral-200 text-neutral-900 rounded-lg px-4 py-2 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-all">
                </div>
                <div>
                    <label class="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2">Confirm New Password</label>
                    <input type="password" id="confirm-pass" class="w-full bg-neutral-50 border border-neutral-200 text-neutral-900 rounded-lg px-4 py-2 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-all">
                </div>
                
                <div class="pt-4 flex items-center justify-between">
                    <p id="msg-area" class="text-sm font-medium"></p>
                    <button id="btn-save" class="bg-neutral-900 text-white rounded-lg px-6 py-2.5 font-medium tracking-tight hover:bg-neutral-800 transition-colors duration-300 shadow-sm">Save Password</button>
                </div>
            </div>
        </div>
    </div>

    <script>
        const btnSave = document.getElementById('btn-save');
        const msgArea = document.getElementById('msg-area');

        btnSave.addEventListener('click', () => {
            const current = document.getElementById('current-pass').value;
            const newp = document.getElementById('new-pass').value;
            const conf = document.getElementById('confirm-pass').value;

            if (!current || !newp || !conf) {
                msgArea.textContent = 'All fields are required.';
                msgArea.className = 'text-sm font-medium text-red-600';
                return;
            }

            if (newp !== conf) {
                msgArea.textContent = 'New passwords do not match.';
                msgArea.className = 'text-sm font-medium text-red-600';
                return;
            }

            btnSave.disabled = true;
            btnSave.textContent = 'Saving...';

            fetch('../api/admin/change_password.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ current_password: current, new_password: newp })
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    msgArea.textContent = 'Password successfully changed!';
                    msgArea.className = 'text-sm font-medium text-green-600';
                    document.getElementById('current-pass').value = '';
                    document.getElementById('new-pass').value = '';
                    document.getElementById('confirm-pass').value = '';
                } else {
                    msgArea.textContent = data.error;
                    msgArea.className = 'text-sm font-medium text-red-600';
                }
            })
            .catch(() => {
                msgArea.textContent = 'Network error.';
                msgArea.className = 'text-sm font-medium text-red-600';
            })
            .finally(() => {
                btnSave.disabled = false;
                btnSave.textContent = 'Save Password';
            });
        });
    </script>
</body>
</html>
