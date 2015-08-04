/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
var map;
var currentLocation;
var currentLocationMarker = null;
var accuracyCircle = null;
var destination;
var watchID = null;
var markers = [];

var app = {
    // Application Constructor
    initialize: function() {
        this.bindEvents();
        setupMap();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicitly call 'app.receivedEvent(...);'
    onDeviceReady: function() {
        console.log('Device ready');
        watchID = navigator.geolocation.watchPosition(onLocationSuccess, onLocationError, {timeout: 5000});
    }

};

function setupMap() {
    var bburg = new google.maps.LatLng(37.230618, -80.415357);
    var mapOptions = {
        zoom: 11,
        center: bburg,
        zoomControl: false,
        streetViewControl: false
    };
    map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
    // NOTE: The url provided to the kml MUST be publicly accessible
    var safeStreetOverlay = new google.maps.KmlLayer({
        url: "https://github.com/ghthor/safe_walk_blacksburg/raw/master/www/safewalk.kml",
    });
    safeStreetOverlay.setMap(map);

    var locationIcon = {
        url: 'img/location.png',
        size: new google.maps.Size(15, 15),
        anchor: new google.maps.Point(7,7)
    };
    currentLocation = new google.maps.Marker({
        position: bburg,
        map: map,
        title: 'Your location',
        icon: locationIcon
    });
    // Create the search box and link it to the UI element.
    var input = /** @type {HTMLInputElement} */(
        document.getElementById('pac-input'));
    map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);

    var searchBox = new google.maps.places.SearchBox(
        /** @type {HTMLInputElement} */(input));

    google.maps.event.addListener(searchBox, 'places_changed', function() {
        var places = searchBox.getPlaces();
        if (places.length == 0) {
            return;
        }
        for (var i = 0, marker; marker = markers[i]; i++) {
            marker.setMap(null);
        }

        // For each place, get the icon, place name, and location.
        markers = [];
        var bounds = new google.maps.LatLngBounds();
        for (var i = 0, place; place = places[i]; i++) {
            console.log('Adding place: ' + place.name);
            var image = {
                url: 'http://maps.gstatic.com/mapfiles/place_api/icons/geocode-71.png', //place.icon,
                size: new google.maps.Size(71, 71),
                origin: new google.maps.Point(0, 0),
                anchor: new google.maps.Point(17, 34),
                scaledSize: new google.maps.Size(50, 50)
            };

            // Create a marker for each place.
            var marker = new google.maps.Marker({
                map: map,
                //icon: image,
                title: place.name,
                position: place.geometry.location
            });

            markers.push(marker);

            bounds.extend(place.geometry.location);
        }

        map.fitBounds(bounds);
    });

    // Bias the SearchBox results towards places that are within the bounds of the
    // current map's viewport.
    google.maps.event.addListener(map, 'bounds_changed', function() {
        var bounds = map.getBounds();
        searchBox.setBounds(bounds);
    });

    //Hide and unhide the menus and search box when the map is tapped
    document.getElementById('search-btn').addEventListener('click', toggleDisplay, false);
    //Go to current location
    document.getElementById('locate-btn').addEventListener('click', locateMe, false);

}

function toggleDisplay(event) {
    var searchBox = document.getElementById('pac-input');
    if (searchBox.style.display == 'none') {
        searchBox.style.display = 'block';
    } else {
        searchBox.style.display = 'none';
    }
}

function locateMe(event) {
    map.setZoom(17);
    map.panTo(currentLocation.position);
}

function onLocationSuccess(position) {
    var centerPosition = new google.maps.LatLng(position.coords.latitude, position.coords.longitude)
    //console.log('Lat: ' + position.coords.latitude + ', Lng: ' + position.coords.longitude);
    currentLocation.setPosition(centerPosition);
    if (accuracyCircle === null) {
        accuracyCircle = new google.maps.Circle({
            center: centerPosition,
            radius: position.coords.accuracy,
            map: map,
            fillColor: 'blue',
            fillOpacity: 0.05,
            strokeColor: 'blue',
            strokeOpacity: 0.1
        });
        currentLocationMarker = new google.maps.Marker({
            position: centerPosition,
            icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 4,
                strokeColor: 'white',
                strokeWeight: 1,
                fillColor: 'blue',
                fillOpacity: 0.8
            },
            map: map
        })
    } else {
        accuracyCircle.setCenter(centerPosition);
        accuracyCircle.setRadius(position.coords.accuracy);
        currentLocationMarker.setPosition(centerPosition);
    }
}

function onLocationError(error) {
    alert('code: ' + error.code + '\n message: ' + error.message + '\n');
}