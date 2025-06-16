// --- DUYARLILIK ANALİZİ MANTIĞI ---
"use strict";

async function runSensitivityAnalysisStepByStep(
    baselineParams, // Temel parametrelerin bir kopyası
    varyingParamId, // Değiştirilen parametrenin ID'si (örn: 'sonarYaricap')
    paramValuesToTest, // Test edilecek parametre değerleri dizisi
    outputMetricKeyPrimary, // Birincil çıktı metriğinin anahtarı (örn: 'tespitOlasiligiYuzde')
    outputMetricKeySecondary, // İkincil çıktı metriğinin anahtarı (veya 'none')
    saMcYolSayisi, // SA için Monte Carlo yol sayısı
    saYolKontrolNoktasiSayisiSim, // SA için yol kontrol noktası sayısı
    saRotaOptimizasyonuEtkin, // SA sırasında rota optimizasyonu etkin mi?
    saIsDatumKnown, // SA sırasında datum bilgisi mevcut mu? (Ana formdan gelir)
    originalStepPrecision, // Değişen parametrenin ondalık hassasiyeti
    updateStatusCallback, // Durum güncellemeleri için callback fonksiyonu (ui_controller'dan)
    onStepCompleteCallback // Her adım tamamlandığında çağrılacak callback (ui_controller'dan)
) {
    const saResultsYPrimaryValues = [];
    const saResultsYSecondaryValues = [];

    for (let currentSaStep = 0; currentSaStep < paramValuesToTest.length; currentSaStep++) {
        const currentTestValue = paramValuesToTest[currentSaStep];
        if (updateStatusCallback) {
            const varyingParamName = document.getElementById(varyingParamId) ?
                                     (document.getElementById(varyingParamId).labels[0] ? document.getElementById(varyingParamId).labels[0].textContent.replace(':', '').trim() : varyingParamId)
                                     : varyingParamId;
            updateStatusCallback(`Adım ${currentSaStep + 1}/${paramValuesToTest.length}: ${varyingParamName} = ${currentTestValue.toFixed(originalStepPrecision)} için çalıştırılıyor... (MC: ${saMcYolSayisi})`);
        }

        const tempParams = { ...baselineParams };
        tempParams[varyingParamId] = currentTestValue;

        let currentSaPatern = tempParams.sonobuoyYerlesimPaterni;
        if (saIsDatumKnown && (varyingParamId === 'datumX' || varyingParamId === 'datumY' || varyingParamId === 'sonarYaricap' || varyingParamId === 'sonobuoyAdedi')) {
            currentSaPatern = 'circular';
        } else if (!saIsDatumKnown && tempParams.sonobuoyYerlesimPaterni === 'circular'){
            currentSaPatern = 'grid'; 
        }


        // UI'ın güncellenmesine izin vermek için kısa bir bekleme
        await new Promise(resolve => setTimeout(resolve, 30));

        try {
            const results = hesaplaTespitOlasiligiVeMaliyetJS(
                tempParams.sahaUzunluk, tempParams.sahaGenislik, tempParams.sonarYaricap, tempParams.sonobuoyAdedi,
                currentSaPatern, 
                tempParams.helikopterSurat, tempParams.helikopterStartX, tempParams.helikopterStartY, tempParams.sonobuoyBirakmaSuresi,
                tempParams.denizaltiSurati, tempParams.sonobuoyCalismaSuresi, tempParams.sonobuoyDinlemeDerinligi,
                tempParams.denizaltiOrtDerinlik, tempParams.denizaltiDerinlikSapma, tempParams.denizaltiRotaSapmaYuzdesi,
                tempParams.sonarTespitBasariOrani, saMcYolSayisi, saYolKontrolNoktasiSayisiSim,
                tempParams.akintiHizi, tempParams.akintiYonu,
                tempParams.helikopterTasiyabilecegiKapasite, tempParams.sonobuoyIkmalSuresiDk,
                saRotaOptimizasyonuEtkin, 
                saIsDatumKnown, 
                (varyingParamId === 'datumX' ? currentTestValue : tempParams.datumX), 
                (varyingParamId === 'datumY' ? currentTestValue : tempParams.datumY),
                tempParams.costHeloHour,      // Yeni eklenen maliyet parametresi
                tempParams.costSonobuoy,       // Yeni eklenen maliyet parametresi
                null,                          // SA sırasında ilerleme çubuğu callback'i kullanılmıyor
                true                           // isCalledFromSA = true
            );

            // Duyarlılık analizi için maliyet çıktısını da alabilme
            let primaryValue, secondaryValue;
            
            if (outputMetricKeyPrimary === 'toplamMaliyet' || outputMetricKeyPrimary === 'tespitBasinaMaliyet') {
                primaryValue = results[outputMetricKeyPrimary];
            } else {
                primaryValue = results[outputMetricKeyPrimary] || 0;
            }

            if (outputMetricKeySecondary !== 'none') {
                 if (outputMetricKeySecondary === 'toplamMaliyet' || outputMetricKeySecondary === 'tespitBasinaMaliyet') {
                    secondaryValue = results[outputMetricKeySecondary];
                } else {
                    secondaryValue = results[outputMetricKeySecondary] || 0;
                }
            }


            saResultsYPrimaryValues.push(primaryValue);
            if (outputMetricKeySecondary !== 'none') {
                saResultsYSecondaryValues.push(secondaryValue);
            }
            if (onStepCompleteCallback) {
                onStepCompleteCallback(true, null); // Başarılı adım
            }

        } catch (err) {
            saResultsYPrimaryValues.push(NaN); // Hata durumunda NaN ekle
            if (outputMetricKeySecondary !== 'none') {
                saResultsYSecondaryValues.push(NaN);
            }
            if (updateStatusCallback) {
                 updateStatusCallback(`Hata (Adım ${currentSaStep + 1}): ${err.message}. Analiz durduruldu.`);
            }
            if (onStepCompleteCallback) {
                onStepCompleteCallback(false, err); // Başarısız adım ve hata
            }
            return { primaryResults: saResultsYPrimaryValues, secondaryResults: saResultsYSecondaryValues, errorOccurred: true, errorMessage: err.message }; // Hata oluştu, erken çık
        }
    }
    return { primaryResults: saResultsYPrimaryValues, secondaryResults: saResultsYSecondaryValues, errorOccurred: false };
}

