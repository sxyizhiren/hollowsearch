//这里不要去试图引用httpserver因为httpserver下的文件也会引用这里，循环引用了。

var fs = require('fs');

var redis=require('redis');
var redisclient;


var createRedisClient=function(){
  if(!redisclient){
    redisclient = redis.createClient();
    redisclient.on("error", function (err) {
      console.error("RedisClient Error: " + err);
    });
  }
  return redisclient;

}

//返回一个[1,2,3,4,5,6...]的数组，内容从1到length
var getSortedNumberArray =function(length){
  var arr=[];
  //1,2,3,4...
  for(var i=0;i<length;i++){
    arr[i] = i+1;
  }
  return arr;
}

//合并o2到o1
var mergeObj=function(o1,o2){
  for(var key in o2){
    if(o2.hasOwnProperty(key)){
      o1[key]=o2[key];
    }
  }
  return o1;
}

//decode base64
var decodeBase64 = function(base64str){
  return (new Buffer(base64str,'base64').toString());
}

var writejsonsync = function(fullpath,data){
  if(typeof data === 'object'){
    fs.writeFileSync(fullpath,JSON.stringify(data,null,2));
  }else{
    fs.writeFileSync(fullpath,data);
  }
}

var readjsonsync = function(fullpath){
  return JSON.parse(fs.readFileSync(fullpath));
}


var openDebug=function(){
  process.env.mode = 'DEBUG';
}

var isDebug=function(){
  return process.env.mode === 'DEBUG';
}

exports.getSortedNumberArray = getSortedNumberArray;
exports.mergeObj = mergeObj;
exports.decodeBase64 = decodeBase64;
exports.writejsonsync = writejsonsync;
exports.readjsonsync = readjsonsync;
exports.openDebug = openDebug;
exports.isDebug = isDebug;
exports.createRedisClient = createRedisClient;





