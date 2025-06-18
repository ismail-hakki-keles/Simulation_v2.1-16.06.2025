/*
 * Denizaltı Tespit Simülasyonu
 * Copyright (c) 2025 İsmail Hakkı KELEŞ
 *
 * Bu proje MIT Lisansı altında lisanslanmıştır.
 * Lisansın tam metni için projenin kök dizinindeki LICENSE dosyasına bakın.
 * GitHub: https://github.com/knnchw/Simulation_v2.1-16.06.2025
 */

// --- KULLANICI ARABİRİMİ: ANA KONTROLCÜ VE BAŞLATICILAR ---
"use strict";

// --- MERKEZİ KONTROL DEĞİŞKENLERİ ---
let comparisonScenarios = [];
let isSimulationRunning = false;
let isSensitivityAnalysisRunning = false;
let isEfficiencyAnalysisRunning = false;
let isOptimizationRunning = false;


document.addEventListener('DOMContentLoaded', () => {
    
    // --- METODOLOJİ MODAL PENCERESİ KONTROLÜ ---
    const modal = document.getElementById('methodologyModal');
    const btn = document.getElementById('methodologyBtn');
    const span = document.getElementsByClassName('modal-close-btn')[0];

    if(btn) {
        btn.onclick = () => {
            modal.style.display = 'block';
        }
    }
    if(span) {
        span.onclick = () => {
            modal.style.display = 'none';
        }
    }
    window.onclick = (event) => {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    }

    // --- GİRDİ VE SENARYO YÖNETİCİSİ OLAY DİNLEYİCİLERİ ---
    document.getElementById('saveSettingsBtn').addEventListener('click', () => {
        const params = validateAndGetParams();
        if (params) {
            localStorage.setItem('submarineSimParams', JSON.stringify(params));
            showUserMessage('Ayarlar başarıyla kaydedildi.', 'info');
        } else {
            showUserMessage('Geçersiz parametreler, ayarlar kaydedilemedi.', 'error');
        }
    });

    document.getElementById('loadSettingsBtn').addEventListener('click', () => {
        const savedParams = localStorage.getItem('submarineSimParams');
        if (savedParams) {
            populateForm(JSON.parse(savedParams));
            showUserMessage('Kaydedilen ayarlar yüklendi.', 'info');
        } else {
            showUserMessage('Kaydedilmiş ayar bulunamadı.', 'error');
        }
    });
    
    document.getElementById('resetSettingsBtn').addEventListener('click', clearForm);

    document.getElementById('exportScenarioBtn').addEventListener('click', () => {
        const params = validateAndGetParams();
        if(params){
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(params, null, 2));
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", dataStr);
            downloadAnchorNode.setAttribute("download", "simulasyon_senaryo.json");
            document.body.appendChild(downloadAnchorNode);
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
        } else {
             showUserMessage('Geçersiz parametreler, dışa aktarılamadı.', 'error');
        }
    });

    document.getElementById('importScenarioBtn').addEventListener('click', () => document.getElementById('importScenarioInput').click());
    
    document.getElementById('importScenarioInput').addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                populateForm(JSON.parse(e.target.result));
                showUserMessage('Senaryo başarıyla içe aktarıldı.', 'info');
            } catch(error) {
                showUserMessage('JSON dosyası okunamadı veya formatı bozuk.', 'error');
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    });
    
    document.getElementById('datumBilgisiMevcut').addEventListener('change', (e) => {
        const isChecked = e.target.checked;
        document.getElementById('datumInputsContainer').style.display = isChecked ? 'block' : 'none';
        const paternSelect = document.getElementById('sonobuoyYerlesimPaterni');
        paternSelect.disabled = isChecked;
        if (isChecked) {
            paternSelect.value = 'circular';
        } else if (paternSelect.value === 'circular') {
            paternSelect.value = 'grid';
        }
    });
    
    // --- SİMÜLASYON VE ANALİZ BAŞLATICILARI ---
    setupSimulationRunner();
    setupSensitivityAnalysis();
    setupEfficiencyAnalysis();
    setupOptimization();

    // --- SONUÇ VE KARŞILAŞTIRMA YÖNETİMİ ---
    document.getElementById('exportPdfBtn').addEventListener('click', () => {
        if (!lastSimulationResults || !lastSimulationParams) {
            showUserMessage('Rapor için önce simülasyon çalıştırılmalı.', 'error');
            return;
        }
        const reportData = {
            type: 'single',
            data: {
                params: lastSimulationParams,
                results: cleanResultsForReport(lastSimulationResults)
            }
        };
        sessionStorage.setItem('simulationReportData', JSON.stringify(reportData));
        window.open('report.html', '_blank');
    });

    document.getElementById('addToComparisonBtn').addEventListener('click', () => {
        if (!lastSimulationResults || !lastSimulationParams) {
            showUserMessage('Karşılaştırmaya eklemek için geçerli bir sonuç bulunamadı.', 'error');
            return;
        }
        const scenarioName = `Senaryo ${comparisonScenarios.length + 1} (P(d): %${lastSimulationResults.tespitOlasiligiYuzde.toFixed(1)}, Maliyet: $${Math.round(lastSimulationResults.toplamMaliyet/1000)}k)`;
        
        comparisonScenarios.push({
            name: scenarioName,
            params: lastSimulationParams,
            results: cleanResultsForReport(lastSimulationResults)
        });
        
        updateComparisonBasketUI();
        showUserMessage(`"${scenarioName}" karşılaştırma sepetine eklendi.`, 'info');
    });

    document.getElementById('clearComparisonBtn').addEventListener('click', () => {
        comparisonScenarios = [];
        updateComparisonBasketUI();
        showUserMessage('Karşılaştırma sepeti temizlendi.', 'info');
    });

    document.getElementById('exportComparisonReportBtn').addEventListener('click', () => {
        if (comparisonScenarios.length < 2) {
            showUserMessage('Karşılaştırma raporu için en az 2 senaryo eklemelisiniz.', 'error');
            return;
        }
        const reportData = {
            type: 'comparison',
            data: comparisonScenarios
        };
        sessionStorage.setItem('simulationReportData', JSON.stringify(reportData));
        window.open('report.html', '_blank');
    });

    // --- BAŞLANGIÇ AYARLARI ---
    updateComparisonBasketUI();
    clearForm(); 
});

