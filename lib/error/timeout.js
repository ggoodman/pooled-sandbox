var Util = require('util');


module.exports = SandboxTimeoutError;


function SandboxTimeoutError(timeoutMillis) {
    var message = 'Sandbox request timed out after ' + timeoutMillis + 'ms';

    Error.call(this, message);
    Error.captureStackTrace(this, this.constructor);

    this.message = message;
}

Util.inherits(SandboxTimeoutError, Error);
