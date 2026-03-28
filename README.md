# Stock market prediction

## Live demo (GitHub Pages)

The folder [`docs/`](docs/) is a static site you can host on GitHub for free.

**Option A — Pages from the `docs` folder**

1. Push this repo to GitHub.
2. In the repository, go to **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to **Deploy from a branch**.
4. Choose branch **main** and folder **/docs**, then save.

The site will be available at `https://<your-username>.github.io/<repository-name>/`.

**Option B — GitHub Actions**

1. In **Settings → Pages**, set **Source** to **GitHub Actions**.
2. Push to **main**; the workflow [`.github/workflows/pages.yml`](.github/workflows/pages.yml) publishes the `docs/` folder.

The Pages UI uses **demo JSON** in `docs/data/` (no backend). Your Python/Flask pipeline and trained models are separate; run those locally or on another host if you want live predictions.

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