function updateComparisonBasketUI() {
    const listElement = document.getElementById('comparisonList');
    const reportButton = document.getElementById('exportComparisonReportBtn');

    // 1. Her durumda listenin içini temizleyerek başla.
    listElement.innerHTML = '';

    // 2. Sepette senaryo olup olmadığını kontrol et.
    if (comparisonScenarios.length > 0) {
        // 2a. Eğer senaryo VARSA, bunları listeye ekle.
        comparisonScenarios.forEach(scenario => {
            const listItem = document.createElement('li');
            listItem.textContent = scenario.name;
            listElement.appendChild(listItem);
        });
    } else {
        // 2b. Eğer senaryo YOKSA, bilgilendirme mesajı ekle.
        const emptyMessageItem = document.createElement('li');
        emptyMessageItem.textContent = 'Henüz karşılaştırılmaya eklenmiş senaryo yok.';
        // Mesajın farklı görünmesi için stil ekleyelim.
        emptyMessageItem.style.fontStyle = 'italic';
        emptyMessageItem.style.color = '#9ca3af';
        emptyMessageItem.style.borderLeft = 'none';
        listElement.appendChild(emptyMessageItem);
    }

    // 3. Rapor butonunun durumunu güncelle (bu kısım aynı).
    reportButton.disabled = comparisonScenarios.length < 2;
}

