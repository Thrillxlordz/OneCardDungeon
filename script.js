let canvasX
let canvasY
let backgroundColor
let currentMapIndex = 0
let maps
let mapWidth = 5
let mapHeight = 5

let spider
let skeleton
let ogre
let dragon

function setup() {
  canvasX = windowWidth * 0.95
  canvasY = windowHeight * 0.84
  let myCanvas = createCanvas(canvasX, canvasY)
  myCanvas.parent("#canvas")
  backgroundColor = window.getComputedStyle(document.getElementById("canvas")).getPropertyValue('background-color')
  background(backgroundColor)

  setupMaps()
}

function draw() {
  background(backgroundColor)

  maps[currentMapIndex].drawMap()
}

// Maps consist of cells with values -2 = playerStart, -1 = wall, 0 = empty,  1+ = enemyStart (1 = round 1, 2 = round 2, etc)
function setupMaps() {
    spider = new entity(2, 5, 4, 4, 3)
    skeleton = new entity(3, 4, 5, 4, 4)
    ogre = new entity(5, 3, 7, 7, 2)
    dragon = new entity(5, 5, 5, 5, 5)

    maps = []
    maps.push(new map(spider, [ [3, 2, 0, 1, 0],
                                [0, 0, 0, -1, 2],
                                [0, 0, 3, 0, 1],
                                [0, -1, 0, -1, 3],
                                [-2, 0, 3, 0, 2]]))
}

function startRun() {
    
}

class map {
    constructor(entityType = null, cells = [[]]) {
        this.width = cells.length
        this.height = cells[0].length
        this.cells = []
        this.entityType = entityType
        for (var i = 0; i < this.width; i++) {
            this.cells.push([])
            for (var j = 0; j < this.height; j++) {
                this.cells[i].push(new cell(cells[i][j]))
                if (cells[i][j] > 0) {
                    this.cells[i][j].setEntity(this.entityType.getCopy())
                }
            }
        }

        this.drawMap = function() {
            var cellWidth = canvasX / (this.width + 1)   // This +1 is to create a half-cell buffer around the edge of the screen
            var cellHeight = canvasY / (this.height + 1) // This +1 is to create a half-cell buffer around the edge of the screen
            var cellSize = Math.min(cellWidth, cellHeight)
            var startX = canvasX / 2 - cellSize * this.width / 2
            var startY = canvasY / 2 - cellSize * this.height / 2
            for (var i = 0; i < this.width; i++) {
                for (var j = 0; j < this.height; j++) {
                    this.cells[i][j].drawCell(startX + j * cellSize, startY + i * cellSize, cellSize, cellSize)
                }
            } 
        }
    }
}

class cell {
    constructor(baseValue = 0) {
        this.baseValue = baseValue
        this.entity = null

        this.drawCell = function(startX, startY, width, height) {
            if (this.baseValue == -1) {
                fill('#555555')
            } else {
                fill('#353030')
            }
            rect(startX, startY, width, height)
        }

        this.setEntity = function() {

        }

        this.getEntity = function() {

        }
        
        this.takeEntity = function() {

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