const binanceLocal = require('../models/binance');

const commonCollection = require('../models/common');
const express = require('express');
const http = require("https");
const binance = require('node-binance-api');
const router = express.Router();

binance.options({
    APIKEY: '3jWzlUZNHd5xuE2BDKzj52IiyR8fiIoy0aQZ7ehKYVb1MDUyu9nBN5wKFuJaY2mh',
    APISECRET: 'jCzdATHwHoUCqu776IXlxWXMHcBvbogzlFmxWd7PVQbPWty6DNX335sPQycXxGgg',
    useServerTime: true,
    test: true
});



const getData = (req, res) => {
    try {
        var result = [];
        var datestamp = JSON.parse(JSON.stringify(new Date))
        getUniquePair((ticker) => {
            binance.prevDay(false, (error, prevDay) => {
                var ethCoin, btcCoin, bnbCoin, convertUsd, pairName;
                prevDay.map((item) => {
                    if (item.symbol == 'ETHUSDT') {
                        ethCoin = item.lastPrice
                    }
                    if (item.symbol == 'BTCUSDT') {
                        btcCoin = item.lastPrice
                    }
                    if (item.symbol == 'BNBUSDT') {
                        bnbCoin = item.lastPrice
                    }
                })
                prevDay.map((item) => {
                    for (var i = 0; i < ticker.length; i++) {
                        var findUsd = ticker[i].search(/usdt/i);
                        var findCoin = ticker[i].substr(-3);
                        if (findUsd > -1) {
                            pairName = ticker[i].replace(/usdt/gi, "usd").toLowerCase();
                            convertUsd = 1
                        } else if (findCoin == 'ETH') {
                            pairName = ticker[i].replace(/eth/gi, "usd").toLowerCase();
                            convertUsd = ethCoin
                        } else if (findCoin == 'BTC') {
                            pairName = ticker[i].replace(/btc/gi, "usd").toLowerCase();
                            convertUsd = btcCoin
                        } else if (findCoin == 'BNB') {
                            pairName = ticker[i].replace(/bnb/gi, "usd").toLowerCase();
                            convertUsd = bnbCoin
                        }
    
                        if (ticker[i] == item.symbol) {
    
                            var binDataCommon = new commonCollection({
                                name: "binance",
                                pair: pairName,
                                volume: item.volume,
                                price: item.lastPrice * convertUsd,
                                high: item.highPrice * convertUsd,
                                open: item.openPrice * convertUsd,
                                close: item.lastPrice * convertUsd,
                                low: item.lowPrice * convertUsd,
                                datestamp: datestamp
                            });
    
                            binDataCommon.save(function (error, detail) {
    
                                if (error) {
                                    res.status(400).send({ message: "Internal server error" })
                                } else {
                                    res.send({ message: "Successfully Added" })
                                }
    
                            })
    
                        }
    
    
                    }
                })
            })
    
    
        });
    } catch (error) {
        console.log(error)
    }
    

}

const getUniquePair = (cb) => {

    var pairArray = [];
    var checkArray = [];
    binance.prices((error, ticker) => {
        for (key in ticker) {
            var findUsd = key.search(/usdt/i);
            if (findUsd > -1) {
                pairArray.push(key)
                var usdCoin = key.slice(0, -4);
                checkArray.push(usdCoin)
            }
        }
        for (coinName in ticker) {
            if (findUsd <= -1) {
                var last = coinName.substr(-3);
                if ((last == 'ETH') || (last == 'BTC') || (last == 'BNB')) {
                    var ethCoin = coinName.slice(0, -3);
                    if (checkArray.indexOf(ethCoin) <= -1) {
                        checkArray.push(ethCoin);
                        pairArray.push(coinName)
                    }
                }
            }

        }
       
        cb(pairArray)
    })

}

const getBinanceCoinData = (req, res) => {
    binance.websockets.miniTicker(marketItems => {
    var datestamp = JSON.parse(JSON.stringify(new Date));
     var date = new Date(),
     hours = date.getHours(),
     minutes = date.getMinutes();
     for (var market in marketItems) {
 
         var pairName=  market.replace(/usdt/gi, "usd").toLowerCase()
         var getUSDCoin = pairName.substr(pairName.length - 3);
         if(getUSDCoin=="usd"){
         var marketObj = {
             name: "binance",
             pair: pairName,
             volume: marketItems[market].volume,
             price: marketItems[market].close,
             low: marketItems[market].low,
             high: marketItems[market].high,
             date: date.toLocaleDateString(),
             open:marketItems[market].open,
             close:marketItems[market].close,
             datestamp:datestamp
         }
        
         var  saveBinanceCoin = new commonCollection(marketObj);
         saveBinanceCoin.save(function (err, data) {   
             if (err) {
                //  console.log("Internal server error");
             } else {
                //  console.log(marketObj);
                //  console.log("Successfully Added")
             }
         })
     }
     }
   });
 }
const getExchange = (req, res) => {
    binanceLocal.find({}, function (err, data) {
        res.send(data)
    })
}

router.route('/').get(getData);
router.route('/exchange').get(getExchange)
module.exports = router;
module.exports.getBinanceCoinData = getBinanceCoinData;
module.exports.getData = getData;

