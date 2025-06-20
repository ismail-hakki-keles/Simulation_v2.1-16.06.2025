/*
 * Denizaltı Tespit Simülasyonu
 * Copyright (c) 2025 İsmail Hakkı KELEŞ
 *
 * Bu proje MIT Lisansı altında lisanslanmıştır.
 * Lisansın tam metni için projenin kök dizinindeki LICENSE dosyasına bakın.
 * GitHub: https://github.com/knnchw/Simulation_v2.1-16.06.2025
 */

// --- RAPOR OLUŞTURUCU: GÖRSEL GRAFİKLER ---
"use strict";

// Tema ile uyumlu varsayılan layout ayarları
const reportChartLayoutDefaults = {
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    font: {
        color: '#d1d5db' // --text-secondary
    },
    title: {
        font: {
            color: '#f9fafb' // --text-primary
        }
    },
    legend: {
        font: {
            color: '#d1d5db'
        }
    },
    xaxis: {
        gridcolor: '#374151', // --border-color
        linecolor: '#374151',
        zerolinecolor: '#9ca3af', // --text-muted
        title: { font: { color: '#f9fafb' } },
        tickfont: { color: '#d1d5db' }
    },
    yaxis: {
        gridcolor: '#374151',
        linecolor: '#374151',
        zerolinecolor: '#9ca3af',
        title: { font: { color: '#f9fafb' } },
        tickfont: { color: '#d1d5db' }
    }
};

function plotHeloTimePieChart(results) {
    const chartDiv = document.getElementById('helo-time-pie-chart');
    if (!chartDiv) return;

    const timeBreakdown = { 'İntikal': 0, 'Bırakma': 0, 'İkmal': 0 };

    if (results.helikopterHareketKaydi) {
        results.helikopterHareketKaydi.forEach(seg => {
            const duration = seg.endTimeDk - seg.startTimeDk;
            if (seg.type === 'to_drop_point' || seg.type === 'to_base') {
                timeBreakdown['İntikal'] += duration;
            } else if (seg.type === 'dropping_sonobuoy') {
                timeBreakdown['Bırakma'] += duration;
            } else if (seg.type === 'refueling_at_base') {
                timeBreakdown['İkmal'] += duration;
            }
        });
    }

    const data = [{
        values: Object.values(timeBreakdown).map(v => v.toFixed(1)),
        labels: Object.keys(timeBreakdown),
        type: 'pie',
        hole: .4,
        textinfo: "label+percent",
        textposition: "inside",
        hoverinfo: 'label+value+percent',
        hovertemplate: '%{label}: %{value} dk<br>%{percent}<extra></extra>',
        marker: {
            colors: ['#38bdf8', '#f59e0b', '#f87171']
        }
    }];

    const layout = {
        ...reportChartLayoutDefaults,
        title: { ...reportChartLayoutDefaults.title, text: null }, // Başlık h3'te olduğu için grafikte kaldırıldı
        showlegend: true,
        height: 400
    };

    Plotly.newPlot(chartDiv, data, layout, {responsive: true});
}

function plotDetectionHeatmap(params, results) {
    const chartDiv = document.getElementById('detection-heatmap');
    if (!chartDiv) return;

    const detectionX = [];
    const detectionY = [];

    if (results.denizaltiYollariVeTespitDurumu) {
        results.denizaltiYollariVeTespitDurumu.forEach(yol => {
            if (yol && yol[1] && yol[2]) { // tespitEdildi ve tespitNoktasi
                detectionX.push(yol[2][0]);
                detectionY.push(yol[2][1]);
            }
        });
    }

    if (detectionX.length === 0) {
        chartDiv.innerHTML = '<p style="text-align: center; padding-top: 50px; color: var(--text-muted);">Hiç tespit gerçekleşmediği için ısı haritası oluşturulamadı.</p>';
        return;
    }

    const data = [{
        x: detectionX,
        y: detectionY,
        type: 'histogram2d',
        colorscale: 'Cividis', 
        reversescale: true,
        colorbar: {
            title: 'Tespit Sayısı',
            titleside: 'right'
        }
    }];
    
    const layout = {
        ...reportChartLayoutDefaults,
        title: { ...reportChartLayoutDefaults.title, text: null},
        xaxis: { ...reportChartLayoutDefaults.xaxis, title: { ...reportChartLayoutDefaults.xaxis.title, text: 'Saha Uzunluğu (X - NM)' }, range: [0, params.sahaUzunluk] },
        yaxis: { ...reportChartLayoutDefaults.yaxis, title: { ...reportChartLayoutDefaults.yaxis.title, text: 'Saha Genişliği (Y - NM)' }, range: [0, params.sahaGenislik] }
    };

    Plotly.newPlot(chartDiv, data, layout, {responsive: true});
}

