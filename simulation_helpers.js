// --- YARDIMCI HESAPLAMA, HELİKOPTER VE PATERN FONKSİYONLARI ---
"use strict";

// --- YARDIMCI HESAPLAMA FONKSİYONLARI ---
function calculateDistanceSquared(p1, p2) {
    return Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2);
}

function calculateHelicopterPathDuration(
    dropOrder, heloStartX, heloStartY, heloSpeedKnot,
    dropTimePerSonobuoyDk, heloCapacity, refuelTimeDk
) {
    if (!dropOrder || dropOrder.length === 0 || heloSpeedKnot <= 0) {
        return 0;
    }
    let totalDurationDk = 0;
    let currentX = heloStartX;
    let currentY = heloStartY;
    let sonobuoysDroppedTotal = 0;
    const numSonobuoysToDeploy = dropOrder.length;

    while (sonobuoysDroppedTotal < numSonobuoysToDeploy) {
        const numToDropThisSortie = Math.min(numSonobuoysToDeploy - sonobuoysDroppedTotal, heloCapacity);
        for (let i = 0; i < numToDropThisSortie; i++) {
            const targetDropLocation = dropOrder[sonobuoysDroppedTotal + i];
            const distanceToTarget = Math.sqrt(calculateDistanceSquared({ x: currentX, y: currentY }, targetDropLocation));
            totalDurationDk += (distanceToTarget / heloSpeedKnot) * 60;
            currentX = targetDropLocation.x;
            currentY = targetDropLocation.y;
            totalDurationDk += dropTimePerSonobuoyDk;
        }
        sonobuoysDroppedTotal += numToDropThisSortie;
        if (sonobuoysDroppedTotal < numSonobuoysToDeploy) {
            const distanceToBase = Math.sqrt(calculateDistanceSquared({ x: currentX, y: currentY }, { x: heloStartX, y: heloStartY }));
            totalDurationDk += (distanceToBase / heloSpeedKnot) * 60;
            currentX = heloStartX;
            currentY = heloStartY;
            totalDurationDk += refuelTimeDk;
        }
    }
    return totalDurationDk;
}

// --- ROTA OPTİMİZASYON FONKSİYONU ---
function optimizeDropOrderWithSorties(originalDropLocations, heloStartX, heloStartY, heloCapacity) {
    if (!originalDropLocations || originalDropLocations.length === 0) {
        return [];
    }
    let remainingLocations = JSON.parse(JSON.stringify(originalDropLocations));
    const optimizedOrder = [];
    let currentLoc = { x: heloStartX, y: heloStartY };

    while (remainingLocations.length > 0) {
        currentLoc = { x: heloStartX, y: heloStartY }; // Her sortiye üsten başla
        const sortieDrops = [];
        let capacityForThisSortie = heloCapacity;

        while (capacityForThisSortie > 0 && remainingLocations.length > 0) {
            let nearestIndex = -1;
            let minDistanceSq = Infinity;
            for (let j = 0; j < remainingLocations.length; j++) {
                const distSq = calculateDistanceSquared(currentLoc, remainingLocations[j]);
                if (distSq < minDistanceSq) {
                    minDistanceSq = distSq;
                    nearestIndex = j;
                }
            }
            if (nearestIndex !== -1) {
                const nextDrop = remainingLocations.splice(nearestIndex, 1)[0];
                sortieDrops.push(nextDrop);
                currentLoc = nextDrop; // Bir sonraki en yakın bu noktadan aranacak
                capacityForThisSortie--;
            } else {
                break; // Kalan nokta yoksa çık
            }
        }
        optimizedOrder.push(...sortieDrops);
    }
    return optimizedOrder;
}

