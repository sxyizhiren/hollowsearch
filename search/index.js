/**
 * Created by jin on 14-1-13.
 */

var pubfunc = require('../publicfn');
var assert = require('assert');
var async = require('async');
var cache = require('memory-cache');
cache.debug(true);

//js没有块作用域，可以定义在{里面}
if(pubfunc.isDebug()){
  var search = require('cn-search').createSearch('unknown');
  var hashstorer = require('../store/store').hashstorer;
  var cacheTime = 10*1000;//10s
  var expireCallback=function(key){console.log(key + ' expire.');}
}else{
  var search = require('cn-search').createSearch('secret');
  var hashstorer = new (require('../store/store').HashStorer)('collection');
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
      if(cacheData){
        //cache命中
        callback(null,cacheData);
      }else{
        //走redis搜索
        search.query(querystring).end(callback);
      }
    },
    function(ids,callback){
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


exports.query = query;

