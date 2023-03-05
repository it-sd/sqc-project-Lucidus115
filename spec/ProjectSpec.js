const {
  runHealthQuery,
  runGatherUsersQuery
} = require('../server.js')

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

describe('runSoundSearching', function () {
  const url = 'http://localhost:5163/audio-search'

  const getSound = function (soundId) {
    return fetch(url, {
      method: 'POST',
      body: JSON.stringify({ soundId }),
      headers: { 'Content-Type': 'application/json' }
    })
  }

  it('should return a knocking soun effect with the id of 677158', async function () {
    const res = await getSound(677158)
    const result = await res.json()
    expect(result.sound.name).toContain('knocking')
  })

  it('should return null with an invalid id', async function () {
    const res = await getSound(1)
    const result = await res.json()
    expect(result.sound).toBeNull()
  })
})
