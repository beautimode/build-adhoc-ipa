import * as core from '@actions/core';
import { execSync, spawn } from 'child_process';
import fs from 'fs';

async function main() {
  try {
    let res = '';
    const xcworkspace = core.getInput('xcworkspace');
    const schemes = JSON.parse(core.getInput('schemes')) as string[];
    const manifestPlistImageUrl = core.getInput('manifestPlistImageUrl');
    const manifestPlistIpaUrl = core.getInput('manifestPlistIpaUrl');
    const manifestPlistTitle = core.getInput('manifestPlistTitle');
    const manifestPlistBundleId = core.getInput('manifestPlistBundleId');
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

      console.log(`${s}: run archiving...`);
      await spawnAsync(`xcodebuild -workspace ${xcworkspace} -scheme ${s} -sdk iphoneos -archivePath ${manifestPlistBundleVersion}/${s}.xcarchive -parallelizeTargets archive`);

      const manifestPlist = manifestPlistTemplate.
        replace('manifestPlistTitle', manifestPlistTitle).
        replace('manifestPlistBundleId', manifestPlistBundleId).
        replace('manifestPlistBundleVersion', manifestPlistBundleVersion).
        replace('manifestPlistImageUrl', manifestPlistImageUrl).
        replace('manifestPlistTitle', manifestPlistTitle).
        replace('manifestPlistIpaUrl', `${manifestPlistIpaUrl}/${manifestPlistBundleVersion}/${s}.ipa`);
      fs.writeFileSync(`${manifestPlistBundleVersion}/${s}-manifest.plist`, manifestPlist);

      console.log(`${s}: run Ad Hoc IPA export...`);
      await spawnAsync(`xcodebuild -parallelizeTargets -exportArchive -archivePath ${manifestPlistBundleVersion}/${s}.xcarchive -exportOptionsPlist ExportOptions.plist -exportPath ${s} -allowProvisioningUpdates`);

      console.log(`${s}: exported successfully!`);
    }
  } catch (error: any) {
    core.setFailed(error.message);
  }
  process.exit(0);
}

function spawnAsync(cmdLine: String) {
  return new Promise((resolve, reject) => {
    const [cmd, ...args] = cmdLine.split(/\s+/);
    const sp = spawn(cmd, args);

    sp.on('message', console.log);

    let data = '';
    sp.stdout.on('data', chunk => {
      data += chunk.toString();
    });

    let errData = '';
    sp.stderr.on('data', chunk => {
      errData += chunk.toString();
    });

    sp.on('close', code => {
      if ((code || 0) > 0) {
        return reject(new Error(`${cmdLine} error:\n${errData}`));
      }

      resolve(data);
    });

    sp.on('error', err => {
      reject(err);
    });
  });
}

main();