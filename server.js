// server.js
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const https = require('https');
const request = require('request');
const axios = require('axios');
const pg = require('pg');
const CoinKey = require('coinkey')
const secureRandom = require('secure-random')

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
        client.query(
            "SELECT btc_public_address FROM company WHERE company_name =" +
            "'"+ req.query.merchantName+"'"
            )
            .then(resPG =>{
                console.log(resPG.rows[0]['btc_public_address'])
                //TODO switch call with https://api.blockcypher.com/v1/btc/main/txs/ --- blockcypher has timestamp on transactions
                axios.get('https://chain.so/api/v2/get_tx_received/btc/' + resPG.rows[0]['btc_public_address'])
                    .then(response => {
                        var transactions = response.data.data.txs;                       
                        axios.get('https://chain.so/api/v2/tx/btc/' + transactions[transactions.length - 1].txid)
                            .then(response =>{
                                console.log(response.data.data.fee)
                                var outputs = response.data.data.outputs
                                var index
                                var amount
                                //multiple potential outputs from user wallet need to find output to merchant wallet
                                for (index = 0; index < outputs.length; ++index) {
                                    if(outputs[index].address == resPG.rows[0]['btc_public_address']){
                                        amount = outputs[index].value
                                        break
                                    }
                                }
                                var fee = response.data.data.fee
                                var lastClientAddress = response.data.data.inputs[0].address
                                result.send({
                                    success: true,
                                    amount:amount, 
                                    fee: fee, 
                                    lastClientAddress: lastClientAddress
                                })
                            })
                            .catch(error => {
                                console.log(error);
                                result.send({
                                    success: false,
                                    error: error                                    
                                })
                            })
                    })
                    .catch(error => {
                        console.log(error);
                        result.send({
                            success: false,
                            error: error                            
                        })
                    });
            })
            .catch(error => {
                console.log(error);
                result.send({
                    success: false,
                    error: error                    
                })
            });
    }
);

app.get('/getQRCode',

    function(req, result) {
        var connectionString = "postgres://postgres:mukherje12@localhost:5432/paiemoi";
        var client = new pg.Client(connectionString);
        client.connect();
        client.query(
            "SELECT btc_public_address FROM company WHERE company_name =" +
            "'"+ req.query.merchantName+"'"
            )
            .then(resPG =>{
                console.log(resPG.rows[0]['btc_public_address'])
                axios.get('https://api.kraken.com/0/public/Ticker?pair=XBTCAD')
                    .then(response => {
                        var rate = response.data.result.XXBTZCAD.b[0]                      
                        result.send({
                            success: true,                            
                            pubKey: resPG.rows[0]['btc_public_address'],
                            rate: rate,
                            QRLink: 'https://chart.googleapis.com/chart?chs=225x225&chld=L|2&cht=qr&chl=bitcoin:'+
                            resPG.rows[0]['btc_public_address']+'?amount='+String(req.query.CADPrice/rate)                            
                        })
                    })
                    .catch(error => {
                        console.log(error);
                        result.send({
                            success: false,
                            error: error                            
                        })

                    });
            })
            .catch(error => {
                console.log(error);
                result.send({
                    success: false,
                    error: error                    
                })
            });
    }
);

app.post('/createNewMerchant',

    function(req, result) {
        const bytes = secureRandom.randomBuffer(32)
        const key = new CoinKey(bytes)
        const connectionString = "postgres://postgres:mukherje12@localhost:5432/paiemoi";
        const client = new pg.Client(connectionString);
        client.connect();
        client.query(
            "WITH ins1 AS (INSERT INTO company (company_name,  btc_public_address) VALUES ('"+
            req.query.merchantName+"','"+
            key.publicAddress+
            "') RETURNING company_id) INSERT INTO btc_key_pair (btc_public_address, btc_private_key, company_id) SELECT '"+
            key.publicAddress+"', '"+
            key.privateWif+
            "', ins1.company_id FROM ins1"
            )
            .then(resPG =>{          
                result.send({
                    success: true,    
                    merchantName:req.query.merchantName                                                           
                })

            })
            .catch(error => {
                console.log(error);
                result.send({
                    success: false,
                    error: error.detail                    
                })
            });
    }
);