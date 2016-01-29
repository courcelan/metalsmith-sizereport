var chalk       = require('chalk'),
    prettyBytes = require('pretty-bytes'),
    gzipSize    = require('gzip-size'),
    Table       = require('cli-table');

module.exports = function (options) {
    "use strict";

    options          = options || {};
    options.gzip     = (options.gzip     !== undefined) ? options.gzip     : false;
    options.minifier = (options.minifier !== undefined) ? options.minifier : null;
    options.total    = (options.total    !== undefined) ? options.total    : true;

    var tableHeadCols = [
        'File',
        'Original'
    ];
    if (options.gzip) {
        tableHeadCols.push('Gzipped');
    }
    if (options.minifier) {
        tableHeadCols.push('Minified');
        if (options.gzip) {
            tableHeadCols.push('Gzipped');
        }
    }

    var fileCount = 0,
        totalSize = 0,
        totalGzippedSize = 0,
        totalMinifiedSize = 0,
        totalMinifiedGzippedSize = 0,
        gzippedSize,
        minifiedGzippedSize,
        minified,
        table = new Table({
            head:      tableHeadCols,
            //colWidths: [ 30, 12, 12, 12, 12 ],
            colAligns: [ 'left', 'right', 'right', 'right', 'right' ],
            style: {
                head:  [ 'gray' ]
            }
        });

    var getSizeToDisplay = function (size, key, filename) {
        var max = options[filename] || options['*'],
            value;

        if (max) {
            value = max[key];
        } else {
            value = options[key];
        }

        if (value && size > value) {
            return chalk.red(prettyBytes(size));
        }

        return prettyBytes(size);
    };

    return function (files, metalsmith, done) {
        Object.keys(files).forEach(function (file, index, arr) {
            var reported_file = files[file];

            gzippedSize       = gzipSize.sync(reported_file.contents);
            totalSize        += reported_file.contents.length;
            totalGzippedSize += gzippedSize;
            fileCount ++;

            var row = [
                file,
                chalk.magenta(getSizeToDisplay(reported_file.contents.length, 'maxSize', file))
            ];

            if (options.gzip) {
                row.push(chalk.blue(getSizeToDisplay(gzippedSize, 'maxGzippedSize', file)));
            }

            if (typeof options.minifier === 'function') {
                minified           = options.minifier('' + reported_file.contents, file);
                totalMinifiedSize += minified.length;

                row.push(getSizeToDisplay(minified.length, 'maxMinifiedSize', file));

                if (options.gzip) {
                    minifiedGzippedSize       = gzipSize.sync(minified);
                    totalMinifiedGzippedSize += minifiedGzippedSize;
                    row.push(getSizeToDisplay(minifiedGzippedSize, 'maxMinifiedGzippedSize', file));
                }
            }

            table.push(row);
        });

        if (fileCount > 0) {
            if (options.total === true) {
                var row = [
                    '',
                    chalk.green.bold(getSizeToDisplay(totalSize, 'maxTotalSize', '*'))
                ];

                if (options.gzip) {
                    row.push(chalk.green.bold(getSizeToDisplay(totalGzippedSize, 'maxTotalGzippedSize', '*')));
                }

                if (options.minifier) {
                    row.push(chalk.green.bold(getSizeToDisplay(totalMinifiedSize, 'maxTotalMinifiedSize', '*')));

                    if (options.gzip) {
                        row.push(chalk.green.bold(getSizeToDisplay(totalMinifiedGzippedSize, 'maxTotalMinifiedGzippedSize', '*')));
                    }
                }

                table.push(row);
            }

            console.log(table.toString());
        }

        done();
    }
};