function getBuoyEffectivenessData(results) {
    const detectionCounts = {};
    const totalBuoys = results.fiiliBirakilanSonobuoySayisi;
    
    for (let i = 0; i < totalBuoys; i++) {
        detectionCounts[`Sonobuoy ${i + 1}`] = 0;
    }

    let totalDetections = 0;
    if (results.denizaltiYollariVeTespitDurumu) {
        results.denizaltiYollariVeTespitDurumu.forEach(yol => {
            if (!yol) return;
            const tespitEdildi = yol[1];
            const tespitEdenSonobuoyIndeksi = yol[4];
            if (tespitEdildi && tespitEdenSonobuoyIndeksi !== -1 && tespitEdenSonobuoyIndeksi != null) {
                const buoyLabel = `Sonobuoy ${tespitEdenSonobuoyIndeksi + 1}`;
                if (detectionCounts.hasOwnProperty(buoyLabel)) {
                    detectionCounts[buoyLabel]++;
                    totalDetections++;
                }
            }
        });
    }
    
    const sortedBuoys = Object.entries(detectionCounts).sort(([,a],[,b]) => b-a);

    return {
        labels: sortedBuoys.map(entry => entry[0]),
        values: sortedBuoys.map(entry => entry[1]),
        totalDetections: totalDetections
    };
}

function plotBuoyEffectiveness(results) {
    const buoyChartDiv = document.getElementById('buoy-effectiveness-chart');
    if (!buoyChartDiv) return;
    
    if (results.fiiliBirakilanSonobuoySayisi === 0) {
        buoyChartDiv.innerHTML = '<p style="text-align: center; padding-top: 50px; color: var(--text-muted);">Grafik oluşturulamaz: Hiç sonobuoy bırakılmadı.</p>';
        return;
    }

    const { labels, values, totalDetections } = getBuoyEffectivenessData(results);

    if (totalDetections === 0) {
        buoyChartDiv.innerHTML = '<p style="text-align: center; padding-top: 50px; color: var(--text-muted);">Hiç tespit gerçekleşmediği için etkinlik grafiği oluşturulamadı.</p>';
        return;
    }
    
    const percentages = values.map(count => (count / totalDetections * 100));
    const hoverTexts = values.map((count, index) => `Tespit: ${count}<br>Pay: %${percentages[index].toFixed(1)}`);

    const trace = {
        x: labels,
        y: values,
        text: percentages.map(p => `%${p.toFixed(1)}`),
        textposition: 'auto',
        hoverinfo: 'x+y+text',
        hovertext: hoverTexts,
        type: 'bar',
        marker: {
            color: 'rgba(56, 189, 248, 0.7)',
            line: { color: 'rgba(56, 189, 248, 1.0)', width: 1 }
        }
    };

    const layout = {
        ...reportChartLayoutDefaults,
        title: { ...reportChartLayoutDefaults.title, text: null },
        xaxis: { ...reportChartLayoutDefaults.xaxis, title: { ...reportChartLayoutDefaults.xaxis.title, text: 'Sonobuoy Kimliği' } },
        yaxis: { ...reportChartLayoutDefaults.yaxis, title: { ...reportChartLayoutDefaults.yaxis.title, text: 'Yapılan Tespit Sayısı' } },
        bargap: 0.1
    };
    
    Plotly.newPlot(buoyChartDiv, [trace], layout, {responsive: true});
}

