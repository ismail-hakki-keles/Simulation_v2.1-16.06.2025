/*
 * Denizaltı Tespit Simülasyonu
 * Copyright (c) 2025 İsmail Hakkı KELEŞ
 *
 * Bu proje MIT Lisansı altında lisanslanmıştır.
 * Lisansın tam metni için projenin kök dizinindeki LICENSE dosyasına bakın.
 * GitHub: https://github.com/knnchw/Simulation_v2.1-16.06.2025
 */

// --- SENARYO OPTİMİZASYON MOTORU (GENETİK ALGORİTMA) ---
"use strict";

class GeneticOptimizer {
    constructor(config, baseParams, progressCallback) {
        this.config = config;
        this.baseParams = baseParams;
        this.progressCallback = progressCallback;
        this.population = [];
        this.bestIndividual = null;
        this.bestFitness = -Infinity; // Minimize etme durumları için -1 yerine -Infinity
    }

    // 1. Başlangıç Popülasyonunu Oluştur
    initializePopulation() {
        for (let i = 0; i < this.config.populationSize; i++) {
            this.population.push({
                params: {
                    sonobuoyAdedi: this.getRandomInt('sonobuoyCount'),
                    sonarYaricap: this.getRandomFloat('sonarRadius'),
                },
                fitness: 0,
                results: null,
            });
        }
    }

    // 2. Popülasyonun Uygunluğunu Değerlendir
    async evaluateFitness() {
        for (let i = 0; i < this.population.length; i++) {
            const individual = this.population[i];
            const simParams = { ...this.baseParams, ...individual.params };
            
            try {
                const results = hesaplaTespitOlasiligiVeMaliyetJS(
                    simParams.sahaUzunluk, simParams.sahaGenislik, simParams.sonarYaricap, simParams.sonobuoyAdedi,
                    simParams.sonobuoyYerlesimPaterni, simParams.helikopterSurat, simParams.helikopterStartX, simParams.helikopterStartY,
                    simParams.sonobuoyBirakmaSuresi, simParams.denizaltiSurati, simParams.sonobuoyCalismaSuresi,
                    simParams.sonobuoyDinlemeDerinligi, simParams.denizaltiOrtDerinlik, simParams.denizaltiDerinlikSapma,
                    simParams.denizaltiRotaSapmaYuzdesi, simParams.sonarTespitBasariOrani, 100, 250,
                    simParams.akintiHizi, simParams.akintiYonu, simParams.helikopterTasiyabilecegiKapasite,
                    simParams.sonobuoyIkmalSuresiDk, simParams.rotaOptimizasyonuEtkin, simParams.isDatumKnown,
                    simParams.datumX, simParams.datumY, simParams.costHeloHour, simParams.costSonobuoy,
                    simParams.personelSaatlikMaliyet, simParams.ucusSaatiBasinaBakimMaliyeti,
                    null, true
                );
                
                individual.results = results;
                let fitness = 0;

                switch (this.config.objective) {
                    case 'maximize_detection_prob':
                        fitness = results.tespitOlasiligiYuzde;
                        // Kısıt kontrolü ve dinamik ceza
                        if (results.toplamMaliyet > this.config.maxCost) {
                            const overageRatio = (results.toplamMaliyet - this.config.maxCost) / this.config.maxCost;
                            const penaltyFactor = 1 - overageRatio;
                            fitness *= Math.max(0.1, penaltyFactor); // %10 taban fitness
                        }
                        break;
                    
                    case 'minimize_cost':
                        if (results.tespitOlasiligiYuzde < this.config.targetPd) {
                            fitness = 0; // Hedefe ulaşamayanları ağır cezalandır
                        } else {
                            // Maliyet 0 olabileceğinden, 1 ekleyerek sıfıra bölmeyi önle
                            fitness = 1 / (1 + results.toplamMaliyet);
                        }
                        break;

                    case 'maximize_ratio':
                        if (results.toplamMaliyet > 0) {
                            fitness = results.tespitOlasiligiYuzde / results.toplamMaliyet;
                        } else {
                            fitness = results.tespitOlasiligiYuzde > 0 ? Infinity : 0; // Maliyet 0 ise ve tespit varsa fitness sonsuz
                        }
                        break;
                }
                individual.fitness = fitness;

            } catch (error) {
                console.warn("Fitness evaluation failed for an individual:", error.message);
                individual.fitness = -Infinity; // Hata alan bireyi cezalandır
            }
        }
    }

