

const commonCollection = require('../models/common');
var User = require('../models/user');
const express = require('express');
var request = require("request");
const router = express.Router();
const coinDetailCollection = require('../models/coinDetails');
const minuteCollection = require('../models/minuteData');
const dayCollection = require('../models/dayData');
const exchangeCollection = require('../models/exchangeSummary');

const dayChange = (cb) => {

    // 
    minuteCollection.aggregate([
        { $match: { "datestamp": { $gt: new Date(Date.now() - 24 * 60 * 60 * 1000) } } },//TODO
        { $sort: { price: 1 } },  //TODO  
        { $group: { _id: "$pair", dayVolume: { $avg: "$volume" }, lowestPrice: { $first: "$price" }, highestPrice: { $last: "$price" } } },
        {
            $project: {
                _id: 1,
                "highestPrice": 1,
                "dayVolume": 1,
                "lowestPrice": 1
            }
        }
    ], function (err, data) {
        cb(data)
    })
}

const SevenDayChange = (cb) => {

    var startDate = new Date();
    startDate.setDate(new Date().getDate() - 7);
    startDate.setSeconds(0);
    startDate.setHours(0);
    startDate.setMinutes(0);

    var dateMidnight = new Date(startDate);
    dateMidnight.setHours(23);
    dateMidnight.setMinutes(59);
    dateMidnight.setSeconds(59);
    var aggQuery = [
        {
            $match: {
                $and: [
                    { "datestamp": { $gte: startDate } },
                    { "datestamp": { $lt: dateMidnight } }
                ]
            }
        },

        { $group: { _id: "$pair", price: { $avg: "$price" } } }
    ]
     console.log(aggQuery)
    coinDetailCollection.aggregate(aggQuery, function (err, data) {
          console.log(data)
        cb(data)
    })
}

const exchangeSummary = (req, res) => {

    exchangeCollection.aggregate([

        { $group: { _id: "$name", total: { $sum: "$volume" },noOfcoins:{$last:"$noOfcoins"} } },
        {
            $project: {
                _id: 1,
                "total": 1,
                noOfcoins:1
            }
        }
    ], function (err, data) {
        if (err || !data) {
            res.status(404).send("No data")
        }
        else {
            var result = []
            let sum = 0;
            data.map((item) => {
                sum += item.total
            })

            data.map((item) => {
                let percent = (((item.total / sum)) * 100).toFixed(2);
                result.push({ name: item._id, volume: item.total, volumePercent: percent, NoOfCoins: item.noOfcoins })
            })
            res.send(result)
        }
    })
}


