/*
 * Denizaltı Tespit Simülasyonu
 * Copyright (c) 2025 İsmail Hakkı KELEŞ
 *
 * Bu proje MIT Lisansı altında lisanslanmıştır.
 * Lisansın tam metni için projenin kök dizinindeki LICENSE dosyasına bakın.
 * GitHub: https://github.com/knnchw/Simulation_v2.1-16.06.2025
 */

// --- SABİTLER VE GENEL AYARLAR ---
"use strict";

const METERS_PER_NAUTICAL_MILE = 1852;
const CIRCLE_SEGMENTS_2D = 100; // 2D'de sonobuoy algılama dairesi için segment sayısı
const SPHERE_SEGMENTS_3D = 20;  // 3D'de sonobuoy algılama küresi için segment sayısı
const HELO_ALTITUDE_NM_3D = 0.05; // 3D görselleştirmede helikopterin deniz yüzeyinden yüksekliği (NM)
const STATIC_TARGET_DETECTION_STEPS_PER_BUOY_LIFE = 60; // Sabit hedef için sonobuoy ömrü boyunca yapılacak tespit kontrolü adım sayısı

// Bu değişken, ui_controller.js içinde tanımlanacak ve yönetilecek,
// ancak global bir bayrak olduğu için burada da belirtmekte fayda var.
// let isSensitivityAnalysisRunning = false;
