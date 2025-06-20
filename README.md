# Denizaltı Tespit Simülasyonu

![MIT License](https://img.shields.io/badge/License-MIT-blue.svg)

Bu proje, Denizaltı Savunma Harbi (DSH) operasyonlarının planlanması ve analizi için geliştirilmiş bir stokastik karar destek sistemi olarak tasarlanmıştır. Farklı operasyonel taktiklerin ve kaynak atamalarının, hedefin tespit olasılığı ve toplam operasyon maliyeti üzerindeki etkilerini nicel olarak değerlendirmeyi amaçlar.

---

## Temel Özellikler

* **Monte Carlo Simülasyon Motoru:** Belirsizlik altında yatan denizaltı rotalarını binlerce kez simüle ederek istatistiksel olarak güvenilir sonuçlar üretir.
* **Detaylı Parametre Seti:** Operasyon sahası, sonobuoy, helikopter, denizaltı, çevresel ve maliyet faktörleri dahil olmak üzere 7 ana kategoride 20'den fazla ayarlanabilir parametre.
* **Taktiksel Paternler ve Rota Optimizasyonu:** Izgara, bariyer, dairesel gibi farklı sonobuoy yerleşim stratejileri ve helikopter rotasını optimize etmek için "En Yakın Komşu" sezgiseli.
* **Dinamik 2D ve 3D Görselleştirme:** Operasyonun zamansal ve mekansal dinamiklerini interaktif olarak gözlemleme imkanı sunan, Plotly.js ile oluşturulmuş animasyonlar.
* **Kapsamlı Maliyet Analizi:** Helikopter uçuş saati ve sonobuoy birim maliyetlerine dayalı detaylı bütçelendirme ve maliyet-etkinlik analizi.
* **Gelişmiş Analiz Modülleri:**
    * **Duyarlılık Analizi:** Tek bir parametrenin sonuçlar üzerindeki etkisini "Eğer... ise..." senaryolarıyla inceleme.
    * **Maliyet-Etkinlik Sınırı Analizi:** Yüzlerce senaryoyu test ederek en verimli (Pareto-optimal) stratejileri bulma.
    * **Genetik Algoritma ile Optimizasyon:** Belirlenen amaç ve kısıtlara göre en iyi senaryoyu evrimsel algoritmalarla otomatik olarak keşfetme.
* **Senaryo Yönetimi:** Karmaşık senaryoları kaydetmek, yüklemek ve JSON formatında paylaşmak için tam senaryo yönetimi.
* **Detaylı Raporlama:** Tekli veya karşılaştırmalı sonuç raporlarını, tüm parametreler ve analiz grafikleriyle birlikte PDF formatında oluşturma.

---

## Geliştirici Günlüğü ve Proje Felsefesi

Bu proje, bir Endüstri Mühendisliği lisans bitirme tezi kapsamında, **sadece 7 günlük** bir süre içinde, daha önce hiç profesyonel kodlama deneyimi olmayan bir geliştirici tarafından hayata geçirilmiştir.

Bu projenin varlığı, modern üretken yapay zeka araçlarının, net bir vizyon ve doğru bir problem tanımlaması ile birleştiğinde ne kadar güçlü bir "uygulama aracı" olabileceğinin canlı bir kanıtıdır. Projenin geliştirme felsefesi, kodun kendisinden ziyade, modellenen **sistemin doğruluğuna**, sorulan **mühendislik sorularına** ve sonuçların **yorumlanabilirliğine** odaklanmak olmuştur. Yapay zeka, bu mühendislik vizyonunu çalışan bir yazılıma dönüştürmek için bir köprü görevi görmüştür.

Bu süreç, klasik yazılım geliştirme döngülerine bir alternatif sunarak, alan uzmanlarının (bu durumda bir endüstri mühendisinin) kendi karmaşık problemlerini çözmek için nasıl hızlı ve etkili prototipler oluşturabileceğini göstermektedir.

---

## Kullanılan Teknolojiler

* **Arayüz:** HTML5, CSS3
* **Mantık ve Simülasyon Motoru:** JavaScript (ES6+)
* **Görselleştirme ve Grafikler:** [Plotly.js](https://plotly.com/javascript/)
* **PDF Raporlama:** [jsPDF](https://github.com/parallax/jsPDF) & [html2canvas](https://html2canvas.hertzen.com/)

---

## Simülasyon Metodolojisi ve Modelleri 
(_Bu kısım şu an geliştirme aşamasındadır, mevcut hali simülasyonun eski versiyonlarına aittir._)

### 1. Giriş ve Simülasyonun Amacı
Bu simülasyon, Denizaltı Savunma Harbi (DSH) operasyonlarının planlanması ve analizi için geliştirilmiş, web tabanlı bir **stokastik karar destek sistemi** olarak tasarlanmıştır. DSH operasyonları; hedef konumu, hareket profili ve çevresel şartlar gibi yüksek derecede belirsizlik içeren karmaşık sistemlerdir. Bu aracın temel amacı, farklı operasyonel taktiklerin (örn: sonobuoy yerleşim stratejileri) ve kaynak atamalarının (örn: sonobuoy adedi, helikopter sorti sayısı), temel performans göstergeleri üzerindeki etkilerini nicel olarak değerlendirmektir. Bu göstergeler, hedefin **Tespit Olasılığı ($P_d$)** ve **Toplam Operasyon Maliyeti ($C_{total}$)** arasındaki ödünleşimi (trade-off) analiz ederek en etkin harekat tarzının (Course of Action - COA) belirlenmesine yardımcı olmayı hedefler.

### 2. Monte Carlo Simülasyon Yaklaşımı
Simülasyon, problemin özündeki olasılıksal yapı nedeniyle **Monte Carlo** yöntemini temel alır. Bu yöntem, analitik olarak çözümü zor veya imkansız olan sistemlerin davranışını, sistemi defalarca rastgele senaryolar üreterek çalıştırmak ve sonuçların istatistiksel dağılımını analiz etmek suretiyle tahmin eder.

* **Temel Döngü:** Simülasyon, kullanıcı tarafından belirlenen "Monte Carlo Yol Sayısı" ($N$) kadar tekrarlanır. $N$ değerinin yüksek olması, sonuçların istatistiksel yakınsama ve güvenilirliğini artırır (Büyük Sayılar Yasası).
* **Tekil Deneme (Replication):** Her bir döngü, bağımsız bir simülasyon denemesidir. Bu denemede, başlangıç koşulları ve süreç içi değişkenler (denizaltının başlangıç konumu, rotasındaki ve derinliğindeki anlık sapmalar) olasılık dağılımlarından örneklenerek özgün bir "denizaltı yolu" senaryosu oluşturulur.
* **Sonuçların Toplanması:** Her bir denemenin sonucu ikilidir (binary): "tespit edildi" (1) veya "edilemedi" (0). Toplam tespit olasılığı ($\hat{p}$), başarılı deneme sayısının toplam deneme sayısına oranıyla hesaplanır:
    $$ \hat{p} = \frac{\text{Tespit Edilen Toplam Yol Sayısı}}{\text{Toplam Deneme Sayısı (N)}} $$

### 3. Varlık ve Çevre Modellemesi
Simülasyon içerisindeki tüm varlıklar ve çevresel faktörler, matematiksel ve algoritmik olarak aşağıdaki gibi modellenmiştir:

* **Denizaltı Hareketi:** Denizaltının rotası, ayrık zaman adımlarından oluşan bir **stokastik süreç (sınırlı rastgele yürüyüş)** ile modellenir. Bu süreç, iki ana bileşenden oluşur:
    1.  **Ana Rota:** Denizaltı, varsayılan olarak pozitif X ekseni boyunca ilerler.
    2.  **Rastgele Sapmalar:** Rota üzerindeki her bir kontrol noktasında, denizaltının Y (yanal) ve Z (dikey) konumlarına rastgele gürültü eklenir. Bu sapmaların büyüklüğü, `Denizaltı Y Rota Sapma Oranı` ve `Denizaltı Derinlik Sapma` parametreleri tarafından belirlenen sınırlar içinde kalır. Bu yaklaşım, denizaltının öngörülemez küçük manevralarını ve derinlik değişimlerini taklit eder.
* **Datum Bilgisi ve Hedef Belirsizliği:** "Datum", hedefin bilinen son istihbarat konumudur. Simülasyon, hedefin tam olarak datum noktasında olmadığını, bu noktanın etrafındaki bir **belirsizlik alanı (Area of Uncertainty - AOU)** içinde bulunduğunu varsayar. Denizaltının başlangıç konumu, datum noktasını merkez alan ve yarıçapı, `Sonar Yarıçapı` ($R_{sonar}$) parametresinin dört katına kadar olabilen dairesel bir alan içerisinden **üniform dağılıma** göre rastgele seçilir. Bu, hedef konumundaki istihbarat belirsizliğini gerçekçi bir şekilde modeller.
* **Sonobuoy Yerleşim Paternleri:** Farklı taktiksel senaryolar için önceden tanımlanmış geometrik yerleşim desenleri (`simulation_helpers.js` içinde) sunulur: Izgara (Serpantin), Dikey Bariyer, Rastgele ve Dairesel.
* **Helikopter Rota Optimizasyonu:** "Rota Optimizasyonu" etkinleştirildiğinde, helikopterin sonobuoy bırakma sırası, **Gezgin Satıcı Problemi'nin (Traveling Salesman Problem - TSP)** bir çeşidi olarak ele alınır. Bu NP-zor problemin çözümü için, pratikte iyi ve hızlı sonuçlar üreten bir **açgözlü algoritma (greedy algorithm)** olan **En Yakın Komşu (Nearest Neighbour) Sezgiseli** kullanılır. Algoritma her adımda, helikopterin mevcut konumundan (başlangıçta üs, sonra bir önceki bıraktığı sonobuoy) kendisine en yakın olan ve henüz bırakılmamış sonobuoy hedefini belirleyerek o noktaya hareket etmesini sağlar. Bu işlem, helikopterin taşıma kapasitesi (`helikopterTasiyabilecegiKapasite`) dolana veya bırakılacak sonobuoy kalmayana kadar devam eder, ardından helikopter ikmal için üsse döner.
* **Çevresel Faktörler:** Su akıntısı, sabit bir sürat (`Akıntı Sürati`) ve yöne (`Akıntı Yönü`) sahip bir **vektör** olarak modellenir. Suya bırakılan her sonobuoy, bırakıldığı andan itibaren bu akıntı vektörünün etkisiyle zamanla doğrusal olarak sürüklenir. Saha dışına sürüklenen sonobuoy'lar etkisiz kabul edilir.

### 4. Tespit Mantığı ve Olasılık Hesabı
Bir tespit olayının gerçekleşmesi için iki koşulun **ardışık olarak** sağlanması gerekir:

1.  **3 Boyutlu Geometrik Koşul:** Denizaltının, bir sonobuoy'un etrafındaki küresel algılama hacmine girmesi gerekir. Bu yaklaşım, literatürde **"Cookie-Cutter" Sonar Modeli** olarak bilinen bir basitleştirmedir. Denizaltı (sub) ile sonobuoy (buoy) arasındaki anlık 3 boyutlu Öklid mesafesi ($d$) şu denklemle hesaplanır:
    $$ d = \sqrt{(x_{sub} - x_{buoy})^2 + (y_{sub} - y_{buoy})^2 + (z_{sub} - z_{buoy})^2} $$
    Eğer $d \le R_{sonar}$ (Sonar Yarıçapı) ise geometrik koşul sağlanmış olur.
2.  **Olasılıksal Tespit Koşulu:** Geometrik koşul sağlansa bile tespit garanti değildir. `Sonar Tespit Başarı Oranı` ($P_{detect}$), bu noktada bir tespitin gerçekleşme olasılığını temsil eder. Bu parametre; suyun katmanlı yapısı, denizaltının gürültü seviyesi gibi birçok karmaşık faktörün bir **soyutlamasıdır**. Simülasyon, bu koşulu bir **Bernoulli Deneyi** olarak modeller: 0 ile 1 arasında düzgün dağılımdan rastgele bir sayı ($U(0,1)$) üretilir. Eğer bu sayı < $P_{detect}$ ise, tespit başarılı kabul edilir.
3.  **Sabit (Statik) Hedef Tespiti:** Denizaltı hızı '0' olarak ayarlandığında, simülasyonun zaman akışı değişir. Hareketli hedefin aksine, burada zaman her bir sonobuoy'un aktif ömrüne göre akar. Simülasyon, her bir sonobuoy'un aktif olduğu süre boyunca belirli zaman aralıklarında (`STATIC_TARGET_DETECTION_STEPS_PER_BUOY_LIFE` sabiti ile) tekrar tekrar tespit denemesi yaparak, sabit bir hedefin zaman içinde tespit edilme olasılığını doğru bir şekilde modeller.

### 5. Gelişmiş Analiz Araçları
Simülasyon, tekil senaryo analizinin ötesinde, daha derinlemesine stratejik çıkarımlar yapabilmek için üç adet gelişmiş analiz modülü sunar:

* **Duyarlılık Analizi:** Bu özellik, bir "Eğer... ise... (What-If)" analizi aracıdır. Seçilen bir girdi parametresinin (örn: Sonar Yarıçapı) belirli bir aralıkta sistematik olarak değiştirilmesinin, temel çıktılar (tespit olasılığı, maliyet vb.) üzerindeki etkisini bir grafikle sunar. Bu, operasyonel planın en "hassas" ve kritik parametrelerini belirlemeye yardımcı olur.
* **Maliyet-Etkinlik Sınırı Analizi:** Bu modül, yüzlerce farklı senaryoyu (farklı sonobuoy sayısı, sonar yarıçapı vb. kombinasyonları) otomatik olarak çalıştırır ve sonuçları bir maliyet-performans (cost-benefit) grafiğinde gösterir. Grafikteki **"Etkin Sınır" (Efficient Frontier)** çizgisi, belirli bir maliyet için elde edilebilecek maksimum tespit olasılığını gösteren en verimli (Pareto-optimal) senaryoları temsil eder. Bu, kaynakların en verimli şekilde nasıl tahsis edileceği konusunda güçlü bir içgörü sağlar.
* **Senaryo Optimizasyonu (Genetik Algoritma):** Bu modül, belirlenen bir amaç (örn: tespit olasılığını maksimize et) ve kısıt (örn: maksimum toplam maliyet) doğrultusunda en iyi senaryoyu (parametre setini) bulmak için bir **Genetik Algoritma (GA)** çalıştırır. Algoritma; "popülasyon" adı verilen bir dizi potansiyel çözümü (senaryoyu) "nesiller" boyunca evrimleştirir. Her nesilde, "uygunluk" (fitness) fonksiyonu (amaç ve kısıtlara dayalı bir skor) en yüksek olan bireyler seçilir, parametreleri "çaprazlanır" (crossover) ve genetik çeşitlilik için rastgele "mutasyonlara" uğratılır. Bu süreç, kullanıcının tanımladığı arama uzayı içinde en optimal çözümü bulmayı hedefler.

### 6. Performans ve Maliyet Metrikleri
Simülasyon, operasyonel başarıyı ve ekonomik verimliliği ölçmek için çeşitli metrikler üretir:

* **Genel Tespit Olasılığı ($\hat{p}$):** Monte Carlo simülasyonu sonucunda bulunan tahmini tespit olasılığıdır.
* **%95 Güven Aralığı:** Simülasyonla bulunan tahminin ($\hat{p}$), gerçek tespit olasılığını hangi hassasiyetle temsil ettiğini gösterir. Standart Normal Dağılım yaklaşımı ile şu formülle hesaplanır:
    $$ \text{Güven Aralığı} = \hat{p} \pm 1.96 \times \sqrt{\frac{\hat{p}(1-\hat{p})}{N}} $$
* **Maliyet Analizi:** Toplam operasyon maliyeti ($C_{total}$), iki ana bileşenden oluşur:
    * **Uçuş Maliyeti ($C_{flight}$):** $C_{flight}$ = (Toplam Uçuş Süresi (saat)) × (Birim Uçuş Saati Maliyeti)
    * **Malzeme Maliyeti ($C_{material}$):** $C_{material}$ = (Kullanılan Sonobuoy Adedi) × (Sonobuoy Başına Maliyet)
    * Ayrıca, stratejinin maliyet-etkinliğini gösteren **"Tespit Başına Ortalama Maliyet"** metriği de sunulur.

### 7. Simülasyon Varsayımları ve Kısıtları
Bu modelin sonuçları, aşağıdaki temel varsayımlar ve basitleştirmeler çerçevesinde yorumlanmalıdır:

* **Sabit Hızlar:** Tüm varlıkların (denizaltı, helikopter) hızları operasyon boyunca sabit kabul edilir.
* **"Cookie-Cutter" Sonar Modeli:** Tespit olasılığı, sonar menzili içinde her noktada aynıdır ve menzil dışında sıfırdır.
* **Ayrık Zaman ve Uzay:** Varlıkların rotaları, sürekli bir yol yerine ayrık kontrol noktalarından oluşur.
* **Sabit Çevresel Koşullar:** Akıntı gibi çevresel faktörlerin operasyon boyunca değişmediği varsayılır.
* **Mükemmel İletişim:** Bir tespit yapıldığında bilginin anında merkeze ulaştığı varsayılır.
* **Risklerin Göz Ardı Edilmesi:** Donanım arızaları veya düşman karşı tedbirleri gibi faktörler modellenmemiştir.
* **İdeal Varlık Davranışları:** Denizaltının, tespit edildiğini anladığında kaçınma manevrası yapmadığı varsayılır.

---

## Teşekkür ve Sorumluluk Reddi

### Teşekkür

Bu projenin kod tabanının oluşturulmasında, geliştiricinin vizyonu ve yönlendirmeleri doğrultusunda **OpenAI GPT-4** ve **Google Gemini** gibi üretken yapay zeka modellerinden yoğun bir şekilde faydalanılmıştır. Bu araçlar, karmaşık algoritmaların ve arayüz bileşenlerinin hızla prototiplenmesinde kritik bir rol oynamıştır.

### Sorumluluk Reddi

* Bu simülasyon, tamamen **akademik ve eğitim amaçlı** bir araç olarak geliştirilmiştir.
* Sonuçlar, "Simülasyon Varsayımları ve Kısıtları" başlığı altında detaylandırılan matematiksel modellere ve basitleştirmelere dayanmaktadır.
* Bu araç, **gerçek dünya operasyonel planlama, karar verme veya seyrüsefer için KESİNLİKLE KULLANILMAMALIDIR.**
* Geliştirici, bu simülasyonun kullanımından veya sonuçlarının yorumlanmasından kaynaklanabilecek herhangi bir doğrudan veya dolaylı hasardan, zarardan veya yanlış karardan sorumlu tutulamaz.

---

## Lisans

Bu proje, [MIT Lisansı](LICENSE) altında lisanslanmıştır.
