import React from 'react';
import ReactDOM from 'react-dom';

class StatusList extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			js: true,
			static: undefined,
			db: undefined,
		};
	}

	componentDidMount() {
		let dbTimeout = setTimeout(() => this.setState({ "db": false }), 1000);
		fetch("/db").then(async (resp) => {
			const status = await resp.json();
			if (!status.ok) throw new Error("status not ok");
			return true;
		}).catch(() => false).then((ok) => {
			this.setState({ "db": !!ok });
			clearTimeout(dbTimeout);
			dbTimeout = undefined;
		});

		let staticTimeout = setTimeout(() => this.setState({ "static": false }), 1000);
		fetch("/static.json").then(async (resp) => {
			const status = await resp.json();
			if (!status.ok) throw new Error("status not ok");
			return true;
		}).catch(() => false).then((ok) => {
			this.setState({ "static": !!ok });
			clearTimeout(staticTimeout);
			staticTimeout = undefined;
		});
	}

	render() {
		let dbStatus;
		if (this.state.db === undefined) {
			dbStatus = '-';
		} else if (this.state.db) {
			dbStatus = '💚 Database is working.';
		} else {
			dbStatus = '💔 Database is not working.';
		}

		let staticStatus;
		if (this.state.static === undefined) {
			staticStatus = '-'
		} else if (this.state.static) {
			staticStatus = '💚 Static files are working.';
		} else {
			staticStatus = '💔 Static files are not working.';
		}

		return <>
			<p key="js">💚 JavaScript is working.</p>
			<p key="db">{dbStatus}</p>
			<p key="static">{staticStatus}</p>
		</>;
	}
}

ReactDOM.render(
	<StatusList />,
	document.getElementById('js'),
);

console.log("Hello, world!");
