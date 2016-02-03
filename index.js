var Pool = require('./lib/pool');
var Sandbox = require('./lib/sandbox');


/**
 * Create an Pool instance
 * 
 * @constructor
 * @param {Object} [options] - Options for creating the pool
 */
module.exports = Pool;


Pool.run = run;
Pool.Sandbox = Sandbox;
Pool.SandboxFatalError = require('./lib/error/fatal');
Pool.SandboxTimeoutError = require('./lib/error/timeout');
Pool.SandboxUnhandledError = require('./lib/error/unhandled');


function run(options, callback) {
    var pool = new Pool(options);
    
    pool.run(options, function (err, result, stdio) {
        callback(err, result, stdio);
        
        pool.drain(function () {
            pool.destroyAllNow();
        });
    });
}