let wCount = 0;
const wContainer = document.getElementById('w-container');
const wTemplate = document.getElementById('wall-template').firstElementChild;
const opTemplate = document.getElementById('opening-template').firstElementChild;

const colors = [
    '#2ecc71', '#3498db', '#9b59b6', '#34495e', '#1abc9c', 
    '#e74c3c', '#f1c40f', '#16a085', '#27ae60', '#2980b9'
];

document.getElementById('add-w-btn').addEventListener('click', addWall);
document.getElementById('calc-btn').addEventListener('click', calculateCutting);
document.getElementById('pdf-btn').addEventListener('click', () => window.print());

addWall();

function addWall() {
    wCount++;
    const newWall = wTemplate.cloneNode(true);
    newWall.id = 'wall-id-' + wCount;
    newWall.querySelector('.wall-title').innerText = 'Стена №' + wCount;
    const openingsList = newWall.querySelector('.openings-list');
    
    newWall.querySelector('.del-w-btn').onclick = function() {
        newWall.remove();
    };
    newWall.querySelector('.add-op-btn').onclick = function() {
        addOpening(openingsList);
    };
    wContainer.appendChild(newWall);
    addOpening(openingsList);
}

function addOpening(container) {
    const newOpening = opTemplate.cloneNode(true);
    newOpening.querySelector('.del-op-btn').onclick = function() {
        newOpening.remove();
    };
    container.appendChild(newOpening);
}

