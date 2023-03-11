const assert = require('assert')
const { default: FreeSound } = require('freesound-client')

const defaultColors = [
  { r: 240, g: 45, b: 45 }, // Red
  { r: 240, g: 100, b: 45 }, // Orange
  { r: 255, g: 195, b: 0 }, // Yellow
  { r: 65, g: 225, b: 30 }, // Green
  { r: 30, g: 107, b: 218 }, // Blue
  { r: 135, g: 32, b: 209 }, // Violet
]

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
  #layers

  constructor() {
    this.#layers = [new Layer(defaultColors[0])]
  }

  addLayer() {
    const idx = this.#layers.length
    const color = defaultColors[idx % defaultColors.length]

    this.#layers.push(new Layer(color))
  }

  removeLayer(layer) {
    this.#layers.splice(layer.id, 1)
  }

  getLayer(index) {
    return this.#layers[index]
  }

  // /** Returns a copy of all the samples */
  // get samples() {
  //   return this.#samples.slice(0)
  // }
}

class SoundSample {
  startTime
  endTime
  soundId 
}

class Layer {
  color
  isActive
  #samples

  constructor(color) {
    this.color = color
    this.isActive = true
    this.#samples = []
  }

  insertSample(soundSample) {
    this.#samples.push(soundSample)
  }

  removeSample(soundSample) {
    const idx = this.#samples.indexOf(soundSample)
    this.#samples.splice(idx, 1)
  }

  moveSample(newLayer, soundSample) {
    this.removeSample(soundSample)
    newLayer.insertSample(soundSample)
  }

  /** Retrives the sound sample in the layer inside given the time (in milliseconds) */
  getSample(time) {
    const soundSample = this.#samples.find(e => e.startTime <= time && e.endTime >= time)
    return soundSample
  }
}

module.exports = {
  SoundEditor
}