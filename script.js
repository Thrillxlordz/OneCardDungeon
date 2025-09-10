let myCanvas
let backgroundColor
let cellWidth
let cellHeight
let cellSize

let currentLoop = 1
let maxLoops = 3
let currentMapIndex = 0
let currentMap
let maps
let mapWidth = 5
let mapHeight = 5
let rollableDice
let statModifiers
let statUpgraders
let playerHasActed = false
let displayPlayerUpgrades = false

let player
let spider
let skeleton
let ogre
let dragon

function setup() {
    myCanvas = createCanvas(windowWidth, windowHeight)
    myCanvas.parent("#canvas")
    var myCanvasStyle = document.getElementById("defaultCanvas0").style
    myCanvasStyle.position = "absolute"
    myCanvasStyle.top = 0

    backgroundColor = window.getComputedStyle(document.getElementById("canvas")).getPropertyValue('background-color')
    background(backgroundColor)

    document.addEventListener('mousedown', function(event) {
        onMousePress(event)
    })

    document.addEventListener('keydown', function(event) {
        onKeyDown(event)
    })

    player = new entity(6, 1, 1, 1, 2)
    setupMaps()
    
    cellWidth = myCanvas.width / (currentMap.width + 1)   // This +1 is to create a half-cell buffer around the edge of the screen
    cellHeight = myCanvas.height / (currentMap.height + 1.5) // This +1.5 is to create a 3/4-cell buffer around the edge of the screen
    cellSize = Math.min(cellWidth, cellHeight)
    
    setupRollableDice()
    setupStatModifiers()
    setupStatUpgraders()
}

function draw() {
    background(backgroundColor)

    currentMap.drawMap()

    startX = myCanvas.width * 1 / 4 - cellSize * currentMap.width / 4 - (cellSize / 2 * rollableDice.length / 2)
    startY = myCanvas.height * 3 / 4
    for (var i = 0; i < rollableDice.length; i++) {
        rollableDice[i].drawDie(startX + cellSize / 2 * i, startY, cellSize / 3, cellSize / 3)
    }

    startX = myCanvas.width * 1 / 4 - cellSize * currentMap.width / 4 + myCanvas.width / 40
    startY = myCanvas.height * 0.44
    for (var i = 0; i < statModifiers.length; i++) {
        statModifiers[i].drawStatModifier(startX, startY + myCanvas.width / 32 * i, cellSize / 3, cellSize / 3)
    }
}

// Maps consist of cells with values -2 = playerStart, -1 = wall, 0 = empty,  1+ = enemyStart (1 = round 1, 2 = round 2, etc)
function setupMaps() {
    spider = new entity(2, 5, 4, 4, 3)
    skeleton = new entity(3, 4, 5, 4, 4)
    ogre = new entity(5, 3, 7, 7, 2)
    dragon = new entity(5, 5, 5, 5, 5)

    maps = []
    maps.push(new map(spider    ,  [[ 3,  2,  0,  1,  0],
                                    [ 0,  0,  0, -1,  2],
                                    [ 0,  0,  3,  0,  1],
                                    [ 0, -1,  0, -1,  3],
                                    [-2,  0,  3,  0,  2]]))
    maps.push(new map(skeleton  ,  [[ 0,  2,  1,  0,  3],
                                    [ 1,  2,  3,  0,  0],
                                    [-1,  3,  0, -1,  0],
                                    [ 3,  0,  0, -1,  0],
                                    [ 2,  0,  0,  0, -2]]))
    maps.push(new map(ogre      ,  [[ 0,  3,  0,  3,  0],
                                    [ 0, -1,  2, -1,  1],
                                    [ 0,  0,  0,  0,  3],
                                    [ 0, -1,  0,  0,  2],
                                    [-2,  0,  0,  0,  0]]))
    maps.push(new map(dragon    ,  [[ 0,  1,  0,  2,  0],
                                    [ 3, -1,  3,  0,  0],
                                    [ 0, -1,  0,  0, -1],
                                    [ 3,  0,  0,  0,  0],
                                    [ 0,  2,  0,  0, -2]]))
    
    currentMap = maps[currentMapIndex]
    currentMap.initializeMap()
}

function setupRollableDice() {
    rollableDice = []
    rollableDice.push(new rollableDie(1, 6))
    rollableDice.push(new rollableDie(1, 6))
    rollableDice.push(new rollableDie(1, 6))
}

