// let currencyPair = ["ZEC/USD", "XLM/USD", "XRP/USD", "DASH/USD", "BTG/USD", "BCH/USD", "ETH/USD", "BTC/USD", "ETH/GBP", "BTC/GBP", "ZEC/EUR", "XLM/EUR", "XRP/EUR", "DASH/EUR", "BTG/EUR", "BCH/EUR", "ETH/EUR", "BTC/EUR", "BTG/BTC", "BCH/BTC", "ETH/BTC", "BTC/RUB", "ZEC/GBP", "DASH/GBP", "BCH/GBP", "XRP/BTC", "DASH/BTC", "XLM/BTC", "ZEC/BTC", "GHS/BTC"];
let currencyPair = ["ZEC/USD", "XLM/USD", "XRP/USD", "DASH/USD", "BTG/USD", "BCH/USD", "ETH/USD", "BTC/USD"];

const commonCollection = require('../models/common');
const cexLocal = require('../models/cex');
const express = require('express');
const http = require("https");
const router = express.Router();

const getData = (req, res) => {
    var d = new Date(),
        h = d.getHours(),
        m = d.getMinutes();
    currencyPair.map((item) => {
        var options = {
            "method": "GET",
            "hostname": "cex.io",
            "port": null,
            "path": "/api/ticker/" + item
        };
        var reqst = http.request(options, function (response) {
            var chunks = [];
            response.on("data", function (chunk) {
                chunks.push(chunk);
            });
            response.on("end", function () {
                var body = Buffer.concat(chunks);
                var dataCex = JSON.parse(body.toString());
                //  console.log(dataCex)
                if (dataCex.hasOwnProperty('error')) {
                    console.log("error")
                    return dataCex;
                }
                console.log(dataCex)
                var obj = {
                    name: "cex",
                    pair: item.replace('/', '').toLowerCase(),
                    volume: dataCex.volume,
                    price: dataCex.last,
                    close: dataCex.last,
                    low: dataCex.low,
                    high: dataCex.high,
                    ask: dataCex.ask,
                    bid: dataCex.bid,
                    created_at: Date(dataCex.timestamp),
                    date: new Date().toLocaleDateString()
                }
                // console.log(obj)        
                if (h == 17 && m == 20) {
                    obj["open"] = dataCex.last;

                    var bitstampData = new cexLocal(obj);
                    var commonCoin = new commonCollection(obj);
                    commonCoin.save(function (error, detail) {
                        bitstampData.save(function (err, data) {
                            //         // if (err) {
                            //     res.status(400).send({
                            //         message: "Internal server error"
                            //     })
                            // } else {
                            //     res.send({
                            //         message: "Successfully Added"
                            //     })
                            // }
                        })
                    })
                } else {
                    console.log("Second Values Here---------------------")
                    var dateString = new Date().toLocaleDateString();
                    var pairValue = item.replace('/', '').toLowerCase();

                    commonCollection.findOne({ date: dateString, pair: pairValue }, function (err, docs) {
                        //  console.log(docs)
                        obj["open"] = docs.open;
                        console.log(obj)
                        var bitstampData = new cexLocal(obj);
                        var commonCoin = new commonCollection(obj);
                        commonCoin.save(function (error, detail) {
                            bitstampData.save(function (err, data) {
                                // if (err) {
                                //     res.status(400).send({
                                //         message: "Internal server error"
                                //     })
                                // } else {
                                //     res.send({
                                //         message: "Successfully Added"
                                //     })
                                // }
                            })
                        })
                    })
                }

                // commonCoin.save(function (error, detail) {
                //     if (error) {
                //         console.log(error)
                //     }
                //     bitstampData.save(function (err, data) {
                //         console.log(err)
                //         res.send({
                //             message: "Successfully added"
                //         })
                //     })
                // })
            });
        });
        reqst.end();
    })
}
const getExchange = (req, res) => {
    cexLocal.find({}, function (err, data) {
        res.send(data)
    })
}
router.route('/').get(getData);
router.route('/exchange').get(getExchange)


module.exports = router;
module.exports.getData = getData;

setTimeout(() => {

}, 100)