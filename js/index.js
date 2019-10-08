function getQR(amount, address){
    var amount = $('#amount').val()
    var address = '14STL8ZLJT7DeG5uQY7tJxYhwjebiz84en'
    GET('https://api.kraken.com/0/public/Ticker?pair='+'XBT'+'CAD', function(response){        
    result = JSON.parse(response.response)
        var cryptoAmount =  parseFloat((parseInt(amount) + feeFunction(amount))/parseInt(result.result['X'+'XBT'+'ZCAD'].b[0])).toFixed(6)
        var QR = "https://chart.googleapis.com/chart?chs=225x225&chld=L|2&cht=qr&chl=bitcoin:"+address+'?amount='+cryptoAmount
        $("#qrCodeImage").attr("src",QR)
    })
}

function GET(url, callback) {
    var xhttp;
    xhttp = new XMLHttpRequest();
    xhttp.open("GET", url, true);
    xhttp.setRequestHeader("Accept", "*/*")
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            callback(this);
        }
    };
    xhttp.send();
}

function feeFunction(amount){
    var fee = 0.02*(amount) + 2
    return fee
}


