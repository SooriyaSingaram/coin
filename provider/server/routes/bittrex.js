const bittrexLocal = require('../models/bittrex');
const commonCollection = require('../models/common');
const Agent = require('agentkeepalive').HttpsAgent;;
const express = require('express');
const http = require("https");
const router = express.Router();
// const keepaliveAgent = new Agent();

const request = require("request");
var RateLimiter = require('limiter').RateLimiter;

var limiter = new RateLimiter(1, 1000);
var throttledRequest = function () {
    var requestArgs = arguments;
    limiter.removeTokens(1, function () {
        request.apply(this, requestArgs);
    });
};


const getData = (req, res) => {
    var d = new Date(),
        h = d.getHours(),
        m = d.getMinutes();
    var options = {
        method: 'GET',
        url: 'https://bittrex.com/api/v1.1/public/getmarketsummaries'
    };

    request(options, function (error, response, body) {
        if (error) {
            console.log(error)
        }
        else {
            var datestamp = JSON.parse(JSON.stringify(new Date))
            console.log(datestamp)
            var dataBittrex = JSON.parse(body.toString());
            var bittrexData = dataBittrex.result;
            bittrexData.map((bit) => {
                var pairSymbol = bit.MarketName.split('-');
                if (pairSymbol[0] == 'USDT') {

                    var pairDeta = pairSymbol[1] + pairSymbol[0];
                    var pairName = pairDeta.replace(/usdt/gi, "usd")

                    var obj = {
                        name: "bittrex",
                        pair: pairName.toLowerCase(),
                        volume: bit.Volume,
                        price: bit.Last,
                        high: bit.High,
                        created_at: bit.Created,
                        // vwap: bit.vwap,
                        close: bit.Last,
                        low: bit.Low,
                        ask: bit.Ask,
                        bid: bit.Bid,
                        datestamp:datestamp,
                        date: d.toLocaleDateString()
                    }
                    // console.log(obj)
                    if (h == 15 && m == 13) {
                        obj["open"] = bit.Last;

                        var bittrexCoinData = new bittrexLocal(obj);
                        var commonCoin = new commonCollection(obj);
                        commonCoin.save(function (error, detail) {
                           // bittrexCoinData.save(function (err, data) {
                                if (error) {
                                    // res.status(400).send({
                                    //     message: "Internal server error"
                                    // })
                                } else {
                                   // console.log("Bittrex Running")
                                    // res.send({
                                    //     message: "Successfully Added"
                                    // })
                                }
                           // })
                        })
                    } else {
                        var dateString = new Date().toLocaleDateString();
                        var pairValue = pairName.toLowerCase();
                        commonCollection.findOne({  pair: pairValue }, function (err, docs) {
                            if (docs) {
                                obj["open"] = docs.open;
                            } else {
                                obj["open"] = bit.Last;
                            }

                            var bittrexCoinData = new bittrexLocal(obj);
                            var commonCoin = new commonCollection(obj);
                            commonCoin.save(function (error, detail) {
                               // bittrexCoinData.save(function (err, data) {
                                    if (err) {
                                        // res.status(400).send({
                                        //     message: "Internal server error"
                                        // })
                                    } else {
                                        //console.log("Bittrex Running")
                                        // res.send({
                                        //     message: "Successfully Added"
                                        // })
                                    }
                                })
                            })
                        //})
                    }
                }
            })


        }
    })


}
const getExchange = (req, res) => {
    bittrexLocal.find({}, function (err, data) {
        res.send(data)
    })
}
router.route('/').get(getData);
router.route('/exchange').get(getExchange)
module.exports = router;
module.exports.getData = getData;

//https://bittrex.com/api/v1.1/public/getmarketsummaries