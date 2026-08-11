let wCount = 1;
const wContainer = document.getElementById('w-container');
const colors = ['#2ecc71', '#3498db', '#9b59b6', '#34495e', '#1abc9c', '#e74c3c', '#f1c40f', '#16a085', '#27ae60', '#2980b9'];

// Инициализация базовых кнопок приложения
document.getElementById('add-w-btn').addEventListener('click', addWall);
document.getElementById('add-p-btn').addEventListener('click', addPurlin);
document.getElementById('calc-btn').addEventListener('click', calculateCutting);
document.getElementById('pdf-btn').addEventListener('click', () => window.print());
renumberAxes();

// Перехватчик событий клика (делегирование)
wContainer.addEventListener('click', function(e) {
    if (!e.target) return;
    const wallNode = e.target.closest('.axis-block');
    if (!wallNode) return;
    
    // Переключатель блока Фронтона (только для стен)
    if (e.target.classList.contains('add-gable-trigger-btn')) {
        const block = wallNode.querySelector('.gable-fields-block');
        if (block) { block.style.display = 'block'; e.target.style.display = 'none'; }
    }
    if (e.target.classList.contains('del-gable-btn')) {
        const block = wallNode.querySelector('.gable-fields-block');
        const btn = wallNode.querySelector('.add-gable-trigger-btn');
        if (block && btn) { block.style.display = 'none'; btn.style.display = 'inline-flex'; }
    }

    // Переключатель блока Консолей (только для стен)
    if (e.target.classList.contains('add-console-trigger-btn')) {
        const block = wallNode.querySelector('.console-fields-block');
        if (block) { block.style.display = 'block'; e.target.style.display = 'none'; }
    }
    if (e.target.classList.contains('del-console-btn')) {
        const block = wallNode.querySelector('.console-fields-block');
        const btn = wallNode.querySelector('.add-console-trigger-btn');
        if (block && btn) { block.style.display = 'none'; btn.style.display = 'inline-flex'; }
    }

    // Удаление оси (стены или слеги) и управление проемами
    if (e.target.classList.contains('del-w-btn')) { wallNode.remove(); renumberAxes(); }
    if (e.target.classList.contains('add-op-btn')) {
        const list = wallNode.querySelector('.openings-list'); if (list) addOpening(list);
    }
    if (e.target.classList.contains('del-op-btn')) {
        const item = e.target.closest('.opening-item'); if (item) item.remove();
    }
    // Смена типа слеги обновляет подпись оси
    if (e.target.classList.contains('w-purlin-type')) { renumberAxes(); }
});
// Смена select "Тип балки" не всплывает как click в некоторых браузерах — слушаем change отдельно
wContainer.addEventListener('change', function(e) {
    if (e.target && e.target.classList.contains('w-purlin-type')) { renumberAxes(); }
});
function addWall() {
    wCount++;
    const sampleWall = document.querySelector('.wall.axis-block');
    if (!sampleWall) return;

    const newWall = sampleWall.cloneNode(true);
    
    // Сбрасываем кнопки и скрываем инженерные блоки в клоне
    const config = [
        ['.add-gable-trigger-btn', '.gable-fields-block'],
        ['.add-console-trigger-btn', '.console-fields-block']
    ];
    config.forEach(([btnClass, blockClass]) => {
        const btn = newWall.querySelector(btnClass);
        const block = newWall.querySelector(blockClass);
        if (btn && block) { btn.style.display = 'inline-flex'; block.style.display = 'none'; }
    });

    const list = newWall.querySelector('.openings-list');
    if (list) { list.innerHTML = ''; addOpening(list); }
    wContainer.appendChild(newWall);
    renumberAxes();
}

