const commonCollection = require('../models/common');
const http = require("https");
const express = require('express');
const router = express.Router();

const getData = (req, res) => {
    var options = {
        "method": "GET",
        "hostname": "api.exx.com",
        "port": null,
        "path": "/data/v1/tickers",
        "headers": {
            "content-type": "application/json"
        }
    };
    var reqst = http.request(options, function (response) {
        var d = new Date(),
            h = d.getHours(),
            m = d.getMinutes();


        var chunks = [];
        response.on("data", function (chunk) {
            chunks.push(chunk);
        });
        response.on("end", function () {
            var body = Buffer.concat(chunks);
            var bitsoData = JSON.parse(body.toString());
            
            for(bit in bitsoData){    
                        
                var obj = {
                    name: "exx",
                    pair: bit.replace('_', '').toLowerCase(),
                    volume: bitsoData[bit].vol,
                    price: bitsoData[bit].last,
                    high: bitsoData[bit].high,
                    low: bitsoData[bit].low,
                    date: new Date().toLocaleDateString(),
                    close: bitsoData[bit].last

                }

                if (h == 16 && m == 26) {
                    console.log("bit1",bit)   
                    obj["open"] = bitsoData[bit].last;
                    var commonCoin = new commonCollection(obj);
                    commonCoin.save(function (error, detail) {
                            if (error) {
                                res.status(400).send({
                                    message: "Internal server error"
                                })
                            } else {
                                res.send({
                                    message: "Successfully Added"
                                })
                            }
                    })
                } else {
                    console.log("bit2",bit)  
                    var dateString = new Date().toLocaleDateString();
                    var pairValue = bit.replace('_', '').toLowerCase();
                    commonCollection.findOne({ date: dateString, pair: pairValue }, function (err, docs) {
                        obj["open"] = docs.open;
                        var commonCoin = new commonCollection(obj);
                        commonCoin.save(function (error, detail) {
                                if (err) {
                                    res.status(400).send({
                                        message: "Internal server error"
                                    })
                                } else {
                                    res.send({
                                        message: "Successfully Added"
                                    })
                                }
                        })
                    })
                }
 }
        });
        response.on("error", function (err) {
res.send(err)
        })
    });
    reqst.end();
}
const getExchange = (req, res) => {
    bitsoLocal.find({}, function (err, data) {
        res.send(data)
    })
}

const getBitso = (req, res) => {
    bitsoLocal.aggregate()
}










router.route('/').get(getData);
router.route('/exchange').get(getExchange)


module.exports = router;
module.exports.getData = getData;

// https://api.exx.com/data/v1/tickers
