<?php
// Secure entry point
require_once 'config/db.php';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Internship Attendance</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        neutral: {
                            50: '#fafafa',
                            100: '#f5f5f5',
                            200: '#e5e5e5',
                            800: '#262626',
                            900: '#171717',
                        }
                    }
                }
            }
        }
    </script>
    <link rel="stylesheet" href="assets/css/style.css">
</head>
<body class="bg-neutral-50 text-neutral-900 min-h-screen flex items-center justify-center p-4">

    <div class="max-w-md w-full">
        <!-- Header -->
        <div class="text-center mb-10 fade-in-up flex flex-col items-center">
            <div class="relative group cursor-default">
                <!-- Futuristic Glow Effect -->
                <div class="absolute inset-0 bg-red-500/20 blur-xl rounded-full group-hover:bg-red-500/30 transition-all duration-500"></div>
                <!-- HD Sharp Image with Drop Shadow -->
                <img src="assets/img/LogoSTDC.png" alt="STDC Logo" class="relative h-16 w-auto mb-4 object-contain drop-shadow-[0_8px_16px_rgba(220,38,38,0.25)] transform group-hover:scale-105 transition-all duration-500">
            </div>
            <h1 class="text-3xl font-semibold tracking-tight mb-2">Attendance (STDCx)</h1>
            <p class="text-sm text-neutral-500">Select your name to clock in or out.</p>
        </div>

        <!-- Main Card -->
        <div class="bg-white rounded-2xl shadow-sm border border-neutral-200 p-8 fade-in-up delay-100 hover-scale">
            
            <!-- Student Selector -->
            <div class="mb-6 relative" id="student-selector-container">
                <label for="student-search" class="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2">Student Name</label>
                <div class="relative">
                    <input type="text" id="student-search" class="w-full bg-neutral-50 border border-neutral-200 text-neutral-900 rounded-lg px-4 py-3 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-all duration-300" placeholder="Search for your name..." autocomplete="off">
                    <div id="dropdown-list" class="absolute z-10 w-full mt-2 bg-white border border-neutral-200 rounded-lg shadow-lg max-h-60 overflow-y-auto hidden">
                        <!-- Options injected by JS -->
                    </div>
                </div>
                <input type="hidden" id="selected-student-id">
            </div>

            <!-- Dynamic Status View (Hidden by default) -->
            <div id="status-view" class="hidden mb-8 text-center transition-all duration-500 opacity-0 transform translate-y-4">
                <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-neutral-100 mb-4">
                    <svg id="status-icon" class="w-8 h-8 text-neutral-800" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </div>
                <h2 class="text-xl font-medium tracking-tight mb-1" id="student-display-name"></h2>
                <p class="text-sm text-neutral-500" id="current-status-text">Select an action below</p>
            </div>

            <!-- Action Buttons (Disabled until student selected) -->
            <div class="flex space-x-4 mb-6">
                <button id="btn-clock-in" disabled class="flex-1 bg-neutral-900 text-white rounded-xl py-3 font-medium tracking-tight disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-800 transition-colors duration-300">
                    Clock In
                </button>
                <button id="btn-clock-out" disabled class="flex-1 bg-white text-neutral-900 border border-neutral-200 rounded-xl py-3 font-medium tracking-tight disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-50 transition-colors duration-300">
                    Clock Out
                </button>
            </div>

            <!-- Notification Area -->
            <div id="notification-area" class="mt-4 text-center text-sm font-medium hidden opacity-0 transition-opacity duration-300"></div>

        </div>

        <!-- Footer -->
        <div class="text-center mt-8 fade-in-up delay-200">
            <!-- Admin portal link intentionally removed for security -->
        </div>
    </div>

    <!-- Apple Pay Style Success Overlay -->
    <div id="success-overlay" class="fixed inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-md opacity-0 pointer-events-none transition-opacity duration-500">
        <div id="success-island" class="bg-black text-white rounded-[2.5rem] shadow-2xl flex flex-col items-center justify-center p-8 transform scale-50 opacity-0 transition-all duration-700 ease-[cubic-bezier(0.175,0.885,0.32,1.275)] overflow-hidden" style="width: 200px; height: 200px;">
           <svg id="success-check" class="w-16 h-16 text-white mb-4 draw-checkmark" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
           <p id="success-action" class="font-medium text-lg tracking-tight">Clocked In</p>
           <p id="success-time" class="text-neutral-400 text-sm font-medium mt-1">09:41 AM</p>
        </div>
    </div>

    <!-- Clock Out Confirmation Modal -->
    <div id="confirm-overlay" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm opacity-0 pointer-events-none transition-opacity duration-300">
        <div class="bg-white/90 backdrop-blur-xl w-72 rounded-2xl shadow-2xl flex flex-col overflow-hidden transform scale-95 opacity-0 transition-all duration-300" id="confirm-modal">
            <div class="p-6 text-center border-b border-neutral-200/50">
                <h3 class="font-semibold text-lg tracking-tight text-neutral-900 mb-1">Clock Out</h3>
                <p class="text-xs text-neutral-500 leading-snug">The current time is <span id="confirm-time" class="font-semibold text-neutral-900"></span>. Are you sure you want to end your shift?</p>
            </div>
            <div class="flex">
                <button id="btn-cancel-clockout" class="flex-1 py-3 text-sm font-medium text-neutral-500 hover:bg-neutral-100/50 transition-colors border-r border-neutral-200/50 focus:outline-none">Cancel</button>
                <button id="btn-confirm-clockout" class="flex-1 py-3 text-sm font-bold text-red-600 hover:bg-neutral-100/50 transition-colors focus:outline-none">Clock Out</button>
            </div>
        </div>
    </div>

    <!-- Face Verification Modal -->
    <div id="face-overlay" class="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md opacity-0 pointer-events-none transition-opacity duration-300 p-4">
        <div class="bg-white rounded-3xl shadow-2xl w-full max-w-sm flex flex-col overflow-hidden transform scale-95 opacity-0 transition-all duration-300" id="face-modal">
            <div class="p-6 flex flex-col items-center">
                <h3 class="text-xl font-medium tracking-tight text-neutral-900 mb-2">Face Verification</h3>
                <p class="text-sm text-neutral-500 mb-6 text-center" id="face-status-text">Please look directly at the camera to verify your identity.</p>
                
                <div class="relative w-full aspect-square bg-neutral-900 rounded-2xl overflow-hidden mb-6 shadow-inner ring-4 ring-neutral-100" id="face-video-container">
                    <video id="verify-video" class="w-full h-full object-cover transform scale-x-[-1]" autoplay muted playsinline></video>
                    <canvas id="verify-canvas" class="absolute top-0 left-0 w-full h-full"></canvas>
                    <div id="face-scan-line" class="absolute top-0 left-0 w-full h-1 bg-blue-500 opacity-50 hidden" style="box-shadow: 0 0 10px 2px rgba(59,130,246,0.5);"></div>
                </div>

                <div class="w-full flex justify-center">
                    <button id="btn-cancel-face" class="text-neutral-500 font-medium text-sm hover:text-neutral-900 transition-colors focus:outline-none">Cancel</button>
                </div>
            </div>
        </div>
    </div>

    <!-- Reason Modal -->
    <div id="reason-overlay" class="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm opacity-0 pointer-events-none transition-opacity duration-300 p-4">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden transform scale-95 opacity-0 transition-all duration-300" id="reason-modal">
            <div class="p-6 border-b border-neutral-100">
                <h3 class="text-xl font-semibold tracking-tight text-neutral-900 mb-1" id="reason-title">Reason Required</h3>
                <p class="text-sm text-neutral-500" id="reason-subtitle">Please provide a valid reason for this action.</p>
            </div>
            <div class="p-6">
                <textarea id="reason-input" class="w-full bg-neutral-50 border border-neutral-200 text-neutral-900 rounded-xl px-4 py-3 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-all duration-300 min-h-[100px] resize-none" placeholder="Type your reason here..."></textarea>
            </div>
            <div class="flex border-t border-neutral-100 bg-neutral-50">
                <button id="btn-cancel-reason" class="flex-1 py-4 text-sm font-medium text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors border-r border-neutral-100 focus:outline-none">Cancel</button>
                <button id="btn-submit-reason" class="flex-1 py-4 text-sm font-semibold text-neutral-900 hover:bg-neutral-100 transition-colors focus:outline-none">Submit & Continue</button>
            </div>
        </div>
    </div>

    <!-- Libraries -->
    <script src="js/face-api.min.js"></script>
    <script src="js/tf.min.js"></script>
    <script src="js/coco-ssd.min.js"></script>
    <script src="assets/js/app.js?v=7"></script>
</body>
</html>
