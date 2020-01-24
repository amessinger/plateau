/* global fetch, Phaser, io */

const gameId = (new URLSearchParams(window.location.search)).get('game') || 0

fetch(`api/games/${gameId}`).then(response => response.json()).then(function ({ mapId, objects }) {
  fetch(`api/maps/${mapId}`).then(response => response.json()).then(function ({ image, width, height, cellSize }) {
    start(image, width, height, cellSize, objects)
  })
})

function start (image, width, height, cellSize, objects) {
  const config = {
    type: Phaser.AUTO,
    physics: {
      default: 'arcade'
    },
    width,
    height,
    scene: {
      preload,
      create
    }
  }

  const game = new Phaser.Game(config)

  function preload () {
    this.load.setBaseURL('/assets')

    this.load.image('map', image)
    objects.forEach(({ name, image }) => {
      this.load.image(name, image)
    })

    this.data.set('socket', io.connect())
  }

  function create () {
    const socket = this.data.get('socket')

    // Drawing the map
    this.add.image(width / 2, height / 2, 'map')

    // Drawing the grid
    const outlineFillColor = '0x000000'
    const outlineFillOpacity = 0.1
    this.add.grid(
      width / 2, height / 2, // position
      width, height,
      cellSize, cellSize,
      null, null, // fill
      outlineFillColor, outlineFillOpacity
    )

    // Drawing objects
    objects.forEach(({ name, x, y }) => {
      const { x: x1, y: y1 } = getCellPosition({ x, y }, cellSize)
      this.add.image(x1, y1, name)
        .setDisplaySize(cellSize, cellSize)
    })

    // Drawing hover cell
    const hoverCell = this.add.rectangle(0, 0, cellSize, cellSize, '0x000000', 0.3)

    // Updating hover cell on socket receiving data
    socket.on('hoverCell', function (position) {
      const { x, y } = getCellPosition(position, cellSize)
      hoverCell.setPosition(x, y)
      updateHoverCell(game, hoverCell, position, cellSize)
    })

    // Updating hover cell on mouse move
    this.input.on('pointermove', function (pointer) {
      const matchingCell = getMatchingCell(pointer, cellSize)

      updateHoverCell(this, hoverCell, matchingCell, cellSize, function () {
        socket.emit('hoverCell', matchingCell)
      })
    }, this)
  }
}

function updateHoverCell (game, hoverCell, position, cellSize, callback) {
  if (!positionEquals(position, game.data.get('hoverCellPosition'))) {
    const { x, y } = getCellPosition(position, cellSize)
    hoverCell.setPosition(x, y)
    game.data.set('hoverCellPosition', position)
    if (callback) {
      callback()
    }
  }
}

function positionEquals (p1, p2) {
  return p1 && p2 && p1.x === p2.x && p1.y === p2.y
}

function getMatchingCell ({ x, y }, cellSize) {
  return {
    x: Math.floor(x / cellSize),
    y: Math.floor(y / cellSize)
  }
}

function getCellPosition ({ x, y }, cellSize) {
  return {
    x: Math.round(x * cellSize + cellSize / 2),
    y: Math.round(y * cellSize + cellSize / 2)
  }
}
