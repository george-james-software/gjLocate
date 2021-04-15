'use strict'

import * as vscode from 'vscode'
import { getFileUri, removePrefix } from './util'
import { decodeInput} from './decodeInput'
import { getLabelMap } from './labelMap'
import { getOffset } from './offset'

// Tests:
//  Current routine
//    label
//    +offset
//    non-existant label
//    +0
//    +offset beyond end of routine
//    label+offset
//  Current class
//    method
//    +offset (not supported)
//    non-existant method
//    class method
//    +0 (not supported)
//    +offset beyond (not supported)
//    lines containing whitespace
//    method+offset
//    class method+offset
//  INT Routine
//    ^routine
//    label^routine
//    label+offset^routine
//    +offset^routine
//  MAC Routine
//    As for INT routine
//    Lines containing whitespace
//
//  INC routine
//  Code in Superclasses!
// Inline code in .INC files (eg LDAP.mac includes %syLDAPfunc.inc)
// 

// If label not found in a class then check it's superclasses!
// Locate class declaration and get list of superclasses



export function register(context: vscode.ExtensionContext) {

    
    let gjLocate = vscode.commands.registerCommand('gjLocate', async () => {

        // The workspace root uri
        // For a multi-rooted workspace assume first root
        const workspaceUri = vscode.workspace.workspaceFolders[0].uri

        // Is this a serenji workspace or a vscode-objectscript workspace
        const serenji = (workspaceUri.scheme === 'serenji')

        // Read from clipboard
        const clipboard = await vscode.env.clipboard.readText()

        // If clipboard contains something that looks like an error message then use it
        // as the default
        const [defaultValue, auto] = getDefault(clipboard)

        // Prompt for an entryref
        let userInput = defaultValue
        if (!auto) {
            userInput = await vscode.window.showInputBox({
                prompt: 'Enter label+offset^routine to go to it\'s source location', 
                placeHolder: '',
                ignoreFocusOut: true,
                value: defaultValue
            })
        }
        if (userInput === undefined) return


        // Display the user input so they know what they entered
        vscode.window.showInformationMessage(userInput)

        const entryref = decodeInput(userInput)


        // Default to current filename if no routine or classname provided in entryref)
        if ((entryref.routine === '') && (entryref.className === '')) {
            if (vscode.window.activeTextEditor) {
                const path = vscode.window.activeTextEditor.document.uri.path

                // If path is part of this workspace root
                const pathArray = path.split(workspaceUri.path)
                if (pathArray[1] !== undefined) { 
                    
                    let fileName
                    if (serenji) fileName = removePrefix(pathArray[1], '/') 
                    else fileName = removePrefix(pathArray[1], '/src/')
                    
                    const prefix = fileName.split('.')[0]
                    const extension = fileName.split('.')[1]
                    if (extension === 'cls') {
                        entryref.className = prefix

                        // Strip z prefix from label if there is one
                        if (entryref.label.substr(0, 1) === 'z') {
                            entryref.label = entryref.label.substr(1) 
                        }
                    }
                    else entryref.routine = prefix

                    entryref.extension = extension
                }
            }
        }

        if ((entryref.routine === '') && (entryref.className === '')) {
            vscode.window.showErrorMessage(`No class or routine name provided`)
            return
        }

        // Check class exists
        if (entryref.extension === 'cls') {
            const clsUri = getFileUri(entryref.className, 'cls')
            try {
                await vscode.workspace.fs.stat(clsUri)
            } 
            catch {
                vscode.window.showInformationMessage(`Class ${ entryref.displayName() } not found`)
                return
            }
        }

        // cls or mac or int or inc
        if (entryref.extension === '') {
            const clsUri = getFileUri(entryref.routine, 'cls')
            const macUri = getFileUri(entryref.routine, 'mac')
            const intUri = getFileUri(entryref.routine, 'int')
            const incUri = getFileUri(entryref.routine, 'inc')
            try {
                await vscode.workspace.fs.stat(clsUri)
                entryref.extension = 'cls'
                entryref.className = entryref.routine
                entryref.routine = ''
            } catch {
                try {
                    await vscode.workspace.fs.stat(macUri)
                    entryref.extension = 'mac'
                } catch {
                    try {
                        await vscode.workspace.fs.stat(intUri)
                        entryref.extension = 'int'
                    }
                    catch {
                        try {
                            await vscode.workspace.fs.stat(incUri)
                            entryref.extension = 'inc'
                        }
                        catch {
                            vscode.window.showInformationMessage(`Routine ${entryref.displayName() } not found`)
                            return
                        }
                    }
                }
            }
        }


        // Build a label map
        let labelMap:{}
        if (entryref.extension === 'cls') labelMap = await getLabelMap(entryref.className, 'cls', [], 'shallow')
        else labelMap = await getLabelMap(entryref.routine, entryref.extension, [], 'shallow')

        // Does label exist?
        if (labelMap[entryref.label] === undefined) {

            // Label not found so use deep search to create more extensive labelMap
            if (entryref.extension === 'cls') labelMap = await getLabelMap(entryref.className, 'cls', [], 'deep')
            else labelMap = await getLabelMap(entryref.routine, entryref.extension, [], 'deep')

            if (labelMap[entryref.label] === undefined) {
                vscode.window.showErrorMessage('Label ' + entryref.label + ' not found in ' + entryref.displayName() )
                return
            }
        }
        
        // If no label or offset then default to first line which is +1
        if ((entryref.label === '~') && (entryref.offset === 0)) {
            entryref.offset = 1
        }

        // Locate line numbers of the corresponding source code
        const labelLocationList = labelMap[entryref.label]
        const location = await getOffset(labelLocationList, entryref.offset)
        const [fileName, extension, startLineNumber, endLineNumber, error] = location

        if (error !== '') {
            vscode.window.showErrorMessage(error)
        }


        // Open the file in the vscode workspace so the user can see it
        const fileUri = getFileUri(fileName, extension)

        await vscode.commands.executeCommand('vscode.open', fileUri)
        await vscode.workspace.openTextDocument(fileUri)

        // Go to line in file
        let header = 0
        if (!serenji) {
            if (extension === 'mac') header = 1
            if (extension === 'int') header = 1
            if (extension === 'inc') header = 1
        }

        const editor = vscode.window.activeTextEditor
        const range1 = editor.document.lineAt(startLineNumber + header).range
        const range2 = editor.document.lineAt(endLineNumber + header).range
        editor.selection =  new vscode.Selection(range1.start, range2.end)
        editor.revealRange(range1,vscode.TextEditorRevealType.InCenterIfOutsideViewport)
        
    })

    context.subscriptions.push(gjLocate)

}



// If clipboard content looks anything like an entryref or error reference then we'll use it 
// as the default value
function getDefault( clipboard:string ):[string, boolean] {
    const fingerprint = ' // gj::locate // baac5822-7a65-43d5-80d5-10897c2e650b'
    let defaultValue:string = ''


    let auto:boolean = false
    if (clipboard.includes(fingerprint)) {
        auto = true
        clipboard = clipboard.split(fingerprint)[0]
        
        // Rewrite clipboard with fingerprint removed
        vscode.env.clipboard.writeText(clipboard)
    }

    if (/<.*>.*\^.*/.test(clipboard)) defaultValue = clipboard // Match <any>any^any
    else if (/.*\^.*/.test(clipboard)) defaultValue = clipboard // Match any^any
    else if (/.*\+\d/.test(clipboard)) defaultValue = clipboard // Match any+number
    return [defaultValue, auto]
}



