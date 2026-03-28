from flask import Flask, jsonify
from flask_cors import cross_origin

from ml.upload_stock_prices import get_stock_prices
from ml.save_predictions import get_predictions, get_saved_predictions

app = Flask(__name__)


@app.route("/")
def hello_world():
    return "Hello world."


@app.route("/stockPrices/<stock_code>")
@cross_origin(
    {
        "origins": ["localhost"],
        "methods": "GET",
    }
)
def stock_prices(stock_code):
    prices = get_stock_prices(stock_code)
    return jsonify(prices)


@app.route("/predict/<stock_code>")
@cross_origin(
    {
        "origins": ["localhost"],
        "methods": "GET",
    }
)
def predict(stock_code):
    predictions = get_saved_predictions(stock_code)
    print(predictions)

    return jsonify(
        {
            "success": True,
            "predictions": predictions["predictions"],
            "snakes": predictions["snakes"],
            "upper": predictions["upper"],
            "lower": predictions["lower"],
            "rollingPredict": predictions["rollingPredict"],
            "models": predictions["models"],
            "grade": predictions["grade"],
            "threshold": predictions["threshold"],
            "stockTrendScore": predictions["stockTrendScore"],
        }
    )
