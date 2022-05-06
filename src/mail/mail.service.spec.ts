import { Test } from "@nestjs/testing";
import { CONFIG_OPTIONS } from "src/common/common.constants";
import { MailService } from "./mail.service";
import got from 'got';
import * as FormData from 'form-data';

const TEST_OPTIONS = {
	apiKey: 'test-apikey',
	domain: 'test-domain',
	from: 'test-from',
};

jest.mock('got');
jest.mock('form-data');

describe("MailService", () => {
	let service: MailService;

	beforeEach(async () => {
		const module = await Test.createTestingModule({
			providers: [MailService, {
				provide: CONFIG_OPTIONS,
				useValue: TEST_OPTIONS
			}],
		}).compile();
		service = module.get<MailService>(MailService);
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('sendVerificationEmail', () => {
		it('should be called sendEmail', () => {
			const sendVerificationEmailInput = {
				email: 'fake@email.com',
				code: 'fakeCode'
			};
			jest.spyOn(service, 'sendEmail').mockImplementation(async () => true);

			service.sendVerificationEmail(
				sendVerificationEmailInput.email, 
				sendVerificationEmailInput.code
			);
			expect(service.sendEmail).toHaveBeenCalledTimes(1);
			expect(service.sendEmail).toHaveBeenCalledWith("Verify Your Email", [
				{ key: 'username', value: sendVerificationEmailInput.email },
				{ key: 'code', value: sendVerificationEmailInput.code },
			]);
		});
	});

	describe('sendEmail', () => {
		it('should be sent email', async () => {
			const formSpy = jest.spyOn(FormData.prototype, 'append');

			const result = await service.sendEmail("Verify Your Email", [
				{ key: 'username', value: 'fake@email.com' },
				{ key: 'code', value: 'fakeCode' },
			]);
			expect(formSpy).toHaveBeenCalledTimes(4);
			expect(got.post).toHaveBeenCalledTimes(1);
			expect(got.post).toHaveBeenCalledWith(
				`https://api.mailgun.net/v3/${TEST_OPTIONS.domain}/messages`
				, expect.any(Object)
			);
			expect(result).toEqual(true);
		});

		it('should return false on error', async () => {
			jest.spyOn(got, 'post').mockImplementation(() => { throw new Error(); });

			const result = await service.sendEmail("Verify Your Email", [
				{ key: 'username', value: 'fake@email.com' },
				{ key: 'code', value: 'fakeCode' },
			]);
			expect(result).toEqual(false);
		});
	});
});