/*
 * Denizaltı Tespit Simülasyonu
 * Copyright (c) 2025 İsmail Hakkı KELEŞ
 *
 * Bu proje MIT Lisansı altında lisanslanmıştır.
 * Lisansın tam metni için projenin kök dizinindeki LICENSE dosyasına bakın.
 * GitHub: https://github.com/knnchw/Simulation_v2.1-16.06.2025
 */

// --- KULLANICI ARABİRİMİ: SİMÜLASYON YÜRÜTME VE SONUÇ GÖSTERİMİ ---
"use strict";

let lastSimulationResults = null;
let lastSimulationParams = null;
// let isSimulationRunning = false; // Bu değişken ui_controller.js içinde merkezi olarak yönetiliyor.

function setupSimulationRunner() {
    const runSimBtn = document.getElementById('runSimBtn');
    if (runSimBtn) {
        runSimBtn.addEventListener('click', runSimulation);
    }
}

function runSimulation() {
    if (isSimulationRunning || isSensitivityAnalysisRunning || isEfficiencyAnalysisRunning || isOptimizationRunning) {
        showUserMessage("Mevcut bir simülasyon veya analiz çalışıyor.", 'error');
        return;
    }

    const params = validateAndGetParams();
    if (!params) {
        const simulationErrorArea = document.getElementById('simulationErrorArea');
        if (simulationErrorArea) {
            simulationErrorArea.textContent = "Lütfen formdaki hataları düzeltin.";
            simulationErrorArea.style.display = 'block';
        }
        return;
    }

    isSimulationRunning = true;
    resetUIForCalculation();
    
    setTimeout(() => {
        try {
            let yolKontrolNoktasiSayisiSim;
            switch (params.denizaltiYolDetaySeviyesi) {
                case "dusuk": yolKontrolNoktasiSayisiSim = 100; break;
                case "yuksek": yolKontrolNoktasiSayisiSim = 500; break;
                default: yolKontrolNoktasiSayisiSim = 250;
            }

            const sonuclar = hesaplaTespitOlasiligiVeMaliyetJS(
                params.sahaUzunluk, params.sahaGenislik, params.sonarYaricap, params.sonobuoyAdedi,
                params.sonobuoyYerlesimPaterni,
                params.helikopterSurat, params.helikopterStartX, params.helikopterStartY, params.sonobuoyBirakmaSuresi,
                params.denizaltiSurati, params.sonobuoyCalismaSuresi, params.sonobuoyDinlemeDerinligi,
                params.denizaltiOrtDerinlik, params.denizaltiDerinlikSapma, params.denizaltiRotaSapmaYuzdesi,
                params.sonarTespitBasariOrani, params.simulasyonDenizaltiYolSayisi, yolKontrolNoktasiSayisiSim,
                params.akintiHizi, params.akintiYonu,
                params.helikopterTasiyabilecegiKapasite, params.sonobuoyIkmalSuresiDk,
                params.rotaOptimizasyonuEtkin,
                params.isDatumKnown, params.datumX, params.datumY,
                params.costHeloHour, params.costSonobuoy, 
                params.personelSaatlikMaliyet, params.ucusSaatiBasinaBakimMaliyeti, // EKLENEN YENİ PARAMETRELER
                (progress) => {
                    const progressBar = document.getElementById('progressBar');
                    const progressText = document.getElementById('progressText');
                    if(progressBar) progressBar.style.width = `${progress}%`;
                    if(progressText) progressText.textContent = `${Math.round(progress)}%`;
                },
                false
            );
            
            lastSimulationResults = sonuclar;
            lastSimulationParams = params;
            
            updateUIWithResults(sonuclar, params);
            gorsellestirSimulasyonSonuclari(
                params.gorsellestirmeTipi, params.sahaUzunluk, params.sahaGenislik, params.sonarYaricap,
                sonuclar, params.ornekYolSayisi, params.sonobuoyCalismaSuresi,
                params.denizaltiSurati, params.sonobuoyDinlemeDerinligi,
                params.akintiHizi, params.akintiYonu,
                params.isDatumKnown, params.datumX, params.datumY,
                document.getElementById('runSimBtn'), 'graph'
            );

        } catch (error) {
            console.error("Simülasyon ana try-catch bloğunda hata:", error);
            const simulationErrorArea = document.getElementById('simulationErrorArea');
            if (simulationErrorArea) {
                simulationErrorArea.textContent = `Simülasyon sırasında bir hata oluştu: ${error.message}.`;
                simulationErrorArea.style.display = 'block';
            }
            document.getElementById('graph').innerHTML = '<p style="text-align:center; color:#f87171;">Görselleştirme oluşturulamadı.</p>';
        } finally {
            isSimulationRunning = false;
            finalizeUICalculation();
        }
    }, 50);
}

