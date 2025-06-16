// --- KULLANICI ARABİRİMİ: ANA KONTROLCÜ VE BAŞLATICILAR ---
"use strict";

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
    
    // --- SİMÜLASYON VE DUYARLILIK ANALİZİ BAŞLATICILARI ---
    setupSimulationRunner();
    setupSensitivityAnalysis();

    // --- SONUÇ DIŞA AKTARMA ---
    document.getElementById('exportCsvBtn').addEventListener('click', () => {
        if(!lastSimulationResults || !lastSimulationParams){ return; }
        let csvContent = "data:text/csv;charset=utf-8,Metrik,Deger\r\n";
        csvContent += `Tespit Olasiligi (%),${lastSimulationResults.tespitOlasiligiYuzde}\r\n`;
        // ... diğer metrikler eklenebilir
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "simulasyon_sonuclari.csv");
        document.body.appendChild(link);
        link.click();
        link.remove();
    });

    document.getElementById('exportPdfBtn').addEventListener('click', () => {
        if (!lastSimulationResults || !lastSimulationParams) {
            showUserMessage('Rapor için önce simülasyon çalıştırılmalı.', 'error');
            return;
        }
        const leanResults = JSON.parse(JSON.stringify(lastSimulationResults));
        if(leanResults.denizaltiYollariVeTespitDurumu) {
            leanResults.denizaltiYollariVeTespitDurumu.forEach(yol => { if (yol) yol[0] = []; });
        }
        sessionStorage.setItem('simulationReportData', JSON.stringify({params: lastSimulationParams, results: leanResults}));
        window.open('report.html', '_blank');
    });

    // --- BAŞLANGIÇ AYARLARI ---
    clearForm(); 
});