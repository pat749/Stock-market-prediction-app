(function () {
  var STORAGE_KEY = "finnhub_api_token";
  var DEMO_SYMBOLS = { GOOGL: true, AAPL: true, MSFT: true };
  var QUICK_CHIPS = [
    "AAPL",
    "MSFT",
    "GOOGL",
    "NVDA",
    "AMZN",
    "META",
    "TSLA",
    "AMD",
    "JPM",
    "SPY",
  ];

  var ws = null;
  var wsSymbol = null;
  var quoteTimer = null;
  var currentMode = "demo";

  function el(id) {
    return document.getElementById(id);
  }

  function normalizeSymbol(s) {
    return String(s || "")
      .trim()
      .toUpperCase()
      .replace(/^[^A-Z0-9.-]+|[^A-Z0-9.-]+$/g, "");
  }

  function getToken() {
    try {
      return localStorage.getItem(STORAGE_KEY) || "";
    } catch (e) {
      return "";
    }
  }

  function setToken(v) {
    try {
      if (v) localStorage.setItem(STORAGE_KEY, v);
      else localStorage.removeItem(STORAGE_KEY);
    } catch (e) {}
  }

  function addDays(isoDate, n) {
    var d = new Date(isoDate + "T12:00:00");
    d.setDate(d.getDate() + n);
    return d.toISOString().slice(0, 10);
  }

  function stopLiveStreams() {
    if (ws) {
      try {
        if (ws.readyState === WebSocket.OPEN && wsSymbol) {
          ws.send(JSON.stringify({ type: "unsubscribe", symbol: wsSymbol }));
        }
        ws.close();
      } catch (e) {}
      ws = null;
      wsSymbol = null;
    }
    if (quoteTimer) {
      clearInterval(quoteTimer);
      quoteTimer = null;
    }
  }

  function startWebSocket(symbol, token) {
    stopLiveStreams();
    if (!token || !symbol) return;
    try {
      var s = new WebSocket("wss://ws.finnhub.io?token=" + encodeURIComponent(token));
      ws = s;
      wsSymbol = symbol;
      s.onopen = function () {
        s.send(JSON.stringify({ type: "subscribe", symbol: symbol }));
      };
      s.onmessage = function (ev) {
        try {
          var msg = JSON.parse(ev.data);
          if (msg.type === "trade" && msg.data && msg.data.length) {
            var last = msg.data[msg.data.length - 1];
            if (last && typeof last.p === "number") {
              el("meta-live").textContent = "$" + last.p.toFixed(2) + " (stream)";
            }
          }
        } catch (e) {}
      };
      s.onerror = function () {};
      s.onclose = function () {
        if (ws === s) {
          ws = null;
          wsSymbol = null;
        }
      };
    } catch (e) {}
  }

  function fetchJson(url) {
    return fetch(url).then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    });
  }

  function loadDemoSymbol(symbol) {
    var base = "./data/" + symbol;
    return Promise.all([
      fetchJson(base + "_prices.json"),
      fetchJson(base + "_predict.json"),
    ]);
  }

  function finnhubCandles(symbol, token) {
    var now = Math.floor(Date.now() / 1000);
    var from = now - 400 * 24 * 3600;
    var url =
      "https://finnhub.io/api/v1/stock/candle?symbol=" +
      encodeURIComponent(symbol) +
      "&resolution=D&from=" +
      from +
      "&to=" +
      now +
      "&token=" +
      encodeURIComponent(token);
    return fetchJson(url).then(function (j) {
      if (j.s === "no_data" || !j.c || !j.c.length) {
        throw new Error(
          "No daily data for “" +
            symbol +
            "”. Try a US listing (e.g. AAPL). Some tickers need an exchange suffix on Finnhub."
        );
      }
      if (j.s !== "ok") throw new Error(j.s || "Finnhub candle error");
      var rows = [];
      for (var i = 0; i < j.t.length; i++) {
        var d = new Date(j.t[i] * 1000);
        rows.push([d.toISOString().slice(0, 10), Math.round(j.c[i] * 100) / 100]);
      }
      return { stockPrices: rows };
    });
  }

  function finnhubQuote(symbol, token) {
    var url =
      "https://finnhub.io/api/v1/quote?symbol=" +
      encodeURIComponent(symbol) +
      "&token=" +
      encodeURIComponent(token);
    return fetchJson(url);
  }

  function applyQuoteToMeta(q) {
    if (!q || typeof q.c !== "number" || q.c === 0) {
      el("meta-live").textContent = "—";
      el("meta-change").textContent = "—";
      return;
    }
    el("meta-live").textContent = "$" + q.c.toFixed(2);
    if (typeof q.dp === "number") {
      var sign = q.dp >= 0 ? "+" : "";
      el("meta-change").textContent = sign + q.dp.toFixed(2) + "%";
      el("meta-change").style.color =
        q.dp > 0 ? "var(--positive)" : q.dp < 0 ? "#f87171" : "var(--muted)";
    } else {
      el("meta-change").textContent = "—";
    }
  }

  function pollQuote(symbol, token) {
    function run() {
      finnhubQuote(symbol, token)
        .then(applyQuoteToMeta)
        .catch(function () {});
    }
    run();
    quoteTimer = setInterval(run, 60000);
  }

  function clientForecastsFromPrices(stockPrices) {
    var rows = stockPrices || [];
    var closes = rows.map(function (r) {
      return r[1];
    });
    var n = Math.min(80, closes.length);
    if (n < 5) throw new Error("Not enough history for a forecast.");
    var y = closes.slice(-n);
    var last = y[y.length - 1];
    var xs = y.map(function (_, i) {
      return i;
    });
    var mx = xs.reduce(function (a, b) {
      return a + b;
    }, 0) / xs.length;
    var my = y.reduce(function (a, b) {
      return a + b;
    }, 0) / y.length;
    var num = 0;
    var den = 0;
    for (var i = 0; i < xs.length; i++) {
      num += (xs[i] - mx) * (y[i] - my);
      den += (xs[i] - mx) * (xs[i] - mx);
    }
    var slope = den === 0 ? 0 : num / den;
    var intercept = my - slope * mx;
    var horizon = 10;
    var linear = [];
    for (var h = 1; h <= horizon; h++) {
      linear.push(Math.round((intercept + slope * (n + h - 1)) * 100) / 100);
    }
    var momentum =
      y.length >= 2 ? (y[y.length - 1] - y[y.length - 2]) / y[y.length - 2] : 0;
    var momRow = [];
    var v = last;
    for (var j = 0; j < horizon; j++) {
      v = v * (1 + momentum * 0.45);
      momRow.push(Math.round(v * 100) / 100);
    }
    var flat = [];
    for (var k = 0; k < horizon; k++) {
      flat.push(Math.round(last * 100) / 100);
    }
    var pct = function (end) {
      return Math.round(((end - last) / last) * 10000) / 100;
    };
    return {
      predictions: [linear, momRow, flat],
      snakes: [null, null, null],
      upper: [null, null, null],
      lower: [null, null, null],
      rollingPredict: [null, null, null],
      models: [
        {
          modelName: "Linear trend (browser)",
          score: 0.55,
          percentageChange: pct(linear[linear.length - 1]),
          trend: linear[linear.length - 1] >= last ? 1 : -1,
        },
        {
          modelName: "Damped momentum (browser)",
          score: 0.52,
          percentageChange: pct(momRow[momRow.length - 1]),
          trend: momRow[momRow.length - 1] >= last ? 1 : -1,
        },
        {
          modelName: "Flat baseline (browser)",
          score: 0.5,
          percentageChange: 0,
          trend: 0,
        },
      ],
      grade: momentum >= 0 ? "green-ish" : "red-ish",
      threshold: 0.4,
      stockTrendScore: Math.min(0.95, Math.abs(momentum) * 40 + 0.35),
    };
  }

  function drawChart(pricesData, predictData) {
    var rows = pricesData.stockPrices || [];
    if (!rows.length) throw new Error("No price rows");
    var lastRow = rows[rows.length - 1];
    var lastDate = lastRow[0];
    var preds = predictData.predictions || [];
    var horizon = preds[0] ? preds[0].length : 0;

    var dataTable = new google.visualization.DataTable();
    dataTable.addColumn("string", "Date");
    dataTable.addColumn("number", "Historical close");
    for (var i = 0; i < preds.length; i++) {
      var name =
        predictData.models && predictData.models[i]
          ? predictData.models[i].modelName || "Forecast " + (i + 1)
          : "Forecast " + (i + 1);
      dataTable.addColumn("number", name);
    }

    var dataRows = [];
    rows.forEach(function (pair) {
      var r = [pair[0], pair[1]];
      for (var j = 0; j < preds.length; j++) r.push(null);
      dataRows.push(r);
    });
    for (var h = 0; h < horizon; h++) {
      var d = addDays(lastDate, h + 1);
      var rr = [d, null];
      for (var m = 0; m < preds.length; m++) {
        rr.push(preds[m][h] != null ? preds[m][h] : null);
      }
      dataRows.push(rr);
    }
    dataTable.addRows(dataRows);

    var series = { 0: { lineWidth: 2.5 } };
    for (var s = 0; s < preds.length; s++) {
      series[s + 1] = { lineWidth: 2, lineDashStyle: [5, 3] };
    }

    var options = {
      legend: { position: "bottom", textStyle: { color: "#8b9cb3", fontSize: 11 } },
      backgroundColor: "transparent",
      chartArea: { left: 56, top: 28, right: 20, bottom: 88, width: "88%", height: "72%" },
      hAxis: {
        textStyle: { color: "#8b9cb3" },
        slantedText: true,
        slantedTextAngle: 42,
      },
      vAxis: {
        textStyle: { color: "#8b9cb3" },
        gridlines: { color: "#2d3a4d" },
      },
      colors: ["#cbd5e1", "#3d8bfd", "#34d399", "#fbbf24", "#a78bfa", "#fb7185"],
      series: series,
    };

    el("chart").innerHTML = "";
    var chart = new google.visualization.LineChart(el("chart"));
    chart.draw(dataTable, options);
  }

  function renderModels(predictData) {
    var tbody = el("models-body");
    tbody.innerHTML = "";
    var models = predictData.models || [];
    models.forEach(function (m) {
      var tr = document.createElement("tr");
      var score =
        typeof m.score === "number" ? (m.score * 100).toFixed(1) + "%" : "—";
      var pct =
        typeof m.percentageChange === "number"
          ? (m.percentageChange >= 0 ? "+" : "") + m.percentageChange.toFixed(2) + "%"
          : "—";
      tr.innerHTML =
        "<td>" +
        (m.modelName || "—") +
        "</td><td>" +
        score +
        "</td><td>" +
        pct +
        "</td>";
      tbody.appendChild(tr);
    });
  }

  function setMeta(symbol, predictData, asOfLabel) {
    el("meta-symbol").textContent = symbol;
    el("meta-asof").textContent = asOfLabel || "—";
    var g = predictData.grade;
    el("meta-grade").textContent = g != null ? String(g) : "—";
    var ts = predictData.stockTrendScore;
    el("meta-trend").textContent =
      typeof ts === "number" ? (ts * 100).toFixed(1) + "%" : "—";
    var th = predictData.threshold;
    el("meta-threshold").textContent = typeof th === "number" ? String(th) : "—";
  }

  function showError(msg) {
    var box = el("chart-error");
    box.style.display = "block";
    box.textContent = msg;
  }

  function hideError() {
    el("chart-error").style.display = "none";
  }

  function setSourcePill(text, isLive) {
    var pill = el("source-pill");
    pill.textContent = text;
    pill.classList.toggle("is-live", !!isLive);
  }

  function openModal() {
    el("api-key-input").value = getToken();
    el("modal-backdrop").hidden = false;
    el("modal-api").hidden = false;
    el("api-key-input").focus();
  }

  function closeModal() {
    el("modal-backdrop").hidden = true;
    el("modal-api").hidden = true;
  }

  function buildChips() {
    var wrap = el("chips");
    wrap.innerHTML = "";
    QUICK_CHIPS.forEach(function (sym) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "chip";
      b.textContent = sym;
      b.addEventListener("click", function () {
        el("symbol-input").value = sym;
        refresh();
      });
      wrap.appendChild(b);
    });
  }

  function refresh() {
    var symbol = normalizeSymbol(el("symbol-input").value);
    if (!symbol) {
      showError("Enter a symbol (e.g. AAPL).");
      return;
    }
    el("symbol-input").value = symbol;
    hideError();
    stopLiveStreams();
    el("meta-change").textContent = "—";
    el("meta-change").style.color = "";
    el("chart").innerHTML =
      '<div style="display:flex;align-items:center;justify-content:center;height:380px;color:#8b9cb3">Loading…</div>';

    var token = getToken();
    var useLive = !!token;

    if (!useLive && !DEMO_SYMBOLS[symbol]) {
      el("chart").innerHTML = "";
      showError(
        'No API key: only demo symbols GOOGL, AAPL, MSFT load from this site. Click “API key” and add a Finnhub token to load "' +
          symbol +
          '" and other tickers.'
      );
      setSourcePill("Source: blocked (add API key)", false);
      el("meta-live").textContent = "—";
      el("meta-asof").textContent = "—";
      return;
    }

    var chain;
    if (useLive) {
      currentMode = "live";
      setSourcePill("Source: Finnhub (live)", true);
      chain = finnhubCandles(symbol, token).then(function (pricesData) {
        var predictData = clientForecastsFromPrices(pricesData.stockPrices);
        return { pricesData: pricesData, predictData: predictData };
      });
    } else {
      currentMode = "demo";
      setSourcePill("Source: bundled demo JSON", false);
      chain = loadDemoSymbol(symbol).then(function (pair) {
        return { pricesData: pair[0], predictData: pair[1] };
      });
    }

    chain
      .then(function (bundle) {
        var pricesData = bundle.pricesData;
        var predictData = bundle.predictData;
        var last = pricesData.stockPrices[pricesData.stockPrices.length - 1];
        var asOf = last ? last[0] : "—";
        drawChart(pricesData, predictData);
        renderModels(predictData);
        setMeta(symbol, predictData, asOf);
        if (useLive) {
          el("meta-live").textContent = "…";
          finnhubQuote(symbol, token)
            .then(applyQuoteToMeta)
            .catch(function () {
              el("meta-live").textContent = "—";
            });
          pollQuote(symbol, token);
          startWebSocket(symbol, token);
        } else {
          el("meta-live").textContent = "Demo (not live)";
          el("meta-change").textContent = "—";
        }
      })
      .catch(function (err) {
        console.error(err);
        el("chart").innerHTML = "";
        showError(err.message || "Failed to load data.");
      });
  }

  google.charts.load("current", { packages: ["corechart"] });
  google.charts.setOnLoadCallback(function () {
    buildChips();
    el("btn-load").addEventListener("click", refresh);
    el("symbol-input").addEventListener("keydown", function (e) {
      if (e.key === "Enter") refresh();
    });

    el("btn-api").addEventListener("click", openModal);
    el("api-close").addEventListener("click", closeModal);
    el("modal-backdrop").addEventListener("click", closeModal);
    el("api-save").addEventListener("click", function () {
      var v = el("api-key-input").value.trim();
      setToken(v);
      closeModal();
      refresh();
    });
    el("api-clear").addEventListener("click", function () {
      setToken("");
      el("api-key-input").value = "";
      closeModal();
      refresh();
    });

    if (!el("symbol-input").value) el("symbol-input").value = "MSFT";
    refresh();
  });
})();
