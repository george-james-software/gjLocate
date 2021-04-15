// Status Bar
/* Create status bar object and provide function to write to it */

import * as vscode from 'vscode'


const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 999)

// Show message in status bar
export function showStatusBarItem(message:string) {
    statusBarItem.command = 'gjLocate'
    statusBarItem.tooltip = 'Go to Location'
    statusBarItem.text = message
    statusBarItem.show()
}


// Hide status bar message
export function hideStatusBarItem() {
    statusBarItem.hide()
}
