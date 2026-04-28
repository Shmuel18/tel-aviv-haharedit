# העלאה ל-VPS — תל אביב החרדית

מסמך זה מסביר איך להעלות את האתר ל-VPS אישי המריץ Linux + nginx.

## 1. הרצה מקומית

```bash
cd "C:\Users\shh92\Documents\תל אביב\site"

# פיתוח (hot reload)
npm run dev
# פתח http://localhost:5173

# בנייה לפרודקשן
npm run build
# התוצר ב-site/dist/

# בדיקה מקומית של הבילד
npm run preview
# פתח http://localhost:4173
```

## 2. מה להעלות

רק התיקייה `dist/` (~200KB סך הכול). היא מכילה:

```
dist/
├── index.html
├── assets/
│   ├── index-<hash>.js     (~183 KB, ~59 KB gzipped)
│   └── index-<hash>.css    (~20 KB, ~5 KB gzipped)
└── uploads/
    ├── pasted-1777381073537-0.png
    └── pasted-1777381095410-0.png
```

## 3. העלאה לשרת

### אופציה א — `scp` (פשוט)

מתוך PowerShell/Git Bash בחלונות:

```bash
# החלף user, vps-host, ונתיב לפי השרת שלך
scp -r dist/* user@vps-host.com:/var/www/telaviv-haharedit/
```

אם זו ההעלאה הראשונה, צור את התיקייה בשרת קודם:

```bash
ssh user@vps-host.com "sudo mkdir -p /var/www/telaviv-haharedit && sudo chown $USER:$USER /var/www/telaviv-haharedit"
```

### אופציה ב — `rsync` (מומלץ לעדכונים — שולח רק שינויים)

```bash
rsync -avz --delete dist/ user@vps-host.com:/var/www/telaviv-haharedit/
```

הדגל `--delete` מוחק קבצים בשרת שלא קיימים יותר ב-`dist/` (חשוב כי שמות קבצי ה-JS/CSS משתנים בכל build בגלל ה-hash).

### אופציה ג — `sftp`/FileZilla

חבר ל-VPS ב-FileZilla וגרור את כל תוכן `dist/` ל-`/var/www/telaviv-haharedit/`.

## 4. הגדרת nginx ב-VPS

צור קובץ `/etc/nginx/sites-available/telaviv-haharedit`:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name your-domain.com www.your-domain.com;

    root /var/www/telaviv-haharedit;
    index index.html;

    # קאש ארוך לנכסים עם hash בשם (immutable)
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # קאש בינוני לתמונות
    location /uploads/ {
        expires 30d;
        add_header Cache-Control "public";
    }

    # אין קאש על ה-HTML (תמיד טרי)
    location = /index.html {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    # SPA fallback (אם תוסיף בעתיד client-side routing)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # gzip
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types
        text/plain
        text/css
        text/xml
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;

    # אבטחה בסיסית
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
}
```

הפעל:

```bash
sudo ln -s /etc/nginx/sites-available/telaviv-haharedit /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 5. HTTPS עם Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

certbot ייצור אישור, יעדכן את קובץ ה-nginx להפניה אוטומטית ל-HTTPS, ויקבע חידוש אוטומטי ב-cron.

## 6. עדכון האתר

זרימה מהירה לעדכון תוכן או קוד:

```bash
# 1. בנייה מחדש
cd "C:\Users\shh92\Documents\תל אביב\site"
npm run build

# 2. סנכרון ל-VPS (rsync ינקה קבצים ישנים אוטומטית)
rsync -avz --delete dist/ user@vps-host.com:/var/www/telaviv-haharedit/

# 3. אין צורך לאתחל nginx — שמות הקבצים החדשים יוגשו מיד
```

## 7. אבחון בעיות נפוצות

| בעיה | פתרון |
|---|---|
| `403 Forbidden` | `sudo chown -R www-data:www-data /var/www/telaviv-haharedit` |
| `404` על נכסים | ודא שהתוכן הועתק עם `dist/*` ולא `dist/` (שים לב ל-`/`) |
| גופנים לא נטענים | בדוק שיש לך אינטרנט ושהדפדפן יכול להגיע ל-`fonts.googleapis.com` |
| תוכן ישן מקאש | Ctrl+Shift+R בדפדפן; וודא שה-`Cache-Control: no-cache` ב-`index.html` עובד (`curl -I https://your-domain.com`) |
