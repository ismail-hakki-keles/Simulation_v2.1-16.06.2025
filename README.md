# Denizaltı Tespit Simülasyonu

![MIT License](https://img.shields.io/badge/License-MIT-blue.svg)

Bu proje, Denizaltı Savunma Harbi (DSH) operasyonlarının planlanması ve analizi için geliştirilmiş stokastik bir karar destek sistemidir. Farklı operasyonel taktiklerin ve kaynak atamalarının, hedefin tespit olasılığı ve toplam operasyon maliyeti üzerindeki etkilerini nicel olarak değerlendirmeyi amaçlar.

---

## Temel Özellikler

* **Monte Carlo Simülasyon Motoru:** Belirsizlik altında yatan denizaltı rotalarını binlerce kez simüle ederek istatistiksel olarak güvenilir sonuçlar üretir.
* **Detaylı Parametre Seti:** Operasyon sahası, sonobuoy, helikopter, denizaltı, çevresel ve maliyet faktörleri dahil olmak üzere 7 ana kategoride 20'den fazla ayarlanabilir parametre.
* **Taktiksel Paternler ve Rota Optimizasyonu:** Izgara, bariyer, dairesel gibi farklı sonobuoy yerleşim stratejileri ve helikopter rotasını optimize etmek için "En Yakın Komşu" sezgiseli.
* **Dinamik 2D ve 3D Görselleştirme:** Operasyonun zamansal ve mekansal dinamiklerini interaktif olarak gözlemleme imkanı sunan, Plotly.js ile oluşturulmuş animasyonlar.
* **Kapsamlı Raporlama ve Analiz:** Simülasyon sonuçlarını özetleyen, PDF olarak dışa aktarılabilen detaylı raporlar ve kritik parametrelerin etkisini ölçmek için bir "Duyarlılık Analizi" aracı.
* **Senaryo Yönetimi:** Karmaşık senaryoları kaydetmek, yüklemek ve JSON formatında paylaşmak için tam senaryo yönetimi.

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

---

## Simülasyon Metodolojisi

Simulation_v2.1-16.06.2025
Denizaltı Tespit Simülasyonu V2.1 Simülasyon Metodolojisi

Giriş ve Simülasyonun Amacı Bu simülasyon, Denizaltı Savunma Harbi (DSH) operasyonlarının planlanması ve analizi için geliştirilmiş bir stokastik karar destek sistemi olarak tasarlanmıştır. DSH operasyonları; hedef konumu, hareket profili ve çevresel şartlar gibi yüksek derecede belirsizlik içeren karmaşık sistemlerdir. Bu aracın temel amacı, farklı operasyonel taktiklerin (örn: sonobuoy yerleşim stratejileri) ve kaynak atamalarının (örn: sonobuoy adedi, helikopter sorti sayısı), temel performans göstergeleri üzerindeki etkilerini nicel olarak değerlendirmektir. Bu göstergeler, hedefin tespit olasılığı (Pₚ) ve toplam operasyon maliyeti (Ctotal) arasındaki ödünleşimi (trade-off) analiz ederek en etkin harekat tarzının (Course of Action - COA) belirlenmesine yardımcı olmayı hedefler.

Monte Carlo Simülasyon Yaklaşımı Simülasyon, problemin özündeki olasılıksal yapı nedeniyle Monte Carlo yöntemini temel alır. Bu yöntem, analitik olarak çözümü zor veya imkansız olan sistemlerin davranışını, sistemi defalarca rastgele senaryolar üreterek çalıştırmak ve sonuçların istatistiksel dağılımını analiz etmek suretiyle tahmin eder.

Temel Döngü: Simülasyon, kullanıcı tarafından belirlenen "Monte Carlo Yol Sayısı" (N) kadar tekrarlanır. N değerinin yüksek olması, sonuçların istatistiksel yakınsama ve güvenilirliğini artırır (Büyük Sayılar Yasası). Tekil Deneme (Replication): Her bir döngü, bağımsız bir simülasyon denemesidir. Bu denemede, başlangıç koşulları ve süreç içi değişkenler (denizaltının başlangıç konumu, rotasındaki ve derinliğindeki anlık sapmalar) olasılık dağılımlarından örneklenerek özgün bir "denizaltı yolu" senaryosu oluşturulur. Sonuçların Toplanması: Her bir denemenin sonucu ikilidir (binary): "tespit edildi" (1) veya "edilemedi" (0). Toplam tespit olasılığı (p̂), başarılı deneme sayısının toplam deneme sayısına oranıyla hesaplanır: p̂ = (Tespit Edilen Toplam Yol Sayısı) / (Toplam Deneme Sayısı (N))

Varlık ve Çevre Modellemesi Simülasyon içerisindeki tüm varlıklar ve çevresel faktörler, matematiksel ve algoritmik olarak aşağıdaki gibi modellenmiştir:
Denizaltı Hareketi: Denizaltının rotası, ayrık zaman adımlarından oluşan bir stokastik süreç (rastgele yürüyüş) ile modellenir. Bu süreç, iki ana bileşenden oluşur: Ana Rota: Denizaltı, varsayılan olarak pozitif X ekseni boyunca ilerler. Rastgele Sapmalar: Rota üzerindeki her bir kontrol noktasında, denizaltının Y (yanal) ve Z (dikey) konumlarına rastgele gürültü eklenir. Bu sapmaların büyüklüğü, Denizaltı Y Rota Sapma Oranı ve Denizaltı Derinlik Sapma parametreleri tarafından belirlenen sınırlar içinde kalır. Bu yaklaşım, denizaltının öngörülemez küçük manevralarını ve derinlik değişimlerini taklit eder. Datum Bilgisi ve Hedef Belirsizliği: "Datum", hedefin bilinen son istihbarat konumudur. Simülasyon, hedefin tam olarak datum noktasında olmadığını, bu noktanın etrafındaki bir belirsizlik alanı (Area of Uncertainty - AOU) içinde bulunduğunu varsayar. Denizaltının başlangıç konumu, datum noktasını merkez alan ve yarıçapı, Sonar Yarıçapı (Rsonar) parametresinin dört katına kadar olabilen dairesel bir alan içerisinden üniform dağılıma göre rastgele seçilir. Bu, hedef konumundaki istihbarat belirsizliğini gerçekçi bir şekilde modeller. Sonobuoy Yerleşim Paternleri: Farklı taktiksel senaryolar için önceden tanımlanmış geometrik yerleşim desenleri sunulur: Izgara (Serpantin), Dikey Bariyer, Rastgele ve Dairesel. Helikopter Rota Optimizasyonu: "Rota Optimizasyonu" etkinleştirildiğinde, helikopterin sonobuoy bırakma sırası, Gezgin Satıcı Problemi'nin (Traveling Salesman Problem - TSP) bir çeşidi olarak ele alınır. Bu NP-zor problemin çözümü için, pratikte iyi ve hızlı sonuçlar üreten bir açgözlü algoritma (greedy algorithm) olan En Yakın Komşu (Nearest Neighbour) Sezgiseli kullanılır. Algoritma her adımda, helikopterin mevcut konumundan kendisine en yakın olan ve henüz bırakılmamış sonobuoy hedefini belirleyerek o noktaya hareket etmesini sağlar. Çevresel Faktörler: Su akıntısı, sabit bir sürat (Akıntı Sürati) ve yöne (Akıntı Yönü) sahip bir vektör olarak modellenir. Suya bırakılan her sonobuoy, bırakıldığı andan itibaren bu akıntı vektörünün etkisiyle zamanla doğrusal olarak sürüklenir. Saha dışına sürüklenen sonobuoy'lar etkisiz kabul edilir. 4. Tespit Mantığı ve Olasılık Hesabı Bir tespit olayının gerçekleşmesi için iki koşulun ardışık olarak sağlanması gerekir:

3 Boyutlu Geometrik Koşul: Denizaltının, bir sonobuoy'un etrafındaki küresel algılama hacmine girmesi gerekir. Bu yaklaşım, literatürde "Cookie-Cutter" Sonar Modeli olarak bilinen bir basitleştirmedir. Denizaltı (sub) ile sonobuoy (buoy) arasındaki anlık 3 boyutlu Öklid mesafesi (d) şu denklemle hesaplanır: d = √[(xsub - xbuoy)2 + (ysub - ybuoy)2 + (zsub - zbuoy)2]

Eğer d ≤ Rsonar (Sonar Yarıçapı) ise geometrik koşul sağlanmış olur. Olasılıksal Tespit Koşulu: Geometrik koşul sağlansa bile tespit garanti değildir. Sonar Tespit Başarı Oranı (Pdetect), bu noktada bir tespitin gerçekleşme olasılığını temsil eder. Bu parametre; suyun katmanlı yapısı, denizaltının gürültü seviyesi gibi birçok karmaşık faktörün bir soyutlamasıdır. Simülasyon, bu koşulu bir Bernoulli Deneyi olarak modeller: 0 ile 1 arasında düzgün dağılımdan rastgele bir sayı (U(0,1)) üretilir. Eğer bu sayı < Pdetect ise, tespit başarılı kabul edilir. Sabit (Statik) Hedef Tespiti: Denizaltı hızı '0' olarak ayarlandığında, simülasyonun zaman akışı değişir. Hareketli hedefin aksine, burada zaman her bir sonobuoy'un aktif ömrüne göre akar. Simülasyon, her bir sonobuoy'un aktif olduğu süre boyunca belirli zaman aralıklarında tekrar tekrar tespit denemesi yaparak, sabit bir hedefin zaman içinde tespit edilme olasılığını doğru bir şekilde modeller. 5. Performans ve Maliyet Metrikleri Simülasyon, operasyonel başarıyı ve ekonomik verimliliği ölçmek için çeşitli metrikler üretir:

Genel Tespit Olasılığı (p̂): Monte Carlo simülasyonu sonucunda bulunan tahmini tespit olasılığıdır. p̂ = (Tespit Edilen Yol Sayısı) / (Toplam Yol Sayısı N)

%95 Güven Aralığı: Simülasyonla bulunan tahminin (p̂), gerçek tespit olasılığını hangi hassasiyetle temsil ettiğini gösterir. Standart Normal Dağılım yaklaşımı ile şu formülle hesaplanır: Güven Aralığı = p̂ ± 1.96 × √[ (p̂(1-p̂)) / N ]

Maliyet Analizi: Toplam operasyon maliyeti (Ctotal), iki ana bileşenden oluşur: Uçuş Maliyeti (Cflight): Cflight = (Toplam Uçuş Süresi (saat)) × (Birim Uçuş Saati Maliyeti) Malzeme Maliyeti (Cmaterial): Cmaterial = (Kullanılan Sonobuoy Adedi) × (Sonobuoy Başına Maliyet) Ayrıca, stratejinin maliyet-etkinliğini gösteren "Tespit Başına Ortalama Maliyet" metriği de sunulur. 6. Analiz, Raporlama ve Senaryo Yönetimi Araçları Bu simülasyon, sadece bir hesaplama motoru değil, aynı zamanda sonuçların yorumlanması ve yönetilmesi için güçlü araçlar sunar:

Duyarlılık Analizi: Bu özellik, bir "Eğer... ise... (What-If)" analizi aracıdır. Seçilen bir girdi parametresinin sistematik olarak değiştirilmesinin, temel çıktılar üzerindeki etkisini bir grafikle sunarak operasyonel planın en "hassas" ve kritik parametrelerini belirlemeye yardımcı olur. Dinamik Görselleştirme: 2D ve 3D animasyonlar, operasyonun zamansal ve mekansal dinamiklerini interaktif olarak gözlemleme imkanı sunarak "nasıl" ve "nerede" tespitlerin gerçekleştiğini anlamaya yardımcı olur. Kapsamlı Raporlama: Tüm parametreleri, istatistikleri ve analitik grafikleri içeren detaylı bir rapor, bulguların sunumu ve dokümantasyonu için PDF formatında dışa aktarılabilir. Senaryo Yönetimi: Tüm parametre setinin bir JSON dosyası olarak kaydedilmesi ve geri yüklenmesi, karmaşık senaryoları arşivlemek, farklı kullanıcılar arasında paylaşmak ve deneylerin tekrarlanabilirliğini sağlamak için kritik bir özelliktir. 7. Simülasyon Varsayımları ve Kısıtları Bu modelin sonuçları, aşağıdaki temel varsayımlar ve basitleştirmeler çerçevesinde yorumlanmalıdır:

Sabit Hızlar: Tüm varlıkların (denizaltı, helikopter) hızları operasyon boyunca sabit kabul edilir. Hızlanma, yavaşlama veya ani manevralar modellenmemiştir. "Cookie-Cutter" Sonar Modeli: Tespit olasılığı, sonar menzili içinde her noktada aynıdır ve menzil dışında sıfırdır. Gerçekte olasılık, mesafe ve diğer faktörlere bağlı olarak kademeli olarak azalır. Ayrık Zaman ve Uzay: Varlıkların rotaları, sürekli bir yol yerine ayrık kontrol noktalarından oluşan çizgilerle temsil edilir. Tespit kontrolleri sadece bu noktalarda yapılır. Sabit Çevresel Koşullar: Akıntı hızı ve yönü gibi çevresel faktörlerin operasyon boyunca değişmediği varsayılır. Mükemmel İletişim ve Anlık Bilgi: Simülasyon, bir sonobuoy'un tespit yaptığı anda bu bilginin operasyon merkezi tarafından anında öğrenildiğini varsayar. Gerçek dünyadaki iletişim gecikmeleri veya veri kaybı modellenmemiştir. Operasyonel Risklerin Göz Ardı Edilmesi: Model, helikopter veya sonobuoy arızaları, düşman karşı tedbirleri (örn: jammer, decoy) veya operasyonu etkileyebilecek diğer beklenmedik olaylar gibi risk faktörlerini içermez. İdeal Varlık Davranışları: Denizaltının, bir tespit olasılığı veya aktif bir sonobuoy varlığını hissettiğinde taktiksel kaçınma manevraları yapmadığı varsayılır.

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
