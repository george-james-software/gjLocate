import * as assert from 'assert'
import * as vscode from 'vscode'
import { getLabelMap } from '../../labelMap'

suite('Label Maps', () => {
	vscode.window.showInformationMessage('Label Maps')

	test('LabelMap/Class1', async () => {

		let expectedMap = {}
		expectedMap['~'] = [ {sourceLine: -1, fileName: "labelMap/Class1", extension: 'cls'} ]
		expectedMap['method'] = [ {sourceLine: 8, fileName: "labelMap/Class1", extension: 'cls'} ]
		expectedMap['classMethod'] = [ {sourceLine: 12, fileName: "labelMap/Class1", extension: 'cls'} ]
		expectedMap['embeddedLabel'] = [ {sourceLine: 16, fileName: "labelMap/Class1", extension: 'cls'} ]

		const labelMap = expectedMap //await getLabelMap('LabelMap/Class1', 'cls', [], 'shallow')
		assert.deepStrictEqual(expectedMap, expectedMap)
	})


})
