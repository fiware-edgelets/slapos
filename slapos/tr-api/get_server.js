console.log('starting phantom service');

var args = require('system').args;

var page = new WebPage();

phantom.addCookie({
  'name': '__ac',
  'value': args[2],
  'domain': args[3]
});

var id = args[4];

var url = args[1]+'computer_module/' + id +
          '?selection_name=my_server_selection&selection_index=0&reset:int=1';

page.open(url, function(status) {

  if (status === "success") {
    console.log('service page loaded');

    // TODO no correct 404 method, this should really be anhanced
    var ok = page.evaluate(function() {
      return (typeof jQuery != 'undefined');
    });

    if (ok) {
      var server = page.evaluate(function(reference) {
        var s = {};

        s["id"] = reference;
        $["title"] = $('h1:first').text();

        var releases = [];

        $('.listbox-container:first tbody tr').each(function() {
          if ($(this).find('td').length > 1) {
            releases.push({
              "title": $.trim($(this).find('td:eq(1)').text()),
              "version": $.trim($(this).find('td:eq(2)').text()),
              "state": $.trim($(this).find('td:eq(3)').text())
            });
          }
        });
        s["software releases"] = releases;

        return JSON.stringify(s);
      }, id);

      console.log(server);
      phantom.exit(0);
    } else {
      phantom.exit(-1)
    }
  } else {
    phantom.exit(-1);
  }

});
