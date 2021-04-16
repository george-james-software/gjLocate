import * as assert from 'assert'
import * as vscode from 'vscode'
import { decodeInput } from '../../decodeInput'
import { entryReference } from '../../entryReference'

suite('Decode Input', () => {
	vscode.window.showInformationMessage('Decode Input')

	test('Package/Class', () => {
		const entryref = new entryReference
		entryref.routine = 'Package/Class'
		assert.deepStrictEqual(decodeInput("Package.Class"),entryref)
	})

	test('Package.Class.cls', () => {
		const entryref = new entryReference
		entryref.className = 'Package/Class'
		entryref.extension = 'cls'
		assert.deepStrictEqual(decodeInput("Package.Class.cls"),entryref)
	})

	test('Package.Class.CLS', () => {
		const entryref = new entryReference
		entryref.className = 'Package/Class'
		entryref.extension = 'cls'
		assert.deepStrictEqual(decodeInput("Package.Class.CLS"),entryref)
	})

	test('Package.Subpackage.Class.cls', () => {
		const entryref = new entryReference
		entryref.className = 'Package/Subpackage/Class'
		entryref.extension = 'cls'
		assert.deepStrictEqual(decodeInput("Package.Subpackage.Class.cls"),entryref)
	})

	test('^Package.Class', () => {
		const entryref = new entryReference
		entryref.routine = 'Package/Class'
		assert.deepStrictEqual(decodeInput("^Package.Class"),entryref)
	})

	test('method^Package.Class', () => {
		const entryref = new entryReference
		entryref.routine = 'Package/Class'
		entryref.label = 'method'
		assert.deepStrictEqual(decodeInput("method^Package.Class"),entryref)
	})

	test('method+10^Package.Class', () => {
		const entryref = new entryReference
		entryref.routine = 'Package/Class'
		entryref.label = 'method'
		entryref.offset = 10
		assert.deepStrictEqual(decodeInput("method+10^Package.Class"),entryref)
	})

	test('method', () => {
		const entryref = new entryReference
		entryref.label = 'method'
		assert.deepStrictEqual(decodeInput("method"),entryref)
	})

	test('%method', () => {
		const entryref = new entryReference
		entryref.label = '%method'
		assert.deepStrictEqual(decodeInput("%method"),entryref)
	})

	test('%', () => {
		const entryref = new entryReference
		entryref.label = '%'
		assert.deepStrictEqual(decodeInput("%"),entryref)
	})

	test('123', () => {
		const entryref = new entryReference
		entryref.label = '123'
		assert.deepStrictEqual(decodeInput("123"),entryref)
	})

	test('method+123', () => {
		const entryref = new entryReference
		entryref.label = 'method'
		entryref.offset = 123
		assert.deepStrictEqual(decodeInput("method+123"), entryref)
	})

	test('routine.mac', () => {
		const entryref = new entryReference
		entryref.routine = 'routine'
		entryref.extension = 'mac'
		assert.deepStrictEqual(decodeInput("routine.mac"), entryref)
	})

	test('routine.MAC', () => {
		const entryref = new entryReference
		entryref.routine = 'routine'
		entryref.extension = 'mac'
		assert.deepStrictEqual(decodeInput("routine.MAC"), entryref)
	})

	test('routine.routine.mac', () => {
		const entryref = new entryReference
		entryref.routine = 'routine/routine'
		entryref.extension = 'mac'
		assert.deepStrictEqual(decodeInput("routine.routine.mac"), entryref)
	})

	test('routine.inc', () => {
		const entryref = new entryReference
		entryref.routine = 'routine'
		entryref.extension = 'inc'
		assert.deepStrictEqual(decodeInput("routine.inc"), entryref)
	})

	test('routine.int', () => {
		const entryref = new entryReference
		entryref.routine = 'routine'
		entryref.extension = 'int'
		assert.deepStrictEqual(decodeInput("routine.int"), entryref)
	})

	test('^routine', () => {
		const entryref = new entryReference
		entryref.routine = 'routine'
		assert.deepStrictEqual(decodeInput("^routine"), entryref)
	})

	test('label^routine', () => {
		const entryref = new entryReference
		entryref.routine = 'routine'
		entryref.label = 'label'
		assert.deepStrictEqual(decodeInput("label^routine"), entryref)
	})

	test('label+123^routine', () => {
		const entryref = new entryReference
		entryref.routine = 'routine'
		entryref.label = 'label'
		entryref.offset = 123
		assert.deepStrictEqual(decodeInput("label+123^routine"), entryref)
	})

	test('+123^routine', () => {
		const entryref = new entryReference
		entryref.routine = 'routine'
		entryref.offset = 123
		assert.deepStrictEqual(decodeInput("+123^routine"), entryref)
	})

	// <ERRORS>
	test('<UNDEFINED>label+123^routine', () => {
		const entryref = new entryReference
		entryref.routine = 'routine'
		entryref.label = 'label'
		entryref.offset = 123
		entryref.errorCode = '<UNDEFINED>'
		assert.deepStrictEqual(decodeInput("<UNDEFINED>label+123^routine"), entryref)
	})

	test('<METHOD NOT FOUND>label+123^routine', () => {
		const entryref = new entryReference
		entryref.routine = 'routine'
		entryref.label = 'label'
		entryref.offset = 123
		entryref.errorCode = '<METHOD NOT FOUND>'
		assert.deepStrictEqual(decodeInput("<METHOD NOT FOUND>label+123^routine"), entryref)
	})


	test('<ERROR>label+123^routine *extraInfo', () => {
		const entryref = new entryReference
		entryref.routine = 'routine'
		entryref.label = 'label'
		entryref.offset = 123
		entryref.errorCode = '<ERROR>'
		entryref.extraInfo = 'extraInfo'
		assert.deepStrictEqual(decodeInput("<ERROR>label+123^routine *extraInfo"), entryref)
	})


})
