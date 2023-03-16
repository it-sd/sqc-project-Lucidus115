const {
  runHealthQuery,
  runGatherUsersQuery,
  freesoundKey
} = require('../server.js')
const { SoundEditor } = require('../sound-editor.js')
const baseUrl = 'http://localhost:5163'

describe('runHealthQuery', function () {
  it('should return an HTTP response between 200 & 399', async function () {
    const result = await runHealthQuery()

    expect(result.status).toBeGreaterThanOrEqual(200)
    expect(result.status).toBeLessThanOrEqual(399)
  })
})

describe('runGatherUsersQuery', function () {
  it('should return an HTTP response between 200 & 399', async function () {
    const result = await runGatherUsersQuery()

    expect(result.status).toBeGreaterThanOrEqual(200)
    expect(result.status).toBeLessThanOrEqual(399)
  })
})

describe('POST /sound-editor/search', function () {
  const url = new URL('/sound-editor/search', baseUrl)
  const getSound = function (text) {
    return fetch(url, {
      method: 'POST',
      body: JSON.stringify({ textSearch: text }),
      headers: { 'Content-Type': 'application/json' }
    })
  }

  it('should return results for the text: "drum"', async function () {
    const res = await getSound('drum')
    const result = await res.json()
    expect(result.soundResults.count).toBeGreaterThan(0)
  })
})

describe('sound editor', function () {
  const sndEdit = new SoundEditor(freesoundKey)

  describe('addLayer', function () {
    it('should return layer count of 2', function () {
      sndEdit.timeline.addLayer()
      expect(sndEdit.timeline.numOfLayers).toBe(2)
    })
  })

  describe('requestSoundData', function () {
    const sounds = [678012, 677158, 212195]
    for (const id of sounds) {
      sndEdit.timeline.getLayer(0).insertSample(id)
    }

    it('should return an object containing the samples and audio previews', async function () {
      const data = await sndEdit.retrieveSoundData()
      expect(data.sampleInfo.length).toBeGreaterThan(0)
      expect(data.sounds[212195]).toBeDefined()
    })
  })
})
