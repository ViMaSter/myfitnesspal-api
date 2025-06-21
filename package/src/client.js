// client.js
import jwt from 'jsonwebtoken';
import constants from './constants.js';

export class MFPClient {
	constructor(username, password) {
		this.AuthSignKey = null;
		this.ClientKeys = null;
		this.AccessToken = null;
		this.IDTokenResponse = null;
		this.Username = username;
		this.Password = password;
		this.JWT = null;
		this.MFPCallbackCode = null;
		this.MFPUserID = null;
		this.UserID = null;
	}

	async doRequest(url, config) {
		try {
			const responseRaw = await fetch(url, config);
			const data = await responseRaw.json().catch(() => ({}));
			const headers = {};
			responseRaw.headers.forEach((value, key) => { headers[key] = value; });
			const response = {
				data,
				headers,
				status: responseRaw.status
			};
			return { data: response.data, headers: response.headers, status: response.status };
		} catch (err) {
			throw new Error('request failed');
		}
	}

	async getClientKeys() {
		const encodedAuth = Buffer.from(`${constants.ClientID}:${constants.ClientSecret}`).toString('base64');
		const url = `https://${constants.IdentityBaseURL}/clientKeys`;
		const config = {
			method: 'GET',
			headers: {
				'Authorization': `Basic ${encodedAuth}`,
				'Accept': 'application/json',
				'Content-Type': 'application/json',
				'User-Agent': constants.UserAgent
			}
		};
		let response;
		try {
			response = await this.doRequest(url, config);
		} catch (err) {
			throw new Error(`Couldn't fetch clientkeys\tstatus code: ${err.status}\t error: ${err.message}`);
		}
		this.ClientKeys = response.data;
		this.AuthSignKey = Buffer.from(this.ClientKeys._embedded.clientKeys[1].key.k, 'base64');
	}

	async getAccessToken() {
		const url = `https://${constants.IdentityBaseURL}/oauth/token`;
		const body = `client_id=${constants.ClientID}&client_secret=${constants.ClientSecret}&grant_type=client_credentials`;
		const config = {
			method: 'POST',
			headers: {
				'Accept-Encoding': 'gzip',
				'Connection': 'Keep-Alive',
				'Content-Type': 'application/x-www-form-urlencoded',
				'User-Agent': constants.UserAgent
			},
			body: body
		};
		const urlWithParams = url; // fetch uses url directly
		let response;
		try {
			response = await this.doRequest(urlWithParams, config);
		} catch (err) {
			throw new Error(`Couldn't get access tokens\tstatus code: ${err.status}\t error: ${err.message}`);
		}
		this.AccessToken = response.data;
	}

	generateHS512Token(claims, claimHeader, secret) {
		const header = {
			alg: claimHeader.alg,
			kid: claimHeader.kid
		};
		const token = jwt.sign(claims, secret, {
			algorithm: 'HS512',
			header: header
		});
		return token;
	}

	getRandomNum(min, max) {
		return Math.floor(Math.random() * (max - min + 1)) + min;
	}

	async login() {
		const claims = {
			password: this.Password,
			username: this.Username
		};
		const claimHeader = {
			kid: this.ClientKeys._embedded.clientKeys[1].key.kid,
			alg: this.ClientKeys._embedded.clientKeys[1].key.alg
		};
		this.JWT = this.generateHS512Token(claims, claimHeader, this.AuthSignKey);

		const randNum = this.getRandomNum(100000000, 586550506);
		const bodyString = `client_id=${constants.ClientID}&credentials=${this.JWT}&nonce=${randNum}&redirect_uri=mfp%3A%2F%2Fidentity%2Fcallback&response_type=code&scope=openid`;
		const url = `https://${constants.IdentityBaseURL}/oauth/authorize`;
		const config = {
			method: 'POST',
			headers: {
				'User-Agent': constants.UserAgent,
				'Connection': 'Keep-Alive',
				'Content-Type': 'application/x-www-form-urlencoded',
				'Content-Length': bodyString.length.toString()
			},
			body: bodyString,
			redirect: 'manual' // Don't follow redirects, so we can read the Location header
		};

		let response;
		try {
			response = await this.doRequest(url, config);
		} catch (err) {
			throw new Error(`Login failed\tstatus code: ${err.status}\t error: ${err.message}`);
		}

		const location = response.headers['location'];
		const result = location.split(constants.CallbackURL);
		this.MFPCallbackCode = result[1];
		try {
			if (!this.MFPCallbackCode) {
				throw new Error('No callback code received');
			}
			await this.loginCallBack();
		} catch (err) {
			throw new Error('sending callbackcode failed:' + err.message);
		}
	}

	async loginCallBack() {
		const bodyString = `grant_type=authorization_code&code=${this.MFPCallbackCode}&redirect_uri=mfp%3A%2F%2Fidentity%2Fcallback`;
		const url = `https://${constants.IdentityBaseURL}/oauth/token?auto_create_account_link=false`;
		const config = {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				'Content-Length': bodyString.length.toString(),
				'Connection': 'Keep-Alive',
				'Authorization': `Bearer ${this.AccessToken.access_token}`,
				'User-Agent': constants.UserAgent
			},
			body: bodyString
		};
		let response;
		try {
			response = await this.doRequest(url, config);
		} catch (err) {
			throw new Error(`Sending callbackcode failed\tstatus code: ${err.status}\t error: ${err.message}`);
		}
		this.IDTokenResponse = response.data;
	}

	async initialLoad() {
		await this.getClientKeys();
		await this.getAccessToken();
		await this.login();
		console.log('Using mode without authentication');
	}
}