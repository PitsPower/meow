var fs = require('fs');
var path = require('path');

var request = require('request');
var cheerio = require('cheerio');
var favicon = require('favicon');
var mkdirp = require('mkdirp');

module.exports.likeComment = function likeComment(user, comment, cb) {
	console.log('Liking comment with id '+comment.id);
	
	var requestType = comment.type=='reply'?'comment':'event';
	
	post(user.request, 'https://neocities.org/'+requestType+'/'+comment.id+'/toggle_like', {
		csrf_token: user.csrf
	}, function() {
		if (cb) cb();
	});
}

module.exports.replyToComment = function replyToComment(user, comment, message, cb) {
	console.log('Replying to comment with id '+comment.id);
	
	post(user.request, 'https://neocities.org/event/'+comment.id+'/comment', {
		csrf_token: user.csrf,
		message: message
	}, function() {
		var commentAuthor = comment.user || comment.users[comment.users.length-1];
		
		get(user.request, 'https://neocities.org/site/'+commentAuthor+'?event_id='+comment.id, function($) {
			var comment = $('.news-item').eq(0);
			cb(parseComment($,comment,user));
		});
	});
}

module.exports.editComment = function editComment(user, comment, message, cb) {
	console.log('Editing comment with id '+comment.id);
	
	post(user.request, 'https://neocities.org/event/'+comment.id+'/update_profile_comment', {
		csrf_token: user.csrf,
		message: message
	}, function() {
		if (cb) cb();
	});
}

module.exports.deleteComment = function editComment(user, comment, cb) {
	console.log('Deleting comment with id '+comment.id);
	
	var requestType = comment.type=='reply'?'comment':'event';
	
	post(user.request, 'https://neocities.org/'+requestType +'/'+comment.id+'/delete', {
		csrf_token: user.csrf
	}, function() {
		if (cb) cb();
	});
}

module.exports.postComment = function postComment(user, message, cb) {
	console.log('Posting comment: "'+message+'"');
	
	post(user.request, 'https://neocities.org/site/'+user.name+'/comment', {
		csrf_token: user.csrf,
		message: message
	}, function() {
		getHomepage(user, 1, function($) {
			var comment = $('.comment').eq(0);
			cb(parseComment($,comment,user));
		});
	});
}

module.exports.getComments = function getComments(user, page, cb) {
	console.log('Getting comments from homepage');
	
	getHomepage(user, page, function($) {
		var comments = [];
		
		$('.news-item').each(function() {
			var $this = $(this);
			comments.push(parseComment($,$this,user));
		});
		
		cb(comments);
	});
}

