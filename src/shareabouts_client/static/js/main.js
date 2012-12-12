var StompingGround = StompingGround || {};

(function(SG, S, $, L) {
  var collection, mapView, goodIcon, badIcon, placeTypes;

  // Icons
  badIcon = L.icon({
    iconUrl: '/static/img/marker-heart-broken.png',
    iconSize: [51, 46],
    iconAnchor: [25, 26],
    popupAnchor: [1, -26]
  });

  goodIcon = L.icon({
    iconUrl: '/static/img/marker-heart.png',
    iconSize: [51, 46],
    iconAnchor: [25, 26],
    popupAnchor: [1, -26]
  });

  placeTypes = {
    'good': {
      'default': goodIcon,
      'label': 'Good'
    },
    'bad': {
      'default': badIcon,
      'label': 'Bad'
    }
  };

  // Init the place collection
  collection = new S.PlaceCollection();

  // Setup the map view
  mapView = new S.MapView({
    el: '#map',
    mapConfig: {
      options: {
        center: [40.7873, -73.9753],
        zoom: 16
      },
      base_layer: new L.BingLayer('AvwpEJSPGtaU_s5ANOzYMZAesUO0Uit-5NydR60whL3KC0sFFCK-9Ay1jaFZ_s0P', {
        type: 'Road',
        maxZoom: 20
      })
    },
    collection: collection,
    router: null,
    placeTypes: placeTypes
  });

  // Fetch the existing places
  collection.fetch();

  // Begin marker control section //
  var controlMarkerGroup;


  // Init the layer group for the control markers
  controlMarkerGroup = L.layerGroup();
  mapView.map.addLayer(controlMarkerGroup);

  // Make the map a jQuery UI drop target
  $(mapView.map.getContainer()).droppable({
    drop: function(event, ui) {
      var icon = ui.draggable.data('icon'),
          placeType = ui.draggable.data('placeType'),
          $controlMarker = ui.helper,

      // Calculate the new marker position
          mapContainerOffset = $(mapView.map.getContainer()).offset(),
          controlMarkerOffset = $controlMarker.offset(),
          pos = {left: controlMarkerOffset.left - mapContainerOffset.left,
                 top: controlMarkerOffset.top - mapContainerOffset.top},
          ll = mapView.map.containerPointToLatLng([pos.left+icon.options.iconAnchor[0],
                                                   pos.top+icon.options.iconAnchor[1]]),

      // Add a temporary marker to the map until we get a response from
      // the API
          standInMarker = L.marker(ll, {
            icon: icon
          }).addTo(mapView.map);

      collection.create(
        {
          'location': {
            'lat': ll.lat,
            'lng': ll.lng
          },
          'location_type': placeType,
          'visible': true
        }, {
          wait: true,
          complete: function() {
            mapView.map.removeLayer(standInMarker);
          }
        });
    }
  });

  // Init a new control marker
  function setControlMarker(placeType, icon, $target) {
    // Append new element to the target
    var $controlMarker = $('<li class="control-marker-' + placeType + '">' +
                           '<img src="'+icon.options.iconUrl+'"></img></li>').appendTo($target);

    // Attach the icon data to the control marker
    $controlMarker.data('placeType', placeType);
    $controlMarker.data('icon', icon);

    // Make the control a jQuery UI draggable object
    $controlMarker.draggable({
      helper: 'clone'
    });

    // Prevent the mousedown event from being registered on the map.
    $controlMarker.on('mousedown', function(event) {
      event.stopPropagation();
    });
  }

  // Init the control marker container
  var $controlMarkerTarget =
    $('<ul id="control-markers"></ul>').appendTo(mapView.map.getContainer());

  // Init the control markers
  _.each(placeTypes, function(obj, key) {
    setControlMarker(key, obj['default'], $controlMarkerTarget);
  });

  function showZoomTooltip() {
    $('.leaflet-control-zoom')
      .tooltip({
        title: 'Move the map around to find the place you want to start. Use these buttons to move in and out.',
        trigger: 'manual',
        placement: 'right'
      })
      .tooltip('show');
  };

  function hideZoomTooltip() {
    $('.leaflet-control-zoom').tooltip('hide');
    mapView.map.off('zoomend', hideZoomTooltip);
  };

  showZoomTooltip();
  mapView.map.on('zoomend', hideZoomTooltip);

  mapView.map.on('contextmenu', function(evt) {
    L.DomEvent.preventDefault(evt);

    var ll = evt.latlng;
    var marker = L.marker(ll, {
      draggable: true,
      icon: goodIcon,
      origin: [5, 5]
    });

    mapView.map.addLayer(marker);
    marker.fire('movestart').fire('dragstart');
  });

})(StompingGround, Shareabouts, jQuery, L);
