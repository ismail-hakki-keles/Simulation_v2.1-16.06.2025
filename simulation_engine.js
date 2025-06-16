// --- SİMÜLASYON MOTORU: MONTE CARLO DENEMELERİ ---
"use strict";

/**
 * Belirlenen senaryo için Monte Carlo denemelerini yürütür.
 * @returns {object} Tespit edilen yol sayısı ve ham sonuçları içeren obje.
 */
function runMonteCarloTrials(
    simulasyonDenizaltiYolSayisi,
    progressCallback,
    isDatumKnown,
    datumX_user, datumY_user,
    sonarTespitYaricapiNm,
    sahaUzunNm, sahaGenisNm,
    denizaltiOrtDerinlikM, denizaltiDerinlikSapmaM,
    denizaltiHizKnot,
    denizaltiRotaSapmaYuzdesi,
    kullaniciSeciliYolKontrolNoktasiSayisi,
    fiiliSonobuoyKonumlariVeAtisZamani,
    sonobuoyCalismaSuresiDk,
    sonobuoyDinlemeDerinligiNm,
    akintiHiziKnot,
    akintiYonX, akintiYonY,
    sonarTespitBasariOrani
) {
    let tespitEdilenYolSayisi = 0;
    const denizaltiYollari = [];
    const tumTespitSureleriDk = [];
    const tumDikeyAyrilmaMesafeleriM = []; // YENİ: Dikey ayrım mesafelerini toplamak için

    for (let i_mc = 0; i_mc < simulasyonDenizaltiYolSayisi; i_mc++) {

        if (progressCallback && (i_mc % 20 === 0 || i_mc === simulasyonDenizaltiYolSayisi - 1)) {
            const progress = ((i_mc + 1) / simulasyonDenizaltiYolSayisi) * 100;
            progressCallback(progress);
        }

        let mc_denizaltiBaslangicX, mc_denizaltiBaslangicY;
        let fixedSubY_Nm_forStatic, fixedSubZ_Nm_forStatic;

        if (isDatumKnown) {
            const offset_radius = Math.random() * 4 * sonarTespitYaricapiNm;
            const offset_angle = Math.random() * 2 * Math.PI;
            mc_denizaltiBaslangicX = datumX_user + offset_radius * Math.cos(offset_angle);
            mc_denizaltiBaslangicY = datumY_user + offset_radius * Math.sin(offset_angle);
            mc_denizaltiBaslangicX = Math.max(0, Math.min(sahaUzunNm, mc_denizaltiBaslangicX));
            mc_denizaltiBaslangicY = Math.max(0, Math.min(sahaGenisNm, mc_denizaltiBaslangicY));
        } else {
            mc_denizaltiBaslangicX = 0;
            mc_denizaltiBaslangicY = Math.random() * sahaGenisNm;
        }

        let anlikDenizaltiDerinligiM_mc = denizaltiOrtDerinlikM + (Math.random() * 2 - 1) * denizaltiDerinlikSapmaM;
        anlikDenizaltiDerinligiM_mc = Math.max(0, anlikDenizaltiDerinligiM_mc);

        if (denizaltiHizKnot <= 0 && isDatumKnown) {
            fixedSubY_Nm_forStatic = mc_denizaltiBaslangicY;
            fixedSubZ_Nm_forStatic = anlikDenizaltiDerinligiM_mc / METERS_PER_NAUTICAL_MILE;
        }

        let yolTespitEdildi = false;
        const currentDenizaltiYolNoktalari = [];
        let tespitEdilenNokta = null;
        let tespitEdenSonobuoyIndeksi = -1;
        let tespitAnindakiSonobuoyKonumu = null;

        if (denizaltiHizKnot > 0 || !isDatumKnown) {
            const toplamYolculukMesafesiX = sahaUzunNm - mc_denizaltiBaslangicX;
            const minIzinVerilenDerinlikM = Math.max(0, denizaltiOrtDerinlikM - denizaltiDerinlikSapmaM);
            const maxIzinVerilenDerinlikM = denizaltiOrtDerinlikM + denizaltiDerinlikSapmaM;
            const birAdimdaMaxYSapmaNm = (kullaniciSeciliYolKontrolNoktasiSayisi > 1 && toplamYolculukMesafesiX > 0) ? (2 * sahaGenisNm * denizaltiRotaSapmaYuzdesi) / kullaniciSeciliYolKontrolNoktasiSayisi : 0;
            const birAdimdaMaxDerinlikDegisimiM = (kullaniciSeciliYolKontrolNoktasiSayisi > 1 && toplamYolculukMesafesiX > 0) ? (2 * denizaltiDerinlikSapmaM) / kullaniciSeciliYolKontrolNoktasiSayisi : 0;

            let currentYForPath = mc_denizaltiBaslangicY;
            let currentDepthForPathM = anlikDenizaltiDerinligiM_mc;

            for (let j = 0; j < kullaniciSeciliYolKontrolNoktasiSayisi; j++) {
                let denizaltiX_Nm;
                 if (toplamYolculukMesafesiX <= 0 && isDatumKnown && denizaltiHizKnot > 0) {
                    denizaltiX_Nm = mc_denizaltiBaslangicX;
                } else if (kullaniciSeciliYolKontrolNoktasiSayisi === 1){
                    denizaltiX_Nm = mc_denizaltiBaslangicX + toplamYolculukMesafesiX;
                }
                else {
                    denizaltiX_Nm = mc_denizaltiBaslangicX + (j / (kullaniciSeciliYolKontrolNoktasiSayisi - 1)) * toplamYolculukMesafesiX;
                }

                if (j > 0 && toplamYolculukMesafesiX > 0) {
                    const dy_Nm = (Math.random() * 2 - 1) * birAdimdaMaxYSapmaNm;
                    currentYForPath += dy_Nm;
                    currentYForPath = Math.max(mc_denizaltiBaslangicY - (sahaGenisNm * denizaltiRotaSapmaYuzdesi), currentYForPath);
                    currentYForPath = Math.min(mc_denizaltiBaslangicY + (sahaGenisNm * denizaltiRotaSapmaYuzdesi), currentYForPath);

                    const dz_M = (Math.random() * 2 - 1) * birAdimdaMaxDerinlikDegisimiM;
                    currentDepthForPathM += dz_M;
                }

                const guncelDenizaltiY_Nm = Math.max(0, Math.min(sahaGenisNm, currentYForPath));
                const guncelDenizaltiDerinligiM = Math.max(0, Math.min(maxIzinVerilenDerinlikM, Math.max(minIzinVerilenDerinlikM, currentDepthForPathM)));

                const denizaltiKonumNm = [denizaltiX_Nm, guncelDenizaltiY_Nm, guncelDenizaltiDerinligiM / METERS_PER_NAUTICAL_MILE];
                currentDenizaltiYolNoktalari.push(denizaltiKonumNm);

                let denizaltiUlasmaZamaniDk_current = Infinity;
                if (denizaltiHizKnot > 0) {
                    const katEdilenMesafeX = denizaltiX_Nm - mc_denizaltiBaslangicX;
                    denizaltiUlasmaZamaniDk_current = (katEdilenMesafeX / denizaltiHizKnot) * 60;
                } else {
                    if (denizaltiHizKnot <= 0) {
                        continue;
                    }
                }

                for (let sb_idx = 0; sb_idx < fiiliSonobuoyKonumlariVeAtisZamani.length; sb_idx++) {
                    const sb = fiiliSonobuoyKonumlariVeAtisZamani[sb_idx];
                    const [sbOrjinalX, sbOrjinalY, sbAtisZamaniDk] = sb;
                    const sonobuoyAktifMiTemel = (denizaltiUlasmaZamaniDk_current >= sbAtisZamaniDk) &&
                                                (denizaltiUlasmaZamaniDk_current <= (sbAtisZamaniDk + sonobuoyCalismaSuresiDk));
                    if (!sonobuoyAktifMiTemel) continue;

                    let anlikSbX = sbOrjinalX;
                    let anlikSbY = sbOrjinalY;
                    let sonobuoySahadaMi = true;

                    if (akintiHiziKnot > 0) {
                        const suruklenmeSuresiDk = denizaltiUlasmaZamaniDk_current - sbAtisZamaniDk;
                        if (suruklenmeSuresiDk > 0) {
                            const suruklenmeMesafesiNm = akintiHiziKnot * (suruklenmeSuresiDk / 60.0);
                            anlikSbX = sbOrjinalX + suruklenmeMesafesiNm * akintiYonX;
                            anlikSbY = sbOrjinalY + suruklenmeMesafesiNm * akintiYonY;
                        }
                    }
                    sonobuoySahadaMi = (anlikSbX >= 0 && anlikSbX <= sahaUzunNm && anlikSbY >= 0 && anlikSbY <= sahaGenisNm);
                    if (!sonobuoySahadaMi) continue;

                    const sonobuoyAnlikKonum3D = [anlikSbX, anlikSbY, sonobuoyDinlemeDerinligiNm];
                    const mesafeNm = Math.sqrt(
                        Math.pow(denizaltiKonumNm[0] - sonobuoyAnlikKonum3D[0], 2) +
                        Math.pow(denizaltiKonumNm[1] - sonobuoyAnlikKonum3D[1], 2) +
                        Math.pow(denizaltiKonumNm[2] - sonobuoyAnlikKonum3D[2], 2)
                    );

                    if (mesafeNm <= sonarTespitYaricapiNm) {
                        if (Math.random() < sonarTespitBasariOrani) {
                            yolTespitEdildi = true;
                            tespitEdilenNokta = denizaltiKonumNm;
                            tespitEdenSonobuoyIndeksi = sb_idx;
                            tespitAnindakiSonobuoyKonumu = sonobuoyAnlikKonum3D;
                            
                            // YENİ: Dikey ayrım mesafesini kaydet
                            const dikeyAyrilmaM = Math.abs(tespitEdilenNokta[2] - tespitAnindakiSonobuoyKonumu[2]) * METERS_PER_NAUTICAL_MILE;
                            tumDikeyAyrilmaMesafeleriM.push(dikeyAyrilmaM);

                            if (denizaltiHizKnot > 0) {
                                const tespitSuresi = ((tespitEdilenNokta[0] - mc_denizaltiBaslangicX) / denizaltiHizKnot) * 60;
                                tumTespitSureleriDk.push(tespitSuresi);
                            }
                            break;
                        }
                    }
                }
                if (yolTespitEdildi) break;
            }
        } else { // SABİT HEDEF 
            const staticSubPosition = [mc_denizaltiBaslangicX, fixedSubY_Nm_forStatic, fixedSubZ_Nm_forStatic];
            currentDenizaltiYolNoktalari.push(staticSubPosition);

            for (let sb_idx = 0; sb_idx < fiiliSonobuoyKonumlariVeAtisZamani.length; sb_idx++) {
                if (yolTespitEdildi) break;
                const sb = fiiliSonobuoyKonumlariVeAtisZamani[sb_idx];
                const [sbOrjinalX, sbOrjinalY, sbAtisZamaniDk] = sb;

                for (let k_buoy_life = 0; k_buoy_life < STATIC_TARGET_DETECTION_STEPS_PER_BUOY_LIFE; k_buoy_life++) {
                    let checkTimeOffsetDk;
                    if (STATIC_TARGET_DETECTION_STEPS_PER_BUOY_LIFE <= 1) {
                        checkTimeOffsetDk = sonobuoyCalismaSuresiDk / 2;
                    } else {
                        checkTimeOffsetDk = (k_buoy_life / (STATIC_TARGET_DETECTION_STEPS_PER_BUOY_LIFE - 1)) * sonobuoyCalismaSuresiDk;
                    }
                    const etkinKontrolZamaniDk = sbAtisZamaniDk + checkTimeOffsetDk;

                    if (etkinKontrolZamaniDk < sbAtisZamaniDk || etkinKontrolZamaniDk > (sbAtisZamaniDk + sonobuoyCalismaSuresiDk)) {
                        continue;
                    }

                    let anlikSbX = sbOrjinalX;
                    let anlikSbY = sbOrjinalY;
                    let sonobuoySahadaMi = true;

                    if (akintiHiziKnot > 0) {
                        const suruklenmeSuresiDk_static = etkinKontrolZamaniDk - sbAtisZamaniDk;
                        if (suruklenmeSuresiDk_static > 0) {
                            const suruklenmeMesafesiNm = akintiHiziKnot * (suruklenmeSuresiDk_static / 60.0);
                            anlikSbX = sbOrjinalX + suruklenmeMesafesiNm * akintiYonX;
                            anlikSbY = sbOrjinalY + suruklenmeMesafesiNm * akintiYonY;
                        }
                    }

                    sonobuoySahadaMi = (anlikSbX >= 0 && anlikSbX <= sahaUzunNm && anlikSbY >= 0 && anlikSbY <= sahaGenisNm);
                    if (!sonobuoySahadaMi) continue;

                    const sonobuoyAnlikKonum3D = [anlikSbX, anlikSbY, sonobuoyDinlemeDerinligiNm];
                    const mesafeNm = Math.sqrt(
                        Math.pow(staticSubPosition[0] - sonobuoyAnlikKonum3D[0], 2) +
                        Math.pow(staticSubPosition[1] - sonobuoyAnlikKonum3D[1], 2) +
                        Math.pow(staticSubPosition[2] - sonobuoyAnlikKonum3D[2], 2)
                    );

                    if (mesafeNm <= sonarTespitYaricapiNm) {
                        if (Math.random() < sonarTespitBasariOrani) {
                            yolTespitEdildi = true;
                            tespitEdilenNokta = staticSubPosition;
                            tespitEdenSonobuoyIndeksi = sb_idx;
                            tespitAnindakiSonobuoyKonumu = sonobuoyAnlikKonum3D;
                            
                            // YENİ: Dikey ayrım mesafesini kaydet
                            const dikeyAyrilmaM = Math.abs(tespitEdilenNokta[2] - tespitAnindakiSonobuoyKonumu[2]) * METERS_PER_NAUTICAL_MILE;
                            tumDikeyAyrilmaMesafeleriM.push(dikeyAyrilmaM);

                            tumTespitSureleriDk.push(etkinKontrolZamaniDk);
                            break;
                        }
                    }
                }
                if (yolTespitEdildi) break;
            }
        }
        
        denizaltiYollari.push([currentDenizaltiYolNoktalari, yolTespitEdildi, tespitEdilenNokta, mc_denizaltiBaslangicX, tespitEdenSonobuoyIndeksi, tespitAnindakiSonobuoyKonumu]);
        if (yolTespitEdildi) tespitEdilenYolSayisi++;
    }

    return {
        tespitEdilenYolSayisi,
        denizaltiYollari,
        tumTespitSureleriDk,
        tumDikeyAyrilmaMesafeleriM // YENİ: Toplanan veriyi geri döndür
    };
}