export interface MailModuleOptions {
	apiKey: string;
	domain: string;
	from: string;
}

export interface EmailVariable {
	key: string;
	value: string;
}