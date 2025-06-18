/*
 * Denizaltı Tespit Simülasyonu
 * Copyright (c) 2025 İsmail Hakkı KELEŞ
 *
 * Bu proje MIT Lisansı altında lisanslanmıştır.
 * Lisansın tam metni için projenin kök dizinindeki LICENSE dosyasına bakın.
 * GitHub: https://github.com/knnchw/Simulation_v2.1-16.06.2025
 */

"use strict";

const metricTooltips = {
    'Tespit Olasılığı': 'Monte Carlo simülasyonu sonucunda, rastgele bir denizaltı yolunun oluşturulan sonobuoy bariyeri tarafından tespit edilme istatistiksel olasılığıdır.',
    'Güven Aralığı (%95)': 'Hesaplanan tespit olasılığının, %95 ihtimalle içinde bulunduğu aralığı ifade eder. Dar bir aralık, sonucun daha kararlı olduğunu gösterir.',
    'Toplam Operasyon Maliyeti': 'Helikopterin toplam uçuş süresi ve kullanılan sonobuoy adedine göre hesaplanan toplam finansal maliyettir.',
    'Helikopter Operasyon Süresi': 'Helikopterin üsten ayrılıp, tüm sonobuoyları bırakıp üsse geri döndüğü ana kadar geçen toplam süredir.',
    'İstatistiksel Standart Hata': 'Tespit olasılığı tahmininin standart hatasıdır. Değer ne kadar düşükse, tahminin istatistiksel olarak o kadar hassas olduğu anlamına gelir.',
    'Ham Deneme Sonucu': 'Monte Carlo simülasyonunda gerçekleştirilen toplam deneme sayısı ve bunların kaç tanesinin başarılı tespit ile sonuçlandığını gösterir.',
    'Helikopter Uçuş Maliyeti': 'Helikopterin toplam operasyon süresinin, girilen birim saatlik maliyet ile çarpılmasıyla elde edilen maliyettir.',
    'Tüketilen Sonobuoy Maliyeti': 'Operasyonda kullanılan fiili sonobuoy sayısının, girilen birim maliyet ile çarpılmasıyla elde edilen maliyettir.',
    'Ortalama 3D Tespit Mesafesi': 'Tüm başarılı tespit anlarında, denizaltı ile tespiti yapan sonobuoy arasındaki ortalama 3 boyutlu (hipotenüs) mesafedir.',
    'Minimum Tespit Mesafesi': 'Gerçekleşen en yakın mesafeli tespittir. Sonar performansının en iyi senaryodaki etkinliğini gösterir.',
    'Maksimum Tespit Mesafesi': 'Gerçekleşen en uzak mesafeli tespittir. Sonar performansının teorik sınırları hakkında fikir verir.',
    'Ortalama Dikey Ayrım': 'Başarılı tespit anlarında, denizaltı ile sonobuoy arasındaki ortalama dikey (derinlik) mesafesidir. Bu değer, tespitlerin hangi derinlik farklarında daha etkili olduğunu gösterir.'
};

const paramTooltips = {
    'Fiili Bırakılan Sonobuoy Adedi': 'Izgara gibi bazı paternlerde, istenen sonobuoy adedi sahaya sığdırılamayabilir. Bu, sahaya fiilen yerleştirilen sonobuoy sayısıdır.',
    'Helikopter Rota Optimizasyonu': 'Helikopterin, sonobuoyları en kısa mesafeyi kat edecek şekilde bırakıp bırakmadığını gösterir. "Aktif" ise toplam operasyon süresi kısalır.',
};

