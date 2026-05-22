// Merge new keys into all locale message files.
// Usage: node scripts/merge-translations.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const messagesDir = path.join(__dirname, '..', 'src', 'messages');

// Per-locale translations for keys to add. English fallback first.
// All 20 locales get strings; if a translation is missing for a locale we use English.
const TRANSLATIONS = {
  // Locales: en, id, zh, ja, ko, ar, ru, fr, de, es, pt, it, nl, tr, hi, th, vi, ms, pl, fa
  nav: {
    packages: {
      en: 'Packages', id: 'Paket Wisata', zh: '套餐', ja: 'パッケージ', ko: '패키지',
      ar: 'حزم', ru: 'Пакеты', fr: 'Forfaits', de: 'Pakete', es: 'Paquetes',
      pt: 'Pacotes', it: 'Pacchetti', nl: "Pakketten", tr: 'Paketler', hi: 'पैकेज',
      th: 'แพ็กเกจ', vi: 'Gói', ms: 'Pakej', pl: 'Pakiety', fa: 'بسته‌ها',
    },
    activities: {
      en: 'Activities', id: 'Aktivitas', zh: '活动', ja: 'アクティビティ', ko: '액티비티',
      ar: 'أنشطة', ru: 'Активности', fr: 'Activités', de: 'Aktivitäten', es: 'Actividades',
      pt: 'Atividades', it: 'Attività', nl: 'Activiteiten', tr: 'Aktiviteler', hi: 'गतिविधियाँ',
      th: 'กิจกรรม', vi: 'Hoạt động', ms: 'Aktiviti', pl: 'Atrakcje', fa: 'فعالیت‌ها',
    },
    buses: {
      en: 'Bus', id: 'Bus', zh: '巴士', ja: 'バス', ko: '버스',
      ar: 'حافلة', ru: 'Автобус', fr: 'Bus', de: 'Bus', es: 'Autobús',
      pt: 'Ônibus', it: 'Autobus', nl: 'Bus', tr: 'Otobüs', hi: 'बस',
      th: 'รถบัส', vi: 'Xe buýt', ms: 'Bas', pl: 'Autobus', fa: 'اتوبوس',
    },
    customPackage: {
      en: 'Custom Package', id: 'Paket Custom', zh: '定制套餐', ja: 'カスタムパッケージ',
      ko: '맞춤 패키지', ar: 'حزمة مخصصة', ru: 'Свой пакет', fr: 'Forfait personnalisé',
      de: 'Eigenes Paket', es: 'Paquete personalizado', pt: 'Pacote personalizado',
      it: 'Pacchetto su misura', nl: 'Eigen pakket', tr: 'Özel paket',
      hi: 'कस्टम पैकेज', th: 'แพ็กเกจกำหนดเอง', vi: 'Gói tùy chỉnh',
      ms: 'Pakej tersuai', pl: 'Pakiet niestandardowy', fa: 'بسته دلخواه',
    },
  },
  home: {
    destinationsTitle: {
      en: 'Top destinations in Bali', id: 'Destinasi Populer di Bali', zh: '巴厘岛热门目的地',
      ja: 'バリの人気の目的地', ko: '발리의 인기 명소', ar: 'الوجهات الأكثر شهرة في بالي',
      ru: 'Лучшие направления Бали', fr: 'Destinations populaires à Bali',
      de: 'Top-Reiseziele auf Bali', es: 'Destinos populares en Bali',
      pt: 'Destinos populares em Bali', it: 'Destinazioni popolari a Bali',
      nl: 'Populaire bestemmingen op Bali', tr: "Bali'deki popüler destinasyonlar",
      hi: 'बाली के लोकप्रिय गंतव्य', th: 'จุดหมายยอดนิยมในบาหลี',
      vi: 'Điểm đến hàng đầu ở Bali', ms: 'Destinasi popular di Bali',
      pl: 'Popularne kierunki na Bali', fa: 'مقاصد محبوب در بالی',
    },
    listings: {
      en: 'listings', id: 'pilihan', zh: '个项目', ja: '件',
      ko: '개', ar: 'خيار', ru: 'предложений', fr: 'options',
      de: 'Angebote', es: 'opciones', pt: 'opções', it: 'opzioni',
      nl: 'opties', tr: 'seçenek', hi: 'विकल्प', th: 'รายการ',
      vi: 'lựa chọn', ms: 'pilihan', pl: 'ofert', fa: 'گزینه',
    },
    emptyDataInfo: {
      en: 'Coming soon — content will appear once the catalog is populated.',
      id: 'Segera hadir — konten akan tampil setelah katalog diisi.',
      zh: '即将上线 — 目录填充后内容将显示。', ja: '近日公開 — カタログにデータが追加されると表示されます。',
      ko: '곧 공개됩니다 — 카탈로그에 데이터가 추가되면 표시됩니다.',
      ar: 'قريباً — سيظهر المحتوى عند تعبئة الكتالوج.',
      ru: 'Скоро — контент появится после заполнения каталога.',
      fr: 'Bientôt — le contenu apparaîtra une fois le catalogue rempli.',
      de: 'Demnächst — Inhalte erscheinen, sobald der Katalog gefüllt ist.',
      es: 'Próximamente — el contenido aparecerá cuando se complete el catálogo.',
      pt: 'Em breve — o conteúdo aparecerá quando o catálogo for preenchido.',
      it: 'In arrivo — il contenuto apparirà una volta popolato il catalogo.',
      nl: 'Binnenkort — inhoud verschijnt zodra de catalogus is gevuld.',
      tr: 'Yakında — katalog dolduğunda içerik görünecek.',
      hi: 'जल्द आ रहा है — सूची भरने पर सामग्री दिखाई देगी।',
      th: 'เร็วๆ นี้ — เนื้อหาจะปรากฏเมื่อเพิ่มข้อมูลในแคตตาล็อกแล้ว',
      vi: 'Sắp ra mắt — nội dung sẽ xuất hiện khi danh mục có dữ liệu.',
      ms: 'Akan datang — kandungan akan dipaparkan apabila katalog diisi.',
      pl: 'Wkrótce — treść pojawi się, gdy katalog zostanie wypełniony.',
      fa: 'به‌زودی — محتوا پس از تکمیل کاتالوگ نمایش داده می‌شود.',
    },
  },
  search: {
    flights: {
      en: 'Search Flights', id: 'Cari Penerbangan', zh: '搜索航班', ja: 'フライトを検索',
      ko: '항공편 검색', ar: 'البحث عن رحلات', ru: 'Найти рейс',
      fr: 'Rechercher un vol', de: 'Flug suchen', es: 'Buscar vuelos',
      pt: 'Buscar voos', it: 'Cerca voli', nl: 'Vluchten zoeken', tr: 'Uçuş ara',
      hi: 'उड़ानें खोजें', th: 'ค้นหาเที่ยวบิน', vi: 'Tìm chuyến bay',
      ms: 'Cari penerbangan', pl: 'Szukaj lotów', fa: 'جستجوی پرواز',
    },
    hotels: {
      en: 'Search Hotels', id: 'Cari Hotel', zh: '搜索酒店', ja: 'ホテルを検索',
      ko: '호텔 검색', ar: 'البحث عن فنادق', ru: 'Найти отель',
      fr: "Rechercher un hôtel", de: 'Hotel suchen', es: 'Buscar hoteles',
      pt: 'Buscar hotéis', it: 'Cerca hotel', nl: 'Hotels zoeken', tr: 'Otel ara',
      hi: 'होटल खोजें', th: 'ค้นหาโรงแรม', vi: 'Tìm khách sạn',
      ms: 'Cari hotel', pl: 'Szukaj hoteli', fa: 'جستجوی هتل',
    },
    roundTrip: {
      en: 'Round trip', id: 'Pulang pergi', zh: '往返', ja: '往復',
      ko: '왕복', ar: 'ذهاب وعودة', ru: 'Туда-обратно', fr: 'Aller-retour',
      de: 'Hin und zurück', es: 'Ida y vuelta', pt: 'Ida e volta',
      it: 'Andata e ritorno', nl: 'Heen en terug', tr: 'Gidiş-dönüş',
      hi: 'राउंड ट्रिप', th: 'ไป-กลับ', vi: 'Khứ hồi', ms: 'Pergi-balik',
      pl: 'W obie strony', fa: 'رفت و برگشت',
    },
    oneWay: {
      en: 'One way', id: 'Sekali jalan', zh: '单程', ja: '片道',
      ko: '편도', ar: 'ذهاب فقط', ru: 'В одну сторону', fr: 'Aller simple',
      de: 'Einfach', es: 'Solo ida', pt: 'Só ida', it: 'Solo andata',
      nl: 'Enkele reis', tr: 'Tek yön', hi: 'एक तरफ़ा', th: 'เที่ยวเดียว',
      vi: 'Một chiều', ms: 'Sehala', pl: 'W jedną stronę', fa: 'یک‌طرفه',
    },
    departure: {
      en: 'Departure', id: 'Berangkat', zh: '出发', ja: '出発',
      ko: '출발', ar: 'المغادرة', ru: 'Вылет', fr: 'Départ', de: 'Abflug',
      es: 'Salida', pt: 'Partida', it: 'Partenza', nl: 'Vertrek',
      tr: 'Gidiş', hi: 'प्रस्थान', th: 'ออกเดินทาง', vi: 'Khởi hành',
      ms: 'Berlepas', pl: 'Wylot', fa: 'حرکت',
    },
    return: {
      en: 'Return', id: 'Pulang', zh: '返程', ja: '帰り',
      ko: '돌아옴', ar: 'العودة', ru: 'Возврат', fr: 'Retour',
      de: 'Rückkehr', es: 'Regreso', pt: 'Retorno', it: 'Ritorno',
      nl: 'Terugkeer', tr: 'Dönüş', hi: 'वापसी', th: 'กลับ',
      vi: 'Trở về', ms: 'Pulang', pl: 'Powrót', fa: 'بازگشت',
    },
    cabin: {
      en: 'Cabin', id: 'Kelas Kabin', zh: '舱位', ja: 'クラス',
      ko: '좌석 등급', ar: 'درجة السفر', ru: 'Класс', fr: 'Classe',
      de: 'Klasse', es: 'Clase', pt: 'Classe', it: 'Classe',
      nl: 'Klasse', tr: 'Sınıf', hi: 'श्रेणी', th: 'ชั้นโดยสาร',
      vi: 'Hạng ghế', ms: 'Kelas', pl: 'Klasa', fa: 'کلاس',
    },
    adults: {
      en: 'Adults (12+)', id: 'Dewasa (12+)', zh: '成人 (12+)', ja: '大人 (12歳以上)',
      ko: '성인 (12+)', ar: 'بالغين (12+)', ru: 'Взрослые (12+)', fr: 'Adultes (12+)',
      de: 'Erwachsene (12+)', es: 'Adultos (12+)', pt: 'Adultos (12+)',
      it: 'Adulti (12+)', nl: 'Volwassenen (12+)', tr: 'Yetişkin (12+)',
      hi: 'वयस्क (12+)', th: 'ผู้ใหญ่ (12+)', vi: 'Người lớn (12+)',
      ms: 'Dewasa (12+)', pl: 'Dorośli (12+)', fa: 'بزرگسالان (+۱۲)',
    },
    childrenAges: {
      en: 'Children (2-11)', id: 'Anak-anak (2-11)', zh: '儿童 (2-11)', ja: '子供 (2-11歳)',
      ko: '어린이 (2-11)', ar: 'أطفال (2-11)', ru: 'Дети (2-11)', fr: 'Enfants (2-11)',
      de: 'Kinder (2-11)', es: 'Niños (2-11)', pt: 'Crianças (2-11)',
      it: 'Bambini (2-11)', nl: 'Kinderen (2-11)', tr: 'Çocuk (2-11)',
      hi: 'बच्चे (2-11)', th: 'เด็ก (2-11)', vi: 'Trẻ em (2-11)',
      ms: 'Kanak-kanak (2-11)', pl: 'Dzieci (2-11)', fa: 'کودکان (۲-۱۱)',
    },
    originPlaceholder: {
      en: 'Origin city or airport', id: 'Kota atau bandara asal', zh: '出发城市或机场',
      ja: '出発地の都市または空港', ko: '출발 도시 또는 공항', ar: 'مدينة أو مطار المغادرة',
      ru: 'Город или аэропорт отправления', fr: "Ville ou aéroport d'origine",
      de: 'Abflug-Stadt oder Flughafen', es: 'Ciudad o aeropuerto de origen',
      pt: 'Cidade ou aeroporto de origem', it: 'Città o aeroporto di partenza',
      nl: 'Vertrekstad of -luchthaven', tr: 'Kalkış şehri veya havaalanı',
      hi: 'मूल शहर या हवाई अड्डा', th: 'เมืองหรือสนามบินต้นทาง',
      vi: 'Thành phố hoặc sân bay khởi hành', ms: 'Bandar atau lapangan terbang asal',
      pl: 'Miasto lub lotnisko wylotu', fa: 'شهر یا فرودگاه مبدأ',
    },
    destinationPlaceholder: {
      en: 'Destination city or airport', id: 'Kota atau bandara tujuan', zh: '目的地城市或机场',
      ja: '目的地の都市または空港', ko: '목적지 도시 또는 공항', ar: 'مدينة أو مطار الوصول',
      ru: 'Город или аэропорт назначения', fr: 'Ville ou aéroport de destination',
      de: 'Ziel-Stadt oder Flughafen', es: 'Ciudad o aeropuerto de destino',
      pt: 'Cidade ou aeroporto de destino', it: 'Città o aeroporto di destinazione',
      nl: 'Bestemmingsstad of -luchthaven', tr: 'Varış şehri veya havaalanı',
      hi: 'गंतव्य शहर या हवाई अड्डा', th: 'เมืองหรือสนามบินปลายทาง',
      vi: 'Thành phố hoặc sân bay điểm đến', ms: 'Bandar atau lapangan terbang destinasi',
      pl: 'Miasto lub lotnisko docelowe', fa: 'شهر یا فرودگاه مقصد',
    },
  },
};

const LOCALES = ['en','id','zh','ja','ko','ar','ru','fr','de','es','pt','it','nl','tr','hi','th','vi','ms','pl','fa'];

function pick(map, locale) {
  return map[locale] ?? map.en;
}

for (const locale of LOCALES) {
  const filePath = path.join(messagesDir, `${locale}.json`);
  const raw = fs.readFileSync(filePath, 'utf-8');
  const data = JSON.parse(raw);

  for (const [section, keys] of Object.entries(TRANSLATIONS)) {
    if (!data[section]) data[section] = {};
    for (const [key, map] of Object.entries(keys)) {
      data[section][key] = pick(map, locale);
    }
  }

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
  console.log(`✓ ${locale}.json`);
}

console.log('Done.');
