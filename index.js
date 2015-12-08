var NodeTemplatePlugin = require('webpack/lib/node/NodeTemplatePlugin');
var NodeTargetPlugin = require('webpack/lib/node/NodeTargetPlugin');
var LibraryTemplatePlugin = require('webpack/lib/LibraryTemplatePlugin');
var SingleEntryPlugin = require('webpack/lib/SingleEntryPlugin');
var LimitChunkCountPlugin = require('webpack/lib/optimize/LimitChunkCountPlugin');

module.exports = function () {
  if(this.cacheable) this.cacheable();
  var request = this.request.split('!').slice(this.loaderIndex + 1).join('!');
  var childFilename = 'css-in-js-output-filename';
  var outputOptions = { filename: childFilename };
  var childCompiler = getRootCompilation(this)
      .createChildCompiler('css-in-js-compiler', outputOptions);
  childCompiler.apply(new NodeTemplatePlugin(outputOptions));
  childCompiler.apply(new LibraryTemplatePlugin(null, 'commonjs2'));
  childCompiler.apply(new NodeTargetPlugin());
  childCompiler.apply(new SingleEntryPlugin(this.context, '!!' + request));
  childCompiler.apply(new LimitChunkCountPlugin({ maxChunks: 1 }));
  var subCache = 'subcache ' + __dirname + ' ' + request;
  childCompiler.plugin('compilation', function(compilation) {
      if(compilation.cache) {
          if(!compilation.cache[subCache])
              compilation.cache[subCache] = {};
          compilation.cache = compilation.cache[subCache];
      }
  });
  // We set loaderContext[__dirname] = false to indicate we already in
  // a child compiler so we don't spawn another child compilers from there.
  childCompiler.plugin('this-compilation', function(compilation) {
      compilation.plugin('normal-module-loader', function(loaderContext) {
          loaderContext[__dirname] = false;
      });
  });
  var source;
  childCompiler.plugin('after-compile', function(compilation, callback) {
      source = compilation.assets[childFilename] && compilation.assets[childFilename].source();

      // Remove all chunk assets
      compilation.chunks.forEach(function(chunk) {
          chunk.files.forEach(function(file) {
              delete compilation.assets[file];
          });
      });

      callback();
  });

  var callback = this.async();
  childCompiler.runAsChild(function(err, entries, compilation) {
      if(err) return callback(err);

      if(compilation.errors.length > 0) {
          return callback(compilation.errors[0]);
      }
      if(!source) {
          return callback(new Error("Didn't get a result from child compiler"));
      }
      compilation.fileDependencies.forEach(function(dep) {
          this.addDependency(dep);
      }, this);
      compilation.contextDependencies.forEach(function(dep) {
          this.addContextDependency(dep);
      }, this);
      try {
          var exports = this.exec(source, request);
          if (exports.default && typeof exports.default === 'object') {
            exports = exports.default;
          }
          var text = "\nmodule.exports = " + JSON.stringify(exports) + ";";
      } catch(e) {
          return callback(e);
      }
      if (text) {
        callback(null, text);
      } else {
        callback();
      }
  }.bind(this));
};

function getRootCompilation(loader) {
  var compiler = loader._compiler;
  var compilation = loader._compilation;
  while (compiler.parentCompilation) {
    compilation = compiler.parentCompilation;
    compiler = compilation.compiler;
  }
  return compilation;
}
