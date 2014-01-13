/**
 * Created by jin on 14-1-11.
 */

var pubfun = require('./publicfn');
var assert = require('assert');
var CollectorMIMI =  require('./collector/appmimi').Collector;
var CollectorBDJ =  require('./collector/appbudejie').Collector;
var GoodGuy = require('./collector/guy').GoodGuy;
var hashstorer = require('./store/store').hashstorer;


pubfun.openDebug();

var goodguy = new GoodGuy();



//500 page
//test appmimi
var collor1 = new CollectorMIMI();
collor1.baseDump(function(err,info){
  var conf = collor1.getConf();
  assert((conf.maxid > conf.minid) && (conf.minid > 0));
  console.log('base dump mimi over');

  collor1.increDump(function(err,info){
    var minid=Infinity;
    for(var id in info){
      if(info.hasOwnProperty(id)){
        if(id < minid){
          minid=id;
        }
      }
    }
    console.log('incredump minid=%d,last maxid=%d',minid,conf.maxid);
    assert(minid <= conf.maxid);
  });
});


//900page at last
//test appbudejie
var collor2 = new CollectorBDJ();
collor2.baseDump(function(err,info){
  var conf = collor2.getConf();
  assert((conf.maxid > conf.minid) && (conf.minid > 0));
  console.log('base dump budejie over');

  collor2.increDump(function(err,info){
    var minid=Infinity;
    for(var id in info){
      if(info.hasOwnProperty(id)){
        if(id < minid){
          minid=id;
        }
      }
    }
    console.log('incredump minid=%d,last maxid=%d',minid,conf.maxid);
    assert(minid <= conf.maxid);
  });
});


//test store
hashstorer.set('key1',{"a":123},function(err,reply){
  assert.equal(null,err);
  assert(reply == 0 || reply ==1);
  hashstorer.getstring('key1',function(err,reply){
    assert.equal(null,err);
    assert.equal(reply,'{"a":123}');
  });

  hashstorer.get('key1',function(err,reply){
    assert.equal(null,err);
    assert.equal(reply.a,123);
  });
});