# Required Assignment 24.3: Set Up a CI/CD Pipeline (Cloudflare Worker)

MIT xPRO Professional Certificate in Full-Stack Coding\
John Sherrell\
Wednesday, March 18, 2026

## Report

There are three main components to this assignment:

1. Set up express.js "Hello World" app.
2. Set up automated testing on push using GitHub Actions.
3. Set up automated deployment on push using GitHub Actions.

The assignment calls for [deploying to Firebase](https://firebase.google.com/docs/hosting/github-integration), but I had already reached my Firebase project quota in a recent module. I requested an increase last night but haven't heard back. Ultimately, I decided to use a Cloudflare Worker instead of Firebase.

## Part 1

Here's the [Hello World server](src/express-server.js) (Hello Whirled for all the homophone fans out there):

```js
// src/express-server.js

import express from 'express'

const app = express()

app.get('/', (req, res) => {
  res.send('Hello whirled.')
})

export default app
```

And the corresponding [test](src/express-server.test.js):

```js
// src/express-server.test.js

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
```

Note that 'bun:test' is compatible with Jest but used with [Bun's built-in test runner](https://bun.com/docs/test).
