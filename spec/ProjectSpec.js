const {
  runHealthQuery,
  runGatherUsersQuery,
} = require('../server.js')

describe('runHealthQuery', function () {
  it('should return an HTTP response between 200 & 399', async function() {
    const result = await runHealthQuery()

    expect(result.status).toBeGreaterThanOrEqual(200)
    expect(result.status).toBeLessThanOrEqual(399)
  })
})

describe('runGatherUsersQuery', function () {
  it('should return an HTTP response between 200 & 399', async function() {
    const result = await runGatherUsersQuery()

    expect(result.status).toBeGreaterThanOrEqual(200)
    expect(result.status).toBeLessThanOrEqual(399)
  })
})