<?php
// Secure entry point
require_once '../config/db.php';
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
    <title>Admin Dashboard | Attendance</title>
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
    <link rel="stylesheet" href="style.css">
</head>
<body class="bg-neutral-50 text-neutral-900 min-h-screen">
    
    <!-- Top Nav -->
    <nav class="bg-white border-b border-neutral-200 sticky top-0 z-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between h-16 items-center">
                <div class="flex items-center group cursor-pointer">
                    <div class="relative">
                        <div class="absolute inset-0 bg-red-500/20 blur-md rounded-full group-hover:bg-red-500/40 transition-all duration-300"></div>
                        <img src="../assets/img/LogoSTDC.png" alt="STDC Logo" class="relative h-7 w-auto mr-3 object-contain drop-shadow-[0_2px_6px_rgba(220,38,38,0.4)] transform group-hover:scale-105 transition-all duration-300">
                    </div>
                    <h1 class="text-xl font-semibold tracking-tight">Admin Dashboard (STDCx)</h1>
                </div>
                <div class="flex items-center space-x-4">
                    <a href="../" class="text-sm font-medium text-neutral-500 hover:text-neutral-900 transition-colors">User Portal</a>
                    <a href="settings.php" class="text-sm font-medium text-neutral-500 hover:text-neutral-900 transition-colors">Settings</a>
                    <a href="../api/admin/auth_logout.php" class="text-sm font-medium text-red-500 hover:text-red-700 transition-colors">Log Out</a>
                </div>
            </div>
        </div>
    </nav>

    <div class="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col lg:flex-row gap-6">
        
        <!-- Left Sidebar / Forms -->
        <div class="lg:w-1/4 space-y-6">
            
            <!-- Student Registry -->
            <div class="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm fade-in">
                <h2 class="text-lg font-medium tracking-tight mb-4">Student Registry</h2>
                <button id="btn-open-registry" class="w-full bg-neutral-900 text-white px-4 py-3 rounded-xl text-sm font-medium hover:bg-neutral-800 transition-colors shadow-sm flex items-center justify-center gap-2 focus:outline-none">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                    Manage Registry
                </button>
            </div>

            <!-- Filters -->
            <div class="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm fade-in" style="animation-delay: 100ms;">
                <h2 class="text-lg font-medium tracking-tight mb-4">Filters</h2>
                <div class="space-y-4">
                    <div>
                        <label class="block text-xs font-medium text-neutral-500 mb-1 uppercase tracking-wider">Batch Folder</label>
                        <select id="filter-batch" class="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-all mb-4">
                            <option value="">All Batches</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-xs font-medium text-neutral-500 mb-1 uppercase tracking-wider">Student</label>
                        <select id="filter-student" class="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-all">
                            <option value="">All Students</option>
                        </select>
                    </div>
                    <div class="grid grid-cols-2 gap-2">
                        <div>
                            <label class="block text-xs font-medium text-neutral-500 mb-1 uppercase tracking-wider">Date From</label>
                            <input type="date" id="filter-start-date" class="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2 py-2 text-[13px] focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-all">
                        </div>
                        <div>
                            <label class="block text-xs font-medium text-neutral-500 mb-1 uppercase tracking-wider">Date To</label>
                            <input type="date" id="filter-end-date" class="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2 py-2 text-[13px] focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-all">
                        </div>
                    </div>
                    <div>
                        <label class="block text-xs font-medium text-neutral-500 mb-1 uppercase tracking-wider">Action</label>
                        <select id="filter-action" class="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-all">
                            <option value="">All Actions</option>
                            <option value="clock_in">Clock In</option>
                            <option value="clock_out">Clock Out</option>
                        </select>
                    </div>
                    <button id="btn-apply-filters" class="w-full bg-white text-neutral-900 border border-neutral-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-neutral-50 transition-colors mt-2">Apply Filters</button>
                </div>
            </div>

            <!-- Dashboard / Chart Placeholder -->
            <div id="chart-wrapper" class="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm h-96 fade-in relative group" style="animation-delay: 200ms;">
                <button id="btn-expand-chart" class="absolute top-4 right-4 p-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 rounded-md opacity-0 group-hover:opacity-100 transition-opacity z-10" title="Expand Chart">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"></path></svg>
                </button>
                <div id="chart-container" class="w-full h-full relative">
                    <canvas id="attendanceChart"></canvas>
                </div>
            </div>

        </div>

        <!-- Right Content / Ledger -->
        <div class="lg:w-3/4">
            <div class="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden fade-in" style="animation-delay: 300ms;">
                
                <div class="p-6 border-b border-neutral-200 flex justify-between items-center bg-neutral-50/50 flex-wrap gap-4">
                    <h2 class="text-lg font-medium tracking-tight">Analytics Ledger</h2>
                    <div class="flex items-center gap-3">
                        <button id="btn-export-csv" class="text-sm font-medium text-neutral-600 hover:text-neutral-900 border border-neutral-200 bg-white px-3 py-1.5 rounded-md shadow-sm transition-all flex items-center gap-1 hover:bg-neutral-50">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                            Export CSV
                        </button>
                        <div class="bg-neutral-100 p-1 rounded-lg inline-flex">
                            <button id="view-table" class="px-3 py-1 text-sm font-medium rounded-md bg-white shadow-sm text-neutral-900 transition-all">Table</button>
                            <button id="view-timeline" class="px-3 py-1 text-sm font-medium rounded-md text-neutral-500 hover:text-neutral-900 transition-all">Timeline</button>
                            <button id="view-grid" class="px-3 py-1 text-sm font-medium rounded-md text-neutral-500 hover:text-neutral-900 transition-all">Photo Grid</button>
                            <button id="view-performance" class="px-3 py-1 text-sm font-medium rounded-md text-neutral-500 hover:text-neutral-900 transition-all flex items-center gap-1">
                                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
                                Performance
                            </button>
                        </div>
                    </div>
                </div>

                <div class="p-0">
                    <!-- Table View -->
                    <div id="table-container" class="overflow-x-auto block">
                        <table class="w-full text-left border-collapse">
                            <thead>
                                <tr class="bg-neutral-50 border-b border-neutral-200 text-xs uppercase text-neutral-500 tracking-wider">
                                    <th class="p-4 font-medium">Date</th>
                                    <th class="p-4 font-medium">Student</th>
                                    <th class="p-4 font-medium">Clock In</th>
                                    <th class="p-4 font-medium">Clock Out</th>
                                    <th class="p-4 font-medium">Total Hrs</th>
                                    <th class="p-4 font-medium">Time Status</th>
                                    <th class="p-4 font-medium">Photo Status</th>
                                </tr>
                            </thead>
                            <tbody id="logs-tbody" class="text-sm divide-y divide-neutral-100">
                                <!-- Injected by JS -->
                            </tbody>
                        </table>
                    </div>

                    <!-- Timeline View -->
                    <div id="timeline-container" class="hidden p-6 max-h-[600px] overflow-y-auto">
                        <div class="relative border-l border-neutral-200 ml-3 space-y-8" id="logs-timeline">
                            <!-- Injected by JS -->
                        </div>
                    </div>

                    <!-- Photo Grid View -->
                    <div id="grid-container" class="hidden p-6 max-h-[600px] overflow-y-auto">
                        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6" id="logs-grid">
                            <!-- Injected by JS -->
                        </div>
                    </div>

                    <!-- Performance View -->
                    <div id="performance-container" class="hidden p-6 max-h-[600px] overflow-y-auto bg-neutral-50">
                        <!-- Executive Summary -->
                        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6" id="performance-summary">
                            <!-- Injected by JS -->
                        </div>
                        
                        <!-- Performance Table -->
                        <div class="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden overflow-x-auto">
                            <table class="w-full text-left border-collapse">
                                <thead>
                                    <tr class="bg-neutral-50 border-b border-neutral-200 text-xs uppercase text-neutral-500 tracking-wider">
                                        <th class="p-3 font-medium">Student Name</th>
                                        <th class="p-3 font-medium text-center">Score</th>
                                        <th class="p-3 font-medium text-center">Status</th>
                                        <th class="p-3 font-medium text-center">Kehadiran (40%)</th>
                                        <th class="p-3 font-medium text-center">Ketepatan (30%)</th>
                                        <th class="p-3 font-medium text-center">Kelengkapan (30%)</th>
                                        <th class="p-3 font-medium text-center">Isu / Penalti</th>
                                    </tr>
                                </thead>
                                <tbody id="performance-tbody" class="text-sm divide-y divide-neutral-100">
                                    <!-- Injected by JS -->
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>
            </div>
        </div>

    </div>

    <!-- Student Registry Modal -->
    <div id="registry-overlay" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm opacity-0 pointer-events-none transition-opacity duration-300 p-4">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-5xl flex flex-col md:flex-row overflow-hidden transform scale-95 opacity-0 transition-all duration-300" id="registry-modal" style="height: 75vh;">
            
            <!-- Left Pane: Batch Folders -->
            <div class="w-full md:w-1/3 border-r border-neutral-200 flex flex-col bg-neutral-50/50">
                <div class="p-5 border-b border-neutral-200 flex justify-between items-center bg-white">
                    <h3 class="font-semibold text-neutral-900">Batch Folders</h3>
                    <button id="btn-close-registry" class="text-neutral-400 hover:text-neutral-900 transition-colors focus:outline-none md:hidden">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>
                <div class="p-4 border-b border-neutral-200 bg-white">
                    <div class="flex gap-2">
                        <input type="text" id="new-batch-name" class="flex-1 bg-neutral-50 border border-neutral-200 text-neutral-900 rounded-lg px-3 py-2 text-sm focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-all" placeholder="New folder name">
                        <button id="btn-add-batch" class="bg-neutral-900 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors focus:outline-none">+</button>
                    </div>
                </div>
                <div class="flex-1 overflow-y-auto p-4 space-y-2" id="batch-list-container">
                    <!-- Batch folders injected by JS -->
                </div>
                
                <!-- Trash Section -->
                <div class="p-4 border-t border-neutral-200 bg-neutral-100/50">
                    <button id="btn-view-trash" class="w-full flex items-center justify-center gap-2 py-2 text-sm font-medium text-neutral-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors focus:outline-none">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        <span>View Trash</span>
                    </button>
                </div>
            </div>

            <!-- Right Pane: Students -->
            <div class="w-full md:w-2/3 flex flex-col bg-white relative">
                <button id="btn-close-registry-right" class="absolute top-5 right-5 text-neutral-400 hover:text-neutral-900 transition-colors focus:outline-none hidden md:block">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
                <div class="p-5 border-b border-neutral-200 flex justify-between items-center bg-neutral-50/50 pr-14">
                    <h3 class="font-semibold text-neutral-900 flex items-center gap-2" id="current-batch-title">
                        <svg class="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path></svg>
                        <span>Select a Batch</span>
                    </h3>
                    <button id="btn-delete-batch" class="text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors hidden focus:outline-none">Delete Folder</button>
                </div>
                
                <!-- Add Student Bar -->
                <div class="p-4 border-b border-neutral-200 flex gap-2 hidden" id="add-student-bar">
                    <input type="text" id="new-student-name" class="flex-1 bg-neutral-50 border border-neutral-200 text-neutral-900 rounded-lg px-4 py-2 text-sm focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-all" placeholder="Add student to this batch...">
                    <button id="btn-add-student" class="bg-neutral-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors focus:outline-none">Add</button>
                </div>

                <!-- Bulk Action Bar -->
                <div class="px-4 py-3 border-b border-neutral-200 bg-blue-50/50 flex items-center justify-between hidden" id="bulk-action-bar">
                    <span class="text-sm font-medium text-blue-800"><span id="bulk-count">0</span> selected</span>
                    <div class="flex gap-2">
                        <select id="bulk-move-select" class="bg-white border border-neutral-200 text-neutral-900 rounded-lg px-3 py-1.5 text-sm focus:outline-none">
                            <option value="">Move to folder...</option>
                        </select>
                        <button id="btn-bulk-move" class="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors focus:outline-none hidden">Move</button>
                    </div>
                </div>

                <!-- Student List -->
                <div class="flex-1 overflow-y-auto p-4" id="student-list-container">
                    <div class="h-full flex items-center justify-center text-neutral-400 text-sm">
                        Select a folder on the left to view students.
                    </div>
                </div>
            </div>
            
        </div>
    </div>

    <!-- Custom Glassy Confirm Modal -->
    <div id="confirm-overlay" class="fixed inset-0 z-[60] flex items-center justify-center bg-black/20 backdrop-blur-md opacity-0 pointer-events-none transition-opacity duration-300 p-4">
        <div class="bg-white/70 backdrop-blur-xl border border-white/50 rounded-2xl shadow-2xl w-full max-w-sm flex flex-col overflow-hidden transform scale-95 opacity-0 transition-all duration-300" id="confirm-modal">
            <div class="p-6 text-center">
                <div class="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4 text-red-600">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                </div>
                <h3 class="text-lg font-semibold text-neutral-900 mb-2" id="confirm-title">Are you sure?</h3>
                <p class="text-sm text-neutral-600" id="confirm-message">This action cannot be undone.</p>
            </div>
            <div class="flex border-t border-white/50">
                <button id="btn-confirm-cancel" class="flex-1 py-3 text-sm font-medium text-neutral-600 hover:bg-white/40 transition-colors focus:outline-none border-r border-white/50">Cancel</button>
                <button id="btn-confirm-ok" class="flex-1 py-3 text-sm font-semibold text-red-600 hover:bg-white/40 transition-colors focus:outline-none">Confirm</button>
            </div>
        </div>
    </div>

    <!-- Face Enrollment Modal -->
    <div id="enroll-overlay" class="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 backdrop-blur-sm opacity-0 pointer-events-none transition-opacity duration-300 p-4">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden transform scale-95 opacity-0 transition-all duration-300" id="enroll-modal">
            <div class="p-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
                <h3 class="font-medium text-neutral-900" id="enroll-title">Enroll Face</h3>
                <button id="btn-close-enroll" class="text-neutral-400 hover:text-neutral-900 focus:outline-none transition-colors">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
            </div>
            <div class="p-4 flex flex-col items-center">
                <p class="text-sm text-neutral-500 mb-4 text-center">Position the student's face clearly in the frame. The AI will extract the facial blueprint.</p>
                <div class="relative w-full max-w-sm aspect-[4/3] bg-neutral-900 rounded-xl overflow-hidden mb-4 shadow-inner">
                    <video id="enroll-video" class="w-full h-full object-cover transform scale-x-[-1]" autoplay muted playsinline></video>
                    <canvas id="enroll-canvas" class="absolute top-0 left-0 w-full h-full"></canvas>
                </div>
                <button id="btn-capture-face" class="bg-blue-600 text-white px-6 py-2.5 rounded-full text-sm font-medium hover:bg-blue-700 transition-colors focus:outline-none shadow-md disabled:opacity-50 flex items-center gap-2">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                    <span id="enroll-btn-text">Initializing AI...</span>
                </button>
            </div>
        </div>
    </div>

    <!-- View Reason Modal -->
    <div id="view-reason-overlay" class="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 backdrop-blur-sm opacity-0 pointer-events-none transition-opacity duration-300 p-4">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm flex flex-col overflow-hidden transform scale-95 opacity-0 transition-all duration-300" id="view-reason-modal">
            <div class="p-5 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
                <h3 class="font-medium text-neutral-900" id="view-reason-title">Reason Provided</h3>
                <button id="btn-close-view-reason" class="text-neutral-400 hover:text-neutral-900 focus:outline-none transition-colors">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
            </div>
            <div class="p-6">
                <p class="text-sm text-neutral-800 leading-relaxed bg-neutral-50 p-4 rounded-xl border border-neutral-100 italic" id="view-reason-text">No reason provided.</p>
            </div>
            <div class="p-4 border-t border-neutral-100 bg-neutral-50/50 flex justify-end">
                <button id="btn-done-view-reason" class="px-4 py-2 bg-neutral-900 text-white rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors focus:outline-none">Done</button>
            </div>
        </div>
    </div>
    <!-- View Photo Modal -->
    <div id="view-photo-overlay" class="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm opacity-0 pointer-events-none transition-opacity duration-300 p-4">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden transform scale-95 opacity-0 transition-all duration-300" id="view-photo-modal">
            <div class="p-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
                <div class="flex items-center gap-3">
                    <h3 class="font-medium text-neutral-900" id="view-photo-title">Photo Preview</h3>
                    <span id="view-photo-badge" class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide"></span>
                </div>
                <button id="btn-close-view-photo" class="text-neutral-400 hover:text-neutral-900 focus:outline-none transition-colors">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
            </div>
            <div class="relative w-full aspect-video bg-neutral-100 flex items-center justify-center">
                <img id="view-photo-img" src="" class="w-full h-full object-cover hidden" alt="Clock In Photo">
                <div id="view-photo-empty" class="text-neutral-400 text-sm uppercase tracking-wider hidden">No Photo Available</div>
            </div>
            <div class="p-4 bg-neutral-50/50 flex justify-end gap-2" id="view-photo-actions">
                <!-- Action buttons injected by JS -->
            </div>
        </div>
    </div>
    <!-- Chart Drill-down Modal -->
    <div id="chart-drilldown-overlay" class="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm opacity-0 pointer-events-none transition-opacity duration-300 p-4">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden transform scale-95 opacity-0 transition-all duration-300" id="chart-drilldown-modal">
            <div class="p-5 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
                <div>
                    <h3 class="font-medium text-neutral-900" id="chart-drilldown-title">Attendance Details</h3>
                    <p class="text-xs text-neutral-500 mt-1" id="chart-drilldown-subtitle">Specific Date</p>
                </div>
                <button id="btn-close-chart-drilldown" class="text-neutral-400 hover:text-neutral-900 focus:outline-none transition-colors">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
            </div>
            <div class="p-0 max-h-[60vh] overflow-y-auto">
                <table class="w-full text-left border-collapse">
                    <thead class="sticky top-0 bg-neutral-50 border-b border-neutral-200 z-10">
                        <tr class="text-xs uppercase text-neutral-500 tracking-wider">
                            <th class="p-3 font-medium">Student Name</th>
                            <th class="p-3 font-medium">Batch</th>
                            <th class="p-3 font-medium">Status</th>
                        </tr>
                    </thead>
                    <tbody id="chart-drilldown-tbody" class="text-sm divide-y divide-neutral-100">
                        <!-- Injected by JS -->
                    </tbody>
                </table>
            </div>
            <div class="p-4 border-t border-neutral-100 bg-neutral-50/50 flex justify-end">
                <button id="btn-done-chart-drilldown" class="px-4 py-2 bg-neutral-900 text-white rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors focus:outline-none">Close</button>
            </div>
        </div>
    </div>
    <!-- Libraries -->
    <script src="../js/face-api.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="admin.js?v=16"></script>
</body>
</html>
