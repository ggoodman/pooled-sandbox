var Defaults = require('lodash.defaultsdeep');
var Os = require('os');
var Pool = require('generic-pool').Pool;
var Sandbox = require('./sandbox');


module.exports = PooledSandbox;


function PooledSandbox(options) {
    this.options = Defaults({
        create: this.createSandbox.bind(this),
        destroy: this.destroySandbox.bind(this),
        validate: this.validateSandbox.bind(this),
    }, options, PooledSandbox.defaultOptions);
    
    this.pool = new Pool(this.options);
    
}

PooledSandbox.prototype.createSandbox = function (cb) {
    cb(null, new Sandbox(this.options));
};

PooledSandbox.prototype.destroy = function (cb) {
    var pool = this.pool;

    pool.drain(function (err) {
        pool.destroyAllNow();
        
        cb(err);
    });
};

PooledSandbox.prototype.destroySandbox = function (sandbox) {
    sandbox.destroy();
};

PooledSandbox.prototype.run = function (options, callback) {
    var pool = this.pool;
    
    pool.acquire(function(err, sandbox) {
        if (err) return callback(err);
        
        sandbox.run(options, function(err, result) {
            pool.release(sandbox);
            
            callback(err, result);
        });
    });
};

PooledSandbox.prototype.validateSandbox = function (sandbox) {
    return sandbox.isValid();
};

PooledSandbox.defaultOptions = {
    name: 'pooled-sandbox',       
    max: Os.cpus().length,
};
