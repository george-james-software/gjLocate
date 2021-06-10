import { getCode } from './util'

// Search patterns
const isLabel = /^((%|(%?\w+){1})[\s\(])/ // % or optionally % followed by at least one word-character followed by whitespace or (  
const isHashInclude = /\s*#include\s+(%?(\w|\.)+)/i
const isMethod = /^(Method|ClassMethod)+\s([\w|%]*)/
const isMethodEnd = /^}$/


export async function getLabelMap(workspaceFolderId, fileName, extension, labelLocationList, depth) {
    const code = await getCode(workspaceFolderId, fileName, extension)
    if (!code.length) return []
    
    let labelMap:{}

    if (extension === 'cls') labelMap = await labelMapClass(workspaceFolderId, code, fileName, extension, labelLocationList, depth)
    else if (extension === 'mac') labelMap = await labelMapMac(workspaceFolderId, code, fileName, extension, labelLocationList, depth)
    else if (extension === 'int') labelMap = await labelMapInt(workspaceFolderId, code, fileName, extension, labelLocationList, depth)
    else if (extension === 'inc') labelMap = await labelMapInc(workspaceFolderId, code, fileName, extension, labelLocationList, depth)

    // Add pseudo label ~ for entryrefs without a label
    labelMap['~'] = [ {sourceLine: -1, fileName: fileName, extension: extension} ]

    return labelMap
}


async function labelMapClass(workspaceFolderId, code, fileName, extension, labelLocationList, depth) {
    let labelMap = {}

    let inMethod:boolean = false

    for (let sourceLine = 0; sourceLine < code.length; sourceLine++) {
        const line = code[sourceLine]

        // Check code within a method for embedded labels
        if (inMethod) {

            // Does this line contain a label
            if (isLabel.test(line)) {
                const labelName = line.match(isLabel)[2]

                // Add to maps
                labelMap[labelName] = [ {sourceLine: sourceLine, fileName: fileName, extension: extension}, ...labelLocationList]
            }

            if (isHashInclude.test(line)) {
                const includeFile = line.match(isHashInclude)[1].replace(/\./g, '/')
                if ((depth ==='deep') || !includeFile.includes('%')) {
                    labelLocationList.push( {sourceLine: sourceLine + 1, fileName: fileName, extension: extension} )
                    const includeLabelMap = await getLabelMap(workspaceFolderId, includeFile, 'inc', labelLocationList, depth)
                    labelMap = {...labelMap, ...includeLabelMap}
                    labelLocationList.pop()
                }
            }


            // A line comprising just } indicates the end of the method
            if (inMethod && isMethodEnd.test(line)) inMethod = false

        }
        else {

            // Set inMethod flag if this line starts a method
            if (isMethod.test(line)) {
                const labelName = line.match(isMethod)[2]

                // Add to maps
                labelMap[labelName] = [ {sourceLine: sourceLine, fileName: fileName, extension: extension}, ...labelLocationList]

                inMethod = true
            }
        }
    }

    // Traverse superclasses (TODO left to right or right to left)
    const superClasses = getSuperClasses(code)
    for (let i=0; i < superClasses.length; i++) {
        const superClass = superClasses[i].split('.').join('/')
        if ((depth === 'deep') || !superClass.includes('%')) {
            const superClassMap = await getLabelMap(workspaceFolderId, superClass, 'cls', labelLocationList, depth)
            labelMap = {...labelMap, ...superClassMap}
        }
    }

    return labelMap
}


async function labelMapMac(workspaceFolderId, code, fileName, extension, labelLocationList, depth) {
 
    let labelMap = {}

    let label:string = ''

    for (let sourceLine = 0; sourceLine < code.length; sourceLine++) {
        const line = code[sourceLine]

        if (isLabel.test(line)) {
            label = line.match(isLabel)[2]
            labelMap[label] = [ {sourceLine: sourceLine, fileName: fileName, extension: extension}, ...labelLocationList]
        }

        if (isHashInclude.test(line)) {
            const includeFile = line.match(isHashInclude)[1]
            if ((depth ==='deep') || !includeFile.includes('%')) {
                labelLocationList.push( {sourceLine: sourceLine + 1, fileName: fileName, extension: extension} )
                const includeLabelMap = await getLabelMap(workspaceFolderId, includeFile, 'inc', labelLocationList, depth)
                labelMap = {...labelMap, ...includeLabelMap}
                labelLocationList.pop()
            }
        }

    }
    return labelMap
}


async function labelMapInt(workspaceFolderId, code, fileName, extension, labelLocationList, depth) {
    const labelMap = {}

    let label:string = ''

    for (let sourceLine = 0; sourceLine < code.length; sourceLine++) {
        const line = code[sourceLine]

        if (isLabel.test(line)) {
            label = line.match(isLabel)[2]
            labelMap[label] = [ {sourceLine: sourceLine, fileName: fileName, extension: extension}, ...labelLocationList]
        }
    }
    return labelMap
}


async function labelMapInc(workspaceFolderId, code, fileName, extension, labelLocationList, depth) {
    const labelMap = await labelMapMac(workspaceFolderId, code, fileName, extension, labelLocationList, depth)
    return labelMap
}


// Find the superclasses from a class definition
// returns a list of class names in left to right order
function getSuperClasses(code) {
    const classSearch = /^Class.*Extends\s+/
    const extendsArgumentSearch1 = /^Class.*Extends\s+\((.+)\)/
    const extendsArgumentSearch2 = /^Class.*Extends\s+(\S+)/

    for (let i=0; i<code.length; i++) {
        const line = code[i]
        if (classSearch.test(line)) {
            if (extendsArgumentSearch1.test(line)) {
                const classExtends = line.match(extendsArgumentSearch1)[1]
                const classList = classExtends.replace(/\s+/g, '')
                return classList.split(',')
            }
            if (extendsArgumentSearch2.test(line)) {
                const classExtends = line.match(extendsArgumentSearch2)[1]
                return [classExtends]
            }
        }
    }
    return []
}