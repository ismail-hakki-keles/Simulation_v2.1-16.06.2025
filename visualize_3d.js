// --- GÖRSELLEŞTİRME: 3D ANİMASYON ---
"use strict";

function createSphere(radius, segments, center_x, center_y, center_z) {
    let x_sph = [], y_sph = [], z_sph = [], i_tris = [], j_tris = [], k_tris = [];
    for (let lat = 0; lat <= segments; lat++) {
        const theta = lat * Math.PI / segments;
        const sinTheta = Math.sin(theta);
        const cosTheta = Math.cos(theta);
        for (let lon = 0; lon <= segments; lon++) {
            const phi = lon * 2 * Math.PI / segments;
            const sinPhi = Math.sin(phi);
            const cosPhi = Math.cos(phi);
            x_sph.push(center_x + radius * cosPhi * sinTheta);
            y_sph.push(center_y + radius * sinPhi * sinTheta);
            z_sph.push(center_z + radius * cosTheta);
        }
    }
    for (let lat = 0; lat < segments; lat++) {
        for (let lon = 0; lon < segments; lon++) {
            const first = (lat * (segments + 1)) + lon;
            const second = first + segments + 1;
            i_tris.push(first); j_tris.push(second); k_tris.push(first + 1);
            i_tris.push(second); j_tris.push(second + 1); k_tris.push(first + 1);
        }
    }
    return { x: x_sph, y: y_sph, z: z_sph, i: i_tris, j: j_tris, k: k_tris, type: 'mesh3d', opacity: 0.1, color: 'rgb(74, 222, 128)', hoverinfo: 'skip', showlegend: false };
}


