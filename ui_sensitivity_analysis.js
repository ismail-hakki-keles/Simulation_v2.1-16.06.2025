/*
 * Denizaltı Tespit Simülasyonu
 * Copyright (c) 2025 İsmail Hakkı KELEŞ
 *
 * Bu proje MIT Lisansı altında lisanslanmıştır.
 * Lisansın tam metni için projenin kök dizinindeki LICENSE dosyasına bakın.
 * GitHub: https://github.com/knnchw/Simulation_v2.1-16.06.2025
 */

// --- KULLANICI ARABİRİMİ: DUYARLILIK ANALİZİ KONTROLÜ ---
"use strict";

// let isSensitivityAnalysisRunning = false; // BU SATIR KALDIRILDI!

function setupSensitivityAnalysis() {
    const saEnableAnalysisCheckbox = document.getElementById('saEnableAnalysis');
    const saRunButton = document.getElementById('saRunButton');
    const saParameterSelect = document.getElementById('saParameter');
    
    populateSAParameterSelect();

    if (saEnableAnalysisCheckbox) {
        saEnableAnalysisCheckbox.addEventListener('change', handleSAEnableChange);
    }
    if (saRunButton) {
        saRunButton.addEventListener('click', runSensitivityAnalysis);
    }
    if (saParameterSelect) {
        saParameterSelect.addEventListener('change', handleSAParameterChange);
    }
}

function populateSAParameterSelect() {
    const saParameterSelect = document.getElementById('saParameter');
    if (!saParameterSelect) return;
    
    const saNumericParams = inputsToValidate.filter(p =>(p.type === 'float' || p.type === 'int') && !['simulasyonDenizaltiYolSayisi', 'ornekYolSayisi', 'akintiYonu', 'helikopterStartX', 'helikopterStartY'].includes(p.id));
    saNumericParams.forEach(paramDef => {
        const option = document.createElement('option');
        option.value = paramDef.id;
        option.textContent = paramDef.name;
        const originalInput = document.getElementById(paramDef.id);
        if (originalInput) {
            option.dataset.step = originalInput.step || (paramDef.type === 'int' ? '1' : '0.1');
            option.dataset.min = originalInput.min === '' ? '0' : originalInput.min;
            option.dataset.max = originalInput.max || '';
            option.dataset.dependsOn = paramDef.dependsOn || '';
        }
        saParameterSelect.appendChild(option);
    });
}

function handleSAEnableChange() {
    const isEnabled = document.getElementById('saEnableAnalysis').checked;
    document.getElementById('saControls').style.display = isEnabled ? 'block' : 'none';
    if (!isEnabled) {
        document.getElementById('sensitivityGraph').style.display = 'none';
        document.getElementById('saStatus').textContent = '';
    } else {
        handleSAParameterChange();
    }
}

function handleSAParameterChange() {
    const saParameterSelect = document.getElementById('saParameter');
    const saStartValueInput = document.getElementById('saStartValue');
    const saEndValueInput = document.getElementById('saEndValue');
    const selectedOption = saParameterSelect.options[saParameterSelect.selectedIndex];
    if (!selectedOption) return;

    const paramId = selectedOption.value;
    const currentValEl = document.getElementById(paramId);
    if (!currentValEl) return;
    
    const currentVal = parseFloat(currentValEl.value) || 0;
    const step = parseFloat(selectedOption.dataset.step) || 1;
    const minVal = parseFloat(selectedOption.dataset.min);
    
    let startVal = currentVal - 2 * step;
    let endVal = currentVal + 2 * step;
    if (paramId === 'sonarTespitBasariOrani' || paramId === 'denizaltiRotaSapmaYuzdesi') {
        startVal = Math.max(0, currentVal - 0.2);
        endVal = Math.min(1, currentVal + 0.2);
    } else {
        if (!isNaN(minVal)) startVal = Math.max(minVal, startVal);
    }
    
    const precision = step.toString().includes('.') ? step.toString().split('.')[1].length : 0;
    saStartValueInput.value = startVal.toFixed(precision);
    saEndValueInput.value = endVal.toFixed(precision);
    saStartValueInput.step = step;
    saEndValueInput.step = step;
}

