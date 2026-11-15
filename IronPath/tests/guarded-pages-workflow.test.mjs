import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFile} from 'node:fs/promises';

const workflowUrl=new URL('../../.github/workflows/ironpath-guarded-pages.yml',import.meta.url);

test('historical guarded Pages workflow cannot start automatically on a push',async()=>{
 const yaml=await readFile(workflowUrl,'utf8');
 const header=yaml.split('\npermissions:')[0];
 const triggers=[...header.matchAll(/^  ([a-z_]+):/gm)].map(match=>match[1]);
 assert.deepEqual(triggers,['workflow_dispatch']);
 assert.match(header,/\n      deploy:\n(?:        [^\n]*\n)*?        default: false\n/);
 assert.doesNotMatch(yaml,/github\.event_name == 'push'/);
});

test('every historical guarded Pages deployment step requires manual opt-in on main',async()=>{
 const yaml=await readFile(workflowUrl,'utf8');
 const deploySection=yaml.split('      - name: Configure Pages\n')[1];
 assert.ok(deploySection,'deployment steps must exist');
 const conditions=[...deploySection.matchAll(/^        if: \$\{\{ (.*?) \}\}$/gm)].map(match=>match[1]);
 assert.equal(conditions.length,7,'all deployment and verification steps must remain guarded');
 for(const condition of conditions){
  assert.ok(condition.includes("github.ref == 'refs/heads/main'"));
  assert.ok(condition.includes("github.event_name == 'workflow_dispatch'"));
  assert.ok(condition.includes("vars.IRONPATH_GUARDED_PAGES_ENABLED == 'true'"));
  assert.ok(condition.includes('inputs.deploy == true'));
 }
});
