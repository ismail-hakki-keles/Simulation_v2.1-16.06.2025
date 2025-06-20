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
        <strong>$${toplamMaliyet.toLocaleString('en-US')}</strong> toplam maliyetle ulaşılmıştır. 
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

function renderNarrativeSummary(results, params) {
    const container = document.getElementById('narrative-summary-list');
    const title = document.getElementById('narrative-title');
    if (!container || !title) return;

    const comments = [];
    const { highDetectionProb, lowDetectionProb, inefficientCostPerDetectionMultiplier, efficientCostPerDetectionMultiplier, singleBuoyDominanceRatio, highTransitTimeRatio, significantOptimizationGainMinutes, wideConfidenceInterval } = analystThresholds;

    // 1. Tespit Olasılığı Değerlendirmesi
    if (results.tespitOlasiligiYuzde >= highDetectionProb) {
        comments.push({ type: 'positive', text: `<strong>Yüksek Başarı Oranı:</strong> Elde edilen %${results.tespitOlasiligiYuzde.toFixed(1)}'lik tespit olasılığı, kurulan sonobuoy bariyerinin geometrik olarak hedefin yolunu kesmede oldukça etkili olduğunu göstermektedir.` });
    } else if (results.tespitOlasiligiYuzde <= lowDetectionProb && results.fiiliBirakilanSonobuoySayisi > 0) {
        comments.push({ type: 'negative', text: `<strong>Düşük Başarı Oranı:</strong> %${results.tespitOlasiligiYuzde.toFixed(1)}'lik tespit olasılığı, mevcut stratejinin hedefi tespit etmede yetersiz kaldığını göstermektedir. Sonobuoy adedi, yerleşim paterni veya sonar parametrelerinin gözden geçirilmesi gerekebilir.` });
    }

    // 2. Güven Aralığı Değerlendirmesi
    const ciWidth = results.ci_ust_yuzde - results.ci_alt_yuzde;
    if (ciWidth > wideConfidenceInterval) {
        comments.push({ type: 'warning', text: `<strong>İstatistiksel Belirsizlik:</strong> Tespit olasılığı tahmininin %95 güven aralığı (%${ciWidth.toFixed(1)}) geniştir. Bu, sonucun istatistiksel olarak daha az kararlı olduğunu gösterir. Daha güvenilir bir sonuç için 'Monte Carlo Yol Sayısı'nı artırmak faydalı olabilir.` });
    }

    // 3. Maliyet-Etkinlik Değerlendirmesi
    if (results.tespitBasinaMaliyet > results.toplamMaliyet * inefficientCostPerDetectionMultiplier && results.toplamMaliyet > 0) {
        comments.push({ type: 'negative', text: `<strong>Düşük Maliyet-Etkinlik:</strong> Tespit başına düşen maliyetin ($${results.tespitBasinaMaliyet.toLocaleString()}) operasyonun toplam maliyetini aşması, başarılı tespit sayısının çok düşük olduğuna işaret eder. Strateji, genel olarak verimsizdir.` });
    } else if (results.tespitBasinaMaliyet < (params.costSonobuoy * efficientCostPerDetectionMultiplier) && results.tespitBasinaMaliyet > 0) {
        comments.push({ type: 'positive', text: `<strong>Yüksek Maliyet-Etkinlik:</strong> Tespit başına düşen maliyet ($${results.tespitBasinaMaliyet.toLocaleString()}), kullanılan kaynaklara göre oldukça verimli bir sonuç elde edildiğini göstermektedir.` });
    }

    // 4. Kaynak Kullanımı Değerlendirmesi
    const buoyEffectiveness = getBuoyEffectivenessData(results);
    if (buoyEffectiveness.totalDetections > 0 && (buoyEffectiveness.values[0] / buoyEffectiveness.totalDetections) > singleBuoyDominanceRatio) {
        comments.push({ type: 'warning', text: `<strong>Dengesiz Kaynak Kullanımı:</strong> Tespitlerin %${(buoyEffectiveness.values[0] / buoyEffectiveness.totalDetections * 100).toFixed(0)}'ının tek bir sonobuoy (${buoyEffectiveness.labels[0]}) tarafından yapılması, bariyerin diğer kısımlarının atıl kalmış olabileceğine işaret eder. Paternin geometrisi veya yerleşimi yeniden gözden geçirilmelidir.` });
    }

    // 5. Helikopter Verimliliği Değerlendirmesi
    let totalTransitTime = 0;
    if (results.helikopterHareketKaydi) {
        results.helikopterHareketKaydi.forEach(seg => {
            if (seg.type === 'to_drop_point' || seg.type === 'to_base') {
                totalTransitTime += seg.endTimeDk - seg.startTimeDk;
            }
        });
        if (results.helikopterOperasyonSuresiDk > 0 && (totalTransitTime / results.helikopterOperasyonSuresiDk) > highTransitTimeRatio) {
            comments.push({ type: 'negative', text: `<strong>Verimsiz Helikopter Kullanımı:</strong> Helikopterin toplam operasyon süresinin %${(totalTransitTime / results.helikopterOperasyonSuresiDk * 100).toFixed(0)}'ını üs ile operasyon sahası arasındaki intikallerde geçirmesi, üs konumunun sahaya uzak olduğunu ve operasyonel verimliliği düşürdüğünü göstermektedir.` });
        }
    }

    // 6. Optimizasyon Etkisi
    if (params.rotaOptimizasyonuEtkin && results.kazanilanSureDk > significantOptimizationGainMinutes) {
        comments.push({ type: 'positive', text: `<strong>Başarılı Rota Optimizasyonu:</strong> Helikopter rota optimizasyonu, operasyon süresini yaklaşık ${results.kazanilanSureDk.toFixed(0)} dakika kısaltarak önemli bir verimlilik kazancı sağlamıştır.` });
    }

    // HTML oluşturma
    if (comments.length > 0) {
        title.style.display = 'block';
        const iconMap = { positive: '✅', negative: '❗', warning: '⚠️' };
        let html = '<ul>';
        comments.forEach(comment => {
            html += `<li class="${comment.type}"><span class="icon">${iconMap[comment.type]}</span><span>${comment.text}</span></li>`;
        });
        html += '</ul>';
        container.innerHTML = html;
    } else {
        title.style.display = 'none';
        container.innerHTML = '';
    }
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

    const operasyonSuresiSaat = results.helikopterOperasyonSuresiDk / 60.0;
    const heloCost = operasyonSuresiSaat * (params.costHeloHour || 0);
    const buoyCost = results.fiiliBirakilanSonobuoySayisi * (params.costSonobuoy || 0);
    const personelCost = operasyonSuresiSaat * (params.personelSaatlikMaliyet || 0);
    const bakimCost = operasyonSuresiSaat * (params.ucusSaatiBasinaBakimMaliyeti || 0);

    const tooltips = {
        helo: createTooltip(metricTooltips['Helikopter Uçuş Maliyeti']),
        buoy: createTooltip(metricTooltips['Tüketilen Sonobuoy Maliyeti']),
        personel: createTooltip(metricTooltips['Personel Maliyeti']),
        bakim: createTooltip(metricTooltips['Bakım Maliyeti'])
    };
    
    costTableDiv.innerHTML = `
        <table>
            <tbody>
                <tr><td>Helikopter Uçuş (Yakıt) Maliyeti ${tooltips.helo}</td><td style="text-align:right;">$${heloCost.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td></tr>
                <tr><td>Personel Maliyeti ${tooltips.personel}</td><td style="text-align:right;">$${personelCost.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td></tr>
                <tr><td>Bakım Maliyeti ${tooltips.bakim}</td><td style="text-align:right;">$${bakimCost.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td></tr>
                <tr><td>Tüketilen Sonobuoy Maliyeti ${tooltips.buoy}</td><td style="text-align:right;">$${buoyCost.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td></tr>
            </tbody>
            <tfoot>
                <tr><th>Toplam Operasyon Maliyeti</th><th style="text-align:right;">$${results.toplamMaliyet.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</th></tr>
            </tfoot>
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
        personelSaatlikMaliyet: { name: "Personel Saatlik Maliyet ($)" },
        ucusSaatiBasinaBakimMaliyeti: { name: "Uçuş Saati Başına Bakım Maliyeti ($)" },
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
            tableHTML += `<tr><td>${config.name}${tooltip}</td><td style="text-align:right;">${value}</td></tr>`;
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
        Detaylı analiz için aşağıdaki karne, radar ve göreceli performans tablolarını inceleyebilirsiniz.
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
                        <span class="value cost">$${results.tespitBasinaMaliyet > 0 ? results.tespitBasinaMaliyet.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : 'N/A'}</span>
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
        personelSaatlikMaliyet: { name: "Personel Saatlik Maliyet ($)" },
        ucusSaatiBasinaBakimMaliyeti: { name: "Bakım Saatlik Maliyeti ($)" },
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
                value = value.toLocaleString('en-US', { maximumFractionDigits: 2 });
            } else if (typeof value === 'number') {
                value = value.toLocaleString('en-US');
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

function renderScorecard(scenarios) {
    const container = document.getElementById('scorecard-table-container');
    if (!container) return;

    const metrics = [
        { key: 'tespitOlasiligiYuzde', name: 'Tespit Olasılığı', higherIsBetter: true },
        { key: 'toplamMaliyet', name: 'Toplam Maliyet', higherIsBetter: false },
        { key: 'helikopterOperasyonSuresiDk', name: 'Operasyon Süresi', higherIsBetter: false },
        { key: 'tespitBasinaMaliyet', name: 'Tespit Başına Maliyet', higherIsBetter: false }
    ];

    let table = '<table><thead><tr><th>Metrik</th>';
    scenarios.forEach(s => table += `<th>${s.name}</th>`);
    table += '</tr></thead><tbody>';

    metrics.forEach(metric => {
        // Handle 'tespitBasinaMaliyet' where 0 can be 'N/A' but should be ranked last if others exist
        const values = scenarios.map(s => {
            let val = s.results[metric.key];
            if (metric.key === 'tespitBasinaMaliyet' && val === 0) {
                return Infinity; // Rank 0 cost as worst (Infinity)
            }
            return val;
        });

        const sorted = [...values].sort((a, b) => metric.higherIsBetter ? b - a : a - b);
        const ranks = values.map(v => {
            const rank = sorted.indexOf(v) + 1;
            return rank === 0 ? scenarios.length : rank; // Handle potential issues
        });

        table += `<tr><td>${metric.name}</td>`;
        ranks.forEach(rank => {
            const rankClass = rank === 1 ? 'rank-1' : (rank === 2 ? 'rank-2' : (rank === scenarios.length ? 'rank-last' : ''));
            table += `<td class="${rankClass}">${rank}.</td>`;
        });
        table += '</tr>';
    });

    table += '</tbody></table>';
    container.innerHTML = table;
}

function renderRelativePerformance(scenarios, referenceScenarioName) {
    const container = document.getElementById('relative-performance-table-container');
    if (!container) return;
    
    const referenceScenario = scenarios.find(s => s.name === referenceScenarioName);
    if (!referenceScenario) return;

    const metrics = [
        { key: 'tespitOlasiligiYuzde', name: 'Tespit Olasılığı (%)', higherIsBetter: true },
        { key: 'toplamMaliyet', name: 'Toplam Maliyet ($)', higherIsBetter: false },
        { key: 'helikopterOperasyonSuresiDk', name: 'Operasyon Süresi (dk)', higherIsBetter: false },
        { key: 'tespitBasinaMaliyet', name: 'Tespit Başına Maliyet ($)', higherIsBetter: false }
    ];

    let table = '<table><thead><tr><th>Metrik</th>';
    scenarios.forEach(s => {
        if (s.name !== referenceScenarioName) {
            table += `<th>${s.name} vs. Ref.</th>`;
        }
    });
    table += '</tr></thead><tbody>';

    metrics.forEach(metric => {
        table += `<tr><td>${metric.name}</td>`;
        const refValue = referenceScenario.results[metric.key];

        scenarios.forEach(s => {
            if (s.name !== referenceScenarioName) {
                const currentValue = s.results[metric.key];
                let diff = 0;
                if (refValue > 0) {
                    diff = ((currentValue - refValue) / refValue) * 100;
                } else if (currentValue > 0) {
                    diff = Infinity; // Reference is 0, current is not
                }

                let diffClass = 'neutral-change';
                if (Math.abs(diff) > 0.1) {
                    if (diff > 0) {
                        diffClass = metric.higherIsBetter ? 'positive-change' : 'negative-change';
                    } else {
                        diffClass = metric.higherIsBetter ? 'negative-change' : 'positive-change';
                    }
                }
                const diffText = isFinite(diff) ? `${diff > 0 ? '+' : ''}${diff.toFixed(1)}%` : 'N/A';
                table += `<td><span class="${diffClass}">${diffText}</span></td>`;
            }
        });
        table += '</tr>';
    });

    table += '</tbody></table>';
    container.innerHTML = table;
}
