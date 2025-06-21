import { MFPClient } from 'myfitnesspal';
import { test } from 'node:test';
import assert from "node:assert/strict";

test('login works', async () => {
	const client = new MFPClient(process.env.EMAIL, process.env.PASSWORD);
	await client.initialLoad();
	assert.ok(client.AccessToken.access_token);
});

test('login with invalid credentials fails', async () => {
	const client = new MFPClient("", "");
	assert.rejects(async () => {
		await client.initialLoad();
	});
});