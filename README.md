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

The finished worker is live at <https://ra24-3-cloudflare.ohn-sh.workers.dev/>. Additionally, the GitHub Actions log is publicly viewable at <https://github.com/ohnsh/ra24-3-cloudflare/actions>.

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

## Part 2

To set up automated testing, I created [bun-test.yml](.github/workflows/bun-test.yml) in .github/workflows using [Bun's documentation](https://bun.com/docs/test#how-to-install-bun-in-a-github-actions-workflow) as a template:

```yaml
# .github/workflows/bun-test.yml

name: bun test
on: [push]
jobs:
  test:
    name: test-hello-whirled
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v5
      - name: Install bun
        uses: oven-sh/setup-bun@v2
      - name: Install dependencies # (assuming your project has dependencies)
        run: bun install # You can use npm/yarn/pnpm instead if you prefer
      - name: Run tests
        run: bun test
...
```

Note that, unlike NPM, Bun requires an explicit installation step (on `ubuntu-latest`, at least). [Logs showing the test succeeding][logs] are publicly viewable in this repository's Actions tab.

[logs]: https://github.com/ohnsh/ra24-3-cloudflare/actions/runs/23273546781/job/67671431938

## Part 3