function resetUIForCalculation() {
    const runSimBtn = document.getElementById('runSimBtn');
    if (runSimBtn) {
        runSimBtn.disabled = true;
        runSimBtn.classList.add('loading');
        runSimBtn.querySelector('.btn-text').textContent = 'Hesaplanıyor...';
    }
    document.getElementById('saRunButton').disabled = true;
    document.getElementById('eaRunButton').disabled = true;
    document.getElementById('optRunButton').disabled = true;
    
    document.getElementById('progressContainer').style.display = 'block';
    document.getElementById('progressBar').style.width = '0%';
    document.getElementById('progressText').textContent = '0%';
    
    document.getElementById('graph').innerHTML = '<p style="text-align:center; padding:20px; color: #a5d8ff;">Simülasyon hazırlanıyor...</p>';
    document.getElementById('sonobuoyYerlesimListesi').innerHTML = '';

    document.getElementById('tespitOlasiligiValue').textContent = '%0.00';
    document.getElementById('tespitOlasiligiDetails').textContent = '(%95 Güven Aralığı: %0.00 - %0.00 | Varyans: 0.0000)';
    document.getElementById('denizaltiGecisSuresi').textContent = '0.00 dk';
    document.getElementById('ortalamaTespitZamani').textContent = '0.00 dk';
    document.getElementById('helikopterOperasyonSuresiValue').textContent = '0.00 dk';
    document.getElementById('toplamMaliyetValue').textContent = '$0';
    document.getElementById('tespitBasinaMaliyet').textContent = '$0';

    document.querySelector('.optimization-metric-group').style.display = 'none';
    document.querySelector('.optimization-metric-group').nextElementSibling.style.display = 'none';
    const optMaliyetEl = document.getElementById('optimizasyonMaliyetKazanci');
    optMaliyetEl.style.display = 'none';
    optMaliyetEl.previousElementSibling.style.display = 'none';
    if(optMaliyetEl.nextElementSibling) optMaliyetEl.nextElementSibling.style.display = 'none';
    
    document.getElementById('addToComparisonBtn').disabled = true;
    document.getElementById('exportPdfBtn').disabled = true;
}

function finalizeUICalculation() {
    const runSimBtn = document.getElementById('runSimBtn');
    if (runSimBtn) {
        runSimBtn.disabled = false;
        runSimBtn.classList.remove('loading');
        runSimBtn.querySelector('.btn-text').textContent = 'Simülasyonu Başlat';
    }
    
    document.getElementById('saRunButton').disabled = !document.getElementById('saEnableAnalysis').checked;
    document.getElementById('eaRunButton').disabled = !document.getElementById('eaEnableAnalysis').checked;
    document.getElementById('optRunButton').disabled = !document.getElementById('optEnableAnalysis').checked;
    
    setTimeout(() => {
        document.getElementById('progressContainer').style.display = 'none';
    }, 1500);
}

