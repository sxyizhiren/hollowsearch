var pubfunc = require('../../publicfn');
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index', { title: '客官不可以-首页',initQuery:pubfunc.initQueryWords });
};