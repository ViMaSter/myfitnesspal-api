class Key {
	constructor({ kty, use, kid, k, alg }) {
		this.kty = kty;
		this.use = use;
		this.kid = kid;
		this.k = k;
		this.alg = alg;
	}
}

class Timestamps {
	constructor({ CREATED }) {
		this.CREATED = new Date(CREATED);
	}
}

class ClientKeys {
	constructor({ key, clientId, keyId, timestamps }) {
		this.key = new Key(key);
		this.clientId = clientId;
		this.keyId = keyId;
		this.timestamps = new Timestamps(timestamps);
	}
}

class Embedded {
	constructor({ clientKeys }) {
		this.clientKeys = clientKeys.map(k => new ClientKeys(k));
	}
}

class ClientKey {
	constructor({ href }) {
		this.href = href;
	}
}

class Links {
	constructor({ clientKey }) {
		this.clientKey = clientKey.map(l => new ClientKey(l));
	}
}

class ClientKeyResponse {
	constructor({ _embedded, _links }) {
		this._embedded = new Embedded(_embedded);
		this._links = new Links(_links);
	}
}

class AccessTokenResponse {
	constructor({ access_token, token_type, expires_in }) {
		this.access_token = access_token;
		this.token_type = token_type;
		this.expires_in = expires_in;
	}
}

class TokenResponse {
	constructor({ access_token, refresh_token, data, id_token, token_type, expires_in }) {
		this.access_token = access_token;
		this.refresh_token = refresh_token;
		this.data = data;
		this.id_token = id_token;
		this.token_type = token_type;
		this.expires_in = expires_in;
	}
}

class UserIDResponse {
	constructor(obj) {
		Object.assign(this, obj);
		// Convert date strings to Date objects where appropriate
		if (obj.ggUserDataUpdated) this.ggUserDataUpdated = new Date(obj.ggUserDataUpdated);
		if (obj.user_changed_password_at) this.user_changed_password_at = new Date(obj.user_changed_password_at);
		if (obj.timestamps && obj.timestamps.CREATED) this.timestamps = { CREATED: new Date(obj.timestamps.CREATED) };
		if (obj.profile && obj.profile.ggUserDataUpdated) this.profile.ggUserDataUpdated = new Date(obj.profile.ggUserDataUpdated);
		if (obj.accountLinks) {
			this.accountLinks = obj.accountLinks.map(link => {
				if (link.ad_consents_last_seen) link.ad_consents_last_seen = new Date(link.ad_consents_last_seen);
				return link;
			});
		}
		if (obj.profileEmails && obj.profileEmails.emails) {
			this.profileEmails.emails = obj.profileEmails.emails.map(email => {
				if (email.ggUserDataUpdated) email.ggUserDataUpdated = new Date(email.ggUserDataUpdated);
				if (email.timestamps && email.timestamps.CREATED) email.timestamps.CREATED = new Date(email.timestamps.CREATED);
				if (email.timestamps && email.timestamps.UPDATED) email.timestamps.UPDATED = new Date(email.timestamps.UPDATED);
				return email;
			});
		}
	}
}