// Создает новый блок оси-слеги (продольная/коньковая балка) как самостоятельный элемент списка
function createPurlinNode() {
    const div = document.createElement('div');
    div.className = 'axis-block purlin';
    div.innerHTML = `
        <div class="wall-head">
            <span class="wall-title">Ось: Слега</span>
            <button type="button" class="btn-red del-w-btn">Удалить слегу</button>
        </div>
        <div class="row">
            <div class="item" style="flex: 1.5;"><label>Тип балки</label>
                <select class="w-purlin-type">
                    <option value="ridge">Коньковая слега (по центру здания)</option>
                    <option value="porch">Подстропильная балка выноса крыльца</option>
                </select>
            </div>
            <div class="item" style="flex: 1.5;"><label>Длина по осям (м)</label><input type="number" class="w-len" value="6.00" step="0.01"></div>
            <div class="item"><label>Выпуск левый (мм)</label><input type="number" class="w-left-overhang" value="500"></div>
            <div class="item"><label>Выпуск правый (мм)</label><input type="number" class="w-right-overhang" value="500"></div>
        </div>
        <div class="row" style="margin-top: 10px;">
            <div class="item"><label>Начальный венец укладки</label><input type="number" class="w-start-row" value="16" step="1"></div>
            <div class="item"><label>Кол-во венцов (диапазон)</label><input type="number" class="w-crowns" value="1" step="1"></div>
            <div class="item" style="flex: 2;"><label>Точки опоры / пересечения (м от начала через запятую)</label><input type="text" class="w-intersections" value=""></div>
        </div>
    `;
    return div;
}

function addPurlin() {
    const newPurlin = createPurlinNode();
    wContainer.appendChild(newPurlin);
    renumberAxes();
}

// Пересчитывает сквозную нумерацию осей "Ось N" по фактическому порядку блоков в списке
function renumberAxes() {
    const blocks = wContainer.querySelectorAll('.axis-block');
    blocks.forEach((block, idx) => {
        const n = idx + 1;
        const titleSpan = block.querySelector('.wall-title');
        if (!titleSpan) return;
        if (block.classList.contains('purlin')) {
            const typeSel = block.querySelector('.w-purlin-type');
            const typeLabel = (typeSel && typeSel.value === 'porch') ? 'Слега (крыльцо)' : 'Слега (коньковая)';
            titleSpan.innerText = `Ось ${n}: ${typeLabel}`;
        } else {
            titleSpan.innerText = `Ось ${n}: Стена`;
        }
    });
}

