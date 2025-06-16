// --- ANA SİMÜLASYON KONTROLCÜSÜ ---
"use strict";

function hesaplaTespitOlasiligiVeMaliyetJS(
    sahaUzunNm, sahaGenisNm, sonarTespitYaricapiNm, atilicakSonobuoySayisi_param,
    yerlesimPaterni,
    helikopterHizKnot, helikopterStartXNm, helikopterStartYNm, helikopterSonobuoyBirakmaSuresiDk,
    denizaltiHizKnot, sonobuoyCalismaSuresiDk, sonobuoyDinlemeDerinligiM,
    denizaltiOrtDerinlikM, denizaltiDerinlikSapmaM, denizaltiRotaSapmaYuzdesi,
    sonarTespitBasariOrani, simulasyonDenizaltiYolSayisi, kullaniciSeciliYolKontrolNoktasiSayisi,
    akintiHiziKnot, akintiYonuDerece,
    helikopterTasimaKapasitesi, sonobuoyIkmalSuresiDk,
    rotaOptimizasyonuEtkin,
    isDatumKnown, datumX_user, datumY_user,
    costHeloHour, costSonobuoy,
    progressCallback = null,
    isCalledFromSA = false
) {
    // --- GİRDİ DOĞRULAMA ---
    if (typeof sahaUzunNm !== 'number' || isNaN(sahaUzunNm) || sahaUzunNm <= 0 ||
        typeof sahaGenisNm !== 'number' || isNaN(sahaGenisNm) || sahaGenisNm <= 0) {
        throw new Error("Saha boyutları (uzunluk, genişlik) geçerli pozitif sayılar olmalıdır.");
    }
    if (helikopterHizKnot <= 0) throw new Error("Helikopter hızı 0 veya negatif olamaz.");
    if (denizaltiHizKnot < 0 || (denizaltiHizKnot === 0 && !isDatumKnown && !isCalledFromSA) ) {
         throw new Error("Denizaltı hızı negatif olamaz. Hız 0 ise 'Datum Bilgisi Mevcut mu?' işaretli olmalıdır.");
    }
    if (isDatumKnown) {
        if (typeof datumX_user !== 'number' || isNaN(datumX_user) || datumX_user < 0 || datumX_user > sahaUzunNm) {
            throw new Error(`Datum X koordinatı (${datumX_user}) saha sınırları (0-${sahaUzunNm} NM) içinde olmalıdır.`);
        }
        if (typeof datumY_user !== 'number' || isNaN(datumY_user) || datumY_user < 0 || datumY_user > sahaGenisNm) {
            throw new Error(`Datum Y koordinatı (${datumY_user}) saha sınırları (0-${sahaGenisNm} NM) içinde olmalıdır.`);
        }
    }

    // --- BAŞLANGIÇ DEĞERLERİ ---
    const denizaltiOrtalamaTamSahaGecisSuresiDk = (denizaltiHizKnot > 0 && sahaUzunNm > 0) ? (sahaUzunNm / denizaltiHizKnot) * 60 : Infinity;
    const helikopterHareketKaydi = [];
    let helikopterOperasyonSuresiUnoptimizedDk = 0;
    let kazanilanSureDk = 0;
    let gridPatternNote = null;
    let current_atilicakSonobuoySayisi = atilicakSonobuoySayisi_param;
    const sonobuoyDinlemeDerinligiNm = sonobuoyDinlemeDerinligiM / METERS_PER_NAUTICAL_MILE;

    const returnEmptyResult = () => ({
        tespitOlasiligiYuzde: 0, sonobuoyKonumlariVeSirasi: [], tespitSuresiDenizaltiDk: parseFloat(denizaltiOrtalamaTamSahaGecisSuresiDk.toFixed(2)),
        helikopterOperasyonSuresiDk: 0, helikopterOperasyonSuresiUnoptimizedDk: 0, kazanilanSureDk: 0,
        denizaltiYollariVeTespitDurumu: [], fiiliBirakilanSonobuoySayisi: 0, helikopterHareketKaydi: helikopterHareketKaydi.length > 0 ? helikopterHareketKaydi : [{startX: helikopterStartXNm, startY: helikopterStartYNm, endX: helikopterStartXNm, endY: helikopterStartYNm, startTimeDk: 0, endTimeDk: 0, type: 'idle_at_base'}],
        gridPatternPlacementNote: gridPatternNote, isDatumKnown: isDatumKnown, varyans_p_sapka_oran: 0, ci_alt_yuzde: 0, ci_ust_yuzde: 0,
        toplamMaliyet: 0, tespitBasinaMaliyet: 0, ortalamaTespitZamaniDk: 0, optimizasyonMaliyetKazanci: 0,
        dikeyAyrilmaMesafeleri: [], unoptimizedRoute: [] // YENİ: Boş sonuçlar için eklendi
    });

    if (current_atilicakSonobuoySayisi <= 0) {
        return returnEmptyResult();
    }

    // --- SONOBUOY YERLEŞİM PATERNİ ---
    let hamDropKonumlari = [];
    switch (yerlesimPaterni) {
        case 'barrier_vertical_middle':
            hamDropKonumlari = generateVerticalBarrierMiddlePatternDropLocations(sahaUzunNm, sahaGenisNm, current_atilicakSonobuoySayisi);
            break;
        case 'random':
            hamDropKonumlari = generateRandomPatternDropLocations(sahaUzunNm, sahaGenisNm, current_atilicakSonobuoySayisi);
            break;
        case 'circular':
            const datumXForPattern = isDatumKnown ? datumX_user : sahaUzunNm / 2;
            const datumYForPattern = isDatumKnown ? datumY_user : sahaGenisNm / 2;
            hamDropKonumlari = generateCircularPatternDropLocations(datumXForPattern, datumYForPattern, sonarTespitYaricapiNm, current_atilicakSonobuoySayisi, sahaUzunNm, sahaGenisNm);
            break;
        case 'grid':
        default:
            const gridResult = generateGridPatternDropLocations(sahaUzunNm, sahaGenisNm, current_atilicakSonobuoySayisi);
            hamDropKonumlari = gridResult.drops;
            gridPatternNote = gridResult.note;
            current_atilicakSonobuoySayisi = hamDropKonumlari.length;
            break;
    }

    if (hamDropKonumlari.length === 0) {
        return returnEmptyResult();
    }
    
    // --- HELİKOPTER OPERASYONU VE ROTA HESAPLAMA ---
    helikopterOperasyonSuresiUnoptimizedDk = calculateHelicopterPathDuration(hamDropKonumlari, helikopterStartXNm, helikopterStartYNm, helikopterHizKnot, helikopterSonobuoyBirakmaSuresiDk, helikopterTasimaKapasitesi, sonobuoyIkmalSuresiDk);
    
    let planlananDropKonumlari = rotaOptimizasyonuEtkin ? optimizeDropOrderWithSorties(hamDropKonumlari, helikopterStartXNm, helikopterStartYNm, helikopterTasimaKapasitesi) : hamDropKonumlari;

    const fiiliSonobuoyKonumlariVeAtisZamani = [];
    let anlikToplamHelikopterOperasyonSuresiDk = 0;
    let helikopterAnlikKonumX = helikopterStartXNm;
    let helikopterAnlikKonumY = helikopterStartYNm;
    let birakilanToplamSonobuoyAdedi = 0;

    helikopterHareketKaydi.push({ startX: helikopterAnlikKonumX, startY: helikopterAnlikKonumY, endX: helikopterAnlikKonumX, endY: helikopterAnlikKonumY, startTimeDk: 0, endTimeDk: 0, type: 'start_at_base' });
    
    if (planlananDropKonumlari.length > 0) {
        while (birakilanToplamSonobuoyAdedi < current_atilicakSonobuoySayisi) {
            const numToDropThisSortie = Math.min(current_atilicakSonobuoySayisi - birakilanToplamSonobuoyAdedi, helikopterTasimaKapasitesi);
            for (let i = 0; i < numToDropThisSortie; i++) {
                const hedefDropBilgisi = planlananDropKonumlari[birakilanToplamSonobuoyAdedi];
                const hedefX = hedefDropBilgisi.x;
                const hedefY = hedefDropBilgisi.y;

                const segmentBaslangicZamani_toDrop = anlikToplamHelikopterOperasyonSuresiDk;
                const mesafeToHedef = Math.sqrt(calculateDistanceSquared({x: helikopterAnlikKonumX, y: helikopterAnlikKonumY}, {x: hedefX, y: hedefY}));
                const sureToHedefDk = (mesafeToHedef / helikopterHizKnot) * 60;
                helikopterHareketKaydi.push({ startX: helikopterAnlikKonumX, startY: helikopterAnlikKonumY, endX: hedefX, endY: hedefY, startTimeDk: segmentBaslangicZamani_toDrop, endTimeDk: segmentBaslangicZamani_toDrop + sureToHedefDk, type: 'to_drop_point' });
                
                anlikToplamHelikopterOperasyonSuresiDk += sureToHedefDk;
                helikopterAnlikKonumX = hedefX; helikopterAnlikKonumY = hedefY;
                
                const buSonobuoyunAtisZamaniDk = anlikToplamHelikopterOperasyonSuresiDk;
                fiiliSonobuoyKonumlariVeAtisZamani.push([hedefX, hedefY, parseFloat(buSonobuoyunAtisZamaniDk.toFixed(2))]);
                
                const hoverBaslangicZamani = anlikToplamHelikopterOperasyonSuresiDk;
                anlikToplamHelikopterOperasyonSuresiDk += helikopterSonobuoyBirakmaSuresiDk;
                helikopterHareketKaydi.push({ startX: helikopterAnlikKonumX, startY: helikopterAnlikKonumY, endX: helikopterAnlikKonumX, endY: helikopterAnlikKonumY, startTimeDk: hoverBaslangicZamani, endTimeDk: anlikToplamHelikopterOperasyonSuresiDk, type: 'dropping_sonobuoy' });
                
                birakilanToplamSonobuoyAdedi++;
            }

            if (birakilanToplamSonobuoyAdedi < current_atilicakSonobuoySayisi) {
                const segmentBaslangicZamani_toBase = anlikToplamHelikopterOperasyonSuresiDk;
                const mesafeToBase = Math.sqrt(calculateDistanceSquared({x: helikopterAnlikKonumX, y: helikopterAnlikKonumY}, {x: helikopterStartXNm, y: helikopterStartYNm}));
                const sureToBaseDk = (mesafeToBase / helikopterHizKnot) * 60;
                helikopterHareketKaydi.push({ startX: helikopterAnlikKonumX, startY: helikopterAnlikKonumY, endX: helikopterStartXNm, endY: helikopterStartYNm, startTimeDk: segmentBaslangicZamani_toBase, endTimeDk: segmentBaslangicZamani_toBase + sureToBaseDk, type: 'to_base' });
                anlikToplamHelikopterOperasyonSuresiDk += sureToBaseDk;
                helikopterAnlikKonumX = helikopterStartXNm; helikopterAnlikKonumY = helikopterStartYNm;
                
                const ikmalBaslangicZamani = anlikToplamHelikopterOperasyonSuresiDk;
                anlikToplamHelikopterOperasyonSuresiDk += sonobuoyIkmalSuresiDk;
                helikopterHareketKaydi.push({ startX: helikopterAnlikKonumX, startY: helikopterAnlikKonumY, endX: helikopterAnlikKonumX, endY: helikopterAnlikKonumY, startTimeDk: ikmalBaslangicZamani, endTimeDk: anlikToplamHelikopterOperasyonSuresiDk, type: 'refueling_at_base' });
            }
        }
    }

    // --- AKINTI VE MONTE CARLO HAZIRLIĞI ---
    let akintiYonX = 0, akintiYonY = 0;
    if (akintiHiziKnot > 0) {
        const matematikselAciRadyan = ((450 - akintiYonuDerece) % 360) * (Math.PI / 180);
        akintiYonX = Math.cos(matematikselAciRadyan);
        akintiYonY = Math.sin(matematikselAciRadyan);
    }

    const { tespitEdilenYolSayisi, denizaltiYollari, tumTespitSureleriDk, tumDikeyAyrilmaMesafeleriM } = runMonteCarloTrials(
        simulasyonDenizaltiYolSayisi, progressCallback, isDatumKnown, datumX_user, datumY_user, sonarTespitYaricapiNm,
        sahaUzunNm, sahaGenisNm, denizaltiOrtDerinlikM, denizaltiDerinlikSapmaM, denizaltiHizKnot,
        denizaltiRotaSapmaYuzdesi, kullaniciSeciliYolKontrolNoktasiSayisi, fiiliSonobuoyKonumlariVeAtisZamani,
        sonobuoyCalismaSuresiDk, sonobuoyDinlemeDerinligiNm, akintiHiziKnot, akintiYonX, akintiYonY, sonarTespitBasariOrani
    );

    // --- SONUÇLARI BİRLEŞTİRME VE HESAPLAMA ---
    const tespitOlasiligiYuzde = (simulasyonDenizaltiYolSayisi > 0 && fiiliSonobuoyKonumlariVeAtisZamani.length > 0) ? (tespitEdilenYolSayisi / simulasyonDenizaltiYolSayisi) * 100 : 0;
    const p_sapka_oran = tespitOlasiligiYuzde / 100.0;
    const N_yol = simulasyonDenizaltiYolSayisi;
    let varyans_p_sapka_oran = 0, ci_alt_yuzde = tespitOlasiligiYuzde, ci_ust_yuzde = tespitOlasiligiYuzde;

    if (N_yol > 0 && p_sapka_oran > 1e-9 && p_sapka_oran < (1.0 - 1e-9)) {
        varyans_p_sapka_oran = (p_sapka_oran * (1 - p_sapka_oran)) / N_yol;
        const standart_hata_oran = Math.sqrt(varyans_p_sapka_oran);
        ci_alt_yuzde = Math.max(0, (p_sapka_oran - (1.96 * standart_hata_oran)) * 100);
        ci_ust_yuzde = Math.min(100, (p_sapka_oran + (1.96 * standart_hata_oran)) * 100);
    }
    
    kazanilanSureDk = rotaOptimizasyonuEtkin ? helikopterOperasyonSuresiUnoptimizedDk - anlikToplamHelikopterOperasyonSuresiDk : 0;
    kazanilanSureDk = Math.max(0, kazanilanSureDk);

    const fiiliBirakilanSayi = fiiliSonobuoyKonumlariVeAtisZamani.length;
    const helikopterMaliyeti = (anlikToplamHelikopterOperasyonSuresiDk / 60.0) * (costHeloHour || 0);
    const sonobuoyMaliyeti = fiiliBirakilanSayi * (costSonobuoy || 0);
    const toplamMaliyet = helikopterMaliyeti + sonobuoyMaliyeti;
    const tespitBasinaMaliyet = (tespitEdilenYolSayisi > 0) ? (toplamMaliyet / tespitEdilenYolSayisi) : 0;
    const ortalamaTespitZamaniDk = tumTespitSureleriDk.length > 0 ? tumTespitSureleriDk.reduce((a, b) => a + b, 0) / tumTespitSureleriDk.length : 0;
    const optimizasyonMaliyetKazanci = (kazanilanSureDk > 0) ? (kazanilanSureDk / 60.0) * (costHeloHour || 0) : 0;

    return {
        tespitOlasiligiYuzde: parseFloat(tespitOlasiligiYuzde.toFixed(2)), sonobuoyKonumlariVeSirasi: fiiliSonobuoyKonumlariVeAtisZamani,
        tespitSuresiDenizaltiDk: parseFloat(denizaltiOrtalamaTamSahaGecisSuresiDk.toFixed(2)), helikopterOperasyonSuresiDk: parseFloat(anlikToplamHelikopterOperasyonSuresiDk.toFixed(2)),
        helikopterOperasyonSuresiUnoptimizedDk: parseFloat(helikopterOperasyonSuresiUnoptimizedDk.toFixed(2)), kazanilanSureDk: parseFloat(kazanilanSureDk.toFixed(2)),
        denizaltiYollariVeTespitDurumu: denizaltiYollari, fiiliBirakilanSonobuoySayisi: fiiliBirakilanSayi, helikopterHareketKaydi: helikopterHareketKaydi,
        gridPatternPlacementNote: gridPatternNote, isDatumKnown: isDatumKnown, varyans_p_sapka_oran: parseFloat(varyans_p_sapka_oran.toFixed(8)),
        ci_alt_yuzde: parseFloat(ci_alt_yuzde.toFixed(2)), ci_ust_yuzde: parseFloat(ci_ust_yuzde.toFixed(2)), toplamMaliyet: parseFloat(toplamMaliyet.toFixed(2)),
        tespitBasinaMaliyet: parseFloat(tespitBasinaMaliyet.toFixed(2)), ortalamaTespitZamaniDk: parseFloat(ortalamaTespitZamaniDk.toFixed(2)),
        optimizasyonMaliyetKazanci: parseFloat(optimizasyonMaliyetKazanci.toFixed(2)),
        dikeyAyrilmaMesafeleri: tumDikeyAyrilmaMesafeleriM, // YENİ: Veriyi sonuç objesine ekle
        unoptimizedRoute: hamDropKonumlari, // YENİ: Optimize edilmemiş rotayı ekle
        heloBase: { x: helikopterStartXNm, y: helikopterStartYNm } // YENİ: Helikopter üs bilgisini ekle
    };
}