function setupStatModifiers() {
    statModifiers = []
    statModifiers.push(new statModifier("Movement"))
    statModifiers.push(new statModifier("Attack"))
    statModifiers.push(new statModifier("Defense"))
}

function setupStatUpgraders() {
    statUpgraders = []
    statUpgraders.push(new statUpgrader("Hp"))
    statUpgraders.push(new statUpgrader("Movement"))
    statUpgraders.push(new statUpgrader("Attack"))
    statUpgraders.push(new statUpgrader("Defense"))
    statUpgraders.push(new statUpgrader("Range"))
}

function startRun() {
    
}

async function passTurn() {
    // Start enemy turn
    await resolveEnemyTurns()

    // Reset entity values
    currentMap.startNextTurn()
    resetPlayerInfo()
}

function checkWinLoss() {
    var enemies = []

    // Adds all enemies to the enemies array
    for (var i = 0; i < currentMap.width; i++) {
        for (var j = 0; j < currentMap.height; j++) {
            if (currentMap.cells[i][j].entity != null && currentMap.cells[i][j].entity != player) {
                enemies.push(currentMap.cells[i][j].entity)
            }
        }
    }

    if (enemies.length == 0) {
        win()
    } else if (player.currentHp <= 0) {
        lose()
    }
}

async function win() {
    currentMapIndex++
    if (currentMapIndex < maps.length) {
        setupMaps()
        resetPlayerInfo()
        await upgradePlayer()
        resetPlayerInfo()
    } else if (currentLoop < maxLoops) {
        currentLoop++
        currentMapIndex = 0
        setupMaps()
        resetPlayerInfo()
        await upgradePlayer()
        resetPlayerInfo()
    } else {
        console.log("Game Over?")
    }

}

function lose() {
    currentMapIndex = 0
    currentLoop = 1
    player = new entity(6, 1, 1, 1, 2)
    setupMaps()
}

async function resolveEnemyTurns() {
    var enemies = []

    // Adds all enemies to the enemies array
    for (var i = 0; i < currentMap.width; i++) {
        for (var j = 0; j < currentMap.height; j++) {
            if (currentMap.cells[i][j].entity != null && currentMap.cells[i][j].entity != player) {
                enemies.push(currentMap.cells[i][j].entity)
            }
        }
    }

    // Sorts enemies, putting closest first and furthest last
    enemies.sort((a, b) => {
        return currentMap.distFromCellToCell(a.currentCell, player.currentCell) - currentMap.distFromCellToCell(b.currentCell, player.currentCell)
    })
    
    // Move & Attack with all enemies
    var totalAttackOnPlayer = 0
    for (var i = 0; i < enemies.length; i++) {
        var enemy = enemies[i]
        var distGrid = currentMap.getDistGrid(player.currentCell, enemy.currentCell)
        
        while (enemy.currentMovement > 1 && distGrid[enemy.currentCell.coordRow][enemy.currentCell.coordCol] != enemy.currentRange) {
            await sleep(200)
            var cellNeighbors = currentMap.getCellNeighbors(enemy.currentCell)
            var targetCell = enemy.currentCell
            var targetCellDist = distGrid[enemy.currentCell.coordRow][enemy.currentCell.coordCol]
            var targetCellInRange = enemy.currentRange >= currentMap.distFromCellToCell(player.currentCell, enemy.currentCell)
            for (var j = 0; j < cellNeighbors.length; j++) {
                var neighborRow = cellNeighbors[j].coordRow
                var neighborCol = cellNeighbors[j].coordCol
                var cellDist = distGrid[neighborRow][neighborCol]
                if (targetCellInRange) {
                    if (cellDist <= enemy.currentRange && cellDist > targetCellDist) {
                        if (enemy.currentMovement >= currentMap.distFromCellToCell(enemy.currentCell, cellNeighbors[j]) && cellNeighbors[j].entity == null) {
                            // Cell is a suitable target!
                            targetCell = cellNeighbors[j]
                            targetCellDist = cellDist
                            targetCellInRange = enemy.currentRange >= currentMap.distFromCellToCell(player.currentCell, cellNeighbors[j])
                        }
                    }
                } else {
                    if (cellDist < targetCellDist) {
                        if (enemy.currentMovement >= currentMap.distFromCellToCell(enemy.currentCell, cellNeighbors[j]) && cellNeighbors[j].entity == null) {
                            // Cell is a suitable target!
                            targetCell = cellNeighbors[j]
                            targetCellDist = cellDist
                            targetCellInRange = enemy.currentRange >= currentMap.distFromCellToCell(player.currentCell, cellNeighbors[j])
                        }
                    }
                }
            }

            // No better cell to move to!
            if (targetCell == enemy.currentCell) {
                break;
            }

            // Move this enemy to target cell!
            enemy.currentMovement -= currentMap.distFromCellToCell(enemy.currentCell, targetCell)
            targetCell.setEntity(enemy.currentCell.takeEntity())
        }

        if (distGrid[enemy.currentCell.coordRow][enemy.currentCell.coordCol] <= enemy.currentRange) {
            // Time to attack!
            totalAttackOnPlayer += enemy.currentAttack
        }
    }

    player.takeDamage(Math.floor(totalAttackOnPlayer / player.currentDefense))

}

