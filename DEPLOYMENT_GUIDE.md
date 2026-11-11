# 🚀 คู่มือการนำระบบขึ้นออนไลน์ (Deployment Guide)
> โปรเจกต์: **Learning-Table** (Next.js 15 + Google Firebase)

---

## 1. การเตรียมตัวแปรสภาพแวดล้อม (Environment Variables)

กำหนดค่าในไฟล์ `.env.local` หรือ Environment Variables บน Cloud Hosting (Vercel / Cloudflare):

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDin4i5Qtv-f1FMr3itesZohmQPywqlI50
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=learning-time-cf6d1.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=learning-time-cf6d1
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=learning-time-cf6d1.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=181098948366
NEXT_PUBLIC_FIREBASE_APP_ID=1:181098948366:web:b50092b08ac2c52ac9195f
```

---

## 2. การ Deploy ขึ้น Vercel (แนะนำ - วิธีที่ง่ายและเร็วที่สุด)

1. **อัปโหลดโปรเจกต์ขึ้น GitHub:**
   ```bash
   git init
   git add .
   git commit -m "feat: complete Learning-Table smart scheduler"
   git branch -M main
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```
2. **สร้างโปรเจกต์บน Vercel:**
   * ล็อกอินที่ [vercel.com](https://vercel.com)
   * คลิก **Add New...** $\rightarrow$ **Project**
   * เลือก Repository `Learning-Table` จาก GitHub
   * ในส่วน **Environment Variables** เพิ่มตัวแปรทั้ง 6 ตัวด้านบน
   * คลิก **Deploy**
3. ระบบจะ Build และให้ Domain สาธารณะ เช่น `https://learning-table.vercel.app` ทันที

---

## 3. การตั้งค่าความปลอดภัย Firestore (Security Rules)

ไปที่ Firebase Console $\rightarrow$ **Firestore Database** $\rightarrow$ **Rules** และกำหนดกฎเกณฑ์ความปลอดภัย:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // อนุญาตให้อ่านข้อมูลตารางเรียนและข้อมูลพื้นฐานได้
    match /{document=**} {
      allow read, write: if true; // สำหรับโหมดทดสอบ หรือจำกัดสิทธิ์ตาม auth.uid
    }
  }
}
```

---

## 4. การทดสอบและรันบนเครื่อง Local (Local Development)

```bash
# ติดตั้ง dependencies
npm install

# รันโหมด Development
npm run dev

# เปิดเบราว์เซอร์ที่
http://localhost:3000
```

