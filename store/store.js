var pubfunc = require('../publicfn');
var cache = require('memory-cache');

if(pubfunc.isDebug()){

  var cacheTime = 10*1000;//10s
  var expireCallback=function(key){console.log(key + ' expire.');}
}else{

  var cacheTime = 600*1000;//
  var expireCallback=undefined;
}

function noop(){}

function HashStorer(tablename){
  //hashkey就是理解上的表
  var hashkey = tablename || 'unknown';
  var redisClient = pubfunc.createRedisClient();
  this.set=function(field,value,callback){
    callback = callback || noop;
    if(typeof value === 'object'){
      value = JSON.stringify(value);
    }
    redisClient.hset(hashkey,field,value,callback);
  }

  /*
  暂时不会用到,要用的话，打开并检查、修改
  this.getstring=function(field,callback){
    callback = callback || noop;
    //先cache
    //......
    //再redis
    redisClient.hget(hashkey,field,callback);
  }
  */

  this.get=function(field,callback){
    callback = callback || noop;
    //先cache
    var cachekey = 'HASH'+hashkey+field;
    var cachevalue = cache.get(cachekey);
    if(cachevalue){
      //cache中的已经是object形式的了
      console.log('Hit Hash Key:'+cachekey);
      return callback(null,cachevalue);
    }
    //再redis
    redisClient.hget(hashkey,field,function(err,reply){
      if(!err){
        try{
          reply = JSON.parse(reply);
          console.log('Set Hash Key:'+cachekey);
          cache.put(cachekey,reply,cacheTime,expireCallback);
        }catch(e){
          console.error('cannot convert to json.')
        }
      }
      callback(err,reply);
    });
  }
}

function ZStorer(tablename){
  //hashkey就是理解上的表
  var hashkey = tablename || 'zunknown';
  var redisClient = pubfunc.createRedisClient();
  this.set=function(score,value,callback){
    callback = callback || noop;
    if(typeof value === 'object'){
      value = JSON.stringify(value);
    }
    redisClient.zadd(hashkey,score,value,callback);
  }

  //ZREVRANGE  salary 0 -1
  this.getstring=function(callback){
    callback = callback || noop;
    //先cache
    var cachekey = 'ZREV'+hashkey;
    var cachevalue = cache.get(cachekey);
    if(cachevalue){
      console.log('Hit ZREV Key:'+cachekey);
      return callback(null,cachevalue);
    }

    redisClient.zrevrange(hashkey,0,-1,function(err,reply){
      if(!err){
        console.log('Set ZREV Key:'+cachekey);
        cache.put(cachekey,reply,cacheTime,expireCallback);
      }
      callback(err,reply);
    });
  }

  /*暂时不会用到,要用的话，打开并检查、修改
  this.get=function(limit,callback){
    callback = callback || noop;
    redisClient.zrevrange(hashkey,0,limit,function(err,reply){
      if(!err){
        try{
          for(var i= 0,len=reply.length;i<len;i++){
            reply[i]=JSON.parse(reply[i]);
          }
        }catch(e){
          console.error('cannot convert to json.')
        }
      }
      callback(err,reply);
    });
  }
  */
}

function SearchStore(tablename){
  //searchkey可以安表来理解也没问题
  var searchkey = tablename || 'unknown';
  var search = require('cn-search').createSearch(searchkey,pubfunc.searchConf);

  this.index = function(text,key,callback){
    return search.index(text,key,callback);
  }

  this.query = function(querystring,callback){
    var cachekey = 'SRCH'+querystring;
    var cachevalue = cache.get(cachekey);
    if(cachevalue){
      console.log('Hit SRCH Key:'+cachekey);
      return callback(null,cachevalue);
    }
    search.query(querystring).end(function(err, ids){
      if(!err){
        console.log('Set SRCH Key:'+cachekey);
        cache.put(cachekey,ids,cacheTime,expireCallback);
      }
      callback(err,ids);
    });
  }
}


var hashstorer = new HashStorer();
exports.hashstorer = hashstorer;//默认unknown表
exports.HashStorer = HashStorer;  //创建新表

var zstorer = new ZStorer();
exports.zstorer = zstorer;//默认zunknown
exports.ZStorer = ZStorer;//新表

var searchstorer = new SearchStore();
exports.searchstorer = searchstorer;
exports.SearchStorer = SearchStore;