"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = __importDefault(require("@actions/core"));
const child_process_1 = require("child_process");
const fs_1 = __importDefault(require("fs"));
try {
    const xcworkspace = core_1.default.getInput('xcworkspace');
    const schemes = JSON.parse(core_1.default.getInput('schemes'));
    const manifestPlistImageUrl = core_1.default.getInput('manifestPlistImageUrl');
    const manifestPlistIpaUrl = core_1.default.getInput('manifestPlistIpaUrl');
    const manifestPlistTitle = core_1.default.getInput('manifestPlistTitle');
    const manifestPlistBundleId = core_1.default.getInput('manifestPlistBundleId');
    const manifestPlistBundleVersion = core_1.default.getInput('manifestPlistBundleVersion');
    const manifestPlistTemplate = fs_1.default.readFileSync('manifest.plist').toString();
    const exportOptionsPlistTeamId = core_1.default.getInput('exportOptionsPlistTeamId');
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
    core_1.default.setFailed(error.message);
}
