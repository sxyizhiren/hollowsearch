/**
 * Created by jin on 14-1-10.
 */

var Spider = require('easyspider').Spider;
var async = require('async');
var fs = require('fs');
var assert = require('assert');
var pubfunc = require('../../publicfn');

/**
 GET http://apprequest.secretmimi.com/article/late/30/page/1/?v=34331F64 HTTP/1.1
 Host: apprequest.secretmimi.com
 Mobile-Uuid: ios_7103A2AB87116421AE7369F446C77E5B#ios_5C165708-F1EF-478C-A0E0-928F34331F64
 Connection: keep-alive
 Accept: *\/*
Accept-Encoding: gzip, deflate
Accept-Language: zh-cn
Mobile-Uuid2: ios_7103A2AB87116421AE7369F446C77E5B#ios_5C165708-F1EF-478C-A0E0-928F34331F64
Connection: keep-alive
Secret-Lang: zh-Hans
User-Agent: Secret/1.6 rv:1600000 ((null); iPhone OS 6.1.3; zh_CN) PLHttpClient/1

*/

function MIMI(){
  var spider = new Spider();
  var contenturl='http://apprequest.secretmimi.com/article/late/60/page/1/?v=34331F64';
  var confFile=__dirname+'/conf.json';
  var conf = pubfunc.readjsonsync(confFile);

  if(pubfunc.isDebug()){
    delete conf.maxid;
    delete conf.minid;
  }
  //
  this.getConf=function(){
    return conf;
  }

  //"2014-01-11 12:40:01"
  var getTimeStrBySecond = function(sec){
    var t=new Date();
    t.setTime(0);
    t.setSeconds(sec);
    t.setHours(t.getHours() + 8); //东8区所以加8
    return t.getFullYear() + '-'
      + (t.getMonth()+1) +'-'
      + (t.getDate()) +' '
      + (t.getHours()) + ':'
      + (t.getMinutes()) + ':'
      + (t.getSeconds());

  };

  //获取第n页内容
  var getpageIcontent=function(idx,callback){
    if(idx <= 1)idx=1;
    var pageurl = contenturl.replace('page/1','page/'+idx);
    console.log(pageurl);

    //自定义头，抓包得到，必须要
    var customHeaders={
      'Mobile-Uuid': 'ios_7103A2AB87116421AE7369F446C77E5B#ios_5C165708-F1EF-478C-A0E0-928F34331F64',
      'Mobile-Uuid2': 'ios_7103A2AB87116421AE7369F446C77E5B#ios_5C165708-F1EF-478C-A0E0-928F34331F64',
      'Connection': 'keep-alive',
      'Secret-Lang': 'zh-Hans',
      'User-Agent': 'Secret/1.6 rv:1600000 ((null); iPhone OS 6.1.3; zh_CN) PLHttpClient/1'
    };

    spider.route(pageurl,{json:true,headers:customHeaders},function(error, json){
      if(error){
        failpage.push(idx);
        console.error(error);
        //重做
        getpageIcontent(idx,callback);
      }else{
        var retObj={};
        for(var i = 0,length=json['list'].length;i<length;i++){
          var node=json['list'][i];
          //取关注的字段
          var info={
            id:node.id,
            text:pubfunc.decodeBase64(node.content),
            view:'',
            pubtime:getTimeStrBySecond(node.post_at),
            sex:'x'
          };
          //记录最大的id
          if( node.id > (conf.maxid || 0) ){
            conf.maxid = node.id;
          }
          //记录最小的id
          if( node.id < (conf.minid || Infinity) ){
            conf.minid = node.id;
          }
          retObj[node.id] = info;

        }
        //回调列表，是对象的形式
        callback(null,retObj);
      }
    });
  }


  //全量抓取一次
  this.baseDump=function(callback){
    var bigEnoughNumber = conf.maxpage || 500;
    if(pubfunc.isDebug()){
      bigEnoughNumber = 20;
    }
    var pagelist = pubfunc.getSortedNumberArray(bigEnoughNumber);
    var resultObject={};
    async.mapLimit(pagelist,10,getpageIcontent,function(err,results){
      assert.equal(null,err);
      for(var i= 0,length=results.length;i<length;i++){
        //合并对象，自动去重
        pubfunc.mergeObj(resultObject,results[i]);
      }

      if(!pubfunc.isDebug()){
        //写入文件
        pubfunc.writejsonsync(__dirname+'/APPMIMI_basedump.json',resultObject);
        pubfunc.writejsonsync(confFile,conf);
      }
      console.log('mimi real minid='+conf.minid);

      //对象回调出去
      callback(null,resultObject);
    });

  };


  //增量抓取，与全量的差别是，这个是串行抓取。
  this.increDump=function(callback){
    var idx=1;
    var baseid = conf.maxid;
    if(pubfunc.isDebug()){
      //debug时，减小id，避免dump不到新的数据
      baseid -= 200;
    }
    assert(baseid > 0);//经过全量之后，maxid肯定不为0
    var resultObject={};
    var increGet = function(){
      assert(idx < 100);//增量抓取，不可能出现这么多页。
      getpageIcontent(idx,function(err,results){
        assert.equal(null,err);
        var dumpok = false;
        //合并并且检查是否增量抓取完毕
        for(var id in results){
          if(results.hasOwnProperty(id)){
            if(id <= baseid){
              //遇到比baseid小的，说明抓取完毕
              dumpok = true;
            }else{
              //合入总的结果
              resultObject[id]=results[id];
            }
          }
        }
        if(dumpok){
          //incre dump complete,回调出去
          return callback(null,resultObject);
        }

        idx++;  //没抓取完就继续抓下一页
        //调用自身
        increGet();
      });
    }
    increGet();
  };

}

exports.Collector = MIMI;