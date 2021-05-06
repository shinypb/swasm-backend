let plugins = {
	"@tailwindcss/postcss7-compat": {},
};

if (process.env.NODE_ENV === "production") {
	plugins["@fullhuman/postcss-purgecss"] = {
		content: ["**/*.html", "**/*.js"],
		css: ["client/css/index.pcss"],
	};
}

module.exports = {
	plugins,
};
 