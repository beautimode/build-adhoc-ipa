"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const child_process_1 = require("child_process");
const fs_1 = __importDefault(require("fs"));
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let res = '';
            const debugLevel = core.getInput('debugLevel');
            const showInfo = debugLevel == 'info';
            const xcworkspace = core.getInput('xcworkspace');
            const schemes = JSON.parse(core.getInput('schemes'));
            const manifestPlistBundleIds = JSON.parse(core.getInput('manifestPlistBundleIds'));
            const manifestPlistImageUrl = core.getInput('manifestPlistImageUrl');
            const manifestPlistIpaUrl = core.getInput('manifestPlistIpaUrl');
            const manifestPlistTitle = core.getInput('manifestPlistTitle');
            const manifestPlistBundleVersion = core.getInput('manifestPlistBundleVersion');
            const manifestPlistTemplate = fs_1.default.readFileSync(__dirname + '/manifest.plist').toString();
            const exportOptionsPlistTeamId = core.getInput('exportOptionsPlistTeamId');
            const exportOptionsPlistTemplate = fs_1.default.readFileSync(__dirname + '/ExportOptions.plist').toString();
            const exportOptionsPlist = exportOptionsPlistTemplate.replace('exportOptionsPlistTeamId', exportOptionsPlistTeamId);
            fs_1.default.writeFileSync(`ExportOptions.plist`, exportOptionsPlist);
            res = (0, child_process_1.execSync)(`mkdir -p ${manifestPlistBundleVersion}`).toString();
            console.log(res);
            for (let i = 0; i < schemes.length; i++) {
                const s = schemes[i];
                const appId = manifestPlistBundleIds[i];
                console.log(`${s}: run archiving...`);
                yield spawnAsync(`xcodebuild -workspace ${xcworkspace} -scheme ${s} -sdk iphoneos -archivePath ${manifestPlistBundleVersion}/${s}.xcarchive -parallelizeTargets archive`, !showInfo);
                const manifestPlist = manifestPlistTemplate.
                    replace('manifestPlistTitle', manifestPlistTitle).
                    replace('manifestPlistBundleId', appId).
                    replace('manifestPlistBundleVersion', manifestPlistBundleVersion).
                    replace('manifestPlistImageUrl', manifestPlistImageUrl).
                    replace('manifestPlistTitle', manifestPlistTitle).
                    replace('manifestPlistIpaUrl', `${manifestPlistIpaUrl}/${manifestPlistBundleVersion}/${s}.ipa`);
                fs_1.default.writeFileSync(`${manifestPlistBundleVersion}/${s}-manifest.plist`, manifestPlist);
                console.log(`${s}: run Ad Hoc IPA export...`);
                yield spawnAsync(`xcodebuild -parallelizeTargets -exportArchive -archivePath ${manifestPlistBundleVersion}/${s}.xcarchive -exportOptionsPlist ExportOptions.plist -exportPath ${manifestPlistBundleVersion} -allowProvisioningUpdates`, !showInfo);
                console.log(`${s}: exported successfully!`);
            }
        }
        catch (error) {
            core.setFailed(error.message);
        }
        process.exit(0);
    });
}
function spawnAsync(cmdLine, log) {
    return new Promise((resolve, reject) => {
        const [cmd, ...args] = cmdLine.split(/\s+/);
        const sp = (0, child_process_1.spawn)(cmd, args);
        log && sp.on('message', console.log);
        sp.stdout.on('data', chunk => {
            log && console.log(chunk.toString());
        });
        sp.stderr.on('data', chunk => {
            console.error(chunk.toString());
        });
        sp.on('close', code => {
            if ((code || 0) > 0) {
                return reject(new Error(`${cmdLine} failed!`));
            }
            resolve();
        });
        sp.on('error', err => {
            reject(err);
        });
    });
}
main();