function addOpening(container) {
    const div = document.createElement('div');
    div.className = 'opening-item row';
    div.innerHTML = `
        <div class="item" style="flex: 1.5;"><label>Название</label><input type="text" class="op-name" value="Окно"></div>
        <div class="item"><label>От угла (м)</label><input type="number" class="op-start" value="2.00" step="0.01"></div>
        <div class="item"><label>Ширина (м)</label><input type="number" class="op-width" value="1.50" step="0.01"></div>
        <div class="item"><label>От низа (м)</label><input type="number" class="op-bottom" value="0.90" step="0.01"></div>
        <div class="item"><label>Высота (м)</label><input type="number" class="op-height" value="1.20" step="0.01"></div>
        <div style="display:flex; align-items:flex-end;"><button type="button" class="btn-red del-op-btn" style="padding: 7px 10px;">✕</button></div>
    `;
    container.appendChild(div);
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

    const activeWalls = document.querySelectorAll('#w-container > .axis-block');
    let validWallFound = false;

    activeWalls.forEach((wallNode, wIdx) => {
        const isPurlin = wallNode.classList.contains('purlin');
        const wLabel = `Ось ${wIdx + 1}`;
        const wLenClean = parseFloat(wallNode.querySelector('.w-len').value);

        // Отказоустойчивое чтение: если блок скрыт (или не существует у слеги), подставляем false
        const gableBlock = wallNode.querySelector('.gable-fields-block');
        const hasGable = gableBlock && gableBlock.style.display === 'block';

        const consoleBlock = wallNode.querySelector('.console-fields-block');
        const hasConsole = consoleBlock && consoleBlock.style.display === 'block';

        // Стены и слеги по-разному трактуют "стартовый ряд"/"кол-во венцов":
        // у стены это селект смещения (0 / 0.5) + кол-во прямоугольных венцов,
        // у слеги — это конкретный номер начального венца укладки + диапазон венцов.
        let wCrownsNormal, wStartOffsetCrowns;
        if (isPurlin) {
            const purlinStartRow = parseInt(wallNode.querySelector('.w-start-row').value) || 1;
            wStartOffsetCrowns = Math.max(0, purlinStartRow - 1);
            wCrownsNormal = parseInt(wallNode.querySelector('.w-crowns').value) || 0;
        } else {
            wStartOffsetCrowns = parseFloat(wallNode.querySelector('.w-start-row').value) || 0;
            wCrownsNormal = parseInt(wallNode.querySelector('.w-crowns').value) || 0;
        }

        // У слеги нет углов/декоративного реза — считаем безопасные умолчания
        const cornerSel = wallNode.querySelector('.w-corner-type');
        const wCornerType = isPurlin ? 'corner' : (cornerSel ? cornerSel.value : 'corner');
        const styleSel = wallNode.querySelector('.w-overhang-style');
        const overhangStyle = styleSel ? styleSel.value : 'straight';

        const wType = hasGable ? gableBlock.querySelector('.w-roof-type').value : 'normal';
        const wCrownsTotal = wCrownsNormal + (hasGable ? (parseInt(gableBlock.querySelector('.w-gable-crowns').value) || 0) : 0);

        const baseLeftOverhang = (parseFloat(wallNode.querySelector('.w-left-overhang').value) || 0) / 1000;
        const baseRightOverhang = (parseFloat(wallNode.querySelector('.w-right-overhang').value) || 0) / 1000;
        
        const roofAngleDeg = hasGable ? (parseFloat(gableBlock.querySelector('.w-roof-angle').value) || 0) : 0;
        const maxGableH = hasGable ? (parseFloat(gableBlock.querySelector('.w-gable-h').value) || 0) : 0;

        const cStart = hasConsole ? (parseInt(consoleBlock.querySelector('.w-console-start').value) || 1) : 0;
        const cCount = hasConsole ? (parseInt(consoleBlock.querySelector('.w-console-count').value) || 0) : 0;
        const cLeftLen = hasConsole ? ((parseFloat(consoleBlock.querySelector('.w-console-left-step').value) || 0) / 1000) : 0;
        const cRightLen = hasConsole ? ((parseFloat(consoleBlock.querySelector('.w-console-right-step').value) || 0) / 1000) : 0;

        const intersectionsField = wallNode.querySelector('.w-intersections');
        const intersectionsInput = intersectionsField ? intersectionsField.value : '';
        let intersections = intersectionsInput.split(',')
            .map(x => parseFloat(x.trim()))
            .filter(x => !isNaN(x) && x >= 0 && x <= wLenClean);

        if (isNaN(wLenClean) || wLenClean <= 0 || wCrownsNormal <= 0) return;
        validWallFound = true;

        let maxLOverhang = Math.max(baseLeftOverhang, hasConsole ? cLeftLen : 0);
        let maxROverhang = Math.max(baseRightOverhang, hasConsole ? cRightLen : 0);

        const wLenCanvasMax = maxLOverhang + wLenClean + maxROverhang;
        const totalWallHeight = (wCrownsTotal + wStartOffsetCrowns) * bH;

        const visualBlock = document.createElement('div');
        visualBlock.className = 'wall-visual-block';
        visualBlock.setAttribute('has-style', overhangStyle);
        
        const visualTitle = document.createElement('div');
        visualTitle.className = 'wall-visual-title';
        if (isPurlin) {
            const purlinTypeSel = wallNode.querySelector('.w-purlin-type');
            const purlinTypeLabel = (purlinTypeSel && purlinTypeSel.value === 'porch') ? 'Подстропильная балка выноса крыльца' : 'Коньковая слега';
            visualTitle.innerText = `Развертка ${wLabel} — ${purlinTypeLabel} (укладка с венца ${wStartOffsetCrowns + 1}, венцов: ${wCrownsNormal})`;
        } else {
            visualTitle.innerText = `Развертка ${wLabel} — Стена (${wCornerType === 'corner' ? 'Угловой замок' : 'Т-переруб'}, Смещение +${wStartOffsetCrowns}в.)`;
        }
        visualBlock.appendChild(visualTitle);

        const canvas = document.createElement('div');
        canvas.className = 'wall-canvas-container';
        canvas.style.height = `${wCrownsTotal * 22}px`; 
        visualBlock.appendChild(canvas);
        previewContainer.appendChild(visualBlock);

        const leftBaseOffset = maxLOverhang;
        let canvasCups = intersections.map(x => x + leftBaseOffset);
        canvasCups.unshift(leftBaseOffset);
        canvasCups.push(wLenClean + leftBaseOffset);

        canvasCups.forEach(cupX => {
            const cupLine = document.createElement('div');
            cupLine.className = 'wall-canvas-cup-line';
            cupLine.style.left = `${(cupX / wLenCanvasMax) * 100}%`;
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
                const opStartAbs = opStartClean + leftBaseOffset;
                const opTop = opBottom + opHeight; 
                let vStart = Math.floor((opBottom - (wStartOffsetCrowns * bH)) / bH) + 1;
                let vEnd = Math.ceil((opTop - (wStartOffsetCrowns * bH) - 0.001) / bH);
                vStart = Math.max(1, Math.min(wCrownsTotal, vStart));
                vEnd = Math.max(1, Math.min(wCrownsTotal, vEnd));

                openings.push({ name, start: opStartAbs, end: opStartAbs + opWidth, vStart: vStart, vEnd: vEnd, tieBottom: vStart, tieTop: vEnd });

                const opDiv = document.createElement('div');
                opDiv.className = 'wall-canvas-opening';
                opDiv.style.left = `${(opStartAbs / wLenCanvasMax) * 100}%`;
                opDiv.style.width = `${(opWidth / wLenCanvasMax) * 100}%`;
                opDiv.style.bottom = `${((opBottom) / totalWallHeight) * 100}%`;
                opDiv.style.height = `${(opHeight / totalWallHeight) * 100}%`;
                opDiv.innerText = name;
                canvas.appendChild(opDiv);
            }
        });

        for (let crown = 1; crown <= wCrownsTotal; crown++) {
            const crownDiv = document.createElement('div');
            crownDiv.className = 'wall-canvas-crown';
            const absoluteRowBottom = ((crown - 1) + wStartOffsetCrowns) * bH;
            crownDiv.style.bottom = `${(absoluteRowBottom / totalWallHeight) * 100}%`;
            crownDiv.style.height = `${(bH / totalWallHeight) * 100}%`;
            canvas.appendChild(crownDiv);

            let currentLeftOverhang = baseLeftOverhang;
            let currentRightOverhang = baseRightOverhang;

            if (hasConsole && crown >= cStart && crown < (cStart + cCount)) {
                currentLeftOverhang = cLeftLen; currentRightOverhang = cRightLen;
            }

            let currentLineLeftBound = maxLOverhang - currentLeftOverhang;
            let currentLineRightBound = maxLOverhang + wLenClean + currentRightOverhang;

            if (crown > wCrownsNormal && wType !== 'normal') {
                const heightInsideGable = (crown - wCrownsNormal - 0.5) * bH;
                let lateralCutback = heightInsideGable * Math.tan((90 - roofAngleDeg) * Math.PI / 180);
                if (maxGableH > 0 && heightInsideGable > maxGableH) lateralCutback = wLenCanvasMax;

                if (wType === 'gable') {
                    const centerAbs = maxLOverhang + (wLenClean / 2);
                    const halfWidthAtHeight = (wLenCanvasMax / 2) * (1 - (heightInsideGable / (maxGableH || totalWallHeight)));
                    currentLineLeftBound = Math.max(currentLineLeftBound, centerAbs - halfWidthAtHeight);
                    currentLineRightBound = Math.min(currentLineRightBound, centerAbs + halfWidthAtHeight);
                } else if (wType === 'shed') {
                    currentLineRightBound = Math.max(currentLineLeftBound, currentLineRightBound - lateralCutback);
                }
            }

            const activeRowLength = currentLineRightBound - currentLineLeftBound;
            if (activeRowLength <= 0.05) continue;

            let activeOps = openings.filter(op => crown >= op.vStart && crown <= op.vEnd);
            let cuttingOps = activeOps.filter(op => crown !== op.tieBottom && crown !== op.tieTop);
            cuttingOps.sort((a, b) => a.start - b.start);

            let rowCups = [maxLOverhang, maxLOverhang + wLenClean];
            intersections.forEach(x => rowCups.push(x + maxLOverhang));
            
            if (wCornerType === 't-joint' && crown % 2 !== 0) {
                rowCups = rowCups.filter(cup => cup !== maxLOverhang && cup !== (maxLOverhang + wLenClean));
            }

            let validCupsInRow = rowCups.filter(cup => cup >= currentLineLeftBound && cup <= currentLineRightBound);
            if (!validCupsInRow.includes(currentLineLeftBound)) validCupsInRow.unshift(currentLineLeftBound);
            if (!validCupsInRow.includes(currentLineRightBound)) validCupsInRow.push(currentLineRightBound);
            validCupsInRow = [...new Set(validCupsInRow)].sort((a, b) => a - b);

            let allowedSplicePoints = (crown % 2 === 0) ? [...validCupsInRow].reverse() : [...validCupsInRow];
            let currentLineSegments = [];
            let segmentStartX = currentLineLeftBound;

            while (currentLineRightBound - segmentStartX > usableStockLength) {
                let spliceX = segmentStartX;
                for (let cup of allowedSplicePoints) {
                    if (cup > segmentStartX && cup - segmentStartX <= usableStockLength) {
                        spliceX = cup; if (crown % 2 !== 0) break;
                    }
                }
                if (spliceX === segmentStartX) spliceX = segmentStartX + usableStockLength;
                currentLineSegments.push({ start: segmentStartX, end: spliceX });
                segmentStartX = spliceX;
            }
            currentLineSegments.push({ start: segmentStartX, end: currentLineRightBound });

            const color = colors[crown % colors.length];

            currentLineSegments.forEach(segment => {
                let currentX = segment.start;

                const registerAndRenderPart = (startLoc, endLoc) => {
                    const partLen = endLoc - startLoc; if (partLen <= 0.005) return;
                    const roundedLen = parseFloat(partLen.toFixed(2));
                    flatParts.push({ mark: `${wLabel}.В-${crown}`, length: roundedLen, color: color });

                    const partDiv = document.createElement('div');
                    partDiv.className = 'wall-canvas-part';
                    partDiv.style.left = `${(startLoc / wLenCanvasMax) * 100}%`;
                    partDiv.style.width = `${(partLen / wLenCanvasMax) * 100}%`;
                    partDiv.style.backgroundColor = color;
                    partDiv.innerText = `${crown}в:${roundedLen}м`;
                    crownDiv.appendChild(partDiv);
                };

                cuttingOps.forEach(op => {
                    if (op.start > currentX && op.start < segment.end) registerAndRenderPart(currentX, Math.min(op.start, segment.end));
                    if (op.end > currentX && op.start < segment.end) currentX = Math.max(currentX, Math.min(op.end, segment.end));
                });
                if (segment.end > currentX) registerAndRenderPart(currentX, segment.end);
            });
        }
    });
    if (!validWallFound || flatParts.length === 0) { alert('Добавьте хотя бы одну ось (стену или слегу) с корректными размерами!'); return; }
    flatParts.sort((a, b) => b.length - a.length);
    let boards = [];

    flatParts.forEach(part => {
        let placed = false;
        for (let i = 0; i < boards.length; i++) {
            if (boards[i].remaining >= part.length) { boards[i].parts.push(part); boards[i].remaining -= part.length; placed = true; break; }
        }
        if (!placed) boards.push({ remaining: usableStockLength - part.length, parts: [part] });
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

    const mapContainer = document.getElementById('cutting-map-container'); mapContainer.innerHTML = '';

    boards.forEach((board, idx) => {
        const row = document.createElement('div'); row.className = 'map-row';
        const indexDiv = document.createElement('div'); indexDiv.className = 'map-index'; indexDiv.innerText = `#${idx + 1}`; row.appendChild(indexDiv);
        const bar = document.createElement('div'); bar.className = 'map-visual-bar';
        let specLabels = [];

        if (trimM > 0) {
            const trimPct = (trimM / stockLength) * 100;
            const trimDiv = document.createElement('div'); trimDiv.className = 'map-trim'; trimDiv.style.width = `${trimPct}%`; bar.appendChild(trimDiv);
        }

        board.parts.forEach(part => {
            const partPct = (part.length / stockLength) * 100;
            const partDiv = document.createElement('div'); partDiv.className = 'map-part'; partDiv.style.width = `${partPct}%`; partDiv.style.backgroundColor = part.color; partDiv.innerText = part.mark; bar.appendChild(partDiv);
            specLabels.push(`${part.mark}(${part.length.toFixed(2)}м)`);
        });

        const actualWaste = stockLength - (stockLength - board.remaining - trimM) - trimM;
        if (actualWaste > 0.001) {
            const wastePct = (actualWaste / stockLength) * 100;
            const wasteDiv = document.createElement('div'); wasteDiv.className = 'map-waste'; wasteDiv.style.width = `${wastePct}%`; wasteDiv.innerText = actualWaste.toFixed(2); bar.appendChild(wasteDiv);
            specLabels.push(`ост.${actualWaste.toFixed(2)}м`);
        }

        row.appendChild(bar);
        const specDiv = document.createElement('div'); specDiv.className = 'map-spec-text'; specDiv.innerText = `[Торц.] ` + specLabels.join(' + '); row.appendChild(specDiv);
        mapContainer.appendChild(row);
    });
    document.getElementById('r-block').style.display = 'block';
}
