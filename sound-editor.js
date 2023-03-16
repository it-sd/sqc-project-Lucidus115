const assert = require('assert')
const { default: FreeSound } = require('freesound-client')

const defaultColors = [
  'rgb(240, 45, 45)', // Red
  'rgb(240, 100, 45)', // Orange
  'rgb(255, 195, 0)', // Yellow
  'rgb(65, 225, 30 )', // Green
  'rgb(30, 107, 218 )', // Blue
  'rgb(135, 32, 209)', // Violet
]

class SoundEditor {
  #freeSound
  #sounds
  timeline

  constructor(freeSoundKey) {
    assert.equal(typeof freeSoundKey, 'string', `Must pass in a string 
    representing a freesound key`)
  
    this.#freeSound = new FreeSound()
    this.#freeSound.setToken(process.env.FREESOUND_KEY)

    this.timeline = new Timeline()
    this.#update()
  }

  //TODO: Only show results for those with permissive license
  async searchSounds(text) {
    return this.#freeSound.textSearch(text)
  }

  /**
   * 
   * @returns an object with all the used sound data
   */
  async retrieveSoundData() {
    const data = {
      sounds: {},
      sampleInfo: []
    }
    for (let i = 0; i < this.timeline.numOfLayers; i++) {
      const layer = this.timeline.getLayer[i]
      
      for (const sample of layer.samples) {

        // Cache sound if not already cached
        if (data[sample.soundId] === undefined) {
          await this.#cacheSound(sample.soundId)
        }

        sampleInfo.push(sample)
      }
    }
    
    return data
  }

  async #cacheSound(soundId) {
    const sound = await this.#freeSound.getSound(sample.soundId)
    // Prefer high quality ogg format if possible
    this.#sounds[soundId] = sound.previews['preview-hq-ogg'] || sound.previews['preview-hq-mp3']
  }

  /**
   * @param {Timeline} timeline
   */
  set timeline(timeline) {
    assert(typeof timeline === Timeline, 'Timeline must be set to a valid timeline object')
    this.timeline = timeline

    // Clear cache
    this.#sounds.clear()
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
    const layer = new Layer(color)

    this.#layers.push(layer)
    return layer
  }

  /** Returns true if a layer was present and removed */
  removeLayer(layerId) {
    const layer = this.#layers[layerId]
    return this.#layers.splice(layer, 1).length != 0
  }

  getLayer(index) {
    return this.#layers[index]
  }

  get numOfLayers() {
    return this.#layers.length
  }

  /** Returns an immutable copy of layers and its data */
  get layers() {
    const arr = []
    for (let i = 0; i < this.#layers.length; i++) {
      const layer = this.#layers[i];
      arr.push({
        color: layer.color,
        name: layer.name,
        id: i
      })
    }
   
    return Object.freeze(arr)
  }
}

class SoundSample {
  startTime
  endTime
  soundId 
}

class Layer {
  color
  isActive
  name
  #samples

  constructor(color) {
    this.color = color
    this.isActive = true
    this.name = 'New Layer'
    this.#samples = []
  }

  insertSample(soundId) {
    //TODO: Get sound length and start time
    const sample = {
      startTime: 0,
      endTime: 0,
      soundId: soundId
    }

    this.#samples.push(sample)
  }

  /**
   * 
   * @param {number} soundId - The freesound id representing this sound 
   * @param {number} sampleId - The id of the sample
   */
  removeSample(soundId, sampleId) {
    // const idx = this.#samples.indexOf(soundSample)
    // this.#samples.splice(idx, 1)
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

  /** Returns an immutable copy of the samples list */
  get samples() {
    return Object.freeze(this.#samples.slice(0))
  }
}

module.exports = {
  SoundEditor
}