# دليل البدء السريع 🚀

## 🎯 لتشغيل المشروع محلياً

### الطريقة 1: فتح مباشر في المتصفح
```bash
# ببساطة افتح ملف index.html في متصفحك
open index.html  # macOS
start index.html # Windows
xdg-open index.html # Linux
```

### الطريقة 2: خادم Python
```bash
cd /home/user/webapp
python3 -m http.server 3000
# ثم افتح: http://localhost:3000
```

### الطريقة 3: خادم PHP
```bash
cd /home/user/webapp
php -S localhost:3000
# ثم افتح: http://localhost:3000
```

### الطريقة 4: Node.js http-server
```bash
cd /home/user/webapp
npx http-server -p 3000
# ثم افتح: http://localhost:3000
```

## 📱 للاختبار على الموبايل

1. **احصل على عنوان IP لجهازك:**
   ```bash
   # Linux/Mac
   ifconfig | grep "inet "
   
   # Windows
   ipconfig
   ```

2. **شغّل الخادم:**
   ```bash
   python3 -m http.server 3000
   ```

3. **افتح على الموبايل:**
   ```
   http://YOUR_IP:3000
   # مثال: http://192.168.1.100:3000
   ```

## 🎨 التخصيص السريع

### تغيير الألوان
عدّل في `styles.css`:
- البحث عن `#3b82f6` (اللون الأزرق)
- استبداله باللون المفضل

### إضافة نماذج جديدة
عدّل في `js/model-loader.js`:
```javascript
this.models = {
  newItem: {
    name: 'اسم القطعة',
    icon: 'fa-icon-name',
    url: 'https://model-url.gltf',
    scale: { x: 0.5, y: 0.5, z: 0.5 },
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 }
  }
}
```

## 🔧 الأخطاء الشائعة

### ❌ CORS Error
**المشكلة:** لا يمكن تحميل النماذج 3D
**الحل:** استخدم خادم HTTP (لا تفتح الملف مباشرة)

### ❌ Camera Not Working
**المشكلة:** الكاميرا لا تعمل
**الحل:** 
- استخدم HTTPS أو localhost
- امنح الأذونات للكاميرا
- أعد تحميل الصفحة

### ❌ Models Not Showing
**المشكلة:** النماذج لا تظهر
**الحل:**
- تأكد من طباعة علامة Hiro
- حسّن الإضاءة
- قرّب/بعّد الكاميرا

## 📦 النشر

### GitHub Pages
```bash
git add .
git commit -m "Deploy to GitHub Pages"
git push origin main

# ثم فعّل GitHub Pages من الإعدادات
```

### Netlify
```bash
# اسحب المجلد وارفعه على Netlify
# أو اربطه بـ GitHub
```

### Vercel
```bash
vercel --prod
```

## 🎓 الموارد المفيدة

- [A-Frame Documentation](https://aframe.io/docs/)
- [AR.js Documentation](https://ar-js-org.github.io/AR.js-Docs/)
- [glTF Sample Models](https://github.com/KhronosGroup/glTF-Sample-Models)
- [TailwindCSS Docs](https://tailwindcss.com/docs)

## 🆘 الحصول على المساعدة

إذا واجهت مشكلة:
1. راجع الـ README.md الرئيسي
2. افتح Console في المتصفح (F12)
3. تحقق من رسائل الخطأ
4. جرّب متصفح آخر

---

**استمتع بتطوير تطبيق الواقع المعزز! 🎉**
