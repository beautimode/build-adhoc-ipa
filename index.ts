import * as core from '@actions/core';
import { execSync } from 'child_process';
import fs from 'fs';

try {
  const xcworkspace = core.getInput('xcworkspace');
  const schemes = JSON.parse(core.getInput('schemes')) as string[];
  const manifestPlistImageUrl = core.getInput('manifestPlistImageUrl');
  const manifestPlistIpaUrl = core.getInput('manifestPlistIpaUrl');
  const manifestPlistTitle = core.getInput('manifestPlistTitle');
  const manifestPlistBundleId = core.getInput('manifestPlistBundleId');
  const manifestPlistBundleVersion = core.getInput('manifestPlistBundleVersion');
  const manifestPlistTemplate = fs.readFileSync(__dirname + '/manifest.plist').toString();

  const exportOptionsPlistTeamId = core.getInput('exportOptionsPlistTeamId');
  const exportOptionsPlistTemplate = fs.readFileSync(__dirname +'/ExportOptions.plist').toString();

  const exportOptionsPlist = exportOptionsPlistTemplate.replace('exportOptionsPlistTeamId', exportOptionsPlistTeamId);
  fs.writeFileSync(`ExportOptions.plist`, exportOptionsPlist);

  execSync(`mkdir -p ${manifestPlistBundleVersion}`);
  schemes.forEach((s) => {
    console.log(`${s}: run archiving...`);
    execSync(`xcodebuild -workspace ${xcworkspace} -scheme ${s} -configuration Debug -sdk iphoneos -archivePath ${manifestPlistBundleVersion}/${s}.xcarchive -parallelizeTargets archive`, { stdio: 'ignore' });

    const manifestPlist = manifestPlistTemplate.
    replace('manifestPlistTitle', manifestPlistTitle).
    replace('manifestPlistBundleId', manifestPlistBundleId).
    replace('manifestPlistBundleVersion', manifestPlistBundleVersion).
    replace('manifestPlistImageUrl', manifestPlistImageUrl).
    replace('manifestPlistTitle', manifestPlistTitle).
    replace('manifestPlistIpaUrl', `${manifestPlistIpaUrl}/${manifestPlistBundleVersion}/${s}.ipa`);
    fs.writeFileSync(`${manifestPlistBundleVersion}/${s}-manifest.plist`, manifestPlist);

    console.log(`${s}: run Ad Hoc IPA export...`);
    execSync(`xcodebuild -parallelizeTargets -exportArchive -archivePath ${manifestPlistBundleVersion}/${s}.xcarchive -exportOptionsPlist ExportOptions.plist -exportPath ${s} -allowProvisioningUpdates`, { stdio: 'ignore' });

    console.log(`${s}: exported successfully!`);
  });
} catch (error: any) {
  core.setFailed(error.message);
}
