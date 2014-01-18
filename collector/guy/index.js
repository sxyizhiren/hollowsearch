var pubfunc = require('../../publicfn');
var assert = require('assert');
var async = require('async');
var notify = require('../../notify');


if(pubfunc.isDebug()){
  var search = require('../../store/store').searchstorer;
  var hashstorer = require('../../store/store').hashstorer;
}else{
  var search = new (require('../../store/store').SearchStorer)('secret');
  var hashstorer = new (require('../../store/store').HashStorer)('collection');
}


function noop(){}

var ColloectorGuy = function(){
  var confFile=__dirname+'/conf.json';
  var conf = pubfunc.readjsonsync(confFile);

  assert.equal(conf.whoami,'GoodGuy');

  var basepath='../';  //collector们的目录
  var collectorArray =[];
  for(var i= 0,len=conf.collectors.length;i<len;i++){
    var coll = {
      keystr:conf.collectors[i],
      coll:new (require(basepath+conf.collectors[i]).Collector)
    };
    collectorArray.push(coll);
  }

  var fails=[];
  var completefails=function(){
    if(fails.length > 0){
      var data = fails.shift();
      storeNodes(data.key,data.node);
      notify.info(null,'fails.store',data);
    }
    setTimeout(completefails,5000);
  }
  //轮训失败的操作
  completefails();

  //存储以及加入索引，callbackfn永远返回成功，有失败的话是放入失败队列处理的
  //callbackfn只有一种结果就是callbackfn(null,[.,.,.,.,.,.,....]);
  var storeNodes = function(keystr,nodes,callbackfn){
    var objkeys = Object.keys(nodes);
    console.log('storeNodes.'+keystr+'.length='+objkeys.length);
    //async.eachSeries只传回null或者err，不传回结果集合
    async.eachSeries(objkeys,function(node,callbackEachSeries){
      var key = keystr + node;  //合并字符串
      //series包含结果结合，这里不需要这个结合，忽略即可
      async.series([
        function(callback){
          //console.log(nodes[node]);
          nodes[node].key = key;
          //存的时候会序列化
          hashstorer.set(key,nodes[node],callback);
        },
        function(callback){
          //让所有的node都能被pubfunc.initQueryWords这个关键字搜索到
          nodes[node].text=pubfunc.initQueryWords + '.' + nodes[node].text;
          search.index(nodes[node].text,key,callback);
        }
      ],function(err){
        if(err){
          console.log(err);
          //set和index其中一个失败就会进这里，这种逻辑正好符合
          var faildata={'keystr':keystr,'node':{}};
          faildata.node[node]=nodes[node];
          //放入失败队列去处理
          fails.push(faildata);
        }
        callbackEachSeries(null);//对外永不报错
      });
    },callbackfn);//迭代函数永不报错，这里callbackfn传出去的必然是null，也不报错

  }

  //callbackfn只有一种结果就是callbackfn(null);
  var baseDumpAll = function(callbackfn){
    //这里的callbackfn由async.series传入
    //async.each只返回err 或者null，不会返回每一个函数的回调结果
    async.each(collectorArray,function(theColl,callbackEach){
      theColl.coll.baseDump(function(err,info){
        assert.equal(null,err);
        storeNodes(theColl.keystr,info,callbackEach); //函数永不报错，这里的callback传出去也必然不报错

      });
    },callbackfn);
  }

  //callbackfn只有一种结果就是callbackfn(null);
  var increDumpAll = function(callbackfn){
    //这里的callbackfn由async.series传入
    //async.each只返回err 或者null，不会返回每一个函数的回调结果
    async.each(collectorArray,function(theColl,callbackEach){
      theColl.coll.increDump(function(err,info){
        assert.equal(null,err);
        storeNodes(theColl.keystr,info,callbackEach); //函数永不报错，这里的callback传出去也必然不报错

      });
    },callbackfn);

    //定时执行
    setTimeout(increDumpAll,20*1000,noop);
  }

  this.collect = function(){
    if(process.env.FIRSTDUMP == 1){
      //dump函数设计成了永不报错，所以不用关心callback返回结果,传入noop即可
      async.series([baseDumpAll,increDumpAll],noop);
      //async.series会给最后的函数传回每个函数回调出来的第二个参数，组成一个数组(err,[first,second,...])
      //noop这里只有一种结果noop(null,[undefined,undefined])
    }else{
      increDumpAll(noop);
    }
  }

}

exports.GoodGuy = ColloectorGuy;

