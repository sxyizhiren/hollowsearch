var searcher = require('../../search');
var pubfunc = require('../../publicfn');
var async = require('async');
/*
 * GET home page.
 */

exports.index = function(req, res){
  searcher.hotkeys(10,function(err,hots){
    res.render('index', { title: '客官不可以-首页',
      iQuery:{words:pubfunc.initQueryWords,page:0,per:10,firstquery:true},
      siteurl:pubfunc.siteurl,
      hots:hots || []});
  });

};

exports.detail = function(req,res){
  var detail;
  var hots;
  async.parallel([
    function(callback){
      searcher.hotkeys(10,callback);
    },
    function(callback){
      var sid=req.params.sid;
      searcher.detail(sid,callback);
    }
  ],
  function(err,results){
    if(err){
      //出错就不显示详情，与首页相同
      console.log('Detail Fail!');
      res.render('index', { title: '客官不可以-首页',
        iQuery:{words:pubfunc.initQueryWords,page:0,per:10,firstquery:true},
        siteurl:pubfunc.siteurl,
        hots:hots || []});
    }else{
      hots = results[0];
      detail = results[1];
      res.render('index', { title: '客官不可以-首页',
        iQuery:{words:pubfunc.initQueryWords,page:0,per:10,firstquery:false,detail:detail},
        hots:hots,
        siteurl:pubfunc.siteurl
      });
    }
  });


}