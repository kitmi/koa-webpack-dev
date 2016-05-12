'use strict';

/**
 * Module dependencies.
 */

var request = require('supertest');
var should = require('should');
var webpack = require('..');
var path = require('path');
var koa = require('koa');
var fs = require('fs');

describe('koa-middleware-webpack', function () {
    describe('bvt', function () {
        it('should rebuild and serve index.html', function (done) {
            try {
                fs.unlinkSync(path.join(__dirname, '../example/build/index.html'));
            } catch(e) {}

            var app = koa();
            app.use(webpack({
                config: require('../example/webpack.config.js')
            }));

            request(app.listen())
                .get('/')
                .expect('content-type', 'text/html')
                .expect(/<title>My app<\/title>/)
                .expect(200, done);
        });

        it('should work when using external config file', function (done) {
            try {
                fs.unlinkSync(path.join(__dirname, '../example/build/index.html'));
            } catch(e) {}

            var app = koa();
            app.use(webpack({
                config: './example/webpack.config.js'
            }));

            request(app.listen())
                .get('/')
                .expect('content-type', 'text/html')
                .expect(/<title>My app<\/title>/)
                .expect(200, done);
        });

        it('should rebuild and serve bundle.js', function (done) {
            try {
                fs.unlinkSync(path.join(__dirname, '../example/build/bundle.js'));
            } catch (e) {}

            var app = koa();
            app.use(webpack({
                config: require('../example/webpack.config.js')
            }));

            request(app.listen())
                .get('/bundle.js')
                .expect('content-type', 'application/javascript')
                .expect(200, done);
        });

        it('config-options test', function (done) {
            try {
                fs.unlinkSync(path.join(__dirname, '../example/build/bundle.js'));
            } catch (e) {}

            var app = koa();
            app.use(webpack({
                configOptions: {
                    entry: { index: path.join(__dirname, '../example/app/index.jsx') },
                    outputPath: path.join(__dirname, '../example/build'),
                    publicPath: '',
                    features: { scriptPath: '', stylePath: '' }
                }
            }));

            request(app.listen())
                .get('/index.bundle.js')
                .expect('content-type', 'application/javascript')
                .expect(200, done);
        });

        it('should return 404 while requesting non-exist file', function (done) {
            var app = koa();
            app.use(webpack({
                config: require('../example/webpack.config.js')
            }));

            request(app.listen())
                .get('/non-exist')
                .expect(404, done);
        });

    });
});