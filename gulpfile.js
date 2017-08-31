var childProcess = require('child_process');
var electron = require('electron');
var packager = require('electron-packager');
var windows = require('electron-installer-windows');

var gulp = require('gulp');
var pump = require('pump');

var sass = require('gulp-sass');
var babel = require('gulp-babel');
var install = require('gulp-install');
//var cleanCSS = require('gulp-clean-css');

gulp.task('whiskers', function(cb) {
	pump([
		gulp.src('src/whiskers/whiskers.js'),
		gulp.dest('app')
	], cb);
});

gulp.task('sass', function(cb) {
	pump([
		gulp.src('src/views/sass/index.scss'),
		sass(),
//		cleanCSS(),
		gulp.dest('app/views/css')
	], cb);
});

gulp.task('jsx', function(cb) {
	pump([
		gulp.src('src/views/jsx/**/*.jsx'),
		babel({
			plugins: ['transform-react-jsx']
		}),
		gulp.dest('app/views/js')
	], cb);
});

gulp.task('build', ['sass', 'whiskers', 'jsx'], function(cb) {
	pump([
		gulp.src(['./src/**', '!./src/views/sass{,/**}', '!./src/whiskers{,/**}', '!./src/views/jsx{,/**}']),
		gulp.dest('app')
	], cb);
});

gulp.task('watch', function() {
	gulp.watch(['src/**/*', '!./src/views/sass/.sass-cache/**', '!./src/node_modules/**'], ['kill', 'restart'])
	.on('change', function(file) {
		console.log(file.path);	
	});
});

var electronProcess;

gulp.task('kill', function() {
	electronProcess.kill('SIGINT');
});
gulp.task('restart', ['build'], function() {
	electronProcess = childProcess.spawn(electron, ['app/index.js'], {stdio: 'inherit'});
});

gulp.task('start', ['build', 'watch'], function() {
	electronProcess = childProcess.spawn(electron, ['app/index.js'], {stdio: 'inherit'});
});

gulp.task('package', ['build'], function(cb) {
	packager({
		dir: 'app',
		out: 'build',
		icon: 'build/logo.ico',
		overwrite: true,
		prune: true
	}, cb);
});

gulp.task('installer', function(cb) {
	windows({
		src: 'build/meow-win32-x64',
		dest: 'build/installers',
		icon: 'build/logo.ico'
	}, cb);
});