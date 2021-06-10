'use strict'

import * as vscode from 'vscode'
import * as commands from './commands'
import { showStatusBarItem, hideStatusBarItem } from './statusBarItem'


// Activate Extension
export function activate(context: vscode.ExtensionContext) {
    commands.register(context)
    showStatusBarItem('gj::locate')
}


export function deactivate() {
    hideStatusBarItem()
}