async function upgradePlayer() {
    
    displayPlayerUpgrades = true

    while (displayPlayerUpgrades) {
        await sleep(100)
    }
}

function resetPlayerInfo() {
    playerHasActed = false
    for (var i = 0; i < rollableDice.length; i++) {
        rollableDice[i].reset()
    }
    for (var i = 0; i < statModifiers.length; i++) {
        statModifiers[i].reset()
    }
    player.currentMovement = player.maxMovement
    player.currentAttack = player.maxAttack
    player.currentDefense = player.maxDefense
    player.currentRange = player.maxRange
}

function onMousePress(mouseEvent) {
    // Clicked on a cell?
    var chosenCell = currentMap.getCellByXY(mouseEvent.clientX, mouseEvent.clientY)
    // Clicked on a die?
    var chosenDie = null
    // Clicked on a stat modifier box?
    var chosenStatModifier = null
    // Clicked on a stat?
    var chosenStat = null

    // Check dice for which one was clicked, if any
    for (var i = 0; i < rollableDice.length; i++) {
        if (rollableDice[i].isClicked(mouseEvent.clientX, mouseEvent.clientY)) {
            chosenDie = rollableDice[i]
        }
    }
    
    // Check stat modifiers for which one was clicked, if any
    for (var i = 0; i < statModifiers.length; i++) {
        if (statModifiers[i].isClicked(mouseEvent.clientX, mouseEvent.clientY)) {
            chosenStatModifier = statModifiers[i]
        }
    }

    for (var i = 0; i < statUpgraders.length; i++) {
        if (statUpgraders[i].isClicked(mouseEvent.clientX, mouseEvent.clientY)) {
            chosenStat = statUpgraders[i].stat
        }
    }
    
    if (chosenDie != null && !displayPlayerUpgrades) {
        // A die was clicked on

        dieChosen(chosenDie)

    } else if (chosenStatModifier != null && !displayPlayerUpgrades) {
        // A stat modifier was selected

        statModChosen(chosenStatModifier)

    } else if (chosenCell != null && !displayPlayerUpgrades) {
        // A cell was clicked on

        cellChosen(chosenCell)

    } else if (chosenStat != null) {
        // A stat was clicked on (probably for an upgrade)

        statChosen(chosenStat)
    }

    for (var i = 0; i < rollableDice.length; i++) {
        rollableDice[i].select(rollableDice[i].isClicked(mouseEvent.clientX, mouseEvent.clientY))
    }

}

function onKeyDown(event) {
    if (displayPlayerUpgrades) {
        return
    }
    switch (event.key) {
        case "1":
            dieChosen(rollableDice[0])
            rollableDice[1].select(false)
            rollableDice[2].select(false)
            break
        case "2":
            dieChosen(rollableDice[1])
            rollableDice[0].select(false)
            rollableDice[2].select(false)
            break
        case "3":
            dieChosen(rollableDice[2])
            rollableDice[0].select(false)
            rollableDice[1].select(false)
            break
        case " ":
            passTurn()
            break
        default:
            break
    }
}

function dieChosen(chosenDie) {
    if (!playerHasActed) {
        // Checks if the player has moved yet - we can't assign dice if we've already moved!

        if (chosenDie.isRolling) {
            chosenDie.stopRolling()
        } else {
            chosenDie.select(true)
        }
    }
}

