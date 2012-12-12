var StompingGround = StompingGround || {};

(function(SG, S, $, L) {
  var collection, mapView, goodIcon, badIcon;

  // Icons
  badIcon = L.icon({
    iconUrl: '/static/img/markers/marker-e1264d.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: '/static/img/markers/marker-shadow.png',
    shadowSize: [41, 41]
  });

  goodIcon = L.icon({
    iconUrl: '/static/img/markers/marker-4bbd45.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: '/static/img/markers/marker-shadow.png',
    shadowSize: [41, 41]
  });

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
    placeTypes: {
      'good': {
        'default': goodIcon,
        'label': 'Good'
      },
      'bad': {
        'default': badIcon,
        'label': 'Bad'
      }
    }
  });

  // Fetch the existing places
  collection.fetch();

  // Begin marker control section //
  var controlMarkersConfig, controlMarkerGroup;

  // Marker control config
  controlMarkersConfig = [
    {
      origin: [25, 110],
      icon: goodIcon,
      placeType: 'good'
    },
    {
      origin: [25, 160],
      icon: badIcon,
      placeType: 'bad'
    }
  ];

  // Init the layer group for the control markers
  controlMarkerGroup = L.layerGroup();
  mapView.map.addLayer(controlMarkerGroup);

  // Init a new control marker
  function setControlMarker(placeType, origin, icon) {

    // Add it to its pixel coordinates
    ll = mapView.map.containerPointToLatLng(origin);
    var controlMarker = L.marker(ll, {
      draggable: true,
      icon: icon,
      origin: origin
    });
    controlMarkerGroup.addLayer(controlMarker);

    // Clone a new control marker when this one is dragged away
    controlMarker.on('dragstart', function(evt) {
      setControlMarker(placeType, origin, icon);
    });

    // When I'm done dragging, create a new model and remove this from the map
    controlMarker.on('dragend', function(evt) {
      var marker = this,
          ll = marker.getLatLng();

      collection.create({
        'location': {
          'lat': ll.lat,
          'lng': ll.lng
        },
        'location_type': placeType,
        'visible': true
      }, {
        wait: true,
        success: function() {
          controlMarkerGroup.removeLayer(marker);
        },
        error: function() {
          controlMarkerGroup.removeLayer(marker);
        }
      });
    });
  }

  // Always keep the control markers in the same spot on the map
  mapView.map.on('move', function(evt) {
    controlMarkerGroup.eachLayer(function(layer) {
      ll = mapView.map.containerPointToLatLng(layer.options.origin);
      layer.setLatLng(ll);
    });
  });

  // Init the control markers
  _.each(controlMarkersConfig, function(obj, i) {
    setControlMarker(obj.placeType, obj.origin, obj.icon);
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
