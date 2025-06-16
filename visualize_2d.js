// --- GÖRSELLEŞTİRME: 2D ANİMASYON ---
"use strict";

function gorsellestir2D(
    sahaUzunNm, sahaGenisNm, sonarTespitYaricapiNm, sonuclar,
    ornekYolSayisi, sonobuoyCalismaSuresiDk, denizaltiHizKnot,
    akintiHiziKnot, akintiYonX, akintiYonY, helikopterHareketKaydi,
    heloStartX_passed, heloStartY_passed,
    datumMarkerTrace
) {
    const initialData = [];
    const frames = [];
    const animationTimesteps = [];
    const plotSahaUzun = (typeof sahaUzunNm === 'number' && !isNaN(sahaUzunNm) && sahaUzunNm > 0) ? sahaUzunNm : 10;
    const plotSahaGenis = (typeof sahaGenisNm === 'number' && !isNaN(sahaGenisNm) && sahaGenisNm > 0) ? sahaGenisNm : 10;
    const plotSonarYaricap = (typeof sonarTespitYaricapiNm === 'number' && !isNaN(sonarTespitYaricapiNm) && sonarTespitYaricapiNm > 0) ? sonarTespitYaricapiNm : 1;

    const sahaTrace = {
        type: 'scatter', mode: 'lines', name: 'Operasyon Alanı',
        x: [0, plotSahaUzun, plotSahaUzun, 0, 0],
        y: [0, 0, plotSahaGenis, plotSahaGenis, 0],
        fill: 'toself', fillcolor: 'rgba(173, 216, 230, 0.1)',
        line: { color: 'rgba(173, 216, 230, 0.7)', width: 1.5 },
        hoverinfo: 'name', showlegend: false, uid: 'operation_area_2d'
    };
    initialData.push(sahaTrace);

    if (datumMarkerTrace && datumMarkerTrace.length > 0) {
        initialData.push({...datumMarkerTrace[0], uid: 'datum_marker_viz_2d_init'});
    }

    initialData.push({
        type: 'scatter', mode: 'markers',
        x: [heloStartX_passed], y: [heloStartY_passed],
        marker: { symbol: 'triangle-up', size: 10, color: '#c084fc', line: {width:1, color:'#e0f2fe'} },
        name: 'Helikopter Üssü', uid: 'helo_marker_2d',
        showlegend: true
    });
    initialData.push({
        type: 'scatter', mode: 'lines',
        x: [heloStartX_passed], y: [heloStartY_passed],
        line: { color: 'rgba(192, 132, 252, 0.6)', width: 1.5, dash: 'dot' },
        name: 'Helikopter Rotası', uid: 'helo_path_2d',
        showlegend: true
    });

    const sonobuoyAtisVerileri = sonuclar && sonuclar.sonobuoyKonumlariVeSirasi ? sonuclar.sonobuoyKonumlariVeSirasi : [];
    const zamanNoktalariSource = [];
    if(sonobuoyAtisVerileri.length > 0){
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
    const desiredTotalSteps = 75; // Animasyon akıcılığı için ara adım sayısı
    if (originalKeyTimes.length > 0) {
        const maxOperationTime = originalKeyTimes[originalKeyTimes.length - 1];
        if (maxOperationTime > 0) {
            for (let k = 0; k <= desiredTotalSteps; k++) {
                const timePoint = parseFloat(((k / desiredTotalSteps) * maxOperationTime).toFixed(2));
                if(!allPlotTimes.some(existingTime => Math.abs(existingTime - timePoint) < 0.001)) { // Çok yakın zamanları ekleme
                    allPlotTimes.push(timePoint);
                }
            }
        }
    }
    let uniqueZamanNoktalari = [...new Set(allPlotTimes)].sort((a, b) => a - b);
    if (uniqueZamanNoktalari.length === 0) { uniqueZamanNoktalari.push(0); }

    sonobuoyAtisVerileri.forEach((_, index) => {
        initialData.push({ type: 'scatter', mode: 'lines', x: [], y: [], fill: 'toself', fillcolor: 'rgba(74,222,128,0.0)', line: {color:'rgba(0,0,0,0)'}, showlegend: false, uid: `sb_circle_2d_${index}` });
        initialData.push({ type: 'scatter', mode: 'markers', x: [], y: [], marker: { size: 10, color: '#60a5fa', symbol: 'circle' }, showlegend: false, uid: `sonobuoy_marker_2d_${index}` });
        initialData.push({ type: 'scatter', mode: 'lines', x: [], y: [], line: { color: 'rgba(96,165,250,0.6)', width: 1.5, dash: 'solid' }, showlegend: false, uid: `sb_track_2d_${index}`});
    });

    if(sonuclar && sonuclar.denizaltiYollariVeTespitDurumu){
        let initialTespitEdilenYolSayaci = 0;
        let initialTespitEdilmeyenYolSayaci = 0;
        for (let i = 0; i < sonuclar.denizaltiYollariVeTespitDurumu.length; i++) {
            const denizaltiYolVerisi = sonuclar.denizaltiYollariVeTespitDurumu[i];
            if (!denizaltiYolVerisi || denizaltiYolVerisi.length < 2) continue;
            const [_yolNoktalari, tespitEdildi] = denizaltiYolVerisi;
            const isEligible = (tespitEdildi && initialTespitEdilenYolSayaci < ornekYolSayisi / 2) ||
                                     (!tespitEdildi && initialTespitEdilmeyenYolSayaci < ornekYolSayisi / 2);
            if (isEligible) {
                initialData.push({ type: 'scatter', mode: 'lines', x: [], y: [], showlegend: false, uid: `denizalti_path_2d_${i}` });
                initialData.push({ type: 'scatter', mode: 'markers', x: [], y: [], showlegend: false, uid: `tespit_point_2d_${i}` });
                if (tespitEdildi) initialTespitEdilenYolSayaci++; else initialTespitEdilmeyenYolSayaci++;
                if (initialTespitEdilenYolSayaci + initialTespitEdilmeyenYolSayaci >= ornekYolSayisi) break;
            }
        }
    }
    uniqueZamanNoktalari.forEach(zaman => {
        const frameData = [sahaTrace];
        if (datumMarkerTrace && datumMarkerTrace.length > 0) {
             frameData.push({...datumMarkerTrace[0], uid: 'datum_marker_viz_2d_frame'});
        }

        let currentHeloX = heloStartX_passed;
        let currentHeloY = heloStartY_passed;
        const heloPathPointsX = [heloStartX_passed];
        const heloPathPointsY = [heloStartY_passed];

        if (helikopterHareketKaydi && helikopterHareketKaydi.length > 0) {
            for (const segment of helikopterHareketKaydi) {
                if (heloPathPointsX[heloPathPointsX.length -1] !== segment.startX || heloPathPointsY[heloPathPointsY.length -1] !== segment.startY) {
                    if(!(heloPathPointsX.length === 1 && heloPathPointsX[0] === segment.startX && heloPathPointsY[0] === segment.startY && segment.startTimeDk === 0)){
                        heloPathPointsX.push(segment.startX);
                        heloPathPointsY.push(segment.startY);
                    }
                }

                if (zaman <= segment.startTimeDk) {
                    if(heloPathPointsX.length > 1) {
                        currentHeloX = heloPathPointsX[heloPathPointsX.length -1];
                        currentHeloY = heloPathPointsY[heloPathPointsY.length -1];
                    }
                    break;
                }
                if (zaman < segment.endTimeDk) {
                    const segmentSuresi = segment.endTimeDk - segment.startTimeDk;
                    if (segment.type === 'dropping_sonobuoy' || segment.type === 'refueling_at_base' || segmentSuresi < 1e-6) {
                        currentHeloX = segment.endX;
                        currentHeloY = segment.endY;
                    } else {
                        const ratio = (zaman - segment.startTimeDk) / segmentSuresi;
                        currentHeloX = segment.startX + ratio * (segment.endX - segment.startX);
                        currentHeloY = segment.startY + ratio * (segment.endY - segment.startY);
                    }
                    heloPathPointsX.push(currentHeloX);
                    heloPathPointsY.push(currentHeloY);
                    break;
                } else {
                    currentHeloX = segment.endX;
                    currentHeloY = segment.endY;
                    if (heloPathPointsX[heloPathPointsX.length -1] !== currentHeloX || heloPathPointsY[heloPathPointsY.length -1] !== currentHeloY) {
                        heloPathPointsX.push(currentHeloX);
                        heloPathPointsY.push(currentHeloY);
                    }
                }
            }
        }
        if (helikopterHareketKaydi.length > 0 && zaman >= helikopterHareketKaydi[helikopterHareketKaydi.length - 1].endTimeDk) {
            currentHeloX = helikopterHareketKaydi[helikopterHareketKaydi.length - 1].endX;
            currentHeloY = helikopterHareketKaydi[helikopterHareketKaydi.length - 1].endY;
        }

        frameData.push({ type: 'scatter', mode: 'lines', uid: 'helo_path_2d',
            x: heloPathPointsX, y: heloPathPointsY,
            line: { color: 'rgba(192, 132, 252, 0.6)', width: 1.5, dash: 'dot' },
            showlegend: false
        });
        frameData.push({ type: 'scatter', mode: 'markers', uid: 'helo_marker_2d', x: [currentHeloX], y: [currentHeloY],
            marker: { symbol: 'triangle-up', size: 10, color: '#c084fc', line: {width:1, color:'#e0f2fe'} },
            showlegend: false
        });

        sonobuoyAtisVerileri.forEach(([sbOrjX, sbOrjY, atisZamaniDk], index) => {
            let g_guncelSbX = sbOrjX;
            let g_guncelSbY = sbOrjY;
            const g_izNoktalariX = [sbOrjX];
            const g_izNoktalariY = [sbOrjY];
            let g_sonobuoyBuAnimKaresindeAktif = false;
            let g_sonobuoySahadaMi = true;

            if (zaman >= atisZamaniDk && zaman <= atisZamaniDk + sonobuoyCalismaSuresiDk) {
                g_sonobuoyBuAnimKaresindeAktif = true;
                if (akintiHiziKnot > 0) {
                    const suruklenmeSuresiAnimDk = Math.min(zaman - atisZamaniDk, sonobuoyCalismaSuresiDk);
                     if (suruklenmeSuresiAnimDk > 0) {
                        const suruklenmeMesafesiAnimNm = akintiHiziKnot * (suruklenmeSuresiAnimDk / 60.0);
                        g_guncelSbX = sbOrjX + suruklenmeMesafesiAnimNm * akintiYonX;
                        g_guncelSbY = sbOrjY + suruklenmeMesafesiAnimNm * akintiYonY;
                    }
                }
                g_sonobuoySahadaMi = (g_guncelSbX >= 0 && g_guncelSbX <= plotSahaUzun && g_guncelSbY >= 0 && g_guncelSbY <= plotSahaGenis);
            } else {
                 if (akintiHiziKnot > 0 && zaman > atisZamaniDk + sonobuoyCalismaSuresiDk) {
                    const suruklenmeSuresiAnimDk = sonobuoyCalismaSuresiDk;
                    const suruklenmeMesafesiAnimNm = akintiHiziKnot * (suruklenmeSuresiAnimDk / 60.0);
                    g_guncelSbX = sbOrjX + suruklenmeMesafesiAnimNm * akintiYonX;
                    g_guncelSbY = sbOrjY + suruklenmeMesafesiAnimNm * akintiYonY;
                } else if (zaman < atisZamaniDk) {
                    g_guncelSbX = null;
                    g_guncelSbY = null;
                }
                g_sonobuoySahadaMi = (g_guncelSbX !== null && g_guncelSbX >= 0 && g_guncelSbX <= plotSahaUzun && g_guncelSbY >= 0 && g_guncelSbY <= plotSahaGenis);
            }
            if (akintiHiziKnot > 0 && zaman >= atisZamaniDk && g_guncelSbX !== null) {
                const aktifIzSuresiDk = Math.min(zaman - atisZamaniDk, sonobuoyCalismaSuresiDk);
                if (aktifIzSuresiDk > 0) {
                    const izAdimSayisi = Math.max(2, Math.ceil(aktifIzSuresiDk / 10));
                    for (let k = 1; k <= izAdimSayisi; k++) {
                        const araSureDkTrack = (aktifIzSuresiDk / izAdimSayisi) * k;
                        const araSuruklenmeMesafesiAnimNm = akintiHiziKnot * (araSureDkTrack / 60.0);
                        g_izNoktalariX.push(sbOrjX + araSuruklenmeMesafesiAnimNm * akintiYonX);
                        g_izNoktalariY.push(sbOrjY + araSuruklenmeMesafesiAnimNm * akintiYonY);
                    }
                }
            }
            frameData.push({ type: 'scatter', mode: 'lines', uid: `sb_track_2d_${index}`, x: g_guncelSbX !== null ? g_izNoktalariX : [], y: g_guncelSbX !== null ? g_izNoktalariY : [], line: { color: 'rgba(96,165,250,0.6)', width: 1.5, dash: 'solid' }, hoverinfo: 'skip', showlegend: false });

            const sonobuoyAktifVeSahada = g_sonobuoyBuAnimKaresindeAktif && g_sonobuoySahadaMi;

            if (sonobuoyAktifVeSahada && g_guncelSbX !== null) {
                frameData.push({ type: 'scatter', mode: 'lines', uid: `sb_circle_2d_${index}`, x: Array.from({ length: CIRCLE_SEGMENTS_2D + 1 }, (_, k_seg) => g_guncelSbX + plotSonarYaricap * Math.cos(2 * Math.PI * k_seg / CIRCLE_SEGMENTS_2D)), y: Array.from({ length: CIRCLE_SEGMENTS_2D + 1 }, (_, k_seg) => g_guncelSbY + plotSonarYaricap * Math.sin(2 * Math.PI * k_seg / CIRCLE_SEGMENTS_2D)), fill: 'toself', fillcolor: 'rgba(74, 222, 128, 0.15)', line: { color: 'rgba(74, 222, 128, 0.4)', width: 1 }, hoverinfo: 'skip', showlegend: false });
            } else {
                frameData.push({ type: 'scatter', mode: 'lines', x: [], y: [], uid: `sb_circle_2d_${index}`, fill: 'toself', fillcolor: 'rgba(74,222,128,0.0)', line: {color:'rgba(0,0,0,0)'}, showlegend: false });
            }
            const atisZamaniDkFixed = (typeof atisZamaniDk === 'number' && !isNaN(atisZamaniDk)) ? atisZamaniDk.toFixed(2) : "N/A";
            const markerColor = sonobuoyAktifVeSahada ? '#60a5fa' : (g_guncelSbX !== null ? '#718096' : 'rgba(0,0,0,0)');
            const markerSymbol = sonobuoyAktifVeSahada ? 'circle' : (g_guncelSbX !== null ? 'circle-open' : 'circle');

            if (g_guncelSbX !== null) {
                frameData.push({ type: 'scatter', mode: 'markers', uid: `sonobuoy_marker_2d_${index}`, x: [g_guncelSbX], y: [g_guncelSbY], marker: { size: 10, color: markerColor, symbol: markerSymbol }, name: (index === 0) ? 'Sonobuoy Konumları' : undefined, hoverinfo: 'text', text: `Sonobuoy ${index + 1}<br>X: ${g_guncelSbX.toFixed(2)} NM<br>Y: ${g_guncelSbY.toFixed(2)} NM<br>Atış: ${atisZamaniDkFixed} dk<br>Durum: ${sonobuoyAktifVeSahada ? 'Aktif & Sahada' : (g_sonobuoySahadaMi ? 'Pasif/Süresi Doldu' : 'Saha Dışında')}`, showlegend: (index === 0) });
            } else {
                 frameData.push({ type: 'scatter', mode: 'markers', x: [], y: [], uid: `sonobuoy_marker_2d_${index}`, showlegend: false});
            }
        });
        if(sonuclar && sonuclar.denizaltiYollariVeTespitDurumu){
            let frameTespitEdilenCizildi = 0;
            let frameTespitEdilmeyenCizildi = 0;
            for (let i_path = 0; i_path < sonuclar.denizaltiYollariVeTespitDurumu.length; i_path++) {
                const denizaltiYolVerisi = sonuclar.denizaltiYollariVeTespitDurumu[i_path];
                if (!denizaltiYolVerisi || denizaltiYolVerisi.length < 4) {
                    frameData.push({ type: 'scatter', mode: 'lines', x: [], y: [], showlegend: false, uid: `denizalti_path_2d_${i_path}` });
                    frameData.push({ type: 'scatter', mode: 'markers', x: [], y: [], showlegend: false, uid: `tespit_point_2d_${i_path}` });
                    continue;
                }
                const [yolNoktalari, tespitEdildi, tespitNoktasi, mc_baslangicX] = denizaltiYolVerisi;
                const isEligible = (tespitEdildi && frameTespitEdilenCizildi < ornekYolSayisi / 2) ||
                                         (!tespitEdildi && frameTespitEdilmeyenCizildi < ornekYolSayisi / 2);

                if (isEligible && yolNoktalari && yolNoktalari.length > 0) {
                    const noktalarSimdikiZaman = yolNoktalari.filter(p => {
                        if (!p || typeof p[0] !== 'number' || typeof mc_baslangicX !== 'number') return false;
                        if (denizaltiHizKnot > 0) {
                            return ((p[0] - mc_baslangicX) / denizaltiHizKnot) * 60 <= zaman;
                        }
                        return true;
                    });
                    const yolX = noktalarSimdikiZaman.map(p => p[0]);
                    const yolY = noktalarSimdikiZaman.map(p => p[1]);
                    const isStaticSub = denizaltiHizKnot <= 0;
                    const pathTraceConfig2D = { type: 'scatter', uid: `denizalti_path_2d_${i_path}`, x: yolX, y: yolY, hoverinfo: 'text', showlegend: (tespitEdildi && frameTespitEdilenCizildi === 0) || (!tespitEdildi && frameTespitEdilmeyenCizildi === 0) };

                    if (isStaticSub) {
                        pathTraceConfig2D.mode = 'markers';
                        pathTraceConfig2D.marker = { color: tespitEdildi ? '#ef4444' : '#94a3b8', size: 7, symbol: 'circle' };
                        pathTraceConfig2D.name = (tespitEdildi && frameTespitEdilenCizildi === 0) ? 'Tespit Edilen Statik Hedef' : ((!tespitEdildi && frameTespitEdilmeyenCizildi === 0) ? 'Tespit Edilemeyen Statik Hedef' : undefined);
                        pathTraceConfig2D.text = `Statik Hedef (${tespitEdildi ? 'Tespit Edildi' : 'Tespit Edilemedi'})<br>X: ${yolX[0] ? yolX[0].toFixed(2) : 'N/A'} NM, Y: ${yolY[0] ? yolY[0].toFixed(2) : 'N/A'} NM`;
                    } else {
                        pathTraceConfig2D.mode = 'lines';
                        pathTraceConfig2D.line = { color: tespitEdildi ? '#ef4444' : '#94a3b8', width: tespitEdildi ? 2.5 : 1.5, dash: tespitEdildi ? 'solid' : 'dashdot' };
                        pathTraceConfig2D.name = (tespitEdildi && frameTespitEdilenCizildi === 0) ? 'Tespit Edilen Denizaltı Yolu' : ((!tespitEdildi && frameTespitEdilmeyenCizildi === 0) ? 'Tespit Edilemeyen Denizaltı Yolu' : undefined);
                        pathTraceConfig2D.text = tespitEdildi ? 'Tespit Edildi' : 'Tespit Edilemedi';
                    }
                    frameData.push(pathTraceConfig2D);

                    if (tespitEdildi && tespitNoktasi && typeof tespitNoktasi[0] === 'number') {
                        let tespitZamaniDk = (denizaltiHizKnot > 0) ? ((tespitNoktasi[0] - mc_baslangicX) / denizaltiHizKnot) * 60 : 0;
                        if (denizaltiHizKnot <=0 || tespitZamaniDk <= zaman) {
                            frameData.push({ type: 'scatter', mode: 'markers', uid: `tespit_point_2d_${i_path}`, x: [tespitNoktasi[0]], y: [tespitNoktasi[1]], marker: { symbol: 'star', size: 12, color: '#ec4899' }, name: (frameTespitEdilenCizildi === 0) ? 'Tespit Noktası' : undefined, showlegend: (frameTespitEdilenCizildi === 0), hoverinfo: 'text', text: `Tespit: X=${tespitNoktasi[0].toFixed(2)}, Y=${tespitNoktasi[1].toFixed(2)}<br>Zaman=${denizaltiHizKnot > 0 ? tespitZamaniDk.toFixed(2) + ' dk' : 'N/A (Sabit Hedef)'}` });
                        } else { frameData.push({ type: 'scatter', mode: 'markers', x: [], y: [], showlegend: false, uid: `tespit_point_2d_${i_path}` }); }
                    } else { frameData.push({ type: 'scatter', mode: 'markers', x: [], y: [], showlegend: false, uid: `tespit_point_2d_${i_path}` }); }
                    if (tespitEdildi) frameTespitEdilenCizildi++; else frameTespitEdilmeyenCizildi++;
                } else {
                    frameData.push({ type: 'scatter', mode: 'lines', x: [], y: [], showlegend: false, uid: `denizalti_path_2d_${i_path}` });
                    frameData.push({ type: 'scatter', mode: 'markers', x: [], y: [], showlegend: false, uid: `tespit_point_2d_${i_path}`});
                }
                if (frameTespitEdilenCizildi + frameTespitEdilmeyenCizildi >= ornekYolSayisi) break;
            }
        }

        const tespitOlasilikYuzdeStr = (sonuclar && typeof sonuclar.tespitOlasiligiYuzde === 'number') ? sonuclar.tespitOlasiligiYuzde.toFixed(2) : "0.00";
        frames.push({ name: zaman.toFixed(2), data: frameData, layout: { title: `Denizaltı Tespit Simülasyonu (2D)<br>Tespit Olasılığı: %${tespitOlasilikYuzdeStr}<br>Zaman: ${zaman.toFixed(2)} dk` } });
        animationTimesteps.push({ label: zaman.toFixed(2) + ' dk', method: 'animate', args: [[zaman.toFixed(2)], { mode: 'immediate', frame: { redraw: true, duration: 500 }, transition: { duration: 0 } }] });
    });

    const tespitOlasilikYuzdeStrLayout = (sonuclar && typeof sonuclar.tespitOlasiligiYuzde === 'number') ? sonuclar.tespitOlasiligiYuzde.toFixed(2) : "0.00";
    const layout = {
        title: { text: `Denizaltı Tespit Simülasyonu (2D)<br>Tespit Olasılığı: %${tespitOlasilikYuzdeStrLayout}`, font: { color: '#e0f2fe', size: 16 } },
        font: { color: '#c0c5ce' }, paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)',
        xaxis: { title: 'Uzunluk (Deniz Mili)', range: [0, plotSahaUzun], constrain: 'domain', gridcolor: 'rgba(255, 255, 255, 0.1)', linecolor: 'rgba(255, 255, 255, 0.2)', zerolinecolor: 'rgba(255, 255, 255, 0.2)', titlefont: { color: '#a5d8ff' }, tickfont: { color: '#a8b2d1' } },
        yaxis: { title: 'Genişlik (Deniz Mili)', range: [0, plotSahaGenis], scaleanchor: "x", scaleratio: 1, gridcolor: 'rgba(255, 255, 255, 0.1)', linecolor: 'rgba(255, 255, 255, 0.2)', zerolinecolor: 'rgba(255, 255, 255, 0.2)', titlefont: { color: '#a5d8ff' }, tickfont: { color: '#a8b2d1' } },
        showlegend: true, legend: { font: { color: '#a8b2d1' }, bgcolor: 'rgba(17, 24, 39, 0.7)', bordercolor: 'rgba(56, 189, 248, 0.2)', borderwidth: 1, x: 1.02, xanchor: 'left', y: 1, traceorder: 'normal' },
        margin: { t: 80, b: 50, l: 50, r: 50 }, hovermode: 'closest',
        updatemenus: [{ type: 'buttons', showactive: false, x: 0, y: 1.15, xanchor: 'left', yanchor: 'top', font: {color: '#0a101f'}, bgcolor: '#67e8f9', bordercolor: '#22d3ee', buttons: [ { label: 'Oynat', method: 'animate', args: [null, { frame: { redraw: true, duration: 500 }, fromcurrent: true, transition: { duration: 0 } }] }, { label: 'Durdur', method: 'animate', args: [[null], { frame: { redraw: false, duration: 0 }, mode: 'immediate' }] } ] }],
        sliders: [{ active: 0, currentvalue: { font: { size: 14, color: '#e0f2fe' }, prefix: 'Zaman: ', visible: true, xanchor: 'right' }, pad: { t: 60, b: 10 }, font: {color: '#e0f2fe'}, bgcolor: 'rgba(12, 74, 110, 0.6)', bordercolor: 'rgba(56, 189, 248, 0.3)', tickcolor: '#a5d8ff', steps: animationTimesteps }]
    };
    Plotly.newPlot('graph', initialData, layout).then(gd => {
        if (frames.length > 0 && gd) {
            Plotly.addFrames('graph', frames);
            if (frames[0] && frames[0].name) {
                Plotly.animate(gd, [frames[0].name], { mode: 'immediate', frame: { redraw: true, duration: 0 } });
            }
        }
    }).catch(err => {
        console.error("Plotly newPlot/animate hatası (2D):", err);
        const graphDiv = document.getElementById('graph');
        if (graphDiv) graphDiv.innerHTML = '<p style="text-align:center; color:red; padding:20px;">2D Grafik oluşturulurken bir hata oluştu. Detaylar için konsolu kontrol edin.</p>';
    });
}