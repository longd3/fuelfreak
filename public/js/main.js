var page = 1,
    end = moment(),
    fetching = false,
    cache = [],
    viewType = 'tile';

fetchTrips();

//infinite scroll
$(window).scroll(function() {
  if(page !== undefined && fetching === false && $(window).scrollTop() + $(window).height() > $(document).height() - 1000) {
    fetching = true;
    fetchTrips();
  }
});

$('.display-type').click(function() {
  showLoading();
  viewType = $(this).data('type');
  $(this).parent().addClass('active').siblings().removeClass('active')
  renderViewType();
  return false;
});

$('#selectall').change(function() {
  if($(this).is(':checked')) {
    selectAll();
  } else {
    selectNone();
  }
});

$('#trips').on('change', '.trip.table input[type="checkbox"]', function(){
  if($('.trip.table input[type="checkbox"]').length == $('.trip.table input[type="checkbox"]:checked').length) {
    selectAll();
  } else {
    selectSome();
  }
});

$('#csv, #json').click(function() {
  var href = '/download/trips.' + this.id;
  if(viewType == 'table') {
    var trip_ids = $('.trip.table input[type="checkbox"]:checked').map(function() { return $(this).parents('.trip').data('trip_id'); }).get();
    href += '?trip_ids=' + trip_ids.join(',');
  }
  $(this).attr('href', href);
});


function selectAll() {
  $('#trips .trip input[type="checkbox"]').each(function(idx, checkbox){ $(checkbox).prop('checked', true); })
  $('#selectall').prop('checked', true);
  $('#export span').text('Export All');
}

function selectSome() {
  $('#selectall').prop('checked', false);
  $('#export span').text('Export Selected');
}

function selectNone() {
  $('#selectall').prop('checked', false);
  $('#export span').text('Export Selected');
  $('#trips .trip input[type="checkbox"]').each(function(idx, checkbox){ $(checkbox).prop('checked', false); })
}


function fetchTrips() {
  showLoading();
  $.getJSON('/api/trips/', {page: page})
    .done(function(data) {
      hideLoading();
      if(data && data.length) {
        cache = cache.concat(data);
        data.map(addToPage);
        renderViewType();
        page += 1;
      } else {
        page = undefined;
        if(cache.length == 0) {
          showAlert('No trips found', 'warning');
        }
      }
      fetching = false;
    })
    .fail(function(jqhxr, textStatus, error) {
      showAlert('Unable to fetch trips (' +jqhxr.status + ' ' + error + ')', 'danger');
    });
}


function addToPage(trip) {
  // don't show very short trips
  if(trip.distance_m >= 100) {
    $('<div>')
      .addClass('trip')
      .data('trip_id', trip.id)
      .data('trip', trip)
      .appendTo('#trips');
  }
}


function renderViewType() {
  $('#trips').removeClass().addClass(viewType);
  if(viewType == 'tile') {
    $('#trips .trip').not('.tile').map(function(idx, div) { renderTile(div); });
    selectAll();
  } else if(viewType == 'table') {
    $('#trips .trip').not('.table').map(function(idx, div) { renderTable(div); });
  }
  hideLoading();
}


