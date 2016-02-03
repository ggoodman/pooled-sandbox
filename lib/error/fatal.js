var Util = require('util');


module.exports = SandboxFatalError;


function SandboxFatalError(message) {
    Error.call(this, message);
    Error.captureStackTrace(this, this.constructor);

    this.message = message;
}

Util.inherits(SandboxFatalError, Error);
