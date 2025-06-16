// --- GÖRSELLEŞTİRME: ANA KONTROLCÜ ---
"use strict";

function gorsellestirSimulasyonSonuclari(
    gorsellestirmeTipi, sahaUzunNm_param, sahaGenisNm_param, sonarTespitYaricapiNm_param, sonuclar,
    ornekYolSayisi_param, sonobuoyCalismaSuresiDk_param, denizaltiHizKnot_param, sonobuoyDinlemeDerinligiM_param,
    akintiHiziKnot_param, akintiYonuDerece_param,
    isDatumKnown_param, datumX_viz, datumY_viz,
    uiHesaplaBtnRef,
    uiGraphDivId = 'graph'
) {
    const graphDiv = document.getElementById(uiGraphDivId);
    if (!graphDiv) {
        console.error(`Grafik div'i bulunamadı: ${uiGraphDivId}`);
        if (uiHesaplaBtnRef) uiHesaplaBtnRef.disabled = false;
        return;
    }

    if (typeof sahaUzunNm_param !== 'number' || typeof sahaGenisNm_param !== 'number' || isNaN(sahaUzunNm_param) || isNaN(sahaGenisNm_param)) {
        graphDiv.innerHTML = '<p style="text-align:center; color:red; padding:20px;">Grafik için geçersiz saha boyutları!</p>';
        if (uiHesaplaBtnRef) uiHesaplaBtnRef.disabled = false;
        return;
    }
    let vizAkintiYonX = 0;
    let vizAkintiYonY = 0;
    if (akintiHiziKnot_param > 0) {
        const matematikselAciRadyan = ((450 - akintiYonuDerece_param) % 360) * (Math.PI / 180);
        vizAkintiYonX = Math.cos(matematikselAciRadyan);
        vizAkintiYonY = Math.sin(matematikselAciRadyan);
    }
    const helikopterHareketKaydi = sonuclar.helikopterHareketKaydi || [];

    let heloStartX_viz = 0;
    let heloStartY_viz = 0;
    if (helikopterHareketKaydi.length > 0 && helikopterHareketKaydi[0].type === 'start_at_base') {
        heloStartX_viz = helikopterHareketKaydi[0].startX;
        heloStartY_viz = helikopterHareketKaydi[0].startY;
    }

    const datumMarker = [];
    const currentIsDatumKnown = sonuclar.hasOwnProperty('isDatumKnown') ? sonuclar.isDatumKnown : isDatumKnown_param;

    if (currentIsDatumKnown && typeof datumX_viz === 'number' && typeof datumY_viz === 'number') {
        datumMarker.push({
            x: [datumX_viz],
            y: [datumY_viz],
            z: gorsellestirmeTipi === '3d' ? [-sonobuoyDinlemeDerinligiM_param / METERS_PER_NAUTICAL_MILE * 0.5] : undefined,
            mode: 'markers',
            type: gorsellestirmeTipi === '3d' ? 'scatter3d' : 'scatter',
            marker: {
                symbol: 'cross',
                size: gorsellestirmeTipi === '3d' ? 8 : 12,
                color: '#FFD700',
                line: { width: 1, color: '#FFFFFF' }
            },
            name: 'Varsayılan Datum',
            uid: 'datum_marker_viz',
            showlegend: true
        });
    }

    if (gorsellestirmeTipi === '3d') {
        gorsellestir3D(sahaUzunNm_param, sahaGenisNm_param, sonarTespitYaricapiNm_param, sonuclar,
            ornekYolSayisi_param, sonobuoyCalismaSuresiDk_param, denizaltiHizKnot_param, sonobuoyDinlemeDerinligiM_param,
            akintiHiziKnot_param, vizAkintiYonX, vizAkintiYonY, helikopterHareketKaydi,
            heloStartX_viz, heloStartY_viz, datumMarker
            );
    } else {
        gorsellestir2D(sahaUzunNm_param, sahaGenisNm_param, sonarTespitYaricapiNm_param, sonuclar,
            ornekYolSayisi_param, sonobuoyCalismaSuresiDk_param, denizaltiHizKnot_param,
            akintiHiziKnot_param, vizAkintiYonX, vizAkintiYonY, helikopterHareketKaydi,
            heloStartX_viz, heloStartY_viz, datumMarker
            );
    }
}

