console.log('starting phantom service');

var args = require('system').args;

var page = new WebPage();

var url = args[1]+'myspace/my_servers/add-a-server';

phantom.addCookie({
  'name': '__ac',
  'value': args[2],
  'domain': args[3]
});

var submitted = false;

page.onNavigationRequested = function(newurl, type, willNavigate, main) {
  if (submitted) {
    console.log('load finished');
    console.log('Trying to navigate to: ' + newurl);
    console.log('Caused by: ' + type);
    console.log('Will actually navigate: ' + willNavigate);
  }
}

page.open(url, function(status) {

  if (status === "success") {
    console.log('new server page loaded'); 

    // TODO no correct 404 method, this should really be enhanced
    var ok = page.evaluate(function() {
      return (typeof jQuery != 'undefined');
    });

    if (ok) {

      // retrieve information if ok
      page.onLoadFinished = function() {
        console.log('loading finished'+page.url);
        var result = page.evaluate(function() {
          if (typeof jQuery === 'undefined') return false;

          if ($('textarea[name=field_your_certificate]').length) {
            return JSON.stringify({
              "certificate": $('textarea[name=field_your_certificate]').attr('value'),
              "key": $('textarea[name=field_your_key]').attr('value')
            });
          } else {
            return false;
          }
        });

        console.log('result');
        if (result) {
          console.log(result);
          phantom.exit(0);
        } else {
          phantom.exit(-1);
        }
      };

      console.log('submitting credentials');
      submitted = true;
      page.evaluate(function(value) {
        $('input[type=text]').attr('value', value);
        $('#dialog_submit_button').click();
      }, args[4]);

    } else {
      phantom.exit(-1);
    }
  } else {
    phantom.exit(-1);
  }

});
