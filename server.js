var logger   = require('koa-logger');
var router   = require('koa-router');
var crypto   = require('crypto');
var koa_body = require('koa-body-parser');

var koa = require('koa');
var app = koa();

app.use(logger());
app.use(router(app));

// Database
var url_to_index = new Array();
var short_to_url = new Array();

// Routes
app.get('/add', shorten);
app.get('/:hash', redirect);


// Function that will return a trunked hash of the
// url given in entry
function *shorten(){
  // We get the url in the params
  var url = this.request.query.url;
  console.log("Starting ... the short stuff with ",url);

  var short_url; 
  // We check if this URL is already shortened
  if ( url_to_index[url] != undefined ) {
    short_url = url_to_index[url];
    console.log('The url was already in DB '+short_url);
  }
  else {
    // We need to hash the given url
    var sha1 = crypto.createHash('sha1').update(url).digest("hex");
    console.log("Just got the sha1 : "+sha1);
    // We then truncate the hash to just 10 characters
    short_url = sha1.substring(0,9); 
    console.log("Just got it short :"+short_url);
    // Now we add it to the hashes in DB
    url_to_index[url] = short_url;
    short_to_url[short_url] = url;
  }
  console.log('Good : '+url+' became '+short_url);

  // We return directly the link for easy parsing
  this.body = 'http://'+this.request.host+'/'+short_url;

  console.log("Done");
}

// Function that will look in DB for the hash there is in the url
// and redirect accordingly
function *redirect(){
  var hash = this.params.hash;
  console.log('Just got : '.hash);
  console.log("Redirecting...to ");
  console.log(hash);
  // We first check if the url given is in the DB
  long_url = short_to_url[hash];
  if (long_url != undefined) {
    // If we found it, we redirect to the url found
    // We check that it has a http or https at the begining
    var regHttp = /^http/;
    if (!regHttp.test(long_url) ) {
      // If not we add HTTP by default
      long_url = 'http://'+long_url;
    }
    // Else we let the HTTP or HTTPS given
    console.log("going to redirect to "+long_url);
    this.redirect(long_url)
  } else {
    // If not found, we return not found
    console.log(hash+' is not yet in the hashes');
    this.throw(404, 'Not Found!!!');
  }
  console.log("Done");
}

app.listen(process.env.PORT);

console.log('App listening on port '+process.env.PORT);
