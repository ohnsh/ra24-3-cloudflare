import { expect, test, beforeAll } from 'bun:test'
import app from './express-server.js'

beforeAll(async () => {
  app.listen(3000)
})

test('Express Hello Whirled', async () => {
  const res = await fetch('http://localhost:3000')
  const text = await res.text()
  expect(text).toBe('Hello whirled.')
})
