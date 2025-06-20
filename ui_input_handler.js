/*
 * Denizaltı Tespit Simülasyonu
 * Copyright (c) 2025 İsmail Hakkı KELEŞ
 *
 * Bu proje MIT Lisansı altında lisanslanmıştır.
 * Lisansın tam metni için projenin kök dizinindeki LICENSE dosyasına bakın.
 * GitHub: https://github.com/knnchw/Simulation_v2.1-16.06.2025
 */


// --- KULLANICI ARABİRİMİ: GİRDİ VE SENARYO YÖNETİMİ ---
"use strict";

const inputsToValidate = [
    { id: 'sahaUzunluk', name: 'Saha Uzunluğu', type: 'float', min: 1, step: '1' },
    { id: 'sahaGenislik', name: 'Saha Genişliği', type: 'float', min: 1, step: '1' },
    { id: 'datumX', name: 'Datum X Koordinatı', type: 'float', min: 0, step: '0.1', dependsOn: 'datumBilgisiMevcut' },
    { id: 'datumY', name: 'Datum Y Koordinatı', type: 'float', min: 0, step: '0.1', dependsOn: 'datumBilgisiMevcut' },
    { id: 'sonobuoyAdedi', name: 'Sonobuoy Adedi', type: 'int', min: 1, step: '1' },
    { id: 'sonarYaricap', name: 'Sonar Yarıçapı', type: 'float', min: 0.1, step: '0.1' },
    { id: 'sonobuoyCalismaSuresi', name: 'Sonobuoy Çalışma Süresi', type: 'float', min: 1, step: '10' },
    { id: 'sonobuoyDinlemeDerinligi', name: 'Sonobuoy Dinleme Derinliği', type: 'float', min: 0, step: '10' },
    { id: 'sonobuoyBirakmaSuresi', name: 'Sonobuoy Bırakma Süresi', type: 'float', min: 0.1, step: '0.1' },
    { id: 'helikopterSurat', name: 'Helikopter Sürati', type: 'float', min: 1, step: '10' },
    { id: 'helikopterStartX', name: 'Helikopter Başlangıç X', type: 'float', min: 0, step: '0.1' },
    { id: 'helikopterStartY', name: 'Helikopter Başlangıç Y', type: 'float', min: 0, step: '0.1' },
    { id: 'helikopterTasiyabilecegiKapasite', name: 'Helikopter Taşıma Kapasitesi', type: 'int', min: 1, step: '1' },
    { id: 'sonobuoyIkmalSuresiDk', name: 'Sonobuoy İkmal Süresi', type: 'float', min: 0, step: '1' },
    { id: 'denizaltiSurati', name: 'Denizaltı Sürati', type: 'float', min: 0, step: '1' },
    { id: 'denizaltiOrtDerinlik', name: 'Denizaltı Ortalama Derinlik', type: 'float', min: 0, step: '10' },
    { id: 'denizaltiDerinlikSapma', name: 'Denizaltı Derinlik Sapma', type: 'float', min: 0, step: '5' },
    { id: 'denizaltiRotaSapmaYuzdesi', name: 'Denizaltı Y Rota Sapma Oranı', type: 'float', min: 0, max: 1, step: '0.01' },
    { id: 'akintiHizi', name: 'Akıntı Sürati', type: 'float', min: 0, step: '0.1' },
    { id: 'akintiYonu', name: 'Akıntı Yönü', type: 'float', min: 0, max: 360, step: '1' },
    { id: 'sonarTespitBasariOrani', name: 'Sonar Tespit Başarı Oranı', type: 'float', min: 0, max: 1, step: '0.01' },
    { id: 'costHeloHour', name: 'Birim Uçuş Saati Maliyeti', type: 'float', min: 0 },
    { id: 'costSonobuoy', name: 'Sonobuoy Başına Maliyet', type: 'float', min: 0 },
    { id: 'personelSaatlikMaliyet', name: 'Personel Saatlik Maliyeti', type: 'float', min: 0 },
    { id: 'ucusSaatiBasinaBakimMaliyeti', name: 'Uçuş Saati Başına Bakım Maliyeti', type: 'float', min: 0 },
    { id: 'simulasyonDenizaltiYolSayisi', name: 'Monte Carlo Yol Sayısı', type: 'int', min: 100, step: '100' },
    { id: 'ornekYolSayisi', name: 'Grafik İçin Örnek Yol Sayısı', type: 'int', min: 2, max: 100, step: '1' }
];

