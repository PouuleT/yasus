var koa = require('koa');
var app = koa();

var _ = require('koa-route');

var crypto = require('crypto');

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

    var sha1 = crypto.createHash('sha1').update(url).digest("hex");
    console.log("Just got the sha1 : "+sha1);
    var short_url = sha1.substring(0,9); 
    console.log("Just got it short :"+short_url);
    console.log('Good : '+url+' became '+sha1+' or in short '+short_url);
    this.body = 'http://w000t.fr/'+short_url;

    console.log('Now we add it to the hash');
    url_to_index[url] = short_url;
    short_to_url[short_url] = url;

    console.log("Done");
  },

  redirect: function *(hash){
    console.log("Redirecting...to ");
    console.log(hash);
    long_url = short_to_url[hash];
    if (long_url != undefined) {
        console.log("going to redirect to "+long_url);
        this.redirect(long_url)
    } else {
        console.log(hash+' is not yet in the hashes');
        this.body = "Nothing here!";
        this.throw(404, {'Content-Type': 'text/plain'});
    }
    console.log("Done");
  }
}
app.use(_.get('/add', appli.shorten));
app.use(_.get('/:hash', appli.redirect));


app.listen(3003);