function cleanResultsForReport(results) {
    const leanResults = JSON.parse(JSON.stringify(results));
    
    // ÖNEMLİ DÜZELTME:
    // denizaltiYollariVeTespitDurumu dizisini KESİNLİKLE kısaltmıyoruz.
    // Çünkü tüm grafikler istatistiklerini bu tam dizi üzerinden hesaplıyor.
    // Sadece rapor sayfasında görselleştirilecek yol sayısını sınırlamak için
    // yol noktalarını (dizinin içindeki büyük veri) temizliyoruz.
    if (leanResults.denizaltiYollariVeTespitDurumu) {
        leanResults.denizaltiYollariVeTespitDurumu.forEach(yol => {
            if (yol && yol[0]) {
                yol[0] = []; // Sadece yol noktası verisini sil, ana sonucu koru.
            }
        });
    }

    // Helikopter hareket kaydını sadece gerekli verileri içerecek şekilde küçült
    if (leanResults.helikopterHareketKaydi) {
        leanResults.helikopterHareketKaydi = leanResults.helikopterHareketKaydi.map(seg => ({
            type: seg.type,
            startTimeDk: seg.startTimeDk,
            endTimeDk: seg.endTimeDk
        }));
    }
    
    return leanResults;
}

function setupEfficiencyAnalysis() {
    const eaEnableCheckbox = document.getElementById('eaEnableAnalysis');
    const eaRunButton = document.getElementById('eaRunButton');
    const allButtons = [document.getElementById('runSimBtn'), document.getElementById('saRunButton'), document.getElementById('optRunButton')];


    if (eaEnableCheckbox) {
        eaEnableCheckbox.addEventListener('change', () => {
            document.getElementById('eaControls').style.display = eaEnableCheckbox.checked ? 'block' : 'none';
             if (!eaEnableCheckbox.checked) {
                document.getElementById('efficiencyFrontierGraph').style.display = 'none';
            }
        });
    }

    if (eaRunButton) {
        eaRunButton.addEventListener('click', async () => {
            if (isSimulationRunning || isSensitivityAnalysisRunning || isOptimizationRunning) {
                showUserMessage("Mevcut bir simülasyon veya analiz çalışıyor.", 'error');
                return;
            }
            
            const baseParams = validateAndGetParams();
            if (!baseParams) {
                showUserMessage('Lütfen ana formdaki parametreleri geçerli değerlerle doldurun.', 'error');
                return;
            }
            
            const eaParams = {
                scenarioCount: parseInt(document.getElementById('eaScenarioCount').value),
                monteCarloRuns: parseInt(document.getElementById('eaMonteCarloRuns').value),
                sonobuoyCountMin: parseInt(document.getElementById('eaSonobuoyCountMin').value),
                sonobuoyCountMax: parseInt(document.getElementById('eaSonobuoyCountMax').value),
                sonarRadiusMin: parseFloat(document.getElementById('eaSonarRadiusMin').value),
                sonarRadiusMax: parseFloat(document.getElementById('eaSonarRadiusMax').value),
                detectionProbMin: parseFloat(document.getElementById('eaDetectionProbMin').value),
                detectionProbMax: parseFloat(document.getElementById('eaDetectionProbMax').value)
            };
            
            isEfficiencyAnalysisRunning = true;
            eaRunButton.classList.add('loading');
            allButtons.forEach(btn => { if(btn) btn.disabled = true; });
            
            document.getElementById('eaProgressContainer').style.display = 'block';
            document.getElementById('eaProgressBar').style.width = '0%';
            document.getElementById('eaProgressText').textContent = '0%';
            document.getElementById('efficiencyFrontierGraph').innerHTML = '';
            document.getElementById('efficiencyFrontierGraph').style.display = 'none';
            
            try {
                const results = await runEfficiencyAnalysis(baseParams, eaParams, (progress) => {
                    document.getElementById('eaProgressBar').style.width = `${progress}%`;
                    document.getElementById('eaProgressText').textContent = `Senaryolar çalıştırılıyor: ${Math.round(progress)}%`;
                });
                plotEfficiencyFrontier(results);
            } catch (err) {
                showUserMessage(`Etkinlik analizi sırasında hata: ${err.message}`, 'error');
            } finally {
                isEfficiencyAnalysisRunning = false;
                eaRunButton.classList.remove('loading');
                allButtons.forEach(btn => { if(btn) btn.disabled = false; });
                document.getElementById('saRunButton').disabled = !document.getElementById('saEnableAnalysis').checked;
                document.getElementById('optRunButton').disabled = !document.getElementById('optEnableAnalysis').checked;
                 setTimeout(() => {
                    document.getElementById('eaProgressContainer').style.display = 'none';
                }, 2000);
            }
        });
    }
}

