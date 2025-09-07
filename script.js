let myCanvas
let backgroundColor

let currentRound = 1
let currentMapIndex = 0
let currentMap
let maps
let mapWidth = 5
let mapHeight = 5

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

  player = new entity(6, 4, 6, 3, 3)
  setupMaps()
}

function draw() {
  background(backgroundColor)

  currentMap.drawMap()
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

function startRun() {
    
}

function passTurn() {
    // Start enemy turn
    resolveEnemyTurns()

    // Reset entity values
    currentMap.startNextTurn()
}

function resolveEnemyTurns() {
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

function onMousePress(mouseEvent) {
    chosenCell = currentMap.getCellByXY(mouseEvent.clientX, mouseEvent.clientY)
    if (chosenCell == null) {
        return
    }

    if (chosenCell.canBeVisited) {
        // Move to this cell
        player.currentMovement -= currentMap.distFromCellToCell(player.currentCell, chosenCell)
        chosenCell.setEntity(player.currentCell.takeEntity())

    } else if (chosenCell.canBeAttacked && chosenCell.entity != null && chosenCell.entity != player) {
        // Attack this cell's entity
        var enemy = chosenCell.entity
        if (enemy.currentDefense < player.currentAttack) {
            enemy.takeDamage(1)
            player.currentAttack -= enemy.currentDefense
        } 
    }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight)
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
                    if (cells[i][j] == currentRound) {
                        this.cells[i][j].setEntity(this.entityType.getCopy())
                    } else if (cells[i][j] == -2) {
                        this.cells[i][j].setEntity(player)
                    }
                }
            }
        }

        this.drawMap = function() {
            var cellWidth = myCanvas.width / (this.width + 1)   // This +1 is to create a half-cell buffer around the edge of the screen
            var cellHeight = myCanvas.height / (this.height + 1.5) // This +1.5 is to create a 3/4-cell buffer around the edge of the screen
            var cellSize = Math.min(cellWidth, cellHeight)
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
            var statLine =  "\nHP: " + player.maxHp +
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
            text(statLine, startX * 1, myCanvas.height / 2)

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
            var cellWidth = myCanvas.width / (this.width + 1)   // This +1 is to create a half-cell buffer around the edge of the screen
            var cellHeight = myCanvas.height / (this.height + 1.5) // This +1.5 is to create a 3/4-cell buffer around the edge of the screen
            var cellSize = Math.min(cellWidth, cellHeight)
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
        }

        this.getCopy = function() {
            return new entity(this.maxHp, this.maxMovement, this.maxAttack, this.maxDefense, this.maxRange)
        }
    }
}