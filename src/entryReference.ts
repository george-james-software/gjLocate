/* The entryReference class is a container for all the elements of an
 * error message or entryref
 *
 * entryref is the term used to describe the syntax of the argument to a DO
 * command and specifies a code location in a .int routine.  
 * Typically this is of the form label+offset^routine.  All parts
 * are optional, so label, +offset and ^routine are all valid entryrefs.
 * An error message comprises typically of <ERRORCODE>entryref extraInfo
 * where <ERRORCODE> is the type of error that has occurred.
 */

export class entryReference {
    errorCode:string = ''
    label:string = '~'
    offset:number = 0
    routine:string = ''
    extension:string = ''
    extraInfo:string = ''
    className:string = ''

    // Returns path and name of file corresponding to className (excludes extension)
    fileName() {
        return this.className.split('.').join['/']
    }

    displayName() {
        if (this.className !== '') return this.className.replace(/\//g, '.') + '.' + this.extension
        if (this.routine !== '') {
            let routine = '^' + this.routine.replace(/\//g, '.')
            if (this.extension !== '') routine += '.' + this.extension
            return  routine
        }
        return 'Unknown'
    }
}