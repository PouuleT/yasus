var logger   = require('koa-logger');
var router   = require('koa-router');
var parse    = require('co-body');
var crypto   = require('crypto');
var coRedis  = require('co-redis');
var redis    = require('redis');

var koa = require('koa');
var app = koa();

app.use(logger());
app.use(router(app));

// Database
var client      = redis.createClient();
var redisClient = coRedis(client);

// We set a default port if process.env.PORT is not defined
var appPort = process.env.PORT || 3003;

// Routes
app.post('/add', shorten);
app.get('/:hash', redirect);

// Function that will return a trunked hash of the
// url given in entry
function *shorten(){
  // We get the url in the params (given as JSON data on a POST request)
  var jsonParams = yield parse.json(this);
  if ( jsonParams == undefined )
    this.throw(500, 'Problem with your URL param');

  var url = jsonParams.url;
  if ( url == undefined )
    this.throw(500, 'Problem with your URL param');

  var short_url;
  console.log("Starting ... the short stuff with ",url);
  redisClient.incr('nbOfw00t:total'); // Update number total of access to the app

  // We check if this URL is already shortened
  var short_url_id = yield redisClient.hget( 'url_to_short_id', url.toString());
  if ( short_url_id != undefined ) {
    // Update number of add while short url already existed
    var cpt = yield redisClient.incr('nbOfw00t:alreadyExisting');
    // We get the short url from the url_id
    short_url = yield redisClient.hget('url:'+short_url_id, 'sha');
    console.log('The url was already in DB #'+short_url_id+' => '+short_url+' ('+cpt+')');
  }
  else {
    redisClient.incr('nbOfw00t:added'); // Update number of adds sent to the app
    // We need to hash the given url
    var sha1 = crypto.createHash('sha1').update(url).digest("hex");
    console.log("Just got the sha1 : "+sha1);
    // We then truncate the hash to just 10 characters
    short_url = sha1.substring(0,9);
    console.log("Just got it short : "+short_url);
    // We increment the id
    var newId = yield redisClient.incr( 'next.urls.id' );
    // Now we add all the info to the hashes in DB
    redisClient.hset( 'url_to_short_id', url, newId);
    redisClient.hset( 'url:'+newId, 'url', url);
    redisClient.hset( 'url:'+newId, 'sha', short_url);
    redisClient.hset( 'short_to_url_id', short_url, newId);
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
  console.log('Just got : '+hash);
  console.log("Redirecting...to ");
  // Update the number of total accesses of the app
  redisClient.incr('nbOfAccess:total');

  // We first check if the url given is in the DB
  var long_url_id = yield redisClient.hget( 'short_to_url_id', hash);
  if (long_url_id != undefined) {
    // If we found it, we redirect to the url found
    // We first get the full url via the url id
    var long_url = yield redisClient.hget( 'url:'+long_url_id, 'url');
    console.log("got the long url #"+long_url_id+" => "+long_url);
    // We check that it has a http or https at the begining
    var regHttp = /^http/;
    if (!regHttp.test(long_url) ) {
      // If not we add HTTP by default
      long_url = 'http://'+long_url;
    }
    // Else we let the HTTP or HTTPS given
    //
    // Update the number of access of this particular link
    var nbOfAccess = yield redisClient.incr( 'url:'+long_url_id+':nbOfAccess');
    redisClient.hset( 'url:'+long_url_id, 'nbOfAccess', nbOfAccess );
    console.log("Nonbre d'access de "+long_url+" => "+nbOfAccess);

    console.log("going to redirect to "+long_url);
    // We update the number of successfull redirections
    redisClient.incr('nbOfAccess:success');
    this.redirect(long_url)
  } else {
    // If not found, we return not found
    console.log(hash+' is not yet in the hashes');
    // Update the number of urls not found
    redisClient.incr('nbOfAccess:error:notFound');
    redisClient.incr('nbOfAccess:error:total');
    this.throw(404, 'Not Found!!!');
  }
  console.log("Done");
}

app.listen(appPort);

console.log('App listening on port '+appPort);
