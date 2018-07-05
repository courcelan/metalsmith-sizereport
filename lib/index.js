const chalk = require('chalk')
const prettyBytes = require('pretty-bytes')
const gzipSize = require('gzip-size')
const Table = require('cli-table')

const defaults= {
    gzip: false,
    minifier: null,
    total: true
}

module.exports = function (options = defaults) {
    let {
        gzip,
        minifier,
        total
    } = options

    const tableHeadCols = [
        'File',
        'Original'
    ]

    if (gzip) tableHeadCols.push('Gzipped')
    if (minifier) tableHeadCols.push('Minified')
    if (gzip && minifier) tableHeadCols.push('Gzipped')


    const initTable = () => {
        return new Table({
            head: tableHeadCols,
            colAligns: [ 'left', 'right', 'right', 'right', 'right' ],
            style: {
                head: [ 'gray' ]
            }
        })
    }

    const getSizeToDisplay = (size, key, filename) => {
        const max = options[filename] || options['*']
        const value = (max) ? max[key] : options[key]

        return (value && size > value)
            ? chalk.red( prettyBytes(size) )
            : prettyBytes(size)
    }

    const reportMagenta = (report, label, file) => chalk.magenta(getSizeToDisplay(report, label, file))
    const reportBlue = (report, label, file) => chalk.blue(getSizeToDisplay(report, label, file))
    const reportTotal = (report, label, file) => chalk.green.bold(getSizeToDisplay(report, label))

    return function (files, metalsmith, done) {
        let fileCount = 0,
            totalSize = 0,
            totalGzippedSize = 0,
            totalMinifiedSize = 0,
            totalMinifiedGzippedSize = 0,
            gzippedSize,
            minifiedGzippedSize,
            minified,
            table = initTable()

        Object.keys(files).forEach(function (file, index, arr) {
            let reported_file = files[file]

            gzippedSize = gzipSize.sync(reported_file.contents)
            totalSize += reported_file.contents.length
            totalGzippedSize += gzippedSize
            fileCount ++

            let row = [
                file,
                reportMagenta(reported_file.contents.length, 'maxSize', file)
            ];

            if (gzip) row.push(reportBlue(gzippedSize, 'maxGzippedSize', file))

            if (typeof minifier === 'function') {
                minified = minifier('' + reported_file.contents, file)
                totalMinifiedSize += minified.length

                row.push(getSizeToDisplay(minified.length, 'maxMinifiedSize', file))

                if (gzip) {
                    minifiedGzippedSize = gzipSize.sync(minified)
                    totalMinifiedGzippedSize += minifiedGzippedSize
                    row.push(getSizeToDisplay(minifiedGzippedSize, 'maxMinifiedGzippedSize', file))
                }
            }

            table.push(row)
        })

        if (fileCount > 0) {
            if (total === true) {
                var row = [
                    '',
                    reportTotal(totalSize, 'maxTotalSize', '*')
                ];

                if (gzip) row.push( reportTotal(totalGzippedSize, 'maxTotalGzippedSize') )
                if (minifier) row.push( reportTotal(totalMinifiedSize, 'maxTotalMinifiedSize') )
                if (gzip && minifier) row.push( reportTotal(totalMinifiedGzippedSize, 'maxTotalMinifiedGzippedSize') )

                table.push(row)
            }

            console.log(table.toString())
        }

        done()
    }
};
