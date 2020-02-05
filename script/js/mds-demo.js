function randInt(x) {
    return Math.random() * (x + 1)
}

function centerX(obj) {
    return obj.left + obj.getScaledWidth() / 2
}

function centerY(obj) {
    return obj.top + obj.getScaledHeight() / 2
}

function lineLength(line) {
    return Math.sqrt(Math.pow(line.x2 - line.x1, 2) + Math.pow(line.y2 - line.y1, 2))
}

function setRowHighlight(e, enabled) {
    if (e.target) {
        if (enabled) {
            document.getElementById('d-table-row-' + e.target.dataPointId.toString())
                .classList.add('highlighted');
        } else {
            document.getElementById('d-table-row-' + e.target.dataPointId.toString())
                .classList.remove('highlighted');
        }
    }
}

function updateRanking() {
    window.lines.sort(function (a, b) {
        return lineLength(a) - lineLength(b)
    });
    for (var i = 0; i < window.lines.length; i++) {
        var line = window.lines[i];
        document.getElementById(
            'd-table-cell-' + line.iSource.toString() + line.iTarget.toString()).innerText = i + 1;
        console.log(line.baseHue + (i - line.targetRank) * 15);
        line.stroke = `hsl(${line.baseHue + (i - line.targetRank) * 15}, ${line.baseSaturation}%, ${line.baseLightness}%)`;
    }
}


window.onload = function () {
    var originalCanvas = document.getElementById('vis-canvas');
    var canvasWidth = originalCanvas.clientWidth;
    var canvasHeight = originalCanvas.clientHeight;

    // Initialize Fabric.js
    var canvas = new fabric.Canvas('vis-canvas');
    canvas.setWidth(canvasWidth);
    canvas.setHeight(canvasHeight);
    canvas.selection = false;
    canvas.on({
        'mouse:over': function (e) {
            setRowHighlight(e, true);
        },
        'mouse:out': function (e) {
            setRowHighlight(e, false);
        },
        'object:moving': function (e) {
            var point = e.target;
            if (point.sourceLines){
                var sourceLines = point.sourceLines;
                for (var i = 0; i < sourceLines.length; i++) {
                    sourceLines[i].set({'x1': centerX(point), 'y1': centerY(point)});
                }
                var targetLines = point.targetLines;
                for (i = 0; i < targetLines.length; i++) {
                    targetLines[i].set({'x2': centerX(point), 'y2': centerY(point)});
                }
            }
            updateRanking();
            canvas.renderAll();
        },
    });

    var pointPrototype = {
        radius: 12,
        originX: 'center',
        originY: 'center'
    };
    var textPrototype = {
        fontSize: 16,
        originX: 'center',
        originY: 'center'
    };

    var colors = [
        '#37D3B4',
        '#65B6DD',
        '#D9C37E',
        '#F67442',
        '#E87AB4',
    ];
    var distanceMatrix = [
        [0, 2, 8, 10, 7],
        [2, 0, 1, 9, 5],
        [8, 1, 0, 3, 4],
        [10, 9, 3, 0, 6],
        [7, 5, 4, 6, 0]
    ];

    var distanceTable = document.getElementById('distance-table');
    window.points = [];
    window.lines = [];
    var iDistances;

    for (var i = 0; i < distanceMatrix.length; i++) {
        iDistances = distanceMatrix[i];

        // Create a point
        var circle = new fabric.Circle(Object.assign({fill: colors[i]}, pointPrototype));
        var label = new fabric.Text((i + 1).toString(), textPrototype);
        var point = new fabric.Group([circle, label], {
            hasControls: false,
            hasBorders: false,
            left: randInt(canvasWidth - pointPrototype.radius * 2),
            top: randInt(canvasHeight - pointPrototype.radius * 2),
            dataPointId: i,
            sourceLines: [],
            targetLines: []
        });
        canvas.add(point);
        points.push(point);

        // Create a row in the distances table
        var newRow = document.createElement('tr');
        newRow.id = 'd-table-row-' + i.toString();
        newRow.classList.add('distance-table-row');
        for (let j = 0; j < distanceMatrix.length; j++) {
            // Create a new cell
            var newCell = document.createElement('td');
            newCell.id = 'd-table-cell-' + i.toString() + j.toString();
            newCell.classList.add('distance-table-cell');
            if (i < j) {
                newCell.classList.add('duplicate-triangle-cell');
                newCell.textContent = iDistances[j];
                newCell.style.backgroundColor = colors[i];
            } else if (i === j) {
                newCell.textContent = iDistances[j];
                newCell.classList.add('diagonal-cell');
            } else {
                newCell.classList.add('triangle-cell');
                newCell.style.backgroundColor = colors[j];
                var line = new fabric.Line([
                    centerX(point),
                    centerY(point),
                    centerX(window.points[j]),
                    centerY(window.points[j])
                ], {
                    baseHue: 105,
                    baseSaturation: 75,
                    baseLightness: 50,
                    stroke: 'hsl(105, 75%, 50%)',
                    strokeDashArray: [6, 10],
                    strokeWidth: 2,
                    selectable: false,
                    evented: false,
                    iSource: i,
                    iTarget: j,
                    targetRank: iDistances[j] - 1
                });
                point.sourceLines.push(line);
                window.points[j].targetLines.push(line);
                window.lines.push(line);
                canvas.add(line);
                canvas.sendToBack(line);
            }
            newRow.appendChild(newCell);
        }
        distanceTable.appendChild(newRow);
    }
    updateRanking();
    canvas.renderAll();
};