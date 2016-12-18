// Copyright (c) 2013 Tom Zhou<iwebpp@gmail.com>

var Fs = require('fs'),
    Iconv = require('iconv-lite'),
    Jschardet = require("jschardet");


var debug = 0;

var Convert = function(filename, dir){
    var self  = this;
	    
    var resbuf = Fs.readFileSync(filename);
    var resstr = '';
    var result = {};
    
        
    // detect charset
    var chardet = Jschardet.detect(resbuf);
    var charset = chardet.encoding;
    
    if (debug) console.log('charset:'+JSON.stringify(chardet));
        
    // decode content by charset
    resstr = Iconv.decode(resbuf, charset);
    
    if (debug > 1) console.log('original text:\r\n'+resstr);
    
    // detect 文件名
    var fstr = filename.split(/\./gi);
    result.code = '代码'+fstr[0];
    result.code += '\r\n\r\n';
    
    // detect 曾用名,like ☆曾用名: 浦发银行->G浦发
    var det1 = resstr.match(/☆曾用名[^(\r\n)]*\r\n/gi);
    if (det1) {
        result.det1 = det1[0];
        result.det1 += '\r\n';
    }
    
    // detect ◆  最新指标
    var det2 = resstr.match(/◆  最新指标([^◆]*)◆([^◆]*)◆/gi);
    if (det2) {
        result.det2 = det2[0].substr(0, det2[0].length-1);
    } else {
        result.det2 = resstr.match(/◆  最新指标([^◆]*)◆([^◆]*)/gi);
    }
    
    // detect ◆最新消息◆
    var det3 = resstr.match(/◆最新消息◆([^◆]*)◆/gi);
    if (det3) {
        result.det3 = det3[0].substr(0, det3[0].length-1);
    } else {
        result.det3 = resstr.match(/◆最新消息◆([^◆]*)/gi);
    }
    
    // detect ◆控盘情况◆
    var det4 = resstr.match(/◆控盘情况◆([^◆]*)◆/gi);
    if (det4) {
        result.det4 = det4[0].substr(0, det4[0].length-1);
    } else {
        result.det4 = resstr.match(/◆控盘情况◆([^◆]*)/gi);
    }
    
    // detect ◆概念题材◆
    var det5 = resstr.match(/◆概念题材◆([^◆]*)◆/gi);
    if (det5) {
        result.det5 = det5[0].substr(0, det5[0].length-1);
    } else {
        result.det5 = resstr.match(/◆概念题材◆([^◆]*)/gi);
    }
                            
    if (debug) {
        console.log('result text:\r\n'+result);
    }
    
    return result;
    // write converted string to file
    ///Fs.writeFileSync(dir+'/'+filename+'-new.txt', result);
    ///console.log('convert '+filename+' -> ./'+dir+'/'+filename+'-new.txt');
};

// simple test case
///Convert('600000.001', '.');

// iterate a directory
var util  = require('util'),
    argv = require('optimist').argv;

var help = [
    "usage: ./bin/node.exe convert [options] ",
    "",
    "Convert targeted files using the specified command-line options",
    "",
    "options:",
    "  -d, --directory target file directory   Directory of the files to convert",
    "  -u, --user      USER                    User to drop privileges once server socket is bound",
    "  -h, --help                              You're staring at it"
].join('\n');

if (argv.h || argv.help || Object.keys(argv).length === 1) {
  return util.puts(help);
}

var directory = argv.d || argv.directory,
    user      = argv.u || argv.user;


// 
// Check directory 
//
if (!directory) {
    directory = './';
}

Fs.readdir(directory, function(err, files){
    if (err) return console.log('Invalid directory:'+err);
    
    var dir = 'result-'+Date.now();
    var det2 = '', det3 = '', det4 = '', det5 = '';
    
    Fs.mkdirSync(dir);
    console.log('create result directory: ./'+dir);
    
    for (var i = 0; i < files.length; i ++) {
        var stats = Fs.statSync(files[i]);
        var det = '';
        
        if (stats.isFile() && files[i].match(/[0-9]+\.[0-9]+/gi)) {
            det = Convert(files[i], dir);
            
            det2 += det.code;
            det2 += det.det1 || '';
            det2 += det.det2 || '无此信息\r\n\r\n\r\n';
            
            det3 += det.code;
            det3 += det.det1 || '';
            det3 += det.det3 || '无此信息\r\n\r\n\r\n';
            
            det4 += det.code;
            det4 += det.det1 || '';
            det4 += det.det4 || '无此信息\r\n\r\n\r\n';
            
            det5 += det.code;
            det5 += det.det1 || '';
            det5 += det.det5 || '无此信息\r\n\r\n\r\n';
            
            if (det.det5) {
                var fstr = files[i].split(/\./gi);
                Fs.writeFileSync(dir+'/概念题材-'+fstr[0]+'.txt', (det.code+det.det5).replace(/风  险  提  示[\s\S]*/gi,''));
            }
        }
    }
    
    // write converted string to file
    Fs.writeFileSync(dir+'/最新指标-all.txt', det2);
    Fs.writeFileSync(dir+'/最新消息-all.txt', det3);
    Fs.writeFileSync(dir+'/控盘情况-all.txt', det4);
    Fs.writeFileSync(dir+'/概念题材-all.txt', det5);
});

//
// Drop privileges if requested
//
if (typeof user === 'string') {
    process.setuid(user);
}

