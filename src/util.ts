import * as vscode from 'vscode'


// Compare two uris.  In some cases this might need to be case insensitive
// Only for use with file, serenji, isfs and similar uri schemes
export function uriEqual(uri1, uri2) {
    if (uri1.scheme !== uri2.scheme) return false
    if (uri1.authority !== uri2.authority) return false
    if (uri1.path !== uri2.path) return false
    return true
}


// Read file and return array of code lines
export async function getCode(workspaceFolderId, fileName, extension) {

    // Open and read file
    const fileUri = getFileUri(workspaceFolderId, fileName, extension)

    try {
        await vscode.workspace.fs.stat(fileUri)
    } catch {
        return []
    }

    const rawData = await vscode.workspace.fs.readFile(fileUri)
    const sourceCode = Buffer.from(rawData).toString()
    const code = sourceCode.split(/\r?\n/)

    // For vscode-objectscript remove header line if MAC, INT or INC
    if (vscode.workspace.workspaceFolders[workspaceFolderId].uri.scheme !=='serenji') {
        if (extension === 'mac') code.shift()
        if (extension === 'int') code.shift()
        if (extension === 'inc') code.shift()
    }   

    return code
}


export function getFileUri(workspaceFolderId, fileName:string, extension:string):vscode.Uri {

    const workspaceUri = vscode.workspace.workspaceFolders[workspaceFolderId].uri
    const scheme = workspaceUri.scheme

    let fileUri:vscode.Uri
    if (scheme === 'serenji') fileUri = workspaceUri.with({path: workspaceUri.path + '/' + fileName + '.' + extension})
    else if (scheme === 'isfs') fileUri = workspaceUri.with({path: workspaceUri.path + fileName + '.' + extension})
    else if (scheme === 'isfs-readonly') fileUri = workspaceUri.with({path: workspaceUri.path + fileName + '.' + extension})
    else fileUri = workspaceUri.with({path: workspaceUri.path + '/src/' + fileName + '.' + extension})

    return fileUri
}


// Remove prefix from string up to delimiter
export function removePrefix(string:string, delimiter:string) {
    const pieces = string.split(delimiter)
    pieces.shift() // Remove first piece
    return pieces.join(delimiter)
}

// Remove suffix from string from last delimiter to end
export function removeSuffix(string:string, delimiter:string) {
    const pieces = string.split(delimiter)
    pieces.pop() // remove last piece
    return pieces.join(delimiter)

}