function toggleGableFields(selectElement) {
    const wallNode = selectElement.closest('.wall');
    const gableFields = wallNode.querySelector('.gable-fields');
    if (selectElement.value === 'gable' || selectElement.value === 'shed') {
        gableFields.style.display = 'flex';
    } else {
        gableFields.style.display = 'none';
    }
}
function calculateCutting() {
    const bW = parseFloat(document.getElementById('b-w').value) / 1000;
    const bH = parseFloat(document.getElementById('b-h').value) / 1000; 
    const stockLength = parseFloat(document.getElementById('s-l').value);
    const trimM = parseFloat(document.getElementById('trim').value) / 1000;
    const usableStockLength = stockLength - trimM;

    if (isNaN(stockLength) || usableStockLength <= 0 || isNaN(bH) || bH <= 0 || isNaN(bW) || bW <= 0) {
        alert('Пожалуйста, укажите корректные параметры бруса, длины заготовки и торцовки!');
        return;
    }

    let flatParts = []; 
    const previewContainer = document.getElementById('walls-preview-container');
    previewContainer.innerHTML = ''; 

    const activeWalls = document.querySelectorAll('#w-container > .wall');
    let validWallFound = false;

    activeWalls.forEach((wallNode, wIdx) => {
        validWallFound = true;
        const wLabel = `Ст.${wIdx + 1}`;
        const wType = wallNode.querySelector('.w-type').value;
        const wLenClean = parseFloat(wallNode.querySelector('.w-len').value);
        const wCrowns = parseInt(wallNode.querySelector('.w-crowns').value) || 0;
        
        const leftOverhang = (parseFloat(wallNode.querySelector('.w-left-overhang').value) || 0) / 1000;
        const rightOverhang = (parseFloat(wallNode.querySelector('.w-right-overhang').value) || 0) / 1000;
        
        const gableH = parseFloat(wallNode.querySelector('.w-gable-h').value) || 0;
        const gableMode = wallNode.querySelector('.w-gable-mode').value;

        const intersectionsInput = wallNode.querySelector('.w-intersections').value;
        let intersections = intersectionsInput.split(',')
            .map(x => parseFloat(x.trim()))
            .filter(x => !isNaN(x) && x >= 0 && x <= wLenClean);

        if (isNaN(wLenClean) || wLenClean <= 0 || wCrowns <= 0) return;

        const wLenTotal = leftOverhang + wLenClean + rightOverhang;
        const totalWallHeight = wCrowns * bH;

        let absoluteCups = intersections.map(x => x + leftOverhang);
        absoluteCups.unshift(leftOverhang);
        absoluteCups.push(wLenClean + leftOverhang);
        absoluteCups = [...new Set(absoluteCups)].sort((a, b) => a - b);

        const visualBlock = document.createElement('div');
        visualBlock.className = 'wall-visual-block';
        
        const visualTitle = document.createElement('div');
        visualTitle.className = 'wall-visual-title';
        visualTitle.innerText = `Развертка стены №${wIdx + 1} (${wType==='normal'?'Прямоугольная':wType==='gable'?'Двускатный фронтон':'Односкатный фронтон'}, Полная длина: ${wLenTotal.toFixed(2)}м, ${wCrowns} венцов)`;
        visualBlock.appendChild(visualTitle);

        const canvas = document.createElement('div');
        canvas.className = 'wall-canvas-container';
        canvas.style.height = `${wCrowns * 22}px`; 
        visualBlock.appendChild(canvas);
        previewContainer.appendChild(visualBlock);

        absoluteCups.forEach(cupX => {
            const cupLine = document.createElement('div');
            cupLine.className = 'wall-canvas-cup-line';
            cupLine.style.left = `${(cupX / wLenTotal) * 100}%`;
            canvas.appendChild(cupLine);
        });

        let openings = [];
        const opNodes = wallNode.querySelectorAll('.opening-item');
        
        opNodes.forEach(opNode => {
            const name = opNode.querySelector('.op-name').value.trim() || 'Проем';
            const opStartClean = parseFloat(opNode.querySelector('.op-start').value);
            const opWidth = parseFloat(opNode.querySelector('.op-width').value);
            const opBottom = parseFloat(opNode.querySelector('.op-bottom').value) || 0;
            const opHeight = parseFloat(opNode.querySelector('.op-height').value) || 0;

            if (!isNaN(opStartClean) && !isNaN(opWidth) && opWidth > 0 && opHeight > 0) {
                const opStartAbs = opStartClean + leftOverhang;
                const opTop = opBottom + opHeight; 
                let vStart = Math.floor(opBottom / bH) + 1;
                let vEnd = Math.ceil((opTop - 0.001) / bH);

                vStart = Math.max(1, vStart);
                vEnd = Math.min(wCrowns, vEnd);

                if (vStart <= wCrowns && vEnd >= 1) {
                    openings.push({
                        name, start: opStartAbs, end: opStartAbs + opWidth, width: opWidth, bottom: opBottom, height: opHeight, vStart, vEnd
                    });

                    const opDiv = document.createElement('div');
                    opDiv.className = 'wall-canvas-opening';
                    opDiv.style.left = `${(opStartAbs / wLenTotal) * 100}%`;
                    opDiv.style.width = `${(opWidth / wLenTotal) * 100}%`;
                    opDiv.style.bottom = `${(opBottom / totalWallHeight) * 100}%`;
                    opDiv.style.height = `${(opHeight / totalWallHeight) * 100}%`;
                    opDiv.innerText = name;
                    canvas.appendChild(opDiv);
                }
            }
        });

        for (let crown = 1; crown <= wCrowns; crown++) {
            const crownDiv = document.createElement('div');
            crownDiv.className = 'wall-canvas-crown';
            crownDiv.style.bottom = `${((crown - 1) * bH / totalWallHeight) * 100}%`;
            crownDiv.style.height = `${(bH / totalWallHeight) * 100}%`;
            canvas.appendChild(crownDiv);

            let currentLineLeftBound = 0;
            let currentLineRightBound = wLenTotal;
            let heightInGable = 0;
            let isGableRow = false;

            if (wType === 'gable' || wType === 'shed') {
                if (gableMode === 'pure') {
                    heightInGable = (crown - 0.5) * bH; 
                    isGableRow = true;
                } else {
                    const gableStartHeight = Math.max(0, totalWallHeight - gableH);
                    const rowMidHeight = (crown - 0.5) * bH;
                    if (rowMidHeight > gableStartHeight) {
                        heightInGable = rowMidHeight - gableStartHeight;
                        isGableRow = true;
                    }
                }
            }

            if (isGableRow && gableH > 0) {
                const ratio = Math.max(0, Math.min(1, heightInGable / gableH));
                if (wType === 'gable') {
                    const centerAbs = wLenTotal / 2;
                    const halfWidthAtHeight = (wLenTotal / 2) * (1 - ratio);
                    currentLineLeftBound = centerAbs - halfWidthAtHeight;
                    currentLineRightBound = centerAbs + halfWidthAtHeight;
                } else if (wType === 'shed') {
                    currentLineLeftBound = 0;
                    currentLineRightBound = wLenTotal * (1 - ratio);
                }
            }

            const activeRowLength = currentLineRightBound - currentLineLeftBound;
            if (activeRowLength <= 0.05) continue; 

            let validCupsInRow = absoluteCups.filter(cup => cup >= currentLineLeftBound && cup <= currentLineRightBound);
            if (!validCupsInRow.includes(currentLineLeftBound)) validCupsInRow.unshift(currentLineLeftBound);
            if (!validCupsInRow.includes(currentLineRightBound)) validCupsInRow.push(currentLineRightBound);
            validCupsInRow.sort((a, b) => a - b);

            let allowedSplicePoints = (crown % 2 === 0) ? [...validCupsInRow].reverse() : [...validCupsInRow];
            let currentLineSegments = [];
            let segmentStartX = currentLineLeftBound;

            while (currentLineRightBound - segmentStartX > usableStockLength) {
                let spliceX = segmentStartX;
                for (let cup of allowedSplicePoints) {
                    if (cup > segmentStartX && cup - segmentStartX <= usableStockLength) {
                        spliceX = cup;
                        if (crown % 2 !== 0) break; 
                    }
                }
                if (spliceX === segmentStartX) {
                    spliceX = segmentStartX + usableStockLength;
                }
                currentLineSegments.push({ start: segmentStartX, end: spliceX });
                segmentStartX = spliceX;
            }
            currentLineSegments.push({ start: segmentStartX, end: currentLineRightBound });

            let activeOps = openings.filter(op => crown >= op.vStart && crown <= op.vEnd);
            activeOps.sort((a, b) => a.start - b.start);

            const color = colors[crown % colors.length];

            currentLineSegments.forEach(segment => {
                let currentX = segment.start;

                const registerAndRenderPart = (startLoc, endLoc) => {
                    const partLen = endLoc - startLoc;
                    if (partLen <= 0.005) return; 
                    
                    const roundedLen = parseFloat(partLen.toFixed(2));
                    const pMark = `${wLabel}.В-${crown}`;
                    
                    flatParts.push({ mark: pMark, length: roundedLen, color: color });

                    const partDiv = document.createElement('div');
                    partDiv.className = 'wall-canvas-part';
                    partDiv.style.left = `${(startLoc / wLenTotal) * 100}%`;
                    partDiv.style.width = `${(partLen / wLenTotal) * 100}%`;
                    partDiv.style.backgroundColor = color;
                    partDiv.innerText = `${crown}в:${roundedLen}м`;
                    partDiv.title = `Венец ${crown}, Деталь: ${roundedLen}м`;
                    crownDiv.appendChild(partDiv);
                };

                activeOps.forEach(op => {
                    if (op.start > currentX && op.start < segment.end) {
                        registerAndRenderPart(currentX, Math.min(op.start, segment.end));
                    }
                    if (op.end > currentX && op.start < segment.end) {
currentX = Math.max(currentX, Math.min(op.end, segment.end));
                    }
                });
                
                if (segment.end > currentX) {
                    registerAndRenderPart(currentX, segment.end);
                }
            });
        }
    });
    
---

### 🪵 Часть 3: Сортировка деталей, линейный раскрой заготовок (FFD) и вывод отчета
*(Вставьте этот финальный блок в самый конец файла `script.js` сразу после второй части)*

```javascript
    if (!validWallFound || flatParts.length === 0) {
        alert('Добавьте хотя бы одну стену с корректными размерами!');
        return;
    }

    for (let p of flatParts) {
        if (p.length > usableStockLength) {
            alert(`Ошибка спецификации! Деталь "${p.mark}" получилась длиной ${p.length} м, что превышает чистую длину заготовки бруса (${usableStockLength.toFixed(2)} м после торцовки).\n\nУвеличьте длину заготовки бруса или измените положение проемов.`);
            return;
        }
    }

    flatParts.sort((a, b) => b.length - a.length);
    let boards = []; 

    flatParts.forEach(part => {
        let placed = false;
        for (let i = 0; i < boards.length; i++) {
            if (boards[i].remaining >= part.length) {
                boards[i].parts.push(part);
                boards[i].remaining -= part.length;
                placed = true;
                break;
            }
        }
        if (!placed) {
            boards.push({
                remaining: usableStockLength - part.length,
                parts: [part]
            });
        }
    });

    const sectionArea = bW * bH; 
    let totalNetLength = flatParts.reduce((sum, p) => sum + p.length, 0);
    
    const totalNetVolume = totalNetLength * sectionArea;
    const totalGrossVolume = boards.length * stockLength * sectionArea;
    const wastePercent = totalGrossVolume > 0 ? ((totalGrossVolume - totalNetVolume) / totalGrossVolume) * 100 : 0;

    document.getElementById('r-v-net').innerText = totalNetVolume.toFixed(3);
    document.getElementById('r-v-gross').innerText = totalGrossVolume.toFixed(3);
    document.getElementById('r-pcs').innerText = boards.length;
    document.getElementById('r-waste').innerText = wastePercent.toFixed(1);

    const mapContainer = document.getElementById('cutting-map-container');
    mapContainer.innerHTML = ''; 

    boards.forEach((board, idx) => {
        const row = document.createElement('div');
        row.className = 'map-row';

        const indexDiv = document.createElement('div');
        indexDiv.className = 'map-index';
        indexDiv.innerText = `#${idx + 1}`;
        row.appendChild(indexDiv);

        const bar = document.createElement('div');
        bar.className = 'map-visual-bar';
        let specLabels = []; 

        if (trimM > 0) {
            const trimPct = (trimM / stockLength) * 100;
            const trimDiv = document.createElement('div');
            trimDiv.className = 'map-trim';
            trimDiv.style.width = `${trimPct}%`;
            bar.appendChild(trimDiv);
        }

        board.parts.forEach(part => {
            const partPct = (part.length / stockLength) * 100;
            const partDiv = document.createElement('div');
            partDiv.className = 'map-part';
            partDiv.style.width = `${partPct}%`;
            partDiv.style.backgroundColor = part.color;
            partDiv.innerText = part.mark;
            partDiv.title = `${part.mark}: ${part.length} м`;
            bar.appendChild(partDiv);
            specLabels.push(`${part.mark}(${part.length.toFixed(2)}м)`);
        });

        const actualWaste = stockLength - (stockLength - board.remaining - trimM) - trimM;
        if (actualWaste > 0.001) {
            const wastePct = (actualWaste / stockLength) * 100;
            const wasteDiv = document.createElement('div');
            wasteDiv.className = 'map-waste';
            wasteDiv.style.width = `${wastePct}%`;
            wasteDiv.innerText = actualWaste.toFixed(2);
            bar.appendChild(wasteDiv);
            specLabels.push(`ост.${actualWaste.toFixed(2)}м`);
        }

        row.appendChild(bar);

        const specDiv = document.createElement('div');
        specDiv.className = 'map-spec-text';
        specDiv.innerText = `[Торц.] ` + specLabels.join(' + ');
        row.appendChild(specDiv);

        mapContainer.appendChild(row);
    });

    document.getElementById('r-block').style.display = 'block';
}