function statModChosen(chosenStatModifier) {
    if (!playerHasActed) {
        // Checks if the player has moved yet - we can't assign dice if we've already moved!

        // Check if there is a die we are currently selecting
        var selectedDie = null
        for (var i = 0; i < rollableDice.length; i++) {
            if (rollableDice[i].isSelected) {
                selectedDie = rollableDice[i]
            }
        }
        if (selectedDie != null) {
            selectedDie.assignModifier(chosenStatModifier)
            selectedDie.select(false)
        }
    }
}

function cellChosen(chosenCell) {
    var allDiceAssigned = true
    for (var i = 0; i < rollableDice.length; i++) {
        if (!rollableDice[i].isAssigned) {
            allDiceAssigned = false
        }
    }

    if (!allDiceAssigned) {
        // Player must assign all dice before moving!
    } else if (chosenCell.canBeVisited) {
        // Move to this cell
        player.currentMovement -= currentMap.distFromCellToCell(player.currentCell, chosenCell)
        chosenCell.setEntity(player.currentCell.takeEntity())
        playerHasActed = true

    } else if (currentMap.getRangeGrid(player.currentCell)[chosenCell.coordRow][chosenCell.coordCol] <= player.currentRange && chosenCell.entity != null && chosenCell.entity != player) {
        // Attack this cell's entity
        var enemy = chosenCell.entity
        if (enemy.currentDefense <= player.currentAttack) {
            player.currentAttack -= enemy.currentDefense
            playerHasActed = true
            enemy.takeDamage(1)
        } 
    }
}

function statChosen(chosenStat) {
    switch (chosenStat) {
        case "Hp":
            player.currentHp = player.maxHp
            break
        case "Movement":
            player.maxMovement++
            break
        case "Attack":
            player.maxAttack++
            break
        case "Defense":
            player.maxDefense++
            break
        case "Range":
            player.maxRange++
            break
        default:
            console.log("No stat chosen!")
    }

    displayPlayerUpgrades = false
    
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight)
  
    cellWidth = myCanvas.width / (currentMap.width + 1)   // This +1 is to create a half-cell buffer around the edge of the screen
    cellHeight = myCanvas.height / (currentMap.height + 1.5) // This +1.5 is to create a 3/4-cell buffer around the edge of the screen
    cellSize = Math.min(cellWidth, cellHeight)
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

