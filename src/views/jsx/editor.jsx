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

var TextEditor = React.createClass({
	displayName: 'TextEditor',
	
	getInitialState: function() {
		return {};	
	},
	
	componentDidMount: function() {
		var editor = ace.edit('ace');
		
		editor.setTheme('ace/theme/monokai');
		editor.getSession().setMode('ace/mode/html');
		
		editor.setReadOnly(!this.props.text);
		if (this.props.text) editor.setValue(this.props.text, -1);
		
		this.componentDidUpdate = this.componentDidMount;
		
		this.state.editor = editor;
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
				<div id="ace"></div>
				<div className="buttons">
					<img className="arrow" src="img/editor/arrow.svg"/>
					<button onClick={this.save}><img src="img/editor/save.svg"/></button>
					<button onClick={this.sync}><img src="img/editor/sync.svg"/></button>
					<button><img src="img/editor/preview.svg"/></button>
				</div>
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
					<TextEditor text={this.props.text} directory={this.props.directory}/>
				</div>
			</div>
		);
	}
});