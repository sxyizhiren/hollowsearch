/**
 * Created by jin on 14-1-13.
 */

var pubfunc = require('../publicfn');
var assert = require('assert');
var async = require('async');
var cache = require('memory-cache');
var notify = require('../notify');
//cache.debug(true);

//js没有块作用域，可以定义在{里面}
if(pubfunc.isDebug()){
  var search = require('cn-search').createSearch('unknown',pubfunc.searchConf);
  var hashstorer = require('../store/store').hashstorer;
  var zstorer = require('../store/store').zstorer;
  var cacheTime = 10*1000;//10s
  var expireCallback=function(key){console.log(key + ' expire.');}
}else{
  var search = require('cn-search').createSearch('secret',pubfunc.searchConf);
  var hashstorer = new (require('../store/store').HashStorer)('collection');
  var zstorer = new (require('../store/store').ZStorer)('hottag');
  var cacheTime = 600*1000;//
  var expireCallback=undefined;
}


var query = function(queryinfo,callbackfn){
  assert(typeof queryinfo === 'object');
  //搜索的词
  assert(typeof queryinfo.words === 'string');
  var querystring = pubfunc.fixSearchString(queryinfo.words);
  //第几页
  assert(typeof queryinfo.page === 'number');
  var pagenum = pubfunc.fixSearchPage(queryinfo.page);
  //每页几条
  assert(typeof queryinfo.per === 'number');
  var numperpage = pubfunc.fixSearchPer(queryinfo.per);

  async.waterfall([
    function(callback){
      //搜索出结果key集合
      console.log(querystring);
      //先走缓存
      var cacheData = cache.get(querystring);
      if(cacheData && cacheData.length > 5){
        //cache命中,且内容大于5条（少于5条就重新查一遍）
        callback(null,cacheData);
      }else{
        //走redis搜索
        search.query(querystring).end(callback);
      }
    },
    function(ids,callback){
      zstorer.set(ids.length,querystring,function(err,reply){
        if(err){notify.warn(err,'zstore.set',{len:ids.length,query:querystring});}
      });  //搜索词和对应的返回量放入集合，
      cache.put(querystring,ids,cacheTime,expireCallback);//缓存3分钟
      //ids加入缓存，所以不能修改它，不能用splice，要用slice
      console.log(pagenum * numperpage+'-'+(pagenum+1)*numperpage);
      var wantedIds =ids.slice(pagenum * numperpage,(pagenum+1)*numperpage);
      //分页返回
      console.log(wantedIds);
      //key对应的text集合
      async.mapLimit(wantedIds,10,function(id,callbackSeries){
        hashstorer.get(id,callbackSeries);

      },callback);
    },
    function(texts,callback){
      var sortfn=function(a,b){
        //按发布时间排序,时间越小(越旧)，就越排后面
        if(a.pubtime < b.pubtime){
          return 1;
        }else if(a.pubtime == b.pubtime){
          return 0;
        }else{
          return -1;
        }
      }
      callback(null,texts.sort(sortfn));
    }
  ],
  //(err) 或者  (null,texts)
  callbackfn);


}

var hotkeys=function(limit,callback){
  assert((typeof limit === 'number') && (limit > 0));
  limit = parseInt(limit);
  var cachestr = '_hotkeytag';
  var cachedata = cache.get(cachestr);
  if(cachedata){
    callback(null,cachedata);
  }else{
    zstorer.getstring(-1,function(err,reply){
      if(err){
        callback(err);
      }else{
        cache.put(cachestr,reply,cacheTime,expireCallback);
        console.log('Total hots:'+reply.length);
        //放入cache的都不能对它splice，只能slice
        callback(null,reply.slice(0,limit));
      }
    });
  }
}

var detail=function(sid,callback){
  hashstorer.get(sid,callback);
}

exports.detail=detail;
exports.query = query;
exports.hotkeys = hotkeys;

