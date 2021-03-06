var logFilename = '../log.js',
    log = require(logFilename),
    requireReload = require('require-reload')(require),
    lastWrite = '';

exports.getInstanceCreates = function(test) {
    test.notEqual(log.instance, null);
    test.done();
};

exports.setupStdout = function(test) {
    log.instance = new log({
        level: 'debug',
        stdout: {
            write: function(str) {
                lastWrite = str;
            }
        },
        displayTimestamp: true
    });
    log.instance.getDateString = function() {
        return 'date';
    };
    test.done();
};

exports.debug = function(test) {
    log.setLevel('debug');
    log.debug('test');
    test.equal(lastWrite, '~ [date] DEBUG -- test\n');
    test.done();
};
exports.debugIgnore = function(test) {
    log.setLevel('info');
    lastWrite = 'skip';
    log.debug('test');
    test.equal(lastWrite, 'skip');
    test.done();
};

exports.info = function(test) {
    log.setLevel('info');
    log.info('test');
    test.equal(lastWrite, '~ [date] INFO -- test\n');
    test.done();
};
exports.infoIgnore = function(test) {
    log.setLevel('warn');
    lastWrite = 'skip';
    log.info('test');
    test.equal(lastWrite, 'skip');
    test.done();
};

exports.warn = function(test) {
    log.setLevel('warn');
    log.warn('test');
    test.equal(lastWrite, '~ [date] WARN -- test\n');
    test.done();
};
exports.warnIgnore = function(test) {
    log.setLevel('error');
    lastWrite = 'skip';
    log.warn('test');
    test.equal(lastWrite, 'skip');
    test.done();
};

exports.error = function(test) {
    log.setLevel('error');
    log.error('test');
    test.equal(lastWrite, '~ [date] ERROR -- test\n');
    test.done();
};

exports.errorIgnore = function(test) {
    log.setLevel('fatal');
    lastWrite = 'skip';
    log.error('test');
    test.equal(lastWrite, 'skip');
    test.done();
};

exports.fatal = function(test) {
    test.expect(2);
    log.setLevel('fatal');
    log.instance.exit = function() {
        test.ok(true);
    };
    log.fatal('test');
    test.equal(lastWrite, '~ [date] FATAL -- test\n');
    test.done();
};

exports.booleanKeyVal = function(test) {
    log.setLevel('debug');
    log.debug('', {test: true});
    test.equal(lastWrite, '~ [date] DEBUG --  -- test="true"\n');
    log.debug('', {test: false});
    test.equal(lastWrite, '~ [date] DEBUG --  -- test="false"\n');
    log.debug('', {test: new Boolean(false)});
    test.equal(lastWrite, '~ [date] DEBUG --  -- test="false"\n');
    test.done();
};

exports.numericKeyVal = function(test) {
    log.setLevel('debug');
    log.debug('', {test: 1});
    test.equal(lastWrite, '~ [date] DEBUG --  -- test="1"\n');
    log.debug('', {test: '1'});
    test.equal(lastWrite, '~ [date] DEBUG --  -- test="1"\n');
    log.debug('', {test: new Number(1)});
    test.equal(lastWrite, '~ [date] DEBUG --  -- test="1"\n');
    test.done();
};

exports.stringKeyVal = function(test) {
    log.setLevel('debug');
    log.debug('', {test: ''});
    test.equal(lastWrite, '~ [date] DEBUG --  -- test=""\n');
    log.debug('', {test: 'val'});
    test.equal(lastWrite, '~ [date] DEBUG --  -- test="val"\n');
    log.debug('', {test: new String('str')});
    test.equal(lastWrite, '~ [date] DEBUG --  -- test="str"\n');
    log.debug('', {test: new String('st"r')});
    test.equal(lastWrite, '~ [date] DEBUG --  -- test="st\'r"\n');
    test.done();
};

exports.functionKeyVal = function(test) {
    log.setLevel('debug');
    log.debug('', {test: test.done});
    test.equal(lastWrite, '~ [date] DEBUG --  -- test="function"\n');
    test.done();
};

exports.undefinedKeyVal = function(test) {
    log.setLevel('debug');
    log.debug('', {test: undefined});
    test.equal(lastWrite, '~ [date] DEBUG --  -- test="undefined"\n');
    test.done();
};

exports.nullKeyVal = function(test) {
    log.setLevel('debug');
    log.debug('', {test: null});
    test.equal(lastWrite, '~ [date] DEBUG --  -- test="null"\n');
    test.done();
};

exports.jsonObjKeyVal = function(test) {
    log.setLevel('debug');
    log.debug('', {test: {k: 'v'}});
    test.equal(lastWrite, '~ [date] DEBUG --  -- test="{\'k\':\'v\'}"\n');
    test.done();
};

exports.toJSONKeyVal = function(test) {
    log.setLevel('debug');
    log.debug('', {test: {toJSON: function() { return 'testJSON'; }}});
    test.equal(lastWrite, '~ [date] DEBUG --  -- test="testJSON"\n');
    log.debug('', {test: {toJSON: function() { return {k: 'v'}; }}});
    test.equal(lastWrite, '~ [date] DEBUG --  -- test="{\'k\':\'v\'}"\n');
    test.done();
};

exports.miscKeyVal = function(test) {
    log.setLevel('debug');
    log.debug('', 'test');
    test.equal(lastWrite, '~ [date] DEBUG --  -- string="test"\n');
    log.debug('', 1);
    test.equal(lastWrite, '~ [date] DEBUG --  -- number="1"\n');
    test.done();
};

exports.unicodeEscape = function(test) {
    log.setLevel('debug');
    log.debug('\u2665', {k: '\u2665'});
    test.equal(lastWrite, '~ [date] DEBUG -- \\u2665 -- k="\\u2665"\n');
    test.done();
};

exports.errorKeyVal = function(test) {
    log.setLevel('debug');
    log.debug('', {error: new Error('test')});
    test.equal(lastWrite, '~ [date] DEBUG --  -- error="test"\n');
    //test the shorthand
    log.debug('', new Error('test'));
    test.equal(lastWrite, '~ [date] DEBUG --  -- error="test"\n');
    log.debug('', {error: {message: 'test', code: 1}});
    test.equal(lastWrite, '~ [date] DEBUG --  -- error="test (Code: 1)"\n');
    log.debug('', {error: {message: 'test', code: 1, data: 'hey'}});
    test.equal(lastWrite, '~ [date] DEBUG --  -- error="{\'message\':\'test\',\'code\':1,\'data\':\'hey\'}"\n');
    test.done();
};

exports.date = function(test) {
    log.setLevel('debug');
    var oldDateFn = log.instance.getDateString;
    log.instance.getDateString = log.prototype.getDateString;
    //this depends on debug running within 1 second
    var date = (new Date()).toLocaleString();
    log.debug('');
    test.equal(lastWrite, '~ [' + date + '] DEBUG -- \n');
    log.displayTimestamp = false;
    log.debug('');
    test.equal(lastWrite, '~ DEBUG -- \n');
    log.displayTimestamp = true;
    log.instance.getDateString = oldDateFn;
    test.done();
};

exports.defaultLevel = function(test) {
    var l = new log();
    test.equal(l.level, 1);

    process.env.LLOG_LEVEL = 'warn';
    log = requireReload(logFilename);
    l = new log();
    test.equal(l.level, 2);

    delete process.env.LLOG_LEVEL;

    test.done();
};

exports.persistInstance = function(test) {
    log.setLevel('error');

    log = requireReload(logFilename);

    test.equal(log.getLevel(), 'error');
    test.done();
};
