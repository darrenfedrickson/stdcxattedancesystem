# STDCx Attendance System with Facial Recognition

A local-first internship attendance tracking application with strict security binding and an "Apple Monochrome" aesthetic.

## Local Machine Lockout Configuration
To strictly enforce that this application can **only** be accessed from the host machine (127.0.0.1) and absolutely no external network devices can connect to your local Apache server or MySQL database, follow these configuration steps in XAMPP.

### 1. Bind Apache to Localhost
By default, Apache listens on all interfaces (0.0.0.0). We will restrict it to `127.0.0.1`.

1. Open your XAMPP Control Panel.
2. Click **Config** next to Apache and select `httpd.conf` (or open `/Applications/XAMPP/xamppfiles/etc/httpd.conf` on Mac).
3. Find the line that says:
   ```apache
   Listen 80
   ```
4. Change it to:
   ```apache
   Listen 127.0.0.1:80
   ```
5. Save the file and **restart Apache**.

*(Optional but recommended): If you have SSL enabled (`httpd-ssl.conf`), change `Listen 443` to `Listen 127.0.0.1:443`.*

### 2. Bind MySQL / MariaDB to Localhost
By default, MySQL may accept connections from other machines. We will restrict it to `127.0.0.1`.

1. Click **Config** next to MySQL in XAMPP and select `my.ini` (or open `/Applications/XAMPP/xamppfiles/etc/my.cnf` on Mac).
2. Under the `[mysqld]` section, add or modify the following line:
   ```ini
   bind-address="127.0.0.1"
   ```
3. Save the file and **restart MySQL**.

### 3. Application-Level Security
In addition to the server configuration, the application contains a hardcoded verification step at the top of the connection pipeline (`config/db.php`):

```php
$allowed_hosts = ['127.0.0.1', '::1'];
if (!isset($_SERVER['REMOTE_ADDR']) || !in_array($_SERVER['REMOTE_ADDR'], $allowed_hosts)) {
    http_response_code(403);
    die("Forbidden: Access restricted to the local host machine only.");
}
```
This guarantees a zero-trust model where any request originating from an external IP is immediately rejected with a 403 HTTP status.
