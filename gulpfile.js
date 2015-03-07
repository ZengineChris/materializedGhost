var args = require('yargs').argv;
var config = require('./gulp.config')();
var del = require('del');
var glob = require('glob');
var gulp = require('gulp');
var path = require('path');
var _ = require('lodash');
var $ = require('gulp-load-plugins')({lazy: true});



/**
 * List the available gulp tasks
 */
gulp.task('help', $.taskListing);
gulp.task('default', ['help']);


/**
 * Compile sass to css
 * @return {Stream}
 */
gulp.task('styles', ['clean-styles'], function() {
	log('Compiling Sass --> CSS');

	return gulp
		.src(config.sass)
		.pipe($.plumber()) // exit gracefully if something fails after this
		.pipe($.sass())
//        .on('error', errorLogger) // more verbose and dupe output. requires emit.
		.pipe($.autoprefixer({browsers: ['last 2 version', '> 5%']}))
		.pipe(gulp.dest(config.temp));
});

/**
 *
 */
gulp.task('sass-watcher', function() {
	gulp.watch([config.sass], ['styles']);
});


/**
 * Copy fonts
 * @return {Stream}
 */
gulp.task('fonts', ['clean-fonts'], function() {
	log('Copying fonts');

	return gulp
		.src(config.fonts)
		.pipe(gulp.dest(config.build + 'fonts'));
});

/**
 * Compress images
 * @return {Stream}
 */
gulp.task('images', ['clean-images'], function() {
	log('Compressing and copying images');

	return gulp
		.src(config.images)
		.pipe($.imagemin({optimizationLevel: 4}))
		.pipe(gulp.dest(config.build + 'images'));
});

/**
 * Remove all files from the build, temp, and reports folders
 * @param  {Function} done - callback when complete
 */
gulp.task('clean', function(done) {
	var delconfig = [].concat(config.build, config.temp, config.report);
	log('Cleaning: ' + $.util.colors.blue(delconfig));
	del(delconfig, done);
});

/**
 * Remove all fonts from the build folder
 * @param  {Function} done - callback when complete
 */
gulp.task('clean-fonts', function(done) {
	clean(config.build + 'fonts/**/*.*', done);
});

/**
 * Remove all images from the build folder
 * @param  {Function} done - callback when complete
 */
gulp.task('clean-images', function(done) {
	clean(config.build + 'images/**/*.*', done);
});

/**
 * Remove all scripts from the build folder
 * @param  {Function} done - callback when complete
 */
gulp.task('clean-scripts', function(done) {
	clean(config.build + 'scripts/**/*.*', done);
});

/**
 * Remove all styles from the build and temp folders
 * @param  {Function} done - callback when complete
 */
gulp.task('clean-styles', function(done) {
	var files = [].concat(
		config.temp + '**/*.css',
		config.build + 'styles/**/*.css'
	);
	clean(files, done);
});

/**
 * Wire-up the bower dependencies
 * @return {Stream}
 */
gulp.task('wiredep', function() {
	log('Wiring the bower dependencies into the html');

	var wiredep = require('wiredep').stream;
	var options = config.getWiredepDefaultOptions();


	return gulp
		.src(config.index)
		.pipe(wiredep(options))
		.pipe(inject(config.js, ''))
		.pipe(gulp.dest(config.source));
});

gulp.task('inject', ['styles'], function() {
	log('Wire up css into the html, after files are ready');

	return gulp
		.src(config.index)
		.pipe(inject(config.css))
		.pipe(gulp.dest(config.source));
});

/**
 * Optimize all files, move to a build folder,
 * and inject them into the new index.html
 * @return {Stream}
 */
gulp.task('optimize', ['inject', 'clean-scripts'], function() {
	log('Optimizing the js, css, and html');

	var assets = $.useref.assets({searchPath: './'});
	// Filters are named for the gulp-useref path
	var cssFilter = $.filter('**/*.css');
	var jsAppFilter = $.filter('**/' + config.optimized.app);
	var jslibFilter = $.filter('**/' + config.optimized.lib);


	return gulp
		.src(config.index)
		.pipe($.plumber())
		.pipe(assets) // Gather all assets from the html with useref
		// Get the css
		.pipe(cssFilter)
		.pipe($.csso())
		.pipe(cssFilter.restore())
		// Get the custom javascript
		.pipe(jsAppFilter)
		.pipe($.uglify())
		//.pipe(getHeader())
		.pipe(jsAppFilter.restore())
		// Get the vendor javascript
		.pipe(jslibFilter)
		.pipe($.uglify()) // another option is to override wiredep to use min files
		.pipe(jslibFilter.restore())
		// Take inventory of the file names for future rev numbers
		.pipe($.rev())
		// Apply the concat and file replacement with useref
		.pipe(assets.restore())
		.pipe($.useref())
		// Replace the file names in the html with rev numbers
		.pipe($.revReplace())
		.pipe(gulp.dest(config.root));
});





// HELPER
////////////////////////////////////////////////////////

/**
 * Delete all files in a given path
 * @param  {Array}   path - array of paths to delete
 * @param  {Function} done - callback when complete
 */
function clean(path, done) {
	log('Cleaning: ' + $.util.colors.blue(path));
	del(path, done);
}

/**
 * Log a message or series of messages using chalk's blue color.
 * Can pass in a string, object or array.
 */
function log(msg) {
	if (typeof(msg) === 'object') {
		for (var item in msg) {
			if (msg.hasOwnProperty(item)) {
				$.util.log($.util.colors.blue(msg[item]));
			}
		}
	} else {
		$.util.log($.util.colors.blue(msg));
	}
}

/**
 * Inject files in a sorted sequence at a specified inject label
 * @param   {Array} src   glob pattern for source files
 * @param   {String} label   The label name
 * @param   {Array} order   glob pattern for sort order of the files
 * @returns {Stream}   The stream
 */
function inject(src, label, order) {
	var options = {read: false};
	if (label) {
		options.name = 'inject:' + label;
	}

	return $.inject(orderSrc(src, order), options);
}


/**
 * Order a stream
 * @param   {Stream} src   The gulp.src stream
 * @param   {Array} order Glob array pattern
 * @returns {Stream} The ordered stream
 */
function orderSrc (src, order) {
	//order = order || ['**/*'];
	return gulp
		.src(src)
		.pipe($.if(order, $.order(order)));
}

module.exports = gulp;