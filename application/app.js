"use strict";


let step = 0.001;
let current_lng = 0;
let current_lat = 0;
let current_alt = 0;
let accuracy = 0;
let altitude = 0;


let zoom_level = 18;
let current_zoom_level = 18;
let new_lat = 0;
let new_lng = 0;
let curPos = 0;
let myMarker = "";
let i = 0;
let windowOpen = "map";
let message_body = "";
let openweather_api = "";
let tabIndex = 0;
let debug = "true";

let tilesLayer;
let tileLayer;
let myLayer;
let tilesUrl;
let state_geoloc = "not-activ";
let savesearch = false;

let search_current_lng;
let search_current_lat;

let current_heading;

let map;






$(document).ready(function() {



    $.getScript("assets/js/helper.js")




    navigator.mozSetMessageHandler('activity', function(activityRequest) {
        var option = activityRequest.source;

        if (option.name == 'open') {
            loadGPX(option.data.url)
        }

    })

    /////////////////////////
    /////Load GPX///////////
    ///////////////////////
    function loadGPX(filename) {
        let finder = new Applait.Finder({ type: "sdcard", debugMode: false });
        finder.search(filename);


        finder.on("fileFound", function(file, fileinfo, storageName) {
            //file reader

            let reader = new FileReader();

            reader.onerror = function(event) {
                toaster("can't read file", 3000)
                reader.abort();
            };

            reader.onloadend = function(event) {

                var gpx = event.target.result; // URL to your GPX file or the GPX itself

                new L.GPX(gpx, { async: true }).on('loaded', function(e) {
                    map.fitBounds(e.target.getBounds());
                }).addTo(map)

                map.setZoom(8);
                $('div#finder').css('display', 'none');
                windowOpen = "map";



            };


            reader.readAsText(file)

        })
    }



    //remove leaflet attribution to have more space
    $('.leaflet-control-attribution').hide();

    //welcome message
    $('div#message div').text("Welcome");
    setTimeout(function() {
        $('div#message').css("display", "none")
        getLocation("init");
        ///set default map
        opentopo_map();
        windowOpen = "map";

    }, 4000);


    //leaflet add basic map
    map = L.map('map-container', {
        zoomControl: false,
        dragging: false,
        keyboard: true
    }).fitWorld();

    L.control.scale({ position: 'topright', metric: true, imperial: false }).addTo(map);

    ////////////////////
    ////RULER///////////
    ///////////////////
    var ruler_activ = "";

    function ruler() {

        if (ruler_activ == "") {
            L.control.ruler().addTo(map);

        }

        if (ruler_activ === true) {
            $("div.leaflet-ruler").remove();

            ruler_activ = false
            navigator.spatialNavigationEnabled = false;
            L.control.ruler().remove();
            $("div.leaflet-ruler").removeClass("leaflet-ruler-clicked")

            return false;
        } else {
            L.control.ruler().remove();

            navigator.spatialNavigationEnabled = true;

            ruler_activ = true
            $("div.leaflet-ruler").addClass("leaflet-ruler-clicked")
            return false;
        }


    }
    ////////////////////
    ////MAPS////////////
    ///////////////////

    function toner_map() {
        tilesUrl = 'https://stamen-tiles.a.ssl.fastly.net/toner/{z}/{x}/{y}.png'
        tilesLayer = L.tileLayer(tilesUrl, {
            maxZoom: 18,
            attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
                '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>'
        });

        map.addLayer(tilesLayer);

    }

    function opentopo_map() {
        tilesUrl = 'https://tile.opentopomap.org/{z}/{x}/{y}.png'
        tilesLayer = L.tileLayer(tilesUrl, {
            maxZoom: 18,
            attribution: 'Map data &copy;<div> © OpenStreetMap-Mitwirkende, SRTM | Kartendarstellung: © OpenTopoMap (CC-BY-SA)</div>'
        });

        map.addLayer(tilesLayer);

        setTimeout(function() {
            $('.leaflet-control-attribution').hide()
        }, 4000);

    }


    function owm_map() {

        tilesUrl = 'https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=' + openweather_api;
        tilesLayer = L.tileLayer(tilesUrl, {
            maxZoom: 18,
            attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
                '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>'
        });

        map.addLayer(tilesLayer);
    }



    function osm_map() {
        tilesUrl = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
        tilesLayer = L.tileLayer(tilesUrl, {
            maxZoom: 18,
            attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
                '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>'
        });

        map.addLayer(tilesLayer);

    }








    /////////////////////////
    //get Openweather Api Key
    /////////////////////////
    function read_json(option) {

        $("div#tracks").empty();
        $("div#maps").empty();
        $("div#layers").empty();
        $("div#markers").empty();


        let finder = new Applait.Finder({ type: "sdcard", debugMode: false });
        finder.search("osm-map.json");


        finder.on("empty", function(needle) {
            toaster("no sdcard found");
            return;
        });

        finder.on("searchComplete", function(needle, filematchcount) {


            if (filematchcount == 0) {
                toaster("no osm-map.json found", 2000);
                return;
            }
        })

        finder.on("fileFound", function(file, fileinfo, storageName) {


            $("div#maps").append('<div class="items" data-map="toner">Toner <i>Map</i></div>');
            $("div#maps").append('<div class="items" data-map="osm">OSM <i>Map</i></div>');
            $("div#maps").append('<div class="items" data-map="otm">OpenTopo <i>Map</i></div>');

            let markers_file = "";
            let reader = new FileReader()


            reader.onerror = function(event) {
                alert('shit happens')
                reader.abort();
            };

            reader.onloadend = function(event) {



                let data;
                //check if json valid
                try {
                    data = JSON.parse(event.target.result);
                } catch (e) {
                    toaster("Json is not valid", 2000)
                    return false;
                }



                //add markers and openweatermap
                $.each(data, function(index, value) {

                    if (value.markers) {
                        $.each(value.markers, function(index, item) {
                            $("div#markers").append('<div class="items" data-map="marker" data-lat="' + item.lat + '" data-lng="' + item.lng + '">' + item.marker_name + '</div>');
                        })
                    }

                    if (value.api_key) {
                        openweather_api = value.api_key;
                        $("div#maps").append('<div class="items" data-map="owm">Open Weather <i>Map</i></div>');

                    }


                })



                if (option == "finder") {

                    windowOpen = "finder";

                    //search geojson
                    let finder = new Applait.Finder({ type: "sdcard", debugMode: false });
                    finder.search(".geojson");

                    finder.on("searchComplete", function(needle, filematchcount) {


                        //set tabindex
                        $('div.items').each(function(index, value) {
                            let $div = $(this)
                            $div.attr("tabindex", index);
                        });


                        $('div#finder').css('display', 'block');
                        $('div#finder').find('div.items[tabindex=0]').focus();
                        tabIndex = 0;

                    });


                    finder.on("fileFound", function(file, fileinfo, storageName) {
                        $("div#tracks").append('<div class="items" data-map="geojson">' + fileinfo.name + '</div>');
                    });


                    //search gpx
                    let finder_gpx = new Applait.Finder({ type: "sdcard", debugMode: false });

                    finder_gpx.search(".gpx");

                    finder_gpx.on("searchComplete", function(needle, filematchcount) {


                        //set tabindex
                        $('div.items').each(function(index, value) {
                            let $div = $(this)
                            $div.attr("tabindex", index);
                        });


                        $('div#finder').css('display', 'block');
                        $('div#finder').find('div.items[tabindex=0]').focus();
                        tabIndex = 0;

                    });


                    finder_gpx.on("fileFound", function(file, fileinfo, storageName) {
                        $("div#tracks").append('<div class="items" data-map="gpx">' + fileinfo.name + '</div>');
                    });

                }

            };
            reader.readAsText(file)
        });
    }
    read_json()








    ////////////////////
    ////GEOLOCATION/////
    ///////////////////
    //////////////////////////
    ////MARKER SET AND UPDATE/////////
    /////////////////////////

    //set filename by user imput
    function saveMarker() {
        user_imput("open", moment().format("DD.MM.YYYY, HH:MM"));
    }

    let filename;

    //options
    //save_search_marker
    //save_marker
    //delete_marker
    //share
    //init
    //update_marker

    function getLocation(option) {

        if (option == "init" || option == "update_marker" || option == "share") {
            toaster("seeking position", 3000);
        }

        let options = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        };

        function success(pos) {
            let crd = pos.coords;
            current_lat = crd.latitude;
            current_lng = crd.longitude;
            current_alt = crd.altitude;
            current_heading = crd.heading;



            if (option == "save_marker" || option == "delete_marker" || option == "save_search_marker") {


                let sdcard = navigator.getDeviceStorages("sdcard");
                let request = sdcard[1].get("osm-map/osm-map.json");


                request.onsuccess = function() {

                    let fileget = this.result;
                    let reader = new FileReader();

                    reader.addEventListener("loadend", function(event) {


                        let data;
                        //check if json valid
                        try {
                            data = JSON.parse(event.target.result);
                        } catch (e) {
                            toaster("Json is not valid", 3000)
                            return false;
                        }

                        if (option == "save_marker") {
                            data[0].markers.push({ "marker_name": filename, "lat": current_lat, "lng": current_lng });
                            save();
                        }

                        if (option == "save_search_marker") {
                            data[0].markers.push({ "marker_name": filename, "lat": search_current_lat, "lng": search_current_lng });
                            save();
                            savesearch = false;
                        }

                        if (option == "delete_marker") {
                            var markers = [];

                            $.each(data[0].markers, function(index, value) {
                                if (value.marker_name != $(document.activeElement).text()) {
                                    markers.push(value);
                                }

                            })
                            data[0].markers = markers;

                            save();

                        }

                        function save() {
                            windowOpen = "save"
                            let extData = JSON.stringify(data);
                            deleteFile(1, "osm-map/osm-map.json", "")

                            setTimeout(function() {

                                let file = new Blob([extData], { type: "application/json" });
                                let requestAdd = sdcard[1].addNamed(file, "osm-map/osm-map.json");

                                requestAdd.onsuccess = function() {
                                    if (option == "delete_marker") {
                                        toaster('Marker deleted', 2000);
                                        document.activeElement.style.display = "none";
                                        //set tabindex
                                        $('div.items').each(function(index, value) {
                                            let $div = $(this)
                                            $div.attr("tabindex", index);
                                        });
                                        $('div#finder').find('div.items[tabindex=0]').focus();
                                        tabIndex = 0;

                                    }
                                    if (option == "save_marker") {
                                        toaster('Marker saved', 2000);
                                        L.marker([current_lat, current_lng]).addTo(map);
                                        map.setView([current_lat, current_lng], 13);

                                        $('div#finder').css('display', 'none');
                                        windowOpen = "map";
                                    }
                                    if (option == "save_search_marker") {
                                        toaster('search saved', 2000);
                                        map.setView([search_current_lat, search_current_lng], 13);

                                        windowOpen = "map";
                                    }


                                }

                                requestAdd.onerror = function() {
                                    toaster('Unable to write the file: ' + this.error, 2000);
                                }


                            }, 2000);
                        }




                    })
                    reader.readAsText(fileget);
                }
            }


            if (option == "share") {
                share_position()

            }

            if (option == "init") {

                myMarker = L.marker([current_lat, current_lng]).addTo(map);
                map.setView([current_lat, current_lng], 13);
                zoom_speed();
                $('div#message div').text("");

                $('div#coordinations div#lat').text("Lat " + current_lat.toFixed(5));
                $('div#coordinations div#lng').text("Lng " + current_lng.toFixed(5));
                $('div#coordinations div#altitude').text("alt " + altitude.toFixed(5));
                return false;
            }

            if (option == "update_marker") {

                myMarker.setLatLng([current_lat, current_lng]).update();
                map.flyTo(new L.LatLng(current_lat, current_lng), 16);
                zoom_speed()

                $('div#coordinations div#lat').text("Lat " + current_lat.toFixed(5));
                $('div#coordinations div#lng').text("Lng " + current_lng.toFixed(5));
                $('div#coordinations div#altitude').text("alt " + current_alt);
                $('div#coordinations div#heading').text("heading " + current_heading);

            }

        }


        function error(err) {
            toaster("Position not found", 2000);
        }


        navigator.geolocation.getCurrentPosition(success, error, options);

    }


    function geolocationWatch() {
        let watchID;
        let geoLoc = navigator.geolocation;
        let state;


        if (state_geoloc == "not-activ") {

            function showLocation(position) {
                let crd = position.coords;

                current_lat = crd.latitude;
                current_lng = crd.longitude;
                current_alt = crd.altitude;
                current_heading = crd.heading;


                map.flyTo(new L.LatLng(position.coords.latitude, position.coords.longitude));
                myMarker.setLatLng([current_lat, current_lng]).update();

                $('div#coordinations div#lat').text("Lat " + current_lat.toFixed(5));
                $('div#coordinations div#lng').text("Lng " + current_lng.toFixed(5));
                $('div#coordinations div#altitude').text("alt " + current_alt);
                $('div#coordinations div#heading').text("heading " + current_heading);


                state_geoloc = "activ";


            }

            function errorHandler(err) {
                if (err.code == 1) {
                    toaster("Error: Access is denied!", 2000);
                } else if (err.code == 2) {
                    toaster("Error: Position is unavailable!", 2000);
                }
            }


            if (navigator.geolocation) {

                let options = { timeout: 60000 };
                watchID = geoLoc.watchPosition(showLocation, errorHandler, options);
                toaster("watching postion started", 2000);
            } else {
                toaster("Sorry, browser does not support geolocation!", 2000);
            }
        }



        if (state_geoloc == "activ") {
            geoLoc.clearWatch(watchID);
            state_geoloc = "not-activ";
            toaster("watching postion stopped", 2000);

        }

    }



    /////////////////////////
    /////MENU///////////////
    ////////////////////////

    function addMapLayers(param) {
        if ($(".items").is(":focus") && windowOpen == "finder") {

            //switch online maps
            let item_value = $(document.activeElement).data('map');



            if (item_value == "toner") {
                map.removeLayer(tilesLayer);
                toner_map();
                $('div#finder').css('display', 'none');
                windowOpen = "map";
            }


            if (item_value == "osm") {
                map.removeLayer(tilesLayer);
                osm_map();
                $('div#finder').css('display', 'none');
                windowOpen = "map";
            }


            if (item_value == "otm") {
                map.removeLayer(tilesLayer);
                opentopo_map();
                $('div#finder').css('display', 'none');
                windowOpen = "map";
            }

            if (item_value == "owm") {
                map.removeLayer(tilesLayer);
                osm_map();
                owm_map();
                $('div#finder').css('display', 'none');
                //$("div#output").css("display", "block")
                windowOpen = "map";
            }

            if (item_value == "share") {
                osm_map();
                getLocation("share")

            }



            if (item_value == "autoupdate-geolocation") {
                windowOpen = "map";
                $('div#finder').css('display', 'none');
                geolocationWatch();
            }




            if (item_value == "update-position") {

                getLocation("update_marker")
            }


            if (item_value == "search") {
                windowOpen = "map";
                $('div#finder').css('display', 'none');
                showSearch();
            }

            if (item_value == "coordinations") {

                coordinations("show")
            }

            if (item_value == "savelocation") {

                saveMarker();

            }
            let marker_count = -1;
            let marker_array = [];
            if (item_value == "marker") {
                if (param == "add-marker") {

                    marker_count++
                    let marker_lng = $(document.activeElement).data('lng');
                    let marker_lat = $(document.activeElement).data('lat');


                    var new_marker = L.marker([marker_lat, marker_lng]).addTo(map);
                    map.setView([marker_lat, marker_lng], 13);
                    $('div#finder').css('display', 'none');
                    var distance = getDistance([marker_lat, marker_lng], [current_lat, current_lng])
                    distance = distance.toFixed(0) / 1000 + " km";

                    new_marker.bindTooltip(distance).openTooltip();


                    //update tooltip
                    //store lat lng in array
                    marker_array.push([marker_lat, marker_lng])

                    setInterval(() => {

                        marker_array.forEach(marker => {
                            var distance = getDistance([marker[0], marker[1]], [current_lat, current_lng])
                            distance = distance.toFixed(0) / 1000 + " km";
                            new_marker.bindTooltip(distance).update();

                        });


                    }, 10000);

                    windowOpen = "map";



                }

                if (param == "delete-marker") {
                    getLocation("delete_marker")
                }

            }



            //add geoJson data
            if (item_value == "geojson") {
                let finder = new Applait.Finder({ type: "sdcard", debugMode: false });
                finder.search($(document.activeElement).text());


                finder.on("fileFound", function(file, fileinfo, storageName) {
                    //file reader

                    let geojson_data = "";
                    let reader = new FileReader();

                    reader.onerror = function(event) {
                        alert('shit happens')
                        reader.abort();
                    };

                    reader.onloadend = function(event) {

                        if (myLayer) {
                            L.removeLayer(myLayer)
                        }

                        //check if json valid
                        try {
                            geojson_data = JSON.parse(event.target.result);
                        } catch (e) {
                            toaster("Json is not valid", 2000)
                            return false;
                        }

                        //if valid add layer
                        $('div#finder div#question').css('opacity', '1');
                        myLayer = L.geoJSON().addTo(map);
                        myLayer.addData(geojson_data);
                        map.setZoom(8);
                        windowOpen = "finder";

                    };


                    reader.readAsText(file)

                });
            }

            //add gpx data
            if (item_value == "gpx") {
                loadGPX($(document.activeElement).text())
            }


        }

    }


    ////////////////////////////////////////
    ////COORDINATIONS PANEL/////////////////
    ///////////////////////////////////////

    function coordinations(param) {
        if (param == "show") {
            $("div#coordinations").css("display", "block");
            $("div#finder").css("display", "none");
            windowOpen = "coordinations";

        }

        if (param == "hide") {
            $("div#coordinations").css("display", "none");
            windowOpen = "map";
        }
    }


    //////////////////////////
    ////SEARCH BOX////////////
    /////////////////////////



    function showSearch() {

        bottom_bar("close", "select", "")

        $('div#search-box').css('display', 'block');
        $('div#search-box').find("input").focus();
        $("div#bottom-bar").css("display", "block")

        windowOpen = "search";

    }


    function hideSearch() {
        $("div#bottom-bar").css("display", "none")
        $('div#search-box').css('display', 'none');
        $('div#search-box').find("input").val("");
        $('div#search-box').find("input").blur();
        windowOpen = "map";
    }

    /////////////////////
    ////ZOOM MAP/////////
    ////////////////////


    function ZoomMap(in_out) {

        let current_zoom_level = map.getZoom();
        if (windowOpen == "map" && $('div#search-box').css('display') == 'none') {
            if (in_out == "in") {

                if (current_zoom_level < 5) {
                    current_zoom_level = current_zoom_level + 1
                    map.setZoom(current_zoom_level);
                }


                if (windowOpen == "otm" && current_zoom_level < 16) {
                    current_zoom_level = current_zoom_level + 1
                    map.setZoom(current_zoom_level);
                }

                if (windowOpen == "map") {
                    current_zoom_level = current_zoom_level + 1
                    map.setZoom(current_zoom_level);
                }



            }

            if (in_out == "out") {
                current_zoom_level = current_zoom_level - 1
                map.setZoom(current_zoom_level);
            }

            zoom_level = current_zoom_level;
            zoom_speed();

        }

    }




    function zoom_speed() {
        if (zoom_level < 6) {
            step = 1;
        }


        if (zoom_level > 6) {
            step = 0.1;
        }


        if (zoom_level > 11) {
            step = 0.001;
        }

        return step;
    }


    function unload_map(trueFalse) {
        if ($("div#finder").css('display') == 'block') {

            if (trueFalse === true) {
                map.removeLayer(tilesLayer);
                $('div#finder').css('display', 'none');
                $('div#finder div#question').css('opacity', '0');
                windowOpen = "map";
            }

            if (trueFalse === false) {
                $('div#finder').css('display', 'none');
                $('div#finder div#question').css('opacity', '0');
                windowOpen = "map";
            }
        }
    }


    /////////////////////
    //MAP NAVIGATION//
    /////////////////////


    function MovemMap(direction) {
        if (windowOpen == "map") {
            if (direction == "left") {
                zoom_speed()

                current_lng = current_lng - step;
                map.panTo(new L.LatLng(current_lat, current_lng));
            }

            if (direction == "right") {
                zoom_speed()

                current_lng = current_lng + step;
                map.panTo(new L.LatLng(current_lat, current_lng));
            }

            if (direction == "up") {
                zoom_speed()

                current_lat = current_lat + step;
                map.panTo(new L.LatLng(current_lat, current_lng));

            }

            if (direction == "down") {
                zoom_speed()

                current_lat = current_lat - step;
                map.panTo(new L.LatLng(current_lat, current_lng));

            }
        }

    }

    //////////////////////
    //FINDER NAVIGATION//
    /////////////////////

    function nav(move) {
        if (windowOpen == "finder") {



            let items = document.querySelectorAll('.items');
            if (move == "+1") {
                if (tabIndex < items.length - 1) {

                    tabIndex++
                    $('div#finder div.items[tabindex=' + tabIndex + ']').focus()

                    $('html, body').animate({
                        scrollTop: $(':focus').offset().top + 'px'
                    }, 'fast');

                }
            }


            if (move == "-1") {
                if (tabIndex > 0)

                {
                    tabIndex--
                    $('div#finder div.items[tabindex=' + tabIndex + ']').focus()

                    $('html, body').animate({
                        scrollTop: $(':focus').offset().top + 'px'
                    }, 'fast');

                }
            }
        }

    }




    //////////////////////////////
    ////KEYPAD HANDLER////////////
    //////////////////////////////



    let longpress = false;
    const longpress_timespan = 1000;
    let timeout;

    function repeat_action(param) {
        switch (param.key) {
            case 'ArrowUp':
                MovemMap("up")
                break;

            case 'ArrowDown':
                MovemMap("down")
                break;

            case 'ArrowLeft':
                MovemMap("left")
                break;

            case 'ArrowRight':
                MovemMap("right")
                break;

            case 'Enter':
                break;
        }
    }

    //////////////
    ////LONGPRESS
    /////////////


    function longpress_action(param) {
        switch (param.key) {


            case 'Enter':
                if (windowOpen == "finder") {
                    addMapLayers("delete-marker");
                }
                break;
        }
    }


    ///////////////
    ////SHORTPRESS
    //////////////

    function shortpress_action(param) {
        switch (param.key) {
            case 'Backspace':
                param.preventDefault();


                if (windowOpen == "finder") {
                    $('div#finder').css('display', 'none');
                    windowOpen = "map";
                    return false

                }

                if (windowOpen == "coordinations") {
                    coordinations("hide");
                    return false;
                }
                if (windowOpen == "map") {
                    toaster("Goodbye", 2000);
                    setTimeout(function() {
                        window.close();
                    }, 4000);

                }

                break;

            case 'SoftLeft':


                if (windowOpen == "search") {

                    hideSearch();
                    return false;
                }

                if (windowOpen == "finder") {

                    unload_map(false);
                    return false;

                }



                if (windowOpen == "map") {
                    ZoomMap("in");
                    return false;

                }


                if (windowOpen == "user-input") {
                    user_imput("close")
                    return false;
                }
                break;

            case 'SoftRight':
                if (windowOpen == "finder") {

                    unload_map(true);
                }

                if (windowOpen == "map") {
                    ZoomMap("out");

                }
                if (windowOpen == "user-input") {
                    filename = user_imput("return")
                    if (savesearch === true) {
                        getLocation("save_search_marker")

                    } else {
                        getLocation("save_marker")

                    }

                }
                break;

            case 'Enter':

                addMapLayers("add-marker");

                break;

            case '1':
                getLocation("update_marker")
                break;

            case '2':
                param.preventDefault()
                showSearch();
                break;

            case '3':
                param.preventDefault()
                read_json("finder")
                break;

            case '4':
                geolocationWatch();
                screenWakeLock("lock")

                break;

            case '5':
                saveMarker()
                break;

            case '6':
                coordinations("show");
                break;

            case '7':
                ruler();
                break;


            case 'ArrowRight':
                MovemMap("right")
                break;

            case 'ArrowLeft':
                MovemMap("left")
                break;

            case 'ArrowUp':
                MovemMap("up")
                nav("-1");
                break;

            case 'ArrowDown':
                MovemMap("down")
                nav("+1")
                break;
        }
    }

    /////////////////////////////////
    ////shortpress / longpress logic
    ////////////////////////////////

    function handleKeyDown(evt) {
        if (!evt.repeat) {
            evt.preventDefault();
            longpress = false;
            timeout = setTimeout(() => {
                longpress = true;
                longpress_action(evt);
            }, longpress_timespan);
        }

        if (evt.repeat) {
            longpress = false;
            repeat_action(evt);
        }
    }

    function handleKeyUp(evt) {
        evt.preventDefault();
        clearTimeout(timeout);
        if (!longpress) {
            shortpress_action(evt);
        }
    }






    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    //////////////////////////
    ////BUG OUTPUT////////////
    /////////////////////////
    if (debug) {

        $(window).on("error", function(evt) {

            console.log("jQuery error event:", evt);
            var e = evt.originalEvent; // get the javascript event
            console.log("original event:", e);
            if (e.message) {
                alert("Error:\n\t" + e.message + "\nLine:\n\t" + e.lineno + "\nFile:\n\t" + e.filename);
            } else {
                alert("Error:\n\t" + e.type + "\nElement:\n\t" + (e.srcElement || e.target));
            }
        });
    }

});