function setupOptimization() {
    const optEnableCheckbox = document.getElementById('optEnableAnalysis');
    const optRunButton = document.getElementById('optRunButton');
    const allButtons = [document.getElementById('runSimBtn'), document.getElementById('saRunButton'), document.getElementById('eaRunButton')];

    if (optEnableCheckbox) {
        optEnableCheckbox.addEventListener('change', () => {
            document.getElementById('optControls').style.display = optEnableCheckbox.checked ? 'block' : 'none';
        });
    }

    if (optRunButton) {
        optRunButton.addEventListener('click', async () => {
            if (isSimulationRunning || isSensitivityAnalysisRunning || isEfficiencyAnalysisRunning) {
                showUserMessage("Mevcut bir simülasyon veya analiz çalışıyor.", 'error');
                return;
            }
            
            const baseParams = validateAndGetParams();
            if (!baseParams) {
                showUserMessage('Lütfen ana formdaki parametreleri geçerli değerlerle doldurun.', 'error');
                return;
            }

            const optimizerConfig = {
                populationSize: parseInt(document.getElementById('optPopulationSize').value),
                generations: parseInt(document.getElementById('optGenerations').value),
                mutationRate: parseFloat(document.getElementById('optMutationRate').value),
                maxCost: parseFloat(document.getElementById('optMaxCost').value),
                searchSpace: {
                    sonobuoyCount: { min: parseInt(document.getElementById('optSonobuoyCountMin').value), max: parseInt(document.getElementById('optSonobuoyCountMax').value) },
                    sonarRadius: { min: parseFloat(document.getElementById('optSonarRadiusMin').value), max: parseFloat(document.getElementById('optSonarRadiusMax').value) }
                }
            };

            isOptimizationRunning = true;
            optRunButton.classList.add('loading');
            allButtons.forEach(btn => { if(btn) btn.disabled = true; });
            
            const logElement = document.getElementById('optLog');
            const resultElement = document.getElementById('optBestResultText');
            const outputContainer = document.getElementById('optOutputContainer');
            logElement.innerHTML = 'Optimizasyon başlatılıyor...';
            resultElement.innerHTML = '';
            outputContainer.style.display = 'block';

            const progressCallback = (progress) => {
                logElement.innerHTML += `<p>Nesil ${progress.generation}/${progress.totalGenerations} | En İyi Olasılık: %${progress.bestFitness.toFixed(2)}</p>`;
                logElement.scrollTop = logElement.scrollHeight;
            };

            try {
                const optimizer = new GeneticOptimizer(optimizerConfig, baseParams, progressCallback);
                const bestSolution = await optimizer.run();
                
                resultElement.innerHTML = `<strong>Optimizasyon Tamamlandı!</strong><br>
                Bulunan en iyi senaryo:<br>
                - Tespit Olasılığı: <strong>%${bestSolution.results.tespitOlasiligiYuzde.toFixed(2)}</strong><br>
                - Toplam Maliyet: <strong>$${bestSolution.results.toplamMaliyet.toLocaleString('en-US')}</strong> (Kısıt: $${optimizerConfig.maxCost.toLocaleString('en-US')})<br>
                - Parametreler: Sonobuoy Adedi = <strong>${bestSolution.params.sonobuoyAdedi}</strong>, Sonar Yarıçapı = <strong>${bestSolution.params.sonarYaricap.toFixed(2)} NM</strong>`;
                
            } catch (err) {
                showUserMessage(`Optimizasyon sırasında hata: ${err.message}`, 'error');
                resultElement.innerHTML = `Optimizasyon bir hatayla durduruldu: ${err.message}`;
            } finally {
                isOptimizationRunning = false;
                optRunButton.classList.remove('loading');
                allButtons.forEach(btn => { if(btn) btn.disabled = false; });
                document.getElementById('saRunButton').disabled = !document.getElementById('saEnableAnalysis').checked;
                document.getElementById('eaRunButton').disabled = !document.getElementById('eaEnableAnalysis').checked;
            }
        });
    }
}
