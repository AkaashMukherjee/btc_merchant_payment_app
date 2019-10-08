// server.js
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const https = require('https');
const request = require('request');
const axios = require('axios');
const pg = require('pg')

// server.js
const port = 9090;
app.listen(port, () => {
    console.log("en cours d'execution sur le port 9090");
});

// Add headers
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.get('/lastSuccessfulTransaction',

    function(req, result) {
        var connectionString = "postgres://postgres:mukherje12@localhost:5432/paiemoi";
        var client = new pg.Client(connectionString);
        client.connect();
        console.log('db connected')
        console.log(req.query.merchantName)
        client.query("select btc_pub_key from company_name where company_name =" +"'"+ req.query.merchantName+"'")
            .then(resPG =>{
                console.log(resPG.rows[0]['btc_pub_key'])
                axios.get('https://chain.so/api/v2/get_tx_received/btc/' + resPG.rows[0]['btc_pub_key'])
                    .then(response => {
                        var transactions = response.data.data.txs;                                
                        //https://api.blockcypher.com/v1/btc/main/txs/
                        axios.get('https://chain.so/api/v2/tx/btc/' + transactions[transactions.length - 1].txid)
                            .then(response =>{
                                console.log(response.data.data.fee)
                                var outputs = response.data.data.outputs
                                var index
                                var amount
                                for (index = 0; index < outputs.length; ++index) {
                                    if(outputs[index].address == resPG.rows[0]['btc_pub_key']){
                                        amount = outputs[index].value
                                        break
                                    }
                                }
                                var fee = response.data.data.fee
                                var lastClientAddress = response.data.data.inputs[0].address
                                result.send(JSON.stringify({amount:amount, fee: fee, lastClientAddress: lastClientAddress}))
                            })
                            .catch(error => {
                                console.log(error);
                            })
                    })
                    .catch(error => {
                        console.log(error);
                    });
            })
            .catch(error => {
                console.log(error);
            });
    }
);

app.get('/getQRCode',

    function(req, result) {
        var connectionString = "postgres://postgres:mukherje12@localhost:5432/paiemoi";
        var client = new pg.Client(connectionString);
        client.connect();
        console.log('db connected')
        console.log(req.query.merchantName)
        client.query("select btc_pub_key from company_name where company_name =" +"'"+ req.query.merchantName+"'")
            .then(resPG =>{
                console.log(resPG.rows[0]['btc_pub_key'])
                axios.get('https://api.kraken.com/0/public/Ticker?pair=XBTCAD')
                    .then(response => {
                        var rate = response.data.result.XXBTZCAD.b[0]                      
                        result.send({
                                        pubKey: resPG.rows[0]['btc_pub_key'],
                                        rate: rate,
                                        QRLink: 'https://chart.googleapis.com/chart?chs=225x225&chld=L|2&cht=qr&chl=bitcoin:'+resPG.rows[0]['btc_pub_key']+'?amount='+String(req.query.CADPrice/rate)
                                    })
                    })
                    .catch(error => {
                        console.log(error);
                    });
            })
            .catch(error => {
                console.log(error);
            });
    }
);



