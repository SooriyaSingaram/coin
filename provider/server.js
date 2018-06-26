// Server Configuration 19-06-2018
var cluster = require('cluster');
const express = require('express');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const passport = require('passport');
const apiRoutes = express.Router();
const cors = require('cors');
const app = express();
var http = require("https");
var cron = require('node-cron');
const multipart = require('connect-multiparty');
const bitso = require('./server/routes/bitso');
const user = require('./server/routes/user');
const User = require('./server/models/user');
const bitstamp = require('./server/routes/bitstamp')
const binance = require('./server/routes/binance')
const bittrex = require('./server/routes/bittrex')
const cex = require('./server/routes/cex')
const btcAlpha = require('./server/routes/btc-alpha')
const coinex = require('./server/routes/coinex')
const exx = require('./server/routes/exx')
const crypto = require('./server/routes/name')
const request = require("request");

const exchange = require('./server/routes/exchange')
var currency = require('./currency.json');
var customize = require('./customize.json');

var jsonData = require('./sample.json');
var jsonData1 = require('./sample1.json');


const db = require('./database');

require('dotenv').config()
require('./server/config/passport');


app.use(express.static(__dirname));
app.use(bodyParser.urlencoded({
    limit: '1000mb'
}));

app.use(bodyParser.json({
    limit: '1000mb'
}));

app.use(bodyParser.json({
    type: 'application/vnd.api+json'
}));

app.get('/defaultCustomizeColumn', function (req, res) {
    res.json(customize);
})

app.use(passport.initialize());
app.use(multipart());
const enableCORS = function (request, response, next) {
    response.header('Access-Control-Allow-Origin', request.headers.origin);
    response.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    response.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Date, X-Date');
    return next();
};



app.use(cors());
app.use(enableCORS);
//apply the routes to User Module
app.use('/user', user);
app.use('/bitstamp', bitstamp);
app.use('/bitso', bitso);
app.use('/exchange', exchange);
app.use('/cex', cex);
app.use('/coinex', coinex);
app.use('/bittrex', bittrex);
app.use('/btc-alpha', btcAlpha);
app.use('/binance', binance);
app.use('/crypto', crypto);

app.use('/exx', exx);


// route middleware to verify a token
apiRoutes.use(function (req, res, next) {

    // check header or url parameters or post parameters for token
    var token = req.body.token || req.query.token || req.headers['x-access-token'];

    if (token) {
        jwt.verify(token, "tokenValue", function (err, decoded) {
            if (err) {
                return res.json({ success: false, message: 'Failed to authenticate token.' });
            } else {
                // if everything is good, save to request for use in other routes
                req.decoded = decoded;
                next();
            }
        });

    } else {
        // if there is no token return unauthorized error
        return res.status(403).send({
            success: false,
            message: 'No token provided.'
        });

    }
});


apiRoutes.get('/checkAuthentication', function (req, res) {
    res.end("done")
})
apiRoutes.use('/userSetting', user)
apiRoutes.use('/coins', exchange)
app.get('/getData', function (req, res) {
    res.send(jsonData);
})
app.get('/getJSON', function (req, res) {
    res.send(jsonData1);
})
// apply the routes to our application with the prefix /api

app.use('/api', apiRoutes);


function cronTest() {
    //    setInterval(function(){
    //     cex.getData()
    //    },3000)
    cron.schedule('0-59 * * * * *', function () {
        bittrex.getData()
       // bitso.getData()
        bitstamp.getData()
        binance.getBinanceCoinData()
        coinex.getData()
    });
    setTimeout(function () {
        console.log("calling")

        cron.schedule('0-59 * * * * *', function () {
            exchange.coinDetails()
        });
    }, 2000);

    setTimeout(function () {
        cron.schedule('*/2 * * * *', function () {
            exchange.deleteCoinRawData()
        });
        cron.schedule('*/1 * * * *', function () {
            exchange.getMinuteData()
        });
    }, 60000);

}

app.post('/currencyConverter', function (req, res) {
    var currency = 'USD_' + req.body.converter
    var options = {
        method: 'GET',
        url: 'http://free.currencyconverterapi.com/api/v5/convert',
        qs: { q: currency, compact: 'y' }
    };

    request(options, function (error, response, body) {
        if (error) {
			console.log(error)
            res.send("Please send valid currency name.")
        } else {
            if (body) {
                var data = JSON.parse(body);
                res.json({ rate: data[currency].val })
            } else {
                res.status(400).send("Please send valid currency name.")
            }


        }

        //   console.log(body);
    });
})

app.get('/getCurrencies', function (req, res) {
    res.send(currency);
    // var result = [];

    // var options = {
    //     method: 'GET',
    //     url: ' https://free.currencyconverterapi.com/api/v5/currencies'
    // };

    // request(options, function (error, response, body) {
    //     if (error) {
    //         res.send("Please try after sime time.")
    //     } else {
    //         if (body) {
    //             var data = JSON.parse(body);
    //             var dataObj = data.results;

    //             for (key in dataObj) {
    //                 result.push(dataObj[key])
    //             }
    //             res.send(result)
    //         }
    //         else {
    //             res.status(500).send("Please try after sime time.")
    //         }



    //     }

    //     //   console.log(body);
    // });

})

//cronTest()
module.exports = app;

app.timeout = 0;
app.listen(5687);
console.log('Server running at http://127.0.0.1:' + 5687);


