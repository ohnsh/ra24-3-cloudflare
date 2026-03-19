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

As mentioned, I was unable to deploy to Firebase due to having reached my project quota. Instead, I used a Cloudflare Worker, which is very similar to a Firebase Function.

The Workers docs have a [tutorial on deploying an Express.js application][tutorial]. The steps are similar to what you'd do in a Firebase project. You scaffold a project with `npm create cloudflare@latest` and then use `wrangler`, Cloudflare's developer CLI tool (analogous to the `firebase` command). The server code does need to be slightly adapted for the Workers runtime. In my case, I decided to export a pure express app from [src/express-server.js](src/express-server.js) and import it into [src/index.js](src/index.js), the actual worker entrypoint:

```
// src/index.js
// Main Worker

import { httpServerHandler } from 'cloudflare:node'
import app from './express-server'

app.listen(3000)
export default httpServerHandler({ port: 3000 })
```

[tutorial]: https://developers.cloudflare.com/workers/tutorials/deploy-an-express-app/

### Storing Cloudflare secrets in GitHub

To automatically [deploy the Worker with GitHub Actions][deploy-worker], it's necessary to first import CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID (not actually a secret) into GitHub as secrets, and then into the build environment with the special `${{ secrets.SECRET_TOKEN }}` syntax in the workflow YAML configuration. The YAML is detailed below. I accomplished the first part using the [GitHub CLI](https://cli.github.com/manual/gh_secret_set) and a .env file (which is placed in the working tree but added to .gitignore and never committed, for obvious security reasons):

```env
# .env
CLOUDFLARE_API_TOKEN=[token_here]
CLOUDFLARE_ACCOUND_ID=[id_here]
```

```bash
$ gh secret set -f .env
```

### New `deploy` Job in Workflow

Finally, I added a new `deploy` job underneat `test` in [.github/workflows/bun-test.yml](.github/workflows/bun-test.yml), modeled after the [template from Cloudflare's docs][deploy-worker].

[deploy-worker]: https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/

```
...

  deploy:
    runs-on: ubuntu-latest
    timeout-minutes: 60
    steps:
      - uses: actions/checkout@v5
      - name: Install bun
        uses: oven-sh/setup-bun@v2
      - name: Build & Deploy Worker
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          wranglerVersion: "4.75.0"
```

### Results

On first push, I hadn't yet added the "Install bun" step. (I thought perhaps `cloudflare/wrangler-action@v3` would use NPM, but it must have detected my bun.lock file.) The deployment also failed on second push because `cloudflare/wrangler-action@v3` uses an old version of Wrangler by default that doesn't pick up the newer, comment-permitting [`wrangler.jsonc`](wrangler.jsonc) confuration file. The fix was to explicitly specify `wranglerVersion` as a parameter to the Action as shown.

