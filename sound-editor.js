const assert = require('assert')
const { default: FreeSound } = require('freesound-client')

const defaultColors = [
  'rgb(240, 45, 45)', // Red
  'rgb(240, 100, 45)', // Orange
  'rgb(255, 195, 0)', // Yellow
  'rgb(65, 225, 30 )', // Green
  'rgb(30, 107, 218 )', // Blue
  'rgb(135, 32, 209)' // Violet
]

class SoundEditor {
  #freeSound
  #sounds
  #project

  constructor (freeSoundKey) {
    assert.equal(typeof freeSoundKey, 'string', `Must pass in a string 
    representing a freesound key`)

    this.#freeSound = new FreeSound()
    this.#freeSound.setToken(process.env.FREESOUND_KEY)

    this.#sounds = {}
    this.#project = new Project(0)
  }

  // TODO: Only show results for those with permissive license
  async searchSounds (text) {
    return this.#freeSound.textSearch(text)
  }

  async getSoundData (soundId) {
    return this.#freeSound.getSound(soundId)
  }

  /**
   *
   * @returns an object with all the used sound data
   */
  async retrieveSoundData () {
    const data = {
      sounds: {},
      sampleInfo: []
    }
    for (let i = 0; i < this.#project.timeline.numOfLayers; i++) {
      const layer = this.#project.timeline.getLayer(i)

      for (const sample of layer.samples) {
        // Cache sound if not already cached
        if (data.sounds[sample.soundId] === undefined) {
          await this.#cacheSound(sample.soundId)
        }
        data.sampleInfo.push(sample)
      }
    }
    data.sounds = this.#sounds

    return data
  }

  async #cacheSound (soundId) {
    const sound = await this.#freeSound.getSound(soundId)
    // Prefer high quality ogg format if possible
    this.#sounds[soundId] = sound.previews['preview-hq-ogg'] || sound.previews['preview-hq-mp3']
  }

  /**
   * @param {Project} project
   */
  set project (project) {
    this.#project = project

    // Clear cache
    this.#sounds.clear()
  }

  get project () {
    return this.#project
  }
}

class Project {
  title
  #id
  #timeline

  constructor (id) {
    assert(Number.isInteger(id), 'Expected id to be an Integer')
    this.#id = id
    this.#timeline = new Timeline()
    this.title = 'New Project'
  }

  get timeline () {
    return this.#timeline
  }

  get id () {
    return this.#id
  }
}

class Timeline {
  #layers

  constructor () {
    this.#layers = []
  }

  addLayer () {
    const idx = this.#layers.length
    const color = defaultColors[idx % defaultColors.length]
    const layer = new Layer(color)

    this.#layers.push(layer)
    return layer
  }

  /** Returns true if a layer was present and removed */
  removeLayer (layerId) {
    const layer = this.#layers[layerId]
    return this.#layers.splice(layer, 1).length !== 0
  }

  getLayer (index) {
    return this.#layers[index]
  }

  get numOfLayers () {
    return this.#layers.length
  }

  /** Returns an immutable copy of layers and its data */
  get layers () {
    const arr = []
    for (let i = 0; i < this.#layers.length; i++) {
      const layer = this.#layers[i]
      arr.push({
        color: layer.color,
        name: layer.name,
        samples: layer.samples,
        id: i
      })
    }

    return Object.freeze(arr)
  }
}

// class SoundSample {
//   startTime
//   duration
//   soundId
// }

class Layer {
  color
  isActive
  name
  #samples

  constructor (color) {
    this.color = color
    this.isActive = true
    this.name = 'New Layer'
    this.#samples = []
  }

  /**
   *
   * @param {SoundSample} sample - The sound sample to be added
   */
  insertSample (sample) {
    //* Until users are allowed to set a samples x position
    //* set the start time to be after the previous sample finishes
    const lastSample = this.#samples[this.#samples.length - 1]
    sample.startTime += lastSample ? lastSample.duration : 0
    this.#samples.push(sample)
  }

  /**
   *
   * @param {SoundSample} sample - The sound sample to be removed
   */
  removeSample (sample) {
    const idx = this.#samples.indexOf(sample)
    this.#samples.splice(idx, 1)
  }

  moveSample (newLayer, sample) {
    this.removeSample(sample)
    newLayer.insertSample(sample)
  }

  /** Returns an immutable copy of the samples list */
  get samples () {
    return Object.freeze(this.#samples.slice(0))
  }
}

module.exports = {
  SoundEditor,
  Project
}