async function calculateBaselineForSA(
    baselineParams,
    outputMetricKeyPrimary,
    outputMetricKeySecondary,
    saMcYolSayisi,
    saYolKontrolNoktasiSayisiSim,
    saRotaOptimizasyonuEtkin,
    saIsDatumKnown,
    updateStatusCallback
) {
    if (updateStatusCallback) {
        updateStatusCallback('Temel değerler hesaplanıyor...');
    }
    await new Promise(resolve => setTimeout(resolve, 30)); // UI güncellemesi için

    let baselineOutputValuePrimary = undefined;
    let baselineOutputValueSecondary = undefined;

    try {
        const baselineResults = hesaplaTespitOlasiligiVeMaliyetJS(
            baselineParams.sahaUzunluk, baselineParams.sahaGenislik, baselineParams.sonarYaricap, baselineParams.sonobuoyAdedi,
            baselineParams.sonobuoyYerlesimPaterni, 
            baselineParams.helikopterSurat, baselineParams.helikopterStartX, baselineParams.helikopterStartY, baselineParams.sonobuoyBirakmaSuresi,
            baselineParams.denizaltiSurati, baselineParams.sonobuoyCalismaSuresi, baselineParams.sonobuoyDinlemeDerinligi,
            baselineParams.denizaltiOrtDerinlik, baselineParams.denizaltiDerinlikSapma, baselineParams.denizaltiRotaSapmaYuzdesi,
            baselineParams.sonarTespitBasariOrani, saMcYolSayisi, saYolKontrolNoktasiSayisiSim,
            baselineParams.akintiHizi, baselineParams.akintiYonu,
            baselineParams.helikopterTasiyabilecegiKapasite, baselineParams.sonobuoyIkmalSuresiDk,
            saRotaOptimizasyonuEtkin,
            saIsDatumKnown, baselineParams.datumX, baselineParams.datumY,
            baselineParams.costHeloHour,       // Yeni eklenen maliyet parametresi
            baselineParams.costSonobuoy,        // Yeni eklenen maliyet parametresi
            null,                               // SA sırasında ilerleme çubuğu callback'i kullanılmıyor
            true                                // isCalledFromSA = true
        );
        baselineOutputValuePrimary = baselineResults[outputMetricKeyPrimary];
        if (outputMetricKeySecondary !== 'none') {
            baselineOutputValueSecondary = baselineResults[outputMetricKeySecondary];
        }
        return { primary: baselineOutputValuePrimary, secondary: baselineOutputValueSecondary, error: null };
    } catch (err) {
        if (updateStatusCallback) {
            updateStatusCallback(`Hata: Temel değer hesaplanamadı: ${err.message}.`);
        }
        return { primary: undefined, secondary: undefined, error: err.message };
    }
}