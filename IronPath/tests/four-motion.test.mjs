import {strict as assert} from 'node:assert';
import {projectCoopMotion} from '../coop-motion.mjs';
import {createMatch} from '../simulation.mjs';
import {createPlayer} from '../match.mjs';
const p=createPlayer('a',{name:'Alice',gender:'female'},1300,650),q=createPlayer('b',{name:'Bob',gender:'male'}),s=createMatch([p,q],'four-front');
p.direction={x:1,y:1};s.players.a.direction=p.direction;s.enemies=[{kind:'infantry',road:1,x:10,y:580,segment:1,speed:100,hp:10}];const before=structuredClone(s),view=projectCoopMotion(s,.2);
assert.ok(view.players.a.x>1300);assert.ok(view.players.a.y>650);assert.ok(view.enemies[0].x>10);assert.equal(view.enemies[0].y,580);assert.deepEqual(s,before,'visual prediction does not mutate simulation');console.log('Four-player visual prediction respects map bounds and road selection.');