const getPortfolio = (req, res) => {
	try{
	console.log("Getting call getPortfolio API")
          var id = req.decoded.id;
        var portFolioArray = []
        User.findOne({ _id: id }, function (err, userData) {
                if (userData.portfolio.length > 0) {
                    var portfolioData = userData.portfolio;
                    for (var i = 0; i < portfolioData.length; i++) {
                        portFolioArray.push({ pair: portfolioData[i] })
                    }
                }else{
					return  res.send("No Data")
				}

            var matchArray = [];
            var aggreQuery = [
                {
                    $group:
                    {
                    _id: "$pair",
                    price: { $last: "$price" },
                    pair: { $last: "$pair" },
                    volume: { $last: "$volume" },
                    low: { $last: "$low" },
                    high: { $last: "$high" },
                    dayPricePercent: { $last: "$dayPricePercent" },
                    dayPrice: { $last: "$dayPrice" },
                    dayPriceStatus: { $last: "$dayPriceStatus" },
                    priceStatus: { $last: "$priceStatus" },
                    weeklyChangeStatus: { $last: "$weeklyChangeStatus" },
                    weeklyChange: { $last: "$weeklyChange" },
                    weeklyChangePercent: { $last: "$weeklyChangePercent" },
                    highestPrice: { $last: "$highestPrice" },
                    lowestPrice: { $last: "$lowestPrice" },
                    dayVolume: { $last: "$dayVolume" },

                }
            },
            {
                $lookup:
                {
                    from: "names",
                    localField: "pair",
                    foreignField: "symbol",
                    as: "coindata"
                }
            },
            {
                $unwind: "$coindata"
            },
            {
                $project:
                {
                    "_id": 0,
                    "price": 1,
                    "pair": 1,
                    "low": 1,
                    "high": 1,
                    "volume": 1,
                    "dayPricePercent": 1,
                    "dayPrice": 1,
                    "dayPriceStatus": 1,
                    "priceStatus": 1,
                    "weeklyChangeStatus": 1,
                    "weeklyChange": 1,
                    "weeklyChangePercent": 1,
                    "name": "$coindata.name",
                    "image": "$coindata.image",
                    "highestPrice": 1,
                    "lowestPrice": 1,
                    "dayVolume": 1
                }
            }
            ];

            aggreQuery.unshift({
                $match: {
                    $and: [
                        {
                            $or: portFolioArray
                        }
                    ]
                }
            })
            console.log(matchArray)
	
    var coinbase = 'usd';  //req.params.id;
    var likeString = new RegExp(coinbase, 'i')

    coinDetailCollection.aggregate(aggreQuery
        ).exec(function (err, data) {
            if (data.length == 0) {
                return res.send("No Data")
            }
            var result = [];
            marketCap(function (cap) {
                data.map((item) => {
                    finalObj = JSON.parse(JSON.stringify(item));
                    //var changesItem = changes.find(x => x._id == item.pair);
                   // if (changesItem != undefined) {
                        var symbolName = (item.name).toLowerCase();
                        var refCapResult = cap.find(capr => capr.name == symbolName);

                        finalObj["marketCapValue"] = refCapResult == undefined ? 0 : (refCapResult.circulating_supply * item.price).toFixed(2);
                        result.push(finalObj)

                  //  }

                })
                res.send(result)
            })


        })
		})
	}catch(e){
		
	}
}

const getusd = (req, res) => {
    try {
        console.log("Getting call GETUSD API")
        var matchArray = [];
        var aggreQuery = [
            {
                $group:
                {
                    _id: "$pair",
                    price: { $last: "$price" },
                    pair: { $last: "$pair" },
                    volume: { $last: "$volume" },
                    low: { $last: "$low" },
                    high: { $last: "$high" },
                    dayPricePercent: { $last: "$dayPricePercent" },
                    dayPrice: { $last: "$dayPrice" },
                    dayPriceStatus: { $last: "$dayPriceStatus" },
                    priceStatus: { $last: "$priceStatus" },
                    weeklyChangeStatus: { $last: "$weeklyChangeStatus" },
                    weeklyChange: { $last: "$weeklyChange" },
                    weeklyChangePercent: { $last: "$weeklyChangePercent" },
                    highestPrice: { $last: "$highestPrice" },
                    lowestPrice: { $last: "$lowestPrice" },
                    dayVolume: { $last: "$dayVolume" },

                }
            },
            {
                $lookup:
                {
                    from: "names",
                    localField: "pair",
                    foreignField: "symbol",
                    as: "coindata"
                }
            },
            {
                $unwind: "$coindata"
            },
            {
                $project:
                {
                    "_id": 0,
                    "price": 1,
                    "pair": 1,
                    "low": 1,
                    "high": 1,
                    "volume": 1,
                    "dayPricePercent": 1,
                    "dayPrice": 1,
                    "dayPriceStatus": 1,
                    "priceStatus": 1,
                    "weeklyChangeStatus": 1,
                    "weeklyChange": 1,
                    "weeklyChangePercent": 1,
                    "name": "$coindata.name",
                    "image": "$coindata.image",
                    "highestPrice": 1,
                    "lowestPrice": 1,
                    "dayVolume": 1
                }
            }
        ];
        if (req.body.hasOwnProperty('filter')) {
            var filterObj = req.body.filter;
            for (var i = 0; i < filterObj.length; i++) {
                var keyMatch = Object.keys(filterObj[i])[0];
                matchArray.push({ [keyMatch]: { $gte: filterObj[i][Object.keys(filterObj[i])].from } })
                matchArray.push({ [keyMatch]: { $lt: filterObj[i][Object.keys(filterObj[i])].to } })
            }
            aggreQuery.unshift({
                $match: {
                    $and: matchArray
                }
            })
            console.log(matchArray)
        }
        coinDetailCollection.aggregate(aggreQuery
        ).exec(function (err, data) {
			console.log(data.length)
            if (data.length == 0) {
                return res.send("No Data")
            }
            var result = [];
            marketCap(function (cap) {
                data.map((item) => {
                    finalObj = JSON.parse(JSON.stringify(item));
                    //var changesItem = changes.find(x => x._id == item.pair);
                   // if (changesItem != undefined) {
                        var symbolName = (item.name).toLowerCase();
                        var refCapResult = cap.find(capr => capr.name == symbolName);

                        finalObj["marketCapValue"] = refCapResult == undefined ? 0 : (refCapResult.circulating_supply * item.price).toFixed(2);
                        result.push(finalObj)

                  //  }

                })
                res.send(result)
            })


        })
    } catch (e) {

    }
}

