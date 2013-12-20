console.log('starting phantom service');

var args = require('system').args;

var page = new WebPage();

phantom.addCookie({
  'name': '__ac',
  'value': args[2],
  'domain': args[3]
});

var url = args[1]+'hosting_subscription_module/' + args[4] +
          '?selection_name=my_current_hosting_subscription_selection&selection_index=0&reset:int=1';

page.open(url, function(status) {

  if (status === "success") {
    console.log('service page loaded'); 

    // TODO no correct 404 method, this should really be anhanced
    var ok = page.evaluate(function() {
      return (typeof jQuery != 'undefined');
    });

    if (ok) {

      var service = page.evaluate(function(reference) {
        var s = {};

        s["id"] = reference;
        s["url"] = $('div[title="url value"] a').attr('href');
        s["status"] = $('div[title="url value"]').nextAll().eq(1).find('div.input').text();

        var params = [];

        $('.listbox-container:first tbody tr').each(function() {
          if ($(this).find('td').length > 1) {
            params.push({
              "key": $.trim($(this).find('td:eq(0)').text()),
              "value": $.trim($(this).find('td:eq(1)').text())
            });
          }
        });
        s["params"] = params;

        return JSON.stringify(s);
      }, args[4]);

      console.log(service);
      phantom.exit(0);
    } else {
      phantom.exit(-1)
    }
  } else {
    phantom.exit(-1);
  }

});
