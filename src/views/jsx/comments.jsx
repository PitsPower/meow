var shell = require('electron').shell;
var whiskers = require('../../whiskers');

var User = React.createClass({
	displayName: 'User',
	
	getInitialState: function() {
		return {
			hasFavicon: false,
			faviconUrl: null
		};
	},
	
	componentDidMount: function() {
		var _this = this;
		whiskers.getFavicon(this.props.children, function(success,url) {
			_this.setState({
				hasFavicon: success,
				faviconUrl: url
			});
		});
	},
	
	render: function() {
		return (
			<span className="user">
				{this.state.hasFavicon && <img src={this.state.faviconUrl}/>}
				{this.props.children}
			</span>
		);
	}
});

var LikeButton = React.createClass({
	displayName: 'LikeButton',
	
	render: function() {
		return <button onClick={this.props.likePost}>{this.props.liked?'Unlike':'Like'} ({this.props.likes})</button>;
	}
});
var ReplyButton = React.createClass({
	displayName: 'ReplyButton',
	
	render: function() {
		return <button onClick={this.props.reply}>{this.props.replying?'Cancel':'Reply'}</button>;
	}
});
var EditButton = React.createClass({
	displayName: 'EditButton',
	
	render: function() {
		return <button onClick={this.props.edit}>{this.props.editing?'Cancel':'Edit'}</button>;
	}
});
var DeleteButton = React.createClass({
	displayName: 'DeleteButton',
	
	render: function() {
		return <button onClick={this.props.delete}>Delete</button>;
	}
});

var Actions = React.createClass({
	displayName: 'Actions',
	
	render: function() {
		return (
			<div className="actions">
				<LikeButton likePost={this.props.like} likes={this.props.state.likes} liked={this.props.state.liked}/>
				{!this.props.isReply && <ReplyButton reply={this.props.reply} replying={this.props.state.replying}/>}
				{
					this.props.state.allowEdit &&
					<span>
						{!this.props.isReply && <EditButton edit={this.props.edit} editing={this.props.state.editing}/>}
						<DeleteButton delete={this.props.delete}/>
					</span>
				}
				{
					this.props.state.replying &&
					<div className="reply form">
						<input ref="replyInput" type="text" maxLength="420"/>
						<button onClick={()=>this.props.submitReply(this.refs.replyInput.value)}>Post</button>
					</div>
				}
			</div>
		);
	}
});

var Reply = React.createClass({
	displayName: 'Reply',
	
	getInitialState: function() {
		var data = this.props.data;
		console.log(data);
		
		return {
			id: data.id,
			
			likes: data.likes,
			liked: data.liked,
			
			allowEdit: data.allowEdit,
			
			deleted: false
		};
	},
	
	like: function() {
		this.setState({
			liked: !this.state.liked,
			likes: this.state.likes + (this.state.liked?-1:1)
		});
		
		whiskers.likeComment(window.User, this.props.data);
	},
	delete: function() {
		var _this = this;
		
		whiskers.deleteComment(window.User, this.props.data, function() {
			_this.setState({deleted: true});
		});
	},
	
	render: function() {
		var data = this.props.data;
		if (!this.state.deleted) {
			return (
				<div className="post comment">
					<div className="author">
						<User>{data.user}</User>
					</div>
					<div className="content">{data.content}</div>
					<Actions
						isReply={true}
						state={this.state}
						like={this.like}
						delete={this.delete}
					/>
				</div>
			);
		} else {
			return (<h1>deleted</h1>);
		}
	}
});

var UpdateFile = React.createClass({
	displayName: 'UpdateFile',
	
	openLink: function() {
		shell.openExternal(this.props.data.link);	
	},
	
	render: function() {
		var data = this.props.data;
		return (
			<div className="file" onClick={this.openLink}>
				<img src={data.screenshot}/>
				<div>{data.name}</div>
			</div>
		);
	}
});