function parseComment($,$this,user) {
	if ($this.hasClass('comment')) {
		var comment = {
			type: 'comment',
			id: $this.attr('id').replace('event_',''),
			users: [],
			content: $this.find('.content').eq(0).text().trim(),
			likes: getLikeValue($this.find('#like').text()),
			liked: $this.find('#like').text().indexOf('Unlike')>-1
		};

		$this.find('.title .text a').map(function() {
			comment.users.push($(this).text().toLowerCase().replace('you',user.name));
		});
		
		comment.allowEdit = comment.users[0]==user.name;

		if ($this.find('.comments')) {
			comment.replies = [];

			var replyData = $this.find('.comments').children();
			for (var i=0;i<replyData.length;i+=2) {
				var reply = {
					type: 'reply',
					id: replyData.eq(i).attr('id').replace('comment_',''),
					user: replyData.eq(i).find('.user').text(),
					content: replyData.eq(i).find('p').text().trim(),
					likes: getLikeValue(replyData.eq(i+1).find('.comment_like').text()),
					liked: replyData.eq(i+1).find('.comment_like').text().indexOf('Unlike')>-1
				};
				
				reply.allowEdit = reply.user==user.name;
				
				comment.replies.push(reply);
			}
		}

		return comment;
	}
	if ($this.hasClass('follow')) {
		var comment = {
			type: 'follow',
			users: []
		};

		$this.find('.title .text a').map(function() {
			comment.users.push($(this).text().toLowerCase().replace('you',user.name));
		});

		return comment;
	}
	if ($this.hasClass('update')) {
		var comment = {
			type: 'update',
			id: $this.find('.actions').attr('id').replace('event_','').replace('_actions',''),
			user: $this.find('.title .text a').attr('href').replace('/site/',''),
			content: [],
			likes: getLikeValue($this.find('#like').text()),
			liked: $this.find('#like').text().indexOf('Unlike')>-1
		};
		
		comment.allowEdit = comment.user==user.name;

		$this.find('.file').each(function() {
			comment.content.push({
				name: $(this).find('.title').attr('title'),
				link: $(this).find('a').attr('href'),
				screenshot: 'https://neocities.org'+$(this).find('img').attr('src')
			});
		});

		if ($this.find('.comments')) {
			comment.replies = [];

			var replyData = $this.find('.comments').children();
			for (var i=0;i<replyData.length;i+=2) {
				var reply = {
					type: 'reply',
					id: replyData.eq(i).attr('id').replace('comment_',''),
					user: replyData.eq(i).find('.user').text(),
					content: replyData.eq(i).find('p').text().trim(),
					likes: getLikeValue(replyData.eq(i+1).find('.comment_like').text()),
					liked: replyData.eq(i+1).find('.comment_like').text().indexOf('Unlike')>-1
				};
				
				reply.allowEdit = reply.user==user.name;
				
				comment.replies.push(reply);
			}
		}

		return comment;
	}
}

function getLikeValue(str) {
	var likeRegex = /.+\((\d+)\)/g;
	return str.match(likeRegex) ? parseInt(str.replace(likeRegex,'$1')) : 0
}

module.exports.uploadFile = function uploadFile(user, directory, filePath, cb) {
	console.log('Uploading file from '+filePath+' to '+directory);
	
	post(user.request, 'https://neocities.org/site_files/upload', {
		csrf_token: user.csrf,
		dir: directory,
		'files[]': fs.createReadStream(filePath)
	}, function() {
		if (cb) cb();
	});
}

module.exports.getFiles = function getFiles(user, directory, cb) {
	console.log('Getting files from website');
	
	var getParams = '?dir='+encodeURIComponent(directory);
	get(user.request, 'https://neocities.org/dashboard'+getParams, function($) {
		var files = [];
		
		$('.file').each(function() {
			var file = {
				type: $(this).find('.folder').length>0?'folder':'file',
				name: $(this).find('.title').text().trim()
			};
			
			file.directory = directory+'/'+file.name;
			
			var knownFileTypes = ['html', 'css', 'js'];
			var nameSplit = file.name.split('.');
			
			if (file.type=='file') {
				file.extension = nameSplit[nameSplit.length-1];
				if (knownFileTypes.indexOf(file.extension)==-1) file.extension = 'misc';
			}
			
			files.push(file);
		});
		
		cb(files);
	});
}

module.exports.getStats = function getStats(user, cb) {
	console.log('Getting site stats');
	
	get(user.request, 'https://neocities.org/site/'+user.name, function($) {
		var stats = {};
		var statsArray = ['views','followers','updates','tips'];
		
		for (var i=0;i<statsArray.length;i++) {
			stats[statsArray[i]] = $('.stat').eq(i).find('strong').text();
		}
		
		stats.screenshot =
		'https://neocities.org' +
		$('.screenshot').attr('style')
		.replace('background-image:url(','')
		.replace(');','');
		
		module.exports.getFavicon(user.name, function(success, url) {
			if (success) stats.favicon = url;
			cb(stats);
		});
	});
}

module.exports.getFavicon = function getFavicon(user, cb) {
	console.log('Getting favicon of '+user);
	
	favicon('https://'+user+'.neocities.org', function(err, url) {
		if (err) return console.log(err);
		
		if (url && url.indexOf('http')==-1 && url.indexOf('data')==-1) {
            if (url[0]=='/') {
                url = 'https://'+user+'.neocities.org'+url;
            }
            else {
                url = 'https://'+user+'.neocities.org/'+url;
            }
        }
		
		cb(url!=null,url,user);
	});
}

