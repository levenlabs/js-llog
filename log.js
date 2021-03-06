if (typeof require === 'function') {
    var jsesc = require('jsesc');
} else {
    jsesc = function(val) {
        return val.replace(/\n/g, '\\n');
    };
}

var LEVEL_DEBUG = 0,
    LEVEL_INFO = 1,
    LEVEL_WARN = 2,
    LEVEL_ERROR = 3,
    LEVEL_FATAL = 4,
    defaultLevel = LEVEL_INFO,
    stringToLevel = {
        debug: LEVEL_DEBUG,
        info: LEVEL_INFO,
        warn: LEVEL_WARN,
        error: LEVEL_ERROR,
        fatal: LEVEL_FATAL
    },
    levelToString = {};
levelToString[LEVEL_DEBUG] = 'debug';
levelToString[LEVEL_INFO] = 'info';
levelToString[LEVEL_WARN] = 'warn';
levelToString[LEVEL_ERROR] = 'error';
levelToString[LEVEL_FATAL] = 'fatal';

function handleLevel(lvl) {
    return typeof lvl === 'string' ? stringToLevel[lvl.toLowerCase()] : lvl;
}

if (typeof process !== 'undefined' && typeof process.env === 'object') {
    if (process.env.hasOwnProperty('LLOG_LEVEL')) {
        defaultLevel = handleLevel(process.env.LLOG_LEVEL);
    }
}

// old format: LLog(level, stdout)
function LLog(opts) {
    var options = opts || {},
        level = defaultLevel,
        stdout;
    if (typeof opts === 'object' && opts != null) {
        level = opts.level || level;
        stdout = opts.stdout;
    } else {
        if (typeof opts !== 'undefined') {
            level = opts;
        }
        if (arguments.length > 1) {
            stdout = arguments[1];
        }
    }
    this.level = handleLevel(level) || level;
    if (stdout) {
        this.stdout = stdout;
    } else if (typeof process !== 'undefined' && process.stdout && typeof LLOG_SKIP_USING_PROCESS === 'undefined') {
        //LLOG_SKIP_USING_PROCESS is defined in tests
        this.stdout = process.stdout;
    } else {
        this.stdout = {
            write: function(string) {
                //trim ending \n or spaces before logging
                console.log(string.replace(/\s+$/, ''));
            }
        };
    }
    this.displayTimestamp = options.displayTimestamp === true;
}

LLog.prototype.getDateString = function() {
    return new Date().toLocaleString();
};

LLog.prototype.exit = function() {
    if (typeof process !== 'undefined' && typeof process.exit === 'function') {
        process.exit(1);
    }
};

function toString(val) {
    var str;
    switch (typeof val) {
        case 'string':
            return val;
        case 'boolean':
            return val ? 'true' : 'false';
        case 'number':
            return String(val);
        case 'function':
            return 'function';
        case 'undefined':
            return 'undefined';
        case 'object':
            if (val === null) {
                return 'null';
            }
            if (val instanceof Date) {
                return Math.floor(val.getTime() / 1000);
            }
            if (val instanceof String) {
                return val;
            }
            if (val instanceof Number) {
                return String(val);
            }
            if (val instanceof Boolean) {
                return val.valueOf() ? 'true' : 'false';
            }
            if (typeof val.toJSON === 'function') {
                str = val.toJSON();
                //apparently toJSON prepares an object for stringify() doesn't convert to string
                if (typeof str === 'string' || str instanceof String) {
                    return str;
                }
                try {
                    //stringify automatically calls toJSON() so we'll let it handle that
                    return JSON.stringify(val);
                } catch (e) {
                    LLog.warn('failed JSON.stringify after toJSON in llog', e);
                    //lets continue on and see if we can do something else?
                }
            }
            //if its an error and has a message, otherwise just fallback to toString()
            //specifically look for data since rpc "errors" contain those and we
            //don't want to treat those as errors
            if (val instanceof Error || (val.hasOwnProperty('message') && val.hasOwnProperty('code') && !val.hasOwnProperty('data'))) {
                str = val.message;
                if (val.hasOwnProperty('code')) {
                    str += ' (Code: ' + val.code + ')';
                }
                return str
            }
            if (typeof val.toString === 'function') {
                str = val.toString();
                if (str === '[object Object]') {
                    //might as well json it since its a plain object
                    try {
                        str = JSON.stringify(val);
                    } catch (e) {
                        LLog.warn('failed JSON.stringify in toString in llog', e);
                        str = 'object';
                    }
                }
                return str;
            }
            return 'object';
    }
}

