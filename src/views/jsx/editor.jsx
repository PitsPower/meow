var shell = require('electron').shell;
var whiskers = require('../../whiskers');

require('../ace/ace');
ace.config.set('basePath', './ace');

function mapFiles(contents, parent, root) {
	if (contents) return contents.map(function(item, i) {
		if (item.type=='file') {
			return (
				<File openFile={parent.openFile} name={item.name} extension={item.extension} directory={item.directory} key={i}/>
			);
		}
		if (item.type=='folder') {
			var index = '';
			if (!root) index += parent.props.index+'/';
			index += i;
			
			return (
				<Folder openFolder={parent.openFolder} openFile={parent.openFile} item={item} index={index} key={i}/>
			);
		}
	});
}

var File = React.createClass({
	displayName: 'File',
	
	openFile: function(directory) {
		this.props.openFile(directory);
	},
	
	render: function() {
		return (
			<div className="file" onClick={()=>this.openFile(this.props.directory)}>
				<img className="icon" src={'img/editor/files/'+this.props.extension+'.svg'}/>
				{this.props.name}
			</div>
		);
	}
});

var Folder = React.createClass({
	displayName: 'Folder',
	
	getInitialState: function() {
		return {
			open: false
		};	
	},
	
	openFolder: function(index) {
		this.props.openFolder(index);
	},
	openFile: function(directory) {
		this.props.openFile(directory);
	},
	
	render: function() {
		return (
			<span>
				<div className="folder" onClick={()=>this.openFolder(this.props.index)}>
					<img className="icon" src="img/editor/files/folder.svg"/>
					{this.props.item.name}
					{this.props.item.loading && <img className="loading" src="img/loading.svg"/>}
				</div>
				<div className="files" style={{display: this.props.item.open?'block':'none'}}>
					{mapFiles(this.props.item.contents, this, false)}
				</div>
			</span>
		);
	}
});

var EditorContent = React.createClass({
	displayName: 'EditorContent',
	
	getInitialState: function() {
		return {};	
	},
	
	componentWillReceiveProps: function(props) {
		this.setState({
			image: null
		});
		
		if (props.needsEditor) {
			var editor = ace.edit('ace');

			editor.setTheme('ace/theme/monokai');
			editor.getSession().setMode('ace/mode/'+props.type);

			editor.setReadOnly(!props.text);
			if (props.text) editor.setValue(props.text, -1);

			this.state.editor = editor;
		} else {
			var imageTypes = ["jpg", "png", "gif", "svg", "ico"];
			
			if (imageTypes.indexOf(props.type)>-1) {
				this.setState({
					image: "https://"+window.User.name+".neocities.org"+props.directory
				});
			}
		}
	},
	
	save: function() {
		whiskers.saveFile(this.props.directory, this.state.editor.getValue(), function() {
			console.log("File saved");
		});
	},
	sync: function() {
		whiskers.sync(window.User, function() {
			console.log("Files synced");
		});
	},
	
	render: function() {
		return (
			<div className="editor">
				<div id="ace" style={{display: this.props.needsEditor?"block":"none"}}></div>
				{
					this.state.image &&
					<div className="image">
						<img src={this.state.image}/>
					</div>
				}
				{
					this.props.needsEditor &&
					<div className="buttons">
						<img className="arrow" src="img/editor/arrow.svg"/>
						<button onClick={this.save}><img src="img/editor/save.svg"/></button>
						<button onClick={this.sync}><img src="img/editor/sync.svg"/></button>
						<button><img src="img/editor/preview.svg"/></button>
					</div>
				}
			</div>
		);
	}
});

module.exports = React.createClass({
	displayName: 'Editor',
	
	openFolder: function(index) {
		this.props.openFolder(index);
	},
	openFile: function(directory) {
		this.props.openFile(directory);
	},
	
	render: function() {
		var state = this.props.parent.state;
		
		var unwantedTypes = [
			"jpg", "png", "gif", "svg", "ico",
			"eot", "ttf", "woff", "woff2", "svg",
			"mid", "midi"
		];
		
		var needsEditor = false;
		var type;
		
		if (this.props.directory) {
			var type = this.props.directory.split(".")[1].replace("js","javascript");
			needsEditor = unwantedTypes.indexOf(type)==-1;
		}
		
		return (
			<div className="ui">
				<div className="filetree sidebar column">
					<div className="allfiles">
						{mapFiles(state.editor.files, this, true)}
					</div>
					<div className="addfiles">
						<img src="img/editor/addfolder.svg"/>
						<img src="img/editor/addfile.svg"/>
					</div>
				</div>

				<div className="content column" style={{overflow: 'hidden'}}>
					<EditorContent text={this.props.text} directory={this.props.directory} type={type} needsEditor={needsEditor}/>
				</div>
			</div>
		);
	}
});