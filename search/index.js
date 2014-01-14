/**
 * Created by jin on 14-1-13.
 */

var pubfunc = require('../publicfn');
var assert = require('assert');
var async = require('async');

if(pubfunc.isDebug()){
  var search = require('cn-search').createSearch('unknown');
  var hashstorer = require('../store/store').hashstorer;
}else{
  var search = require('cn-search').createSearch('secret');
  var hashstorer = new (require('../store/store').HashStorer)('collection');
}


var query = function(queryinfo,callbackfn){
  assert(typeof queryinfo === 'object');
  //搜索的词
  var querystring = queryinfo.words;
  //第几页
  var pagenum = queryinfo.pagenum || 0;
  assert(pagenum >= 0);
  //每页几条
  var numperpage = queryinfo.numperpage || 30;
  assert(numperpage > 0);
  if(numperpage > 80){numperpage = 80;}

  var maxlength = 20;
  if(querystring.length > maxlength){
    //不能太长
    querystring = querystring.substr(0,maxlength);
  }

  async.waterfall([
    function(callback){
      //搜索出结果key集合
      console.log(querystring);
      search.query(querystring).end(callback);
    },
    function(ids,callback){
      //分页返回
      var wantedIds =ids.splice(pagenum * numperpage,numperpage);
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

