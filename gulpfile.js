const gulp = require('gulp');
const concat = require('gulp-concat');
const ngAnnotate = require('gulp-ng-annotate');
const templates = require('gulp-angular-templatecache');
const wrap = require('gulp-wrap');
const uglify = require('gulp-uglify-es').default;
const sass = require('gulp-sass');
const copy = require('gulp-copy');

gulp.task('default', [
    'scripts',
    'styles',
    'assets',
]);

gulp.task('dev', () => {
    gulp
        .watch([
            'src/**/*.js',
            'src/**/*.scss',
            'src/**/*.html',
        ], [
            'scripts',
            'styles',
        ]);
});

gulp.task('scripts', [
    'scripts:vendors',
    'scripts:auth',
    'scripts:templates:auth',
    'scripts:main',
    'scripts:templates:main',
    'templates',
]);

gulp.task('assets', () => {
    gulp
        .src([
            'src/assets/**/*',
        ])
        .pipe(copy('dist/public/assets', { prefix: 2 }))
        .pipe(gulp.dest(''));
});

gulp.task('styles', [
    'styles:vendors',
    'styles:main',
    'styles:fonts',
]);

gulp.task('styles:vendors', () => {
    gulp
        .src([
            'node_modules/bulma/css/bulma.css',
            'node_modules/ng-bulma/dist/ng-bulma.css',
            'node_modules/font-awesome/css/font-awesome.min.css',
        ])
        .pipe(concat('vendors.css'))
        .pipe(gulp.dest('dist/public/css'));
});

gulp.task('styles:main', () => {
    gulp
        .src('src/main/**/*.scss')
        .pipe(concat('main.css'))
        .pipe(sass({ outputStyle: 'compressed' }).on('error', sass.logError))
        .pipe(gulp.dest('dist/public/css'));
});

gulp.task('styles:fonts', () => {
    gulp
        .src([
            'node_modules/font-awesome/fonts/*',
        ])
        .pipe(copy('dist/public/fonts', { prefix: 100 }))
        .pipe(gulp.dest(''));
});

gulp.task('scripts:vendors', () => {
    gulp
        .src([
            'node_modules/highcharts/highcharts.js',
            'node_modules/angular/angular.min.js',
            'node_modules/@uirouter/angularjs/release/angular-ui-router.min.js',
            'node_modules/ng-bulma/dist/ng-bulma.min.js',
        ])
        .pipe(concat('vendors.js'))
        .pipe(gulp.dest('dist/public/js'));
});

gulp.task('scripts:auth', () => {
    gulp
        .src([
            'src/common/**/*.module.js',
            'src/common/**/*.js',
            'src/auth/**/*.module.js',
            'src/auth/**/*.js',
        ])
        .pipe(concat('auth.js'))
        .pipe(ngAnnotate())
        .pipe(wrapJs())
        .pipe(uglify())
        .pipe(gulp.dest('dist/public/js'));
});

gulp.task('scripts:templates:auth', () => {
    gulp
        .src('src/auth/**/*.html')
        .pipe(templates({
            filename: 'auth.templates.js',
            module: 'cc.auth.templates',
            standalone: true,
            root: 'auth/',
        }))
        .pipe(wrapJs())
        .pipe(uglify())
        .pipe(gulp.dest('dist/public/js'))
});

gulp.task('scripts:main', () => {
    gulp
        .src([
            'src/common/**/*.module.js',
            'src/common/**/*.js',
            'src/main/**/*.module.js',
            'src/main/**/*.js',
        ])
        .pipe(concat('main.js'))
        .pipe(ngAnnotate())
        .pipe(wrapJs())
        .pipe(uglify())
        .pipe(gulp.dest('dist/public/js'));
});

gulp.task('scripts:templates:main', () => {
    gulp
        .src('src/main/**/*.html')
        .pipe(templates({
            filename: 'main.templates.js',
            module: 'cc.main.templates',
            standalone: true,
            root: 'main/',
        }))
        .pipe(wrapJs())
        .pipe(uglify())
        .pipe(gulp.dest('dist/public/js'))
});

gulp.task('templates', () => {
    gulp
        .src('src/templates/**/*.html')
        .pipe(gulp.dest('dist/templates'));
});

function wrapTemplates() {
    return wrap(`(function () {
    <%= contents %>
})();`);
}

function wrapJs() {
    return wrap(`(function (angular) {
'use strict';
<%= contents %>
})(window.angular);`);
}