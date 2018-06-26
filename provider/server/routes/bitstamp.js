// let currencyPair = ["btcusd", "btceur", "eurusd", "xrpusd", "xrpeur", "xrpbtc", "ltcusd", "ltceur", "ltcbtc", "ethusd", "etheur", "ethbtc", "bchusd", "bcheur", "bchbtc"];
let currencyPair = ["btcusd", "eurusd", "xrpusd", "ltcusd", "ethusd", "bchusd"];
const request = require("request");
const commonCollection = require('../models/common');
const bitstampModel = require('../models/bitstamp');
const express = require('express');
const http = require("https");

var RateLimiter = require('limiter').RateLimiter;

var limiter = new RateLimiter(6, 1000);
var throttledRequest = function () {
    var requestArgs = arguments;
    limiter.removeTokens(1, function () {
        request.apply(this, requestArgs);
    });
};

const router = express.Router();
const getData = (req, res) => {
    try {
        var datestamp = JSON.parse(JSON.stringify(new Date))
        console.log(datestamp)
        currencyPair.map((item) => {
            var options = {
                method: 'GET',
                url: 'https://www.bitstamp.net/api/v2/ticker/' + item,
            };

            request(options, function (error, response, body) {
                if (error) {
                    console.log(error)
                }
                else {
                    var dataBitso = JSON.parse(body.toString());
                    var obj = {
                        name: "bitstamp",
                        pair: item.toLowerCase(),
                        volume: dataBitso.volume,
                        price: dataBitso.last,
                        vwap: dataBitso.vwap,
                        low: dataBitso.low,
                        high: dataBitso.high,
                        open: dataBitso.open,
                        close: dataBitso.last,
                        datestamp: datestamp
                    }

                    var bitstampData = new bitstampModel(obj);
                    var commonCoin = new commonCollection(obj);
                    commonCoin.save(function (error, detail) {
                       // console.log("Bitstamp Added successfully")
                    })
                }
            });

        })
    } catch (error) {
        console.log("IN ERROR: " + datestamp)
        console.log(error)
    }
}
const getExchange = (req, res) => {
    bitstampModel.find({}, function (err, data) {
        res.send(data)
    })
}
router.route('/').get(getData);
router.route('/exchange').get(getExchange)
module.exports = router;
module.exports.getData = getData;