function showUserMessage(message, type = 'info', duration = 3000) {
    const userMessagesArea = document.getElementById('userMessagesArea');
    if (!userMessagesArea) return;
    userMessagesArea.textContent = message;
    userMessagesArea.className = type === 'error' ? 'user-message-info error' : 'user-message-info';
    userMessagesArea.style.display = 'block';
    setTimeout(() => { userMessagesArea.style.display = 'none'; }, duration);
}

function clearForm() {
    inputsToValidate.forEach(inputDef => {
        const element = document.getElementById(inputDef.id);
        if (element) element.value = '';
    });
    document.getElementById('datumBilgisiMevcut').checked = false;
    document.getElementById('rotaOptimizasyonuEtkin').checked = false;
    document.getElementById('sonobuoyYerlesimPaterni').value = 'grid';
    document.getElementById('denizaltiYolDetaySeviyesi').value = 'orta';
    document.getElementById('gorsellestirmeTipi').value = '2d';
    document.getElementById('datumBilgisiMevcut').dispatchEvent(new Event('change'));
    showUserMessage('Tüm form alanları temizlendi.', 'info');
}

function validateAndGetParams() {
    let hasError = false;
    const params = {};
    document.querySelectorAll('.error-message').forEach(el => el.textContent = '');
    document.getElementById('simulationErrorArea').style.display = 'none';
    document.getElementById('sonobuoyPlacementNote').style.display = 'none';

    inputsToValidate.forEach(inputDef => {
        const element = document.getElementById(inputDef.id);
        const errorSpan = document.getElementById(`${inputDef.id}Error`);
        if (!element) { hasError = true; return; }

        if (inputDef.dependsOn && !document.getElementById(inputDef.dependsOn).checked) {
            params[inputDef.id] = null;
            return;
        }

        if (element.value === "") {
            hasError = true;
            if (errorSpan) errorSpan.textContent = `${inputDef.name} boş bırakılamaz.`;
            return;
        }

        const value = (inputDef.type === 'int') ? parseInt(element.value) : parseFloat(element.value);

        if (isNaN(value)) {
            hasError = true;
            if (errorSpan) errorSpan.textContent = `${inputDef.name} geçerli bir sayı olmalıdır.`;
            return;
        }

        const min = (inputDef.min !== undefined) ? parseFloat(inputDef.min) : undefined;
        let max = (inputDef.max !== undefined) ? parseFloat(inputDef.max) : undefined;
        if (inputDef.id === 'datumX') max = parseFloat(document.getElementById('sahaUzunluk').value);
        if (inputDef.id === 'datumY') max = parseFloat(document.getElementById('sahaGenislik').value);

        if (min !== undefined && value < min) {
            hasError = true;
            if (errorSpan) errorSpan.textContent = `${inputDef.name} değeri ${min}'den küçük olamaz.`;
        }
        if (max !== undefined && value > max) {
            if (!(inputDef.id === 'akintiYonu' && value === 360)) {
                 hasError = true;
                 if (errorSpan) errorSpan.textContent = `${inputDef.name} değeri ${max.toFixed(1)}'den büyük olamaz.`;
            }
        }
        params[inputDef.id] = (inputDef.id === 'akintiYonu' && value === 360) ? 0 : value;
    });
    
    if (document.getElementById('denizaltiSurati').value == 0 && !document.getElementById('datumBilgisiMevcut').checked) {
        hasError = true;
        document.getElementById('denizaltiSuratiError').textContent = `Sürat 0 ise 'Datum Bilgisi Mevcut mu?' işaretli olmalıdır.`;
    }

    params.gorsellestirmeTipi = document.getElementById('gorsellestirmeTipi').value;
    params.sonobuoyYerlesimPaterni = document.getElementById('sonobuoyYerlesimPaterni').value;
    params.rotaOptimizasyonuEtkin = document.getElementById('rotaOptimizasyonuEtkin').checked;
    params.isDatumKnown = document.getElementById('datumBilgisiMevcut').checked;
    params.denizaltiYolDetaySeviyesi = document.getElementById('denizaltiYolDetaySeviyesi').value;
    
    return hasError ? null : params;
}

function populateForm(params) {
    for (const key in params) {
        const element = document.getElementById(key);
        if (element) {
            element[element.type === 'checkbox' ? 'checked' : 'value'] = params[key];
            if (element.type === 'checkbox') element.dispatchEvent(new Event('change'));
        }
    }
}
