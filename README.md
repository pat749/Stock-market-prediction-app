# Stock market prediction

Machine-learning experiments (Python), a small Flask API, optional Node scripts, and a **static demo** in `docs/` for GitHub Pages.

## Repository layout

Run CLI tools and the API from the **repository root** so paths like `data/` and `saved_models/` resolve correctly.

```
├── backend/           # Flask app (entry: backend.app:app)
├── ml/                # Training, datasets, predictions, evolution helpers
├── notebooks/         # Jupyter notebooks
├── scripts/node/      # Express stub + insertStock.js helper
├── config/            # Sample train config (e.g. train_models_sample.json)
├── docs/              # GitHub Pages static site (live demo UI)
├── research/          # Notes (e.g. evolution.md)
├── legacy/            # Old Create React App artifacts + long CRA readme
│   └── cra-public/    # index.html, manifest.json (not used by current Pages site)
├── requirements.txt
├── Procfile           # Heroku: gunicorn backend.app:app
└── README.md
```

## Live demo (GitHub Pages)

The folder [`docs/`](docs/) is the hosted UI.

**Option A — Pages from the `docs` folder**

1. Push this repo to GitHub.
2. **Settings → Pages** → **Deploy from a branch** → branch **`main`**, folder **`/docs`**.

**Option B — GitHub Actions**

1. **Settings → Pages** → **Source: GitHub Actions**.
2. Push to **`main`**; [`.github/workflows/pages.yml`](.github/workflows/pages.yml) publishes `docs/`.

Example URL: `https://pat749.github.io/Stock-market-prediction-app/` (replace with your user/repo).

The Pages app uses bundled demo JSON unless you add a free [Finnhub](https://finnhub.io/register) API key in the browser (see in-app **API key**). In-browser forecasts are not your Python ML models.

**Preview locally**

```bash
cd docs && python3 -m http.server 8080
```

Open `http://127.0.0.1:8080`.

---

## Python (Flask API)

From the repo root, install dependencies and run:

```bash
pip install -r requirements.txt
gunicorn backend.app:app
```

Or with Flask’s dev server (if you add a `flask run` setup): use **`backend.app`** as the application module.

Training / saving predictions (paths relative to repo root):

```bash
python -m ml.train_models config/train_models_sample.json
python -m ml.save_predictions local GOOGL   # example; see ml/save_predictions.py
```

---

## Node (optional)

```bash
cd scripts/node && npm install && npm start
```

---

## References

- [Node.js](https://nodejs.org/)
- [Express](https://expressjs.com/)
- [Flask](https://flask.palletsprojects.com/)
- [Firebase](https://firebase.google.com/docs/)
- [Request](https://github.com/request/request) (legacy dependency in Node scripts)

This project uses ideas from LSTM/RNN and evolution-style search in the ML notebooks and training code.
