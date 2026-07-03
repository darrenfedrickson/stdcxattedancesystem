// Force HTTPS on external devices to allow webcam access (Apple Safari blocks cameras on HTTP)
if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    window.location.replace('https:' + window.location.href.substring(window.location.protocol.length));
}

document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('student-search');
    const dropdownList = document.getElementById('dropdown-list');
    const selectedStudentId = document.getElementById('selected-student-id');
    const statusView = document.getElementById('status-view');
    const studentDisplayName = document.getElementById('student-display-name');
    const btnClockIn = document.getElementById('btn-clock-in');
    const btnClockOut = document.getElementById('btn-clock-out');
    const geoStatus = document.getElementById('geo-status');
    const notificationArea = document.getElementById('notification-area');
    
    let students = [];
    let currentStudentStatus = null; // Track today's status
    let userMap = null;
    let userMarker = null;

    // --- Face Verification Vars ---
    const faceOverlay = document.getElementById('face-overlay');
    const faceModal = document.getElementById('face-modal');
    const verifyVideo = document.getElementById('verify-video');
    const verifyCanvas = document.getElementById('verify-canvas');
    const btnCancelFace = document.getElementById('btn-cancel-face');
    const faceStatusText = document.getElementById('face-status-text');
    const faceScanLine = document.getElementById('face-scan-line');
    
    let isFaceApiLoaded = false;
    let verifyStream = null;
    let faceDetectionInterval = null;
    let pendingAction = null;
    let cocoSsdModel = null;
    let isDeviceDetected = false;

    fetch('api/get_students.php')
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                students = data.data;
            }
        });

    searchInput.addEventListener('input', (e) => {
        const val = e.target.value.toLowerCase();
        dropdownList.innerHTML = '';
        
        if (!val) {
            dropdownList.classList.add('hidden');
            return;
        }

        const filtered = students.filter(s => s.full_name.toLowerCase().includes(val));
        if (filtered.length > 0) {
            filtered.forEach(s => {
                const div = document.createElement('div');
                div.className = 'px-4 py-3 hover:bg-neutral-50 cursor-pointer text-sm text-neutral-800 transition-colors border-b border-neutral-50 last:border-0';
                div.textContent = s.full_name;
                div.addEventListener('click', () => selectStudent(s));
                dropdownList.appendChild(div);
            });
            dropdownList.classList.remove('hidden');
        } else {
            dropdownList.innerHTML = '<div class="px-4 py-3 text-sm text-neutral-500 italic">No student found</div>';
            dropdownList.classList.remove('hidden');
        }
    });

    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !dropdownList.contains(e.target)) {
            dropdownList.classList.add('hidden');
        }
    });

    function selectStudent(student) {
        selectedStudentId.value = student.id;
        searchInput.value = '';
        dropdownList.classList.add('hidden');
        
        studentDisplayName.textContent = student.full_name;
        document.getElementById('current-status-text').textContent = 'Checking today\'s status...';
        
        statusView.classList.remove('hidden');
        void statusView.offsetWidth; // trigger reflow
        statusView.classList.remove('opacity-0', 'translate-y-4');
        
        // Fetch status
        fetch(`api/get_student_status.php?student_id=${student.id}`)
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    currentStudentStatus = data.data;
                    updateUIForStatus();
                }
            });
    }

    function updateUIForStatus() {
        if (currentStudentStatus.has_clocked_out) {
            document.getElementById('current-status-text').textContent = 'Shift completed for today.';
            
            const icon = document.getElementById('status-icon');
            icon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M5 13l4 4L19 7"></path>`;
            icon.classList.replace('text-neutral-800', 'text-neutral-500');
            
        } else if (currentStudentStatus.has_clocked_in) {
            document.getElementById('current-status-text').textContent = 'Currently clocked in. Ready to clock out.';
            
            const icon = document.getElementById('status-icon');
            icon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>`;
            icon.classList.replace('text-neutral-500', 'text-neutral-800');
            
        } else {
            document.getElementById('current-status-text').textContent = 'Ready to clock in.';
            
            const icon = document.getElementById('status-icon');
            icon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>`;
        }
        updateButtonStates();
    }

    function updateButtonStates() {
        if (selectedStudentId.value && currentStudentStatus) {
            btnClockIn.disabled = currentStudentStatus.has_clocked_in; // disabled if already clocked in
            btnClockOut.disabled = !currentStudentStatus.has_clocked_in || currentStudentStatus.has_clocked_out; // disabled if haven't clocked in, or already clocked out
        } else {
            btnClockIn.disabled = true;
            btnClockOut.disabled = true;
        }
    }

    function showNotification(msg, isSuccess) {
        notificationArea.textContent = msg;
        notificationArea.className = `mt-4 text-center text-sm font-medium p-3 rounded-lg transition-opacity duration-300 ${isSuccess ? 'bg-neutral-100 text-neutral-900 border border-neutral-200' : 'bg-red-50 text-red-700 border border-red-200'}`;
        notificationArea.classList.remove('hidden', 'opacity-0');
        
        setTimeout(() => {
            notificationArea.classList.add('opacity-0');
            setTimeout(() => notificationArea.classList.add('hidden'), 300);
        }, 5000);
    }

    function triggerSuccessAnimation(actionText, timeStr) {
        const overlay = document.getElementById('success-overlay');
        const island = document.getElementById('success-island');
        
        document.getElementById('success-action').textContent = actionText;
        document.getElementById('success-time').textContent = timeStr;

        // Reset checkmark animation by cloning it
        const checkSvg = document.getElementById('success-check');
        const newCheck = checkSvg.cloneNode(true);
        checkSvg.parentNode.replaceChild(newCheck, checkSvg);

        // Show overlay
        overlay.classList.remove('opacity-0', 'pointer-events-none');
        
        // Expand island
        setTimeout(() => {
            island.classList.remove('scale-50', 'opacity-0');
            island.classList.add('scale-100', 'opacity-100');
        }, 50);

        // Hide after 2.5s
        setTimeout(() => {
            overlay.classList.add('opacity-0', 'pointer-events-none');
            island.classList.remove('scale-100', 'opacity-100');
            island.classList.add('scale-50', 'opacity-0');
        }, 2500);
    }

    // 4. Submit Attendance
    function logAttendance(actionType, imageBase64 = null, reasonText = null) {
        if (!selectedStudentId.value) return;

        btnClockIn.disabled = true;
        btnClockOut.disabled = true;

        const payload = {
            student_id: selectedStudentId.value,
            action_type: actionType,
            image_base64: imageBase64,
            reason: reasonText
        };

        fetch('api/log_attendance.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                const actionText = actionType === 'clock_in' ? 'Clocked In' : 'Clocked Out';
                const timeStr = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                
                // Trigger morph animation
                triggerSuccessAnimation(actionText, timeStr);
                
                // Update local status
                if (actionType === 'clock_in') currentStudentStatus.has_clocked_in = true;
                if (actionType === 'clock_out') currentStudentStatus.has_clocked_out = true;
                
                // Update UI text and buttons
                updateUIForStatus();

            } else {
                showNotification(data.error || "An error occurred.", false);
            }
        })
        .catch(err => {
            showNotification("Network error. Please try again.", false);
        })
        .finally(() => {
            updateButtonStates();
        });
    }

    const confirmOverlay = document.getElementById('confirm-overlay');
    const confirmModal = document.getElementById('confirm-modal');
    const confirmTime = document.getElementById('confirm-time');
    const btnCancelClockout = document.getElementById('btn-cancel-clockout');
    const btnConfirmClockout = document.getElementById('btn-confirm-clockout');

    function showClockOutConfirm() {
        if (btnClockOut.disabled) return;
        confirmTime.textContent = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        confirmOverlay.classList.remove('opacity-0', 'pointer-events-none');
        confirmModal.classList.remove('scale-95', 'opacity-0');
        confirmModal.classList.add('scale-100', 'opacity-100');
    }

    function hideClockOutConfirm() {
        confirmOverlay.classList.add('opacity-0', 'pointer-events-none');
        confirmModal.classList.remove('scale-100', 'opacity-100');
        confirmModal.classList.add('scale-95', 'opacity-0');
    }

    // 4. Face Verification Logic
    function getDistance(pt1, pt2) {
        return Math.sqrt(Math.pow(pt1.x - pt2.x, 2) + Math.pow(pt1.y - pt2.y, 2));
    }

    async function loadFaceApi() {
        if (isFaceApiLoaded) return;
        try {
            await Promise.all([
                faceapi.nets.tinyFaceDetector.loadFromUri('models'),
                faceapi.nets.faceLandmark68Net.loadFromUri('models'),
                faceapi.nets.faceRecognitionNet.loadFromUri('models')
            ]);
            
            // Load COCO-SSD
            if (!cocoSsdModel) {
                cocoSsdModel = await cocoSsd.load({ modelUrl: 'models/coco-ssd/model.json' });
            }
            
            isFaceApiLoaded = true;
        } catch (e) {
            console.error("Error loading models:", e);
        }
    }

    async function startFaceVerification(actionType) {
        if (!currentStudentStatus.has_face || !currentStudentStatus.face_descriptor) {
            showNotification("Your face is not registered. Please see an Admin.", false);
            return;
        }

        pendingAction = actionType;
        isDeviceDetected = false;
        faceOverlay.classList.remove('opacity-0', 'pointer-events-none');
        faceModal.classList.remove('scale-95', 'opacity-0');
        faceStatusText.textContent = isFaceApiLoaded ? "Please look directly at the camera..." : "Initializing AI Engine...";
        faceScanLine.classList.remove('hidden');
        faceScanLine.classList.add('animate-scan');

        try {
            verifyStream = await navigator.mediaDevices.getUserMedia({ video: true });
            verifyVideo.srcObject = verifyStream;
        } catch (err) {
            alert("Could not access webcam: " + err.message);
            closeFaceVerification();
            return;
        }

        if (!isFaceApiLoaded) {
            await loadFaceApi();
            faceStatusText.textContent = "Please look directly at the camera...";
        }

        // The descriptor from DB
        const savedDescriptor = new Float32Array(currentStudentStatus.face_descriptor);

        // Liveness State
        let livenessState = 'TURN_LEFT'; // Sequence: TURN_LEFT -> TURN_RIGHT -> LOOK_FORWARD -> MATCH
        
        verifyVideo.addEventListener('play', () => {
            if (faceDetectionInterval) clearInterval(faceDetectionInterval);
            
            faceDetectionInterval = setInterval(async () => {
                if (verifyVideo.paused || verifyVideo.ended) return;
                
                // On iOS, the video dimensions might not be ready immediately upon 'play'
                if (verifyVideo.videoWidth === 0 || verifyVideo.videoHeight === 0 || verifyVideo.clientWidth === 0) return;

                const displaySize = { width: verifyVideo.clientWidth, height: verifyVideo.clientHeight };
                faceapi.matchDimensions(verifyCanvas, displaySize);
                
                try {
                    // --- DEVICE DETECTION (SPOOFING) ---
                    if (cocoSsdModel) {
                        const predictions = await cocoSsdModel.detect(verifyVideo);
                        const badDevices = ['cell phone', 'laptop', 'tv'];
                        const foundDevice = predictions.find(p => badDevices.includes(p.class));
                        
                        if (foundDevice) {
                            isDeviceDetected = true;
                            faceStatusText.textContent = `Spoofing Detected: Please remove ${foundDevice.class}.`;
                            faceStatusText.className = "text-sm text-red-600 mb-6 text-center font-bold animate-pulse";
                            const ctx = verifyCanvas.getContext('2d');
                            ctx.clearRect(0, 0, verifyCanvas.width, verifyCanvas.height);
                            return; // Halt face verification while device is detected
                        } else {
                            isDeviceDetected = false;
                        }
                    }
                    
                    if (isDeviceDetected) return;
                
                const detection = await faceapi.detectSingleFace(verifyVideo, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptor();
                
                const ctx = verifyCanvas.getContext('2d');
                ctx.clearRect(0, 0, verifyCanvas.width, verifyCanvas.height);
                
                if (detection) {
                    const resizedDetection = faceapi.resizeResults(detection, displaySize);
                    ctx.save();
                    ctx.translate(verifyCanvas.width, 0);
                    ctx.scale(-1, 1);
                    faceapi.draw.drawDetections(verifyCanvas, resizedDetection);
                    // Draw landmarks so user sees it tracking
                    faceapi.draw.drawFaceLandmarks(verifyCanvas, resizedDetection);
                    ctx.restore();

                    const landmarks = detection.landmarks.positions;
                    const noseTip = landmarks[30];
                    const leftEdge = landmarks[0];
                    const rightEdge = landmarks[16];

                    // Note: image is horizontally flipped in CSS, but landmarks are original coordinates
                    // leftEdge has smaller X, rightEdge has larger X.
                    const distLeft = noseTip.x - leftEdge.x;
                    const distRight = rightEdge.x - noseTip.x;
                    const yawRatio = distLeft / distRight;

                    // No distance check, straight to matching

                    // --- END OF FACE TRACKING ---
                    
                    // Proceed directly to Matching (Liveness skipped per user request)
                    faceStatusText.textContent = "Matching face...";
                    faceStatusText.className = "text-sm text-blue-500 mb-6 text-center font-bold";
                    
                    // Compare descriptors
                    const distance = faceapi.euclideanDistance(savedDescriptor, detection.descriptor);
                    
                    if (distance < 0.4) { // Strict match threshold
                        clearInterval(faceDetectionInterval);
                        
                        // Snap a picture from the video feed before closing
                        const snapCanvas = document.createElement('canvas');
                        snapCanvas.width = verifyVideo.videoWidth;
                        snapCanvas.height = verifyVideo.videoHeight;
                        const snapCtx = snapCanvas.getContext('2d');
                        // Mirror the context so the saved photo matches the user's preview
                        snapCtx.translate(snapCanvas.width, 0);
                        snapCtx.scale(-1, 1);
                        snapCtx.drawImage(verifyVideo, 0, 0, snapCanvas.width, snapCanvas.height);
                        const imageBase64 = snapCanvas.toDataURL('image/jpeg', 0.8);

                        faceStatusText.textContent = "Verification Successful!";
                        faceStatusText.className = "text-sm text-green-500 mb-6 text-center font-bold";
                        setTimeout(() => {
                            closeFaceVerification();
                            checkReasonRequirement(pendingAction, imageBase64);
                        }, 1000);
                    } else {
                        faceStatusText.textContent = `Does not match (Variance: ${(distance * 100).toFixed(0)}%).`;
                        faceStatusText.className = "text-sm text-red-500 mb-6 text-center font-bold";
                    }
                } else {
                    faceStatusText.textContent = "Searching for face...";
                    faceStatusText.className = "text-sm text-neutral-500 mb-6 text-center";
                }
                } catch (e) {
                    console.error("Detection error:", e);
                }
            }, 150); 
        });
    }

    // Modal elements for Reason
    const reasonOverlay = document.getElementById('reason-overlay');
    const reasonModal = document.getElementById('reason-modal');
    const reasonInput = document.getElementById('reason-input');
    const btnCancelReason = document.getElementById('btn-cancel-reason');
    const btnSubmitReason = document.getElementById('btn-submit-reason');
    const reasonTitle = document.getElementById('reason-title');
    
    let currentReasonImage = null;
    let currentReasonAction = null;

    function checkReasonRequirement(action, imageB64) {
        const now = new Date();
        const hr = now.getHours();
        const min = now.getMinutes();
        let needsReason = false;
        
        if (action === 'clock_in') {
            if ((hr > 8) || (hr === 8 && min > 30)) {
                needsReason = true;
                reasonTitle.textContent = "Late Clock In Reason";
            }
        } else if (action === 'clock_out') {
            if (currentStudentStatus.clock_in_time) {
                const inDate = new Date(currentStudentStatus.clock_in_time);
                let effStart = new Date(inDate);
                if (inDate.getHours() < 8) effStart.setHours(8, 0, 0, 0);
                const expectedOut = new Date(effStart.getTime() + (9 * 3600 * 1000));
                
                if (now < expectedOut) {
                    needsReason = true;
                    reasonTitle.textContent = "Early Leave Reason";
                }
            }
        }

        if (needsReason) {
            currentReasonImage = imageB64;
            currentReasonAction = action;
            reasonInput.value = '';
            
            reasonOverlay.classList.remove('opacity-0', 'pointer-events-none');
            setTimeout(() => {
                reasonModal.classList.remove('scale-95', 'opacity-0');
            }, 50);
        } else {
            logAttendance(action, imageB64);
        }
    }

    btnCancelReason.addEventListener('click', () => {
        reasonModal.classList.add('scale-95', 'opacity-0');
        setTimeout(() => {
            reasonOverlay.classList.add('opacity-0', 'pointer-events-none');
        }, 300);
    });

    btnSubmitReason.addEventListener('click', () => {
        const text = reasonInput.value.trim();
        if (!text) {
            alert("Please provide a reason.");
            return;
        }
        
        reasonModal.classList.add('scale-95', 'opacity-0');
        setTimeout(() => {
            reasonOverlay.classList.add('opacity-0', 'pointer-events-none');
            logAttendance(currentReasonAction, currentReasonImage, text);
        }, 300);
    });

    function closeFaceVerification() {
        faceOverlay.classList.add('opacity-0', 'pointer-events-none');
        faceModal.classList.add('scale-95', 'opacity-0');
        faceScanLine.classList.add('hidden');
        faceScanLine.classList.remove('animate-scan');
        if (verifyStream) {
            verifyStream.getTracks().forEach(track => track.stop());
            verifyStream = null;
        }
        if (faceDetectionInterval) {
            clearInterval(faceDetectionInterval);
            faceDetectionInterval = null;
        }
        const ctx = verifyCanvas.getContext('2d');
        ctx.clearRect(0, 0, verifyCanvas.width, verifyCanvas.height);
        faceStatusText.className = "text-sm text-neutral-500 mb-6 text-center";
    }

    btnCancelFace.addEventListener('click', closeFaceVerification);

    btnClockIn.addEventListener('click', () => {
        startFaceVerification('clock_in');
    });
    btnClockOut.addEventListener('click', () => {
        showClockOutConfirm();
    });
    btnCancelClockout.addEventListener('click', hideClockOutConfirm);
    btnConfirmClockout.addEventListener('click', () => {
        hideClockOutConfirm();
        startFaceVerification('clock_out');
    });
});
