# 🎹 Piyano Porte & Nota Öğrenme

Piyano öğrenmeye yeni başlayanlar için geliştirilmiş interaktif porte (dizek) ve nota flashcard web uygulaması.

🌐 **Canlı Demo:** [https://dgknrsln.github.io/piyano/](https://dgknrsln.github.io/piyano/)

---

## ✨ Özellikler

- **🎴 3D Flash Kartlar:** Dizek altındaki Orta Do (C4) ve Re (D4) ile portenin 5 çizgisi ve 4 aralığındaki 11 temel nota.
  - Kartı çevirerek notanın piyanodaki yerini, frekansını ve Türkçe akılda kalıcı tekerlemelerini inceleme.
  - Filtreleme seçenekleri: *Tümü*, *Dizek Altı (Do & Re)*, *5 Çizgi*, *4 Aralık*.
- **🎯 Alıştırma & Test (Quiz):** Her seferinde 11 notanın tamamını rastgele ve tekrar etmeksizin soran test modu.
  - Şıklarla veya mini piyano tuşlarıyla cevaplama.
  - Combo streak, can sistemi, süre ve anlık geri bildirimler.
- **🎹 Canlı Piyano & Porte Simülatörü:** Bilgisayar klavyesi (A-S-D-F...) veya fare/dokunmatik ile çalınabilen konser piyanosu; basılan tuşun anlık portesini dinamik SVG ile çizer.
- **📖 Dizek & Teori Rehberi:** Porte çizgileri (*Mi-Sol-Si-Re-Fa*) ve aralıkları (*Fa-La-Do-Mi*) için Türkçe hafıza teknikleri ve karşılaştırmalı nota tablosu.
- **🔊 Gerçekçi Piyano Sesi:** Web Audio API kullanılarak üretilen harmonik piyano sentezleyici (harici ses dosyası indirme gerektirmez).
- **🌓 Açık / Koyu Tema:** Modern ve göz yormayan arayüz tasarımı.

---

## 🛠️ Teknolojiler

- **HTML5 & Vanilla JavaScript (ES6+)**
- **Modern CSS (Custom Properties, Glassmorphism, Responsive Grid/Flexbox)**
- **Web Audio API**
- **Vektörel SVG Müzik Notasyonu**

---

## 🚀 Yerel Çalıştırma

Projeyi yerel bilgisayarınızda çalıştırmak için herhangi bir statik sunucu yeterlidir:

```bash
python3 -m http.server 3000
```

Ardından tarayıcınızdan `http://localhost:3000` adresine gidin.
