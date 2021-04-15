'use strict'

import * as vscode from 'vscode'
import * as commands from './commands'
import { showStatusBarItem, hideStatusBarItem } from './statusBarItem'

// Candidate names:
//  Error Wizard
//  objectscript-location
//  Location
//  Location, Location, Location
//  label plus offset
//  RE/location
//  Location.gjs


// Activate Extension
// This extension is activated when the user invokes the Location command.
// The Location command can be invoked directly from VS Code's Command Palette
// or via the pre-configured keyboard shortcut Ctrl+lo
// When the extension is activated the labelPlusOffset command is registered
export function activate(context: vscode.ExtensionContext) {
    commands.register(context)
    showStatusBarItem('gj::locate')
}


export function deactivate() {
    hideStatusBarItem()
}