const assert = require('assert')
const { default: FreeSound } = require('freesound-client')

class SoundEditor {

  #freeSound

  constructor(freeSoundKey) {
    assert.equal(typeof freeSoundKey, 'string', `Must pass in a string 
    representing a freesound key`)
  
    this.#freeSound = new FreeSound()
    this.#freeSound.setToken(process.env.FREESOUND_KEY)

  }

  //TODO: Only show results for those with permissive license
  async searchSounds(text) {
    return this.#freeSound.textSearch(text)
  }
}

class Node {
  layer
  startTime
  endTime 
}

module.exports = {
  SoundEditor
}