function renderTile(div) {
  var trip = $(div).data('trip');
  $(div)
    .removeClass('table')
    .addClass('tile')
    .empty()
    .append($('<div>')
      .addClass('times')
      .append($('<div>')
        .addClass('endTime')
        .html(moment(trip.end_time).format('h:mm A<br>M/D/YYYY')))
      .append($('<div>')
        .addClass('duration')
        .text(formatDuration(trip.end_time - trip.start_time)))
      .append($('<div>')
        .addClass('startTime')
        .html(moment(trip.start_time).format('h:mm A<br>M/D/YYYY')))
      .append($('<div>')
        .addClass('tripLine')
        .html('<div></div><div></div>')))
    .append($('<div>')
      .addClass('tripSummary')
      .append($('<div>')
        .addClass('endLocation')
        .text(formatLocation(trip.end_location.name)))
      .append($('<div>')
        .addClass('tripSummaryBox')
        .append($('<div>')
          .addClass('distance')
          .text(formatDistance(trip.distance_m)))
        .append($('<div>')
          .addClass('mpg')
          .text(formatMPG(trip.average_mpg)))
        .append($('<div>')
          .addClass('fuelCost')
          .text(formatFuelCost(trip.fuel_cost_usd)))
        .append($('<div>')
          .addClass('hardBrakes')
          .addClass(trip.hard_brakes > 0 ? 'someHardBrakes' : 'noHardBrakes')
          .html(trip.hard_brakes || '<i class="glyphicon glyphicon-ok"></i>'))
        .append($('<div>')
          .addClass('hardAccels')
          .addClass(trip.hard_accels > 0 ? 'someHardAccels' : 'noHardAccels')
          .html(trip.hard_accels || '<i class="glyphicon glyphicon-ok"></i>'))
        .append($('<div>')
          .addClass('durationOver70')
          .addClass(formatSpeeding(trip.duration_over_70_s) > 0 ? 'someSpeeding' : 'noSpeeding')
          .html(Math.ceil(trip.duration_over_70_s/60) || '<i class="glyphicon glyphicon-ok"></i>')))
      .append($('<div>')
        .addClass('startLocation')
        .text(formatLocation(trip.start_location.name))))
      .append($('<div>')
        .addClass('map')
        .attr('id', 'map' + trip.id));
  drawMap(trip);
}


function drawMap(trip) {
  var map = L.mapbox.map('map' + trip.id, 'brendannee.g9aijlep')

  if (trip.path) {
    var polyline = L.Polyline.fromEncoded(trip.path, {color: '#08b1d5', opacity: 0.9});

    map.fitBounds(polyline.getBounds());

    polyline.addTo(map);
  } else {
    map.fitBounds([[trip.start_location.lat, trip.start_location.lon], [trip.end_location.lat, trip.end_location.lon]]);
  }

  L.marker([trip.start_location.lat, trip.start_location.lon], {clickable: false, title: 'Start Location'}).addTo(map);
  L.marker([trip.end_location.lat, trip.end_location.lon]).addTo(map);
}


function renderTable(div) {
  var trip = $(div).data('trip');
  $(div)
    .removeClass('tile')
    .addClass('table')
    .empty()
    .append($('<div>')
      .addClass('select')
      .html('<input type="checkbox" checked>'))
    .append($('<div>')
      .addClass('startTime')
      .html(moment(trip.start_time).format('h:mm A M/D/YYYY')))
    .append($('<div>')
      .addClass('endTime')
      .html(moment(trip.end_time).format('h:mm A M/D/YYYY')))
    .append($('<div>')
      .addClass('duration')
      .text(formatDuration(trip.end_time - trip.start_time)))
    .append($('<div>')
      .addClass('startLocation')
      .text(formatLocation(trip.start_location.name)))
    .append($('<div>')
      .addClass('endLocation')
      .text(formatLocation(trip.end_location.name)))
    .append($('<div>')
        .addClass('distance')
        .text(formatDistance(trip.distance_m)))
    .append($('<div>')
      .addClass('mpg')
      .text(formatMPG(trip.average_mpg)))
    .append($('<div>')
      .addClass('fuelCost')
      .text('$' + formatFuelCost(trip.fuel_cost_usd)))
}


function showLoading() {
  $('.loading').fadeIn();
}


function hideLoading() {
  $('.loading').fadeOut();
}


function showAlert(msg, type) {
  var type = type || 'info';
  $('#alert').html(msg).removeClass().addClass('alert alert-' + type).fadeIn();
}


function hideAlert() {
  $('#alert').fadeOut();
}


function formatDistance(distance) {
  //convert from m to mi
  return (distance / 1609.34).toFixed(1);
}


function formatFuelCost(fuelCost) {
  return fuelCost.toFixed(2);
}


function formatLocation(location) {
  return (location) ? location.replace(/\d+, USA/gi, '') : '';
}


function formatMPG(average_mpg) {
  return average_mpg.toFixed(1);
}


function formatDuration(ms) {
  var mins = Math.floor(ms % (60 * 60 * 1000) / (60 * 1000));
  var hours = Math.floor(ms / (60 * 60 * 1000));
  return ((hours > 0) ? hours + 'h ' : '') + mins + ' min'
}


function formatSpeeding(sec) {
  return Math.floor(sec / 60);
}