function escapeValue(val) {
    return jsesc(val);
}

function escapeQuoteValue(val) {
    return val.replace(/"/g, '\'');
}

LLog.prototype.log = function(lvl, message, kv) {
    var level = handleLevel(lvl);
    if (level < this.level) {
        return;
    }
    var parts = [
        '~',
        (levelToString[level] || 'DEBUG').toUpperCase(),
        '--',
        'no log message provided',
        '--'
    ];
    var msgIndex = 3;
    var k;
    if (this.displayTimestamp) {
        parts.splice(1, 0, '[' + this.getDateString() + ']');
        msgIndex = 4;
    }
    if (typeof message === 'string') {
        parts[msgIndex] = escapeValue(message);
    } else if (typeof message === 'object' && kv === undefined) {
        kv = message;
    }
    //shorthand for the common case of log.error('message', err)
    if (kv instanceof Error) {
        kv = {error: kv};
    } else if (typeof kv === 'string' || kv instanceof String) {
        kv = {string: kv};
    } else if (typeof kv === 'number' || kv instanceof Number) {
        kv = {number: kv};
    }
    for (k in kv) {
        if (kv.hasOwnProperty(k)) {
            // logstash doesn't handle escaped quotes: https://github.com/elastic/logstash/issues/1645
            parts.push(k + '="' + escapeQuoteValue(escapeValue(toString(kv[k]))) + '"');
        }
    }
    //if there were no kv's then just remove the trailing separator
    if (parts[parts.length - 1] === '--') {
        parts.pop();
    }
    this.stdout.write(parts.join(' ') + '\n');
};

if (typeof global !== 'undefined' && typeof Object.defineProperty === 'function') {
    global.LLOG_INSTANCE = global.LLOG_INSTANCE || null;
    Object.defineProperty(LLog, 'instance', {
        get: function() {
            if (!global.LLOG_INSTANCE) {
                global.LLOG_INSTANCE = new LLog();
            }
            return global.LLOG_INSTANCE;
        },
        set: function(newValue) {
            global.LLOG_INSTANCE = newValue;
        }
    });
    Object.defineProperty(LLog, 'displayTimestamp', {
        get: function() {
            return LLog.instance && LLog.instance.displayTimestamp;
        },
        set: function(newValue) {
            LLog.instance.displayTimestamp = !!newValue;
        }
    });
} else {
    LLog.instance = null;
}

LLog.log = function() {
    LLog.instance.log.apply(LLog.instance, Array.prototype.slice.call(arguments));
};

LLog.setLevel = function(level) {
    switch (typeof level) {
        case 'string':
            LLog.instance.level = stringToLevel[level.toLowerCase()] || 0;
            break;
        case 'number':
            LLog.instance.level = level;
            break;
        default:
            throw new Error('level sent to LLog.setLevel must be a string/number');
    }
};

LLog.getLevel = function(level) {
    return levelToString[LLog.instance.level];
};

LLog.debug = function() {
    //for some reason we need to call slice first to convert arguments to an array since concat is dumb
    LLog.log.apply(LLog.log, [LEVEL_DEBUG].concat(Array.prototype.slice.call(arguments)));
};

LLog.info = function() {
    LLog.log.apply(LLog.log, [LEVEL_INFO].concat(Array.prototype.slice.call(arguments)));
};

LLog.warn = function() {
    LLog.log.apply(LLog.log, [LEVEL_WARN].concat(Array.prototype.slice.call(arguments)));
};

LLog.error = function() {
    LLog.log.apply(LLog.log, [LEVEL_ERROR].concat(Array.prototype.slice.call(arguments)));
};

LLog.fatal = function() {
    LLog.log.apply(LLog.log, [LEVEL_FATAL].concat(Array.prototype.slice.call(arguments)));
    LLog.instance.exit();
};

module.exports = LLog;