class map {
    constructor(entityType = null, cells = [[]]) {
        this.width = cells.length
        this.height = cells[0].length
        this.cells = []
        this.entityType = entityType

        this.initializeMap = function() {

            for (var i = 0; i < this.width; i++) {
                this.cells.push([])
                for (var j = 0; j < this.height; j++) {
                    this.cells[i].push(new cell(cells[i][j], i, j))
                    if (cells[i][j] == currentLoop) {
                        this.cells[i][j].setEntity(this.entityType.getCopy())
                    } else if (cells[i][j] == -2) {
                        this.cells[i][j].setEntity(player)
                    }
                }
            }
        }

        this.drawMap = function() {
            var startX = myCanvas.width / 2 - cellSize * this.width / 2
            var startY = myCanvas.height / 2 - cellSize * this.height / 2

            // Draws the grid

            for (var i = 0; i < this.width; i++) {
                for (var j = 0; j < this.height; j++) {
                    this.cells[i][j].canBeVisited = false
                    this.cells[i][j].canBeAttacked = false
                }
            }

            var distGrid = this.getDistGrid(player.currentCell)
            for (var i = 0; i < this.width; i++) {
                for (var j = 0; j < this.height; j++) {
                    if (distGrid[i][j] >= 0 && distGrid[i][j] <= player.currentMovement) {
                        this.cells[i][j].canBeVisited = true
                        var rangeGrid = this.getRangeGrid(this.cells[i][j])
                        for (var k = 0; k < this.width; k++) {
                            for (var l = 0; l < this.height; l++) {
                                if (rangeGrid[k][l] >= 0 && rangeGrid[k][l] <= player.currentRange) {
                                    this.cells[k][l].canBeAttacked = true
                                }
                            }
                        }
                    }
                }
            }

            for (var i = 0; i < this.width; i++) {
                for (var j = 0; j < this.height; j++) {
                    var leftCoord = startX + j * cellSize
                    var topCoord = startY + i * cellSize
                    this.cells[i][j].drawCell(leftCoord, topCoord, cellSize, cellSize)
                }
            }
            
            var statTextSize = myCanvas.width / 40

            // Draws the player's stats
            startX = myCanvas.width * 1 / 4 - cellSize * this.width / 4

            if (displayPlayerUpgrades)  {


                textAlign(CENTER, CENTER)
                textSize(myCanvas.width / 20)
                stroke(0)
                strokeWeight(myCanvas.width / 200)
                fill("#00000099")
                rect(myCanvas.width / 4, myCanvas.height / 4, myCanvas.width / 2, myCanvas.height / 2)
                fill(255)
                text("Select a stat to\npermanently increase\nit by 1, or select HP\nto restore to 6 HP", myCanvas.width / 2, myCanvas.height / 2)

                statUpgraders[0].drawStatUpgrader(startX - statTextSize * 2.75, myCanvas.height / 2 + statTextSize * 5 / 4 * -2, statTextSize * 3, statTextSize * 5 / 4)
                statUpgraders[1].drawStatUpgrader(startX - statTextSize * 5.9, myCanvas.height / 2 + statTextSize * 5 / 4 * -1, statTextSize * 6.15, statTextSize * 5 / 4)
                statUpgraders[2].drawStatUpgrader(startX - statTextSize * 4, myCanvas.height / 2 + statTextSize * 5 / 4 * 0, statTextSize * 4.25, statTextSize * 5 / 4)
                statUpgraders[3].drawStatUpgrader(startX - statTextSize * 5, myCanvas.height / 2 + statTextSize * 5 / 4 * 1, statTextSize * 5.25, statTextSize * 5 / 4)
                statUpgraders[4].drawStatUpgrader(startX - statTextSize * 4.25, myCanvas.height / 2 + statTextSize * 5 / 4 * 2, statTextSize * 4.5, statTextSize * 5 / 4)
            }

            var statLine =  "\nHP: " + player.currentHp +
                            "\nMovement: " + player.maxMovement +
                            "\nAttack: " + player.maxAttack +
                            "\nDefense: " + player.maxDefense +
                            "\nRange: " + player.maxRange

            fill('#FFFFFF')
            textSize(statTextSize)
            stroke(0)
            strokeWeight(3)
            textAlign(CENTER, CENTER)
            text("\\ Player Stats /", startX, myCanvas.height / 4)
            textAlign(RIGHT, CENTER)
            text(statLine, startX, myCanvas.height / 2)
            textAlign(LEFT, CENTER)
            text("\n +     = " + player.currentMovement + "\n +     = " + player.currentAttack + "\n +     = " + player.currentDefense, startX, myCanvas.height / 2)

            // Draws the enemy's stats
            startX = myCanvas.width * 3 / 4 + cellSize * this.width / 4
            var statLine =  "\nHP: " + this.entityType.maxHp + 
                            "\nMovement: " + this.entityType.maxMovement +
                            "\nAttack: " + this.entityType.maxAttack + 
                            "\nDefense: " + this.entityType.maxDefense +
                            "\nRange: " + this.entityType.maxRange

            fill('#FFFFFF')
            textSize(statTextSize)
            stroke(0)
            strokeWeight(3)
            textAlign(CENTER, CENTER)
            text("\\ Enemy Stats /", startX, myCanvas.height / 4)
            textAlign(RIGHT, CENTER)
            text(statLine, startX + (myCanvas.width - startX) / 2, myCanvas.height / 2)
        }

        this.getCellByXY = function(x, y) {
            var startX = myCanvas.width / 2 - cellSize * this.width / 2
            var startY = myCanvas.height / 2 - cellSize * this.height / 2
            
            for (var i = 0; i < this.width; i++) {
                for (var j = 0; j < this.height; j++) {
                    var withinX = (x > startX + j * cellSize && x < startX + (j + 1) * cellSize)
                    var withinY = (y > startY + i * cellSize && y < startY + (i + 1) * cellSize)
                    if (withinX && withinY) {
                        return this.cells[i][j]
                    }
                }
            } 
            return null
        }

        this.distFromCellToCell = function(fromCell, toCell) {
            return this.getDistGrid(fromCell, toCell)[toCell.coordRow][toCell.coordCol]
            
        }

        this.getDistGrid = function(fromCell, targetCell = null) {
            var distGrid = []
            for (var i = 0; i < this.cells.length; i++) {
                distGrid.push([])
                for (var j = 0; j < this.cells[0].length; j++) {
                    distGrid[i].push(999)
                }
            }

            distGrid[fromCell.coordRow][fromCell.coordCol] = 0
            var cellsToCheck = []
            cellsToCheck.push(fromCell)    
            while (cellsToCheck.length > 0) {
                var currentCell = cellsToCheck.shift()
                var currentCellNeighbors = this.getCellNeighbors(currentCell)
                for (var i = 0; i < currentCellNeighbors.length; i++) {
                    var neighbor = currentCellNeighbors[i]
                    if (this.cellsAreOrthogonal(currentCell, neighbor) && (neighbor.isEmpty() || neighbor == targetCell)) {
                        if (distGrid[neighbor.coordRow][neighbor.coordCol] > distGrid[currentCell.coordRow][currentCell.coordCol] + 2) {
                            distGrid[neighbor.coordRow][neighbor.coordCol] = distGrid[currentCell.coordRow][currentCell.coordCol] + 2
                            cellsToCheck.push(neighbor)
                        }
                    } else if (this.cellsAreDiagonal(currentCell, neighbor) && (neighbor.isEmpty() || neighbor == targetCell)) {
                        if (distGrid[neighbor.coordRow][neighbor.coordCol] > distGrid[currentCell.coordRow][currentCell.coordCol] + 3) {
                            distGrid[neighbor.coordRow][neighbor.coordCol] = distGrid[currentCell.coordRow][currentCell.coordCol] + 3
                            cellsToCheck.push(neighbor)
                        }
                    }
                }
            }
            return distGrid
        }

        this.getRangeGrid = function(fromCell) {
            var rangeGrid = []
            for (var i = 0; i < this.cells.length; i++) {
                rangeGrid.push([])
                for (var j = 0; j < this.cells[0].length; j++) {
                    rangeGrid[i].push(999)
                }
            }

            rangeGrid[fromCell.coordRow][fromCell.coordCol] = 0
            var cellsToCheck = []
            cellsToCheck.push(fromCell)    
            while (cellsToCheck.length > 0) {
                var currentCell = cellsToCheck.shift()
                var currentCellNeighbors = this.getCellNeighbors(currentCell)
                for (var i = 0; i < currentCellNeighbors.length; i++) {
                    var neighbor = currentCellNeighbors[i]
                    if (this.cellsAreOrthogonal(currentCell, neighbor) && neighbor.baseValue != -1) {
                        if (rangeGrid[neighbor.coordRow][neighbor.coordCol] > rangeGrid[currentCell.coordRow][currentCell.coordCol] + 2) {
                            rangeGrid[neighbor.coordRow][neighbor.coordCol] = rangeGrid[currentCell.coordRow][currentCell.coordCol] + 2
                            cellsToCheck.push(neighbor)
                        }
                    } else if (this.cellsAreDiagonal(currentCell, neighbor) && neighbor.baseValue != -1) {
                        if (rangeGrid[neighbor.coordRow][neighbor.coordCol] > rangeGrid[currentCell.coordRow][currentCell.coordCol] + 3) {
                            rangeGrid[neighbor.coordRow][neighbor.coordCol] = rangeGrid[currentCell.coordRow][currentCell.coordCol] + 3
                            cellsToCheck.push(neighbor)
                        }
                    }
                }
            }
            return rangeGrid
        }

        this.getCellNeighbors = function(originCell) {
            var cellNeighbors = []
            var startRow = originCell.coordRow
            var startCol = originCell.coordCol
            // Going through all possible neighbor permutations
            for (var i = -1; i <= 1; i++) {
                for (var j = -1; j <= 1; j++) {
                    if (startRow + i < 0 || startRow + i >= this.cells.length) {
                        continue
                    }
                    if (startCol + j < 0 || startCol + j >= this.cells[0].length) {
                        continue
                    }
                    if (i == 0 && j == 0) {
                        continue
                    }
                    cellNeighbors.push(this.cells[startRow + i][startCol + j])
                }
            }
            return cellNeighbors
        }

        this.cellsAreOrthogonal = function(cell1, cell2) {
            var rowDif = Math.abs(cell1.coordRow - cell2.coordRow)
            var colDif = Math.abs(cell1.coordCol - cell2.coordCol)
            if ((rowDif == 0 && colDif == 1) || (rowDif == 1 && colDif == 0)) {
                return true
            } else {
                return false
            }
        }

        this.cellsAreDiagonal = function(cell1, cell2) {
            var rowDif = Math.abs(cell1.coordRow - cell2.coordRow)
            var colDif = Math.abs(cell1.coordCol - cell2.coordCol)
            if (rowDif == 1 && colDif == 1) {
                return true
            } else {
                return false
            }
        }

        this.startNextTurn = function() {
            for (var i = 0; i < this.width; i++) {
                for (var j = 0; j < this.width; j++) {
                    if (this.cells[i][j].entity != null) {
                        this.cells[i][j].entity.currentMovement = this.cells[i][j].entity.maxMovement
                        this.cells[i][j].entity.currentAttack = this.cells[i][j].entity.maxAttack
                        this.cells[i][j].entity.currentDefense = this.cells[i][j].entity.maxDefense
                        this.cells[i][j].entity.currentRange = this.cells[i][j].entity.maxRange
                    }
                }
            }
        }
    }
}

