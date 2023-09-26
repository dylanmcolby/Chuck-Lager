$(document).ready(function () {
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(function (position) {
            var lat = position.coords.latitude;
            var lng = position.coords.longitude;
            var tempDiv = $("<div>");
            tempDiv.load("/locations #addresses", function () {
                var addresses = [];
                tempDiv.find('.geo-address').each(function () {
                    addresses.push($(this).text());
                });
                var closestAddress = "";
                var shortestDistance = Number.MAX_VALUE;
                addresses.forEach(function (address) {
                    var geocoder = new google.maps.Geocoder();
                    geocoder.geocode({ 'address': address }, function (results, status) {
                        if (status === 'OK') {
                            var addrLat = results[0].geometry.location.lat();
                            var addrLng = results[0].geometry.location.lng();
                            var distance = Math.sqrt(Math.pow(addrLat - lat, 2) + Math.pow(addrLng - lng, 2));

                            if (distance < shortestDistance) {
                                shortestDistance = distance;
                                closestAddress = address;
                            }
                        }
                    });
                });
                setTimeout(function () {
                    alert("The closest address is: " + closestAddress);
                }, 500); 
            });
        });
    }

});