function plotDetectionTimes(results, params) {
    const timeChartDiv = document.getElementById('detection-time-chart');
    if (!timeChartDiv) return;
    
    const detectionTimes = [];

    if (params.denizaltiSurati > 0 && results.denizaltiYollariVeTespitDurumu) {
        results.denizaltiYollariVeTespitDurumu.forEach(yol => {
            if (!yol) return;
            const tespitEdildi = yol[1];
            const tespitNoktasi = yol[2];
            const mc_baslangicX = yol[3];
            if (tespitEdildi && tespitNoktasi) {
                const mesafe = tespitNoktasi[0] - mc_baslangicX;
                const sureDk = (mesafe / params.denizaltiSurati) * 60;
                detectionTimes.push(sureDk);
            }
        });
    }

    if (detectionTimes.length === 0) {
        timeChartDiv.innerHTML = '<p style="text-align: center; padding-top: 50px; color: var(--text-muted);">Hiç tespit gerçekleşmediği için zaman dağılımı grafiği oluşturulamadı.</p>';
        return;
    }

    const trace = {
        x: detectionTimes,
        type: 'histogram',
        marker: {
            color: 'rgba(167, 139, 250, 0.7)',
            line: { color: 'rgba(139, 92, 246, 1.0)', width: 1 }
        },
        xbins: { size: (Math.max(...detectionTimes) - Math.min(...detectionTimes)) / 15 }
    };

    const layout = {
        ...reportChartLayoutDefaults,
        title: { ...reportChartLayoutDefaults.title, text: null },
        xaxis: { ...reportChartLayoutDefaults.xaxis, title: { ...reportChartLayoutDefaults.xaxis.title, text: 'Tespit Zamanı (Dakika)' } },
        yaxis: { ...reportChartLayoutDefaults.yaxis, title: { ...reportChartLayoutDefaults.yaxis.title, text: 'Tespit Sayısı' } },
        bargap: 0.05
    };

    Plotly.newPlot(timeChartDiv, [trace], layout, {responsive: true});
}

function plotRouteComparison(results, params) {
    const chartDiv = document.getElementById('route-comparison-chart');
    if (!chartDiv) return;

    if (!results.unoptimizedRoute || !results.sonobuoyKonumlariVeSirasi || !results.heloBase || !params.rotaOptimizasyonuEtkin) {
        chartDiv.innerHTML = '<p style="text-align: center; padding-top: 50px; color: var(--text-muted);">Rota optimizasyonu aktif edilmediği veya veri bulunamadığı için karşılaştırma yapılamadı.</p>';
        return;
    }

    const base = results.heloBase;
    
    const unoptimizedX = [base.x, ...results.unoptimizedRoute.map(p => p.x), base.x];
    const unoptimizedY = [base.y, ...results.unoptimizedRoute.map(p => p.y), base.y];
    
    const optimizedX = [base.x, ...results.sonobuoyKonumlariVeSirasi.map(p => p[0]), base.x];
    const optimizedY = [base.y, ...results.sonobuoyKonumlariVeSirasi.map(p => p[1]), base.y];

    const traces = [
        { x: unoptimizedX, y: unoptimizedY, mode: 'lines+markers', type: 'scatter', name: 'Optimize Edilmemiş Rota', line: { color: '#9ca3af', dash: 'dot', width: 2 }, marker: {size: 5} },
        { x: optimizedX, y: optimizedY, mode: 'lines+markers', type: 'scatter', name: 'Optimize Edilmiş Rota', line: { color: '#38bdf8', width: 3 }, marker: {size: 6} },
        { x: [base.x], y: [base.y], mode: 'markers', type: 'scatter', name: 'Helikopter Üssü', marker: { symbol: 'triangle-up', size: 12, color: '#f59e0b'} }
    ];

    const layout = {
        ...reportChartLayoutDefaults,
        title: { ...reportChartLayoutDefaults.title, text: null },
        xaxis: { ...reportChartLayoutDefaults.xaxis, range: [0, params.sahaUzunluk] },
        yaxis: { ...reportChartLayoutDefaults.yaxis, range: [0, params.sahaGenislik], scaleanchor: 'x' },
        showlegend: true
    };

    Plotly.newPlot(chartDiv, traces, layout, {responsive: true});
}