var Comment = React.createClass({
	displayName: 'Comment',
	
	getInitialState: function() {
		var data = this.props.data;
		console.log(data);
		
		return {
			id: data.id,
			content: data.content,
			
			likes: data.likes,
			liked: data.liked,
			
			replying: false,
			replies: data.replies,
			
			allowEdit: data.allowEdit,
			editing: false,
			
			deleted: false
		};
	},
	
	like: function() {
		this.setState({
			liked: !this.state.liked,
			likes: this.state.likes + (this.state.liked?-1:1)
		});
		
		whiskers.likeComment(window.User, this.props.data);
	},
	reply: function() {
		this.setState({replying: !this.state.replying});
	},
	submitReply: function(value) {
		var _this = this;
		this.setState({replying: false});
		whiskers.replyToComment(window.User, this.props.data, value, function(comment) {
			console.log(comment);
			_this.setState({replies: comment.replies});
		});
	},
	edit: function() {
		this.setState({editing: !this.state.editing});
	},
	submitEdit: function() {
		var _this = this;
		var newText = this.refs.editText.value;
		
		this.setState({editing: false});
		whiskers.editComment(window.User, this.props.data, this.refs.editText.value, function() {
			_this.setState({content: newText});
		});
	},
	delete: function() {
		var _this = this;
		
		whiskers.deleteComment(window.User, this.props.data, function() {
			_this.setState({deleted: true});
		});
	},
	
	renderComment: function() {
		var data = this.props.data;
		return (
			<div className="post comment">
				<div className="author">
					{
						data.users.length==1
						?
						<User>{data.users[0]}</User>
						:
						<span>
							<User>{data.users[0]}</User>
							<span className="separator">></span>
							<User>{data.users[1]}</User>
						</span>
					}
				</div>
				{
					this.state.editing
					?
					<div className="form side" style={{margin: "10px 0"}}>
						<input ref="editText" type="text" defaultValue={this.state.content} maxLength="420"/>
						<button onClick={this.submitEdit}>Submit</button>
					</div>
					:
					<div className="content">{this.state.content}</div>
				}
				<Actions
					isReply={false}
					state={this.state}
					like={this.like}
					reply={this.reply}
					edit={this.edit}
					delete={this.delete}
					submitReply={this.submitReply}
				/>
				<div className="replies">
					{
						this.state.replies.map(function(item, i) {
							return <Reply data={item} key={i}/>
						})
					}
				</div>
			</div>
		);
	},
	renderFollow: function() {
		var data = this.props.data;
		return (
			<div className="post follow">
				<User>{data.users[0]}</User>
				<span className="separator">followed</span>
				<User>{data.users[1]}</User>
			</div>
		);
	},
	renderUpdate: function() {
		var data = this.props.data;
		return (
			<div className="post update">
				<div className="author">
					<User>{data.user}</User>
					<span className="separator">was updated</span>
				</div>
				<div className="content">
					{
						data.content.map(function(item, i) {
							return <UpdateFile data={item} key={i}/>;
						})
					}
				</div>
				<Actions
					state={this.state}
					like={this.like}
					reply={this.reply}
					edit={this.edit}
					delete={this.delete}
					submitReply={this.submitReply}
				/>
				<div className="replies">
					{
						this.state.replies.map(function(item, i) {
							return <Reply data={item} key={i}/>
						})
					}
				</div>
			</div>
		);
	},
	
	render: function() {
		var data = this.props.data;
		if (!this.state.deleted) {
			if (data.type=='comment') {
				return this.renderComment();
			} else if (data.type=='follow') {
				return this.renderFollow();
			} else if (data.type=='update') {
				return this.renderUpdate();
			}
		} else {
			return (<h1>deleted</h1>);
		}
	}
});

var PostForm = React.createClass({
	displayName: 'PostForm',
	
	submit: function() {
		var _this = this;
		whiskers.postComment(window.User, this.refs.content.value, function(comment) {
			_this.props.addComment(comment);
		});	
	},
	
	render: function() {
		return (
			<div className="post-box form side">
				<input ref="content" type="text" maxLength="420"/>
				<button onClick={this.submit}>Post</button>
			</div>
		);
	}
});

var Stats = React.createClass({
	onload: function() {
		this.refs.screenshot.style = {opacity: 1};	
	},
	
	render: function() {
		var stats = window.User.stats;
		return (
			<div className="profile sidebar column">
				<h1>
					{
						stats.favicon &&
						<img className="favicon" src={stats.favicon}/>
					}
					{window.User.name}
				</h1>
				<img ref="screenshot" className="screenshot" onLoad={this.onload} style={{opacity: 0}} src={stats.screenshot}/>
				<h2>{stats.views} views</h2>
				<h2>{stats.followers} followers</h2>
				<h2>{stats.updates} updates</h2>
				<h2>{stats.tips} tips</h2>
			</div>
		);
	}
});

module.exports = React.createClass({
	displayName: 'Comments',
	
	getInitialState: function() {
		return {
			comments: [],
			recentPosts: 0
		};	
	},
	
	componentDidMount: function() {
		var _this = this;
		whiskers.getComments(window.User, 1, function(comments) {
			_this.setState({comments: comments});
		});
	},
	
	addComment: function(comment) {
		this.state.recentPosts++;
		this.state.comments.unshift(comment);
		this.forceUpdate();
	},
	
	render: function() {
		var _this = this;
		return (
			<div className="ui">
				<Stats/>

				<div className="content column">
					<PostForm addComment={this.addComment}/>
					
					{
						this.state.comments.map(function(item, i) {
							return <Comment data={item} key={i-_this.state.recentPosts}/>;
						})
					}
				</div>
			</div>
		);
	}
});