function updateUIWithResults(sonuclar, params) {
    document.getElementById('tespitOlasiligiValue').textContent = `%${sonuclar.tespitOlasiligiYuzde.toFixed(2)}`;
    if (sonuclar.fiiliBirakilanSonobuoySayisi > 0 && params.simulasyonDenizaltiYolSayisi > 0 && sonuclar.tespitOlasiligiYuzde > 0.001 && sonuclar.tespitOlasiligiYuzde < 99.999) {
        document.getElementById('tespitOlasiligiDetails').textContent = `(%95 Güven Aralığı: %${sonuclar.ci_alt_yuzde.toFixed(2)} - %${sonuclar.ci_ust_yuzde.toFixed(2)} | Varyans: ${sonuclar.varyans_p_sapka_oran.toFixed(8)})`;
    } else {
        document.getElementById('tespitOlasiligiDetails').textContent = `(%95 Güven Aralığı: %${sonuclar.tespitOlasiligiYuzde.toFixed(2)} - %${sonuclar.tespitOlasiligiYuzde.toFixed(2)} | Varyans: 0.00000000)`;
    }
    document.getElementById('denizaltiGecisSuresi').textContent = `${sonuclar.tespitSuresiDenizaltiDk.toFixed(2)} dk`;
    document.getElementById('ortalamaTespitZamani').textContent = sonuclar.ortalamaTespitZamaniDk > 0 ? `${sonuclar.ortalamaTespitZamaniDk.toFixed(2)} dk` : 'Tespit Yok';
    document.getElementById('helikopterOperasyonSuresiValue').textContent = `${sonuclar.helikopterOperasyonSuresiDk.toFixed(2)} dk`;
    document.getElementById('toplamMaliyetValue').textContent = `$${sonuclar.toplamMaliyet.toLocaleString('en-US', {maximumFractionDigits: 0})}`;
    document.getElementById('tespitBasinaMaliyet').textContent = sonuclar.tespitBasinaMaliyet > 0 ? `$${sonuclar.tespitBasinaMaliyet.toLocaleString('en-US', {maximumFractionDigits: 2})}` : '$0';
    
    const isOptimizationRelevant = params.rotaOptimizasyonuEtkin && sonuclar.kazanilanSureDk > 0.005;
    const optGroup = document.querySelector('.optimization-metric-group');
    optGroup.style.display = isOptimizationRelevant ? 'grid' : 'none';
    optGroup.nextElementSibling.style.display = isOptimizationRelevant ? 'grid' : 'none';
    if(isOptimizationRelevant){
        document.getElementById('kazanilanSure').textContent = `${sonuclar.kazanilanSureDk.toFixed(2)} dk`;
        document.getElementById('helikopterOperasyonSuresiUnoptimizedInfo').textContent = `(Optimizasyon olmasaydı süre yaklaşık ${sonuclar.helikopterOperasyonSuresiUnoptimizedDk.toFixed(2)} dk olacaktı.)`;
    }

    const optMaliyetEl = document.getElementById('optimizasyonMaliyetKazanci');
    const optMaliyetLabelEl = optMaliyetEl.previousElementSibling;
    const hrAfterOptMaliyet = optMaliyetEl.nextElementSibling;
    const maliyetDisplayStyle = isOptimizationRelevant ? '' : 'none';

    optMaliyetEl.style.display = maliyetDisplayStyle;
    if (optMaliyetLabelEl) optMaliyetLabelEl.style.display = maliyetDisplayStyle;
    if (hrAfterOptMaliyet && hrAfterOptMaliyet.tagName === 'HR') hrAfterOptMaliyet.style.display = maliyetDisplayStyle;

    if(isOptimizationRelevant){
        optMaliyetEl.textContent = `$${sonuclar.optimizasyonMaliyetKazanci.toLocaleString('en-US', {maximumFractionDigits: 0})}`;
    }

    const sonobuoyPlacementNoteElement = document.getElementById('sonobuoyPlacementNote');
    sonobuoyPlacementNoteElement.style.display = sonuclar.gridPatternPlacementNote ? 'block' : 'none';
    sonobuoyPlacementNoteElement.textContent = sonuclar.gridPatternPlacementNote || '';
    
    const sonobuoyYerlesimListesi = document.getElementById('sonobuoyYerlesimListesi');
    sonobuoyYerlesimListesi.innerHTML = '';
    sonuclar.sonobuoyKonumlariVeSirasi.forEach((sb, index) => {
        const li = document.createElement('li');
        li.textContent = `Sonobuoy ${index + 1}: (X: ${sb[0].toFixed(2)} NM, Y: ${sb[1].toFixed(2)} NM) - Atış Zamanı: ${sb[2].toFixed(2)} dk`;
        li.style.animationDelay = `${index * 0.1}s`;
        sonobuoyYerlesimListesi.appendChild(li);
    });

    document.getElementById('driftNote').style.display = params.akintiHizi > 0 ? 'block' : 'none';
    document.getElementById('addToComparisonBtn').disabled = false;
    document.getElementById('exportPdfBtn').disabled = false;
}