const getusd1 = (req, res) => {
	try{
	console.log("Getting call GETUSD API")
    var matchArray = [];
	var aggreQuery =        [    
            {
                $group:
                {
                    _id: "$pair",
                    price: { $last: "$price" },
                    pair: { $last: "$pair" },
                    volume: { $last: "$volume" },
                    low: { $last: "$low" },
                    high: { $last: "$high" },
                    dayPricePercent: { $last: "$dayPricePercent" },
                    dayPrice: { $last: "$dayPrice" },
                    dayPriceStatus: { $last: "$dayPriceStatus" },
                    priceStatus: { $last: "$priceStatus" },
                    weeklyChangeStatus: { $last: "$weeklyChangeStatus" },
                    weeklyChange: { $last: "$weeklyChange" },
                    weeklyChangePercent: { $last: "$weeklyChangePercent" }
                }
            },
            {
                $lookup:
                {
                    from: "names",
                    localField: "pair",
                    foreignField: "symbol",
                    as: "coindata"
                }
            },
            {
                $unwind: "$coindata"
            },
            {
                $project:
                {
                    "_id": 0,
                    "price": 1,
                    "pair": 1,
                    "low": 1,
                    "high": 1,
                    "volume": 1,
                    "dayPricePercent": 1,
                    "dayPrice": 1,
                    "dayPriceStatus": 1,
                    "priceStatus": 1,
                    "weeklyChangeStatus": 1,
                    "weeklyChange": 1,
                    "weeklyChangePercent": 1,
                    "name": "$coindata.name",
                    "image": "$coindata.image"
                }
            }
        ];
    if (req.body.hasOwnProperty('filter')) {
        var filterObj = req.body.filter;
        // for (key in filterObj) {
            // matchArray.push({ [key]: { $gte: filterObj[key].from } })
            // matchArray.push({ [key]: { $lt: filterObj[key].to } })
        // }
		 for (var i=0; i < filterObj.length ; i++) {
            var keyMatch = Object.keys(filterObj[i])[0];
            matchArray.push({ [keyMatch] : { $gte:filterObj[i][ Object.keys(filterObj[i])].from  } })
            matchArray.push({ [keyMatch] : { $lt: filterObj[i][Object.keys(filterObj[i])].to  } })
        }
		aggreQuery.unshift( {
                $match: {
                    $and: matchArray
                }
            })
        console.log(matchArray)
    }
	
	
    var coinbase = 'usd';  //req.params.id;
    var likeString = new RegExp(coinbase, 'i')

    coinDetailCollection.aggregate(aggreQuery
    ).exec(function (err, data) {
		console.log(err)
	if(data.length == 0){
		console.log(data)
		return  res.send("No Data")
	}
	dayChange(function (changes) {
            var result = [];
             console.log(changes)
            marketCap(function (cap) {
                data.map((item) => {
                    //  changes.map((dec) => {
                    finalObj = JSON.parse(JSON.stringify(item));
                    var changesItem = changes.find(x => x._id == item.pair);
                    if (changesItem != undefined) {
                        var symbolName = (item.name).toLowerCase();
                        var refCapResult = cap.find(capr => capr.name == symbolName);

                        finalObj["marketCapValue"] = refCapResult == undefined ? 0 : (refCapResult.circulating_supply * item.price).toFixed(2);

                        finalObj["dayVolume"] = changesItem.dayVolume.toFixed(2),
                            finalObj["lowestPrice"] = changesItem.lowestPrice.toFixed(2),
                            finalObj["highestPrice"] = changesItem.highestPrice.toFixed(2)

                        result.push(finalObj)
                        // console.log(finalObj)
                    }
                    // })
                })
                res.send(result)
            })
        })
        // dayChange(function (changes) {
            // var result = [];
            // // console.log(changes)
            // marketCap(function (cap) {
				// //console.log(cap);
				
                // data.map((item) => {
                    // changes.map((dec) => {
                        // finalObj = JSON.parse(JSON.stringify(item));
                        // if (item.pair == dec._id) {
                            // //   var symbolName = (item.pair).substring(0, 3);
                            // var symbolName = (item.name).toLowerCase();


                            // if (cap) {
                                // for (key in cap) {
                                    // // console.log(cap[key].name)

                                    // var symbolCap = (cap[key].name).toLowerCase();

                                    // if (symbolCap == symbolName) {
                                        // //console.log(cap[key].circulating_supply)
                                        // finalObj["marketCapValue"] = (cap[key].circulating_supply * item.price).toFixed(2);
                                    // }
                                // }
                            // }

                            // finalObj["dayVolume"] = dec.dayVolume.toFixed(2),
                                // finalObj["lowestPrice"] = dec.lowestPrice.toFixed(2),
                                // finalObj["highestPrice"] = dec.highestPrice.toFixed(2)

                            // result.push(finalObj)
                            // //console.log(finalObj)
                        // }
                    // })
                // })
                // res.send(result)
            // })
        // })
    })
	}catch(e){
		
	}
}

