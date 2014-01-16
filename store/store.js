var pubfunc = require('../publicfn');

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

  this.getstring=function(field,callback){
    callback = callback || noop;
    redisClient.hget(hashkey,field,callback);
  }

  this.get=function(field,callback){
    callback = callback || noop;
    redisClient.hget(hashkey,field,function(err,reply){
      if(!err){
        try{
          reply = JSON.parse(reply);
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
  this.getstring=function(limit,callback){
    callback = callback || noop;
    redisClient.zrevrange(hashkey,0,limit,callback);
  }

  /*暂时不会用到
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



var hashstorer = new HashStorer();
exports.hashstorer = hashstorer;//默认unknown表
exports.HashStorer = HashStorer;  //创建新表

var zstorer = new ZStorer();
exports.zstorer = zstorer;//默认zunknown
exports.ZStorer = ZStorer;//新表
