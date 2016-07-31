'use strict';

/**
 * webpack middleware for koa
 * Copyright(c) 2015 KIT Mobile Internet Pty Ltd, Australia
 * MIT Licensed
 */

const util = require('util');
const path = require('path');
const mime = require('mime');
const webpack = require('webpack');
const URL = require('url-parse');
const MemoryFileSystem = require('memory-fs');
const debug = require('debug')('koa-webpack-dev');

/**
 * Expose webpack middleware
 *   opt.config
 */

module.exports = function (opt) {
    //override default options
    opt = Object.assign({
        config: './webpack.config.js',
        watchOptions: {
            aggregateTimeout: 300
        },
        log: {
            level: 'info'
        },
        stats: {
            chunks: false,
            colors: true
        },
        defaultPage: 'index.html'
    }, opt);

    const LEVELS = { error: 0, warn: 1, info: 2, verbose: 3, debug: 4 };

    let expectedLevel = LEVELS[opt.log.level];
    let logger = opt.log.logger || ({
            log: function (level, message, meta) {
                let v = LEVELS[level];
                if (v <= expectedLevel) {
                    console.log(level + ': ' + message + (meta ? ' Related: ' + JSON.stringify(meta) : ''));
                }
            }
        });

    if (opt.configOptions) {
        let webpackConfigOptions = require('webpack-config-options');
        opt.config = webpackConfigOptions(opt.configOptions.entry, opt.configOptions.outputPath, opt.configOptions.publicPath, opt.configOptions.features);
        delete opt.configOptions;
    }

    let webpackConfig = util.isString(opt.config) ? require(path.resolve(process.cwd(), opt.config)) : opt.config;
    let compiler = webpack(webpackConfig);

    webpackConfig = compiler.options;

    if (!opt.webRoot) {
        opt.webRoot = webpackConfig.output.path;
    }

    let compiling = true;
    function watchDone(err, stats) {
        compiling = false;
        if (err) {
            logger.log('error', err.message || err, err.message && err);
            throw err;
        }

        let jsStats = stats.toJson("minimal");

        if (jsStats.errors && jsStats.errors.length > 0) {
            logger.log('error', 'Error occurred during compiling.', jsStats.errors);

        } else if (jsStats.warnings && jsStats.warnings.length > 0) {
            logger.log('warning', 'Warnings recorded during compiling.', jsStats.warnings);
        } else {
            logger.log('info', 'Rebuild completed.');
            logger.log('verbose', stats.toString(opt.stats));
        }
    }

    function invalid() {
        compiling = true;
        logger.log('info', 'Assets are now invalid.');
    }

    function compile() {
        compiling = true;
        logger.log('info', 'Compiling assets...');
    }

    // Thunk generator for compiling
    function waitTillDone() {
        return function done(cb) {
            compiler.run(cb);
        }
    }

    // Create memory files system
    let mfs = new MemoryFileSystem();
    // Attach memory fs to compiler
    compiler.outputFileSystem = mfs;

    compiler.plugin('invalid', invalid);
    compiler.plugin('compile', compile);
    compiler.watch(opt.watchOptions, watchDone);

    return function* (next) {
        if (this.method !== 'GET') return yield* next;

        let url = new URL(this.url);
        let requestFile = path.join(opt.webRoot, url.pathname);

        debug('Entered webpack middleware. URL: ' + this.url + ' => ' + requestFile);

        // If compiling, wait until finish
        if (compiling) {
            yield waitTillDone();
        }

        try {
            let stat = mfs.statSync(requestFile);
            if (!stat.isFile()) {
                if (stat.isDirectory()) {
                    requestFile = path.join(requestFile, opt.defaultPage);
                    stat = mfs.statSync(requestFile);
                    if (!stat.isFile()) return yield* next;
                } else {
                    return yield* next;
                }
            }
        } catch (e) {
            return yield* next;
        }

        debug("Hit the built file.");

        // Serve content
        let content = mfs.readFileSync(requestFile);
        this.set("Access-Control-Allow-Origin", "*"); // To support XHR, etc.

        this.set("Content-Type", mime.lookup(requestFile));
        this.set("Content-Length", content.length);

        this.body = content;
    };
};