class cell {
    constructor(baseValue = 0, coordRow = -1, coordCol = -1) {
        this.baseValue = baseValue
        this.coordRow = coordRow
        this.coordCol = coordCol
        this.entity = null
        this.canBeVisited = false
        this.canBeAttacked = false

        this.drawCell = function(startX = 0, startY = 0, width = 0, height = 0) {
            if (this.entity == null) {
                if (this.baseValue == -1) {
                    fill('#555555')
                } else {
                    fill('#353030')
                }
                strokeWeight(3)
                rect(startX, startY, width, height)
            }
            else {
                if (this.entity == player){
                    fill('#00FF00')
                    rect(startX, startY, width, height)
                    fill('#FFFFFF')
                    textSize(width / 2)
                    stroke(0)
                    strokeWeight(4)
                    textAlign(CENTER, CENTER)
                    text(this.entity.currentHp, startX + width / 2, startY + height / 2)
                } else {
                    fill('#FF0000')
                    rect(startX, startY, width, height)
                    fill('#FFFFFF')
                    textSize(width / 2)
                    stroke(0)
                    strokeWeight(4)
                    textAlign(CENTER, CENTER)
                    text(this.entity.currentHp, startX + width / 2, startY + height / 2)
                }
            }

            if (this.canBeVisited) {
                fill('#00FF0022') 
                strokeWeight(1)
                rect(startX, startY, width, height)
            } else if (this.canBeAttacked) {
                fill('#0000FF22')
                strokeWeight(1)
                rect(startX, startY, width, height)
            }
        }

        this.setEntity = function(newEntity) {
            this.entity = newEntity
            this.entity.currentCell = this
        }

        this.getEntity = function() {
            return this.entity
        }
        
        this.takeEntity = function() {
            var takenEntity = this.entity
            this.entity = null
            return takenEntity
        }

        this.isEmpty = function() {
            return (this.baseValue != -1 && this.entity == null)
        }

        this.setCanBeVisited = function(canBeVisited) {
            this.canBeVisited = canBeVisited
        }
    }
}

