const assert = require('assert')
const { default: FreeSound } = require('freesound-client')

class SoundEditor {

  #freeSound
  #timeline

  constructor(freeSoundKey) {
    assert.equal(typeof freeSoundKey, 'string', `Must pass in a string 
    representing a freesound key`)
  
    this.#freeSound = new FreeSound()
    this.#freeSound.setToken(process.env.FREESOUND_KEY)

    this.#timeline = new Timeline()
  }

  //TODO: Only show results for those with permissive license
  async searchSounds(text) {
    return this.#freeSound.textSearch(text)
  }

  get timeline() {
    this.#timeline
  }
}

class Timeline {
  // 2D array of nodes representing rows and columns
  #nodes

  constructor() {
    this.#nodes = [[]]
  }

  addLayer() {
    this.#nodes.push([])
  }

  removeLayer(layer) {
    this.#nodes.splice(layer.id, 1)
  }

  insertNode(layer, node) {
    this.#nodes[layer.id].push(node)
  }

  removeNode(layer, node) {
    const idx = this.#nodes[layer.id].indexOf(node)
    this.#nodes[layer.id].splice(idx, 1)
  }

  /** Retrives the node in the layer inside given the time (in milliseconds) */
  getNode(layer, time) {
    const node = this.#nodes[layer.id].find(e => e.startTime <= time && e.endTime >= time)
    return node
  }

  /** Returns a copy of all the nodes */
  get nodes() {
    return this.#nodes.slice(0)
  }
}

class Node {
  startTime
  endTime
  soundId 
}

class Layer {
  id
  color
  isActive
}

module.exports = {
  SoundEditor
}