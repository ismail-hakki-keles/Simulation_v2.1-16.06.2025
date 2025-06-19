/*
 * Denizaltı Tespit Simülasyonu
 * Copyright (c) 2025 İsmail Hakkı KELEŞ
 *
 * Bu proje MIT Lisansı altında lisanslanmıştır.
 * Lisansın tam metni için projenin kök dizinindeki LICENSE dosyasına bakın.
 * GitHub: https://github.com/knnchw/Simulation_v2.1-16.06.2025
 */

// --- RAPOR OLUŞTURUCU: HTML İÇERİK ÜRETİMİ ---
"use strict";

function createTooltip(text) {
    if (!text) return '';
    return ` <span class="info-icon">❓<span class="tooltip-text">${text}</span></span>`;
}


// ===================================================================================
// BÖLÜM 1: TEKLİ SENARYO RAPORU OLUŞTURUCULARI
// ===================================================================================

function renderSingleExecutiveSummary(params, results) {
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

function renderSingleSummaryAndStats(results) {
    const summaryContainer = document.getElementById('report-summary-container');
    if (!summaryContainer) return;
    
    const stdError = Math.sqrt(results.varyans_p_sapka_oran);
    const totalTrials = results.denizaltiYollariVeTespitDurumu.length;
    const successfulTrials = results.denizaltiYollariVeTespitDurumu.filter(yol => yol && yol[1]).length;

    const metrics = {
        'Tespit Olasılığı': `<span class="value">%${results.tespitOlasiligiYuzde.toFixed(2)}</span>`,
        'Güven Aralığı (%95)': `<span class="value">[%${results.ci_alt_yuzde.toFixed(2)} - %${results.ci_ust_yuzde.toFixed(2)}]</span>`,
        'Toplam Operasyon Maliyeti': `<span class="value cost">$${results.toplamMaliyet.toLocaleString('en-US')}</span>`,
        'Helikopter Operasyon Süresi': `<span class="value">${results.helikopterOperasyonSuresiDk.toFixed(2)} dk</span>`,
        'İstatistiksel Standart Hata': `<span class="value">${stdError.toFixed(4)}</span>`,
        'Ham Deneme Sonucu': `<span class="value">${successfulTrials} / ${totalTrials}</span>`
    };

    let contentHTML = '<div class="summary-grid">';
    for(const label in metrics){
        const tooltip = createTooltip(metricTooltips[label]);
        contentHTML += `<div class="metric-card"><span class="label">${label}${tooltip}</span>${metrics[label]}</div>`;
    }
    contentHTML += '</div>';
    summaryContainer.innerHTML = contentHTML;
}

function renderSingleCostBreakdown(params, results) {
    const costTableDiv = document.getElementById('cost-breakdown-table');
    if (!costTableDiv) return;

    const heloCost = (results.helikopterOperasyonSuresiDk / 60.0) * (params.costHeloHour || 0);
    const buoyCost = results.fiiliBirakilanSonobuoySayisi * (params.costSonobuoy || 0);
    const heloTooltip = createTooltip(metricTooltips['Helikopter Uçuş Maliyeti']);
    const buoyTooltip = createTooltip(metricTooltips['Tüketilen Sonobuoy Maliyeti']);


    costTableDiv.innerHTML = `
        <table>
            <tbody>
                <tr><td>Helikopter Uçuş Maliyeti ${heloTooltip}</td><td>$${heloCost.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td></tr>
                <tr><td>Tüketilen Sonobuoy Maliyeti ${buoyTooltip}</td><td>$${buoyCost.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td></tr>
                <tr><th>Toplam Operasyon Maliyeti</th><th>$${results.toplamMaliyet.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</th></tr>
            </tbody>
        </table>`;
}

function renderSingleGeometryMetrics(results) {
    const geometryDiv = document.getElementById('report-geometry-metrics-container');
    if (!geometryDiv) return;
    
    const detectionDistances3D_NM = [];
    if (results.denizaltiYollariVeTespitDurumu) {
        results.denizaltiYollariVeTespitDurumu.forEach(yol => {
            const tespitEdildi = yol && yol[1];
            if (tespitEdildi) {
                const subPos = yol[2];
                const buoyPos = yol[5];
                if (subPos && buoyPos) {
                    const dx = subPos[0] - buoyPos[0];
                    const dy = subPos[1] - buoyPos[1];
                    const dz = subPos[2] - buoyPos[2];
                    const distance3D = Math.sqrt(dx*dx + dy*dy + dz*dz);
                    detectionDistances3D_NM.push(distance3D);
                }
            }
        });
    }

    if (detectionDistances3D_NM.length === 0) {
        geometryDiv.innerHTML = "<p>Tespit gerçekleşmediği için geometrik analiz yapılamadı.</p>";
        return;
    }

    const avgDist = detectionDistances3D_NM.reduce((a, b) => a + b, 0) / detectionDistances3D_NM.length;
    const minDist = Math.min(...detectionDistances3D_NM);
    const maxDist = Math.max(...detectionDistances3D_NM);
    const avgSep = results.dikeyAyrilmaMesafeleri.reduce((a, b) => a + b, 0) / results.dikeyAyrilmaMesafeleri.length;
    
    const metricsInOrder = [
        { label: 'Ortalama 3D Tespit Mesafesi', value: `${avgDist.toFixed(2)} NM` },
        { label: 'Minimum Tespit Mesafesi', value: `${minDist.toFixed(2)} NM` },
        { label: 'Maksimum Tespit Mesafesi', value: `${maxDist.toFixed(2)} NM` },
        { label: 'Ortalama Dikey Ayrım', value: `${avgSep.toFixed(1)} m`}
    ];
    
    let contentHTML = '<div class="geometry-grid">';
    for(const metric of metricsInOrder){
        const tooltip = createTooltip(metricTooltips[metric.label]);
        contentHTML += `<div class="metric-card"><span class="label">${metric.label}${tooltip}</span><span class="value">${metric.value}</span></div>`;
    }
    contentHTML += '</div>';
    geometryDiv.innerHTML = contentHTML;
}

function renderSingleParametersTable(params, results) {
    const paramsContainer = document.getElementById('report-params-container');
    if (!paramsContainer) return;

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

    let tableHTML = '<div class="scenario-column" style="padding: 0; background: none; border: none;"><table><thead><tr><th>Parametre</th><th>Değer</th></tr></thead><tbody>';
    
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

    tableHTML += '</tbody></table></div>';
    paramsContainer.innerHTML = tableHTML;
}


// ===================================================================================
// BÖLÜM 2: KARŞILAŞTIRMA RAPORU OLUŞTURUCULARI
// ===================================================================================

function renderComparisonExecutiveSummary(scenarios) {
    const summaryElement = document.getElementById('executive-summary');
    if (!summaryElement || scenarios.length === 0) return;

    let bestPd = { name: '', value: -1 };
    let bestCost = { name: '', value: Infinity };
    
    scenarios.forEach(s => {
        if (s.results.tespitOlasiligiYuzde > bestPd.value) {
            bestPd.name = s.name;
            bestPd.value = s.results.tespitOlasiligiYuzde;
        }
        if (s.results.toplamMaliyet < bestCost.value) {
            bestCost.name = s.name;
            bestCost.value = s.results.toplamMaliyet;
        }
    });

    summaryElement.innerHTML = `
        Toplam <strong>${scenarios.length} senaryo</strong> karşılaştırılmıştır. 
        En yüksek tespit olasılığı (<strong>%${bestPd.value.toFixed(2)}</strong>) <strong>${bestPd.name}</strong> ile elde edilirken,
        en düşük maliyetli operasyon (<strong>$${bestCost.value.toLocaleString('en-US')}</strong>) <strong>${bestCost.name}</strong> olmuştur.
    `;
}

function renderComparisonSummaryAndStats(scenarios) {
    const container = document.getElementById('report-summary-container');
    if (!container) return;
    container.innerHTML = ''; 
    container.classList.add("comparison-container");
    container.classList.remove("summary-grid");

    scenarios.forEach(s => {
        const results = s.results;
        const columnHTML = `
            <div class="scenario-column">
                <h3>${s.name}</h3>
                <div class="summary-grid" style="grid-template-columns: 1fr;">
                    <div class="metric-card">
                        <span class="label">Tespit Olasılığı</span>
                        <span class="value">%${results.tespitOlasiligiYuzde.toFixed(2)}</span>
                    </div>
                    <div class="metric-card">
                        <span class="label">Toplam Operasyon Maliyeti</span>
                        <span class="value cost">$${results.toplamMaliyet.toLocaleString('en-US')}</span>
                    </div>
                    <div class="metric-card">
                        <span class="label">Helikopter Operasyon Süresi</span>
                        <span class="value">${results.helikopterOperasyonSuresiDk.toFixed(2)} dk</span>
                    </div>
                     <div class="metric-card">
                        <span class="label">Tespit Başına Maliyet</span>
                        <span class="value cost">$${results.tespitBasinaMaliyet > 0 ? results.tespitBasinaMaliyet.toLocaleString('en-US', {maximumFractionDigits: 2}) : 'N/A'}</span>
                    </div>
                </div>
            </div>
        `;
        container.innerHTML += columnHTML;
    });
}

function renderComparisonParametersTable(scenarios) {
    const container = document.getElementById('report-params-container');
    if (!container || scenarios.length === 0) return;
    container.classList.add("comparison-container");
    
    const paramDisplayMap = {
        sahaUzunluk: { name: "Saha Uzunluğu (NM)" },
        sahaGenislik: { name: "Saha Genişliği (NM)" },
        sonobuoyAdedi: { name: "İstenen Sonobuoy Adedi" },
        fiiliBirakilanSonobuoySayisi: { name: "Fiili Bırakılan Sonobuoy Adedi", source: 'results' },
        sonobuoyYerlesimPaterni: { name: "Patern" },
        sonarYaricap: { name: "Sonar Yarıçapı (NM)" },
        denizaltiSurati: { name: "Denizaltı Sürati (Knot)" },
        sonarTespitBasariOrani: { name: "Tespit Başarı Oranı" },
        rotaOptimizasyonuEtkin: { name: "Rota Optimizasyonu", type: 'boolean' },
        costHeloHour: { name: "Saatlik Uçuş Maliyeti ($)" },
        costSonobuoy: { name: "Birim Sonobuoy Maliyeti ($)" },
    };

    let tableHTML = '<table><thead><tr><th>Parametre</th>';
    scenarios.forEach(s => tableHTML += `<th>${s.name}</th>`);
    tableHTML += '</tr></thead><tbody>';

    for (const key in paramDisplayMap) {
        tableHTML += `<tr><td>${paramDisplayMap[key].name}</td>`;
        let values = [];
        scenarios.forEach(s => {
            const sourceObject = (paramDisplayMap[key].source === 'results') ? s.results : s.params;
            let value = sourceObject[key];
            if (paramDisplayMap[key].type === 'boolean') {
                value = value ? 'Aktif' : 'Pasif';
            } else if (typeof value === 'number' && !Number.isInteger(value)) {
                value = value.toFixed(2);
            } else if (value === 'barrier_vertical_middle') {
                value = 'Dikey Bariyer';
            } else if (value === 'grid') {
                value = 'Izgara';
            } else if (value === 'random') {
                value = 'Rastgele';
            } else if (value === 'circular') {
                value = 'Dairesel';
            }
            values.push(value);
        });

        const allSame = new Set(values).size <= 1;
        scenarios.forEach((s, index) => {
            tableHTML += `<td class="${!allSame ? 'highlight' : ''}">${values[index]}</td>`;
        });
        tableHTML += '</tr>';
    }

    tableHTML += '</tbody></table>';
    container.innerHTML = tableHTML;
}
