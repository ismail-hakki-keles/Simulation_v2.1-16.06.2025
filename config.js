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

// Otomatik "Yönetici Özeti" ve "Sonuç Yorumu" için analist eşik değerleri
const analystThresholds = {
    highDetectionProb: 85, // Yüksek tespit olasılığı sınırı (%)
    lowDetectionProb: 30,  // Düşük tespit olasılığı sınırı (%)
    
    // Tespit başına maliyet, toplam maliyetin bu katından fazlaysa "verimsiz" kabul edilir.
    // Genellikle başarılı tespit sayısı çok düşük olduğunda bu durum oluşur.
    inefficientCostPerDetectionMultiplier: 1.0, 
    
    // Tespit başına maliyet, (tek bir sonobuoy maliyeti * bu kat) değerinden az ise "çok verimli" kabul edilir.
    efficientCostPerDetectionMultiplier: 5.0, 
    
    // Tek bir sonobuoy'un toplam tespitler içindeki payı bu oranı geçerse "dengesiz kullanım" olarak yorumlanır.
    singleBuoyDominanceRatio: 0.40, // %
    
    // Helikopterin toplam operasyon süresinin ne kadarlık bir kısmı intikalde geçerse "verimsiz kullanım" olarak yorumlanır.
    highTransitTimeRatio: 0.50, // %
    
    // Rota optimizasyonunun bu dakikadan fazla kazanç sağlaması "önemli" olarak kabul edilir.
    significantOptimizationGainMinutes: 20,
    
    // Tespit olasılığı için %95 güven aralığının genişliği (üst - alt) bu değeri aşarsa "belirsiz" olarak yorumlanır.
    wideConfidenceInterval: 20 // %
};
