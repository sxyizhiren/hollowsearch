/**
 * Created by jin on 14-1-13.
 */

var pubfunc = require('../publicfn');
var assert = require('assert');
var async = require('async');

var notify = require('../notify');
//cache.debug(true);

//js没有块作用域，可以定义在{里面}
if(pubfunc.isDebug()){
  var search = require('../store/store').searchstorer;
  var hashmainstorer = require('../store/store').hashstorer;
  var zhotstorer = require('../store/store').zstorer;

}else{
  var search = new (require('../store/store').SearchStorer)('secret');
  var hashmainstorer = new (require('../store/store').HashStorer)('collection');
  var zhotstorer = new (require('../store/store').ZStorer)('hottag');

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
      //走redis搜索
      search.query(querystring,callback);
    },
    function(ids,callback){
      zhotstorer.set(ids.length,querystring,function(err,reply){
        if(err){notify.warn(err,'zstore.set',{len:ids.length,query:querystring});}
      });  //搜索词和对应的返回量放入集合，

      //ids加入缓存，所以不能修改它，不能用splice，要用slice
      console.log(pagenum * numperpage+'-'+(pagenum+1)*numperpage);
      var wantedIds =ids.slice(pagenum * numperpage,(pagenum+1)*numperpage);
      //分页返回
      console.log(wantedIds);
      //key对应的text集合
      async.mapLimit(wantedIds,10,function(id,callbackSeries){
        hashmainstorer.get(id,callbackSeries);
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
      //sort是在原数组排的
      callback(null,texts.sort(sortfn));
    }
  ],
  //(err) 或者  (null,texts)
  callbackfn);


}

var hotkeys=function(limit,callback){
  assert((typeof limit === 'number') && (limit > 0));
  limit = parseInt(limit);
  zhotstorer.getstring(function(err,reply){
    if(err){
      callback(err);
    }else{
      console.log('Total hots:'+reply.length);
      //放入cache的都不能对它splice，只能slice
      callback(null,reply.slice(0,limit));
    }
  });

}

var detail=function(sid,callback){
  hashmainstorer.get(sid,callback);
}

exports.detail=detail;
exports.query = query;
exports.hotkeys = hotkeys;

