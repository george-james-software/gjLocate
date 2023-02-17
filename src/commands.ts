'use strict'

import * as vscode from 'vscode'
import { uriEqual, getFileUri, removePrefix } from './util'
import { decodeInput} from './decodeInput'
import { getLabelMap } from './labelMap'
import { getOffset } from './offset'


export function register(context: vscode.ExtensionContext) {

    const gjLocateISM = vscode.commands.registerCommand('gjLocate.intersystems-servermanager', async (namespaceTreeItem) => {
        const idArray = namespaceTreeItem.id.split(':')
        const serverId = idArray[1]
        const namespace = idArray[3]

        const serenjiServerId = serverId
        const serenjiWorkspaceUri = vscode.Uri.parse(`serenji://${serenjiServerId}/${namespace}`)

        const workspaceFoldersLength = vscode.workspace.workspaceFolders.length        

        // Is the workspace folder we want already open?
        let folderId = workspaceFoldersLength
        for (let i = 0 ; i < workspaceFoldersLength ; i++) {
            const uri = vscode.workspace.workspaceFolders[i].uri
            if (uriEqual(uri, serenjiWorkspaceUri)) {
                folderId = i
                break
            }
        }

        // If no matching folder then add a new namespace specific one at the end
        // Can't add it at the beginning because it causes VS Code to reload the extension
        if (folderId === workspaceFoldersLength) {
            const name = `Serenji: ${serverId} ${namespace}`        
            const ok = vscode.workspace.updateWorkspaceFolders(folderId, 0, {uri: serenjiWorkspaceUri, name: name})
        }

        // Set focus to the workspace folder
        await vscode.commands.executeCommand('workbench.view.explorer')
        await vscode.commands.executeCommand('workbench.explorer.fileView.focus')

        // Invoke gjLocate
        vscode.commands.executeCommand('gjLocate', folderId)
    })

    context.subscriptions.push(gjLocateISM) 


    let gjLocate = vscode.commands.registerCommand('gjLocate', async (workspaceFolderId = -1) => {

        // If there are no workspaces open then do nothing
        if (!vscode.workspace.workspaceFolders) return

        // If no workspace folder provided then try to find one
        if (workspaceFolderId === -1) {
            const workspaceFoldersLength = vscode.workspace.workspaceFolders.length

            // If only one workspace then that's the one
                if (workspaceFoldersLength === 1) workspaceFolderId = 0
            else {

                // If there's an active document then find it's workspace and use that
                if (vscode.window.activeTextEditor) {
                    const currentUri = vscode.window.activeTextEditor.document.uri
                    if (currentUri.scheme !== 'output') {

                        const currentFolderUri = currentUri.with({path: '/' + currentUri.path.split('/').slice(1,2).join('/')})
                        for (let i = 0 ; i < workspaceFoldersLength ; i++) {
                            const uri = vscode.workspace.workspaceFolders[i].uri
                            if (uriEqual(uri, currentFolderUri)) {
                                workspaceFolderId = i
                                break
                            }
                        }           
                    }
                }            
            
                // If no active document or didn't find it then ask the user
                if (workspaceFolderId === -1) {
                    const workspacePick = await pickWorkspaceFolder()
                    if (!workspacePick) return

                    workspaceFolderId = workspacePick.id
                }
            }
        }

        // The workspace root uri
        const workspaceUri = vscode.workspace.workspaceFolders[workspaceFolderId].uri

        // Get the worspace scheme.  It may be serenji, isfs, isfs-readonly or file
        const scheme = workspaceUri.scheme
    
        // Read from clipboard
        const clipboard = await vscode.env.clipboard.readText()

        // If clipboard contains something that looks like an error message then use it
        // as the default
        const [defaultValue, auto] = getDefault(clipboard)

        // Prompt for an entryref
        let userInput = defaultValue
        if (!auto) {
            userInput = await vscode.window.showInputBox({
                prompt: 'Enter method+offset^Package.Class or label+offset^routine to go to the source', 
                placeHolder: '',
                ignoreFocusOut: false,
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

                // Focus is sometimes in an output panel
                if (vscode.window.activeTextEditor.document.uri.scheme === 'output') {
                    vscode.window.showErrorMessage('Please set focus to a file or document')
                    return
                }            

                const path = vscode.window.activeTextEditor.document.uri.path

                // If path is part of this workspace root
                const pathArray = path.split(workspaceUri.path)
                if (pathArray[1] !== undefined) { 
                    
                    let fileName
                    if (scheme === 'serenji') fileName = removePrefix(pathArray[1], '/') 
                    else if (scheme === 'isfs') fileName = pathArray[1]
                    else if (scheme === 'isfs-readonly') fileName = pathArray[1]
                    else fileName = removePrefix(pathArray[1], '/src/')

                    let fileNameArray = fileName.split('.')
                    const extension = fileNameArray.pop()
                    const prefix = fileNameArray.join('.')
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
            const clsUri = await getFileUri(workspaceFolderId, entryref.className, 'cls')
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
            const clsUri = await getFileUri(workspaceFolderId, entryref.routine, 'cls')
            const macUri = await getFileUri(workspaceFolderId, entryref.routine, 'mac')
            const intUri = await getFileUri(workspaceFolderId, entryref.routine, 'int')
            const incUri = await getFileUri(workspaceFolderId, entryref.routine, 'inc')
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
        if (entryref.extension === 'cls') labelMap = await getLabelMap(workspaceFolderId, entryref.className, 'cls', [], 'shallow')
        else labelMap = await getLabelMap(workspaceFolderId, entryref.routine, entryref.extension, [], 'shallow')

        // Does label exist?
        if (labelMap[entryref.label] === undefined) {

            // Label not found so use deep search to create more extensive labelMap
            if (entryref.extension === 'cls') labelMap = await getLabelMap(workspaceFolderId, entryref.className, 'cls', [], 'deep')
            else labelMap = await getLabelMap(workspaceFolderId, entryref.routine, entryref.extension, [], 'deep')

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
        const location = await getOffset(workspaceFolderId, labelLocationList, entryref.offset)
        const [fileName, extension, startLineNumber, endLineNumber, error] = location

        if (error !== '') {
            vscode.window.showErrorMessage(error)
        }


        // Open the file in the vscode workspace so the user can see it
        const fileUri = await getFileUri(workspaceFolderId, fileName, extension)
        await vscode.commands.executeCommand('vscode.open', fileUri)
        await vscode.workspace.openTextDocument(fileUri)

        // Go to line in file
        let header = 0
        if (scheme !== 'serenji') {
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


class workspaceItem implements vscode.QuickPickItem {
    label:string
    id:number

    constructor (id:number, label:string) {
        this.id = id
        this.label = label
    }
}


// Pick a workspace top-level folder
async function pickWorkspaceFolder() {

    const pickList:workspaceItem[] = []

    for (let i = 0; i < vscode.workspace.workspaceFolders.length; i++) {
        const name = vscode.workspace.workspaceFolders[i].name 
        const uri = vscode.workspace.workspaceFolders[i].uri
        pickList.push(new workspaceItem(i, name))
    }

    const workspacePick = await vscode.window.showQuickPick(pickList,{ignoreFocusOut:false, placeHolder: 'Locate in which folder?'})

    return workspacePick
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



