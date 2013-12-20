console.log('starting phantom');

var args = require('system').args;

var page = new WebPage();

phantom.addCookie({
  'name': '__ac',
  'value': args[2],
  'domain': args[3]
});

page.open(args[1]+'myspace/my_services', function(status) {

  if (status === "success") {
    console.log('services page loaded');

    var services = page.evaluate(function() {
      var s = [];

      $('.listbox-container tbody tr').each(function() {
        if ($(this).find('td').length > 1) {
          s.push({
            "title": $(this).find('td:eq(0) a').text(),
            "id": /hosting_subscription_module\/(.*)\?/.exec($(this).find('td:eq(0) a').attr('href'))[1]
          });
        }
      });
      return JSON.stringify(s);
    });

    console.log(services);
    phantom.exit(0);
  } else {
    phantom.exit(-1);
  }

});
