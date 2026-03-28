(function () {
  const SYMBOLS = ["GOOGL", "AAPL", "MSFT"];

  function el(id) {
    return document.getElementById(id);
  }

  function addDays(isoDate, n) {
    const d = new Date(isoDate + "T12:00:00");
    d.setDate(d.getDate() + n);
    return d.toISOString().slice(0, 10);
  }

  function loadSymbol(symbol) {
    const base = "./data/" + symbol;
    return Promise.all([
      fetch(base + "_prices.json").then(function (r) {
        if (!r.ok) throw new Error("Could not load prices");
        return r.json();
      }),
      fetch(base + "_predict.json").then(function (r) {
        if (!r.ok) throw new Error("Could not load predictions");
        return r.json();
      }),
    ]);
  }

  function drawChart(pricesData, predictData) {
    const rows = pricesData.stockPrices || [];
    if (!rows.length) {
      throw new Error("No price rows");
    }

    const lastRow = rows[rows.length - 1];
    const lastDate = lastRow[0];
    const preds = predictData.predictions || [];
    const horizon = preds[0] ? preds[0].length : 0;

    const header = ["Date", "Historical close"];
    for (let i = 0; i < preds.length; i++) {
      header.push(
        predictData.models && predictData.models[i]
          ? predictData.models[i].modelName || "Model " + (i + 1)
          : "Forecast " + (i + 1)
      );
    }

    const dataTable = new google.visualization.DataTable();
    dataTable.addColumn("string", "Date");
    dataTable.addColumn("number", "Historical close");
    for (let i = 0; i < preds.length; i++) {
      dataTable.addColumn("number", header[i + 2]);
    }

    const dataRows = [];

    rows.forEach(function (pair) {
      const r = [pair[0], pair[1]];
      for (let j = 0; j < preds.length; j++) r.push(null);
      dataRows.push(r);
    });

    for (let h = 0; h < horizon; h++) {
      const d = addDays(lastDate, h + 1);
      const r = [d, null];
      for (let m = 0; m < preds.length; m++) {
        r.push(preds[m][h] != null ? preds[m][h] : null);
      }
      dataRows.push(r);
    }

    dataTable.addRows(dataRows);

    const options = {
      legend: { position: "bottom", textStyle: { color: "#8b9cb3" } },
      backgroundColor: "transparent",
      chartArea: { left: 56, top: 24, right: 24, bottom: 72, width: "85%", height: "75%" },
      hAxis: {
        textStyle: { color: "#8b9cb3" },
        slantedText: true,
        slantedTextAngle: 45,
      },
      vAxis: {
        textStyle: { color: "#8b9cb3" },
        gridlines: { color: "#2d3a4d" },
      },
      colors: ["#94a3b8", "#3d8bfd", "#34d399", "#fbbf24"],
      series: {
        0: { lineWidth: 2 },
        1: { lineWidth: 2, lineDashStyle: [4, 2] },
        2: { lineWidth: 2, lineDashStyle: [4, 2] },
        3: { lineWidth: 2, lineDashStyle: [4, 2] },
      },
    };

    const chart = new google.visualization.LineChart(el("chart"));
    chart.draw(dataTable, options);
  }

  function renderModels(predictData) {
    const tbody = el("models-body");
    tbody.innerHTML = "";
    const models = predictData.models || [];
    models.forEach(function (m) {
      const tr = document.createElement("tr");
      const score =
        typeof m.score === "number"
          ? (m.score * 100).toFixed(1) + "%"
          : "—";
      const pct =
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

  function setMeta(symbol, predictData) {
    el("meta-symbol").textContent = symbol;
    const g = predictData.grade;
    el("meta-grade").textContent = g != null ? String(g) : "—";
    const ts = predictData.stockTrendScore;
    el("meta-trend").textContent =
      typeof ts === "number" ? (ts * 100).toFixed(1) + "%" : "—";
    const th = predictData.threshold;
    el("meta-threshold").textContent =
      typeof th === "number" ? String(th) : "—";
  }

  function showError(msg) {
    const box = el("chart-error");
    box.style.display = "block";
    box.textContent = msg;
  }

  function hideError() {
    el("chart-error").style.display = "none";
  }

  function refresh() {
    const symbol = el("symbol").value;
    hideError();
    el("chart").innerHTML =
      '<div style="display:flex;align-items:center;justify-content:center;height:380px;color:#8b9cb3">Loading…</div>';

    loadSymbol(symbol)
      .then(function (pair) {
        const pricesData = pair[0];
        const predictData = pair[1];
        el("chart").innerHTML = "";
        drawChart(pricesData, predictData);
        renderModels(predictData);
        setMeta(symbol, predictData);
      })
      .catch(function (err) {
        console.error(err);
        el("chart").innerHTML = "";
        showError(err.message || "Failed to load data.");
      });
  }

  google.charts.load("current", { packages: ["corechart"] });
  google.charts.setOnLoadCallback(function () {
    el("symbol").addEventListener("change", refresh);
    refresh();
  });
})();
