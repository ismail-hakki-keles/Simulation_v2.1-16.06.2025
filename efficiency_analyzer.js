/*
 * Denizaltı Tespit Simülasyonu
 * Copyright (c) 2025 İsmail Hakkı KELEŞ
 *
 * Bu proje MIT Lisansı altında lisanslanmıştır.
 * Lisansın tam metni için projenin kök dizinindeki LICENSE dosyasına bakın.
 * GitHub: https://github.com/knnchw/Simulation_v2.1-16.06.2025
 */

// --- MALİYET-ETKİNLİK SINIRI ANALİZ MOTORU ---
"use strict";

async function runEfficiencyAnalysis(baseParams, eaParams, progressCallback) {
    const results = [];
    const totalScenarios = eaParams.scenarioCount;

    for (let i = 0; i < totalScenarios; i++) {
        // Rastgele parametre seti oluştur
        const randomParams = { ...baseParams };
        
        if (eaParams.variablesToChange.includes('sonobuoyAdedi')) {
            randomParams.sonobuoyAdedi = getRandomInt(eaParams.sonobuoyCountMin, eaParams.sonobuoyCountMax);
        }
        if (eaParams.variablesToChange.includes('sonarYaricap')) {
            randomParams.sonarYaricap = getRandomFloat(eaParams.sonarRadiusMin, eaParams.sonarRadiusMax);
        }
        if (eaParams.variablesToChange.includes('sonarTespitBasariOrani')) {
            randomParams.sonarTespitBasariOrani = getRandomFloat(eaParams.detectionProbMin, eaParams.detectionProbMax);
        }

        // Arayüzü kilitlememek için küçük bir bekleme
        await new Promise(resolve => setTimeout(resolve, 10)); 

        try {
            const result = hesaplaTespitOlasiligiVeMaliyetJS(
                randomParams.sahaUzunluk, randomParams.sahaGenislik, randomParams.sonarYaricap, randomParams.sonobuoyAdedi,
                randomParams.sonobuoyYerlesimPaterni,
                randomParams.helikopterSurat, randomParams.helikopterStartX, randomParams.helikopterStartY, randomParams.sonobuoyBirakmaSuresi,
                randomParams.denizaltiSurati, randomParams.sonobuoyCalismaSuresi, randomParams.sonobuoyDinlemeDerinligi,
                randomParams.denizaltiOrtDerinlik, randomParams.denizaltiDerinlikSapma, randomParams.denizaltiRotaSapmaYuzdesi,
                randomParams.sonarTespitBasariOrani, eaParams.monteCarloRuns, 250, // Analiz için sabit detay seviyesi
                randomParams.akintiHizi, randomParams.akintiYonu,
                randomParams.helikopterTasiyabilecegiKapasite, randomParams.sonobuoyIkmalSuresiDk,
                randomParams.rotaOptimizasyonuEtkin,
                randomParams.isDatumKnown, randomParams.datumX, randomParams.datumY,
                randomParams.costHeloHour, randomParams.costSonobuoy,
                randomParams.personelSaatlikMaliyet, randomParams.ucusSaatiBasinaBakimMaliyeti,
                null, true // SA'dan çağrıldı gibi davran, progress callback kullanma
            );
            
            // Parametreleri sadece değiştirilenleri içerecek şekilde daralt
            const changedParams = {};
            if (eaParams.variablesToChange.includes('sonobuoyAdedi')) {
                changedParams.sonobuoyAdedi = randomParams.sonobuoyAdedi;
            }
            if (eaParams.variablesToChange.includes('sonarYaricap')) {
                changedParams.sonarYaricap = randomParams.sonarYaricap.toFixed(2);
            }
             if (eaParams.variablesToChange.includes('sonarTespitBasariOrani')) {
                changedParams.sonarTespitBasariOrani = randomParams.sonarTespitBasariOrani.toFixed(2);
            }

            results.push({
                cost: result.toplamMaliyet,
                probability: result.tespitOlasiligiYuzde,
                params: changedParams,
                full_params: randomParams // Tıklama olayı için tüm parametreleri sakla
            });

        } catch (error) {
            console.warn(`Etkinlik analizi adımı ${i} başarısız oldu:`, error.message);
        }
        
        // İlerlemeyi güncelle
        if (progressCallback) {
            progressCallback((i + 1) / totalScenarios * 100);
        }
    }

    return findParetoFrontier(results);
}

function findParetoFrontier(points) {
    if (points.length === 0) return { allPoints: [], frontierPoints: [] };

    // Maliyete göre sırala (düşükten yükseğe)
    const sortedPoints = points.sort((a, b) => a.cost - b.cost);
    
    const frontier = [];
    let maxProbabilitySeen = -1;

    sortedPoints.forEach(point => {
        // Bu maliyet seviyesinde veya daha düşük maliyette daha yüksek bir olasılık görmüş müyüz?
        if (point.probability > maxProbabilitySeen) {
            frontier.push(point);
            maxProbabilitySeen = point.probability;
        }
    });

    return { allPoints: sortedPoints, frontierPoints: frontier };
}

// Helper fonksiyonlar
function getRandomFloat(min, max) {
    return Math.random() * (max - min) + min;
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
