"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const npm_installer_1 = require("../src/npm-installer");
const globals_1 = require("@jest/globals");
(0, globals_1.describe)('npm-installer tests', () => {
    (0, globals_1.test)('adds 1 + 2 to equal 3', () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield (0, npm_installer_1.npmLinkInstall)({ packageName: 'my-first-web-service' });
        (0, globals_1.expect)(res.success).toBe(true);
    }), 20000);
});
