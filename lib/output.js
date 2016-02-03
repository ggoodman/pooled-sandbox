var Util = require('util');
var WritableStream = require('stream').Writable;


module.exports = SandboxOutput;


function SandboxOutput() {
    WritableStream.call(this);
    
    this.chunks = [];
}

Util.inherits(SandboxOutput, WritableStream);

SandboxOutput.prototype._write = function (chunk, encoding, done) {
    this.chunks.push(chunk);
    
    done();
};

SandboxOutput.prototype.reset = function () {
    this.chunks.length = 0;
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