const getParticularCoin = (req, res) => {
    // coinDetailCollection.find({pair: /usd$/},function(err,data){
    //     res.send(data)
    // }).sort({_id:1})
    var coinbase = 'usd';  //req.params.id;
    var likeString = new RegExp(coinbase, 'i')
    coinDetailCollection.aggregate(
        [
            {
                $match: { "pair": req.params.id }
            },
            {
                $group:
                {
                    _id: "$pair",
                    price: { $last: "$price" },
                    pair: { $last: "$pair" },
                    volume: { $last: "$volume" },
                    low: { $last: "$low" },
                    high: { $last: "$high" },
                    dayPricePercent: { $last: "$dayPricePercent" },
                    dayPrice: { $last: "$dayPrice" },
                    dayPriceStatus: { $last: "$dayPriceStatus" },
                    priceStatus: { $last: "$priceStatus" },
                    weeklyChangeStatus: { $last: "$weeklyChangeStatus" },
                    weeklyChange: { $last: "$weeklyChange" },
                    weeklyChangePercent: { $last: "$weeklyChangePercent" },
                    highestPrice: { $last: "$highestPrice" },
                    lowestPrice: { $last: "$lowestPrice" },
                    dayVolume: { $last: "$dayVolume" },

                }
            },
            {
                $lookup:
                {
                    from: "names",
                    localField: "pair",
                    foreignField: "symbol",
                    as: "coindata"
                }
            },
            {
                $unwind: "$coindata"
            },
            {
                $project:
                {
                    "_id": 0,
                    "price": 1,
                    "pair": 1,
                    "low": 1,
                    "high": 1,
                    "volume": 1,
                    "dayPricePercent": 1,
                    "dayPrice": 1,
                    "dayPriceStatus": 1,
                    "priceStatus": 1,
                    "weeklyChangeStatus": 1,
                    "weeklyChange": 1,
                    "weeklyChangePercent": 1,
                    "name": "$coindata.name",
                    "image": "$coindata.image",
                    "highestPrice": 1,
                    "lowestPrice": 1,
                    "dayVolume": 1
                }
            }
        ]
    ).exec(function (err, data) {
        res.send(data)
    })

}

