

const btcAlphaLocal = require('../models/btc-alpha');
const commonCollection = require('../models/common');
const express = require('express');
const http = require("https");
const router = express.Router();


const getData = (req, res) => {
    var options = {
        "method": "GET",
        "hostname": "btc-alpha.com",
        "port": null,
        "path": "/api/v1/exchanges/",
        "headers": {
          "content-type": "application/json"
        }
      };

    var reqst = http.request(options, function (response) {
        var chunks = [];

        response.on("data", function (chunk) {
            chunks.push(chunk);
        });

        response.on("end", function () {

            var body = Buffer.concat(chunks);
            var dataBtcAlpha = JSON.parse(body.toString());
            //var btcAlphaData = dataBtcAlpha.payload;
            dataBtcAlpha.map((bit) => {
              
                var btcAlphaCoinData = new btcAlphaLocal({ name: "btc-alpha", pair: bit.pair.replace('_', '').toLowerCase(), price: bit.price });
                var commonCoin = new commonCollection({ name: "btc-alpha", pair: bit.pair.replace('_', '').toLowerCase(), price: bit.price });
                commonCoin.save(function (error, detail) {
                    btcAlphaCoinData.save(function (err, data) {
                        if (err) {
                            res.status(400).send({ message: "Internal server error" })
                        } else {
                            res.send({ message: "Successfully Added" })
                        }
                    })
                })
            })
        });
    });
    reqst.end();
}

const getExchange = (req, res) => {
    btcAlphaLocal.find({}, function (err, data) {
        res.send(data)
    })
}


router.route('/')
    .get(getData);
router.route('/exchange').get(getExchange)

module.exports = router;