module.exports.sync = function(user, cb) {
	walk('./editor_files', function(items) {
		items.forEach(function(item) {
			item = item.replace(/\\/g, '/');
			module.exports.uploadFile(user, path.dirname(item.replace('editor_files','')), './'+item, cb);
		});
	});
}

function walk(directory, cb) {
	var fileArray = [];
	var filesDone = 0;
	
	fs.readdir(directory, function(err, files) {
		if (err) return console.log(err);
		
		files.forEach(function(file) {
			var filePath = path.join(directory, file);
			
			fs.stat(filePath, function(err, stats) {
				if (stats.isDirectory()) {
					walk(filePath, function(items) {
						fileArray = fileArray.concat(items);
						
						filesDone++;
						if (filesDone == files.length) cb(fileArray);
					});
				} else if (stats.isFile()) {
					fileArray.push(filePath);
					
					filesDone++;
					if (filesDone == files.length) cb(fileArray);
				}
			});
		});
	});
}

module.exports.saveFile = function saveFile(directory, text, cb) {
	mkdirp('./editor_files'+path.dirname(directory), function(err) {
		if (err) return console.log(err);
		
		fs.writeFile('./editor_files'+directory, text, function(err) {
			if (err) return console.log(err);
			cb();
		});
	});
}

module.exports.getFileData = function getFileData(user, directory, cb) {
	console.log('Getting file data at '+directory);
	
	fs.stat('./editor_files'+directory, function(err) {
		if (err == null) {
			fs.readFile('./editor_files'+directory, 'utf8', function(err, data) {
				if (err) return console.log(err);
				cb(data);
			});
		} else if (err.code == 'ENOENT') {
			request('https://'+user.name+'.neocities.org'+directory, function(err, response, body) {
				if (err) return console.log(err);
				cb(body);
			});
		} else {
			console.log(err);
			cb();
		}
	});
}

module.exports.login = function login(username, password, cb) {
	console.log('Logging in');
	
	var jar = request.jar();
	var userRequest = request.defaults({
		jar: jar
	});
	
	get(userRequest, 'https://neocities.org/signin', function($) {
		var csrf = $('input[name="csrf_token"]').val();
		console.log('CSRF token: '+csrf);

		post(userRequest, 'https://neocities.org/signin', {
			csrf_token: csrf,
			username: username,
			password: password
		}, function() {
			cb({
				name: username,
				csrf: csrf,
				request: userRequest
			});

			var loginToken = jar.getCookies('https://neocities.org').filter(function(el) {
				return el.key=='neocities'
			})[0].value;

			fs.writeFile('./session.json', JSON.stringify([{name:username,csrf:csrf,token:loginToken}]), 'utf8');
		});
	});
}

module.exports.loginAuto = function login(cb) {
	console.log('Logging in');
	
	fs.stat('./session.json', function(err) {
		if (err == null) {
			fs.readFile('./session.json', 'utf8', function(err, data) {
				if (err) return console.log(err);
				
				data = JSON.parse(data)[0];
				
				var jar = request.jar();
				jar.setCookie(request.cookie('neocities='+data.token), 'https://neocities.org');
				var userRequest = request.defaults({
					jar: jar
				});
				
				cb({
					name: data.name,
					csrf: data.csrf,
					request: userRequest
				});
			});
		} else if (err.code == 'ENOENT') {
			cb();
		} else {
			return console.log(err);
		}
	});
}

function getHomepage(user, page, cb) {
	console.log('Getting homepage')
	get(user.request, 'https://neocities.org/?page='+page, cb);
}

function get(request, url, cb) {
	console.log('Sending a get request to '+url);
	
	request.get(url, function(err, response, body) {
		if (err) return console.log(err);
		cb(cheerio.load(body));
	});
}

function post(request, url, formData, cb) {
	console.log('Sending a post request to '+url);
	
	request.post({
		url: url,
		formData: formData
	}, function(err, response, body) {
		if (err) return console.log(err);
		cb();
	});
}