const getLastSecData = (req, res) => {
    //console.log(req.body.pair)
    if (req.body.pair) {

        coinDetailCollection.aggregate([

            {
                $project: {
                    _id: 1,
                    pair: 1, volume: 1, open: 1, close: 1, price: 1, high: 1, low: 1, datestamp: 1,
                    secs: { $second: '$datestamp' }
                }
            },
            { $match: { pair: req.body.pair } },
            {
                "$sort": {
                    "_id": -1
                }
            },
            {
                "$limit": 1
            }

        ],
            //commonCollection.find({ pair: req.body.pair }, { _id: 0, pair: 1, volume: 1, open: 1, close: 1, price: 1, high: 1, low: 1, createdDateTime: 1 },
            function (err, data) {
                //  console.log(err)
                if (data) {
                    var result = []
                    data.map((item) => {
                        finalObj = JSON.parse(JSON.stringify(item));
                        finalObj.time = new Date(item.datestamp).valueOf()
                        delete finalObj.datestamp;
                        result.push(finalObj)
                    })

                    res.send(result)
                }

            })
    } else {
        res.status(404).send("Please send valid pair to proceed")
    }


}

const getChart = (req, res) => {
    //console.log(req.body.pair)
    if (req.body.pair) {

        minuteCollection.aggregate([
            {
                $project: {
                    _id: 1,
                    pair: 1, volume: 1, open: 1, close: 1, price: 1, high: 1, low: 1, datestamp: 1,
                    secs: { $second: '$datestamp' }
                }
            },
            { $match: {  pair: req.body.pair } }
        ],
            //commonCollection.find({ pair: req.body.pair }, { _id: 0, pair: 1, volume: 1, open: 1, close: 1, price: 1, high: 1, low: 1, createdDateTime: 1 },
            function (err, data) {
                if (data) {
                    var result = []
                    data.map((item) => {
                        finalObj = JSON.parse(JSON.stringify(item));
                        finalObj.time = new Date(item.datestamp).valueOf()
                        delete finalObj.datestamp;
                        result.push(finalObj)
                    })

                    res.send(result)
                }

            })
    } else {
        res.status(404).send("Please send valid pair to proceed")
    }


}


const coinDetails = (req, res) => {
    
        commonCollection.aggregate([
    
            { $match: { lastRecord: true } },    //    TODO
            { $group: { _id: "$pair", price: { $avg: "$price" }, low: { $avg: "$low" }, high: { $avg: "$high" }, volume: { $avg: "$volume" }, close: { $avg: "$close" }, open: { $avg: "$open" }, "count": { "$sum": 1 }, datestamp: { $last: "$datestamp" } } },
            {
                $project: {
                    _id: 1,
                    "price": 1,
                    "count": 1,
                    "low": 1,
                    "high": 1,
                    "volume": 1,
                    "open": 1,
                    "close": 1,
                    "datestamp": 1
                }
            }
        ], function (err, docs) {
            if (err || !docs) {
                // res.status(404).send("No data")
            }
            else {
    
                var d = new Date(),
                    h = d.getHours(),
                    m = d.getMinutes();                                       
                docs.map((data) => {
    
                    count = 0;
                    var change, dayPricePercent, dayPrice, dayPriceStatus;
                    coinDetailCollection.findOne({ pair: data._id }).sort({ _id: -1 }).exec(function (err, post) {
    
                        if (post) {
    
                            if (post.price.toFixed(2) < data.price.toFixed(2)) {
                                change = 'true';
                            } else if (post.price.toFixed(2) > data.price.toFixed(2)) {
                                change = 'false';
                            } else {
                                change = 'NC';
                            }
                        } else {
                            change = 'NC';
                        }
    
                        minuteCollection.findOne({ pair: data._id, "datestamp": { $gt: new Date(new Date(new Date().setDate(new Date().getDate() - 1)).setSeconds(0)) } }).exec(function (err, minData) {
                            
                            if (minData) {
                                dayPrice = data.price.toFixed(2) - minData.price.toFixed(2);
                                if (minData.price.toFixed(2) < data.price.toFixed(2)) {
                                    dayPricePercent = ((data.price / minData.price)).toFixed(2)
                                    dayPriceStatus = 'true';
                                } else if (minData.price.toFixed(2) > data.price.toFixed(2)) {
                                    dayPricePercent = ((minData.price / data.price)).toFixed(2)
                                    dayPriceStatus = 'false';
                                } else {
                                    dayPricePercent = 0
                                    dayPriceStatus = 'NC';
                                }
    
                            } else {
                                dayPrice = 0;
                                dayPricePercent = 0;
                                dayPriceStatus = 'NC';
                            }
                            
                    
    
                        // console.log(change)
                        var seventhDayUpdate, weeklyChange, weeklyChangePercent;
                           SevenDayChange(function (WeekData) {
                        WeekData.map((item) => {
                            if (item._id == data._id) {
                                seventhDayUpdate = data.price.toFixed(2) - item.price.toFixed(2); //TODO
    
                                if (item.price.toFixed(2) < data.price.toFixed(2)) {
                                    weeklyChange = 'true'
                                    weeklyChangePercent = '+' + ((data.price.toFixed(2) / item.price.toFixed(2)) * 100) + '%'
                                } else if (item.price.toFixed(2) > data.price.toFixed(2)) {
                                    weeklyChangePercent = '-' + ((item.price.toFixed(2) / data.price.toFixed(2)) * 100) + '%'
                                    weeklyChange = 'false'
                                } else {
                                    weeklyChangePercent = '0%'
                                    weeklyChange = 'NC'
                                 }
						}
    
    
                        var details = new coinDetailCollection({ pair: data._id, price: data.price.toFixed(2), volume: data.volume.toFixed(2), high: data.high.toFixed(2), low: data.low.toFixed(2), open: data.open, close: data.close, priceStatus: change, datestamp: data.datestamp, weeklyChange: seventhDayUpdate, weeklyChangeStatus: weeklyChange, dayPricePercent: dayPricePercent, weeklyChangePercent: weeklyChangePercent, dayPrice: dayPrice.toFixed(2), dayPriceStatus: dayPriceStatus })
                         details.save(function (error, detail) {
                             if (detail) {
                              // console.log(detail)
    
                                 commonCollection.findOneAndUpdate({ lastRecord: true }, { "$set": { "lastRecord": false } }).exec(function (err, book) {
    
                                });
                            }
    
                         })
    
                         })
    
                         })
        })
    
                    });
    
                })
            }
        })
    }
    


