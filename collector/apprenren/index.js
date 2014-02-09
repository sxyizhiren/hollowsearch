/**
 * Created by jin on 14-1-10.
 */

var Spider = require('easyspider').Spider;
var async = require('async');
var fs = require('fs');
var assert = require('assert');
var pubfunc = require('../../publicfn');
var Login=new (require('renrenlogin').INST)();

function RenRen(){
  var spider = new Spider();
  var pageid = 601662031;
  var contenturl='http://status.renren.com/GetSomeomeDoingList.do?userId='+pageid+'&curpage=0';
  var confFile=__dirname+'/conf.json';
  var conf = pubfunc.readjsonsync(confFile);
  var accountFile=__dirname+'/account.json';
  var accountInfo= pubfunc.readjsonsync(accountFile);

  if(pubfunc.isDebug()){
    delete conf.maxid;
    delete conf.minid;
  }
  //
  this.getConf=function(){
    return conf;
  }

  var updatelogin=function(callback){
    Login.setAccount(accountInfo);
    Login.onekeyLogin(function(err,info){
      if(err){
        console.warn(err);
        //重新执行
        return setTimeout(updatelogin,1,callback);
      }
      //！err的话肯定是登录成功的
      assert(info.logined);
      //更新账户信息
      accountInfo = info;
      //把登录后的用户信息保存到文件中
      pubfunc.writejsonsync(accountFile,info);

      callback(err,info);

    });
  }

  //获取第n页的内容
  var getpageIcontent=function(idx,callback){
    if(idx <= 0)idx=0;
    var pageurl = contenturl.replace('curpage=0','curpage='+idx);
    console.log(pageurl);

    spider.route(pageurl,{json:true,cookiejar:accountInfo.Cookie},function(error, json){
      if(error){
        console.error(error);
        if('SyntaxError' == error.name){
          updatelogin(function(err,info){
            getpageIcontent(idx,callback);
          })
        }else{
          //重做
          getpageIcontent(idx,callback);
        }

      }else{
        var retObj={};
        for(var i = 0,length=json['doingArray'].length;i<length;i++){
          var node=json['doingArray'][i];
          //取关注的字段
          var info={
            id:node.id,
            text:(node.rootContent || node.content).replace(/<a href=.+?<\/a>/g,''),
            view:'http://status.renren.com/status/'+pageid,
            pubtime:node.dtime,
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
        //回调出去
        callback(null,retObj);
      }
    });
  }

  //全量抓取一次
  this.baseDump=function(callback){
    updatelogin(function(){
      var bigEnoughNumber = conf.maxpage || 300;
      if(pubfunc.isDebug()){
        bigEnoughNumber = 20;
      }
      var pagelist = pubfunc.getSortedNumberArray(bigEnoughNumber);
      var resultObject={};
      async.mapLimit(pagelist,10,getpageIcontent,function(err,results){
        assert.equal(null,err);
        for(var i= 0,length=results.length;i<length;i++){
          //合并对象
          pubfunc.mergeObj(resultObject,results[i]);
        }

        if(!pubfunc.isDebug()){
          //写入文件
          pubfunc.writejsonsync(__dirname+'/APP_basedump.json',resultObject);
          pubfunc.writejsonsync(confFile,conf);
          pubfunc.writejsonsync(confFile+'.bak',conf);
        }
        console.log('apprenren.minid='+conf.minid);

        //对象回调出去
        callback(null,resultObject);
      });

    });

  };


  //增量抓取，与全量的差别是，这个是串行抓取。
  this.increDump=function(callback){
    updatelogin(function(){
      assert(accountInfo.logined);//必须先登录
      var idx=0;//from 0
      var baseid = conf.maxid;
      if(pubfunc.isDebug()){
        //debug时，减小id，避免dump不到新的数据
        baseid -= 2000000;
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
            if(Object.keys(resultObject).length > 0){
              pubfunc.writejson(confFile,conf);
            }
            //incre dump complete,回调出去
            return callback(null,resultObject);
          }

          idx++;  //没抓取完就继续抓下一页
          //调用自身
          increGet();
        });
      }
      increGet();
    });
  };

}

exports.Collector = RenRen;