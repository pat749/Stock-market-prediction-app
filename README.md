# Stock market prediction

## Live demo (GitHub Pages)

The folder [`docs/`](docs/) is a static site you can host on GitHub for free.

**Option A — Pages from the `docs` folder**

1. Push this repo to GitHub.
2. In the repository, go to **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to **Deploy from a branch**.
4. Choose branch **main** and folder **/docs**, then save.

The site will be available at `https://<your-username>.github.io/<repository-name>/`.

For **`pat749`**, after Pages is enabled:  
`https://pat749.github.io/Stock-market-prediction-app/`

**Push to `pat749`:** set `origin` to `https://github.com/pat749/Stock-market-prediction-app.git`, then run `git push -u origin main`. You must be signed in to GitHub as **`pat749`** (HTTPS token or SSH key on that account). If your Mac cached another user, sign out of GitHub in Keychain or use SSH for `pat749` only.

**Option B — GitHub Actions**

1. In **Settings → Pages**, set **Source** to **GitHub Actions**.
2. Push to **main**; the workflow [`.github/workflows/pages.yml`](.github/workflows/pages.yml) publishes the `docs/` folder.

The Pages UI loads **bundled demo JSON** for GOOGL / AAPL / MSFT when no API key is set. In the browser you can add a free **[Finnhub](https://finnhub.io/register)** API key (stored only in `localStorage`) to load **real daily candles**, **quotes**, and a **trade stream** for other US tickers. Those forecast lines are simple **in-browser estimates**, not your Python ML models — use Flask locally for real model output.

**Preview locally**

```bash
cd docs && python3 -m http.server 8080
```

Then open `http://127.0.0.1:8080`.

---

## Server (Node)

## Get Started
1. Install Node.js
2. Install all dependencies (`npm install`)
3. Start the server (`npm start`)

## Docs
- [Node.js](https://nodejs.org/en/)
- [Express.js](https://expressjs.com/)
- [Firebase Cloud Firestore](https://firebase.google.com/docs/firestore/)
- [Firebase Authentication](https://firebase.google.com/docs/auth/)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [Request](https://github.com/request/request
- This Project has been made with the help of LSTM,RNN And Using Evolution Algorithm.
