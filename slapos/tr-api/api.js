#!/usr/bin/node

var sys = require('util');
var fs = require('fs');
var restify = require('restify');
var exec = require('child_process').exec;

var argv = require('optimist').argv;

var port = argv.port || 8080;
var user = argv.user;
var pwd = argv.pwd;
var base = argv.base;
var masterip = argv.masterip;

console.log("base url is: "+base);

if (!user || !pwd) {
  console.error('Login information missing');
  process.exit(1);
}

var credentials = {};
var server = restify.createServer();
server.use(restify.bodyParser());

function login_exec(clbkok, clbkerr) {
  var httpcode;
  var data = '--data "__ac_name='+user+'&__ac_password='+pwd+'&__ac_persistent=1"'; // TODO uriencode ?
  var e = exec('curl -sgkD- '+base+'login_form '+data, function(err, stdout, stderr) {
    // get HTTP code
    httpcode = parseInt(/HTTP\/1\.1\s(\d{3})/.exec(stdout)[1]);  

    // get credentials
    var ac = /Set-Cookie:\s__ac="(.*)"/.exec(stdout);
    var ac_name = /Set-Cookie:\s__ac_name="(.*)"/.exec(stdout);
    var localhost = /<base\shref="(.*)"/.exec(stdout);

    if (!ac || !ac_name) {
      if (clbkerr) {
        clbkerr();
      }
      return;
    } else {
      credentials['__ac'] = ac[1];
      credentials['__ac_name'] = ac_name[1];
    }
    if (localhost) { // when running locally, we get an automatic redirection to local http
      base = localhost[1];
      masterip = /https?:\/\/(.*):\d+\//.exec(base)[1];
    }
    //fs.writeFile('cookie.txt', "["+masterip+"]\n__ac=\\\""+credentials['__ac']+"\\\"");
  });
  if (clbkok) {
    e.on('exit', function(code) {
      if (code === 0 && httpcode === 200) {
        console.log('login ok');
        clbkok();
      } else if (clbkerr) {
        clbkerr();
      }
    });
  }
  if (clbkerr) {
    e.on('error', clbkerr);
  }
}

function phantomjs_exec(script, args, clbkok, clbkerr) {
  var output;
  //console.log('phantomjs --debug=yes --ignore-ssl-errors=yes '+
  //             script+' "'+base+'" "'+credentials['__ac']+'" "'+masterip+'" '+args+' | tail -1');
  var e = exec('phantomjs --debug=yes --ignore-ssl-errors=yes '+
               script+' "'+base+'" "'+credentials['__ac']+'" "'+masterip+'" '+args+'',
               function(err, stdout, stderr) {

    output = stdout.split("\n");
    output = output[output.length - 2];
  });

  if (clbkok) {
    e.on('exit', function(code) {
      if (code === 0) {
        clbkok(output);
      } else if (clbkerr) {
        clbkerr();
      }
    });
  }
  if (clbkerr) {
    e.on('error', clbkerr);
  }
} 

// simple check if server is running
server.get('/status', function(req, res, next) {
  res.setHeader('content-type', 'application/json');
  res.send({"status": "ok"});
  return next();
});

// login to server and check if it was ok
server.get('/checklogin', function(req, res, next) {
  login_exec(function() {
     res.send({"logged": true});
  }, function() {
    res.send({"logged": false});
  });
  return next();
});

// list of my servers
server.get('/servers', function(req, res, next) {
  login_exec(function() {
    phantomjs_exec('get_servers.js', '', function(output) {
      res.setHeader('content-type', 'application/json');
      res.send(JSON.parse(output));
    });
  }, function() {
    res.send(501, { code: 501, error: "internal error" });
  });
  return next();
});

// info on a specific server
server.get('/servers/:id', function(req, res, next) {
  login_exec(function() {
    phantomjs_exec('get_server.js', req.params.id, function(output) {
      res.setHeader('content-type', 'application/json');
      res.send(JSON.parse(output));
    }, function() {
      res.send(404, { code: 404, error: "server info not found" });
    });
  }, function() {
    res.send(501, { code: 501, error: "internal error" });
  });
  return next();
});

// add a new server
server.post('/servers', function(req, res, next) {
  if (!req.params.name) {
    res.send(403, { code: 403, error: "server name missing" });
  } else if (!req.params.name.match(/^[a-zA-Z0-9]*$/)) {
    res.send(403, { code: 403, error: "server name invalid" });
  } else {
    login_exec(function() {
      phantomjs_exec('new_server.js', req.params.name, function(output) {
        res.setHeader('content-type', 'application/json');
        res.send(JSON.parse(output));
      }, function() {
        res.send(501, { code: 501, error: "could not create server" });
      });
    }, function() {
      res.send(501, { code: 501, error: "internal error" });
    });
  }
  return next();
});

// add a server release
// TODO we need more security checks and should bypass slapos console to directly use python
server.post('/software_releases', function(req, res, next) {
  if (!req.params.server) {
    res.send(403, { code: 403, error: "missing server reference" });
  } else if (!req.params.software_release_url) {
    res.send(403, { code: 403, error: "missing software release url" });
  } else {
    var child = exec('sh supply_sr.sh ' + req.params.software_release_url + ' ' + req.params.server, function(err, stdout, stderr) {
      if (/ERROR/.test(stdout)) {
        res.send(404, "Could not supply software release");
      } else {
        res.setHeader('content-type', 'application/json');
        res.send(stdout);
      }
    });
  }
  return next();
});

server.get('/services', function(req, res, next) {
  login_exec(function() {
    phantomjs_exec('get_services.js', '', function(output) {
      res.setHeader('content-type', 'application/json');
      res.send(JSON.parse(output));
    });
  }, function() {
    res.send(501, { code: 501, error: "internal error" });
  });
  return next();
});

server.get('/services/:id', function(req, res, next) {
  login_exec(function() {
    phantomjs_exec('get_service.js', req.params.id, function(output) {
      res.setHeader('content-type', 'application/json');
      res.send(JSON.parse(output));
    }, function() {
      res.send(404, { code: 404, error: "service info not found" });
    });
  }, function() {
    res.send(501, { code: 501, error: "internal error" });
  });
  return next();
});

server.post('/services', function(req, res, next) {
  if (!req.params.server_reference) {
    res.send(403, { code: 403, error: "server reference missing" });
  } else if (!req.params.software_release_url) {
    res.send(403, { code: 403, error: "software release url missing" });
  } else if (!req.params.name) {
    res.send(403, { code: 403, error: "instance name missing" });
  } else if (!req.params.name.match(/^[a-zA-Z0-9]*$/)) {
    res.send(403, { code: 403, error: "instance name invalid" }) 
  } else {
    var child = exec('sh new_instance.sh ' + req.params.software_release_url + ' ' + req.params.name + ' ' + req.params.server_reference, function(err, stdout, stderr) {
      if (/ERROR/.test(stdout)) {
        res.send(404, { code: 404, error: "instance request failed" });
      } else {
        res.setHeader('content-type', 'application/json');
        res.send(stdout);
      }
    });
  }
  return next();
});

server.listen(port, function() {
  console.log('%s listening at %s', server.name, server.url);
});
