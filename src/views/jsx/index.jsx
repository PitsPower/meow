var remote = require('electron').remote;

var React = require('react');
var ReactDOM = require('react-dom');

var whiskers = require('../whiskers');

var Login = require('./js/login');
var Comments = require('./js/comments');
var Editor = require('./js/editor');

var DragBar = React.createClass({
	displayName: 'DragBar',
	
	getInitialState: function() {
		return {text: 'Meow'};
	},
	
	minimise: function() {
		var BrowserWindow = remote.getCurrentWindow();
		BrowserWindow.minimize();
	},
	maximise: function() {
		var BrowserWindow = remote.getCurrentWindow();
		if (BrowserWindow.isMaximized()) {
			BrowserWindow.unmaximize();
		} else {
			BrowserWindow.maximize();
		}
	},
	close: function() {
		var BrowserWindow = remote.getCurrentWindow();
		BrowserWindow.close();
	},
	
	render: function() {
		return (
			<div className="dragbar">
				{this.state.text}
				<div className="buttons">
					<a onClick={this.minimise}><img src="img/dragbar/minimise.svg"/></a>
					<a onClick={this.maximise}><img src="img/dragbar/maximise.svg"/></a>
					<a onClick={this.close}><img src="img/dragbar/close.svg"/></a>
				</div>
			</div>
		);
	}
});

var Tab = React.createClass({
	displayName: 'Tab',
	
	getInitialState: function() {
		return {selected: false};
	},
	
	selectTab: function() {
		this.props.selectTab(this.props.index);
	},
	
	render: function() {
		return (
			<div onClick={this.selectTab} className={this.props.selected?"selected":""}>{this.props.children}</div>
		);
	}
});

var App = React.createClass({
	displayName: 'App',
	
	getInitialState: function() {
		return {
			tabs: [
				{
					name: 'Editor',
					selected: false,
					content: <Editor/>
				},
				{
					name: 'Comments',
					selected: true,
					content: <Comments/>
				},
				{
					name: 'Settings',
					selected: false,
					content: <h1>Settings is a WIP</h1>
				}
			],
			editor: {
				files: [],
				selected: null
			},
			status: '',
			loaded: false
		};
	},
	
	componentDidMount: function() {
		this.setState({status: 'Logging in...'});
		
		var _this = this;
		whiskers.loginAuto(function(user) {
			if (user) {
				_this.setupUser(user);
			} else {
				_this.setState({login: true});
			}
		});
	},
	
	login: function(username, password) {
		var _this = this;
		whiskers.login(username, password, function(user) {
			_this.setupUser(user);
			_this.setState({login: false});
		});
	},
	
	setupUser: function(user) {
		var _this = this;
		
		window.User = user;

		_this.setState({status: 'Getting stats...'});

		whiskers.getStats(window.User, function(stats) {
			window.User.stats = stats;

			_this.setState({status: 'Getting files...'});

			whiskers.getFiles(window.User, '', function(files) {
				_this.setState({
					editor: {
						files: files
					},
					loaded: true
				});
			});
		});
	},
	
	selectTab: function(index) {
		for (var i=0;i<this.state.tabs.length;i++) {
			this.state.tabs[i].selected = false;
		}
		this.state.tabs[index].selected = true;
		this.forceUpdate();
	},
	
	openFolder: function(index) {
		var _this = this;
		
		var indexValues = index.split('/');
		var query = '_this.state.editor.files';
		
		query += '['+indexValues[0]+']';
		for (var i=1;i<indexValues.length;i++) {
			query += '.contents['+indexValues[i]+']';
		}
		
		if (eval(query+'.loaded')) {
			eval(query+'.open='+!eval(query+'.open'));
			this.forceUpdate();
		} else {
			eval(query+'.loading=true');
			this.forceUpdate();

			whiskers.getFiles(window.User, eval(query+'.directory'), function(files) {
				eval(query+'.contents=files');
				eval(query+'.loading=false');
				eval(query+'.loaded=true');
				eval(query+'.open=true');

				_this.setState({selected: eval(query+'.name')});
			});
		}
	},
	openFile: function(directory) {
		var _this = this;
		whiskers.getFileData(window.User, directory, function(data) {
			_this.state.editor.directory = directory;
			_this.state.editor.text = data;
			_this.forceUpdate();
		});
	},
	
	renderLoading: function() {
		return (
			<div>
				<DragBar/>
				<div className="cat">
					<div>
						<img src="img/cat.svg"/>
						<span className="z">z</span>
						<span className="z delay1">z</span>
						<span className="z delay2">z</span>
						<span className="z delay3">z</span>
					</div>
					<h2 className="status">{this.state.status}</h2>
				</div>
			</div>
		);
	},
	renderLogin: function() {
		return (
			<div>
				<DragBar/>
				<Login login={this.login}/>
			</div>
		);
	},
	renderNormal: function() {
		var _this = this;
		this.state.tabs[0].content = <Editor
			openFolder={this.openFolder}
			openFile={this.openFile}
			directory={this.state.editor.directory}
			text={this.state.editor.text}
			parent={this}
		/>;
		
		return (
			<div>
				<DragBar/>
				<div className="tabs">
					{
						this.state.tabs.map(function(item, i) {
							return <Tab selectTab={_this.selectTab} key={i} index={i} selected={item.selected}>{item.name}</Tab>;
						})
					}
				</div>
				{
					this.state.tabs.filter(function(item) {
						return item.selected;
					})[0].content
				}
			</div>
		);
	},
	
	render: function() {
		if (this.state.loaded) {
			return this.renderNormal();
		} else if (this.state.login) {
			return this.renderLogin();
		} else {
			return this.renderLoading();
		}
	}
});

ReactDOM.render(<App/>, document.getElementById('app'));