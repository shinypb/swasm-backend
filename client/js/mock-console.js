function mockConsole(method, prefix = '') {
	const inner = console[method];
	console[method] = function(...args) {
		inner(...args);

		const msg = prefix + args.map(arg => 
			(typeof arg == "string") ? arg : JSON.stringify(arg)
		).join(' ');

		const p = document.createElement('p');
		p.appendChild(document.createTextNode(msg));
		document.body.appendChild(p);
	}
}

mockConsole("log");
mockConsole("warn", "⚠️ ");
mockConsole("error", "⛔️ ");
