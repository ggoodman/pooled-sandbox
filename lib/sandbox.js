var Defaults = require('lodash.defaultsdeep');
var Fork = require('child_process').fork;
var Path = require('path');
var SandboxOutput = require('./output');

var SandboxFatalError = require('./error/fatal');
var SandboxTimeoutError = require('./error/timeout');
var SandboxUnhandledError = require('./error/unhandled');


module.exports = Sandbox;


function Sandbox(options) {
    this.options = Defaults({}, options, Sandbox.defaultOptions);
    
    this.callback = null;
    this.runCount = 0;
    this.timeoutHandle = null;
    
    this.stdout = new SandboxOutput();
    this.stderr = new SandboxOutput();
    
    this.onStdout = this.onStdout.bind(this);
    this.onStderr = this.onStderr.bind(this);
    this.onMessage = this.onMessage.bind(this);
    this.onError = this.onError.bind(this);
    this.onExit = this.onExit.bind(this);
    
    var forkOptions = Defaults({
        silent: true,
    }, this.options, Sandbox.defaultForkOptions);
    
    this.child = Fork(Path.join(__dirname, '/runner.js'), forkOptions);
    
    this.child.stdout.on('data', this.onStdout);
    this.child.stderr.on('data', this.onStderr);
    
    this.child.on('message', this.onMessage);
    this.child.on('error', this.onError);
    this.child.on('exit', this.onExit);
    
    this.configure(options);
}

Sandbox.prototype.configure = function () {
    // console.log('Sandbox#configure');
    
    this.child.send({
        action: 'configure',
        options: this.options,
    });
};

Sandbox.prototype.destroy = function () {
    // console.log('Sandbox#destroy');
    if (this.child) {
        this.child.removeListener('message', this.onMessage);
        this.child.removeListener('error', this.onError);
        this.child.removeListener('exit', this.onExit);
        this.child.connected && this.child.disconnect();
        this.child.kill();
        this.child = null;
    }
    
    if (this.timeoutHandle) {
        clearTimeout(this.timeoutHandle);
    }
};

Sandbox.prototype.isValid = function () {
    return true
        && this.child
        && !this.callback
        && this.runCount < this.options.maxRuns
        ;
};

Sandbox.prototype.run = function (runConfig, callback) {
    // console.log('Sandbox#run');

    runConfig = Defaults({
        action: 'run',
    }, runConfig, Sandbox.defaultRunOptions);
    
    this.stdout.reset();
    this.stderr.reset();
    this.callback = callback;
    this.timeoutHandle = setTimeout(onTimeout.bind(this), runConfig.timeout);
    
    if (typeof runConfig.code === 'function') {
        runConfig.code = runConfig.code.toString();
    }
    
    this.runCount++;

    return this.child.send(runConfig, null);
    
    
    function onTimeout() {
        // console.log('onTimeout');
        this.handleError(new SandboxTimeoutError(runConfig.timeout));
    }
};
    
    
Sandbox.prototype.handleError = function(err) {
    // console.log('handleError', err);
    var stdio = {
        stdout: this.stdout.toString('utf8'),
        stderr: this.stderr.toString('utf8'),
    };
    
    this.callback && this.callback(err, { stdio: stdio });
    this.callback = null;
    
    this.destroy();
};
    
Sandbox.prototype.onError = function(err) {
    // console.log('onError', err);
    this.handleError(new SandboxFatalError('Unexpected sandbox error: ' + err.message));
};
    
Sandbox.prototype.onExit = function(code, signal) {
    // console.log('onExit', code, signal);
    if (code) return this.handleError(new SandboxFatalError('Sandbox exited with non-zero code: ' + code));
    if (signal) return this.handleError(new SandboxFatalError('Sandbox exited after receiving signal: ' + signal));
};
    
Sandbox.prototype.onMessage = function(payload) {
    // console.log('onMessage', payload);
    if (typeof payload !== 'object') return this.handleError(new SandboxFatalError('Unexpected payload from sandbox'));
    
    if (payload.err) {
        return this.handleError(payload.err);
    }
    
    if (this.timeoutHandle) {
        clearTimeout(this.timeoutHandle);
        this.timeoutHandle = null;
    }
    
    var callback = this.callback;
    var stdio = {
        stdout: this.stdout.toString('utf8'),
        stderr: this.stderr.toString('utf8'),
    };
    
    this.callback = null;
    
    callback(null, { data: payload.data, stdio: stdio });
};
    
Sandbox.prototype.onStdout = function(data) {
    // console.log(data.toString('utf8'));
    this.stdout.write(data);
};
    
Sandbox.prototype.onStderr = function(data) {
    console.error(data.toString('utf8'));
    this.stderr.write(data);
};

Sandbox.defaultOptions = {
    maxRuns: Number.MAX_VALUE,
};

Sandbox.defaultForkOptions = {
    argv: [],
    env: {},
};

Sandbox.defaultConfigureOptions = {
    uid: undefined, // undef means do nothing
    gid: undefined, // undef means do nothing
    chroot: undefined, // undef means do nothing
    rlimits: undefined, // undef means do nothing
};

Sandbox.defaultRunOptions = {
    timeout: 60000,
    globals: {},
    expose: undefined, // undef means use defaults
};