// --- PATERN OLUŞTURMA YARDIMCI FONKSİYONLARI ---
function generateGridPatternDropLocations(sahaUzunNm, sahaGenisNm, atilicakSonobuoySayisi) {
    const planlananDroplar = [];
    if (atilicakSonobuoySayisi <= 0) return { drops: planlananDroplar, note: null };

    const numRows = Math.max(1, Math.ceil(Math.sqrt(atilicakSonobuoySayisi)));
    const numCols = Math.max(1, Math.ceil(atilicakSonobuoySayisi / numRows));

    const xAralik = numCols > 1 ? sahaUzunNm / numCols : sahaUzunNm;
    const yAralik = numRows > 1 ? sahaGenisNm / numRows : sahaGenisNm;

    for (let r = 0; r < numRows; r++) {
        const colStart = (r % 2 === 0) ? 0 : numCols - 1;
        const colEnd = (r % 2 === 0) ? numCols : -1;
        const colStep = (r % 2 === 0) ? 1 : -1;

        for (let c = colStart; c !== colEnd; c += colStep) {
            if (planlananDroplar.length < atilicakSonobuoySayisi) {
                const x = numCols > 1 ? (c + 0.5) * xAralik : sahaUzunNm / 2;
                const y = numRows > 1 ? (r + 0.5) * yAralik : sahaGenisNm / 2;
                planlananDroplar.push({ x: parseFloat(x.toFixed(2)), y: parseFloat(y.toFixed(2)) });
            }
        }
    }

    let placementNote = null;
    let actualPlacedCount = planlananDroplar.length;

     if (actualPlacedCount === 0 && atilicakSonobuoySayisi > 0) {
        const centerX = parseFloat((sahaUzunNm / 2).toFixed(2));
        const centerY = parseFloat((sahaGenisNm / 2).toFixed(2));
        planlananDroplar.push({ x: centerX, y: centerY });
        actualPlacedCount = 1;
        if (atilicakSonobuoySayisi > 1) {
            placementNote = `Izgara paterni için yetersiz alan/parametre. Sadece 1 sonobuoy sahanın merkezine yerleştirildi. İstenen: ${atilicakSonobuoySayisi}.`;
            // console.warn(placementNote); // Bu satır ui_controller veya ana simülasyon tarafından ele alınabilir.
        }
    } else if (actualPlacedCount < atilicakSonobuoySayisi) {
        placementNote = `Izgara paterni ile en fazla ${actualPlacedCount} benzersiz sonobuoy yerleştirilebildi (Satır:${numRows}, Sütun:${numCols}). Simülasyon bu sayıyla devam edecek. İstenen: ${atilicakSonobuoySayisi}.`;
        // console.warn(placementNote + " Kalan sonobuoylar için yerleşim yapılmadı."); // Bu satır ui_controller veya ana simülasyon tarafından ele alınabilir.
    }
    if (planlananDroplar.length > atilicakSonobuoySayisi) {
      planlananDroplar.splice(atilicakSonobuoySayisi);
    }
    return {drops: planlananDroplar, note: placementNote};
}

function generateVerticalBarrierMiddlePatternDropLocations(sahaUzunNm, sahaGenisNm, atilicakSonobuoySayisi) {
    const planlananDroplar = [];
    if (atilicakSonobuoySayisi <= 0) return planlananDroplar;
    const xPos = sahaUzunNm / 2;
    if (atilicakSonobuoySayisi === 1) {
        planlananDroplar.push({ x: parseFloat(xPos.toFixed(2)), y: parseFloat((sahaGenisNm / 2).toFixed(2)) });
        return planlananDroplar;
    }
    const ySpacing = sahaGenisNm / (atilicakSonobuoySayisi -1); // -1 for edges
    for (let i = 0; i < atilicakSonobuoySayisi; i++) {
        const yPos = i * ySpacing;
        planlananDroplar.push({ x: parseFloat(xPos.toFixed(2)), y: parseFloat(yPos.toFixed(2)) });
    }
    return planlananDroplar;
}

function generateRandomPatternDropLocations(sahaUzunNm, sahaGenisNm, atilicakSonobuoySayisi) {
    const planlananDroplar = [];
    if (atilicakSonobuoySayisi <= 0) return planlananDroplar;
    for (let i = 0; i < atilicakSonobuoySayisi; i++) {
        const x = Math.random() * sahaUzunNm;
        const y = Math.random() * sahaGenisNm;
        planlananDroplar.push({ x: parseFloat(x.toFixed(2)), y: parseFloat(y.toFixed(2)) });
    }
    return planlananDroplar;
}

function generateCircularPatternDropLocations(datumX, datumY, sonarRadiusNm, atilicakSonobuoySayisi, sahaUzunNm, sahaGenisNm) {
    const planlananDroplar = [];
    if (atilicakSonobuoySayisi <= 0) return planlananDroplar;

    let clampedDatumX = Math.max(0, Math.min(sahaUzunNm, datumX));
    let clampedDatumY = Math.max(0, Math.min(sahaGenisNm, datumY));
    planlananDroplar.push({ x: parseFloat(clampedDatumX.toFixed(2)), y: parseFloat(clampedDatumY.toFixed(2)) }); // Merkez sonobuoy

    if (atilicakSonobuoySayisi > 1) {
        const numOuterBuoys = atilicakSonobuoySayisi - 1;
        const circleRadius = 2 * sonarRadiusNm; // Dairenin yarıçapı
        const angleStep = (2 * Math.PI) / numOuterBuoys;

        for (let i = 0; i < numOuterBuoys; i++) {
            const angle = i * angleStep;
            let x = clampedDatumX + circleRadius * Math.cos(angle);
            let y = clampedDatumY + circleRadius * Math.sin(angle);

            // Sonobuoy'ların saha sınırları içinde kalmasını sağla
            x = Math.max(0, Math.min(sahaUzunNm, x));
            y = Math.max(0, Math.min(sahaGenisNm, y));
            planlananDroplar.push({ x: parseFloat(x.toFixed(2)), y: parseFloat(y.toFixed(2)) });
        }
    }
    return planlananDroplar.slice(0, atilicakSonobuoySayisi); // Fazla üretildiyse kes
}