class entity {
    constructor(hp = 0, movement = 0, attack = 0, defense = 0, range = 0) {
        this.maxHp = hp
        this.currentHp = hp
        this.maxMovement = movement
        this.currentMovement = movement
        this.maxAttack = attack
        this.currentAttack = attack
        this.maxDefense = defense
        this.currentDefense = defense
        this.maxRange = range
        this.currentRange = range

        this.currentCell = null

        this.takeDamage = function(damage) {
            this.currentHp -= damage
            if (this.currentHp <= 0) {
                this.die()
            }
        }

        this.die = function() {
            this.currentCell.entity = null
            checkWinLoss()
        }

        this.getCopy = function() {
            return new entity(this.maxHp, this.maxMovement, this.maxAttack, this.maxDefense, this.maxRange)
        }
    }
}

class rollableDie {
    constructor(minVal = 1, maxVal = 6) {
        this.minVal = minVal
        this.maxVal = maxVal

        this.startX = 0
        this.startY = 0
        this.width = 0
        this.height = 0
        this.isRolling = true
        this.isSelected = false
        this.isAssigned = false
        this.assignedModifier = null

        this.val = 0

        this.reset = function() {
            this.startRolling()
            this.select(false)
            this.unassignModifier()
        }

        this.rollValue = function() {
            this.val = Math.floor(Math.random() * (this.maxVal - this.minVal + 1) + this.minVal)
            return this.val
        }

        this.drawDie = function(startX = 0, startY = 0, width = 0, height = 0) {
            this.startX = startX
            this.startY = startY
            this.width = width
            this.height = height

            if (this.isRolling) {
                this.rollValue()
            }
            if (this.isSelected) {
                stroke("#00ff00")
                strokeWeight(4)
            } else {
                stroke(0)
                strokeWeight(2)
            }
            if (this.isAssigned) {
                fill("#aaaaff")
            } else {
                fill('#ffffff')
            }
            rect(startX, startY, width, height)
            fill('#000000')

            stroke(0)
            strokeWeight(2)
            textAlign(CENTER, CENTER)
            textSize(width)
            text(this.val, startX + width / 2, startY + height / 1.8)
        }

        this.startRolling = function() {
            this.isRolling = true
        }

        this.stopRolling = function() {
            this.isRolling = false
        }

        this.isClicked = function(mouseX, mouseY) {
            return (mouseX >= this.startX && mouseX <= this.startX + this.width && mouseY >= this.startY && mouseY <= this.startY + this.height)
        }

        this.select = function(selected) {
            this.isSelected = selected
        }

        this.assignModifier = function(assignedModifier) {
            if (this.assignedModifier != null) {
                this.unassignModifier()
            }
            this.isAssigned = true
            this.assignedModifier = assignedModifier
            this.assignedModifier.assignDie(this)
        }

        this.unassignModifier = function() {
            this.isAssigned = false
            if (this.assignedModifier != null) {
                this.assignedModifier.unassignDie()
                this.assignedModifier = null
            }
        }
    }
}