    // 3. Yeni Nesil İçin Ebeveynleri Seç
    selection() {
        // Turnuva Seçimi
        const tournamentSize = 3;
        const newPopulation = [];
        for (let i = 0; i < this.config.populationSize; i++) {
            let tournament = [];
            for (let j = 0; j < tournamentSize; j++) {
                tournament.push(this.population[Math.floor(Math.random() * this.population.length)]);
            }
            newPopulation.push(tournament.reduce((best, current) => (current.fitness > best.fitness) ? current : best));
        }
        this.population = newPopulation;
    }

    // 4. Çaprazlama (Crossover)
    crossover() {
        const offspring = [];
        for (let i = 0; i < this.config.populationSize; i += 2) {
            if (i + 1 >= this.config.populationSize) {
                 if (this.config.populationSize % 2 !== 0 && i < this.config.populationSize) {
                    offspring.push(this.population[i]);
                }
                break;
            }
            const parent1 = this.population[i];
            const parent2 = this.population[i + 1];

            // Tek noktalı çaprazlama
            const child1Params = { sonobuoyAdedi: parent1.params.sonobuoyAdedi, sonarYaricap: parent2.params.sonarYaricap };
            const child2Params = { sonobuoyAdedi: parent2.params.sonobuoyAdedi, sonarYaricap: parent1.params.sonarYaricap };

            offspring.push({ params: child1Params, fitness: 0, results: null });
            offspring.push({ params: child2Params, fitness: 0, results: null });
        }
        this.population = offspring;
    }

    // 5. Mutasyon
    mutation() {
        this.population.forEach(individual => {
            if (Math.random() < this.config.mutationRate / 100) {
                individual.params.sonobuoyAdedi = this.getRandomInt('sonobuoyCount');
            }
            if (Math.random() < this.config.mutationRate / 100) {
                individual.params.sonarYaricap = this.getRandomFloat('sonarRadius');
            }
        });
    }

    // Ana Optimizasyon Döngüsü
    async run() {
        this.initializePopulation();
        
        for (let gen = 0; gen < this.config.generations; gen++) {
            await this.evaluateFitness();

            // En iyi bireyi güncelle
            const currentBest = this.population.reduce((best, current) => ((current.fitness > (best.fitness || -Infinity))) ? current : best, { fitness: -Infinity });
            
            if (currentBest.fitness > this.bestFitness) {
                this.bestFitness = currentBest.fitness;
                this.bestIndividual = JSON.parse(JSON.stringify(currentBest)); // Deep copy
            }

            // İlerlemeyi raporla
            this.progressCallback({
                generation: gen + 1,
                totalGenerations: this.config.generations,
                bestFitness: this.bestFitness,
                bestIndividual: this.bestIndividual
            });
            
            // Son nesilde evrim adımlarını atla
            if (gen === this.config.generations - 1) break;

            // Elitizm: En iyi bireyi doğrudan sonraki nesle aktar
            const elite = JSON.parse(JSON.stringify(this.bestIndividual));

            this.selection();
            this.crossover();
            this.mutation();
            
            // Elit bireyi koru
            if (this.population.length > 0) {
                this.population[0] = elite;
            } else { // Eğer popülasyon tek sayıdaysa crossover sonrası boş kalabilir
                this.population.push(elite);
            }
        }
        
        return this.bestIndividual;
    }

    // Yardımcı Fonksiyonlar
    getRandomInt(paramKey) {
        return Math.floor(Math.random() * (this.config.searchSpace[paramKey].max - this.config.searchSpace[paramKey].min + 1)) + this.config.searchSpace[paramKey].min;
    }
    getRandomFloat(paramKey) {
        return Math.random() * (this.config.searchSpace[paramKey].max - this.config.searchSpace[paramKey].min) + this.config.searchSpace[paramKey].min;
    }
}
