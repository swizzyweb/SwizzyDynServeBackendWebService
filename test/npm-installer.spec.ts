import {npmLinkInstall} from '../src/npm-installer';
import { describe, expect, test } from '@jest/globals';

describe('npm-installer tests', () => {
    test('adds 1 + 2 to equal 3', async () => {
        const res = await npmLinkInstall({packageName: 'my-first-web-service'});
        expect(res.success).toBe(true);
    }, 20000);
});

