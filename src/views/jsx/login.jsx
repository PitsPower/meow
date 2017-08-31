module.exports = React.createClass({
	login: function() {
		this.props.login(this.refs.username.value, this.refs.password.value);	
	},
	
	render: function() {
		return (
			<div className="bg ui">
				<div className="login form">
					<img src="img/logo.svg"/>
					<label>
						Username: <input ref="username" onKeyUp={e=>{if (e.keyCode==13) this.login()}} type="text"/>
					</label>
					<label>
						Password: <input ref="password" onKeyUp={e=>{if (e.keyCode==13) this.login()}} type="password"/>
					</label>
					<button onClick={this.login}>Login</button>
				</div>
			</div>
		);
	}
});