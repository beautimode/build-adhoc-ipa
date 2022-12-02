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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const child_process_1 = require("child_process");
const fs_1 = __importDefault(require("fs"));
try {
    const xcworkspace = core.getInput('xcworkspace');
    const schemes = JSON.parse(core.getInput('schemes'));
    const manifestPlistImageUrl = core.getInput('manifestPlistImageUrl');
    const manifestPlistIpaUrl = core.getInput('manifestPlistIpaUrl');
    const manifestPlistTitle = core.getInput('manifestPlistTitle');
    const manifestPlistBundleId = core.getInput('manifestPlistBundleId');
    const manifestPlistBundleVersion = core.getInput('manifestPlistBundleVersion');
    const manifestPlistTemplate = fs_1.default.readFileSync('manifest.plist').toString();
    const exportOptionsPlistTeamId = core.getInput('exportOptionsPlistTeamId');
    const exportOptionsPlistTemplate = fs_1.default.readFileSync('ExportOptions.plist').toString();
    const exportOptionsPlist = exportOptionsPlistTemplate.replace('exportOptionsPlistTeamId', exportOptionsPlistTeamId);
    fs_1.default.writeFileSync(`ExportOptions.plist`, exportOptionsPlist);
    (0, child_process_1.execSync)(`mkdir -p ${manifestPlistBundleVersion}`);
    schemes.forEach((s) => {
        console.log(`${s}: run archiving...`);
        (0, child_process_1.execSync)(`xcodebuild -workspace ${xcworkspace} -scheme ${s} -configuration Debug -sdk iphoneos -archivePath ${manifestPlistBundleVersion}/${s}.xcarchive -parallelizeTargets archive`);
        const manifestPlist = manifestPlistTemplate.
            replace('manifestPlistTitle', manifestPlistTitle).
            replace('manifestPlistBundleId', manifestPlistBundleId).
            replace('manifestPlistBundleVersion', manifestPlistBundleVersion).
            replace('manifestPlistImageUrl', manifestPlistImageUrl).
            replace('manifestPlistTitle', manifestPlistTitle).
            replace('manifestPlistIpaUrl', `${manifestPlistIpaUrl}/${manifestPlistBundleVersion}/${s}.ipa`);
        fs_1.default.writeFileSync(`${manifestPlistBundleVersion}/${s}-manifest.plist`, manifestPlist);
        console.log(`${s}: run Ad Hoc IPA export...`);
        (0, child_process_1.execSync)(`xcodebuild -parallelizeTargets -exportArchive -archivePath ${manifestPlistBundleVersion}/${s}.xcarchive -exportOptionsPlist ExportOptions.plist -exportPath ${s} -allowProvisioningUpdates`);
        console.log(`${s}: exported successfully!`);
    });
}
catch (error) {
    core.setFailed(error.message);
}
