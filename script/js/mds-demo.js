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


function setCellIcon(line, cell) {
    var i = window.points[line.iSource];
    var j = window.points[line.iTarget];
    // Sort the points for consistent icon ordering
    var sortedPoints = [i, j].sort(function (a, b) {
        return a.dataPointId - b.dataPointId
    });
    // Generate points
    var iconContainer = document.createElement('div');
    iconContainer.classList.add('icon-container');
    for (var p of sortedPoints) {
        var icon = document.createElement('div');
        icon.style.backgroundColor = p.pointColor;
        icon.innerText = p.dataPointId + 1;
        icon.classList.add('point-icon');
        iconContainer.appendChild(icon);
    }
    // Delete the current content and add the new content
    while (cell.firstChild) {
        cell.removeChild(cell.firstChild);
    }
    cell.appendChild(iconContainer);
}

function updateRanking() {
    window.lines.sort(function (a, b) {
        return lineLength(a) - lineLength(b)
    });
    for (var i = 0; i < window.lines.length; i++) {
        var line = window.lines[i];
        var cell = document.getElementById(`current-cell${i}`);
        setCellIcon(line, cell);
        // Update the color of the "current cell" accordingly.
        if (i === line.targetRank) {
            cell.classList.add('target-cell');
            line.strokeDashArray = [];
        } else {
            cell.classList.remove('target-cell');
            line.strokeDashArray = line.baseDashArray;
        }
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
            // setRowHighlight(e, true);
        },
        'mouse:out': function (e) {
            // setRowHighlight(e, false);
        },
        'object:moving': function (e) {
            var point = e.target;
            if (point.sourceLines) {
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
    var linePrototype = {
        baseHue: 105,
        baseSaturation: 75,
        baseLightness: 50,
        stroke: 'hsl(105, 75%, 50%)',
        baseDashArray: [6, 10],
        strokeDashArray: [6, 10],
        strokeWidth: 2,
        selectable: false,
        evented: false
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
    var targetCells = [];
    var iDistances;
    var numRows = 0;
    for (var i = 0; i < distanceMatrix.length; i++) {
        iDistances = distanceMatrix[i];
        // Create a point
        var circle = new fabric.Circle(Object.assign({fill: colors[i]}, pointPrototype));
        var label = new fabric.Text((i + 1).toString(), textPrototype);
        var point = new fabric.Group([circle, label], {
            hasControls: false,
            hasBorders: false,
            pointColor: colors[i],
            left: randInt(canvasWidth - pointPrototype.radius * 2),
            top: randInt(canvasHeight - pointPrototype.radius * 2),
            dataPointId: i,
            sourceLines: [],
            targetLines: []
        });
        canvas.add(point);
        points.push(point);

        for (var j = 0; j < distanceMatrix.length; j++) {
            if (i > j) {
                var displayRank = iDistances[j];
                var zeroIndexedRank = displayRank - 1;
                // Add a new row to the table.
                var newRow = document.createElement('tr');
                var newRankCell = document.createElement('td');
                newRankCell.id = 'rank-cell' + numRows;
                newRankCell.classList.add('rank-cell');
                newRankCell.innerText = numRows + 1;
                newRow.appendChild(newRankCell);
                var newTargetCell = document.createElement('td');
                newTargetCell.id = 'target-cell' + numRows;
                newTargetCell.classList.add('target-cell');
                newRow.appendChild(newTargetCell);
                targetCells.push(newTargetCell);
                var newCurrentCell = document.createElement('td');
                newCurrentCell.id = 'current-cell' + numRows;
                newCurrentCell.classList.add('current-cell');
                newRow.appendChild(newCurrentCell);
                distanceTable.appendChild(newRow);
                numRows++;

                // Add a line to represent the distance between points i and j
                var line = new fabric.Line([
                    centerX(point),
                    centerY(point),
                    centerX(window.points[j]),
                    centerY(window.points[j])
                ], Object.assign({
                    iSource: i,
                    iTarget: j,
                    targetRank: zeroIndexedRank
                }, linePrototype));
                point.sourceLines.push(line);
                window.points[j].targetLines.push(line);
                window.lines.push(line);
                canvas.add(line);
                canvas.sendToBack(line);
            }
        }
    }
    // Populate the target cells with icons.
    for (var l of window.lines) {
        setCellIcon(l, targetCells[l.targetRank]);
    }
    updateRanking();
    canvas.renderAll();
};