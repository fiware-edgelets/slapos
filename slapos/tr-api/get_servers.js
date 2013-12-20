console.log('starting phantom');

var args = require('system').args;

var page = new WebPage();

phantom.addCookie({
  'name': '__ac',
  'value': args[2],
  'domain': args[3]
});

page.open(args[1]+'myspace/my_servers', function(status) {

console.log(status);
  if (status === "success") {
    console.log('servers page loaded');

    var servers = page.evaluate(function() {
      var s = [];

      $('.listbox-container tbody tr').each(function() {
        if ($(this).find('td').length > 1) {
          s.push({
            "title": $(this).find('td:eq(1) a').text(),
            "reference": $(this).find('td:eq(2) a').text(),
            "id": /computer_module\/(.*)\?/.exec($(this).find('td:eq(1) a').attr('href'))[1]
          });
        }
      });

      return JSON.stringify(s);
    });

    console.log(servers);
    phantom.exit(0);
  } else {
    phantom.exit(-1);
  }

});
