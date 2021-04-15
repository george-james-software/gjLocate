import { entryReference } from './entryReference'
import { removePrefix, removeSuffix } from './util'


export function decodeInput(userInput) {

    let entryref

    // Decode error message
    if (/<.*>.*\^.*/.test(userInput)) {
        entryref = decodeErrorReference(userInput)        
    }
    else {
        if (/\^/.test(userInput)) {
            entryref = decodeEntryReference(userInput)
        }
        else {
            if (/\./.test(userInput)) {
                entryref = decodeClassName(userInput)
            }
            else {
                entryref = decodeLabelPlusOffset(userInput) // label+offset in current document
            }
        }
    }

    return entryref
}


function decodeCompileError(userInput:string) {
    const entryref = new entryReference
 
    const bits = userInput.split('[')
 
    entryref.errorCode = userInput.split(' ')[3]
 
    const firstPart = bits[1].substring(0, bits[1].length - 1)
    const labelPlusOffset:string = firstPart.split('^')[0]
    entryref.routine = firstPart.split('^')[1]

    entryref.label = labelPlusOffset.split('+')[0]
    
    let offset:string|undefined = labelPlusOffset.split('+')[1]
    if (offset === undefined) offset = ''
    entryref.offset = +offset

    return entryref
}


function decodeErrorReference(userInput:string) {

    const errorCode:string = userInput.split('>')[0] + '>'
    const suffix:string = removePrefix(userInput, '>')

    const entryReference:string = suffix.split(' ')[0]
    let extraInfo:string = removePrefix(suffix,' ')
    
    // Strip asterisk if present
    if (extraInfo.substr(0,1) === '*') {
        extraInfo = extraInfo.substr(1)
    }

    const entryref = decodeEntryReference(entryReference)

    entryref.errorCode = errorCode
    entryref.extraInfo = extraInfo

    return entryref
}


// Decode label+offset^routine, returns entryref object
function decodeEntryReference(userInput:string) {

    const entryref = new entryReference

    const labelPlusOffset:string = userInput.split('^')[0]
    const routine = userInput.split('^')[1]
    const label = labelPlusOffset.split('+')[0]
 
    // If routine contains dots and ends with a numeric suffix or ends with .cls then it is likely a class
    if ((routine.split('.').length > 2) && ((/.*\.\d+$/.test(routine)) || (/.*\.cls$/.test(routine) ))) {
        
        // Remove .n or .cls suffix and replace dots with slashes
        const routineDotArray = routine.split('.')
        const className = routineDotArray.slice(0, -1).join('/')

        entryref.className = className
        entryref.extension = 'cls'

        // Strip z prefix from label if there is one (don't do this if entryref ended in .cls)
        if (label.substr(0, 1) === 'z') {
            entryref.label = label.substr(1) 
        }
        else entryref.label = label

    }
    else {
        entryref.routine = routine
        entryref.label = label
    }
    
    if (entryref.label === '') entryref.label = '~'

    let offset:string|undefined = labelPlusOffset.split('+')[1]
    if (offset === undefined) offset = ''
    entryref.offset = +offset

    return entryref
}


function decodeLabelPlusOffset(userInput:string) {

    const entryref = new entryReference

    const labelPlusOffset:string = userInput

    entryref.label = labelPlusOffset.split('+')[0]
    
    let offset:string|undefined = labelPlusOffset.split('+')[1]
    if (offset === undefined) offset = ''
    entryref.offset = +offset

    if (entryref.label === '') entryref.label = '~'

    return entryref
}

// Routine or ClassName, eg Aviation.Crew, Aviation.Crew.cls, Aviation.Crew.1
function decodeClassName(userInput) {

    const entryref = new entryReference

    // If user input ends with a numeric suffix or ends with .cls then it is likely a class
    if (((/\.\d+$/.test(userInput)) || (/\.cls$/i.test(userInput) ))) {
        
        entryref.className = removeSuffix(userInput, '.').replace(/\./g, '/')
        entryref.extension = 'cls'
    }
    else if (/\.mac$/i.test(userInput)) {
        entryref.routine = removeSuffix(userInput, '.').replace(/\./g, '/')
        entryref.extension = 'mac'
    }
    else if (/\.int$/i.test(userInput)) {
        entryref.routine = removeSuffix(userInput, '.').replace(/\./g, '/')
        entryref.extension = 'int'
    }
    else if (/\.inc$/i.test(userInput)) {
        entryref.routine = removeSuffix(userInput, '.').replace(/\./g, '/')
        entryref.extension = 'inc'
    }
    else {
        entryref.routine = userInput.replace(/\./g, '/')
    }    

    return entryref
}