function gorsellestir3D(
    sahaUzunNm, sahaGenisNm, sonarTespitYaricapiNm, sonuclar,
    ornekYolSayisi, sonobuoyCalismaSuresiDk, denizaltiHizKnot, sonobuoyDinlemeDerinligiM,
    akintiHiziKnot, akintiYonX, akintiYonY, helikopterHareketKaydi,
    heloStartX_passed, heloStartY_passed,
    datumMarkerTrace
) {
    const initialData = [];
    const frames = [];
    const animationTimesteps = [];
    const HELO_Z_VIZ = HELO_ALTITUDE_NM_3D;
    const plotSahaUzun = (typeof sahaUzunNm === 'number' && !isNaN(sahaUzunNm) && sahaUzunNm > 0) ? sahaUzunNm : 10;
    const plotSahaGenis = (typeof sahaGenisNm === 'number' && !isNaN(sahaGenisNm) && sahaGenisNm > 0) ? sahaGenisNm : 10;
    const plotSonarYaricap = (typeof sonarTespitYaricapiNm === 'number' && !isNaN(sonarTespitYaricapiNm) && sonarTespitYaricapiNm > 0) ? sonarTespitYaricapiNm : 1;
    const sonobuoyDinlemeDerinligiNm = sonobuoyDinlemeDerinligiM / METERS_PER_NAUTICAL_MILE;

    let minObservedZ_NM = -sonobuoyDinlemeDerinligiNm;
    let maxObservedZ_NM = HELO_Z_VIZ;

    if (sonuclar && sonuclar.denizaltiYollariVeTespitDurumu) {
        sonuclar.denizaltiYollariVeTespitDurumu.forEach(pathDataWithMeta => {
            if (pathDataWithMeta && pathDataWithMeta.length > 0) {
                const yolNoktalari = pathDataWithMeta[0];
                if (yolNoktalari) {
                    yolNoktalari.forEach(point => {
                        if (point && typeof point[2] === 'number') {
                            const subDepthNM = -point[2]; // Derinlik negatif olarak gösterilir
                            minObservedZ_NM = Math.min(minObservedZ_NM, subDepthNM);
                        }
                    });
                }
            }
        });
    }
    const zAxisRangeMargin = Math.max(0.1, Math.abs(maxObservedZ_NM - minObservedZ_NM) * 0.15);
    const finalMinZ_Plot = minObservedZ_NM - zAxisRangeMargin;
    const finalMaxZ_Plot = maxObservedZ_NM + zAxisRangeMargin * 0.5;

    const sahaTabanTrace = { type: 'mesh3d', name: 'Operasyon Alanı (Taban)', x: [0, plotSahaUzun, plotSahaUzun, 0], y: [0, 0, plotSahaGenis, plotSahaGenis], z: [finalMinZ_Plot, finalMinZ_Plot, finalMinZ_Plot, finalMinZ_Plot], i: [0, 0], j: [1, 2], k: [2, 3], opacity: 0.05, color: 'rgb(173, 216, 230)', hoverinfo: 'name', showlegend: false, uid: 'operation_area_3d_base' };
    initialData.push(sahaTabanTrace);

    if (datumMarkerTrace && datumMarkerTrace.length > 0) {
        initialData.push({...datumMarkerTrace[0], uid: 'datum_marker_viz_3d_init'});
    }

    initialData.push({ type: 'scatter3d', mode: 'markers', x: [heloStartX_passed], y: [heloStartY_passed], z: [HELO_Z_VIZ], marker: { symbol: 'diamond', size: 6, color: '#c084fc' }, name: 'Helikopter Üssü', uid: 'helo_marker_3d', showlegend: true });
    initialData.push({ type: 'scatter3d', mode: 'lines', x: [heloStartX_passed], y: [heloStartY_passed], z: [HELO_Z_VIZ], line: { color: 'rgba(192, 132, 252, 0.5)', width: 2.5, dash: 'dot' }, name: 'Helikopter Rotası', uid: 'helo_path_3d', showlegend: true });

    const sonobuoyAtisVerileri = sonuclar && sonuclar.sonobuoyKonumlariVeSirasi ? sonuclar.sonobuoyKonumlariVeSirasi : [];
    const zamanNoktalariSource = [];
     if(sonobuoyAtisVerileri.length > 0) {
        sonobuoyAtisVerileri.forEach((sbData) => {
             if (sbData && sbData.length >= 3 && typeof sbData[2] === 'number' && !isNaN(sbData[2])) {
                zamanNoktalariSource.push(sbData[2]);
                zamanNoktalariSource.push(sbData[2] + sonobuoyCalismaSuresiDk);
            }
        });
    }
    const denizaltiGecisSuresi = sonuclar && typeof sonuclar.tespitSuresiDenizaltiDk === 'number' && !isNaN(sonuclar.tespitSuresiDenizaltiDk) ? sonuclar.tespitSuresiDenizaltiDk : 0;
    if (denizaltiGecisSuresi > 0 && isFinite(denizaltiGecisSuresi)) zamanNoktalariSource.push(denizaltiGecisSuresi);
    if (helikopterHareketKaydi && helikopterHareketKaydi.length > 0) {
        helikopterHareketKaydi.forEach(seg => {
            zamanNoktalariSource.push(seg.startTimeDk);
            zamanNoktalariSource.push(seg.endTimeDk);
        });
    }
    const originalKeyTimes = [...new Set([0, ...zamanNoktalariSource.filter(t => typeof t === 'number' && !isNaN(t) && isFinite(t))])].sort((a, b) => a - b);
    let allPlotTimes = [...originalKeyTimes];
    const desiredTotalSteps = 75;
    if (originalKeyTimes.length > 0) {
        const maxOperationTime = originalKeyTimes[originalKeyTimes.length - 1];
        if (maxOperationTime > 0) {
            for (let k = 0; k <= desiredTotalSteps; k++) {
                const timePoint = parseFloat(((k / desiredTotalSteps) * maxOperationTime).toFixed(2));
                 if(!allPlotTimes.some(existingTime => Math.abs(existingTime - timePoint) < 0.001)) {
                    allPlotTimes.push(timePoint);
                }
            }
        }
    }
    let uniqueZamanNoktalari = [...new Set(allPlotTimes)].sort((a, b) => a - b);
    if (uniqueZamanNoktalari.length === 0) { uniqueZamanNoktalari.push(0); }

    sonobuoyAtisVerileri.forEach(([sbOrjX, sbOrjY], index) => {
        const sphereMeshData = createSphere(plotSonarYaricap, SPHERE_SEGMENTS_3D, sbOrjX, sbOrjY, -sonobuoyDinlemeDerinligiNm);
        initialData.push({ ...sphereMeshData, visible: false, uid: `sb_sphere_3d_${index}` });
        initialData.push({ type: 'scatter3d', mode: 'markers', x: [sbOrjX], y: [sbOrjY], z: [-sonobuoyDinlemeDerinligiNm], marker: { size: 5, color: '#60a5fa', symbol: 'circle' }, visible: true, showlegend: false, uid: `sonobuoy_marker_3d_${index}` });
        initialData.push({ type: 'scatter3d', mode: 'lines', x: [], y: [], z:[], line: { color: 'rgba(96,165,250,0.5)', width: 2 }, showlegend: false, uid: `sb_track_3d_${index}`});
    });

    if(sonuclar && sonuclar.denizaltiYollariVeTespitDurumu){
        let initialTespitEdilenYolSayaci3D = 0;
        let initialTespitEdilmeyenYolSayaci3D = 0;
         for (let i_path = 0; i_path < sonuclar.denizaltiYollariVeTespitDurumu.length; i_path++) {
            const denizaltiYolVerisi = sonuclar.denizaltiYollariVeTespitDurumu[i_path];
            if (!denizaltiYolVerisi || denizaltiYolVerisi.length < 2) continue;
            const [_yolNoktalari, tespitEdildi] = denizaltiYolVerisi;
            const isEligible = (tespitEdildi && initialTespitEdilenYolSayaci3D < ornekYolSayisi / 2) ||
                                     (!tespitEdildi && initialTespitEdilmeyenYolSayaci3D < ornekYolSayisi / 2);
            if (isEligible) {
                initialData.push({ type: 'scatter3d', mode: 'lines', x: [], y: [], z: [], showlegend: false, uid: `denizalti_path_3d_${i_path}` });
                initialData.push({ type: 'scatter3d', mode: 'markers', x: [], y: [], z:[], showlegend: false, uid: `tespit_point_3d_${i_path}` });
                initialData.push({ type: 'scatter3d', mode: 'markers', x: [], y: [], z: [], hoverinfo: 'skip', showlegend: false, uid: `denizalti_depth_markers_3d_${i_path}`});
                if (tespitEdildi) initialTespitEdilenYolSayaci3D++; else initialTespitEdilmeyenYolSayaci3D++;
                if (initialTespitEdilenYolSayaci3D + initialTespitEdilmeyenYolSayaci3D >= ornekYolSayisi) break;
            }
        }
    }

    uniqueZamanNoktalari.forEach(zaman => {
        const frameData = [sahaTabanTrace];
        if (datumMarkerTrace && datumMarkerTrace.length > 0) {
             frameData.push({...datumMarkerTrace[0], uid: 'datum_marker_viz_3d_frame'});
        }

        let currentHeloX = heloStartX_passed;
        let currentHeloY = heloStartY_passed;
        const heloPathPointsX = [heloStartX_passed];
        const heloPathPointsY = [heloStartY_passed];
        const heloPathPointsZ = [HELO_Z_VIZ];

        if (helikopterHareketKaydi && helikopterHareketKaydi.length > 0) {
           for (const segment of helikopterHareketKaydi) {
                if (heloPathPointsX[heloPathPointsX.length -1] !== segment.startX || heloPathPointsY[heloPathPointsY.length -1] !== segment.startY) {
                    if(!(heloPathPointsX.length === 1 && heloPathPointsX[0] === segment.startX && heloPathPointsY[0] === segment.startY && segment.startTimeDk === 0)){
                        heloPathPointsX.push(segment.startX);
                        heloPathPointsY.push(segment.startY);
                        heloPathPointsZ.push(HELO_Z_VIZ);
                    }
                }
                if (zaman <= segment.startTimeDk) {
                    if(heloPathPointsX.length > 1) { currentHeloX = heloPathPointsX[heloPathPointsX.length -1]; currentHeloY = heloPathPointsY[heloPathPointsY.length -1]; }
                    break;
                }
                if (zaman < segment.endTimeDk) {
                    const segmentSuresi = segment.endTimeDk - segment.startTimeDk;
                    if (segment.type === 'dropping_sonobuoy' || segment.type === 'refueling_at_base' || segmentSuresi < 1e-6) {
                        currentHeloX = segment.endX; currentHeloY = segment.endY;
                    } else {
                        const ratio = (zaman - segment.startTimeDk) / segmentSuresi;
                        currentHeloX = segment.startX + ratio * (segment.endX - segment.startX);
                        currentHeloY = segment.startY + ratio * (segment.endY - segment.startY);
                    }
                    if (segment.type === 'to_drop_point' || segment.type === 'to_base') {
                        heloPathPointsX.push(currentHeloX); heloPathPointsY.push(currentHeloY); heloPathPointsZ.push(HELO_Z_VIZ);
                    } else {
                        heloPathPointsX.push(segment.endX); heloPathPointsY.push(segment.endY); heloPathPointsZ.push(HELO_Z_VIZ);
                        currentHeloX = segment.endX; currentHeloY = segment.endY;
                    }
                    break;
                } else {
                    currentHeloX = segment.endX; currentHeloY = segment.endY;
                    if (heloPathPointsX[heloPathPointsX.length -1] !== currentHeloX || heloPathPointsY[heloPathPointsY.length -1] !== currentHeloY) {
                        heloPathPointsX.push(currentHeloX); heloPathPointsY.push(currentHeloY); heloPathPointsZ.push(HELO_Z_VIZ);
                    }
                }
            }
        }
         if (helikopterHareketKaydi.length > 0 && zaman >= helikopterHareketKaydi[helikopterHareketKaydi.length - 1].endTimeDk) {
            currentHeloX = helikopterHareketKaydi[helikopterHareketKaydi.length - 1].endX;
            currentHeloY = helikopterHareketKaydi[helikopterHareketKaydi.length - 1].endY;
        }

        frameData.push({ type: 'scatter3d', mode: 'lines', uid: 'helo_path_3d', x: heloPathPointsX.length > 0 ? heloPathPointsX : [heloStartX_passed], y: heloPathPointsY.length > 0 ? heloPathPointsY : [heloStartY_passed], z: heloPathPointsZ.length > 0 ? heloPathPointsZ : [HELO_Z_VIZ], line: { color: 'rgba(192, 132, 252, 0.5)', width: 2.5, dash: 'dot' }, showlegend: false });
        frameData.push({ type: 'scatter3d', mode: 'markers', uid: 'helo_marker_3d', x: [currentHeloX], y: [currentHeloY], z: [HELO_Z_VIZ], marker: { symbol: 'diamond', size: 6, color: '#c084fc' }, showlegend: false });

        sonobuoyAtisVerileri.forEach(([sbOrjX, sbOrjY, atisZamaniDk], index) => {
            let g_guncelSbX = sbOrjX, g_guncelSbY = sbOrjY;
            const g_guncelSbZ = -sonobuoyDinlemeDerinligiNm;
            const g_izNoktalariX = [sbOrjX], g_izNoktalariY = [sbOrjY], g_izNoktalariZ = [g_guncelSbZ];
            let g_sphereIsVisible = false, g_sonobuoySahadaMi = true;

            if (zaman >= atisZamaniDk && zaman <= atisZamaniDk + sonobuoyCalismaSuresiDk) {
                g_sphereIsVisible = true;
                if (akintiHiziKnot > 0) {
                    const suruklenmeSuresiAnimDk = Math.min(zaman - atisZamaniDk, sonobuoyCalismaSuresiDk);
                     if (suruklenmeSuresiAnimDk > 0) {
                        const suruklenmeMesafesiAnimNm = akintiHiziKnot * (suruklenmeSuresiAnimDk / 60.0);
                        g_guncelSbX = sbOrjX + suruklenmeMesafesiAnimNm * akintiYonX; g_guncelSbY = sbOrjY + suruklenmeMesafesiAnimNm * akintiYonY;
                    }
                }
                g_sonobuoySahadaMi = (g_guncelSbX >= 0 && g_guncelSbX <= plotSahaUzun && g_guncelSbY >= 0 && g_guncelSbY <= plotSahaGenis);
                g_sphereIsVisible = g_sphereIsVisible && g_sonobuoySahadaMi;
            } else {
                if (akintiHiziKnot > 0 && zaman > atisZamaniDk + sonobuoyCalismaSuresiDk) {
                    const suruklenmeSuresiAnimDk = sonobuoyCalismaSuresiDk;
                    const suruklenmeMesafesiAnimNm = akintiHiziKnot * (suruklenmeSuresiAnimDk / 60.0);
                    g_guncelSbX = sbOrjX + suruklenmeMesafesiAnimNm * akintiYonX; g_guncelSbY = sbOrjY + suruklenmeMesafesiAnimNm * akintiYonY;
                } else if (zaman < atisZamaniDk) { g_guncelSbX = null; g_guncelSbY = null; }
                g_sphereIsVisible = false;
                g_sonobuoySahadaMi = (g_guncelSbX !== null && g_guncelSbX >= 0 && g_guncelSbX <= plotSahaUzun && g_guncelSbY >= 0 && g_guncelSbY <= plotSahaGenis);
            }

            if (akintiHiziKnot > 0 && zaman >= atisZamaniDk && g_guncelSbX !== null) {
                const aktifIzSuresiDk = Math.min(zaman - atisZamaniDk, sonobuoyCalismaSuresiDk);
                if (aktifIzSuresiDk > 0) {
                    const izAdimSayisi = Math.max(2, Math.ceil(aktifIzSuresiDk / 10));
                    for (let k = 1; k <= izAdimSayisi; k++) {
                        const araSureDkTrack = (aktifIzSuresiDk / izAdimSayisi) * k;
                        const araSuruklenmeMesafesiAnimNm = akintiHiziKnot * (araSureDkTrack / 60.0);
                        g_izNoktalariX.push(sbOrjX + araSuruklenmeMesafesiAnimNm * akintiYonX); g_izNoktalariY.push(sbOrjY + araSuruklenmeMesafesiAnimNm * akintiYonY); g_izNoktalariZ.push(g_guncelSbZ);
                    }
                }
            }
            frameData.push({ type: 'scatter3d', mode: 'lines', uid: `sb_track_3d_${index}`,x: g_guncelSbX !== null ? g_izNoktalariX : [], y: g_guncelSbX !== null ? g_izNoktalariY : [], z: g_guncelSbX !== null ? g_izNoktalariZ : [], line: { color: 'rgba(96,165,250,0.5)', width: 2 }, hoverinfo: 'skip', showlegend: false });

            const currentSphereMeshData = createSphere(plotSonarYaricap, SPHERE_SEGMENTS_3D, g_guncelSbX, g_guncelSbY, g_guncelSbZ);
            const sphereColor = g_sphereIsVisible ? 'rgb(74, 222, 128)' : 'rgba(128,128,128,0.1)';
            const sphereOpacity = g_sphereIsVisible ? 0.1 : 0.05;
            frameData.push({ ...currentSphereMeshData, visible: (g_sphereIsVisible && g_guncelSbX !== null), color: sphereColor, opacity: sphereOpacity, uid: `sb_sphere_3d_${index}` });

            const atisZamaniDkFixed3D = (typeof atisZamaniDk === 'number' && !isNaN(atisZamaniDk)) ? atisZamaniDk.toFixed(2) : "N/A";
            const markerColor3D = g_sphereIsVisible ? '#60a5fa' : (g_guncelSbX !== null ? '#718096' : 'rgba(0,0,0,0)');
            const markerSymbol3D = g_sphereIsVisible ? 'circle' : (g_guncelSbX !== null ? 'circle-open' : 'circle');

            if (g_guncelSbX !== null) {
                 frameData.push({ type: 'scatter3d', mode: 'markers', uid: `sonobuoy_marker_3d_${index}`, x: [g_guncelSbX], y: [g_guncelSbY], z: [g_guncelSbZ], marker: { size: 5, color: markerColor3D, symbol: markerSymbol3D }, name: (index === 0 && g_sphereIsVisible) ? 'Sonobuoy Konumları (3D)' : undefined, hoverinfo: 'text', text: `SB ${index + 1}<br>X:${g_guncelSbX.toFixed(2)}, Y:${g_guncelSbY.toFixed(2)}, Z:${g_guncelSbZ.toFixed(2)}<br>Atış:${atisZamaniDkFixed3D} dk<br>Durum: ${g_sphereIsVisible ? 'Aktif & Sahada' : (g_sonobuoySahadaMi ? 'Pasif/Süresi Doldu' : 'Saha Dışında')}`, showlegend: (index === 0 && g_sphereIsVisible), visible: true });
            } else { frameData.push({ type: 'scatter3d', mode: 'markers', x:[], y:[], z:[], uid: `sonobuoy_marker_3d_${index}`, showlegend: false, visible: false }); }
        });

        if(sonuclar && sonuclar.denizaltiYollariVeTespitDurumu){
            let frameTespitEdilenCizildi3D = 0;
            let frameTespitEdilmeyenCizildi3D = 0;
            for (let i_path = 0; i_path < sonuclar.denizaltiYollariVeTespitDurumu.length; i_path++) {
                const denizaltiYolVerisi = sonuclar.denizaltiYollariVeTespitDurumu[i_path];
                 if (!denizaltiYolVerisi || denizaltiYolVerisi.length < 4) {
                    frameData.push({ type: 'scatter3d', mode: 'lines', x: [], y: [], z:[], showlegend: false, uid: `denizalti_path_3d_${i_path}` });
                    frameData.push({ type: 'scatter3d', mode: 'markers', x: [], y: [], z:[], showlegend: false, uid: `tespit_point_3d_${i_path}` });
                    frameData.push({ type: 'scatter3d', mode: 'markers', x: [], y: [], z: [], uid: `denizalti_depth_markers_3d_${i_path}`, showlegend: false});
                    continue;
                }
                const [yolNoktalari, tespitEdildi, tespitNoktasi, mc_baslangicX] = denizaltiYolVerisi;
                const isEligible = (tespitEdildi && frameTespitEdilenCizildi3D < ornekYolSayisi / 2) || (!tespitEdildi && frameTespitEdilmeyenCizildi3D < ornekYolSayisi / 2);

                if (isEligible && yolNoktalari && yolNoktalari.length > 0) {
                    const noktalarSimdikiZaman = yolNoktalari.filter(p => ((denizaltiHizKnot > 0) ? (((p[0] - mc_baslangicX) / denizaltiHizKnot) * 60 <= zaman) : true));
                    const yolX = noktalarSimdikiZaman.map(p => p[0]), yolY = noktalarSimdikiZaman.map(p => p[1]), yolZ = noktalarSimdikiZaman.map(p => -p[2]);
                    const isStaticSub3D = denizaltiHizKnot <= 0;
                    const pathTraceConfig3D = { type: 'scatter3d', uid: `denizalti_path_3d_${i_path}`, x: yolX, y: yolY, z: yolZ, hoverinfo: 'text', showlegend: (tespitEdildi && frameTespitEdilenCizildi3D === 0) || (!tespitEdildi && frameTespitEdilmeyenCizildi3D === 0) };

                    if (isStaticSub3D) {
                        pathTraceConfig3D.mode = 'markers';
                        pathTraceConfig3D.marker = { color: tespitEdildi ? '#ef4444' : '#94a3b8', size: 5, symbol: 'circle' };
                        pathTraceConfig3D.name = (tespitEdildi && frameTespitEdilenCizildi3D === 0) ? 'Tespit Edilen Statik Hedef (3D)' : ((!tespitEdildi && frameTespitEdilmeyenCizildi3D === 0) ? 'Tespit Edilemeyen Statik Hedef (3D)' : undefined);
                        pathTraceConfig3D.text = `Statik Hedef (${tespitEdildi ? 'Tespit Edildi' : 'Tespit Edilemedi'})<br>X: ${yolX[0] ? yolX[0].toFixed(2) : 'N/A'} NM, Y: ${yolY[0] ? yolY[0].toFixed(2) : 'N/A'} NM, Z: ${yolZ[0] ? yolZ[0].toFixed(2) : 'N/A'} NM`;
                    } else {
                        pathTraceConfig3D.mode = 'lines';
                        pathTraceConfig3D.line = { color: tespitEdildi ? '#ef4444' : '#94a3b8', width: tespitEdildi ? 3 : 2, dash: tespitEdildi ? 'solid' : 'dashdot' };
                        pathTraceConfig3D.name = (tespitEdildi && frameTespitEdilenCizildi3D === 0) ? 'Tespit Edilen Denizaltı Yolu (3D)' : ((!tespitEdildi && frameTespitEdilmeyenCizildi3D === 0) ? 'Tespit Edilemeyen Denizaltı Yolu (3D)' : undefined);
                        pathTraceConfig3D.text = tespitEdildi ? 'Tespit Edildi' : 'Tespit Edilemedi';
                    }
                    frameData.push(pathTraceConfig3D);

                    if (yolX.length > 0) {
                        frameData.push({ type: 'scatter3d', mode: 'markers', uid: `denizalti_depth_markers_3d_${i_path}`, x: yolX, y: yolY, z: yolZ, marker: { color: yolZ.map(z_val => z_val), colorscale: 'Blues', reversescale: true, cmin: -finalMaxZ_Plot, cmax: -finalMinZ_Plot, size: isStaticSub3D ? 0 : 3, opacity: isStaticSub3D ? 0 : 0.7 }, hoverinfo: 'skip', showlegend: false });
                    } else { frameData.push({ type: 'scatter3d', mode: 'markers', x: [], y: [], z: [], uid: `denizalti_depth_markers_3d_${i_path}`, showlegend: false}); }

                    if (tespitEdildi && tespitNoktasi && typeof tespitNoktasi[0] === 'number') {
                        let tespitZamaniDk3D = (denizaltiHizKnot > 0) ? (((tespitNoktasi[0] - mc_baslangicX) / denizaltiHizKnot) * 60) : 0;
                        if (denizaltiHizKnot <=0 || tespitZamaniDk3D <= zaman) {
                            frameData.push({ type: 'scatter3d', mode: 'markers', uid: `tespit_point_3d_${i_path}`, x: [tespitNoktasi[0]], y: [tespitNoktasi[1]], z: [-tespitNoktasi[2]], marker: { symbol: 'diamond', size: 8, color: '#ec4899' }, name: (frameTespitEdilenCizildi3D === 0) ? 'Tespit Noktası (3D)' : undefined, showlegend: (frameTespitEdilenCizildi3D === 0), hoverinfo: 'text', text: `Tespit: X=${tespitNoktasi[0].toFixed(2)}, Y=${tespitNoktasi[1].toFixed(2)}, Z=${(-tespitNoktasi[2]).toFixed(2)}<br>Zaman=${denizaltiHizKnot > 0 ? tespitZamaniDk3D.toFixed(2) + ' dk': 'N/A (Sabit Hedef)'}` });
                        } else { frameData.push({ type: 'scatter3d', mode: 'markers', x: [], y: [], z: [], showlegend: false, uid: `tespit_point_3d_${i_path}` }); }
                    } else { frameData.push({ type: 'scatter3d', mode: 'markers', x: [], y: [], z: [], showlegend: false, uid: `tespit_point_3d_${i_path}` }); }
                    if (tespitEdildi) frameTespitEdilenCizildi3D++; else frameTespitEdilmeyenCizildi3D++;
                } else {
                    frameData.push({ type: 'scatter3d', mode: 'lines', x: [], y: [], z:[], showlegend: false, uid: `denizalti_path_3d_${i_path}` });
                    frameData.push({ type: 'scatter3d', mode: 'markers', x: [], y: [], z:[], showlegend: false, uid: `tespit_point_3d_${i_path}` });
                    frameData.push({ type: 'scatter3d', mode: 'markers', x: [], y: [], z: [], uid: `denizalti_depth_markers_3d_${i_path}`, showlegend: false});
                }
                if (frameTespitEdilenCizildi3D + frameTespitEdilmeyenCizildi3D >= ornekYolSayisi) break;
            }
        }

        const tespitOlasilikYuzdeStr3D = (sonuclar && typeof sonuclar.tespitOlasiligiYuzde === 'number') ? sonuclar.tespitOlasiligiYuzde.toFixed(2) : "0.00";
        frames.push({ name: zaman.toFixed(2), data: frameData, layout: { title: `Denizaltı Tespit Simülasyonu (3D)<br>Tespit Olasılığı: %${tespitOlasilikYuzdeStr3D}<br>Zaman: ${zaman.toFixed(2)} dk` } });
        animationTimesteps.push({ label: zaman.toFixed(2) + ' dk', method: 'animate', args: [[zaman.toFixed(2)], { mode: 'immediate', frame: { redraw: true, duration: 500 }, transition: { duration: 0 } }] });
    });


    const layout = {
        title: { text: `Denizaltı Tespit Simülasyonu (3D)<br>Tespit Olasılığı: %${(sonuclar && typeof sonuclar.tespitOlasiligiYuzde === 'number') ? sonuclar.tespitOlasiligiYuzde.toFixed(2) : "0.00"}`, font: { color: '#e0f2fe', size: 16 } },
        font: { color: '#c0c5ce' }, paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)',
        scene: {
            xaxis: { title: 'Uzunluk (X - NM)', range: [0, plotSahaUzun], autorange: false, zeroline: false, gridcolor: 'rgba(255,255,255,0.1)', linecolor: 'rgba(255,255,255,0.2)', titlefont: {color: '#a5d8ff'}, tickfont: {color: '#a8b2d1'}, backgroundcolor: 'rgba(0,0,0,0)', zerolinecolor: 'rgba(255,255,255,0.2)' },
            yaxis: { title: 'Genişlik (Y - NM)', range: [0, plotSahaGenis], autorange: false, zeroline: false, gridcolor: 'rgba(255,255,255,0.1)', linecolor: 'rgba(255,255,255,0.2)', titlefont: {color: '#a5d8ff'}, tickfont: {color: '#a8b2d1'}, backgroundcolor: 'rgba(0,0,0,0)', zerolinecolor: 'rgba(255,255,255,0.2)' },
            zaxis: { title: 'Derinlik (Z - NM, yüzey 0)', range: [finalMinZ_Plot, finalMaxZ_Plot], autorange: false, zeroline: false, gridcolor: 'rgba(255,255,255,0.1)', linecolor: 'rgba(255,255,255,0.2)', titlefont: {color: '#a5d8ff'}, tickfont: {color: '#a8b2d1'}, backgroundcolor: 'rgba(0,0,0,0)', zerolinecolor: 'rgba(255,255,255,0.2)' },
            aspectmode: 'cube', camera: { eye: { x: 1.25, y: 1.25, z: 0.9 } }
        },
        showlegend: true, legend: { font: { color: '#a8b2d1' }, bgcolor: 'rgba(17, 24, 39, 0.7)', bordercolor: 'rgba(56, 189, 248, 0.2)', borderwidth: 1, x: 0.85, y: 0.95, traceorder: 'normal' },
        margin: { t: 80, b: 20, l: 0, r: 0 }, hovermode: 'closest',
        updatemenus: [{ type: 'buttons', showactive: false, x: 0.05, y: 0.95, xanchor: 'left', yanchor: 'top', font: {color: '#0a101f'}, bgcolor: '#67e8f9', bordercolor: '#22d3ee', buttons: [ { label: 'Oynat', method: 'animate', args: [null, { frame: { redraw: true, duration: 500 }, fromcurrent: true, transition: { duration: 0 } }] }, { label: 'Durdur', method: 'animate', args: [[null], { frame: { redraw: false, duration: 0 }, mode: 'immediate' }] } ] }],
        sliders: [{ active: 0, currentvalue: { font: { size: 14, color: '#e0f2fe' }, prefix: 'Zaman: ', visible: true, xanchor: 'right' }, pad: { t: 20, b: 20 }, x:0.05, len:0.9, font: {color: '#e0f2fe'}, bgcolor: 'rgba(12, 74, 110, 0.6)', bordercolor: 'rgba(56, 189, 248, 0.3)', tickcolor: '#a5d8ff', steps: animationTimesteps }]
    };
    Plotly.newPlot('graph', initialData, layout).then(gd => {
        if (frames.length > 0 && gd) {
            Plotly.addFrames('graph', frames);
            if (frames[0] && frames[0].name) {
                Plotly.animate(gd, [frames[0].name], { mode: 'immediate', frame: { redraw: true, duration: 0 } });
            }
        }
    }).catch(err => {
        console.error("Plotly newPlot/animate hatası (3D):", err);
        const graphDiv = document.getElementById('graph');
        if (graphDiv) graphDiv.innerHTML = '<p style="text-align:center; color:red; padding:20px;">3D Grafik oluşturulurken bir hata oluştu. Detaylar için konsolu kontrol edin.</p>';
    });
}