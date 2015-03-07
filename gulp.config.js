module.exports = function () {
	var src = './src/';
	var build = './assets/';
	var bower = {
		json: require('./bower.json'),
		directory: './src/bower_components/',
		ignorePath: './..'
	};
	var temp = './src/.tmp/';


	var config = {
		root: './',
		build: build,
		temp: temp,
		source: src,
		css: temp + '**/*.css',
		index: src + 'default.hbs',
		images: src + 'images/**/*.*',
		fonts: [
			bower.directory + 'font-awesome/fonts/**/*.*',
			bower.directory + 'materialize/font/**/*.*'
		],
		sass: src + 'styles/styles.scss',
		js: src + 'scripts/**/*.js',



		/**
		 * Bower and NPM files
		 */
		bower: bower,
		packages: [
			'./package.json',
			'./bower.json'
		],

		/**
		 * optimized files
		 */
		optimized: {
			app: 'app.js',
			lib: 'lib.js'
		}
	};

	/**
	 * wiredep and bower settings
	 */
	config.getWiredepDefaultOptions = function() {
		var options = {
			bowerJson: config.bower.json,
			directory: config.bower.directory,
			ignorePath: config.bower.ignorePath,
			html: {
				replace: {
					js: '<script src="/src/{{filePath}}"></script>'
				}
			}
		};
		return options;
	};

	return config;
};