# Project Report: STDCx Attendance System with Facial Recognition

## 1. Introduction
The STDCx Attendance System is a modern, local-first web application designed specifically for tracking internship attendance. Built with an elegant "Apple Monochrome" aesthetic, the system leverages advanced facial recognition technology (TensorFlow.js and face-api.js) to automate the clock-in and clock-out process. It is built using a PHP and MySQL backend, ensuring a lightweight and responsive experience.

## 2. Problem Statement
Traditional attendance tracking methods, such as manual sign-in sheets or ID card tapping, are prone to inaccuracies, buddy-punching, and administrative overhead. For internship programs, maintaining strict and accurate attendance records is crucial. Furthermore, exposing an internal attendance system to the public internet poses significant security and privacy risks. There is a need for a highly secure, automated, and spoof-resistant attendance system that operates strictly on a local network.

## 3. Objective
- To develop an automated attendance tracking system using real-time facial recognition.
- To create a secure, local-first application strictly bound to `127.0.0.1` to prevent unauthorized external access.
- To design a user-friendly, modern interface with an "Apple Monochrome" aesthetic.
- To provide an administrative dashboard for managing student data, batches, and exporting attendance logs.

## 4. Significance
This project eliminates manual attendance taking, saving time for both interns and administrators. By utilizing facial recognition, it guarantees the authenticity of the attendance record (preventing buddy-punching). The strict local-machine lockout ensures maximum data privacy, making it an ideal solution for internal organizational use where data security is paramount.

## 5. How to Handle It (System Setup & Usage)

### Prerequisites
- XAMPP (Apache & MySQL) installed on the host machine.
- A webcam connected to the host machine.

### Installation & Setup
1. **Clone the Repository:** Place the project folder (`attendanceapple`) inside your XAMPP `htdocs` directory.
2. **Database Setup:** 
   - Open phpMyAdmin (http://localhost/phpmyadmin).
   - Create a database named `attendance_system_db`.
   - Import the provided `attendance_system_db.sql` file.
3. **Security Configuration (Mandatory):**
   - Bind Apache to listen only on `127.0.0.1:80` via `httpd.conf`.
   - Bind MySQL to `127.0.0.1` via `my.ini` / `my.cnf`.
   - Restart Apache and MySQL.
4. **Accessing the System:**
   - Open a web browser on the host machine and navigate to `http://127.0.0.1/attendanceapple`.
   - Admin panel is accessible via `http://127.0.0.1/attendanceapple/admin`.

### Usage
- **Students:** Simply stand in front of the camera on the main index page. The system will detect the face, match it against registered profiles, and automatically log the attendance.
- **Administrators:** Log in to the admin dashboard to add/edit students, manage batches, review attendance logs, and register new face profiles.

## 6. File Structure
The project follows a modular structure separating backend logic, frontend assets, and machine learning models:

```text
attendanceapple/
├── admin/               # Admin dashboard interface and logic (login, settings, dashboard)
├── api/                 # PHP API endpoints for frontend-backend communication
├── assets/              # CSS stylesheets, images, and custom JS (app.js)
├── config/              # Database connection and security scripts (db.php)
├── js/                  # Third-party JS libraries (face-api.min.js, tf.min.js)
├── models/              # Pre-trained TensorFlow.js models for facial recognition
├── uploads/             # Directory for storing registered face images and attendance logs
├── index.php            # Main frontend face scanning interface
├── attendance_system_db.sql # Database schema and initial data
└── README.md            # Brief overview and security setup guide
```

## 7. Development Progress (Step-by-Step)
1. **Requirement Analysis & UI/UX Design:** Defined the core features and designed the "Apple Monochrome" interface to ensure a premium user experience.
2. **Database Design:** Structured the MySQL database to handle students, batches, and attendance logs.
3. **Backend API Development:** Developed secure PHP endpoints in the `api/` directory to handle CRUD operations and logic without exposing direct database access.
4. **Facial Recognition Integration:** Integrated `face-api.js` with pre-trained models. Configured the webcam feed to detect and match faces in real-time on `index.php`.
5. **Admin Dashboard Creation:** Built the administrative panel (`admin/`) to allow easy management of the system, including face enrollment and log exportation.
6. **Security Implementation:** Implemented the strict `127.0.0.1` binding in `config/db.php` and documented the required XAMPP configurations.
7. **Testing & Bug Fixing:** Conducted extensive local testing to ensure accurate face recognition under various lighting conditions and validated the security lockout.

## 8. Conclusion
The STDCx Attendance System successfully achieves its goal of providing a secure, automated, and visually appealing solution for internship attendance tracking. By combining local-first security principles with advanced AI facial recognition, the system offers a robust alternative to traditional attendance methods, ensuring accuracy, efficiency, and data privacy.

## 9. Future Work
- **Liveness Detection:** Implement anti-spoofing measures (e.g., blink detection or 3D depth sensing) to prevent users from using photos or videos to clock in.
- **Reporting Analytics:** Add graphical charts and detailed analytics to the admin dashboard for better insights into attendance trends.
- **Email Notifications:** Integrate automated email alerts for students who are absent or late.
- **Multiple Camera Support:** Allow the system to handle multiple camera feeds simultaneously for larger entry points.
