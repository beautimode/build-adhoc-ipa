import * as core from '@actions/core';
import { execSync, spawn } from 'child_process';
import fs from 'fs';

async function main() {
  try {
    let res = '';
    const debugLevel = core.getInput('debugLevel');
    const showInfo = debugLevel == 'info';
    const xcworkspace = core.getInput('xcworkspace');
    const schemes = JSON.parse(core.getInput('schemes')) as string[];
    const manifestPlistBundleIds = JSON.parse(core.getInput('manifestPlistBundleIds')) as string[];
    const manifestPlistImageUrl = core.getInput('manifestPlistImageUrl');
    const manifestPlistIpaUrl = core.getInput('manifestPlistIpaUrl');
    const manifestPlistTitle = core.getInput('manifestPlistTitle');
    const manifestPlistBundleVersion = core.getInput('manifestPlistBundleVersion');
    const APPSTORE_ISSUER_ID = core.getInput('APPSTORE_ISSUER_ID');
    const APPSTORE_API_KEY_ID = core.getInput('APPSTORE_API_KEY_ID');
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
      await spawnAsync(`xcodebuild -workspace ${xcworkspace} -scheme ${s} -sdk iphoneos -archivePath ${manifestPlistBundleVersion}/${s}.xcarchive -parallelizeTargets archive -allowProvisioningUpdates -authenticationKeyIssuerID ${APPSTORE_ISSUER_ID} -authenticationKeyID ${APPSTORE_API_KEY_ID} -authenticationKeyPath ~/AuthKey_${APPSTORE_API_KEY_ID}.p8`, !showInfo);

      const manifestPlist = manifestPlistTemplate.
        replace('manifestPlistTitle', manifestPlistTitle).
        replace('manifestPlistBundleId', appId).
        replace('manifestPlistBundleVersion', manifestPlistBundleVersion).
        replace('manifestPlistImageUrl', manifestPlistImageUrl).
        replace('manifestPlistTitle', manifestPlistTitle).
        replace('manifestPlistIpaUrl', `${manifestPlistIpaUrl}/${manifestPlistBundleVersion}/${s}.ipa`);
      fs.writeFileSync(`${manifestPlistBundleVersion}/${s}-manifest.plist`, manifestPlist);

      console.log(`${s}: run Ad Hoc IPA export...`);
      await spawnAsync(`xcodebuild -parallelizeTargets -exportArchive -archivePath ${manifestPlistBundleVersion}/${s}.xcarchive -exportOptionsPlist ExportOptions.plist -exportPath ${manifestPlistBundleVersion} -allowProvisioningUpdates`, !showInfo);

      console.log(`${s}: exported successfully!`);
    }
  } catch (error: any) {
    core.setFailed(error.message);
  }
}

function spawnAsync(cmdLine: String, log: boolean) {
  return new Promise<void>((resolve, reject) => {
    const [cmd, ...args] = cmdLine.split(/\s+/);
    const sp = spawn(cmd, args);

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