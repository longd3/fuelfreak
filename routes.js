var request = require('request')
  , async = require('async')
  , csv = require('express-csv')
  , _ = require('underscore')
  , moment = require('moment')
  , nconf = require('nconf');

module.exports = function routes(app){

  console.log()

  app.get('/', function(req, res) {
    // req.session.access_token = "1007f4c05f571475bfb2cc44da00358e57b8a032"
    if(req.session && req.session.access_token) {
      res.render('app', {loggedIn: true});
    } else {
      res.render('index');
    }
  });

  app.get('/authorize/', function(req, res) {
      res.redirect(nconf.get('AUTOMATIC_AUTHORIZE_URL') + '?client_id=' + nconf.get('AUTOMATIC_CLIENT_ID') + '&response_type=code&scope=' + nconf.get('AUTOMATIC_SCOPES'))
  });

  app.get('/logout/', function(req, res) {
    req.session.destroy();
    res.redirect('/');
  });


  app.get('/api/trips/', authenticate, function(req, res) {
    request.get({
      uri: 'https://api.automatic.com/v1/trips',
      qs: { page: req.query.page },
      headers: {Authorization: 'token ' + req.session.access_token}
    }, function(e, r, body) {
      try {
        res.json(JSON.parse(body));
      } catch(e) {
        console.log("error: " + e);
        res.json(400, {"message": "Invalid access_token"});
      }
    });
  });


  app.get('/download/trips.json', authenticate, function(req, res) {
    try {
      downloadAllTrips(req, function(e, trips) {
        if(req.query.trip_ids) {
          var trip_ids = req.query.trip_ids.split(',');
          var trips = filterTrips(trips, trip_ids);
        }
        res.json(trips);
      });
    } catch(e) {
      res.json(500, undefined);
    }
  });


  app.get('/download/trips.csv', authenticate, function(req, res) {
    try {
      downloadAllTrips(req, function(e, trips) {
        if(req.query.trip_ids) {
          var trip_ids = req.query.trip_ids.split(',');
          var trips = filterTrips(trips, trip_ids);
        }
        var tripsAsArray = trips.map(tripToArray);
        tripsAsArray.unshift(fieldNames());

        res.csv(tripsAsArray);
      });
    } catch(e) {
      res.json(500, undefined);
    }
  });


  function downloadAllTrips(req, cb) {
    var finished = false
      , uri = 'https://api.automatic.com/v1/trips'
      , trips = [];
    async.until(function(){ return finished }, function(cb) {
      request.get({
        uri: uri,
        headers: {Authorization: 'token ' + req.session.access_token}
      }, function(e, r, body) {
        trips = trips.concat(JSON.parse(body));
        link_headers = parse_link_header(r.headers['link']);
        if(link_headers['next']) {
          uri = link_headers['next'];
        } else {
          finished = true;
        }
        cb();
      });
    }, function(e) {
      cb(e, trips);
    });
  }


  function filterTrips(trips, trip_ids) {
    return _.filter(trips, function(trip) {
      return trip_ids.indexOf(trip.id) != -1;
    });
  }


  function fieldNames() {
    return [
      'vehicle',
      'start location name',
      'start location lat',
      'start location lon',
      'start location accuracy (meters)',
      'start time',
      'end location name',
      'end location lat',
      'end location lon',
      'end location accuracy (meters)',
      'end time',
      'path',
      'distance (meters)',
      'hard accelerations',
      'hard_brakes',
      'duration over 80 mph (secs)',
      'duration over 75 mph (secs)',
      'duration over 70 mph (secs)',
      'fuel cost (USD)',
      'fuel volume (gal)',
      'average mpg'
    ]
  }


  function tripToArray(t) {
    return [
      formatVehicle(t.vehicle),
      t.start_location.name,
      t.start_location.lat,
      t.start_location.lon,
      t.start_location.accuracy_m,
      moment(t.start_time).format('YYYY-M-D h:mm A'),
      t.end_location.name,
      t.end_location.lat,
      t.end_location.lon,
      t.end_location.accuracy_m,
      moment(t.end_time).format('YYYY-M-D h:mm A'),
      t.path,
      t.distance_m,
      t.hard_accels,
      t.hard_brakes,
      t.duration_over_80_s,
      t.duration_over_75_s,
      t.duration_over_70_s,
      t.fuel_cost_usd,
      t.fuel_volume_gal,
      t.average_mpg
    ]
  }

  function formatVehicle(v) {
    return [(v.year || ''), (v.make || ''), (v.model || '')].join(' ');
  }


  app.get('/redirect/', function(req, res) {
    if(req.query.code) {
      request.post({
        uri: nconf.get('AUTOMATIC_AUTH_TOKEN_URL'),
        form: {
            client_id: nconf.get('AUTOMATIC_CLIENT_ID')
          , client_secret: nconf.get('AUTOMATIC_CLIENT_SECRET')
          , code: req.query.code
          , grant_type: 'authorization_code'
        }
      }, saveAuthToken)
    } else {
      res.json({error: 'No code provided'});
    }

    function saveAuthToken(e, r, body) {
      var access_token = JSON.parse(body || '{}')
      if (access_token.access_token) {
        req.session.access_token = access_token.access_token;
        req.session.scopes = access_token.scopes;
        res.redirect('/');
      } else {
        res.json({error: 'No access token'});
      }
    }
  });


  function authenticate(req, res, next) {
    if(!req.session || !req.session.access_token) {
      res.redirect('/');
    } else {
      next();
    }
  }

  /* From https://gist.github.com/niallo/3109252 */
  function parse_link_header(header) {
    var links = {};
    if (header) {
      var parts = header.split(',');
      parts.forEach(function(p) {
        var section = p.split(';');
        if (section.length != 2) {
          throw new Error("section could not be split on ';'");
        }
        var url = section[0].replace(/<(.*)>/, '$1').trim();
        var name = section[1].replace(/rel="(.*)"/, '$1').trim();
        links[name] = url;
      });
    }
    return links;
  }

}
