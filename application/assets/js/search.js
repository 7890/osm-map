"use strict";


$(document).ready(function() {



    var ac_selected_station = $('#search').autocomplete({
        serviceUrl: "https://nominatim.openstreetmap.org/search?format=json&addressdetails=0",
        minChars: 2,
        showNoSuggestionNotice: true,
        paramName: 'q',
        lookupLimit: 10,
        deferRequestBy: 2000,
        transformResult: function(response) {
            console.log(response);
            var obj = $.parseJSON(response);
            return {
                suggestions: $.map(obj, function(dataItem) {
                    return { value: dataItem.display_name, data_lat: dataItem.lat, data_lon: dataItem.lon };

                })
            }


        },
        onSearchStart: function() {},
        onSearchError: function(query, jqXHR, textStatus, errorThrown) {
            toaster(JSON.stringify(jqXHR), 2000)
        },
        onSelect: function(suggestion) {

            let lat_lon = [suggestion.data_lat, suggestion.data_lon];
            addMarker(lat_lon[0], lat_lon[1])
        }



    })




    //add marker
    function addMarker(lat, lng) {
        toaster("press 5 to save the marker", 2000)
        L.marker([lat, lng]).addTo(map);
        map.setView([lat, lng], 13);
        hideSearch()

        current_lat = lat;
        current_lng = lng;

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



})