function marketCap(cb) {
    var options = {
        method: 'GET',
        url: 'https://api.coinmarketcap.com/v2/ticker/',
        json: true
    };

    request(options, function (error, response, body) {
        if (error) {
            console.log(error)
        } else {
             var data = body.data;
            var result = [];

            for (item in data) {
                result.push({ name: (data[item].name).toLowerCase(), circulating_supply: data[item].circulating_supply })

            }
            cb(result)
            //cb(body.data)
        }
    });
}

function deleteCoinRawData() {

    var twoMinuteAgo = new Date( Date.now() - 2000 * 60 );

    commonCollection.remove({datestamp : {$lt : twoMinuteAgo}}, function (err) {
        console.log("Data updated in new collection and deleted from old collection")
    })
    

    // commonCollection.deleteMany({ lastRecord: false }, function (err) {
    //     console.log("Data updated in new collection and deleted from old collection")
    // })
}


function getMinuteData(req, res) {

    var aggQuery = [
        {
            $match: {
                $and: [
                    { "datestamp": { $gte: new Date(new Date(new Date().setMinutes(new Date().getMinutes() - 2)).setSeconds(0)) } },
                    { "datestamp": { $lt: new Date(new Date(new Date().setMinutes(new Date().getMinutes() - 1)).setSeconds(0)) } }
                ]
            }
        },
        { $group: { _id: "$pair", pair: { $last: "$pair" }, price: { $avg: "$price" }, low: { $avg: "$low" }, high: { $avg: "$high" }, volume: { $avg: "$volume" }, close: { $avg: "$close" }, open: { $avg: "$open" }, "count": { "$sum": 1 }, datestamp: { $last: "$datestamp" } } },
        {
            $project: {
                "_id": 0,
                "price": 1,
                "pair": 1,
                "low": 1,
                "high": 1,
                "volume": 1,
                "open": 1,
                "close": 1,
                "datestamp": 1

            }

        }

    ]
    coinDetailCollection.aggregate(aggQuery, function (err, data) {
        if (data) {
            console.log(data)
            var count = 0;
            data.map(function (item) {
                // console.log(item)
                var minuteData = new minuteCollection(item);
                minuteData.save(function (error, detail) {
                    console.log(detail.length)
                    count++
                    if (detail) {

                        // console.log("count:" + count)
                        // console.log("detail.length:" + data.length)
                        if (count == data.length) {
                            coinDetailCollection.remove({
                                $and: [
                                    { "datestamp": { $gte: new Date(new Date(new Date().setMinutes(new Date().getMinutes() - 2)).setSeconds(0)) } },
                                    { "datestamp": { $lt: new Date(new Date(new Date().setMinutes(new Date().getMinutes() - 1)).setSeconds(0)) } }
                                ]
                            }, function (err) {
                                //  console.log(err)
                               // console.log("successfully Deleted")

                            });
                        }

                    }

                })
            })
        }

    })

}