function plotSensitivityGraph(
    paramName, xValues, yPrimaryValues, outputPrimaryName, divId,
    ySecondaryValues, outputSecondaryName,
    baselinePrimaryValue, baselineSecondaryValue
) {
    const sensitivityGraphDiv = document.getElementById(divId);
    if (!sensitivityGraphDiv) {
        console.error(`Duyarlılık grafiği div'i bulunamadı: ${divId}`);
        return;
    }
    sensitivityGraphDiv.innerHTML = '';

    const traces = [];
    traces.push({
        x: xValues, y: yPrimaryValues, mode: 'lines+markers', type: 'scatter', name: outputPrimaryName,
        connectgaps: false,
        line: { color: '#67e8f9' }, marker: { color: '#22d3ee', size: 8 }
    });

    let finalLayout = {
        title: { text: `${paramName} Değişimine Karşı Çıktı Duyarlılığı`, font: {size: 16, color: '#e0f2fe'} },
        font: { color: '#c0c5ce' }, paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)',
        xaxis: { title: paramName, gridcolor: 'rgba(255, 255, 255, 0.1)', linecolor: 'rgba(255, 255, 255, 0.2)', zerolinecolor: 'rgba(255, 255, 255, 0.2)', titlefont: { color: '#a5d8ff' }, tickfont: { color: '#a8b2d1' } },
        yaxis: { title: outputPrimaryName, rangemode: 'tozero', gridcolor: 'rgba(255, 255, 255, 0.1)', linecolor: 'rgba(255, 255, 255, 0.2)', zerolinecolor: 'rgba(255, 255, 255, 0.2)', titlefont: { color: '#a5d8ff' }, tickfont: { color: '#a8b2d1' } },
        margin: { t: 60, b: 50, l: 70, r: 70 },
        legend: { bgcolor: 'rgba(17, 24, 39, 0.7)', bordercolor: 'rgba(56, 189, 248, 0.2)', x: 1.05, y: 1, xanchor: 'left'},
        shapes: [],
        annotations: []
    };

    if (ySecondaryValues && ySecondaryValues.length === xValues.length && outputSecondaryName && outputSecondaryName !== 'Yok') {
        traces.push({
            x: xValues, y: ySecondaryValues, mode: 'lines+markers', type: 'scatter',
            name: outputSecondaryName, yaxis: 'y2', connectgaps: false,
            line: { color: '#f59e0b' }, marker: { color: '#f59e0b', size: 8 }
        });
        finalLayout.yaxis2 = {
            title: outputSecondaryName, titlefont: { color: '#f59e0b' }, tickfont: { color: '#f59e0b' },
            overlaying: 'y', side: 'right', rangemode: 'tozero',
            gridcolor: 'rgba(255, 255, 255, 0.05)', linecolor: 'rgba(255, 255, 255, 0.2)', zerolinecolor: 'rgba(255, 255, 255, 0.2)'
        };
    }

    if (baselinePrimaryValue !== undefined && xValues.length > 0) {
        finalLayout.shapes.push({ type: 'line', x0: xValues[0], y0: baselinePrimaryValue, x1: xValues[xValues.length - 1], y1: baselinePrimaryValue, line: { color: 'rgba(107, 114, 128, 0.7)', width: 2, dash: 'dashdot' } });
        finalLayout.annotations.push({ x: xValues[Math.floor(xValues.length / 2)], y: baselinePrimaryValue, xref: 'x', yref: 'y', text: `Temel: ${baselinePrimaryValue.toFixed(2)}`, showarrow: true, arrowhead: 0, ax: 0, ay: -20, font: {color: 'rgba(107, 114, 128, 0.9)'} });
    }
    if (baselineSecondaryValue !== undefined && ySecondaryValues && ySecondaryValues.length > 0 && finalLayout.yaxis2) {
        finalLayout.shapes.push({ type: 'line', yref: 'y2', x0: xValues[0], y0: baselineSecondaryValue, x1: xValues[xValues.length - 1], y1: baselineSecondaryValue, line: { color: 'rgba(245, 158, 11, 0.5)', width: 2, dash: 'dashdot' } });
        finalLayout.annotations.push({ x: xValues[Math.floor(xValues.length / 2)], y: baselineSecondaryValue, xref: 'x', yref: 'y2', text: `Temel (İkincil): ${baselineSecondaryValue.toFixed(2)}`, showarrow: true, arrowhead: 0, ax: 0, ay: 20, font: {color: 'rgba(245, 158, 11, 0.9)'} });
    }

    Plotly.newPlot(divId, traces, finalLayout).catch(err => {
        console.error("Duyarlılık grafiği çizilirken hata:", err);
        sensitivityGraphDiv.innerHTML = '<p style="text-align:center; color:red; padding:20px;">Duyarlılık grafiği oluşturulurken bir hata oluştu.</p>';
    });
    sensitivityGraphDiv.style.display = 'block';
}