// --- ANA RAPOR KONTROLCÜSÜ ---
document.addEventListener('DOMContentLoaded', () => {
    const pdfButton = document.getElementById('createPdfBtn');
    const reportContent = document.getElementById('report-content');
    const reportDataJSON = sessionStorage.getItem('simulationReportData');

    if (!reportDataJSON) {
        reportContent.innerHTML = '<h2>Rapor Verisi Bulunamadı</h2><p>Lütfen ana sayfadan bir simülasyon çalıştırıp "Rapor Oluştur" butonuna tıklayarak bu sayfaya gelin.</p>';
        if(pdfButton) pdfButton.style.display = 'none';
        return;
    }

    try {
        const reportPackage = JSON.parse(reportDataJSON);

        if (reportPackage.type === 'comparison' && reportPackage.data.length > 0) {
            // --- KARŞILAŞTIRMA RAPORU OLUŞTURMA ---
            document.body.classList.add('comparison-mode');
            document.getElementById('report-title').textContent = "Senaryo Karşılaştırma Raporu";
            const scenarios = reportPackage.data;
            
            renderComparisonExecutiveSummary(scenarios);
            renderComparisonSummaryAndStats(scenarios);
            renderComparisonParametersTable(scenarios);
            
            const visualsSection = document.getElementById('visuals-section');
            if(visualsSection) visualsSection.style.display = 'none';

        } else if (reportPackage.type === 'single') {
            // --- TEKLİ RAPOR OLUŞTURMA ---
            document.body.classList.remove('comparison-mode');
            document.getElementById('report-title').textContent = "Simülasyon Sonuç Raporu";
            const singleScenario = reportPackage.data;
            const params = singleScenario.params;
            const results = singleScenario.results;
            
            const visualsSection = document.getElementById('visuals-section');
            if(visualsSection) visualsSection.style.display = 'block';

            renderSingleExecutiveSummary(params, results);
            renderSingleSummaryAndStats(results);
            renderSingleParametersTable(params, results);
            renderSingleCostBreakdown(params, results);
            renderSingleGeometryMetrics(results);
            
            plotHeloTimePieChart(results);
            plotDetectionHeatmap(params, results);
            plotBuoyEffectiveness(results);
            plotDetectionTimes(results, params);
            plotRouteComparison(results, params);
            plotDetectionDepthHistogram(results);
        } else {
             throw new Error("Rapor verisi formatı anlaşılamadı veya veri boş.");
        }

    } catch (error) {
        console.error("Rapor verisi işlenirken hata oluştu:", error);
        reportContent.innerHTML = `<h2>Rapor Oluşturulurken Bir Hata Oluştu</h2><p>${error.message}. Lütfen konsol kayıtlarını kontrol edin.</p>`;
    }

    if (pdfButton) {
        pdfButton.addEventListener('click', generatePdf);
    }
});


function generatePdf() {
    const pdfButton = document.getElementById('createPdfBtn');
    const reportContent = document.getElementById('report-content');
    const { jsPDF } = window.jspdf;

    pdfButton.textContent = 'PDF Oluşturuluyor...';
    pdfButton.disabled = true;

    html2canvas(reportContent, {
        scale: 2, 
        useCORS: true,
        backgroundColor: '#111827',
        windowHeight: reportContent.scrollHeight,
        scrollY: -window.scrollY
    }).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
            orientation: 'p',
            unit: 'mm',
            format: 'a4'
        });

        const imgProps= pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

        let heightLeft = pdfHeight;
        let position = 0;
        const pageHeight = pdf.internal.pageSize.getHeight();

        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;

        while (heightLeft > 0) {
          position = heightLeft - pdfHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
          heightLeft -= pageHeight;
        }

        const reportType = document.body.classList.contains('comparison-mode') ? 'karsilastirma' : 'tekli';
        pdf.save(`simulasyon-raporu-${reportType}.pdf`);
        
        pdfButton.textContent = 'Bu Raporu PDF Olarak İndir';
        pdfButton.disabled = false;
    }).catch(err => {
        console.error("PDF oluşturma hatası:", err);
        pdfButton.textContent = 'Bu Raporu PDF Olarak İndir';
        pdfButton.disabled = false;
        alert("PDF oluşturulurken bir hata oluştu. Lütfen konsolu kontrol edin.");
    });
}