function plotDetectionDepthHistogram(results) {
    const chartDiv = document.getElementById('detection-depth-chart');
    if (!chartDiv) return;

    if (!results.dikeyAyrilmaMesafeleri || results.dikeyAyrilmaMesafeleri.length === 0) {
        chartDiv.innerHTML = '<p style="text-align: center; padding-top: 50px; color: var(--text-muted);">Tespit gerçekleşmediği için derinlik analizi yapılamadı.</p>';
        return;
    }

    const trace = {
        x: results.dikeyAyrilmaMesafeleri,
        type: 'histogram',
        marker: {
            color: 'rgba(239, 68, 68, 0.7)', 
            line: { color: 'rgba(220, 38, 38, 1.0)', width: 1 }
        },
        xbins: { size: Math.max(10, (Math.max(...results.dikeyAyrilmaMesafeleri) / 10)) }
    };
    
    const layout = {
        ...reportChartLayoutDefaults,
        title: { ...reportChartLayoutDefaults.title, text: null },
        xaxis: { ...reportChartLayoutDefaults.xaxis, title: { ...reportChartLayoutDefaults.xaxis.title, text: 'Dikey Ayrım (Metre)' } },
        yaxis: { ...reportChartLayoutDefaults.yaxis, title: { ...reportChartLayoutDefaults.yaxis.title, text: 'Tespit Sayısı' } },
        bargap: 0.05
    };

    Plotly.newPlot(chartDiv, [trace], layout, {responsive: true});
}

function plotComparisonRadarChart(scenarios) {
    const chartDiv = document.getElementById('comparison-radar-chart');
    if (!chartDiv) return;

    const metrics = [
        { key: 'tespitOlasiligiYuzde', name: 'Tespit Olasılığı', higherIsBetter: true },
        { key: 'toplamMaliyet', name: 'Toplam Maliyet', higherIsBetter: false },
        { key: 'helikopterOperasyonSuresiDk', name: 'Operasyon Süresi', higherIsBetter: false },
        { key: 'tespitBasinaMaliyet', name: 'Tespit Başına Maliyet', higherIsBetter: false }
    ];
    
    const data = [];
    const ranges = {};

    // Min ve max değerleri bul
    metrics.forEach(metric => {
        let values = scenarios.map(s => {
            const val = s.results[metric.key];
            // Tespit başına maliyeti 0 olanları (N/A) geçici olarak en kötü değer yap
            return (metric.key === 'tespitBasinaMaliyet' && val === 0) ? Infinity : val;
        }).filter(v => isFinite(v));
        
        if (values.length > 0) {
            ranges[metric.key] = { min: Math.min(...values), max: Math.max(...values) };
        } else {
            ranges[metric.key] = { min: 0, max: 1 };
        }
    });
    
    // Her senaryo için bir trace oluştur
    scenarios.forEach(scenario => {
        const r_values = metrics.map(metric => {
            const range = ranges[metric.key];
            let value = scenario.results[metric.key];

            // Tespit başına maliyet N/A ise 0 puan ver
            if (metric.key === 'tespitBasinaMaliyet' && value === 0) {
                return 0;
            }

            if (range.max === range.min) return 0.5; // Tüm değerler aynıysa orta puan ver

            let score = (value - range.min) / (range.max - range.min);
            if (!metric.higherIsBetter) {
                score = 1 - score;
            }
            return score;
        });

        data.push({
            type: 'scatterpolar',
            r: [...r_values, r_values[0]], // Grafiği kapatmak için ilk değeri sona ekle
            theta: [...metrics.map(m => m.name), metrics[0].name],
            fill: 'toself',
            name: scenario.name
        });
    });

    const layout = {
        ...reportChartLayoutDefaults,
        polar: {
            radialaxis: { visible: true, range: [0, 1], showticklabels: false, showline: false },
            angularaxis: { tickfont: { size: 12 } },
            bgcolor: 'rgba(255, 255, 255, 0.05)'
        },
        title: { text: null },
        showlegend: true
    };
    
    Plotly.newPlot(chartDiv, data, layout, {responsive: true});
}
