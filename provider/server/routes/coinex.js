const commonCollection = require('../models/common');
const cexLocal = require('../models/coinex');
const express = require('express');
const http = require("https");
const router = express.Router();
const getData = (req, res) => {
    var d = new Date(),
        h = d.getHours(),
        m = d.getMinutes();
    var options = {
        "method": "GET",
        "hostname": "api.coinex.com",
        "port": null,
        "path": "/v1/market/ticker/all"
    };
    try {
        var reqst = http.request(options, function (response) {
            var chunks = [];
            response.on("data", function (chunk) {
                chunks.push(chunk);
            });
            response.on("end", function () {
                var body = Buffer.concat(chunks);
                try {
                    if (body) {
                        var dataCex = JSON.parse(body.toString());
                        var created = dataCex.data.date;
                        var dataTicker = dataCex.data.ticker;
                        var datestamp = JSON.parse(JSON.stringify(new Date))
                        for (var key in dataTicker) {
                            var findUsd = key.search(/usdt/i);
                            if (findUsd > -1) {
                                var pairName = key.replace(/usdt/gi, "usd")
                                var dataObj = {
                                    name: "coinex",
                                    pair: pairName.toLowerCase(),
                                    volume: dataTicker[key].vol,
                                    price: dataTicker[key].last,
                                    low: dataTicker[key].low,
                                    high: dataTicker[key].high,
                                    close: dataTicker[key].last,
                                    datestamp: datestamp,
                                    date: new Date().toLocaleDateString()
                                }
                                if (h == 18 && m == 54) {

                                    dataObj["open"] = dataTicker[key].last;
                                    var commonCoin = new commonCollection(dataObj);
                                    commonCoin.save(function (error, detail) {

                                    })
                                } else {

                                    var dateString = new Date().toLocaleDateString();
                                    var pairValue = pairName.toLowerCase();

                                    commonCollection.findOne({ date: dateString, pair: pairValue }, function (err, docs) {
                                        console.log(pairValue)
                                        if (docs) {
                                            dataObj["open"] = docs.open;
                                        } else {
                                            dataObj["open"] = dataTicker[key].last;
                                        }
                                        var commonCoin = new commonCollection(dataObj);
                                        commonCoin.save(function (error, detail) {

                                        })
                                    })
                                }

                            }


                        }
                    }
                } catch (e) {
                    console.log(e)
                }


            });
        });
        reqst.end();
    } catch (error) {
        console.log(error)
    }


}



router.route('/').get(getData);
module.exports = router;
module.exports.getData = getData;
