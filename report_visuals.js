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

    const data = [{
        values: Object.values(timeBreakdown),
        labels: Object.keys(timeBreakdown),
        type: 'pie',
        hole: .4,
        textinfo: "label+percent",
        textposition: "inside",
        marker: {
            colors: ['#38bdf8', '#f59e0b', '#f87171']
        }
    }];

    const layout = {
        ...reportChartLayoutDefaults,
        title: { ...reportChartLayoutDefaults.title, text: 'Helikopter Aktivite Süreleri' },
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

    results.denizaltiYollariVeTespitDurumu.forEach(yol => {
        if (yol[1] && yol[2]) {
            detectionX.push(yol[2][0]);
            detectionY.push(yol[2][1]);
        }
    });

    if (detectionX.length === 0) {
        chartDiv.innerHTML = '<p style="text-align: center; padding-top: 50px; color: var(--text-muted);">Hiç tespit gerçekleşmediği için ısı haritası oluşturulamadı.</p>';
        return;
    }

    const data = [{
        x: detectionX,
        y: detectionY,
        type: 'histogram2d',
        colorscale: 'Cividis', // Koyu tema için daha uygun bir renk skalası
        reversescale: true
    }];
    
    const layout = {
        ...reportChartLayoutDefaults,
        title: { ...reportChartLayoutDefaults.title, text: 'Tespitlerin Yoğunlaştığı Bölgeler'},
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
    results.denizaltiYollariVeTespitDurumu.forEach(yol => {
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
    
    const sortedBuoys = Object.entries(detectionCounts).sort(([,a],[,b]) => b-a);

    return {
        labels: sortedBuoys.map(entry => entry[0]),
        values: sortedBuoys.map(entry => entry[1]),
        totalDetections: totalDetections
    };
}

function plotBuoyEffectiveness(results) {
    const buoyChartDiv = document.getElementById('buoy-effectiveness-chart');
    if (!buoyChartDiv || results.fiiliBirakilanSonobuoySayisi === 0) {
        if(buoyChartDiv) buoyChartDiv.innerHTML = '<p style="text-align: center; padding-top: 50px; color: var(--text-muted);">Grafik oluşturulamaz: Hiç sonobuoy bırakılmadı.</p>';
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
            color: 'rgba(56, 189, 248, 0.7)', // --accent-primary
            line: { color: 'rgba(56, 189, 248, 1.0)', width: 1 }
        }
    };

    const layout = {
        ...reportChartLayoutDefaults,
        title: { ...reportChartLayoutDefaults.title, text: 'Sonobuoy Etkinlik Dağılımı (En Etkiliden Başlayarak)' },
        xaxis: { ...reportChartLayoutDefaults.xaxis, title: { ...reportChartLayoutDefaults.xaxis.title, text: 'Sonobuoy Kimliği' } },
        yaxis: { ...reportChartLayoutDefaults.yaxis, title: { ...reportChartLayoutDefaults.yaxis.title, text: 'Yapılan Tespit Sayısı' } },
        bargap: 0.1
    };
    
    Plotly.newPlot(buoyChartDiv, [trace], layout, {responsive: true});
}

function plotDetectionTimes(results, params) {
    const timeChartDiv = document.getElementById('detection-time-chart');
    const detectionTimes = [];

    if (params.denizaltiSurati > 0) {
        results.denizaltiYollariVeTespitDurumu.forEach(yol => {
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
            color: 'rgba(167, 139, 250, 0.7)', // Violet
            line: { color: 'rgba(139, 92, 246, 1.0)', width: 1 }
        },
        xbins: { size: (Math.max(...detectionTimes) - Math.min(...detectionTimes)) / 15 }
    };

    const layout = {
        ...reportChartLayoutDefaults,
        title: { ...reportChartLayoutDefaults.title, text: 'Tespitlerin Zamana Göre Yoğunluğu' },
        xaxis: { ...reportChartLayoutDefaults.xaxis, title: { ...reportChartLayoutDefaults.xaxis.title, text: 'Tespit Zamanı (Dakika)' } },
        yaxis: { ...reportChartLayoutDefaults.yaxis, title: { ...reportChartLayoutDefaults.yaxis.title, text: 'Tespit Sayısı' } },
        bargap: 0.05
    };

    Plotly.newPlot(timeChartDiv, [trace], layout, {responsive: true});
}

// YENİ FONKSİYON: Rota Karşılaştırma Grafiği
function plotRouteComparison(results, params) {
    const chartDiv = document.getElementById('route-comparison-chart');
    if (!chartDiv || !results.unoptimizedRoute || !results.sonobuoyKonumlariVeSirasi || !results.heloBase) {
        if(chartDiv) chartDiv.innerHTML = '<p style="text-align: center; padding-top: 50px; color: var(--text-muted);">Optimizasyon verisi bulunamadı.</p>';
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
        title: { ...reportChartLayoutDefaults.title, text: 'Rota Karşılaştırması' },
        xaxis: { ...reportChartLayoutDefaults.xaxis, range: [0, params.sahaUzunluk] },
        yaxis: { ...reportChartLayoutDefaults.yaxis, range: [0, params.sahaGenislik], scaleanchor: 'x' },
        showlegend: true
    };

    Plotly.newPlot(chartDiv, traces, layout, {responsive: true});
}

// YENİ FONKSİYON: Derinliğe Göre Tespit Dağılımı Grafiği
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
            color: 'rgba(239, 68, 68, 0.7)', // red-500
            line: { color: 'rgba(220, 38, 38, 1.0)', width: 1 }
        },
        xbins: { size: Math.max(10, (Math.max(...results.dikeyAyrilmaMesafeleri) / 10)) }
    };
    
    const layout = {
        ...reportChartLayoutDefaults,
        title: { ...reportChartLayoutDefaults.title, text: 'Dikey Ayrım Mesafesine Göre Tespit Sayısı' },
        xaxis: { ...reportChartLayoutDefaults.xaxis, title: { ...reportChartLayoutDefaults.xaxis.title, text: 'Dikey Ayrım (Metre)' } },
        yaxis: { ...reportChartLayoutDefaults.yaxis, title: { ...reportChartLayoutDefaults.yaxis.title, text: 'Tespit Sayısı' } },
        bargap: 0.05
    };

    Plotly.newPlot(chartDiv, [trace], layout, {responsive: true});
}