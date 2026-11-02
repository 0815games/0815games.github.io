import {strict as assert} from 'node:assert';
import {createBattleSound} from '../battle-sound.mjs';
let created=0,played=0,instance;
class Audio{constructor(){created++;instance=this;this.state='suspended';this.currentTime=0;this.destination={};}async resume(){this.state='running';}createOscillator(){return {frequency:{},connect(){},start(){played++;},stop(){}};}createGain(){return {gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){}};}}
const sound=createBattleSound(Audio);sound.play('request');assert.equal(created,0,'audio is opt-in and cannot autoplay');assert.equal(await sound.setEnabled(true),true);
sound.play('request');sound.play('request');assert.equal(played,2,'duplicate cues are rate limited');instance.currentTime=.31;sound.play('request');assert.equal(played,4);
for(const cue of ['wave','build','upgrade','ability','reconnect','combo','warning'])sound.play(cue);assert.equal(played,18);await sound.setEnabled(false);sound.play('wave');assert.equal(played,18,'muted sound stays quiet');
const unavailable=createBattleSound(null);assert.equal(await unavailable.setEnabled(true),false);
console.log('Opt-in audio, new field cues and rate limiting passed.');
