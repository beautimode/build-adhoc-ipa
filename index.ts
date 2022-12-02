import * as core from '@actions/core';
import { execSync, spawn } from 'child_process';
import fs from 'fs';

async function main() {
  try {
    let res = '';
    const xcworkspace = core.getInput('xcworkspace');
    const schemes = JSON.parse(core.getInput('schemes')) as string[];
    const manifestPlistBundleIds = JSON.parse(core.getInput('manifestPlistBundleIds')) as string[];
    const manifestPlistImageUrl = core.getInput('manifestPlistImageUrl');
    const manifestPlistIpaUrl = core.getInput('manifestPlistIpaUrl');
    const manifestPlistTitle = core.getInput('manifestPlistTitle');
    const manifestPlistBundleVersion = core.getInput('manifestPlistBundleVersion');
    const manifestPlistTemplate = fs.readFileSync(__dirname + '/manifest.plist').toString();

    const exportOptionsPlistTeamId = core.getInput('exportOptionsPlistTeamId');
    const exportOptionsPlistTemplate = fs.readFileSync(__dirname + '/ExportOptions.plist').toString();

    const exportOptionsPlist = exportOptionsPlistTemplate.replace('exportOptionsPlistTeamId', exportOptionsPlistTeamId);
    fs.writeFileSync(`ExportOptions.plist`, exportOptionsPlist);

    res = execSync(`mkdir -p ${manifestPlistBundleVersion}`).toString();
    console.log(res);
    for (let i = 0; i < schemes.length; i++) {
      const s = schemes[i];
      const appId = manifestPlistBundleIds[i];

      console.log(`${s}: run archiving...`);
      await spawnAsync(`xcodebuild -workspace ${xcworkspace} -scheme ${s} -sdk iphoneos -archivePath ${manifestPlistBundleVersion}/${s}.xcarchive -parallelizeTargets archive`);

      const manifestPlist = manifestPlistTemplate.
        replace('manifestPlistTitle', manifestPlistTitle).
        replace('manifestPlistBundleId', appId).
        replace('manifestPlistBundleVersion', manifestPlistBundleVersion).
        replace('manifestPlistImageUrl', manifestPlistImageUrl).
        replace('manifestPlistTitle', manifestPlistTitle).
        replace('manifestPlistIpaUrl', `${manifestPlistIpaUrl}/${manifestPlistBundleVersion}/${s}.ipa`);
      fs.writeFileSync(`${manifestPlistBundleVersion}/${s}-manifest.plist`, manifestPlist);

      console.log(`${s}: run Ad Hoc IPA export...`);
      await spawnAsync(`xcodebuild -parallelizeTargets -exportArchive -archivePath ${manifestPlistBundleVersion}/${s}.xcarchive -exportOptionsPlist ExportOptions.plist -exportPath ${manifestPlistBundleVersion} -allowProvisioningUpdates`);

      console.log(`${s}: exported successfully!`);
    }
  } catch (error: any) {
    core.setFailed(error.message);
  }
  process.exit(0);
}

function spawnAsync(cmdLine: String) {
  return new Promise<void>((resolve, reject) => {
    const [cmd, ...args] = cmdLine.split(/\s+/);
    const sp = spawn(cmd, args);

    sp.on('message', console.log);

    sp.stdout.on('data', chunk => {
      console.log(chunk.toString());
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