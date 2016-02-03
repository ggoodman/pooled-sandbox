var Async = require('async');
var Code = require('code');
var Lab = require('lab');
var Pool = require('../');

var lab = exports.lab = Lab.script();
var expect = Code.expect;


lab.experiment('PooledSandbox', function () {
    lab.test('should run a Function instance', function (done) {
        var pool = new Pool({ idleTimeoutMillis: 500 });
        var args = [1, 2];
        
        pool.run({ code: userCode, args: args}, function (err, response) {
            expect(err).to.be.null();
            expect(response.data).to.be.an.array();
            expect(response.data).to.deep.equal(args);
            
            done();
        });
        
        function userCode(arg1, arg2, cb) {
            cb(null, arg1, arg2);
        }
    });
    
    lab.test('should run a Function instance many times', function (done) {
        var pool = new Pool({ idleTimeoutMillis: 500 });
        
        Async.times(50, runCodeInPool, function (err) {
            pool.destroy(done);
        });
        
        function runCodeInPool(n, next) {
            pool.run({ code: userCode, args: [n]}, function (err, response) {
                expect(err).to.be.null();
                expect(response.data).to.be.an.array();
                expect(response.data).to.deep.equal([n]);
            
                next();
            });
        }
        
        function userCode(n, cb) {
            cb(null, n);
        }
    });
    
    lab.test('should handle a blocked event loop', { timeout: 6000 }, function (done) {
        var pool = new Pool({ idleTimeoutMillis: 500 });
        var args = [];
        
        pool.run({ code: userCode, args: args, timeout: 5000, tripwireTimeout: 100, stdout: process.stdout, stderr: process.stderr }, function (err, response) {
            expect(err).to.be.an.instanceof(Pool.SandboxUnhandledError);
            expect(err.message).to.match(/blocked/);
            expect(response.data).to.not.exist();
            expect(response.stdio).to.be.an.object();
            
            pool.destroy(done);
        });
        
        function userCode(cb) {
            while(true) {}
        }
    });
    
    lab.test('should handle code that never calls the callback', function (done) {
        var pool = new Pool();
        var args = [];
        
        pool.run({ code: userCode, args: args, timeout: 1000 }, function (err, response) {
            expect(err).to.be.an.instanceof(Pool.SandboxTimeoutError);
            expect(response.data).to.not.exist();
            expect(response.stdio).to.be.an.object();
            
            pool.destroy(done);
        });
        
        function userCode(cb) {
            console.log('Do nothing, quickly.');
        }
    });
    
    lab.test('should handle code that throws an uncaught exception', function (done) {
        var pool = new Pool();
        var args = [];
        
        pool.run({ code: userCode, args: args, timeout: 1000 }, function (err, response) {
            expect(err).to.be.an.instanceof(Pool.SandboxUnhandledError);
            expect(response.data).to.not.exist();
            expect(response.stdio).to.be.an.object();
            
            pool.destroy(done);
        });
        
        function userCode(cb) {
            throw 'a hissy fit';
        }
    });
});