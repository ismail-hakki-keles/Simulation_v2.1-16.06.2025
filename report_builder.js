// --- RAPOR OLUŞTURUCU: HTML İÇERİK ÜRETİMİ ---
"use strict";

function createTooltip(text) {
    if (!text) return '';
    return ` <span class="info-icon">❓<span class="tooltip-text">${text}</span></span>`;
}

function renderExecutiveSummary(params, results) {
    const summaryElement = document.getElementById('executive-summary');
    if (!summaryElement) return;

    const { tespitOlasiligiYuzde, toplamMaliyet, fiiliBirakilanSonobuoySayisi } = results;
    
    let summaryText = `
        Bu senaryoda, <strong>${fiiliBirakilanSonobuoySayisi} adet sonobuoy</strong> kullanılarak 
        <strong>%${tespitOlasiligiYuzde.toFixed(2)}</strong> tespit olasılığına, yaklaşık 
        <strong>$${toplamMaliyet.toLocaleString('en-US')}</strong> maliyetle ulaşılmıştır. 
    `;

    const buoyCounts = getBuoyEffectivenessData(results);
    if (buoyCounts.totalDetections > 0) {
        const mostEffectiveBuoy = buoyCounts.labels[0];
        summaryText += ` Operasyonun en etkili unsuru <strong>${mostEffectiveBuoy}</strong> olmuştur.`;
    } else {
        summaryText += ` Senaryoda herhangi bir tespit gerçekleşmemiştir.`;
    }

    summaryElement.innerHTML = summaryText;
}

function renderSummaryAndStats(results) {
    const summaryDiv = document.getElementById('report-summary');
    if (!summaryDiv) return;
    
    const stdError = Math.sqrt(results.varyans_p_sapka_oran);
    const totalTrials = results.denizaltiYollariVeTespitDurumu.length;
    const successfulTrials = results.denizaltiYollariVeTespitDurumu.filter(yol => yol[1]).length;

    const metrics = {
        'Tespit Olasılığı': `<span class="value">%${results.tespitOlasiligiYuzde.toFixed(2)}</span>`,
        'Güven Aralığı (%95)': `<span class="value">[%${results.ci_alt_yuzde.toFixed(2)} - %${results.ci_ust_yuzde.toFixed(2)}]</span>`,
        'Toplam Operasyon Maliyeti': `<span class="value cost">$${results.toplamMaliyet.toLocaleString('en-US')}</span>`,
        'Helikopter Operasyon Süresi': `<span class="value">${results.helikopterOperasyonSuresiDk.toFixed(2)} dk</span>`,
        'İstatistiksel Standart Hata': `<span class="value">${stdError.toFixed(4)}</span>`,
        'Ham Deneme Sonucu': `<span class="value">${successfulTrials} / ${totalTrials}</span>`
    };

    let contentHTML = '';
    for(const label in metrics){
        const tooltip = createTooltip(metricTooltips[label]);
        contentHTML += `<div class="metric-card"><span class="label">${label}${tooltip}</span>${metrics[label]}</div>`;
    }

    summaryDiv.innerHTML = contentHTML;
}

function renderCostBreakdown(params, results) {
    const costTableDiv = document.getElementById('cost-breakdown-table');
    if (!costTableDiv) return;

    const heloCost = (results.helikopterOperasyonSuresiDk / 60.0) * (params.costHeloHour || 0);
    const buoyCost = results.fiiliBirakilanSonobuoySayisi * (params.costSonobuoy || 0);

    const tableHTML = `
        <table>
            <tbody>
                <tr>
                    <td>Helikopter Uçuş Maliyeti ${createTooltip(metricTooltips['Helikopter Uçuş Maliyeti'])}</td>
                    <td>$${heloCost.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                </tr>
                <tr>
                    <td>Tüketilen Sonobuoy Maliyeti ${createTooltip(metricTooltips['Tüketilen Sonobuoy Maliyeti'])}</td>
                    <td>$${buoyCost.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                </tr>
                <tr>
                    <th>Toplam Operasyon Maliyeti</th>
                    <th>$${results.toplamMaliyet.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</th>
                </tr>
            </tbody>
        </table>
    `;
    costTableDiv.innerHTML = tableHTML;
}

