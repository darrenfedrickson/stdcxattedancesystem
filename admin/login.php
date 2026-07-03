<?php
session_start();
if (isset($_SESSION['admin_logged_in']) && $_SESSION['admin_logged_in'] === true) {
    header('Location: index.php');
    exit;
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Login</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="../assets/css/style.css">
</head>
<body class="bg-neutral-50 text-neutral-900 min-h-screen flex items-center justify-center p-4">
    <div class="max-w-sm w-full">
        <div class="text-center mb-10 fade-in-up">
            <h1 class="text-3xl font-semibold tracking-tight mb-2">Admin Portal</h1>
            <p class="text-sm text-neutral-500">Enter password to continue.</p>
        </div>

        <div class="bg-white rounded-2xl shadow-sm border border-neutral-200 p-8 fade-in-up delay-100 hover-scale">
            <div class="mb-6">
                <input type="password" id="password" class="w-full bg-neutral-50 border border-neutral-200 text-neutral-900 rounded-lg px-4 py-3 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-all duration-300" placeholder="Password" autofocus>
            </div>
            
            <button id="btn-login" class="w-full bg-neutral-900 text-white rounded-xl py-3 font-medium tracking-tight hover:bg-neutral-800 transition-colors duration-300">
                Log In
            </button>
            <p id="error-msg" class="text-red-500 font-medium text-sm mt-4 text-center hidden"></p>
        </div>
    </div>

    <script>
        const btnLogin = document.getElementById('btn-login');
        const passInput = document.getElementById('password');
        const errorMsg = document.getElementById('error-msg');

        function attemptLogin() {
            const pwd = passInput.value;
            if (!pwd) return;

            btnLogin.disabled = true;
            btnLogin.textContent = 'Verifying...';
            errorMsg.classList.add('hidden');

            fetch('../api/admin/auth_login.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: pwd })
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    window.location.href = 'index.php';
                } else {
                    errorMsg.textContent = data.error;
                    errorMsg.classList.remove('hidden');
                    btnLogin.disabled = false;
                    btnLogin.textContent = 'Log In';
                    passInput.value = '';
                    passInput.focus();
                }
            })
            .catch(() => {
                errorMsg.textContent = 'Network error.';
                errorMsg.classList.remove('hidden');
                btnLogin.disabled = false;
                btnLogin.textContent = 'Log In';
            });
        }

        btnLogin.addEventListener('click', attemptLogin);
        passInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') attemptLogin();
        });
    </script>
</body>
</html>
