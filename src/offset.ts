import { getCode } from './util'

// Syntax search patterns
const isHashInclude = /^\s*#include\s+(%?(\w|\.)+)/i
const isMethod = /^(Method|ClassMethod)+\s([\w|%]*)/
const isComment = /^\s*(;|\/\/)/
const isHashHashContinue = /##continue/
const isJs = /^\s*&js</i
const isJscript = /^\s*&jscript</i
const isJavascript = /^\s*&javascript</i
const isHtml = /^\s*&html</i
const isSql = /&sql\(/i
const isMethodStart = /^{$/
const isEmptySql = /&sql\(\s*\)/i
const isBlank = /^\s*$/ 
const isCompilerDirective = /^\s*#/
const isMethodEnd = /^}$/
const isOpenCursor = /&sql\(\s*open/i
const isCloseCursor = /&sql\(\s*close/i

/*
 * Get the offset in a file from a position specified in labelLocationList
 * Returns [fileName, extension, startLine, endLine, error]
 */
export async function getOffset(workspaceFolderId, labelLocationList, offset) {
 
    const location = labelLocationList[0]
    const fileName = location.fileName
    const extension = location.extension

    if (extension === 'cls') return (await getOffsetObjectScript(workspaceFolderId, labelLocationList, offset))
    else if (extension === 'mac') return (await getOffsetObjectScript(workspaceFolderId, labelLocationList, offset))
    else if (extension === 'inc') return (await getOffsetObjectScript(workspaceFolderId, labelLocationList, offset))
    else if (extension === 'int') return (await getOffsetInt(workspaceFolderId, labelLocationList, offset))

    return [fileName, extension, 0, 0, 'Extension not recognized']
}


async function getOffsetObjectScript(workspaceFolderId, labelLocationList, targetOffset) {

    const location = labelLocationList.shift() // remove current location from list
    const startLine = location.sourceLine
    let fileName = location.fileName
    let extension = location.extension

    // Open and read the file
    let code = await getCode(workspaceFolderId, fileName, extension)
    if (!code.length) return [fileName, extension, 0, 0, 'File not found']

    let inSQL:boolean = false

    const js = new block(isJs, '<', '>')
    const jscript = new block(isJscript, '<', '>')
    const javascript = new block(isJavascript, '<', '>')
    const html = new block(isHtml, '<', '>')
    const sql = new block(isSql, '(', ')')

    let continuationLine = false

    // It is possible for &sql( ) and the like to start on a label line
    // so we must process the start line
    let offset:number = -1
    for (let sourceLine = startLine; sourceLine < code.length; sourceLine++) {

        // Get the line
        const line = code[sourceLine]

        // Method definition: Method( ... or ClassMethod( ...
        if ((extension === 'cls') && isMethod.test(line)) {
            offset++
            if (offset === targetOffset) return [fileName, extension, sourceLine, sourceLine, '']
            continue
        }

        // For classes skip any line comprising just { as it gets included on the same line as the 
        // label in the int code
        if ((extension === 'cls') && isMethodStart.test(line)) continue

        // Skip macro continuation lines
        if (continuationLine) {
            if (isHashHashContinue.test(line)) continue
            continuationLine = false
            continue
        }

        // All js lines are included verbatim
        if (js.check(line, sourceLine)) {
            offset++
            if (offset === targetOffset) return [fileName, extension, sourceLine, sourceLine, '']
            continue
        }
        if (jscript.check(line, sourceLine)) {
            offset++
            if (offset === targetOffset) return [fileName, extension, sourceLine, sourceLine, '']
            continue
        }
        if (javascript.check(line, sourceLine)) {
            offset++
            if (offset === targetOffset) return [fileName, extension, sourceLine, sourceLine, '']
            continue
        }

        // All html lines are included verbatim
        if (html.check(line, sourceLine)) {
            offset++
            if (offset === targetOffset) return [fileName, extension, sourceLine, sourceLine, '']
            continue
        }

        // Special case: an empty &sql() results in a single line of /*  */
        if (isEmptySql.test(line)) {
            offset++
            if (offset === targetOffset) return [fileName, extension, sourceLine, sourceLine, '']
            continue        
        }

        // All sql lines are included verbatim
        inSQL = sql.inBlock
        if (sql.check(line, sourceLine)) {

            if (isOpenCursor.test(line)) sql.isOpenCloseCursor = true
            if (isCloseCursor.test(line)) sql.isOpenCloseCursor = true

            offset++
            if (offset === targetOffset) return [fileName, extension, sourceLine, sourceLine, '']

            continue
        }

        // Query is on a single line
        if (sql.isBlock) {
            inSQL = true
            if (isOpenCursor.test(line)) sql.isOpenCloseCursor = true
            if (isCloseCursor.test(line)) sql.isOpenCloseCursor = true
        }

        // At end of sql block
        if (inSQL && (!sql.inBlock)) {
            offset++
            if (offset === targetOffset) return [fileName, extension, sourceLine, sourceLine, '']

            // for most queries .int contains an extra comment line, 
            // something like ;--- ** SQL PUBLIC Variables: %ROWCOUNT, %ROWID, %msg, SQLCODE
            // but for some later versions of IRIS the Open and Close cursor statements do not generate
            // this line
            if (!sql.isOpenCloseCursor) {
                offset++
                if (offset === targetOffset) return [fileName, extension, sql.startLine, sql.endLine, '']
            }

            // int contains extra line, typically do %0Ao or try {...}
            offset++
            if (offset === targetOffset) return [fileName, extension, sql.startLine, sql.endLine, '']

            continue
        }

        // If source line is blank then skip it
        if (isBlank.test(line)) continue

        // if we are in an inc then comment lines are skipped
        if ((extension=== 'inc') && (isComment.test(line))) continue

        // treat #include lines as if they were in-line here
        if (isHashInclude.test(line)) {
            const includeFile = line.match(isHashInclude)[1].replace(/\./g, '/')

            const includeCode = await getCode(workspaceFolderId, includeFile, 'inc')
            if (!includeCode.length) continue

            // Stack current location in the label location list (resume on the next line)
            const location = {sourceLine: sourceLine + 1, fileName: fileName, extension: extension}
            labelLocationList = [location, ...labelLocationList]

            // Continue by processing the include file from the beginning
            fileName = includeFile
            extension = 'inc'
            sourceLine = -1
            code = includeCode
            continue    
        }

        // Skip macro compiler directives (any line starting with #)
        if (isCompilerDirective.test(line)) {
            
            // If a macro line also contains ##continue then skip the next line as well
            if (isHashHashContinue.test(line)) continuationLine = true

            continue
        }

        // A line comprising just } indicates the end of a method
        // so we can stop searching for the offset
        if ((extension === 'cls') && isMethodEnd.test(line)) return [fileName, extension, sourceLine, sourceLine, 'Line not found']

        // This line will have made it into the int code
        offset++
        if (offset === targetOffset) return [fileName, extension, sourceLine, sourceLine, '']
    }

    // Location not found, nothing else on the stack
    if (labelLocationList.length === 0) return [fileName, extension, 0, 0, 'Line not found']

    // Continue processing includer
    const result = await getOffsetObjectScript(workspaceFolderId, labelLocationList, targetOffset - offset - 1)
    return result

}




async function getOffsetInt(workspaceFolderId, labelLocationList, offset) {

    let startLine:number = labelLocationList[0].sourceLine
    let fileName:string = labelLocationList[0].fileName
    let extension:string = labelLocationList[0].extension

    const code = await getCode(workspaceFolderId, fileName, extension)
    if (!code.length) return [fileName, extension, 0, 0, 'Line not found']

   // Zero offset
    if (offset === 0) return [fileName, extension, startLine, startLine, '', 0]

    let labelOffset = -1
    for (let sourceLine = startLine; sourceLine < code.length; sourceLine++) {
        labelOffset++
        if (labelOffset === offset) return [fileName, extension, sourceLine, sourceLine, '']
    }

    // If not found locate to end of file
    return [fileName, extension, code.length - 1, code.length - 1, 'Line not found']
}




// Block of js, html or sql
// Keep track of whether the code line is in a block or not
// It does this crudely by counting open and close brackets, when they match
// then we're done.
class block {
    openDelimiter:number
    closeDelimiter:number
    pattern:RegExp
    inBlock:boolean = false
    isBlock:boolean = false
    openCount:number = 0
    closeCount:number = 0
    startLine:number
    endLine:number
    isOpenCloseCursor:boolean

    constructor(pattern, openDelimiter, closeDelimiter) {
        this.openDelimiter = openDelimiter
        this.closeDelimiter = closeDelimiter
        this.pattern = pattern
        this.inBlock = false
    }

    // Check if this line is in a block
    check(line, lineNumber) {
        this.isBlock = false
        if (!this.inBlock) if (this.isStart(line)) {
            this.isBlock = true
            this.startLine = lineNumber
            this.endLine = lineNumber
            this.isOpenCloseCursor = false
        }
        if (this.inBlock) if (this.isEnd(line)) this.endLine = lineNumber + 1
        return this.inBlock
    }

    // Is this line the start of a block?
    isStart(line) {
        if (this.pattern.test(line)) this.inBlock = true
        return this.inBlock
        }

    // Is this line the end of a block?
    isEnd(line) {
        this.openCount += line.split(this.openDelimiter).length
        this.closeCount += line.split(this.closeDelimiter).length

        // If the number of open and close brackets match then we are done
        if (this.openCount === this.closeCount) {
            this.inBlock = false
            this.openCount = 0
            this.closeCount = 0
        }
        return this.inBlock
    }
}

