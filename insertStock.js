var rp = require('request-promise');

async function insertStock(stockCodes) {
  let testStocksData = {
    GOOGL: {code: 'GOOGL', name: 'Alphabet Inc Class A', description: 'Alphabet Inc is a provider of internet content products and portals. Its suite of brands includes Search, Android, YouTube, Apps, Maps & Ads.', sector:'Technology'},
    AAPL: {code: 'AAPL', name: 'Apple Inc.', description: 'Apple Inc is designs, manufactures and markets mobile communication and media devices and personal computers, and sells a variety of related software, services, accessories, networking solutions and third-party digital content and applications.', sector:'Technology'},
    MSFT: {code: 'MSFT', name: 'Microsoft Corporation', description: 'Microsoft Corp is a technology company. It develop, license, and support a wide range of software products and services. Its business is organized into three segments: Productivity and Business Processes, Intelligent Cloud, and More Personal Computing.', sector: 'Technology'},
    FB: {code: 'FB', name: 'Facebook, Inc. Common Stock', description: "Facebook Inc is the world's largest online social network. Its products are Facebook, Instagram, Messenger, WhatsApp, and Oculus. Its products enable people to connect and share through mobile devices and personal computers.", sector: 'Technology'}
  };

  let stocksData = await rp({
    uri: `https://api.iextrading.com/1.0/stock/market/batch?symbols=${stockCodes.join(',')}&types=company`,
    json: true
  });

  let stocks = {};
  for (let stockCode in stocksData) {
    stocks[stockCode] = {
      code: stockCode,
      name: stocksData[stockCode].company.companyName,
      description: stocksData[stockCode].company.description,
      sector: stocksData[stockCode].company.sector
    };
  }
  for (let stockCode in testStocksData) {
    if (stockCode in stocks) {
      stocks[stockCode].test = testStocksData[stockCode];
    }
  }

  await rp({
    uri: 'https://us-central1-cmms-fyp.cloudfunctions.net/insertStocks',
    method: 'POST',
    body: {stocks: stocks},
    json: true
  });
}

insertStock(process.argv.slice(2))
    .then(() => {
      console.log('inserted stocks');
    }).catch((err) => {
      console.log('isnert stock error', err);
    });