class statModifier {
    constructor(modifiedStat = null) {
        this.modifiedStat = modifiedStat
        this.val = 0
        this.startX = 0
        this.startY = 0
        this.width = 0
        this.height = 0

        this.assignedDie = null

        this.reset = function() {
            this.unassignDie()
        }

        this.drawStatModifier = function(startX = 0, startY = 0, width = 0, height = 0) {
            this.startX = startX
            this.startY = startY
            this.width = width
            this.height = height

            
            stroke(0)
            strokeWeight(2)
            fill(255)
            rect(startX, startY, width, height)

            if (this.val != 0) {
                fill(0)
                textAlign(CENTER, CENTER)
                textSize(width)
                text(this.val, startX + width / 2, startY + height / 1.8)
            }
        }

        this.assignDie = function(assignedDie) {
            if (this.assignedDie != null) {
                this.assignedDie.unassignModifier()
            }
            this.assignedDie = assignedDie
            this.val = this.assignedDie.val
            switch (this.modifiedStat) {
                case "Movement":
                    player.currentMovement += this.val
                    break
                case "Attack":
                    player.currentAttack += this.val
                    break
                case "Defense":
                    player.currentDefense += this.val
                    break
                default:
                    console.log("Invalid modified Stat")
            }
        }

        this.unassignDie = function() {
            this.assignedDie = null
            switch (this.modifiedStat) {
                case "Movement":
                    player.currentMovement -= this.val
                    break
                case "Attack":
                    player.currentAttack -= this.val
                    break
                case "Defense":
                    player.currentDefense -= this.val
                    break
                default:
                    console.log("Invalid modified Stat")
            }
            this.val = 0
        }

        this.isClicked = function(mouseX, mouseY) {
            return (mouseX >= this.startX && mouseX <= this.startX + this.width && mouseY >= this.startY && mouseY <= this.startY + this.height)
        }
    }
}

class statUpgrader {
    constructor(stat = null) {
        this.stat = stat
        this.startX = 0
        this.startY = 0
        this.width = 0
        this.height = 0

        this.drawStatUpgrader = function(startX = 0, startY = 0, width = 0, height = 0) {
            this.startX = startX
            this.startY = startY
            this.width = width
            this.height = height

            stroke(0)
            strokeWeight(2)
            fill('#00ff0011')
            rect(this.startX, this.startY, this.width, this.height)
            
        }

        this.isClicked = function(mouseX, mouseY) {
            if (displayPlayerUpgrades) {
                return (mouseX >= this.startX && mouseX <= this.startX + this.width && mouseY >= this.startY && mouseY <= this.startY + this.height)
            } else {
                return false
            }
        }
    }
}