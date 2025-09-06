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

  player = new entity(6, 1, 1, 1, 2)
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

function onMousePress(mouseEvent) {
    chosenCell = currentMap.getCellByXY(mouseEvent.clientX, mouseEvent.clientY)
    if (chosenCell == null) {
        return
    }

    console.log(currentMap.distFromCellToCell(player.currentCell, chosenCell))

    if (!chosenCell.canBeVisited()) {
        // Invalid Move, maybe a valid attack

    } else if (currentMap.cellsAreOrthogonal(player.currentCell, chosenCell)) {
        // Move Orthogonally
        chosenCell.setEntity(player.currentCell.takeEntity())
    } else if (currentMap.cellsAreDiagonal(player.currentCell, chosenCell)) {
        // Move Diagonally
        chosenCell.setEntity(player.currentCell.takeEntity())
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
                    this.cells[i][j].drawCell(startX + j * cellSize, startY + i * cellSize, cellSize, cellSize)
                }
            }

            // Draws the player's stats

            // Draws the enemy's stats
            startX = myCanvas.width * 3 / 4 + cellSize * this.width / 4
            var statLine =  "\nHP: " + this.entityType.hp + 
                            "\nMovement: " + this.entityType.movement +
                            "\nAttack: " + this.entityType.attack + 
                            "\nDefense: " + this.entityType.defense +
                            "\nRange: " + this.entityType.range

            fill('#FFFFFF')
            textSize((myCanvas.width - startX) / 5)
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
                    if (this.cellsAreOrthogonal(currentCell, neighbor) && neighbor.canBeVisited()) {
                        if (distGrid[neighbor.coordRow][neighbor.coordCol] > distGrid[currentCell.coordRow][currentCell.coordCol] + 2) {
                            distGrid[neighbor.coordRow][neighbor.coordCol] = distGrid[currentCell.coordRow][currentCell.coordCol] + 2
                            cellsToCheck.push(neighbor)
                        }
                    } else if (this.cellsAreDiagonal(currentCell, neighbor) && neighbor.canBeVisited()) {
                        if (distGrid[neighbor.coordRow][neighbor.coordCol] > distGrid[currentCell.coordRow][currentCell.coordCol] + 3) {
                            distGrid[neighbor.coordRow][neighbor.coordCol] = distGrid[currentCell.coordRow][currentCell.coordCol] + 3
                            cellsToCheck.push(neighbor)
                        }
                    }
                }
            }
            return distGrid[toCell.coordRow][toCell.coordCol]
            
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
    }
}

class cell {
    constructor(baseValue = 0, coordRow = -1, coordCol = -1) {
        this.baseValue = baseValue
        this.coordRow = coordRow
        this.coordCol = coordCol
        this.entity = null

        this.drawCell = function(startX = 0, startY = 0, width = 0, height = 0) {
            if (this.entity == null) {
                if (this.baseValue == -1) {
                    fill('#555555')
                } else {
                    fill('#353030')
                }
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
                    text(this.entity.hp, startX + width / 2, startY + height / 2)
                } else {
                    fill('#FF0000')
                    rect(startX, startY, width, height)
                    fill('#FFFFFF')
                    textSize(width / 2)
                    stroke(0)
                    strokeWeight(4)
                    textAlign(CENTER, CENTER)
                    text(this.entity.hp, startX + width / 2, startY + height / 2)
                }
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

        this.canBeVisited = function() {
            return (this.baseValue != -1 && this.entity == null)
        }
    }
}

class entity {
    constructor(hp = 0, movement = 0, attack = 0, defense = 0, range = 0) {
        this.hp = hp
        this.movement = movement
        this.attack = attack
        this.defense = defense
        this.range = range
        this.currentCell = null

        this.takeDamage = function(damage) {
            this.hp -= damage
            if (this.hp <= 0) {
                this.die()
            }
        }

        this.die = function() {
            // This entity has died
        }

        this.getCopy = function() {
            return new entity(this.hp, this.movement, this.attack, this.defense, this.range)
        }
    }
}