# koa-webpack-dev

A koa middleware works as development server for webpack. Well tested.

### Usage

* **Koa v1.x**

    ```js
    const webpackDevServer = require('koa-webpack-dev');
    app.use(webpackDevServer(settings));
    ```

#### Install

```
npm install koa-webpack-dev
```

#### Features

* Can be integrated into your koa application as easy as using a serveStatic middleware. Just don't use it in production mode.

#### Example

```js
var koa = require('koa');
var webpackDevServer = require('koa-webpack-dev');
var app = koa();

app.use(webpackDevServer({
    config: './webpack.config.js'
}));

app.listen(2333);
```

#### Settings

* options:
  * config: can be the content of webpack.config.js or a string specified the path of webpack.config.js
  * watchOptions: options to be passed into the watch api of webpack. [webpack#watching](https://webpack.github.io/docs/node.js-api.html#watching)
  * defaultPage: default entry page for url mapped to a directory. default: index.html
  * webRoot: web root path. default: build path


### Licences

MIT

[koa]: http://koajs.com
[license-img]: https://img.shields.io/badge/license-MIT-green.svg?style=flat-square
[license-url]: LICENSE