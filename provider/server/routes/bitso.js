const bitsoLocal = require('../models/bitso');
const commonCollection = require('../models/common');
const express = require('express');
const http = require("https");
const request = require("request");
var RateLimiter = require('limiter').RateLimiter;

var limiter = new RateLimiter(6, 1000);
var throttledRequest = function () {
    var requestArgs = arguments;
    limiter.removeTokens(1, function () {
        request.apply(this, requestArgs);
    });
};

const router = express.Router();
var datestamp = JSON.parse(JSON.stringify(new Date))
const getData = (req, res) => {


    var options = {
        method: 'GET',
        url: 'https://api.bitso.com/v3/ticker/'
    };

    request(options, function (error, response, body) {
        if (error) {
            console.log(error)
        }
        else {
            var d = new Date(),
                h = d.getHours(),
                m = d.getMinutes();

            var dataBitso = JSON.parse(body.toString());
            var bitsoData = dataBitso.payload;
            bitsoData.map((bit) => {
                var usdCoin = bit.book.split('_');
                if (usdCoin[1] == 'usd') {
                    console.log(bit.book)
                }
                var obj = {
                    name: "bitso",
                    pair: bit.book.replace('_', '').toLowerCase(),
                    volume: bit.volume,
                    price: bit.last,
                    high: bit.high,
                    created_at: bit.created_at,
                    vwap: bit.vwap,
                    low: bit.low,
                    ask: bit.ask,
                    bid: bit.bid,
                    date: new Date().toLocaleDateString(),
                    close: bit.last,
                    datestamp: datestamp

                }

                if (h == 16 && m == 17) {
                    obj["open"] = bit.last;
                    var bitsoCoinData = new bitsoLocal(obj);
                    var commonCoin = new commonCollection(obj);
                    commonCoin.save(function (error, detail) {
                        console.log("Bitso Added successfully")
                    })
                } else {
                    var dateString = new Date().toLocaleDateString();
                    var pairValue = bit.book.replace('_', '').toLowerCase();
                    commonCollection.findOne({ date: dateString, pair: pairValue }, function (err, docs) {
                        obj["open"] = docs.open;
                        var bitsoCoinData = new bitsoLocal(obj);
                        var commonCoin = new commonCollection(obj);
                        commonCoin.save(function (error, detail) {
                            console.log("Bitso Added successfully")
                        })

                    })
                }
            })
        }

    });

}














exports.obj = {
    getData: getData
}



router.route('/').get(getData);

module.exports = router;
module.exports.getData = getData;
// "exchange": rtdat.exch,
// "pair": pair.replace(':', '-'),
// "open": trades[0],
// "high": trades[1],
// "low": trades[2],
// "close": trades[3],
// "volume": trades[4]