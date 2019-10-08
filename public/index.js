$(document).ready(function() {
    $('#hit').click(function() {
		//TODO Implémenter avec une assistance  de géoloc
        getAmountAndFee($('#term').val().toUpperCase())
    });
	$('#qr').click(function(){
		getQR($('#term').val().toUpperCase())
	});
    $('#position').click(getCoordinates);
});


function callAPI(url, callback) {
    var xhttp;
    xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            callback(this);
        }
    };
    xhttp.open("GET", url, true);
    xhttp.send();
}

//-------------Vérifier--------------------//

function getAmountAndFee(companyName){
	var amount = callAPI('http://paragonprod.cloudapp.net:9090/lastSuccessfulTransaction/?merchantName=' + companyName, getFee)
}

//function pour verifier
//ajouter code pour envoyer le taux, les frais, montant en CAD et BTC et heure à la base de données, "transaction confirmée!" "transaction déja confirmée"
//vérification dans backend que la dernière transaction en BTC = montant BTC envoyé si BTC envoyé par client = BTC sur la blockchain succès
//sinon échec, si première verif transaction réussie! si échec, montrer dernière transaction réussie

function getFee(xhttp){
	$('#lastConfirmedAmount').text(JSON.parse(xhttp.response).amount)
	$('#lastConfirmedFee').text(JSON.parse(xhttp.response).fee)
	$('#lastConfirmedAdress').text(JSON.parse(xhttp.response).lastClientAddress)
}

//-------------------Générer code QR------------------//

function openQR(xhttp){
	//fonction dans backend
	var responseJSON = JSON.parse(xhttp.response)
	var rate = responseJSON.rate
	var btcPrice = $('#amount').val()/rate
	$('#beforeTax').text($('#amount').val() + ' CAD')
	$('#tpstvq').text(Number(Math.round($('#amount').val()*0.15+'e2')+'e-2') + ' CAD')
	var afterTax = parseFloat($('#beforeTax').html()) + parseFloat($('#tpstvq').html())
	$('#afterTax').text(String(afterTax) + ' CAD' + '   /   ' + String((afterTax/rate).toFixed(10)) +' BTC')
	$("#qrCodeImage").attr("src",responseJSON.QRLink)
}

function getQR(companyName){
	callAPI('http://paragonprod.cloudapp.net:9090/getQRCode/?merchantName=' +companyName+'&CADPrice='+$('#amount').val(), openQR)		
}

//----------------------------------//



//---------------Obtenir la position---------------//

function getCoordinates() {
    window.navigator.geolocation.getCurrentPosition(

        function(position) {

            var lat = position.coords.latitude
            var lng = position.coords.longitude
            var d = 0.00025 // 20 mètres
            alert("Position trouvée : Latitude=" + lat + " Longitude=" + lng);
            //appel API au http://localhost:8000/listUsers avec lat et lng comme params
        },

        function(error) {
            console.log("Erreur de géoloc N°" + error.code + " : " + error.message);
            console.log(error);
        });
}

var rad = function(x) {
    return x * Math.PI / 180;
};

var getDistance = function(p1, p2) {
    var R = 6378137; // Earth’s mean radius in meter
    var dLat = rad(p2.lat() - p1.lat());
    var dLong = rad(p2.lng() - p1.lng());
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(rad(p1.lat())) * Math.cos(rad(p2.lat())) *
        Math.sin(dLong / 2) * Math.sin(dLong / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c;
    return d; // returns the distance in meter
};