var Util = require('util');


module.exports = SandboxUnhandledError;


function SandboxUnhandledError(message) {
    Error.call(this, message);
    Error.captureStackTrace(this, this.constructor);

    this.message = message;
}

Util.inherits(SandboxUnhandledError, Error);