function renderGeometryMetrics(results) {
    const geometryDiv = document.getElementById('report-geometry-metrics');
    if (!geometryDiv) return;
    
    const detectionDistances3D_NM = [];
    const verticalSeparations_M = [];

    results.denizaltiYollariVeTespitDurumu.forEach(yol => {
        const tespitEdildi = yol[1];
        if (tespitEdildi) {
            const subPos = yol[2];
            const buoyPos = yol[5];
            if (subPos && buoyPos) {
                const dx = subPos[0] - buoyPos[0];
                const dy = subPos[1] - buoyPos[1];
                const dz = subPos[2] - buoyPos[2];
                
                const distance3D = Math.sqrt(dx*dx + dy*dy + dz*dz);
                detectionDistances3D_NM.push(distance3D);
                
                const verticalSepMeters = Math.abs(dz * 1852);
                verticalSeparations_M.push(verticalSepMeters);
            }
        }
    });

    if (detectionDistances3D_NM.length === 0) {
        geometryDiv.innerHTML = "<p>Tespit gerçekleşmediği için geometrik analiz yapılamadı.</p>";
        return;
    }

    const avgDist = detectionDistances3D_NM.reduce((a, b) => a + b, 0) / detectionDistances3D_NM.length;
    const minDist = Math.min(...detectionDistances3D_NM);
    const maxDist = Math.max(...detectionDistances3D_NM);
    const avgSep = verticalSeparations_M.reduce((a, b) => a + b, 0) / verticalSeparations_M.length;
    
    // Metrikleri istenen sırada bir diziye yerleştiriyoruz
    const metricsInOrder = [
        { label: 'Ortalama 3D Tespit Mesafesi', value: `${avgDist.toFixed(2)} NM` },
        { label: 'Minimum Tespit Mesafesi', value: `${minDist.toFixed(2)} NM` },
        { label: 'Maksimum Tespit Mesafesi', value: `${maxDist.toFixed(2)} NM` },
        { label: 'Ortalama Dikey Ayrım', value: `${avgSep.toFixed(1)} m`, isAlone: true } // Yalnız kalacak kartı işaretle
    ];
    
    let contentHTML = '<div class="geometry-grid">';
    for(const metric of metricsInOrder){
        const tooltip = createTooltip(metricTooltips[metric.label]);
        // Yalnız kalacak kart için özel bir class eklemiyoruz, CSS ile halledeceğiz.
        contentHTML += `<div class="metric-card"><span class="label">${metric.label}${tooltip}</span><span class="value">${metric.value}</span></div>`;
    }
    contentHTML += '</div>';
    geometryDiv.innerHTML = contentHTML;
}

function renderParametersTable(params, results) {
    const paramsTableDiv = document.getElementById('report-params-table');
    const paramDisplayMap = {
        sahaUzunluk: { name: "Saha Uzunluğu (NM)" },
        sahaGenislik: { name: "Saha Genişliği (NM)" },
        sonobuoyAdedi: { name: "İstenen Sonobuoy Adedi" },
        fiiliBirakilanSonobuoySayisi: { name: "Fiili Bırakılan Sonobuoy Adedi", source: 'results' },
        sonobuoyYerlesimPaterni: { name: "Sonobuoy Yerleşim Paterni" },
        sonarYaricap: { name: "Sonar Yarıçapı (NM)" },
        sonobuoyCalismaSuresi: { name: "Sonobuoy Çalışma Süresi (Dk)" },
        sonobuoyDinlemeDerinligi: { name: "Sonobuoy Dinleme Derinliği (m)" },
        helikopterSurat: { name: "Helikopter Sürati (Knot)" },
        helikopterTasiyabilecegiKapasite: { name: "Helikopter Taşıma Kapasitesi" },
        denizaltiSurati: { name: "Denizaltı Sürati (Knot)" },
        denizaltiOrtDerinlik: { name: "Denizaltı Ortalama Derinlik (m)" },
        rotaOptimizasyonuEtkin: { name: "Helikopter Rota Optimizasyonu", type: 'boolean' },
        datumBilgisiMevcut: { name: "Datum Bilgisi Mevcut", type: 'boolean' },
        datumX: { name: "Datum X Koordinatı (NM)", dependsOn: 'datumBilgisiMevcut' },
        datumY: { name: "Datum Y Koordinatı (NM)", dependsOn: 'datumBilgisiMevcut' },
        costHeloHour: { name: "Birim Uçuş Saati Maliyeti ($)" },
        costSonobuoy: { name: "Sonobuoy Başına Maliyet ($)" },
        simulasyonDenizaltiYolSayisi: { name: "Monte Carlo Yol Sayısı" },
    };

    let tableHTML = '<table><thead><tr><th>Parametre</th><th>Değer</th></tr></thead><tbody>';
    
    for (const key in paramDisplayMap) {
        const config = paramDisplayMap[key];
        
        if (config.dependsOn && !params[config.dependsOn]) {
            continue;
        }

        const sourceObject = (config.source === 'results') ? results : params;
        
        if (sourceObject.hasOwnProperty(key)) {
            let value = sourceObject[key];
            const tooltip = createTooltip(paramTooltips[config.name]);

            if (config.type === 'boolean') {
                value = value ? 'Aktif' : 'Pasif';
            } else if (value === null || value === undefined) {
                value = 'Uygulanmadı';
            } else if (typeof value === 'number' && !Number.isInteger(value)) {
                value = value.toFixed(2);
            }

            tableHTML += `<tr><td>${config.name}${tooltip}</td><td>${value}</td></tr>`;
        }
    }

    tableHTML += '</tbody></table>';
    paramsTableDiv.innerHTML = tableHTML;
}