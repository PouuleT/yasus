var koa = require('koa');
var app = koa();

var _ = require('koa-route');
var koa_body = require('koa-body-parser');
var parse = require('url').parse;
var url_to_index = new Array();
var short_to_url = new Array();

var appli = {
  shorten: function *(url){
    var start = new Date();
    var param = parse(this.url, true);
    var url = param.query.url;
    console.log("Starting ... the short stuff with ",url);
    this.body = 'Good : '+url;
    console.log("Done");
  },

  redirect: function *(hash){
    console.log("Redirecting...to ");
    console.log(hash);
    long_url = 'http://google.fr';//short_to_url[param.pathname.substring(1)];
    if (long_url != undefined) {
        this.redirect(long_url)
    } else {
        this.throw(404, {'Content-Type': 'text/plain'});
        //this.body('404 - Requested url not found');
    }
    console.log("Done");
  }
}
app.use(_.get('/add', appli.shorten));
app.use(_.get('/:hash', appli.redirect));


app.listen(3003);
