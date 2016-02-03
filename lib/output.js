var Defaults = require('lodash.defaultsdeep');
var Util = require('util');
var WritableStream = require('stream').Writable;


module.exports = SandboxOutput;


function SandboxOutput(options) {
    WritableStream.call(this);
    
    this.chunks = [];
    this.output = null;
    
    this.reset(options);
}

Util.inherits(SandboxOutput, WritableStream);

SandboxOutput.prototype._write = function (chunk, encoding, done) {
    this.chunks.push(chunk);
    
    if (this.output && this.output.write) {
        this.output.write(chunk, encoding);
    }
    
    done();
};

SandboxOutput.prototype.reset = function (options) {
    options = Defaults({}, options);
    
    this.chunks.length = 0;
    this.output = options.output;
};

SandboxOutput.prototype.toString = function (encoding) {
    if (!encoding) {
        encoding = 'utf8';
    }
    
    return this.chunks
        .map(function (chunk) {
            return chunk.toString(encoding);
        })
        .join('');
};