function getMax(req, res) {
    var aggQuery = [
        {
            $group:
            {
                _id: null,
                maxPrice: { $max: "$price" }
            }
        }
    ]
    coinDetailCollection.aggregate(aggQuery, function (err, data) {
        res.send(data)
    })



}


function getFavourites(req, res) {
    try {
        var id = req.decoded.id;
        var favouritesArray = []
        User.findOne({ _id: id }, function (err, userData) {
            if (userData.favourites.length > 0) {
                var favData = userData.favourites;
                for (var i = 0; i < favData.length; i++) {
                    favouritesArray.push({ pair: favData[i] })
                }
            } else {
                return res.send("No Data")
            }

            console.log(favouritesArray)
            var aggreQuery = [
                {
                    $match: {
                        $and: [
                            {
                                $or: favouritesArray
                            }
                        ]
                    }
                },
                {
                    
                $group:
                {
                    _id: "$pair",
                    price: { $last: "$price" },
                    pair: { $last: "$pair" },
                    volume: { $last: "$volume" },
                    low: { $last: "$low" },
                    high: { $last: "$high" },
                    dayPricePercent: { $last: "$dayPricePercent" },
                    dayPrice: { $last: "$dayPrice" },
                    dayPriceStatus: { $last: "$dayPriceStatus" },
                    priceStatus: { $last: "$priceStatus" },
                    weeklyChangeStatus: { $last: "$weeklyChangeStatus" },
                    weeklyChange: { $last: "$weeklyChange" },
                    weeklyChangePercent: { $last: "$weeklyChangePercent" },
                    highestPrice: { $last: "$highestPrice" },
                    lowestPrice: { $last: "$lowestPrice" },
                    dayVolume: { $last: "$dayVolume" },

                }
            },
            {
                $lookup:
                {
                    from: "names",
                    localField: "pair",
                    foreignField: "symbol",
                    as: "coindata"
                }
            },
            {
                $unwind: "$coindata"
            },
            {
                $project:
                {
                    "_id": 0,
                    "price": 1,
                    "pair": 1,
                    "low": 1,
                    "high": 1,
                    "volume": 1,
                    "dayPricePercent": 1,
                    "dayPrice": 1,
                    "dayPriceStatus": 1,
                    "priceStatus": 1,
                    "weeklyChangeStatus": 1,
                    "weeklyChange": 1,
                    "weeklyChangePercent": 1,
                    "name": "$coindata.name",
                    "image": "$coindata.image",
                    "highestPrice": 1,
                    "lowestPrice": 1,
                    "dayVolume": 1
                }
            }
            ];


            coinDetailCollection.aggregate(aggreQuery
        ).exec(function (err, data) {
            if (data.length == 0) {
                return res.send("No Data")
            }
            var result = [];
            marketCap(function (cap) {
                data.map((item) => {
                    finalObj = JSON.parse(JSON.stringify(item));
                    //var changesItem = changes.find(x => x._id == item.pair);
                   // if (changesItem != undefined) {
                        var symbolName = (item.name).toLowerCase();
                        var refCapResult = cap.find(capr => capr.name == symbolName);

                        finalObj["marketCapValue"] = refCapResult == undefined ? 0 : (refCapResult.circulating_supply * item.price).toFixed(2);
                        result.push(finalObj)

                  //  }

                })
                res.send(result)
            })


        })
        })
    } catch (e) {
        res.send("No data")
    }

}
function getAllCoins(req, res) {
    try {
        var id = req.decoded.id;
        var favouritesArray = {}
        User.findOne({ _id: id }, { "favourites": 1 }, function (err, userData) {
            var aggreQuery = [

                {
                $group:
                {
                    _id: "$pair",
                    price: { $last: "$price" },
                    pair: { $last: "$pair" },
                    volume: { $last: "$volume" },
                    low: { $last: "$low" },
                    high: { $last: "$high" },
                    dayPricePercent: { $last: "$dayPricePercent" },
                    dayPrice: { $last: "$dayPrice" },
                    dayPriceStatus: { $last: "$dayPriceStatus" },
                    priceStatus: { $last: "$priceStatus" },
                    weeklyChangeStatus: { $last: "$weeklyChangeStatus" },
                    weeklyChange: { $last: "$weeklyChange" },
                    weeklyChangePercent: { $last: "$weeklyChangePercent" },
                    highestPrice: { $last: "$highestPrice" },
                    lowestPrice: { $last: "$lowestPrice" },
                    dayVolume: { $last: "$dayVolume" },

                }
            },
            {
                $lookup:
                {
                    from: "names",
                    localField: "pair",
                    foreignField: "symbol",
                    as: "coindata"
                }
            },
            {
                $unwind: "$coindata"
            },
            {
                $project:
                {
                    "_id": 0,
                    "price": 1,
                    "pair": 1,
                    "low": 1,
                    "high": 1,
                    "volume": 1,
                    "dayPricePercent": 1,
                    "dayPrice": 1,
                    "dayPriceStatus": 1,
                    "priceStatus": 1,
                    "weeklyChangeStatus": 1,
                    "weeklyChange": 1,
                    "weeklyChangePercent": 1,
                    "name": "$coindata.name",
                    "image": "$coindata.image",
                    "highestPrice": 1,
                    "lowestPrice": 1,
                    "dayVolume": 1
                }
            }
            ];
            if (userData.favourites.length > 0) {
                var favData = userData.favourites;
                var tempArray = [];
                for (var i = 0; i < favData.length; i++) {
                    tempArray.push(favData[i])
                }
                favouritesArray.pair = tempArray
                console.log(favouritesArray)
                aggreQuery.unshift({
                    // $match: {
                    //     $and: [
                    //         {
                    //             '$nin': favouritesArray
                    //         }
                    //     ]
                    // }
                    $match: { 'pair': { '$nin': tempArray } }
                })
            }

        coinDetailCollection.aggregate(aggreQuery
        ).exec(function (err, data) {
            if (data.length == 0) {
                return res.send("No Data")
            }
            var result = [];
            marketCap(function (cap) {
                data.map((item) => {
                    finalObj = JSON.parse(JSON.stringify(item));
                    //var changesItem = changes.find(x => x._id == item.pair);
                   // if (changesItem != undefined) {
                        var symbolName = (item.name).toLowerCase();
                        var refCapResult = cap.find(capr => capr.name == symbolName);

                        finalObj["marketCapValue"] = refCapResult == undefined ? 0 : (refCapResult.circulating_supply * item.price).toFixed(2);
                        result.push(finalObj)

                  //  }

                })
                res.send(result)
            })


        })
        })
    } catch (e) {
        res.send("No data")
    }


}

router.route('/getMax').get(getMax)
router.route('/exchangeSummary').get(exchangeSummary)
router.route('/coinDetails').get(coinDetails)
router.route('/getusd/:id').get(getParticularCoin)
router.route('/getFavourites').post(getFavourites)
router.route('/getCoins').post(getAllCoins)
router.route('/SevenDayChange').get(SevenDayChange)
router.route('/getPortfolio').post(getPortfolio)
router.route('/getLastSecData').post(getLastSecData)
router.route('/getusd').post(getusd)
router.route('/getChart').post(getChart)
router.route('/dayChange').post(dayChange)
router.route('/getMinuteData').get(getMinuteData)
module.exports = router;
module.exports.coinDetails = coinDetails;
module.exports.deleteCoinRawData = deleteCoinRawData;
module.exports.getMinuteData = getMinuteData;