async function runSensitivityAnalysis() {
    if (isSimulationRunning || isSensitivityAnalysisRunning || isEfficiencyAnalysisRunning || isOptimizationRunning) {
        showUserMessage("Mevcut bir simülasyon veya analiz çalışıyor.", 'error');
        return;
    }

    isSensitivityAnalysisRunning = true;
    const saStatusElement = document.getElementById('saStatus');
    const saRunButton = document.getElementById('saRunButton');
    const sensitivityGraphDiv = document.getElementById('sensitivityGraph');
    
    saStatusElement.textContent = 'Duyarlılık analizi başlatılıyor...';
    saRunButton.classList.add('loading');
    document.getElementById('runSimBtn').disabled = true;
    document.getElementById('eaRunButton').disabled = true;
    document.getElementById('optRunButton').disabled = true;

    sensitivityGraphDiv.innerHTML = '';
    sensitivityGraphDiv.style.display = 'none';
    
    try {
        const baselineParams = validateAndGetParams();
        if (!baselineParams) {
            throw new Error('Ana formdaki parametreler geçersiz.');
        }

        const primaryMetricSA = document.getElementById('saOutputMetric').value;
        const secondaryMetricSA = document.getElementById('saOutputMetricSecondary').value;
        if (secondaryMetricSA !== 'none' && primaryMetricSA === secondaryMetricSA) {
            throw new Error("Birincil ve ikincil metrikler farklı olmalıdır.");
        }

        const varyingParamId = document.getElementById('saParameter').value;
        const startVal = parseFloat(document.getElementById('saStartValue').value);
        const endVal = parseFloat(document.getElementById('saEndValue').value);
        let numSteps = parseInt(document.getElementById('saNumSteps').value);
        if (isNaN(startVal) || isNaN(endVal) || numSteps < 2 || numSteps > 20 || startVal > endVal) {
            throw new Error('Geçersiz analiz aralığı veya adım sayısı (2-20).');
        }

        const paramValuesToTest = [];
        const stepSize = (numSteps > 1) ? (endVal - startVal) / (numSteps - 1) : 0;
        for (let i = 0; i < numSteps; i++) {
            paramValuesToTest.push(startVal + i * stepSize);
        }

        const saMcYolSayisi = Math.max(100, Math.min(250, Math.floor(baselineParams.simulasyonDenizaltiYolSayisi / 4)));
        const saYolKontrolNoktasiSayisiSim = (baselineParams.denizaltiYolDetaySeviyesi === "dusuk") ? 100 : 250;
        
        const baselineResultsSA = await calculateBaselineForSA(baselineParams, primaryMetricSA, secondaryMetricSA, saMcYolSayisi, saYolKontrolNoktasiSayisiSim, baselineParams.rotaOptimizasyonuEtkin, baselineParams.isDatumKnown, (status) => saStatusElement.textContent = status);
        if (baselineResultsSA.error) throw new Error(`Temel değer hesaplanamadı: ${baselineResultsSA.error}`);

        const analysisResults = await runSensitivityAnalysisStepByStep(baselineParams, varyingParamId, paramValuesToTest, primaryMetricSA, secondaryMetricSA, saMcYolSayisi, saYolKontrolNoktasiSayisiSim, baselineParams.rotaOptimizasyonuEtkin, baselineParams.isDatumKnown, 2, (status) => saStatusElement.textContent = status, () => {});
        if (analysisResults.errorOccurred) throw new Error(analysisResults.errorMessage);

        const saParameterSelect = document.getElementById('saParameter');
        const outputMetricSelect = document.getElementById('saOutputMetric');
        const outputMetricSecondarySelect = document.getElementById('saOutputMetricSecondary');
        
        plotSensitivityGraph(
            saParameterSelect.options[saParameterSelect.selectedIndex].text,
            paramValuesToTest,
            analysisResults.primaryResults,
            outputMetricSelect.options[outputMetricSelect.selectedIndex].text,
            'sensitivityGraph',
            analysisResults.secondaryResults,
            secondaryMetricSA !== 'none' ? outputMetricSecondarySelect.options[outputMetricSecondarySelect.selectedIndex].text : null,
            baselineResultsSA.primary,
            baselineResultsSA.secondary
        );
        saStatusElement.textContent = 'Duyarlılık analizi tamamlandı.';
    } catch (error) {
        saStatusElement.textContent = `Hata: ${error.message}`;
    } finally {
        isSensitivityAnalysisRunning = false;
        saRunButton.classList.remove('loading');
        document.getElementById('runSimBtn').disabled = false;
        document.getElementById('eaRunButton').disabled = !document.getElementById('eaEnableAnalysis').checked;
        document.getElementById('optRunButton').disabled = !document.getElementById('optEnableAnalysis').checked;
    }
}
